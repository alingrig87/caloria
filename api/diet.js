import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

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

  const prompt = `Ești un nutriționist și dietetician expert. Creează un plan alimentar personalizat complet pentru 30 de zile.

DATE PACIENT:
- Prenume: ${firstName}, Nume: ${lastName}
- Înălțime: ${height} cm
- Greutate actuală: ${weight} kg
- Vârstă: ${age} ani
- Țara: ${country} (adaptează meniurile la bucătăria și ingredientele locale)
- Alimente preferate: ${preferredFoods || "nespecificate"}
- Sărbători/ocazii speciale în perioadă: ${specialOccasions || "niciuna"}
- Luna curentă: ${currentMonth} ${currentYear} (ține cont de alimentele de sezon din ${country})

INSTRUCȚIUNI:
1. Calculează IMC, categoria IMC și greutatea ideală (formula Devine)
2. Stabilește necesarul caloric pentru pierdere sănătoasă în greutate (0.5-0.8 kg/săptămână)
3. Generează menu variat pe 30 de zile cu alimente din ${country}, de sezon (luna ${currentMonth})
4. Integrează alimentele preferate ale pacientului în mod regulat
5. Include mese speciale pentru sărbătorile menționate
6. Asigură varietate - nu repeta aceeași masă mai mult de 2 ori pe săptămână

RĂSPUNDE EXCLUSIV cu JSON valid, fără text în afară de JSON:
{
  "analysis": {
    "bmi": 27.7,
    "bmi_category": "Supraponderal",
    "ideal_weight": 70,
    "ideal_weight_range": "65-72 kg",
    "daily_calories": 1700,
    "weekly_loss_kg": 0.5,
    "expected_loss_month": 2.0,
    "expected_weight_end": 78.0
  },
  "recommendations": [
    "Bea minimum 2 litri de apă pe zi, preferabil înainte de mese",
    "Mănâncă încet și mestecă bine fiecare îmbucătură",
    "Evită alimentele procesate și zahărul rafinat",
    "Fă minimum 30 de minute de mișcare ușoară zilnic",
    "Nu sări peste micul dejun - este cea mai importantă masă"
  ],
  "days": [
    {
      "day": 1,
      "weekday": "Luni",
      "breakfast": {"name": "Terci de ovăz cu fructe de pădure și miere", "cal": 380},
      "lunch": {"name": "Ciorbă de legume cu carne de pui", "cal": 480},
      "dinner": {"name": "Salată de ton cu roșii și castraveți", "cal": 320},
      "snack": {"name": "Iaurt grecesc cu nuci", "cal": 180},
      "total": 1360
    }
  ]
}

Generează TOATE cele 30 de zile. Zilele săptămânii în ordinea corectă: Luni, Marți, Miercuri, Joi, Vineri, Sâmbătă, Duminică (repetat).`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = message.content[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Nu am putut genera planul alimentar. Încearcă din nou." });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Eroare Claude API:", error);
    return res.status(500).json({ error: error.message || "Eroare server" });
  }
}
