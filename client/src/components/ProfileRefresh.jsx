import { useState } from "react";
import { doc, setDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  calcBMR, calcTDEE, predictLossKg, ACTIVITY_LEVELS, formatDateStr,
} from "../utils/calculations";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function ProfileRefresh({ profile, onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    weight: String(profile.weight ?? ""),
    targetWeight: "",
    activityLevel: profile.activityLevel ?? "sedentary",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = form.weight && form.targetWeight;

  const bmr = form.weight
    ? calcBMR(profile.sex, profile.age, profile.height, Number(form.weight))
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
    const uid = auth.currentUser.uid;
    const today = formatDateStr();
    const endDate = formatDateStr(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

    await setDoc(doc(db, "users", uid, "profile", "data"), {
      ...profile,
      weight: Number(form.weight),
      activityLevel: form.activityLevel,
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
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Check-in de 2 săptămâni</p>
          <h2 className="text-xl font-bold">Cum mai ești? 👋</h2>
          <p className="text-sm opacity-80 mt-1">Au trecut 14 zile — actualizează-ți datele pentru un nou ciclu.</p>
        </div>

        <div className="p-6 space-y-5">
          {step === 0 && (
            <>
              {/* Read-only summary of unchanged data */}
              <div className="flex gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                <span>{profile.sex === "F" ? "👩 Femeie" : "👨 Bărbat"}</span>
                <span>·</span>
                <span>{profile.age} ani</span>
                <span>·</span>
                <span>{profile.height} cm</span>
              </div>

              <Field label="Greutate actuală (kg)">
                <input
                  type="number" min="30" max="300" step="0.1"
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  placeholder="ex. 73"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400"
                />
                {form.weight && profile.weight && Number(form.weight) !== profile.weight && (
                  <p className={`text-xs mt-1.5 font-medium ${Number(form.weight) < profile.weight ? "text-teal-600" : "text-amber-600"}`}>
                    {Number(form.weight) < profile.weight
                      ? `▼ Ai slăbit ${(profile.weight - Number(form.weight)).toFixed(1)} kg față de ultimul check-in`
                      : `▲ Ai luat ${(Number(form.weight) - profile.weight).toFixed(1)} kg față de ultimul check-in`}
                  </p>
                )}
              </Field>

              <Field label="Greutatea dorită (kg)">
                <input
                  type="number" min="30" max="300" step="0.1"
                  value={form.targetWeight}
                  onChange={(e) => set("targetWeight", e.target.value)}
                  placeholder="ex. 70"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400"
                />
              </Field>

              <Field label="Nivel activitate fizică">
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

              <button disabled={!canNext} onClick={() => setStep(1)}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
                Vezi noul plan →
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Planul tău actualizat</h2>
                <p className="text-sm text-gray-500 mt-1">Bazat pe datele noi:</p>
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
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                  ← Înapoi
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors">
                  {saving ? "Se salvează..." : "🚀 Începe noul ciclu"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
