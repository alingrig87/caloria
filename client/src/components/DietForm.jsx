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
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🥦</span>
          <div>
            <h2 className="text-xl font-bold text-white">Generator Plan Alimentar</h2>
            <p className="text-sm text-gray-400">Plan personalizat de 30 de zile, adaptat la tara si sezon</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nume si Prenume */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prenume <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="Ion"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nume <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                placeholder="Popescu"
                className={inputClass}
              />
            </div>
          </div>

          {/* Inaltime, Greutate, Varsta */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Înălțime (cm) <span className="text-red-400">*</span></label>
              <input
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                required
                min="100"
                max="250"
                placeholder="170"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Greutate (kg) <span className="text-red-400">*</span></label>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                required
                min="30"
                max="300"
                placeholder="75"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Vârstă (ani) <span className="text-red-400">*</span></label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                required
                min="10"
                max="120"
                placeholder="35"
                className={inputClass}
              />
            </div>
          </div>

          {/* Tara */}
          <div>
            <label className={labelClass}>Țara <span className="text-red-400">*</span></label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Alimente preferate */}
          <div>
            <label className={labelClass}>
              Alimente și mâncăruri preferate
              <span className="text-gray-500 font-normal ml-2">(descrie ce îți place)</span>
            </label>
            <textarea
              name="preferredFoods"
              value={form.preferredFoods}
              onChange={handleChange}
              rows={4}
              placeholder="Ex: Îmi plac pastele cu sos de roșii, sarmalele, ciorbele, fructele proaspete. Nu consum carne de porc. Îmi place mult brânza și ouăle. Dimineața prefer ceva ușor..."
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cu cât descrii mai detaliat, cu atât planul va fi mai personalizat.
            </p>
          </div>

          {/* Sarbatori / ocazii speciale */}
          <div>
            <label className={labelClass}>
              Sărbători sau ocazii speciale în luna următoare
              <span className="text-gray-500 font-normal ml-2">(opțional)</span>
            </label>
            <textarea
              name="specialOccasions"
              value={form.specialOccasions}
              onChange={handleChange}
              rows={3}
              placeholder="Ex: Pe 6 aprilie este Paștele, vreau să am miel și cozonac în meniu. Pe 15 este ziua mea de naștere..."
              className={`${inputClass} resize-none`}
            />
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
                Generez planul alimentar... (30-60 sec)
              </>
            ) : (
              <>🥗 Generează Plan Alimentar 30 Zile</>
            )}
          </button>

          {loading && (
            <div className="text-center text-xs text-gray-500">
              Claude analizează profilul tău și creează un meniu personalizat cu alimente locale și de sezon...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
