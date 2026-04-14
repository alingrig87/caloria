import { useState, useEffect } from "react";
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, where, orderBy, getDocs, onSnapshot, Timestamp, limit,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  calcBMR, calcTDEE, calcStepsCalories,
  deficitToGrams, predictLossKg, daysSince, formatDateStr, ACTIVITY_LEVELS,
} from "../utils/calculations";

// ─── helpers ──────────────────────────────────────────────
function Bar({ pct, color = "bg-teal-500" }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

/** Calculează greutatea estimată din istoricul caloric real */
function useEstimatedWeight(profile, bmr) {
  const [estWeight, setEstWeight] = useState(null);
  const [dayData, setDayData] = useState([]); // [{date, eaten, burned, deficit}]
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !profile?.cycleStartDate) return;
    setLoading(true);

    const daysElapsed = daysSince(profile.cycleStartDate);
    const numDays = Math.max(1, Math.min(daysElapsed + 1, 14));

    // Build list of dates from cycle start to today
    const dates = Array.from({ length: numDays }, (_, i) => {
      const d = new Date(profile.cycleStartDate);
      d.setDate(d.getDate() + i);
      return formatDateStr(d);
    });

    // Fetch activities for the date range
    const activitiesPromise = getDocs(query(
      collection(db, "users", uid, "activities"),
      where("date", ">=", dates[0]),
      where("date", "<=", dates[dates.length - 1])
    )).then((snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const a = d.data();
        map[a.date] = (map[a.date] || 0) + (a.caloriesBurned || 0);
      });
      return map;
    }).catch(() => ({})); // silently ignore index errors

    Promise.all([
      activitiesPromise,
      // meals per day
      ...dates.map((date) =>
        getDocs(query(collection(db, "users", uid, "meals"), where("date", "==", date)))
          .then((snap) => ({ date, eaten: snap.docs.reduce((s, d) => s + (d.data().kcal || 0), 0) }))
      ),
      // daily logs (steps) per day
      ...dates.map((date) =>
        getDoc(doc(db, "users", uid, "dailyLogs", date))
          .then((snap) => ({ date, steps: snap.exists() ? (snap.data().steps || 0) : 0 }))
      ),
    ]).then(([activityMap, ...rest]) => {
      const mealMap = {};
      const stepsMap = {};
      rest.forEach((r) => {
        if ("eaten" in r) mealMap[r.date] = r.eaten;
        if ("steps" in r) stepsMap[r.date] = r.steps;
      });

      const days = dates.map((date) => {
        const eaten = mealMap[date] || 0;
        const stepsKcal = calcStepsCalories(stepsMap[date] || 0, profile.weight);
        const activityKcal = activityMap[date] || 0;
        const burned = bmr + stepsKcal + activityKcal;
        // Dacă nu s-a logat nimic, presupunem că s-a mâncat la budget (conservator)
        const budget = Math.max(1200, calcTDEE(bmr, profile.activityLevel) - 500);
        const effectiveEaten = eaten > 0 ? eaten : budget;
        const deficit = burned - effectiveEaten;
        return { date, eaten, burned, deficit, logged: eaten > 0 };
      });

      const totalDeficit = days.reduce((s, d) => s + d.deficit, 0);
      const lostKg = totalDeficit / 7700;
      const estimated = Math.max(
        profile.targetWeight,
        parseFloat((profile.cycleStartWeight - lostKg).toFixed(2))
      );

      setDayData(days);
      setEstWeight(estimated);
      setLoading(false);
    });
  }, [uid, profile, bmr]);

  return { estWeight, dayData, loading };
}

function weightScaleColor(estWeight, startWeight, targetWeight) {
  const progress = startWeight - estWeight;
  const total = startWeight - targetWeight;
  const pct = total > 0 ? progress / total : 0;
  if (pct >= 0.5) return "from-emerald-500 to-teal-600";
  if (pct >= 0.2) return "from-teal-500 to-cyan-600";
  return "from-cyan-500 to-blue-600";
}

function nextWeighInDays(dayData) {
  // Recomandare: cantareste la fiecare 5 zile
  const loggedDays = dayData.filter((d) => d.logged).length;
  if (loggedDays < 3) return { days: null, msg: "Loghează cel puțin 3 zile pentru o recomandare precisă" };
  const lastIdx = dayData.reduce((best, d, i) => d.logged ? i : best, -1);
  const daysSinceLast = dayData.length - 1 - lastIdx;
  const daysUntil = Math.max(0, 5 - daysSinceLast);
  if (daysUntil === 0) return { days: 0, msg: "Acum e momentul perfect să te cântărești! 🎯" };
  return { days: daysUntil, msg: `Cântărește-te în ${daysUntil} ${daysUntil === 1 ? "zi" : "zile"}` };
}

// ─── Check-in modal ───────────────────────────────────────
function CheckInModal({ profile, bmr, tdee, onClose, onDone }) {
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const actualLoss = weight ? (profile.cycleStartWeight - Number(weight)).toFixed(1) : null;
  const dailyDeficit = Math.max(0, tdee - Math.max(1200, tdee - 500));
  const theoreticalLoss = predictLossKg(dailyDeficit, 14).toFixed(1);

  const handleSave = async () => {
    if (!weight) return;
    setSaving(true);
    const uid = auth.currentUser.uid;
    const today = formatDateStr();
    await addDoc(collection(db, "users", uid, "checkIns"), {
      date: today,
      cycleStartDate: profile.cycleStartDate,
      cycleStartWeight: profile.cycleStartWeight,
      currentWeight: Number(weight),
      theoreticalLoss: Number(theoreticalLoss),
      actualLoss: Number(actualLoss),
      notes: note.trim() || null,
      createdAt: Timestamp.now(),
    });
    await updateDoc(doc(db, "users", uid, "profile", "data"), {
      weight: Number(weight),
      cycleStartDate: today,
      cycleStartWeight: Number(weight),
      updatedAt: Timestamp.now(),
    });
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Check-in — 14 zile</h3>
          <p className="text-sm text-gray-500 mt-1">
            Start: <strong>{profile.cycleStartWeight} kg</strong> pe{" "}
            {new Date(profile.cycleStartDate).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-semibold mb-1">Predicție teoretică</p>
          <p className="text-2xl font-bold text-emerald-800">-{theoreticalLoss} kg</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Greutatea actuală (kg)</label>
          <input type="number" step="0.1" min="30" max="300" value={weight}
            onChange={(e) => setWeight(e.target.value)} placeholder="ex. 73.5"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
          {actualLoss !== null && (
            <p className={`text-sm font-bold mt-1.5 ${Number(actualLoss) >= 0 ? "text-teal-700" : "text-red-500"}`}>
              {Number(actualLoss) >= 0 ? `Ai slăbit ${actualLoss} kg` : `Ai luat ${Math.abs(Number(actualLoss))} kg`}
              {" "}{Number(actualLoss) >= Number(theoreticalLoss) ? "🎉" : Number(actualLoss) >= 0 ? "— continuă!" : "— revizuiește"}
            </p>
          )}
        </div>
        <textarea placeholder="Note opționale..." value={note} onChange={(e) => setNote(e.target.value)}
          rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400 resize-none" />
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Anulează</button>
          <button onClick={handleSave} disabled={!weight || saving}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl transition-colors">
            {saving ? "Se salvează..." : "Salvează & reset ciclu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit profile modal ───────────────────────────────────
function EditProfileModal({ profile, onClose, onDone }) {
  const [form, setForm] = useState({
    weight: String(profile.weight),
    targetWeight: String(profile.targetWeight),
    activityLevel: profile.activityLevel,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const uid = auth.currentUser.uid;
    await updateDoc(doc(db, "users", uid, "profile", "data"), {
      weight: Number(form.weight),
      targetWeight: Number(form.targetWeight),
      activityLevel: form.activityLevel,
      updatedAt: Timestamp.now(),
    });
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Actualizează profilul</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Greutate curentă (kg)</label>
          <input type="number" step="0.1" value={form.weight} onChange={(e) => set("weight", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Greutate țintă (kg)</label>
          <input type="number" step="0.1" value={form.targetWeight} onChange={(e) => set("targetWeight", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nivel activitate</label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((l) => (
              <button key={l.value} onClick={() => set("activityLevel", l.value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-colors ${
                  form.activityLevel === l.value ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{l.label}</p>
                  <p className="text-xs text-gray-500">{l.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Anulează</button>
          <button onClick={handleSave} disabled={saving || !form.weight || !form.targetWeight}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl transition-colors">
            {saving ? "Se salvează..." : "Salvează"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function ProfileTab({ profile, onProfileUpdate }) {
  const [dailyLog, setDailyLog] = useState({ steps: 0 });
  const [stepsInput, setStepsInput] = useState("");
  const [todayKcal, setTodayKcal] = useState(0);
  const [checkIns, setCheckIns] = useState([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);

  const today = formatDateStr();
  const uid = auth.currentUser?.uid;

  const bmr = calcBMR(profile.sex, profile.age, profile.height, profile.weight);
  const tdee = calcTDEE(bmr, profile.activityLevel);
  const budget = Math.max(1200, tdee - 500);

  const { estWeight, dayData, loading: estLoading } = useEstimatedWeight(profile, bmr);

  const steps = dailyLog.steps || 0;
  const stepsKcal = calcStepsCalories(steps, profile.weight);
  const totalBurned = bmr + stepsKcal;
  const netDeficit = totalBurned - todayKcal;
  const todayGrams = deficitToGrams(netDeficit);

  const daysElapsed = daysSince(profile.cycleStartDate);
  const cycleDay = Math.min(daysElapsed + 1, 14);
  const isCheckInDue = daysElapsed >= 14;

  const weighIn = nextWeighInDays(dayData);
  const gradClass = estWeight
    ? weightScaleColor(estWeight, profile.cycleStartWeight, profile.targetWeight)
    : "from-teal-500 to-teal-700";

  const lostSoFar = estWeight ? (profile.cycleStartWeight - estWeight) : 0;
  const progressPct = profile.cycleStartWeight > profile.targetWeight
    ? Math.min(100, (lostSoFar / (profile.cycleStartWeight - profile.targetWeight)) * 100)
    : 0;

  const loggedDays = dayData.filter((d) => d.logged).length;

  // Load daily log
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid, "dailyLogs", today)).then((snap) => {
      if (snap.exists()) { setDailyLog(snap.data()); setStepsInput(String(snap.data().steps || "")); }
    });
  }, [uid, today]);

  // Today's kcal live
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "users", uid, "meals"), where("date", "==", today));
    return onSnapshot(q, (snap) => {
      setTodayKcal(snap.docs.reduce((s, d) => s + (d.data().kcal || 0), 0));
    });
  }, [uid, today]);

  // Check-ins
  useEffect(() => {
    if (!uid) return;
    getDocs(query(collection(db, "users", uid, "checkIns"), orderBy("createdAt", "desc")))
      .then((snap) => setCheckIns(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [uid]);

  const saveSteps = async () => {
    if (stepsInput === "") return;
    setSavingSteps(true);
    await setDoc(doc(db, "users", uid, "dailyLogs", today), { steps: Number(stepsInput), updatedAt: Timestamp.now() }, { merge: true });
    setDailyLog((d) => ({ ...d, steps: Number(stepsInput) }));
    setSavingSteps(false);
  };

  return (
    <div className="space-y-5">
      {/* ── CHECK-IN BANNER ─────────────────────────────── */}
      {isCheckInDue && (
        <div className="bg-emerald-500 text-white rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold">14 zile s-au încheiat! 🎯</p>
            <p className="text-xs text-emerald-100 mt-0.5">Înregistrează greutatea pentru a vedea progresul real</p>
          </div>
          <button onClick={() => setShowCheckIn(true)}
            className="bg-white text-emerald-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-emerald-50 shrink-0 ml-3">
            Check-in
          </button>
        </div>
      )}

      {/* ── HERO — GREUTATE ESTIMATĂ ─────────────────────── */}
      <div className={`bg-gradient-to-br ${gradClass} text-white rounded-2xl p-6 shadow-lg`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">Greutate estimată acum</p>
            {estLoading ? (
              <div className="text-5xl font-black tracking-tight">...</div>
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-6xl font-black tracking-tight leading-none">
                  {estWeight?.toFixed(1)}
                </span>
                <span className="text-2xl font-bold mb-1 text-white/80">kg</span>
              </div>
            )}
            {!estLoading && lostSoFar > 0.01 && (
              <p className="text-sm text-white/80 mt-1.5 font-medium">
                ↓ {lostSoFar.toFixed(2)} kg față de start
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60 mb-1">Obiectiv</p>
            <p className="text-2xl font-bold">{profile.targetWeight} kg</p>
            <p className="text-xs text-white/60 mt-1">
              {(estWeight - profile.targetWeight) > 0
                ? `mai ${(estWeight - profile.targetWeight).toFixed(1)} kg de slăbit`
                : "obiectiv atins! 🎉"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/60 mb-1.5">
            <span>Start: {profile.cycleStartWeight} kg</span>
            <span>{progressPct.toFixed(0)}% din obiectiv</span>
            <span>Țintă: {profile.targetWeight} kg</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full bg-white transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(2, progressPct))}%` }} />
          </div>
        </div>

        {/* Weigh-in recommendation */}
        <div className="bg-white/15 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {weighIn.days === 0 ? "Cântărește-te azi!" : weighIn.msg}
            </p>
            <p className="text-xs text-white/70 mt-0.5">
              {loggedDays > 0
                ? `Bazat pe ${loggedDays} ${loggedDays === 1 ? "zi" : "zile"} de date — dimineața, pe stomacul gol`
                : "Adaugă mese zilnic pentru o estimare mai precisă"}
            </p>
          </div>
          {weighIn.days === 0 && (
            <div className="bg-white text-teal-700 text-xs font-bold px-2 py-1 rounded-lg animate-pulse">
              AZI
            </div>
          )}
        </div>
      </div>

      {/* ── AZI ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-bold text-gray-800">
          Azi — {new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
        </h3>

        {/* Steps */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pași parcurși azi</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input type="number" min="0" max="100000" value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)} onBlur={saveSteps}
                placeholder="ex. 8500"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400 pr-16" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">pași</span>
            </div>
            <button onClick={saveSteps} disabled={savingSteps}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 text-white px-4 rounded-xl text-sm font-semibold transition-colors">
              {savingSteps ? "..." : "OK"}
            </button>
          </div>
          {steps > 0 && (
            <p className="text-xs text-teal-600 mt-1.5">
              {steps.toLocaleString()} pași → +{stepsKcal} kcal arse suplimentar
            </p>
          )}
        </div>

        {/* Calorie summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Mâncat</p>
            <p className="text-xl font-bold text-gray-800">{todayKcal || "—"}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Ars</p>
            <p className="text-xl font-bold text-gray-800">{totalBurned}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${netDeficit >= 0 ? "bg-emerald-50" : "bg-amber-50"}`}>
            <p className="text-xs text-gray-400 mb-0.5">{netDeficit >= 0 ? "Deficit" : "Surplus"}</p>
            <p className={`text-xl font-bold ${netDeficit >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
              {Math.abs(netDeficit)}
            </p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
        </div>

        {/* Interpretation */}
        <div className={`rounded-xl px-4 py-3 text-sm ${netDeficit > 0 ? "bg-emerald-50 border border-emerald-100" : todayKcal === 0 ? "bg-gray-50" : "bg-amber-50 border border-amber-100"}`}>
          {todayKcal === 0 ? (
            <p className="text-gray-400 text-xs">Adaugă mese în Jurnal pentru a vedea bilanțul caloric al zilei.</p>
          ) : netDeficit > 0 ? (
            <p className="text-emerald-800">
              Azi ai slăbit teoretic <strong>{todayGrams}g</strong> de grăsime.
              {steps > 0 && ` ${Math.round(stepsKcal / 7.7)}g datorită celor ${steps.toLocaleString()} pași.`}
            </p>
          ) : (
            <p className="text-amber-800">
              Azi ai consumat cu <strong>{Math.abs(netDeficit)} kcal</strong> mai mult decât ai ars.
              O plimbare de 30 min ar arde ~{Math.round(calcStepsCalories(3500, profile.weight))} kcal.
            </p>
          )}
        </div>
      </div>

      {/* ── CICLU 14 ZILE ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Ciclul curent — 14 zile</h3>
          <span className="text-xs bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-full">Ziua {cycleDay}/14</span>
        </div>

        <Bar pct={(cycleDay / 14) * 100} />

        {/* Day-by-day mini calendar */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }, (_, i) => {
            const d = dayData[i];
            const isPast = i < daysElapsed;
            const isToday = i === daysElapsed;
            const isFuture = i > daysElapsed;
            const logged = d?.logged;
            return (
              <div key={i}
                className={`rounded-lg p-1.5 text-center text-xs font-bold transition-colors ${
                  isFuture ? "bg-gray-50 text-gray-300"
                  : isToday ? "bg-teal-600 text-white"
                  : logged ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-50 text-amber-400"
                }`}
                title={d ? `${d.date}: ${d.logged ? d.eaten + " kcal mâncate" : "nelogat"}` : ""}
              >
                <div>{i + 1}</div>
                {!isFuture && <div className="text-[9px] mt-0.5 opacity-80">
                  {isToday ? "azi" : logged ? "✓" : "—"}
                </div>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 inline-block" />logat</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-200 inline-block" />nelogat</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />azi</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-100 inline-block" />urmează</span>
        </div>

        {!isCheckInDue && (
          <p className="text-xs text-gray-400 text-center pt-1">
            Check-in disponibil în <strong>{14 - daysElapsed} {14 - daysElapsed === 1 ? "zi" : "zile"}</strong> — pregătește-te să te cântărești dimineața!
          </p>
        )}
      </div>

      {/* ── PROFIL ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">{auth.currentUser?.displayName?.split(" ")[0]} · Profil</h3>
            <p className="text-xs text-gray-400">{profile.sex === "F" ? "Femeie" : "Bărbat"} · {profile.age} ani · {profile.height} cm</p>
          </div>
          <button onClick={() => setShowEdit(true)}
            className="text-xs text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50">
            Editează
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "BMR", value: bmr, unit: "kcal/zi" },
            { label: "TDEE", value: tdee, unit: "kcal/zi" },
            { label: "Budget", value: budget, unit: "kcal/zi", accent: true },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 ${s.accent ? "bg-teal-50" : "bg-gray-50"}`}>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ISTORIC CHECK-IN ────────────────────────────── */}
      {checkIns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-gray-800">Istoric check-in-uri</h3>
          <div className="space-y-2">
            {checkIns.map((ci) => (
              <div key={ci.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(ci.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {ci.notes && <p className="text-xs text-gray-500 italic mt-0.5">{ci.notes}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${ci.actualLoss >= 0 ? "text-emerald-700" : "text-red-500"}`}>
                    {ci.actualLoss >= 0 ? "-" : "+"}{Math.abs(ci.actualLoss).toFixed(1)} kg
                  </p>
                  <p className="text-xs text-gray-400">real vs -{ci.theoreticalLoss.toFixed(1)} teoretic</p>
                </div>
                <div className="text-xl">
                  {ci.actualLoss >= ci.theoreticalLoss ? "🎉" : ci.actualLoss >= 0 ? "✅" : "📉"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCheckIn && (
        <CheckInModal profile={profile} bmr={bmr} tdee={tdee}
          onClose={() => setShowCheckIn(false)} onDone={onProfileUpdate} />
      )}
      {showEdit && (
        <EditProfileModal profile={profile}
          onClose={() => setShowEdit(false)} onDone={onProfileUpdate} />
      )}
    </div>
  );
}
