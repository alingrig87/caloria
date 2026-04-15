import Anthropic from "@anthropic-ai/sdk";
import { foodDb } from "./food-db.js";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

// Remove Romanian diacritics and normalize to lowercase
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[îÎ]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/ț/g, "t")
    .replace(/[éèê]/g, "e")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Parse description into a list of {term, grams} pairs
// Patterns: "200g piept de pui", "piept de pui 200g", "2 oua", "o banana"
function parseItems(description) {
  const text = description.trim();
  const results = [];

  // Split by common conjunctions / list separators
  const segments = text.split(/,|;|\bsi\b|\bcu\b|\+/i);

  for (const segment of segments) {
    const seg = segment.trim();
    if (!seg) continue;

    // Try to extract quantity in grams: "200g", "200 g", "200gr", "200 grame"
    const gramMatch = seg.match(/(\d+(?:[.,]\d+)?)\s*(?:g(?:r(?:ame?)?)?)\b/i);
    // Try to extract quantity in ml: "200ml", "200 ml"
    const mlMatch = seg.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
    // Try to extract piece count: "2 oua", "3 bucati", "o "
    const pieceMatch = seg.match(/^(\d+|o|un|una)\s+/i);

    let grams = null;
    let term = seg;

    if (gramMatch) {
      grams = parseFloat(gramMatch[1].replace(",", "."));
      term = seg.replace(gramMatch[0], "").trim();
    } else if (mlMatch) {
      // Treat ml as grams (approximate for liquids)
      grams = parseFloat(mlMatch[1].replace(",", "."));
      term = seg.replace(mlMatch[0], "").trim();
    } else if (pieceMatch) {
      const countStr = pieceMatch[1].toLowerCase();
      const count = countStr === "o" || countStr === "un" || countStr === "una" ? 1 : parseInt(countStr, 10);
      term = seg.replace(pieceMatch[0], "").trim();
      // Default gram estimate per piece for common items; will be refined by DB match
      grams = count * 100; // fallback: 100g per piece
    }

    // Also check if quantity appears at end: "piept de pui 200g"
    if (!gramMatch && !mlMatch) {
      const trailingGram = seg.match(/(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:g(?:r(?:ame?)?)?)\b/i);
      if (trailingGram) {
        term = trailingGram[1].trim();
        grams = parseFloat(trailingGram[2].replace(",", "."));
      }
    }

    if (term) {
      results.push({ term, grams });
    }
  }

  return results;
}

// Search local DB for a term; returns best match or null
function searchDb(term) {
  const normTerm = normalize(term);
  // Exact or substring match
  for (const item of foodDb) {
    const normName = normalize(item.name);
    if (normName === normTerm || normName.includes(normTerm) || normTerm.includes(normName)) {
      return item;
    }
  }
  // Word-level partial match: all words in term appear in item name
  const termWords = normTerm.split(/\s+/).filter(w => w.length > 2);
  if (termWords.length > 0) {
    for (const item of foodDb) {
      const normName = normalize(item.name);
      if (termWords.every(w => normName.includes(w))) {
        return item;
      }
    }
  }
  return null;
}

// Scale per-100g nutritional values to the given gram quantity
function scale(item, grams) {
  const factor = grams / 100;
  return {
    name: item.name,
    grams,
    kcal: Math.round(item.kcal * factor),
    protein: Math.round(item.protein * factor * 10) / 10,
    fat: Math.round(item.fat * factor * 10) / 10,
    carbs: Math.round(item.carbs * factor * 10) / 10,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "description este necesar" });

  try {
    const parsedItems = parseItems(description);
    const dbItems = [];
    const missingItems = []; // items not found in DB

    for (const { term, grams } of parsedItems) {
      const match = searchDb(term);
      if (match) {
        const qty = grams !== null ? grams : 100;
        dbItems.push({ ...scale(match, qty), qty: `${qty}g` });
      } else {
        missingItems.push({ term, grams });
      }
    }

    // If nothing was parsed at all, treat entire description as AI input
    const needsAI = missingItems.length > 0 || (parsedItems.length === 0);

    let aiItems = [];
    let aiTotals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

    if (needsAI) {
      let aiInput;
      if (parsedItems.length === 0) {
        // No structured parsing succeeded — send full description to AI
        aiInput = description;
      } else {
        // Build description of only the missing items
        aiInput = missingItems
          .map(({ term, grams }) => grams ? `${grams}g ${term}` : term)
          .join(", ");
      }

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: `Esti nutritionist expert. The following items were not found in the local database. Estimate their nutritional values per the quantities mentioned.

Items: "${aiInput}"

Raspunde DOAR cu JSON compact, fara text in afara:
{"name":"nume scurt descriptiv al mesei","kcal":320,"protein":18,"carbs":12,"fat":14,"items":[{"name":"ou fiert","qty":"2 buc","kcal":155,"protein":12,"fat":10,"carbs":1}]}

Reguli:
- name: rezumat scurt al mesei (max 5 cuvinte)
- kcal/protein/carbs/fat: totaluri realiste pentru cantitatile descrise
- items: fiecare ingredient separat cu cantitate estimata si macro-uri
- Daca descrierea nu e mancare: {"error":"Nu am recunoscut mancare in descriere"}`
        }]
      });

      const raw = message.content[0].text;
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return res.status(500).json({ error: "Raspuns invalid de la AI" });
      const aiResult = JSON.parse(match[0]);

      if (aiResult.error) {
        if (dbItems.length === 0) return res.json(aiResult);
        // Otherwise ignore AI error and continue with DB items only
      } else {
        aiItems = aiResult.items || [];
        aiTotals = {
          kcal: aiResult.kcal || 0,
          protein: aiResult.protein || 0,
          fat: aiResult.fat || 0,
          carbs: aiResult.carbs || 0,
        };
      }
    }

    // If we only used AI (no DB items), return AI result directly with consistent format
    if (dbItems.length === 0 && parsedItems.length === 0) {
      // Re-fetch AI result — already handled above; aiTotals and aiItems are set
      const allItems = aiItems.map(i => ({
        name: i.name,
        qty: i.qty,
        kcal: i.kcal,
        protein: i.protein,
        fat: i.fat,
        carbs: i.carbs,
      }));
      return res.json({
        name: aiItems.length > 0 ? description.slice(0, 40) : description,
        kcal: aiTotals.kcal,
        protein: aiTotals.protein,
        fat: aiTotals.fat,
        carbs: aiTotals.carbs,
        items: allItems,
      });
    }

    // Combine DB items + AI items
    const dbTotals = dbItems.reduce(
      (acc, i) => ({
        kcal: acc.kcal + i.kcal,
        protein: acc.protein + i.protein,
        fat: acc.fat + i.fat,
        carbs: acc.carbs + i.carbs,
      }),
      { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    );

    const totalKcal = Math.round(dbTotals.kcal + aiTotals.kcal);
    const totalProtein = Math.round((dbTotals.protein + aiTotals.protein) * 10) / 10;
    const totalFat = Math.round((dbTotals.fat + aiTotals.fat) * 10) / 10;
    const totalCarbs = Math.round((dbTotals.carbs + aiTotals.carbs) * 10) / 10;

    const combinedItems = [
      ...dbItems.map(i => ({ name: i.name, qty: i.qty, kcal: i.kcal, protein: i.protein, fat: i.fat, carbs: i.carbs })),
      ...aiItems.map(i => ({ name: i.name, qty: i.qty, kcal: i.kcal, protein: i.protein, fat: i.fat, carbs: i.carbs })),
    ];

    return res.json({
      name: description.slice(0, 40),
      kcal: totalKcal,
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
      items: combinedItems,
    });

  } catch (error) {
    console.error("estimate-text error:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
}
