import { useRef, useState } from "react";

const MEALS = [
  { key: "breakfast", icon: "🌅", label: "Mic dejun" },
  { key: "lunch",     icon: "☀️",  label: "Prânz" },
  { key: "dinner",    icon: "🌙",  label: "Cină" },
  { key: "snack",     icon: "🍎",  label: "Gustare" },
];

const DAY_KEY_MAP = { breakfast: "b", lunch: "l", dinner: "n", snack: "s" };

// Parse "Meal name|380|10" → { name, cal, time }
function parseMeal(raw) {
  if (!raw) return { name: "-", cal: 0, time: null };
  const parts = String(raw).split("|");
  return {
    name: parts[0]?.trim() || "-",
    cal: parseInt(parts[1]) || 0,
    time: parts[2] ? parseInt(parts[2]) : null,
  };
}

function normalizeDay(day) {
  if (day.b !== undefined) {
    return {
      day: day.d,
      weekday: day.w,
      cook: day.cook !== undefined ? day.cook : 1,
      breakfast: parseMeal(day.b),
      lunch: parseMeal(day.l),
      dinner: parseMeal(day.n),
      snack: parseMeal(day.s),
      total: day.t,
    };
  }
  return {
    day: day.day,
    weekday: day.weekday,
    cook: day.cook !== undefined ? day.cook : 1,
    breakfast: typeof day.breakfast === "object" ? day.breakfast : parseMeal(day.breakfast),
    lunch: typeof day.lunch === "object" ? day.lunch : parseMeal(day.lunch),
    dinner: typeof day.dinner === "object" ? day.dinner : parseMeal(day.dinner),
    snack: typeof day.snack === "object" ? day.snack : parseMeal(day.snack),
    total: day.total,
  };
}

const BMI_COLORS = {
  "Subponderal": "#60a5fa",
  "Normal": "#34d399",
  "Supraponderal": "#fbbf24",
  "Obezitate grad I": "#f97316",
  "Obezitate grad II": "#ef4444",
  "Obezitate grad III": "#dc2626",
};

function getShortDate(dayIndex) {
  const date = new Date();
  date.setDate(date.getDate() + dayIndex + 1);
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getTodayFormatted() {
  const date = new Date();
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getDate(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset + 1);
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

const COOKING_FREQ_LABELS = {
  "zilnic": "Gătit zilnic",
  "2-3ori": "Gătit 2–3x/săpt",
  "weekend": "Gătit la weekend",
  "rar": "Batch cooking",
};

export default function DietResult({ result, form, onBack }) {
  const printRef = useRef(null);
  const [openRecipe, setOpenRecipe] = useState(null);

  const { analysis, recommendations = [], days = [], recipes = {}, cookingFreq = "zilnic", includeRecipes = false } = result;

  const normalizedDays = days.map(normalizeDay);
  const weeks = [];
  for (let i = 0; i < normalizedDays.length; i += 7) {
    weeks.push(normalizedDays.slice(i, i + 7));
  }

  const bmiColor = BMI_COLORS[analysis?.bmi_category] || "#34d399";
  const hasRecipes = includeRecipes && Object.keys(recipes).length > 0;
  const showCookBadge = cookingFreq !== "zilnic";

  const handlePrint = () => {
    const t = document.title;
    document.title = `Plan Alimentar - ${form.firstName} ${form.lastName}`;
    window.print();
    document.title = t;
  };

  const handleSavePDF = () => {
    const t = document.title;
    document.title = `Plan Alimentar - ${form.firstName} ${form.lastName} - ${getTodayFormatted()}`;
    window.print();
    document.title = t;
  };

  return (
    <>
      {/* ====== PRINT STYLES ====== */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; color: black !important; margin: 0; padding: 0; font-family: 'Georgia', serif; }
          .no-print { display: none !important; }
          #diet-print-area { display: block !important; }
          .print-page { page-break-after: always; padding: 20px 30px; }
          .print-page:last-child { page-break-after: avoid; }

          .print-header { border-bottom: 3px solid #166534; padding-bottom: 16px; margin-bottom: 20px; }
          .print-title { font-size: 22pt; font-weight: bold; color: #14532d; margin: 0; }
          .print-subtitle { font-size: 11pt; color: #555; margin: 4px 0 0; }
          .print-meta { font-size: 9pt; color: #888; }

          .print-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
          .print-stat-box { border: 1px solid #d1fae5; background: #f0fdf4; border-radius: 8px; padding: 10px 12px; text-align: center; }
          .print-stat-value { font-size: 18pt; font-weight: bold; color: #166534; }
          .print-stat-label { font-size: 8pt; color: #555; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }

          .print-recs { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin: 12px 0; }
          .print-recs-title { font-size: 10pt; font-weight: bold; color: #92400e; margin-bottom: 6px; }
          .print-recs li { font-size: 9pt; color: #44403c; margin: 3px 0; }

          .print-week-title { font-size: 13pt; font-weight: bold; color: #14532d; border-bottom: 2px solid #bbf7d0; padding-bottom: 6px; margin-bottom: 10px; margin-top: 4px; }

          .print-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
          .print-table th { background: #14532d; color: white; padding: 6px 8px; text-align: left; font-weight: 600; font-size: 8pt; text-transform: uppercase; }
          .print-table td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
          .print-table tr:nth-child(even) td { background: #f9fafb; }
          .print-table .cook-row td { background: #f0fdf4 !important; }
          .print-table .day-col { font-weight: bold; color: #166534; white-space: nowrap; width: 90px; }
          .print-table .cal-col { color: #6b7280; font-size: 7.5pt; white-space: nowrap; }
          .print-table .time-col { color: #9ca3af; font-size: 7.5pt; white-space: nowrap; }
          .print-table .total-col { font-weight: bold; text-align: right; color: #14532d; white-space: nowrap; }
          .print-table .meal-name { color: #1f2937; line-height: 1.3; }
          .print-cook-badge { display: inline-block; font-size: 7pt; padding: 1px 5px; background: #d1fae5; color: #065f46; border-radius: 3px; margin-top: 2px; }
          .print-rest-badge { display: inline-block; font-size: 7pt; padding: 1px 5px; background: #f3f4f6; color: #6b7280; border-radius: 3px; margin-top: 2px; }

          .print-recipe-page .recipe-item { border: 1px solid #d1fae5; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; break-inside: avoid; }
          .print-recipe-page .recipe-name { font-size: 11pt; font-weight: bold; color: #14532d; margin-bottom: 4px; }
          .print-recipe-page .recipe-time { font-size: 8pt; color: #6b7280; margin-bottom: 6px; }
          .print-recipe-page .recipe-ing { font-size: 9pt; color: #374151; margin-bottom: 4px; }
          .print-recipe-page .recipe-steps { font-size: 9pt; color: #1f2937; line-height: 1.5; }
          .print-footer { text-align: center; font-size: 8pt; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 20px; }
        }
        @media screen {
          #diet-print-area { display: none; }
        }
      `}</style>

      {/* ====== SCREEN VIEW ====== */}
      <div className="no-print max-w-5xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            ← Înapoi la formular
          </button>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              🖨️ Printează
            </button>
            <button onClick={handleSavePDF} className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              📄 Salvează PDF
            </button>
          </div>
        </div>

        {/* Patient header */}
        <div className="bg-gradient-to-r from-emerald-900/50 to-gray-900 border border-emerald-800/50 rounded-2xl p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Plan Alimentar — {form.firstName} {form.lastName}
              </h2>
              <p className="text-emerald-400 text-sm mt-1">
                {form.height} cm · {form.weight} kg · {form.age} ani · {form.country}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                  🍳 {COOKING_FREQ_LABELS[cookingFreq] || cookingFreq}
                </span>
                {hasRecipes && (
                  <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                    📋 Include rețete
                  </span>
                )}
                <span className="text-xs text-gray-600">Generat: {getTodayFormatted()}</span>
              </div>
            </div>
            <div
              className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: bmiColor + "33", color: bmiColor, border: `1px solid ${bmiColor}66` }}
            >
              IMC {analysis?.bmi?.toFixed(1)} · {analysis?.bmi_category}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Greutate actuală", value: `${form.weight} kg`, sub: "punct de start" },
            { label: "Greutate ideală", value: `${analysis?.ideal_weight} kg`, sub: analysis?.ideal_weight_range },
            { label: "Calorii zilnice", value: `${analysis?.daily_calories} kcal`, sub: "necesar recomandat" },
            { label: "Obiectiv lunar", value: `-${analysis?.expected_loss_month} kg`, sub: `→ ${analysis?.expected_weight_end} kg` },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{s.value}</div>
              <div className="text-xs text-white font-medium mt-1">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-5">
            <h3 className="text-amber-400 font-semibold text-sm mb-3">💡 Recomandări Personalizate</h3>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">✓</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cooking freq legend */}
        {showCookBadge && (
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Zi de gătit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-600 inline-block"></span>
              Resturi / masă simplă
            </span>
          </div>
        )}

        {/* Weekly sections */}
        {weeks.map((week, wi) => (
          <div key={wi} className="space-y-3">
            <h3 className="text-emerald-400 font-semibold text-base border-b border-gray-800 pb-2">
              📅 Săptămâna {wi + 1} — Zilele {wi * 7 + 1}–{Math.min((wi + 1) * 7, days.length)}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {week.map((day, di) => {
                const isCookDay = day.cook !== 0;
                return (
                  <div key={day.day} className={`border rounded-xl overflow-hidden ${
                    isCookDay && showCookBadge
                      ? "bg-emerald-950/30 border-emerald-800/50"
                      : "bg-gray-900 border-gray-800"
                  }`}>
                    <div className={`px-4 py-2.5 flex items-center justify-between ${
                      isCookDay && showCookBadge ? "bg-emerald-900/40" : "bg-gray-800"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">Ziua {day.day}</span>
                        {showCookBadge && (
                          isCookDay
                            ? <span className="text-xs bg-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded">🍳 gătit</span>
                            : <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">♻️ resturi</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">{getShortDate(wi * 7 + di)}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {MEALS.map(({ key, icon, label }) => {
                        const meal = day[key];
                        const recipeName = meal?.name;
                        const hasRecipe = hasRecipes && recipes[recipeName];
                        return (
                          <div key={key} className="flex gap-2 items-start">
                            <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-500">{label}</div>
                              <div className="text-xs text-gray-200 leading-snug">
                                {hasRecipe ? (
                                  <button
                                    onClick={() => setOpenRecipe(openRecipe === recipeName ? null : recipeName)}
                                    className="text-left hover:text-emerald-400 transition-colors underline-offset-2 hover:underline"
                                  >
                                    {meal?.name}
                                  </button>
                                ) : meal?.name}
                              </div>
                              {meal?.time && (
                                <div className="text-xs text-gray-600 mt-0.5">⏱ {meal.time} min</div>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 flex-shrink-0 mt-0.5">{meal?.cal}</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Total:</span>
                        <span className="text-sm font-bold text-emerald-400">{day.total} kcal</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Recipe popup */}
        {openRecipe && recipes[openRecipe] && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setOpenRecipe(null)}>
            <div className="bg-gray-900 border border-emerald-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-white pr-4">{openRecipe}</h3>
                <button onClick={() => setOpenRecipe(null)} className="text-gray-500 hover:text-white text-xl leading-none flex-shrink-0">✕</button>
              </div>
              <div className="text-sm text-emerald-400 mb-3">⏱ {recipes[openRecipe].time} minute preparare</div>
              <div className="mb-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ingrediente</div>
                <div className="text-sm text-gray-300">{recipes[openRecipe].ing}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preparare</div>
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{recipes[openRecipe].steps}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recipes section */}
        {hasRecipes && (
          <div className="space-y-3">
            <h3 className="text-emerald-400 font-semibold text-base border-b border-gray-800 pb-2">
              📋 Carte de Rețete — {Object.keys(recipes).length} rețete
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(recipes).map(([name, recipe]) => (
                <div key={name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-white text-sm">{name}</div>
                    <span className="text-xs text-emerald-400">⏱ {recipe.time} min</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Ingrediente:</div>
                  <div className="text-xs text-gray-400 mb-2">{recipe.ing}</div>
                  <div className="text-xs text-gray-500 mb-1">Preparare:</div>
                  <div className="text-xs text-gray-300 leading-relaxed">{recipe.steps}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom print bar */}
        <div className="border-t border-gray-800 pt-4 flex flex-wrap gap-3 justify-center">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2.5 px-6 rounded-lg transition-colors">
            🖨️ Printează planul
          </button>
          <button onClick={handleSavePDF} className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium py-2.5 px-6 rounded-lg transition-colors">
            📄 Salvează ca PDF
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 pb-4">
          La salvare PDF, selectați <strong className="text-gray-500">„Salvare ca PDF"</strong> ca destinație în dialogul de printare.
        </p>
      </div>

      {/* ====== PRINT-ONLY AREA ====== */}
      <div id="diet-print-area" ref={printRef}>
        <div className="print-page">
          <div className="print-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="print-title">🥗 Plan Alimentar Personalizat</div>
                <div className="print-subtitle">
                  {form.firstName} {form.lastName} · {form.height} cm · {form.weight} kg · {form.age} ani · {form.country}
                </div>
                <div className="print-meta">🍳 {COOKING_FREQ_LABELS[cookingFreq]} {hasRecipes ? "· Include rețete" : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="print-meta">Generat: {getTodayFormatted()}</div>
                <div className="print-meta" style={{ marginTop: 4, fontWeight: "bold", color: "#166534" }}>
                  IMC: {analysis?.bmi?.toFixed(1)} — {analysis?.bmi_category}
                </div>
              </div>
            </div>
          </div>
          <div className="print-stats-grid">
            <div className="print-stat-box"><div className="print-stat-value">{form.weight} kg</div><div className="print-stat-label">Greutate actuală</div></div>
            <div className="print-stat-box"><div className="print-stat-value">{analysis?.ideal_weight} kg</div><div className="print-stat-label">Greutate ideală ({analysis?.ideal_weight_range})</div></div>
            <div className="print-stat-box"><div className="print-stat-value">{analysis?.daily_calories}</div><div className="print-stat-label">Calorii zilnice (kcal)</div></div>
            <div className="print-stat-box"><div className="print-stat-value">-{analysis?.expected_loss_month} kg</div><div className="print-stat-label">Obiectiv lunar → {analysis?.expected_weight_end} kg</div></div>
          </div>
          {recommendations.length > 0 && (
            <div className="print-recs">
              <div className="print-recs-title">💡 Recomandări Personalizate</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>{recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
            </div>
          )}
          {weeks[0] && <PrintWeek week={weeks[0]} weekIndex={0} totalWeeks={weeks.length} showCookBadge={showCookBadge} showTime={includeRecipes} />}
        </div>

        {weeks.slice(1).map((week, wi) => (
          <div key={wi + 1} className="print-page">
            <div className="print-header" style={{ borderBottomWidth: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="print-title" style={{ fontSize: "14pt" }}>Plan Alimentar — {form.firstName} {form.lastName}</span>
                <span className="print-meta">Generat: {getTodayFormatted()}</span>
              </div>
            </div>
            <PrintWeek week={week} weekIndex={wi + 1} totalWeeks={weeks.length} showCookBadge={showCookBadge} showTime={includeRecipes} />
          </div>
        ))}

        {hasRecipes && (
          <div className="print-page print-recipe-page">
            <div className="print-header" style={{ borderBottomWidth: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="print-title" style={{ fontSize: "16pt" }}>📋 Carte de Rețete</span>
                <span className="print-meta">{form.firstName} {form.lastName} · {getTodayFormatted()}</span>
              </div>
            </div>
            <div style={{ columns: "2", columnGap: "20px" }}>
              {Object.entries(recipes).map(([name, recipe]) => (
                <div key={name} className="recipe-item">
                  <div className="recipe-name">{name}</div>
                  <div className="recipe-time">⏱ {recipe.time} minute</div>
                  <div className="recipe-ing"><strong>Ingrediente:</strong> {recipe.ing}</div>
                  <div className="recipe-steps">{recipe.steps}</div>
                </div>
              ))}
            </div>
            <div className="print-footer">
              Plan generat cu Calorie Scanner · {new Date().getFullYear()} · Estimările sunt orientative — consultați un medic sau nutriționist pentru sfaturi medicale personalizate.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PrintWeek({ week, weekIndex, totalWeeks, showCookBadge, showTime }) {
  const startDay = weekIndex * 7 + 1;
  const endDay = startDay + week.length - 1;

  return (
    <div>
      <div className="print-week-title">📅 Săptămâna {weekIndex + 1} — Zilele {startDay}–{endDay}</div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "90px" }}>Ziua</th>
            <th>🌅 Mic Dejun</th>
            <th>☀️ Prânz</th>
            <th>🌙 Cină</th>
            <th>🍎 Gustare</th>
            <th style={{ width: "60px", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {week.map((day, di) => {
            const isCookDay = day.cook !== 0;
            return (
              <tr key={day.day} className={showCookBadge && isCookDay ? "cook-row" : ""}>
                <td className="day-col">
                  <div>{day.weekday}</div>
                  <div style={{ fontSize: "7.5pt", color: "#9ca3af", fontWeight: "normal" }}>
                    Ziua {day.day} · {getDate(weekIndex * 7 + di)}
                  </div>
                  {showCookBadge && (
                    isCookDay
                      ? <span className="print-cook-badge">🍳 gătit</span>
                      : <span className="print-rest-badge">♻️ resturi</span>
                  )}
                </td>
                {["breakfast", "lunch", "dinner", "snack"].map((mKey) => (
                  <td key={mKey}>
                    <div className="meal-name">{day[mKey]?.name}</div>
                    <div className="cal-col">{day[mKey]?.cal} kcal</div>
                    {showTime && day[mKey]?.time && <div className="time-col">⏱ {day[mKey].time} min</div>}
                  </td>
                ))}
                <td className="total-col">{day.total} kcal</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {weekIndex === totalWeeks - 1 && !Object.keys({}).length && (
        <div className="print-footer">
          Plan generat cu Calorie Scanner · {new Date().getFullYear()} · Estimările sunt orientative.
        </div>
      )}
    </div>
  );
}
