import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "description este necesar" });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Esti nutritionist expert. Utilizatorul descrie ce a mancat in cuvinte simple.
Descriere: "${description}"

Raspunde DOAR cu JSON compact, fara text in afara:
{"name":"nume scurt descriptiv al mesei","kcal":320,"protein":18,"carbs":12,"fat":14,"items":[{"name":"ou fiert","qty":"2 buc","kcal":155},{"name":"rosie","qty":"2 buc medii (~200g)","kcal":36}]}

Reguli:
- name: rezumat scurt al mesei (max 5 cuvinte)
- kcal/protein/carbs/fat: totaluri realiste pentru cantitatile descrise
- items: fiecare ingredient separat cu cantitate estimata
- Daca descrierea nu e mancare: {"error":"Nu am recunoscut mancare in descriere"}`
      }]
    });

    const raw = message.content[0].text;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Raspuns invalid de la AI" });
    return res.json(JSON.parse(match[0]));
  } catch (error) {
    console.error("estimate-text error:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
}
