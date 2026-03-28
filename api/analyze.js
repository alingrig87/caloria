import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mediaType } = req.body;

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: "imageBase64 and mediaType sunt necesare" });
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Esti un nutritionist expert. Analizeaza aceasta imagine cu mancare si estimeaza caloriile.

Raspunde EXACT in acest format JSON (nimic altceva in afara de JSON):
{
  "items": [
    { "name": "Nume aliment", "quantity": "cantitate estimata (ex: 150g, 1 bucata)", "calories": 250, "protein": 12, "carbs": 30, "fat": 8 },
    ...
  ],
  "total_calories": 500,
  "total_protein": 25,
  "total_carbs": 60,
  "total_fat": 15,
  "note": "observatie scurta despre nutritia mesei (max 1-2 propozitii)"
}

Reguli:
- Estimeaza cantitatea cat mai realist din imagine
- Daca nu esti sigur de un aliment, mentioneaza in name ce crezi ca este
- Proteina, carbohidrati si grasimi in grame
- Daca imaginea nu contine mancare, returneaza { "error": "Imaginea nu contine mancare" }`,
            },
          ],
        },
      ],
    });

    const rawText = message.content[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Nu am putut parsa raspunsul AI." });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Eroare Claude API:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
}
