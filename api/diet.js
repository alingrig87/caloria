import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

const WEEKDAYS = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];

function getWeekdayForDay(dayNumber) {
  const d = new Date();
  d.setDate(d.getDate() + dayNumber);
  return WEEKDAYS[d.getDay()];
}

async function callWithRetry(prompt, validate, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = message.content[0].text;
    try {
      const match = raw.match(/[\[{][\s\S]*[\]}]/);
      if (!match) throw new Error("no JSON found");
      const parsed = JSON.parse(match[0]);
      validate(parsed);
      return parsed;
    } catch (err) {
      if (attempt === maxRetries) throw new Error(`Failed after ${maxRetries} attempts: ${err.message}`);
      console.warn(`Attempt ${attempt} failed: ${err.message}, retrying...`);
    }
  }
}

function cookingFreqInstructions(cookingFreq, includeRecipes) {
  const recipeNote = includeRecipes ? ' Adauga "cook":1 pentru zilele cu gatit activ si "cook":0 pentru zilele cu mancare ramasa.' : '';
  switch (cookingFreq) {
    case "rar":
      return `IMPORTANT - Batch cooking (gatit rar):
- Planifica doar 2 sesiuni de gatit pe saptamana (ex: Duminica si Miercuri)
- In zilele de gatit: mese consistente care tin 2-3 zile
- In celelalte zile: mancare ramasa sau mese simple fara gatit (salate, sandvici, iaurt, fructe)
- Marcheaza cu "cook":1 zilele cu sesiune de gatit si "cook":0 restul.${recipeNote}`;
    case "weekend":
      return `IMPORTANT - Gatit doar la weekend:
- Gatesti Sambata si Duminica, pregatesti pentru intreaga saptamana
- Luni-Vineri: mancare pregatita la weekend sau mese ultra-rapide (max 5 min)
- Marcheaza cu "cook":1 Sambata/Duminica si "cook":0 Luni-Vineri.${recipeNote}`;
    case "2-3ori":
      return `IMPORTANT - Gatit de 2-3 ori pe saptamana:
- Planifica ~3 zile cu gatit activ pe saptamana
- Celelalte zile: resturi sau mese simple/rapide
- Marcheaza cu "cook":1 zilele cu gatit si "cook":0 celelalte.${recipeNote}`;
    default: // zilnic
      return includeRecipes ? 'Marcheaza toate zilele cu "cook":1.' : '';
  }
}

async function generateWeek1(params) {
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, currentMonth, currentYear, cookingFreq, includeRecipes } = params;
  const startWd = getWeekdayForDay(1);
  const cookInstr = cookingFreqInstructions(cookingFreq, true);
  const mealFmt = includeRecipes ? "Nume masa|kcal|minPrep" : "Nume masa|kcal";
  const exMeal = includeRecipes ? "Terci de ovaz cu miere|380|10" : "Terci de ovaz cu miere|380";

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

Format: d=nr_zi, w=ziua_sapt, cook=1/0, b=mic_dejun|kcal${includeRecipes?"|min":""},l=pranz,n=cina,s=gustare,t=total
Genereaza exact 7 zile (1-7). Nume mese scurte (max 5 cuvinte), variate, specifice ${country}.`;

  return callWithRetry(prompt, (p) => {
    if (!p.analysis || !p.days || p.days.length < 7) throw new Error(`invalid week1: ${p.days?.length} days`);
  });
}

async function generateWeekDays(params, startDay, endDay, dailyCalories) {
  const { country, preferredFoods, specialOccasions, currentMonth, cookingFreq, includeRecipes } = params;
  const startWd = getWeekdayForDay(startDay);
  const count = endDay - startDay + 1;
  const cookInstr = cookingFreqInstructions(cookingFreq, true);
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

  return callWithRetry(prompt, (p) => {
    if (!Array.isArray(p) || p.length < count - 1) throw new Error(`got ${p?.length} days, need ${count}`);
  });
}

async function generateRecipes(params, mealNames) {
  const { country, currentMonth } = params;
  if (!mealNames.length) return {};

  const prompt = `Genereaza retete simple pentru aceste mese (bucataria din ${country}, sezon ${currentMonth}):
${mealNames.slice(0, 25).join(", ")}

RASPUNDE DOAR cu JSON (fara text in afara):
{"Nume masa":{"time":15,"ing":"ingredient1, ingredient2, ingredient3","steps":"1. Primul pas. 2. Al doilea pas. 3. Al treilea pas."},...}

Retete scurte: max 4 pasi, ingrediente comune, cantitati pentru 1 portie.`;

  return callWithRetry(prompt, (p) => {
    if (typeof p !== "object" || Array.isArray(p)) throw new Error("invalid recipes format");
  });
}

function extractMealNames(days) {
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
    // Week 1 + analysis (sequential)
    const week1 = await generateWeek1(params);
    const dailyCalories = week1.analysis.daily_calories;

    // Weeks 2, 3, 4 in parallel
    const [week2Days, week3Days, week4Days] = await Promise.all([
      generateWeekDays(params, 8, 14, dailyCalories),
      generateWeekDays(params, 15, 21, dailyCalories),
      generateWeekDays(params, 22, 30, dailyCalories),
    ]);

    const allDays = [...week1.days, ...week2Days, ...week3Days, ...week4Days];

    // Recipes call (parallel-ish — done after we have all meal names)
    let recipes = {};
    if (includeRecipes) {
      const mealNames = extractMealNames(allDays);
      recipes = await generateRecipes(params, mealNames);
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
}
