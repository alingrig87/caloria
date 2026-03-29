import { useState } from "react";
import DietResult from "./DietResult";

const COUNTRIES = [
  "Romania", "Moldova", "Bulgaria", "Serbia", "Croatia", "Bosnia si Hertegovina",
  "Slovenia", "Ungaria", "Austria", "Germania", "Elvetia", "Italia", "Franta",
  "Spania", "Portugalia", "Belgia", "Olanda", "Suedia", "Norvegia", "Danemarca",
  "Finlanda", "Polonia", "Cehia", "Slovacia", "Grecia", "Turcia", "Cipru",
  "Marea Britanie", "Irlanda", "SUA", "Canada", "Mexic", "Brazilia", "Argentina",
  "Australia", "Japonia", "China", "India", "Israel", "Egipt", "Africa de Sud"
];

const TEST_PROFILES = [
  {
    label: "🇷🇴 Maria — gătit 2x/săpt",
    data: {
      firstName: "Maria", lastName: "Ionescu", height: "165", weight: "78", age: "35",
      country: "Romania", cookTimesPerWeek: 2, includeRecipes: true,
      preferredFoods: "Îmi plac sarmalele, ciorbele, mâncărurile tradiționale românești. Consum ouă, brânză, legume. Nu mănânc porc.",
      specialOccasions: "Paște pe 6 aprilie - vreau miel și cozonac tradițional",
    }
  },
  {
    label: "🇮🇹 Marco — gătit zilnic",
    data: {
      firstName: "Marco", lastName: "Rossi", height: "178", weight: "92", age: "42",
      country: "Italia", cookTimesPerWeek: 7, includeRecipes: true,
      preferredFoods: "Ador pasta, pizza, risotto, bruschette, pește mediteranean. Consum mult ulei de măsline și legume proaspete.",
      specialOccasions: "",
    }
  },
  {
    label: "🇺🇸 Alex — gătit 1x/săpt",
    data: {
      firstName: "Alex", lastName: "Johnson", height: "182", weight: "95", age: "28",
      country: "SUA", cookTimesPerWeek: 1, includeRecipes: false,
      preferredFoods: "Îmi plac grillul, burgerii, salatele, smoothie-urile. Mănânc mult pui și curcan. Încerc să evit fast-food.",
      specialOccasions: "Super Bowl pe 9 februarie - ceva festiv",
    }
  },
  {
    label: "🇯🇵 Yuki — gătit 3x/săpt",
    data: {
      firstName: "Yuki", lastName: "Tanaka", height: "158", weight: "65", age: "31",
      country: "Japonia", cookTimesPerWeek: 3, includeRecipes: true,
      preferredFoods: "Pește, orez, supă miso, tofu, legume wok, ramen. Prefer mâncăruri ușoare și sănătoase.",
      specialOccasions: "",
    }
  },
  {
    label: "🇩🇪 Klaus — vegetarian 4x",
    data: {
      firstName: "Klaus", lastName: "Müller", height: "175", weight: "88", age: "50",
      country: "Germania", cookTimesPerWeek: 4, includeRecipes: false,
      preferredFoods: "Vegetarian - nu mănânc carne deloc. Îmi plac leguminoasele, cerealele, brânzeturile, ouăle, legumele coapte.",
      specialOccasions: "Crăciun pe 25 decembrie - mâncare germană tradițională fără carne",
    }
  },
];

function cookingHint(n) {
  if (n <= 1) return "🌿 Restul zilelor: fructe proaspete, legume crude, smoothie-uri, nuci";
  if (n <= 2) return "🥗 Zilele fără gătit: fructe, legume crude, salate simple, iaurt";
  if (n <= 4) return "🥑 Câteva zile cu mese rapide — fructe, crudités, brânză, ouă crude";
  if (n <= 6) return "🍽️ 1–2 zile/săpt cu mese rapide sau fructe și legume crude";
  return "🍳 Gătești în fiecare zi — mese proaspete zilnic";
}

const inputClass =
  "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder-gray-500";

const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

export default function DietForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    age: "",
    country: "Romania",
    preferredFoods: "",
    specialOccasions: "",
    cookTimesPerWeek: 3,
    includeRecipes: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Eroare server");
      setResult(data);
    } catch (err) {
      setError(err.message || "A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <DietResult result={result} form={form} onBack={() => setResult(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🥦</span>
          <div>
            <h2 className="text-xl font-bold text-white">Generator Plan Alimentar</h2>
            <p className="text-sm text-gray-400">Plan personalizat de 30 de zile cu lista de cumpărături</p>
          </div>
        </div>

        {/* Test profiles */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 mb-2">Date de test rapide:</p>
          <div className="flex flex-wrap gap-2">
            {TEST_PROFILES.map((profile, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, ...profile.data }))}
                className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-600 text-gray-300 hover:text-emerald-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                {profile.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nume si Prenume */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prenume <span className="text-red-400">*</span></label>
              <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                required placeholder="Ion" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nume <span className="text-red-400">*</span></label>
              <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                required placeholder="Popescu" className={inputClass} />
            </div>
          </div>

          {/* Inaltime, Greutate, Varsta */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Înălțime (cm) <span className="text-red-400">*</span></label>
              <input type="number" name="height" value={form.height} onChange={handleChange}
                required min="100" max="250" placeholder="170" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Greutate (kg) <span className="text-red-400">*</span></label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange}
                required min="30" max="300" placeholder="75" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Vârstă (ani) <span className="text-red-400">*</span></label>
              <input type="number" name="age" value={form.age} onChange={handleChange}
                required min="10" max="120" placeholder="35" className={inputClass} />
            </div>
          </div>

          {/* Tara */}
          <div>
            <label className={labelClass}>Țara <span className="text-red-400">*</span></label>
            <select name="country" value={form.country} onChange={handleChange} required className={inputClass}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Alimente preferate */}
          <div>
            <label className={labelClass}>
              Alimente și mâncăruri preferate
              <span className="text-gray-500 font-normal ml-2">(descrie ce îți place)</span>
            </label>
            <textarea name="preferredFoods" value={form.preferredFoods} onChange={handleChange}
              rows={4} className={`${inputClass} resize-none`}
              placeholder="Ex: Îmi plac pastele cu sos de roșii, sarmalele, ciorbele, fructele proaspete. Nu consum carne de porc..." />
            <p className="text-xs text-gray-500 mt-1">Cu cât descrii mai detaliat, cu atât planul va fi mai personalizat.</p>
          </div>

          {/* Sarbatori */}
          <div>
            <label className={labelClass}>
              Sărbători sau ocazii speciale
              <span className="text-gray-500 font-normal ml-2">(opțional)</span>
            </label>
            <textarea name="specialOccasions" value={form.specialOccasions} onChange={handleChange}
              rows={2} className={`${inputClass} resize-none`}
              placeholder="Ex: Paște pe 6 aprilie, zi de naștere pe 15..." />
          </div>

          {/* Preferinte gatit */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍳</span>
              <span className="text-sm font-semibold text-white">Preferințe gătit</span>
            </div>

            {/* Cooking times per week */}
            <div>
              <label className="text-sm text-gray-300 mb-3 block">
                De câte ori pe săptămână gătești?
                <span className="ml-2 text-emerald-400 font-semibold">
                  {form.cookTimesPerWeek === 7 ? "zilnic" : `${form.cookTimesPerWeek}×/săpt`}
                </span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, cookTimesPerWeek: n }))}
                    className={`flex-1 h-10 rounded-lg text-sm font-bold transition-colors ${
                      form.cookTimesPerWeek === n
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
                    }`}
                  >
                    {n === 7 ? "7" : n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{cookingHint(form.cookTimesPerWeek)}</p>
            </div>

            {/* Include recipes */}
            <div className="border-t border-gray-700 pt-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="includeRecipes" checked={form.includeRecipes} onChange={handleChange}
                  className="w-4 h-4 accent-emerald-500" />
                <div>
                  <div className="text-sm text-white font-medium group-hover:text-emerald-400 transition-colors">
                    📋 Vreau rețete cu ingrediente, pași și timp de preparare
                  </div>
                  <div className="text-xs text-gray-400">Fiecare masă gătită va avea rețeta completă</div>
                </div>
              </label>
            </div>

            {/* Shopping list note */}
            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-3 py-2 text-xs text-emerald-400">
              🛒 Lista de cumpărături cu gramaje va fi generată automat pentru toate cele 30 de zile
            </div>
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {form.includeRecipes ? "Generez plan + rețete + cumpărături... (60-90 sec)" : "Generez plan + lista cumpărături... (45-60 sec)"}
              </>
            ) : (
              <>🥗 Generează Plan Alimentar 30 Zile + Lista Cumpărături</>
            )}
          </button>

          {loading && (
            <div className="text-center text-xs text-gray-500">
              Claude generează meniurile, calculează gramajele și creează lista de cumpărături...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
