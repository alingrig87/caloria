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

async function generateWeek1(params) {
  const { firstName, lastName, height, weight, age, country, preferredFoods, specialOccasions, currentMonth, currentYear } = params;
  const startWd = getWeekdayForDay(1);

  const prompt = `Esti nutritionist expert. Analiza pacient si planul zilelor 1-7.

Pacient: ${firstName} ${lastName}, ${height}cm, ${weight}kg, ${age}ani, ${country}
Alimente preferate: ${preferredFoods || "nespecificate"}
Ocazii speciale: ${specialOccasions || "niciuna"}
Sezon: ${currentMonth} ${currentYear}, alimente de sezon din ${country}
Ziua 1 incepe cu: ${startWd}

Calculeaza IMC, greutate ideala (formula Devine), calorii pentru -0.5kg/saptamana.

RASPUNDE DOAR cu JSON compact (fara text in afara):
{"analysis":{"bmi":27.7,"bmi_category":"Supraponderal","ideal_weight":70,"ideal_weight_range":"65-72 kg","daily_calories":1700,"weekly_loss_kg":0.5,"expected_loss_month":2.0,"expected_weight_end":78.0},"recommendations":["rec1","rec2","rec3","rec4","rec5"],"days":[{"d":1,"w":"${startWd}","b":"Masa mic dejun|380","l":"Masa pranz|480","n":"Masa cina|320","s":"Gustare|180","t":1360}]}

Format: d=nr_zi, w=ziua_sapt, b=mic_dejun|kcal, l=pranz|kcal, n=cina|kcal, s=gustare|kcal, t=total
Genereaza exact 7 zile (1-7). Nume mese scurte (max 5 cuvinte), variate, specifice ${country}.`;

  return callWithRetry(prompt, (p) => {
    if (!p.analysis || !p.days || p.days.length < 7) throw new Error(`invalid week1: ${p.days?.length} days`);
  });
}

async function generateWeekDays(params, startDay, endDay, dailyCalories) {
  const { country, preferredFoods, specialOccasions, currentMonth } = params;
  const startWd = getWeekdayForDay(startDay);
  const count = endDay - startDay + 1;

  const prompt = `Esti nutritionist expert. Genereaza DOAR zilele ${startDay}-${endDay} dintr-un plan alimentar.

Pacient: ${params.height}cm, ${params.weight}kg, ${params.age}ani, ${country}
Calorii zilnice tinta: ${dailyCalories} kcal
Alimente preferate: ${preferredFoods || "nespecificate"}
Ocazii speciale: ${specialOccasions || "niciuna"}
Sezon: ${currentMonth}, alimente de sezon din ${country}
Ziua ${startDay} incepe cu: ${startWd}

RASPUNDE DOAR cu array JSON compact (fara {}, fara text in afara):
[{"d":${startDay},"w":"${startWd}","b":"Masa mic dejun|380","l":"Masa pranz|480","n":"Masa cina|320","s":"Gustare|180","t":1360}]

Format: d=nr_zi, w=ziua_sapt, b=mic_dejun|kcal, l=pranz|kcal, n=cina|kcal, s=gustare|kcal, t=total
Genereaza exact ${count} zile (${startDay} pana la ${endDay}). Mese variate, specifice ${country}, de sezon.`;

  return callWithRetry(prompt, (p) => {
    if (!Array.isArray(p) || p.length < count - 1) throw new Error(`invalid week: got ${p?.length} days, need ${count}`);
  });
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

  const params = {
    firstName, lastName, height, weight, age, country,
    preferredFoods, specialOccasions,
    currentMonth: months[today.getMonth()],
    currentYear: today.getFullYear(),
  };

  try {
    // Week 1 + analysis (sequential - need daily_calories for other weeks)
    const week1 = await generateWeek1(params);
    const dailyCalories = week1.analysis.daily_calories;

    // Weeks 2, 3, 4 in parallel
    const [week2Days, week3Days, week4Days] = await Promise.all([
      generateWeekDays(params, 8, 14, dailyCalories),
      generateWeekDays(params, 15, 21, dailyCalories),
      generateWeekDays(params, 22, 30, dailyCalories),
    ]);

    return res.status(200).json({
      analysis: week1.analysis,
      recommendations: week1.recommendations,
      days: [...week1.days, ...week2Days, ...week3Days, ...week4Days],
    });

  } catch (error) {
    console.error("Eroare generare plan:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
}
