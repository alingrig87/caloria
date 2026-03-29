import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

function buildPrompt(firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, currentMonth, currentYear) {
  return `Ești nutriționist expert. Plan alimentar 30 zile pentru:
- ${firstName} ${lastName}, ${height}cm, ${weight}kg, ${age}ani, ${country}
- Alimente preferate: ${preferredFoods || "nespecificate"}
- Ocazii speciale: ${specialOccasions || "niciuna"}
- Sezon: ${currentMonth} ${currentYear} - foloseste alimente de sezon din ${country}

Calculeaza IMC, greutate ideala (Devine), calorii pentru -0.5kg/saptamana.

RASPUNDE DOAR cu JSON compact valid (fara spatii extra, fara text in afara JSON):
{"analysis":{"bmi":27.7,"bmi_category":"Supraponderal","ideal_weight":70,"ideal_weight_range":"65-72 kg","daily_calories":1700,"weekly_loss_kg":0.5,"expected_loss_month":2.0,"expected_weight_end":78.0},"recommendations":["rec1","rec2","rec3","rec4","rec5"],"days":[{"d":1,"w":"Luni","b":"Terci de ovaz cu miere|380","l":"Ciorba de legume cu pui|480","n":"Salata de ton cu rosii|320","s":"Iaurt cu nuci|180","t":1360}]}

Reguli format zile: d=numar, w=ziua, b=mic_dejun|kcal, l=pranz|kcal, n=cina|kcal, s=gustare|kcal, t=total_kcal
Nume mese: max 5 cuvinte. Genereaza TOATE 30 zilele. Saptamana: Luni,Marti,Miercuri,Joi,Vineri,Sambata,Duminica.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions } = req.body;

  if (!firstName || !lastName || !height || !weight || !age || !country) {
    return res.status(400).json({ error: "Toate câmpurile obligatorii trebuie completate." });
  }

  const today = new Date();
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  const currentMonth = months[today.getMonth()];
  const currentYear = today.getFullYear();

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: buildPrompt(firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, currentMonth, currentYear) }],
      });

      const rawText = message.content[0].text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        if (attempt === MAX_RETRIES) {
          return res.status(500).json({ error: "Nu am putut genera planul alimentar după 3 încercări. Încearcă din nou." });
        }
        console.warn(`Attempt ${attempt}: no JSON found, retrying...`);
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        if (attempt === MAX_RETRIES) {
          return res.status(500).json({ error: "Planul generat conține erori de format. Încearcă din nou." });
        }
        console.warn(`Attempt ${attempt}: JSON parse error at attempt ${attempt}: ${parseErr.message}, retrying...`);
        continue;
      }

      if (!parsed.days || parsed.days.length < 28) {
        if (attempt === MAX_RETRIES) {
          return res.status(500).json({ error: "Planul generat este incomplet. Încearcă din nou." });
        }
        console.warn(`Attempt ${attempt}: only ${parsed.days?.length} days generated, retrying...`);
        continue;
      }

      return res.status(200).json(parsed);

    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error("Eroare Claude API:", error);
        return res.status(500).json({ error: error.message || "Eroare server" });
      }
      console.warn(`Attempt ${attempt}: API error, retrying...`, error.message);
    }
  }
}
