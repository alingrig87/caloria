import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { description, weightKg } = req.body;
  if (!description) return res.status(400).json({ error: "description este necesar" });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Esti expert fitness si nutritie. Utilizatorul descrie o activitate fizica.
Descriere: "${description}"
Greutatea utilizatorului: ${weightKg || 70}kg

Raspunde DOAR cu JSON compact, fara text in afara:
{"name":"Alergare","duration":"30 min","caloriesBurned":280,"type":"cardio"}

Reguli:
- name: denumire scurta a activitatii (max 3 cuvinte)
- duration: durata din descriere (ex: "30 min", "1 ora")
- caloriesBurned: calorii arse estimat pentru greutatea data (numar intreg)
- type: "cardio" | "strength" | "flexibility" | "other"
- Daca nu e activitate fizica: {"error":"Nu am recunoscut o activitate fizica"}`
      }]
    });

    const raw = message.content[0].text;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Raspuns invalid" });
    return res.json(JSON.parse(match[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
}
