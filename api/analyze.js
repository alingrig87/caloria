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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await client.messages.stream({
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

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Eroare Claude API:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}
