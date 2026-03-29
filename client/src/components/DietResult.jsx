import { useRef } from "react";

const MEAL_ICONS = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const MEAL_LABELS = {
  breakfast: "Mic dejun",
  lunch: "Prânz",
  dinner: "Cină",
  snack: "Gustare",
};

const BMI_COLORS = {
  "Subponderal": "#60a5fa",
  "Normal": "#34d399",
  "Supraponderal": "#fbbf24",
  "Obezitate grad I": "#f97316",
  "Obezitate grad II": "#ef4444",
  "Obezitate grad III": "#dc2626",
};

function getDayDate(dayIndex) {
  const date = new Date();
  date.setDate(date.getDate() + dayIndex + 1);
  const days = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function getFullDate(dayIndex) {
  const date = new Date();
  date.setDate(date.getDate() + dayIndex + 1);
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  const days = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
  return { full: `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`, short: `${date.getDate()} ${months[date.getMonth()]}` };
}

function getTodayFormatted() {
  const date = new Date();
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function DietResult({ result, form, onBack }) {
  const printRef = useRef(null);

  const { analysis, recommendations = [], days = [] } = result;

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const bmiColor = BMI_COLORS[analysis?.bmi_category] || "#34d399";

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Plan Alimentar - ${form.firstName} ${form.lastName}`;
    window.print();
    document.title = originalTitle;
  };

  const handleSavePDF = () => {
    const originalTitle = document.title;
    document.title = `Plan Alimentar - ${form.firstName} ${form.lastName} - ${getTodayFormatted()}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <>
      {/* ====== PRINT STYLES ====== */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; color: black !important; margin: 0; padding: 0; font-family: 'Georgia', serif; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
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
          .print-table th { background: #14532d; color: white; padding: 6px 8px; text-align: left; font-weight: 600; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em; }
          .print-table td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
          .print-table tr:nth-child(even) td { background: #f9fafb; }
          .print-table tr:hover td { background: #f0fdf4; }
          .print-table .day-col { font-weight: bold; color: #166534; white-space: nowrap; width: 100px; }
          .print-table .cal-col { text-align: right; color: #6b7280; white-space: nowrap; font-size: 8pt; }
          .print-table .total-col { font-weight: bold; text-align: right; color: #14532d; white-space: nowrap; }
          .print-table .meal-name { color: #1f2937; line-height: 1.3; }
          .print-footer { text-align: center; font-size: 8pt; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 20px; }
        }
        @media screen {
          .print-only { display: none; }
          #diet-print-area { display: none; }
        }
      `}</style>

      {/* ====== SCREEN VIEW ====== */}
      <div className="no-print max-w-5xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Înapoi la formular
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🖨️ Printează
            </button>
            <button
              onClick={handleSavePDF}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
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
              <p className="text-gray-500 text-xs mt-1">Generat: {getTodayFormatted()}</p>
            </div>
            <div className="text-right">
              <div
                className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: bmiColor + "33", color: bmiColor, border: `1px solid ${bmiColor}66` }}
              >
                IMC {analysis?.bmi?.toFixed(1)} · {analysis?.bmi_category}
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
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

        {/* Weekly sections */}
        {weeks.map((week, wi) => (
          <div key={wi} className="space-y-3">
            <h3 className="text-emerald-400 font-semibold text-base border-b border-gray-800 pb-2">
              📅 Săptămâna {wi + 1} — Zilele {wi * 7 + 1}–{Math.min((wi + 1) * 7, days.length)}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {week.map((day, di) => {
                const dateInfo = getFullDate(wi * 7 + di);
                return (
                  <div key={day.day} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="bg-gray-800 px-4 py-2.5 flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">Ziua {day.day}</span>
                      <span className="text-gray-400 text-xs">{dateInfo.short}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
                        <div key={meal} className="flex gap-2 items-start">
                          <span className="text-base flex-shrink-0 mt-0.5">{MEAL_ICONS[meal]}</span>
                          <div className="min-w-0">
                            <div className="text-xs text-gray-500">{MEAL_LABELS[meal]}</div>
                            <div className="text-xs text-gray-200 leading-snug">{day[meal]?.name}</div>
                          </div>
                          <span className="text-xs text-gray-600 ml-auto flex-shrink-0 mt-0.5">{day[meal]?.cal}</span>
                        </div>
                      ))}
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
          La salvare PDF, în dialogul de printare selectați <strong className="text-gray-500">„Salvare ca PDF"</strong> sau <strong className="text-gray-500">„Save as PDF"</strong> ca destinație.
        </p>
      </div>

      {/* ====== PRINT-ONLY AREA ====== */}
      <div id="diet-print-area" ref={printRef}>
        {/* Page 1: Cover + Analysis + Week 1 */}
        <div className="print-page">
          <div className="print-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="print-title">🥗 Plan Alimentar Personalizat</div>
                <div className="print-subtitle">
                  {form.firstName} {form.lastName} · {form.height} cm · {form.weight} kg · {form.age} ani · {form.country}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="print-meta">Generat: {getTodayFormatted()}</div>
                <div className="print-meta" style={{ marginTop: 4, fontWeight: "bold", color: "#166534" }}>
                  IMC: {analysis?.bmi?.toFixed(1)} — {analysis?.bmi_category}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="print-stats-grid">
            <div className="print-stat-box">
              <div className="print-stat-value">{form.weight} kg</div>
              <div className="print-stat-label">Greutate actuală</div>
            </div>
            <div className="print-stat-box">
              <div className="print-stat-value">{analysis?.ideal_weight} kg</div>
              <div className="print-stat-label">Greutate ideală ({analysis?.ideal_weight_range})</div>
            </div>
            <div className="print-stat-box">
              <div className="print-stat-value">{analysis?.daily_calories}</div>
              <div className="print-stat-label">Calorii zilnice (kcal)</div>
            </div>
            <div className="print-stat-box">
              <div className="print-stat-value">-{analysis?.expected_loss_month} kg</div>
              <div className="print-stat-label">Obiectiv lunar → {analysis?.expected_weight_end} kg</div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="print-recs">
              <div className="print-recs-title">💡 Recomandări Personalizate</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Week 1 */}
          {weeks[0] && <PrintWeek week={weeks[0]} weekIndex={0} />}
        </div>

        {/* Pages 2+: Remaining weeks */}
        {weeks.slice(1).map((week, wi) => (
          <div key={wi + 1} className="print-page">
            <div className="print-header" style={{ borderBottomWidth: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="print-title" style={{ fontSize: "14pt" }}>
                  Plan Alimentar — {form.firstName} {form.lastName}
                </span>
                <span className="print-meta">Generat: {getTodayFormatted()}</span>
              </div>
            </div>
            <PrintWeek week={week} weekIndex={wi + 1} />
          </div>
        ))}
      </div>
    </>
  );
}

function PrintWeek({ week, weekIndex }) {
  const startDay = weekIndex * 7 + 1;
  const endDay = startDay + week.length - 1;

  function getDate(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset + 1);
    const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  return (
    <div>
      <div className="print-week-title">
        📅 Săptămâna {weekIndex + 1} — Zilele {startDay}–{endDay}
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "100px" }}>Ziua</th>
            <th>🌅 Mic Dejun</th>
            <th>☀️ Prânz</th>
            <th>🌙 Cină</th>
            <th>🍎 Gustare</th>
            <th style={{ width: "65px", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {week.map((day, di) => (
            <tr key={day.day}>
              <td className="day-col">
                <div>{day.weekday}</div>
                <div style={{ fontSize: "7.5pt", color: "#9ca3af", fontWeight: "normal" }}>
                  Ziua {day.day} · {getDate(weekIndex * 7 + di)}
                </div>
              </td>
              <td>
                <div className="meal-name">{day.breakfast?.name}</div>
                <div className="cal-col">{day.breakfast?.cal} kcal</div>
              </td>
              <td>
                <div className="meal-name">{day.lunch?.name}</div>
                <div className="cal-col">{day.lunch?.cal} kcal</div>
              </td>
              <td>
                <div className="meal-name">{day.dinner?.name}</div>
                <div className="cal-col">{day.dinner?.cal} kcal</div>
              </td>
              <td>
                <div className="meal-name">{day.snack?.name}</div>
                <div className="cal-col">{day.snack?.cal} kcal</div>
              </td>
              <td className="total-col">{day.total} kcal</td>
            </tr>
          ))}
        </tbody>
      </table>
      {weekIndex === Math.ceil(30 / 7) - 1 && (
        <div className="print-footer">
          Plan generat cu Calorie Scanner · {new Date().getFullYear()} · Estimările sunt orientative — consultați un medic sau nutriționist pentru sfaturi medicale personalizate.
        </div>
      )}
    </div>
  );
}
