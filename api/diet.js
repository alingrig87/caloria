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

function cookingInstructions(cookTimesPerWeek) {
  const n = Math.max(1, Math.min(7, Math.round(cookTimesPerWeek)));
  const restDays = 7 - n;
  if (n >= 7) return 'Marcheaza toate zilele cu "cook":1.';
  const restDesc = n <= 2
    ? "fructe proaspete, legume crude, smoothie-uri, iaurt, nuci - FARA gatit"
    : "fructe, legume crude, salate simple, iaurt, branza - mese rapide sub 10 min";
  return `IMPORTANT - Gatesti de ${n} ori pe saptamana (${restDays} zile FARA gatit greu):
- Distribuie uniform ${n} sesiuni de gatit pe saptamana (ex: la fiecare ${Math.round(7/n)} zile)
- Zilele cu gatit activ (cook:1): mese normale gatite, consistente
- Zilele FARA gatit (cook:0): OBLIGATORIU ${restDesc}
- Marcheaza exact ${n} zile/saptamana cu cook:1 si restul cu cook:0`;
}

async function generateWeek1(params) {
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, currentMonth, currentYear, cookTimesPerWeek, includeRecipes } = params;
  const startWd = getWeekdayForDay(1);
  const cookInstr = cookingInstructions(cookTimesPerWeek);
  const exMeal = includeRecipes ? "Terci ovaz cu miere|380|10" : "Terci ovaz cu miere|380";

  const prompt = `Esti nutritionist expert. Analiza pacient si planul zilelor 1-7.

Pacient: ${firstName} ${lastName}, ${height}cm, ${weight}kg, ${age}ani, ${country}
Alimente preferate: ${preferredFoods || "nespecificate"}
Ocazii speciale: ${specialOccasions || "niciuna"}
Sezon: ${currentMonth} ${currentYear}, alimente de sezon din ${country}
Ziua 1 incepe cu: ${startWd}
${cookInstr}

Calculeaza IMC, greutate ideala (formula Devine), calorii pentru -0.5kg/saptamana.

RASPUNDE DOAR cu JSON compact (fara text in afara):
{"analysis":{"bmi":27.7,"bmi_category":"Supraponderal","ideal_weight":70,"ideal_weight_range":"65-72 kg","daily_calories":1700,"weekly_loss_kg":0.5,"expected_loss_month":2.0,"expected_weight_end":78.0},"recommendations":["rec1","rec2","rec3","rec4","rec5"],"days":[{"d":1,"w":"${startWd}","cook":1,"b":"${exMeal}","l":"Masa pranz|480${includeRecipes?"|45":""}","n":"Masa cina|320${includeRecipes?"|5":""}","s":"Fructe|180${includeRecipes?"|2":""}","t":1360}]}

Format: d=nr_zi, w=ziua_sapt, cook=1/0, b=mic_dejun|kcal${includeRecipes?"|min":""}, l=pranz, n=cina, s=gustare, t=total
Genereaza exact 7 zile (1-7). Mese variate, specifice ${country}, de sezon.`;

  return callWithRetry(prompt, (p) => {
    if (!p.analysis || !p.days || p.days.length < 7) throw new Error(`invalid week1: ${p.days?.length} days`);
  });
}

async function generateWeekDays(params, startDay, endDay, dailyCalories) {
  const { country, preferredFoods, specialOccasions, currentMonth, cookTimesPerWeek, includeRecipes } = params;
  const startWd = getWeekdayForDay(startDay);
  const count = endDay - startDay + 1;
  const cookInstr = cookingInstructions(cookTimesPerWeek);
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

Format: d=nr_zi, w=ziua_sapt, cook=1/0, b=mic_dejun|kcal${includeRecipes?"|min":""}, l=pranz, n=cina, s=gustare, t=total
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

async function generateShoppingList(params, allDays) {
  const { country, currentMonth } = params;

  // Count frequency of each meal for better quantity estimates
  const mealCounts = {};
  allDays.forEach((day) => {
    ["b", "l", "n", "s"].forEach((key) => {
      if (day[key]) {
        const name = String(day[key]).split("|")[0].trim();
        if (name && name.length > 2) mealCounts[name] = (mealCounts[name] || 0) + 1;
      }
    });
  });

  const mealList = Object.entries(mealCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} (x${count})`)
    .join(", ");

  const prompt = `Genereaza lista de cumparaturi pentru 30 de zile, 1 persoana, bazata pe aceste mese:
${mealList}

Tara: ${country}, luna: ${currentMonth}

RASPUNDE DOAR cu JSON organizat pe categorii (fara text in afara):
{"Legume si fructe":[{"item":"rosii","qty":"1.5 kg"},{"item":"mere","qty":"2 kg"}],"Carne si peste":[{"item":"piept de pui","qty":"1.5 kg"}],"Lactate si oua":[{"item":"oua","qty":"30 bucati"}],"Cereale si leguminoase":[{"item":"orez","qty":"800g"}],"Condimente si altele":[{"item":"ulei de masline","qty":"500ml"}]}

Reguli: cantitati pentru 30 zile (1 portie/zi), rotunjeste la valori practice (100g, 250g, 500g, 1kg etc), include tot ce e necesar din mese.`;

  return callWithRetry(prompt, (p) => {
    if (typeof p !== "object" || Array.isArray(p)) throw new Error("invalid shopping list");
    if (Object.keys(p).length === 0) throw new Error("empty shopping list");
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
    const week1 = await generateWeek1(params);
    const dailyCalories = week1.analysis.daily_calories;

    const [week2Days, week3Days, week4Days] = await Promise.all([
      generateWeekDays(params, 8, 14, dailyCalories),
      generateWeekDays(params, 15, 21, dailyCalories),
      generateWeekDays(params, 22, 30, dailyCalories),
    ]);

    const allDays = [...week1.days, ...week2Days, ...week3Days, ...week4Days];

    // Recipes + shopping list in parallel
    const [recipes, shopping] = await Promise.all([
      includeRecipes ? generateRecipes(params, extractMealNames(allDays)) : Promise.resolve({}),
      generateShoppingList(params, allDays),
    ]);

    return res.status(200).json({
      analysis: week1.analysis,
      recommendations: week1.recommendations,
      cookTimesPerWeek,
      includeRecipes,
      days: allDays,
      recipes,
      shopping,
    });

  } catch (error) {
    console.error("Eroare generare plan:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
}
