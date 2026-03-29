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

function dietCookingFreqInstructions(cookingFreq) {
  switch (cookingFreq) {
    case "rar":
      return `IMPORTANT - Batch cooking (gatit rar):
- Planifica doar 2 sesiuni de gatit pe saptamana (ex: Duminica si Miercuri)
- In zilele de gatit: mese consistente care tin 2-3 zile
- In celelalte zile: mancare ramasa sau mese simple fara gatit
- Marcheaza cu "cook":1 zilele cu sesiune de gatit si "cook":0 restul.`;
    case "weekend":
      return `IMPORTANT - Gatit doar la weekend:
- Gatesti Sambata si Duminica, pregatesti pentru intreaga saptamana
- Luni-Vineri: mancare pregatita la weekend sau mese ultra-rapide (max 5 min)
- Marcheaza cu "cook":1 Sambata/Duminica si "cook":0 Luni-Vineri.`;
    case "2-3ori":
      return `IMPORTANT - Gatit de 2-3 ori pe saptamana:
- Planifica ~3 zile cu gatit activ pe saptamana
- Celelalte zile: resturi sau mese simple
- Marcheaza cu "cook":1 zilele cu gatit si "cook":0 celelalte.`;
    default:
      return 'Marcheaza toate zilele cu "cook":1.';
  }
}

const WEEKDAYS_RO = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];

function getWeekdayForDay(dayNumber) {
  const d = new Date();
  d.setDate(d.getDate() + dayNumber);
  return WEEKDAYS_RO[d.getDay()];
}

async function dietCallWithRetry(prompt, validate, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = message.content[0].text;
    try {
      const match = raw.match(/[\[{][\s\S]*[\]}]/);
      if (!match) throw new Error("no JSON");
      const parsed = JSON.parse(match[0]);
      validate(parsed);
      return parsed;
    } catch (err) {
      if (attempt === maxRetries) throw new Error(`Failed after ${maxRetries} tries: ${err.message}`);
      console.warn(`Diet attempt ${attempt} failed: ${err.message}, retrying...`);
    }
  }
}

async function dietGenerateWeek1(params) {
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, currentMonth, currentYear, cookingFreq, includeRecipes } = params;
  const startWd = getWeekdayForDay(1);
  const cookInstr = dietCookingFreqInstructions(cookingFreq);
  const exMeal = includeRecipes ? "Terci de ovaz|380|10" : "Terci de ovaz|380";
  const fmtNote = includeRecipes ? ", b=mic_dejun|kcal|min" : ", b=mic_dejun|kcal";

  const prompt = `Esti nutritionist expert. Analiza pacient si planul zilelor 1-7.

Pacient: ${firstName} ${lastName}, ${height}cm, ${weight}kg, ${age}ani, ${country}
Alimente preferate: ${preferredFoods || "nespecificate"}
Ocazii speciale: ${specialOccasions || "niciuna"}
Sezon: ${currentMonth} ${currentYear}, alimente de sezon din ${country}
Ziua 1 incepe cu: ${startWd}
${cookInstr}

Calculeaza IMC, greutate ideala (formula Devine), calorii pentru -0.5kg/saptamana.

RASPUNDE DOAR cu JSON compact (fara text in afara):
{"analysis":{"bmi":27.7,"bmi_category":"Supraponderal","ideal_weight":70,"ideal_weight_range":"65-72 kg","daily_calories":1700,"weekly_loss_kg":0.5,"expected_loss_month":2.0,"expected_weight_end":78.0},"recommendations":["rec1","rec2","rec3","rec4","rec5"],"days":[{"d":1,"w":"${startWd}","cook":1,"b":"${exMeal}","l":"Masa pranz|480${includeRecipes?"|45":""}","n":"Masa cina|320${includeRecipes?"|5":""}","s":"Gustare|180${includeRecipes?"|2":""}","t":1360}]}

Format: d=nr_zi, w=ziua_sapt, cook=1/0${fmtNote}, l=pranz, n=cina, s=gustare, t=total
Genereaza exact 7 zile (1-7). Nume mese scurte (max 5 cuvinte), variate, specifice ${country}.`;
  return dietCallWithRetry(prompt, (p) => {
    if (!p.analysis || !p.days || p.days.length < 7) throw new Error(`invalid week1: ${p.days?.length} days`);
  });
}

async function dietGenerateWeekDays(params, startDay, endDay, dailyCalories) {
  const { country, preferredFoods, specialOccasions, currentMonth, cookingFreq, includeRecipes } = params;
  const startWd = getWeekdayForDay(startDay);
  const count = endDay - startDay + 1;
  const cookInstr = dietCookingFreqInstructions(cookingFreq);
  const exMeal = includeRecipes ? "Masa|kcal|min" : "Masa|kcal";

  const prompt = `Esti nutritionist expert. Genereaza DOAR zilele ${startDay}-${endDay}.

Pacient: ${params.height}cm, ${params.weight}kg, ${params.age}ani, ${country}
Calorii zilnice: ${dailyCalories} kcal
Alimente preferate: ${preferredFoods || "nespecificate"}
Ocazii speciale: ${specialOccasions || "niciuna"}
Sezon: ${currentMonth}, alimente de sezon din ${country}
Ziua ${startDay} incepe cu: ${startWd}
${cookInstr}

RASPUNDE DOAR cu array JSON (fara {}, fara text in afara):
[{"d":${startDay},"w":"${startWd}","cook":1,"b":"${exMeal}","l":"${exMeal}","n":"${exMeal}","s":"${exMeal}","t":1360}]

Format: d=nr_zi, w=ziua_sapt, cook=1/0, b=mic_dejun|kcal${includeRecipes?"|min":""},l=pranz,n=cina,s=gustare,t=total
Genereaza exact ${count} zile (${startDay}-${endDay}). Mese variate, specifice ${country}, de sezon.`;
  return dietCallWithRetry(prompt, (p) => {
    if (!Array.isArray(p) || p.length < count - 1) throw new Error(`got ${p?.length} days, need ${count}`);
  });
}

async function dietGenerateRecipes(params, mealNames) {
  const { country, currentMonth } = params;
  if (!mealNames.length) return {};
  const prompt = `Genereaza retete simple pentru aceste mese (bucataria din ${country}, sezon ${currentMonth}):
${mealNames.slice(0, 25).join(", ")}

RASPUNDE DOAR cu JSON (fara text in afara):
{"Nume masa":{"time":15,"ing":"ingredient1, ingredient2, ingredient3","steps":"1. Primul pas. 2. Al doilea pas. 3. Al treilea pas."},...}

Retete scurte: max 4 pasi, ingrediente comune, cantitati pentru 1 portie.`;
  return dietCallWithRetry(prompt, (p) => {
    if (typeof p !== "object" || Array.isArray(p)) throw new Error("invalid recipes");
  });
}

function dietExtractMealNames(days) {
  const names = new Set();
  days.forEach((day) => {
    ["b", "l", "n", "s"].forEach((key) => {
      if (day[key]) {
        const name = String(day[key]).split("|")[0].trim();
        if (name && name.length > 2) names.add(name);
      }
    });
  });
  return [...names];
}

app.post("/api/diet", async (req, res) => {
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, cookingFreq = "zilnic", includeRecipes = false } = req.body;

  if (!firstName || !lastName || !height || !weight || !age || !country) {
    return res.status(400).json({ error: "Toate câmpurile obligatorii trebuie completate." });
  }

  const today = new Date();
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

  const params = {
    firstName, lastName, height, weight, age, country,
    preferredFoods, specialOccasions, cookingFreq, includeRecipes,
    currentMonth: months[today.getMonth()],
    currentYear: today.getFullYear(),
  };

  try {
    const week1 = await dietGenerateWeek1(params);
    const dailyCalories = week1.analysis.daily_calories;

    const [week2Days, week3Days, week4Days] = await Promise.all([
      dietGenerateWeekDays(params, 8, 14, dailyCalories),
      dietGenerateWeekDays(params, 15, 21, dailyCalories),
      dietGenerateWeekDays(params, 22, 30, dailyCalories),
    ]);

    const allDays = [...week1.days, ...week2Days, ...week3Days, ...week4Days];

    let recipes = {};
    if (includeRecipes) {
      const mealNames = dietExtractMealNames(allDays);
      recipes = await dietGenerateRecipes(params, mealNames);
    }

    return res.status(200).json({
      analysis: week1.analysis,
      recommendations: week1.recommendations,
      cookingFreq,
      includeRecipes,
      days: allDays,
      recipes,
    });
  } catch (error) {
    console.error("Eroare generare plan:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});
