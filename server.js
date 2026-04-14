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

function dietCookingInstructions(cookTimesPerWeek) {
  const n = Math.max(1, Math.min(7, Math.round(cookTimesPerWeek)));
  const restDays = 7 - n;
  if (n >= 7) return 'Marcheaza toate zilele cu "cook":1.';
  const restDesc = n <= 2
    ? "fructe proaspete, legume crude, smoothie-uri, iaurt, nuci - FARA gatit"
    : "fructe, legume crude, salate simple, iaurt, branza - mese rapide sub 10 min";
  return `IMPORTANT - Gatesti de ${n} ori pe saptamana (${restDays} zile FARA gatit greu):
- Distribuie uniform ${n} sesiuni de gatit pe saptamana
- Zilele cu gatit activ (cook:1): mese normale gatite
- Zilele FARA gatit (cook:0): OBLIGATORIU ${restDesc}
- Marcheaza exact ${n} zile/saptamana cu cook:1 si restul cu cook:0`;
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
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, currentMonth, currentYear, cookTimesPerWeek } = params;
  const startWd = getWeekdayForDay(1);
  const cookInstr = dietCookingInstructions(cookTimesPerWeek);

  const prompt = `Esti nutritionist expert. Analiza pacient si planul zilelor 1-7.

Pacient: ${firstName} ${lastName}, ${height}cm, ${weight}kg, ${age}ani, ${country}
Alimente preferate: ${preferredFoods || "nespecificate"}
Ocazii speciale: ${specialOccasions || "niciuna"}
Sezon: ${currentMonth} ${currentYear}, alimente de sezon din ${country}
Ziua 1 incepe cu: ${startWd}
${cookInstr}

Calculeaza IMC, greutate ideala (formula Devine), calorii pentru -0.5kg/saptamana.

RASPUNDE DOAR cu JSON compact (fara text in afara):
{"analysis":{"bmi":27.7,"bmi_category":"Supraponderal","ideal_weight":70,"ideal_weight_range":"65-72 kg","daily_calories":1700,"weekly_loss_kg":0.5,"expected_loss_month":2.0,"expected_weight_end":78.0},"recommendations":["rec1","rec2","rec3","rec4","rec5"],"days":[{"d":1,"w":"${startWd}","cook":1,"b":"Terci ovaz cu miere|380|10|12|55|8","l":"Piept pui cu salata|480|25|45|20|12","n":"Supa legume|320|15|18|30|6","s":"Fructe|180|2|2|40|1","t":1360}]}

Format mese: NumeMasa|kcal|min|prot_g|carbs_g|fat_g
Format zi: d=nr_zi, w=ziua_sapt, cook=1/0, b=mic_dejun, l=pranz, n=cina, s=gustare, t=total_kcal
Genereaza exact 7 zile (1-7). Mese variate, specifice ${country}, de sezon. Include macronutrienti realistici.`;
  return dietCallWithRetry(prompt, (p) => {
    if (!p.analysis || !p.days || p.days.length < 7) throw new Error(`invalid week1: ${p.days?.length} days`);
  });
}

async function dietGenerateWeekDays(params, startDay, endDay, dailyCalories) {
  const { country, preferredFoods, specialOccasions, currentMonth, cookTimesPerWeek } = params;
  const startWd = getWeekdayForDay(startDay);
  const count = endDay - startDay + 1;
  const cookInstr = dietCookingInstructions(cookTimesPerWeek);

  const prompt = `Esti nutritionist expert. Genereaza DOAR zilele ${startDay}-${endDay}.

Pacient: ${params.height}cm, ${params.weight}kg, ${params.age}ani, ${country}
Calorii zilnice: ${dailyCalories} kcal
Alimente preferate: ${preferredFoods || "nespecificate"}
Ocazii speciale: ${specialOccasions || "niciuna"}
Sezon: ${currentMonth}, alimente de sezon din ${country}
Ziua ${startDay} incepe cu: ${startWd}
${cookInstr}

RASPUNDE DOAR cu array JSON (fara {}, fara text in afara):
[{"d":${startDay},"w":"${startWd}","cook":1,"b":"Masa|kcal|min|prot|carbs|fat","l":"Masa|kcal|min|prot|carbs|fat","n":"Masa|kcal|min|prot|carbs|fat","s":"Masa|kcal|min|prot|carbs|fat","t":1360}]

Format mese: NumeMasa|kcal|min|prot_g|carbs_g|fat_g
Format zi: d=nr_zi, w=ziua_sapt, cook=1/0, b=mic_dejun, l=pranz, n=cina, s=gustare, t=total_kcal
Genereaza exact ${count} zile (${startDay}-${endDay}). Mese variate, specifice ${country}, de sezon. Include macronutrienti realistici.`;
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
{"Nume masa":{"time":15,"ing":"ingredient1, ingredient2","steps":"1. Pasul 1. 2. Pasul 2."},...}

Retete scurte: max 4 pasi, ingrediente comune, cantitati pentru 1 portie.`;
  return dietCallWithRetry(prompt, (p) => {
    if (typeof p !== "object" || Array.isArray(p)) throw new Error("invalid recipes");
  });
}

async function dietGenerateShoppingList(params, weekDays, weekNum) {
  const { country, currentMonth } = params;
  const mealCounts = {};
  weekDays.forEach((day) => {
    ["b", "l", "n", "s"].forEach((key) => {
      if (day[key]) {
        const name = String(day[key]).split("|")[0].trim();
        if (name && name.length > 2) mealCounts[name] = (mealCounts[name] || 0) + 1;
      }
    });
  });
  const mealList = Object.entries(mealCounts).sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} (x${count})`).join(", ");

  const prompt = `Genereaza lista de cumparaturi pentru saptamana ${weekNum} (7 zile), 1 persoana, bazata pe aceste mese:
${mealList}

Tara: ${country}, luna: ${currentMonth}

RASPUNDE DOAR cu JSON organizat pe categorii (fara text in afara):
{"Legume si fructe":[{"item":"rosii","qty":"500g"},{"item":"mere","qty":"1 kg"}],"Carne si peste":[{"item":"piept de pui","qty":"400g"}],"Lactate si oua":[{"item":"oua","qty":"7 bucati"}],"Cereale si leguminoase":[{"item":"orez","qty":"200g"}],"Condimente si altele":[{"item":"ulei de masline","qty":"100ml"}]}

Reguli: cantitati pentru 7 zile (1 portie/zi), rotunjeste la valori practice (100g, 250g, 500g, 1kg etc).`;
  return dietCallWithRetry(prompt, (p) => {
    if (typeof p !== "object" || Array.isArray(p) || Object.keys(p).length === 0) throw new Error("invalid shopping list");
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
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, cookTimesPerWeek = 3, includeRecipes = false } = req.body;

  if (!firstName || !lastName || !height || !weight || !age || !country) {
    return res.status(400).json({ error: "Toate câmpurile obligatorii trebuie completate." });
  }

  const today = new Date();
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

  const params = {
    firstName, lastName, height, weight, age, country,
    preferredFoods, specialOccasions, cookTimesPerWeek, includeRecipes,
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

    const [recipes, shopping1, shopping2, shopping3, shopping4] = await Promise.all([
      includeRecipes ? dietGenerateRecipes(params, dietExtractMealNames(allDays)) : Promise.resolve({}),
      dietGenerateShoppingList(params, allDays.slice(0, 7), 1),
      dietGenerateShoppingList(params, allDays.slice(7, 14), 2),
      dietGenerateShoppingList(params, allDays.slice(14, 21), 3),
      dietGenerateShoppingList(params, allDays.slice(21), 4),
    ]);

    return res.status(200).json({
      analysis: week1.analysis,
      recommendations: week1.recommendations,
      cookTimesPerWeek,
      includeRecipes,
      days: allDays,
      recipes,
      shopping: [shopping1, shopping2, shopping3, shopping4],
    });
  } catch (error) {
    console.error("Eroare generare plan:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
});

app.post("/api/estimate-text", async (req, res) => {
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
    const parsed = JSON.parse(match[0]);
    return res.json(parsed);
  } catch (error) {
    console.error("estimate-text error:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
});

app.post("/api/estimate-activity", async (req, res) => {
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});
