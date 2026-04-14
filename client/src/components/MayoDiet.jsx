const WEEKS = [
  {
    week: 1,
    days: [
      {
        day: "Luni", date: "Ziua 1",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "100g păstrăv la grătar + salată verde cu lămâie (fără ulei)", kcal: 260 },
              { label: "Normal",    foods: "150g păstrăv la grătar + salată cu roșii, castraveți + 1 lg ulei de măsline", kcal: 390 },
              { label: "Consistent", foods: "200g păstrăv la grătar + salată bogată cu roșii, ardei, castraveți, ulei + ou fiert", kcal: 520 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Măr + 10 nuci", kcal: 210, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Păstrăv la cuptor cu lămâie și ierburi (150g) + broccoli la abur + morcovi fierți", kcal: 310 },
        ],
      },
      {
        day: "Marți", date: "Ziua 2",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "Supă de pui cu legume (400ml), fără carne adăugată", kcal: 180 },
              { label: "Normal",    foods: "Supă de pui cu legume + piept de pui fiert (120g)", kcal: 380 },
              { label: "Consistent", foods: "Supă de pui + piept de pui fiert (180g) + morcovi fierți + ou fiert", kcal: 550 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt grec simplu 2% (200g) + afine sau zmeură (100g)", kcal: 195, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Piept de pui la cuptor cu usturoi și rozmarin (150g) + varză albă murată sau salată de varză crudă", kcal: 340 },
        ],
      },
      {
        day: "Miercuri", date: "Ziua 3",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "100g ton în suc propriu + salată de castraveți cu lămâie", kcal: 220 },
              { label: "Normal",    foods: "150g ton în suc propriu + salată castraveți, roșii, ceapă verde + ou fiert", kcal: 370 },
              { label: "Consistent", foods: "200g ton + salată bogată + ou fiert + ½ avocado", kcal: 530 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "2 ouă fierte tari", kcal: 155, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Piept de pui la grătar (150g) + dovlecel la grătar + fasole verde la abur", kcal: 340 },
        ],
      },
      {
        day: "Joi", date: "Ziua 4",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "Supă cremă de legume (300ml, fără smântână) + 100g piept de pui la cuptor", kcal: 300 },
              { label: "Normal",    foods: "Supă cremă de legume (400ml) + 150g piept de pui la cuptor", kcal: 400 },
              { label: "Consistent", foods: "Supă cremă de legume (500ml) + 200g piept de pui + legume la abur", kcal: 560 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Pară + 10 nuci caju nesărate", kcal: 215, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Fileu de cod la cuptor cu lămâie (150g) + mazăre verde la abur + morcovi", kcal: 310 },
        ],
      },
      {
        day: "Vineri", date: "Ziua 5",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "100g piept de pui la grătar + salată verde mare cu lămâie (fără ulei)", kcal: 240 },
              { label: "Normal",    foods: "130g piept de pui la grătar + salată cu frunze verzi, roșii cherry, castraveți + ulei de măsline", kcal: 360 },
              { label: "Consistent", foods: "200g piept de pui la grătar + salată bogată + ulei + ½ avocado + ou fiert", kcal: 540 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt simplu (150g) + fructe de pădure mixte (căpșuni, zmeură, afine)", kcal: 175, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Păstrăv la grătar (150g) + salată de roșii cu busuioc + spanac proaspăt cu lămâie", kcal: 310 },
        ],
      },
      {
        day: "Sâmbătă", date: "Ziua 6",
        meals: [
          { time: "08:30", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "Ciorbă de legume (400ml) + ou fiert", kcal: 230 },
              { label: "Normal",    foods: "Ciorbă de legume (500ml) + ou fiert + 100g piept de pui fiert", kcal: 340 },
              { label: "Consistent", foods: "Ciorbă de legume (600ml) + 2 ouă fierte + 150g piept de pui fiert", kcal: 500 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "10 nuci + portocală", kcal: 230, optional: true },
          { time: "19:30", type: "Cină", icon: "🌙", foods: "Piept de pui la grătar (150g) + salată verde mare cu legume variate și ulei de măsline", kcal: 360 },
        ],
      },
      {
        day: "Duminică", date: "Ziua 7",
        meals: [
          { time: "09:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "Supă de pui cu rădăcinoase (400ml), fără carne adăugată", kcal: 200 },
              { label: "Normal",    foods: "Supă de pui cu rădăcinoase (500ml) + 120g piept de pui + morcovi fierți", kcal: 390 },
              { label: "Consistent", foods: "Supă de pui (600ml) + 200g piept de pui + morcovi fierți + ou fiert", kcal: 560 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "2 ouă fierte + roșii proaspete", kcal: 185, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Somon la cuptor cu ierburi și lămâie (130g) + broccoli la abur + morcovi glazurați ușor", kcal: 380 },
        ],
      },
    ],
  },
  {
    week: 2,
    days: [
      {
        day: "Luni", date: "Ziua 8",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "100g piept de pui la grătar + salată de varză albă cu lămâie (fără ulei)", kcal: 250 },
              { label: "Normal",    foods: "150g piept de pui la grătar + salată de varză cu morcov ras și lămâie", kcal: 370 },
              { label: "Consistent", foods: "200g piept de pui la grătar + salată de varză mare + ou fiert", kcal: 520 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Măr + 12 migdale", kcal: 200, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Păstrăv la abur cu ierburi (150g) + sparanghel la grătar + lămâie", kcal: 290 },
        ],
      },
      {
        day: "Marți", date: "Ziua 9",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "100g ton în suc propriu + salată verde cu castraveți și lămâie", kcal: 220 },
              { label: "Normal",    foods: "150g ton în suc propriu + salată cu castraveți, ardei, lămâie + ou fiert", kcal: 365 },
              { label: "Consistent", foods: "200g ton + salată bogată cu ardei, castraveți + ou fiert + ½ avocado", kcal: 530 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt grec (200g) + căpșuni (100g)", kcal: 190, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Piept de pui la cuptor cu usturoi (150g) + mazăre verde + morcovi fierți", kcal: 360 },
        ],
      },
      {
        day: "Miercuri", date: "Ziua 10",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "Supă cremă de broccoli (300ml) + ou fiert", kcal: 240 },
              { label: "Normal",    foods: "Supă cremă de broccoli (400ml) + ou fiert + 100g piept de pui fiert", kcal: 390 },
              { label: "Consistent", foods: "Supă cremă de broccoli (500ml) + 2 ouă fierte + 150g piept de pui fiert", kcal: 540 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "2 ouă fierte tari", kcal: 155, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Cod la grătar cu lămâie (150g) + salată de roșii cu ardei și busuioc", kcal: 290 },
        ],
      },
      {
        day: "Joi", date: "Ziua 11",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "100g piept de pui cu dovlecel și ardei la tigaie (fără ulei)", kcal: 270 },
              { label: "Normal",    foods: "150g piept de pui cu dovlecel, ardei, roșii, usturoi la tigaie", kcal: 400 },
              { label: "Consistent", foods: "200g piept de pui cu legume la tigaie + ou fiert + salată verde", kcal: 560 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Măr + 10 nuci", kcal: 210, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Păstrăv la cuptor cu lămâie și cimbru (150g) + salată verde mare", kcal: 300 },
        ],
      },
      {
        day: "Vineri", date: "Ziua 12",
        meals: [
          { time: "08:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:00", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "Supă de pui cu broccolini (400ml), fără carne adăugată", kcal: 190 },
              { label: "Normal",    foods: "Supă de pui cu legume (500ml) + 120g piept de pui fiert", kcal: 380 },
              { label: "Consistent", foods: "Supă de pui (600ml) + 180g piept de pui fiert + ou fiert", kcal: 540 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Iaurt grec (200g) + fructe de pădure + scorțișoară", kcal: 190, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Somon la grătar cu ierburi (130g) + broccoli la abur + spanac proaspăt cu ulei de măsline", kcal: 370 },
        ],
      },
      {
        day: "Sâmbătă", date: "Ziua 13",
        meals: [
          { time: "08:30", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "100g piept de pui la grătar + fasole verde la abur cu lămâie", kcal: 250 },
              { label: "Normal",    foods: "150g piept de pui la grătar + fasole verde la abur cu usturoi și lămâie", kcal: 350 },
              { label: "Consistent", foods: "200g piept de pui la grătar + fasole verde + salată de roșii + ulei de măsline", kcal: 490 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "Pară + 10 migdale", kcal: 215, optional: true },
          { time: "19:30", type: "Cină", icon: "🌙", foods: "Ton în suc propriu (150g) + salată mare cu frunze verzi, roșii, castraveți, ardei, ulei de măsline + lămâie", kcal: 330 },
        ],
      },
      {
        day: "Duminică", date: "Ziua 14",
        meals: [
          { time: "09:00", type: "Cafea", icon: "☕", foods: "Cafea neagră fără zahăr", kcal: 0, coffee: true },
          {
            time: "13:30", type: "Prânz", icon: "☀️",
            options: [
              { label: "Ușor",      foods: "Ciorbă de legume (400ml) + ou fiert", kcal: 220 },
              { label: "Normal",    foods: "Ciorbă de legume (500ml) + 2 ouă fierte", kcal: 350 },
              { label: "Consistent", foods: "Ciorbă de legume (600ml) + 2 ouă fierte + 150g piept de pui fiert", kcal: 510 },
            ],
          },
          { time: "16:30", type: "Gustare", icon: "🍎", foods: "2 ouă fierte + castraveți + roșii", kcal: 190, optional: true },
          { time: "19:00", type: "Cină", icon: "🌙", foods: "Păstrăv la grătar cu lămâie și ierburi (150g) + salată de legume colorate (roșii, ardei, avocado, frunze verzi)", kcal: 370 },
        ],
      },
    ],
  },
];

const RULES = [
  { icon: "✅", text: "Apă: minimum 2L pe zi, un pahar înainte de fiecare masă" },
  { icon: "✅", text: "Proteine la fiecare masă principală (pui, pește, ouă)" },
  { icon: "✅", text: "Grăsimi sănătoase: ulei de măsline, avocado, nuci, semințe" },
  { icon: "✅", text: "Legume nelimitate la prânz și cină (crude sau la abur)" },
  { icon: "✅", text: "Gătit: grătar, cuptor, abur, tigaie anti-aderentă fără ulei" },
  { icon: "❌", text: "Fără zahăr adăugat, băuturi îndulcite sau sucuri" },
  { icon: "❌", text: "Fără pâine, paste, orez, cartofi (prima săptămână strict)" },
  { icon: "❌", text: "Fără mezeluri, produse procesate sau afumate" },
  { icon: "❌", text: "Fără prăjeli sau gătit cu mult ulei" },
  { icon: "⚠️", text: "Fructele — permise la gustare, nu seara târziu" },
];

const OPTION_STYLES = [
  { dot: "bg-green-400",  badge: "bg-green-100 text-green-800",  row: "hover:bg-green-50" },
  { dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-800", row: "hover:bg-amber-50" },
  { dot: "bg-orange-400", badge: "bg-orange-100 text-orange-800", row: "hover:bg-orange-50" },
];

const MEAL_COLORS = {
  "Cafea":   "bg-stone-50",
  "Prânz":   "bg-white",
  "Gustare": "bg-blue-50",
  "Cină":    "bg-indigo-50",
};

const MEAL_BADGE = {
  "Cafea":   "bg-stone-100 text-stone-600",
  "Prânz":   "bg-green-100 text-green-800",
  "Gustare": "bg-blue-100 text-blue-800",
  "Cină":    "bg-indigo-100 text-indigo-800",
};

export default function MayoDiet() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-green-700 text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-1">Dieta Vitalis</h2>
        <p className="text-teal-100 text-sm mb-5">Programul alimentar complet de 14 zile · Alimente naturale integrale</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-200 mb-2">Orele meselor</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2"><span>☕</span><span><strong>08:00</strong> — Cafea neagră</span></div>
              <div className="flex items-center gap-2"><span>☀️</span><span><strong>13:00</strong> — Prânz (3 variante de porție)</span></div>
              <div className="flex items-center gap-2"><span>🍎</span><span><strong>16:30</strong> — Gustare <span className="text-teal-300">(opțional)</span></span></div>
              <div className="flex items-center gap-2"><span>🌙</span><span><strong>19:00</strong> — Cină</span></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-200 mb-2">Ce să aștepți după 2 săptămâni</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2"><span>⚖️</span><span>Scădere în greutate de <strong>3–5 kg</strong></span></div>
              <div className="flex items-start gap-2"><span>⚡</span><span>Energie mai bună și somn mai odihnitor</span></div>
              <div className="flex items-start gap-2"><span>🫁</span><span>Reducerea balonării și senzație de ușurință</span></div>
              <div className="flex items-start gap-2"><span>💪</span><span>Masă musculară păstrată datorită proteinei</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 text-base">Reguli de bază</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {RULES.map((r, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="shrink-0">{r.icon}</span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weeks */}
      {WEEKS.map((week) => (
        <div key={week.week} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">
              {week.week}
            </div>
            <h3 className="text-lg font-bold text-gray-800">Săptămâna {week.week}</h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {week.days.map((day) => {
            const normalLunchKcal = day.meals.find(m => m.options)?.options[1]?.kcal ?? 0;
            const otherKcal = day.meals.filter(m => !m.options && !m.coffee).reduce((s, m) => s + m.kcal, 0);
            return (
              <div key={day.date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{day.day}</span>
                    <span className="text-gray-400 text-sm">{day.date}</span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">~{otherKcal + normalLunchKcal} kcal (porție normală)</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {day.meals.map((meal, mi) => {
                    if (meal.options) {
                      return (
                        <div key={mi} className="px-5 py-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-center shrink-0 w-14">
                              <div className="text-lg">{meal.icon}</div>
                              <div className="text-xs font-bold text-gray-500 mt-0.5">{meal.time}</div>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                              Prânz
                            </span>
                            <span className="text-xs text-gray-400">alege porția potrivită</span>
                          </div>
                          <div className="ml-[4.25rem] space-y-2">
                            {meal.options.map((opt, oi) => (
                              <div key={oi} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border border-gray-100 transition-colors ${OPTION_STYLES[oi].row}`}>
                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${OPTION_STYLES[oi].dot}`} />
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${OPTION_STYLES[oi].badge}`}>
                                    {opt.label}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 flex-1 leading-relaxed">{opt.foods}</p>
                                <span className="text-xs font-semibold text-gray-500 shrink-0 pt-0.5 whitespace-nowrap">~{opt.kcal} kcal</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={mi} className={`flex gap-4 px-5 py-3 ${MEAL_COLORS[meal.type]} ${meal.coffee ? "opacity-55" : ""}`}>
                        <div className="text-center shrink-0 w-14">
                          <div className="text-lg">{meal.icon}</div>
                          <div className="text-xs font-bold text-gray-500 mt-0.5">{meal.time}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MEAL_BADGE[meal.type]}`}>
                              {meal.type}
                            </span>
                            {meal.optional && (
                              <span className="text-xs text-gray-400 italic">opțional</span>
                            )}
                            {!meal.coffee && (
                              <span className="text-xs text-gray-400">~{meal.kcal} kcal</span>
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed ${meal.coffee ? "text-gray-400 italic" : "text-gray-700"}`}>
                            {meal.foods}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Notă:</strong> Totalul zilnic variază în funcție de porția aleasă la prânz și dacă incluzi gustarea. Fără gustare și cu porție ușoară: ~650–900 kcal/zi. Cu gustare și porție consistentă: ~1.100–1.400 kcal/zi. Consultați un medic sau nutriționist înainte de a începe orice dietă.
      </div>
    </div>
  );
}
