import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

app.post("/api/analyze", async (req, res) => {
  const { imageBase64, mediaType } = req.body;

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: "imageBase64 and mediaType sunt necesare" });
  }

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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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
    res.status(500).json({ error: error.message || "Eroare server" });
  }
});

app.post("/api/diet", async (req, res) => {
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions } = req.body;

  if (!firstName || !lastName || !height || !weight || !age || !country) {
    return res.status(400).json({ error: "Toate câmpurile obligatorii trebuie completate." });
  }

  const today = new Date();
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  const currentMonth = months[today.getMonth()];
  const currentYear = today.getFullYear();

  const buildPrompt = () => `Ești nutriționist expert. Plan alimentar 30 zile pentru:
- ${firstName} ${lastName}, ${height}cm, ${weight}kg, ${age}ani, ${country}
- Alimente preferate: ${preferredFoods || "nespecificate"}
- Ocazii speciale: ${specialOccasions || "niciuna"}
- Sezon: ${currentMonth} ${currentYear} - foloseste alimente de sezon din ${country}

Calculeaza IMC, greutate ideala (Devine), calorii pentru -0.5kg/saptamana.

RASPUNDE DOAR cu JSON compact valid (fara spatii extra, fara text in afara JSON):
{"analysis":{"bmi":27.7,"bmi_category":"Supraponderal","ideal_weight":70,"ideal_weight_range":"65-72 kg","daily_calories":1700,"weekly_loss_kg":0.5,"expected_loss_month":2.0,"expected_weight_end":78.0},"recommendations":["rec1","rec2","rec3","rec4","rec5"],"days":[{"d":1,"w":"Luni","b":"Terci de ovaz cu miere|380","l":"Ciorba de legume cu pui|480","n":"Salata de ton cu rosii|320","s":"Iaurt cu nuci|180","t":1360}]}

Reguli format zile: d=numar, w=ziua, b=mic_dejun|kcal, l=pranz|kcal, n=cina|kcal, s=gustare|kcal, t=total_kcal
Nume mese: max 5 cuvinte. Genereaza TOATE 30 zilele. Saptamana: Luni,Marti,Miercuri,Joi,Vineri,Sambata,Duminica.`;

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: buildPrompt() }],
      });

      const rawText = message.content[0].text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        if (attempt === MAX_RETRIES) return res.status(500).json({ error: "Nu am putut genera planul după 3 încercări." });
        console.warn(`Diet attempt ${attempt}: no JSON, retrying...`);
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        if (attempt === MAX_RETRIES) return res.status(500).json({ error: "Planul generat conține erori de format. Încearcă din nou." });
        console.warn(`Diet attempt ${attempt}: parse error, retrying...`);
        continue;
      }

      if (!parsed.days || parsed.days.length < 28) {
        if (attempt === MAX_RETRIES) return res.status(500).json({ error: "Planul generat este incomplet. Încearcă din nou." });
        console.warn(`Diet attempt ${attempt}: only ${parsed.days?.length} days, retrying...`);
        continue;
      }

      return res.status(200).json(parsed);

    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error("Eroare Claude API /diet:", error);
        return res.status(500).json({ error: error.message || "Eroare server" });
      }
      console.warn(`Diet attempt ${attempt}: API error, retrying...`);
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});
