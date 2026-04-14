import { useState } from "react";
import { doc, setDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  calcBMR, calcTDEE, predictLossKg, ACTIVITY_LEVELS, formatDateStr,
} from "../utils/calculations";

const STEP_LABELS = ["Date personale", "Obiectiv & activitate", "Sumar"];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function ProfileSetup({ onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sex: "F",
    age: "",
    height: "",
    weight: "",
    targetWeight: "",
    activityLevel: "sedentary",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canNext0 = form.sex && form.age && form.height && form.weight;
  const canNext1 = form.targetWeight && form.activityLevel;

  const bmr = canNext0
    ? calcBMR(form.sex, Number(form.age), Number(form.height), Number(form.weight))
    : 0;
  const tdee = bmr ? calcTDEE(bmr, form.activityLevel) : 0;
  const budget = tdee ? Math.max(1200, tdee - 500) : 0;
  const dailyDeficit = tdee - budget;
  const pred14 = predictLossKg(dailyDeficit, 14);
  const weightDiff = form.weight && form.targetWeight
    ? Number(form.weight) - Number(form.targetWeight)
    : 0;
  const weeksNeeded = dailyDeficit > 0 && weightDiff > 0
    ? Math.ceil((weightDiff * 7700) / (dailyDeficit * 7))
    : null;

  const handleSave = async () => {
    setSaving(true);
    const uid = auth.currentUser?.uid;
    if (!uid) { alert("Nu ești autentificat!"); setSaving(false); return; }
    const today = formatDateStr();
    const endDate = formatDateStr(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    try {
      await setDoc(doc(db, "users", uid, "profile", "data"), {
        sex: form.sex,
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
        activityLevel: form.activityLevel,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      await addDoc(collection(db, "users", uid, "objectives"), {
        startDate: today,
        endDate,
        startWeight: Number(form.weight),
        targetWeight: Number(form.targetWeight),
        createdAt: Timestamp.now(),
      });
      onDone();
    } catch (err) {
      alert("Eroare la salvare: " + err.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Progress */}
        <div className="flex">
          {STEP_LABELS.map((l, i) => (
            <div key={i}
              className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors ${
                i === step ? "bg-teal-600 text-white"
                : i < step  ? "bg-teal-100 text-teal-700"
                : "bg-gray-50 text-gray-400"
              }`}>
              {i < step ? "✓ " : `${i + 1}. `}{l}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* STEP 0 — Date personale */}
          {step === 0 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Bun venit! 👋</h2>
                <p className="text-sm text-gray-500 mt-1">Completează profilul pentru tracking personalizat.</p>
              </div>

              <Field label="Sex">
                <div className="flex gap-3">
                  {["F", "M"].map((s) => (
                    <button key={s} onClick={() => set("sex", s)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        form.sex === s
                          ? "border-teal-500 bg-teal-50 text-teal-800"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>
                      {s === "F" ? "👩 Femeie" : "👨 Bărbat"}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Vârstă (ani)">
                <input type="number" min="10" max="100"
                  value={form.age} onChange={(e) => set("age", e.target.value)}
                  placeholder="ex. 30"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Înălțime (cm)">
                  <input type="number" min="100" max="250"
                    value={form.height} onChange={(e) => set("height", e.target.value)}
                    placeholder="ex. 165"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
                </Field>
                <Field label="Greutate curentă (kg)">
                  <input type="number" min="30" max="300" step="0.1"
                    value={form.weight} onChange={(e) => set("weight", e.target.value)}
                    placeholder="ex. 75"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
                </Field>
              </div>

              <button disabled={!canNext0} onClick={() => setStep(1)}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
                Continuă →
              </button>
            </>
          )}

          {/* STEP 1 — Obiectiv & activitate */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Primul tău obiectiv</h2>
                <p className="text-sm text-gray-500 mt-1">Setează un obiectiv de 14 zile. Poți schimba oricând.</p>
              </div>

              <Field label="Greutatea dorită (kg)">
                <input type="number" min="30" max="300" step="0.1"
                  value={form.targetWeight} onChange={(e) => set("targetWeight", e.target.value)}
                  placeholder="ex. 65"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
                {form.targetWeight && form.weight && (
                  <p className="text-xs text-teal-600 mt-1.5 font-medium">
                    Ai de {weightDiff > 0 ? "slăbit" : "luat în greutate"} {Math.abs(weightDiff).toFixed(1)} kg
                  </p>
                )}
              </Field>

              <Field label="Nivel activitate fizică (fără pași)">
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map((l) => (
                    <button key={l.value} onClick={() => set("activityLevel", l.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                        form.activityLevel === l.value
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{l.label}</p>
                        <p className="text-xs text-gray-500">{l.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                  ← Înapoi
                </button>
                <button disabled={!canNext1} onClick={() => setStep(2)}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
                  Vezi sumar →
                </button>
              </div>
            </>
          )}

          {/* STEP 2 — Sumar */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Planul tău personalizat</h2>
                <p className="text-sm text-gray-500 mt-1">Bazat pe datele introduse:</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Metabolism bazal</p>
                    <p className="text-2xl font-bold text-gray-800">{bmr}</p>
                    <p className="text-xs text-gray-400">kcal/zi</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Necesar zilnic</p>
                    <p className="text-2xl font-bold text-gray-800">{tdee}</p>
                    <p className="text-xs text-gray-400">kcal/zi</p>
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-teal-600 mb-1">Budget caloric recomandat</p>
                  <p className="text-3xl font-bold text-teal-800">{budget} <span className="text-base font-normal">kcal/zi</span></p>
                  <p className="text-xs text-teal-600 mt-1">Deficit de {dailyDeficit} kcal/zi față de necesar</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-600 mb-2">Predicție — 14 zile</p>
                  <p className="text-3xl font-bold text-emerald-800">-{pred14.toFixed(1)} kg</p>
                  <p className="text-xs text-emerald-600 mt-1">Dacă mănânci ~{budget} kcal/zi și urmezi planul Vitalis</p>
                  {weeksNeeded && (
                    <p className="text-xs text-emerald-700 mt-2 font-medium">
                      La acest ritm, ajungi la obiectiv în ~{weeksNeeded} săptămâni
                    </p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                  Obiectivul durează 14 zile. La final poți seta unul nou cu o nouă greutate țintă.
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                  ← Înapoi
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors">
                  {saving ? "Se salvează..." : "🚀 Începe tracking-ul"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
