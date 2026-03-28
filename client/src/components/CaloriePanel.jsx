const macroColors = {
  protein: { bar: "bg-blue-500", text: "text-blue-400", label: "Proteine" },
  carbs:   { bar: "bg-yellow-500", text: "text-yellow-400", label: "Carbohidrati" },
  fat:     { bar: "bg-orange-500", text: "text-orange-400", label: "Grasimi" },
};

function MacroBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CaloriePanel({ result }) {
  if (result.error) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-400">
        🚫 {result.error}
      </div>
    );
  }

  const maxMacro = Math.max(result.total_protein, result.total_carbs, result.total_fat, 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Total calorii - card mare */}
      <div className="bg-gradient-to-br from-emerald-900/60 to-gray-900 border border-emerald-800/50 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-1">Total calorii</p>
        <p className="text-5xl font-bold text-white">
          {result.total_calories}
          <span className="text-xl text-gray-400 font-normal ml-2">kcal</span>
        </p>

        {/* Macros summary */}
        <div className="flex justify-center gap-6 mt-4">
          {Object.entries(macroColors).map(([key, cfg]) => (
            <div key={key} className="text-center">
              <p className={`text-lg font-bold ${cfg.text}`}>{result[`total_${key}`]}g</p>
              <p className="text-xs text-gray-500">{cfg.label}</p>
            </div>
          ))}
        </div>

        {/* Macro bars */}
        <div className="mt-4 flex flex-col gap-2 max-w-xs mx-auto">
          {Object.entries(macroColors).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`text-xs w-24 text-right ${cfg.text}`}>{cfg.label}</span>
              <MacroBar value={result[`total_${key}`]} max={maxMacro} color={cfg.bar} />
            </div>
          ))}
        </div>
      </div>

      {/* Lista alimente */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/80">
          <h3 className="text-sm font-semibold text-gray-300">🍽️ Alimente identificate</h3>
        </div>

        <div className="divide-y divide-gray-800/60">
          {result.items.map((item, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{item.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.quantity}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-blue-400">P: {item.protein}g</span>
                  <span className="text-xs text-yellow-400">C: {item.carbs}g</span>
                  <span className="text-xs text-orange-400">G: {item.fat}g</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-emerald-400 font-bold text-lg">{item.calories}</p>
                <p className="text-gray-500 text-xs">kcal</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nota nutritionista */}
      {result.note && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-gray-400 text-sm italic">
          💡 {result.note}
        </div>
      )}
    </div>
  );
}
