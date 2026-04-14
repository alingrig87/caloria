import { useState, useEffect } from "react";
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, orderBy, onSnapshot, Timestamp, where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  calcBMR, calcTDEE, calcStepsCalories,
  deficitToGrams, predictLossKg, daysSince, formatDateStr, ACTIVITY_LEVELS,
} from "../utils/calculations";
import { useEstimatedWeight } from "../hooks/useEstimatedWeight";

function Bar({ pct, color = "bg-teal-500" }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

// ── Weight Progress Chart ──────────────────────────────────
function WeightChart({ dayData, startWeight, targetWeight }) {
  if (!dayData || dayData.length === 0) return null;

  // Build estimated weight per logged day
  let running = startWeight;
  const points = dayData.map((d, i) => {
    const loss = d.deficit / 7700;
    running = running - loss;
    return { i, weight: parseFloat(running.toFixed(2)), logged: d.logged, date: d.date };
  });

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights, targetWeight) - 0.3;
  const maxW = Math.max(...weights, startWeight) + 0.3;
  const range = maxW - minW || 1;

  const W = 300;
  const H = 100;
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xOf = (i) => padL + (i / Math.max(points.length - 1, 1)) * chartW;
  const yOf = (w) => padT + ((maxW - w) / range) * chartH;

  const pathD = points.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${yOf(p.weight).toFixed(1)}`
  ).join(" ");

  const targetY = yOf(targetWeight);
  const startY = yOf(startWeight);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 220 }}>
        {/* Target line */}
        <line x1={padL} y1={targetY} x2={W - padR} y2={targetY}
          stroke="#10b981" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        <text x={padL - 2} y={targetY + 4} fontSize="7" fill="#10b981" textAnchor="end">{targetWeight}</text>

        {/* Start line */}
        <line x1={padL} y1={startY} x2={W - padR} y2={startY}
          stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
        <text x={padL - 2} y={startY + 4} fontSize="7" fill="#94a3b8" textAnchor="end">{startWeight}</text>

        {/* Area fill */}
        <path d={`${pathD} L ${xOf(points.length - 1).toFixed(1)} ${padT + chartH} L ${padL} ${padT + chartH} Z`}
          fill="url(#wGrad)" opacity="0.15" />

        {/* Gradient */}
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Line */}
        <path d={pathD} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p) => (
          <circle key={p.i} cx={xOf(p.i)} cy={yOf(p.weight)} r="3"
            fill={p.logged ? "#14b8a6" : "#cbd5e1"} stroke="white" strokeWidth="1.5" />
        ))}

        {/* X axis day labels */}
        {points.filter((_, i) => i % 2 === 0).map((p) => (
          <text key={p.i} x={xOf(p.i)} y={H - 4} fontSize="7" fill="#94a3b8" textAnchor="middle">
            {p.i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
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
  const loggedDays = dayData.filter((d) => d.logged).length;
  if (loggedDays < 3) return { days: null, msg: "Loghează cel puțin 3 zile pentru o recomandare" };
  const lastIdx = dayData.reduce((best, d, i) => d.logged ? i : best, -1);
  const daysSinceLast = dayData.length - 1 - lastIdx;
  const daysUntil = Math.max(0, 5 - daysSinceLast);
  if (daysUntil === 0) return { days: 0, msg: "Acum e momentul perfect să te cântărești! 🎯" };
  return { days: daysUntil, msg: `Cântărește-te în ${daysUntil} ${daysUntil === 1 ? "zi" : "zile"}` };
}

// ── Add Objective Modal ────────────────────────────────────
function AddObjectiveModal({ profile, onClose }) {
  const [currentWeight, setCurrentWeight] = useState(String(profile.weight));
  const [targetWeight, setTargetWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const cw = Number(currentWeight);
  const tw = Number(targetWeight);
  const weightDiff = cw && tw ? (cw - tw) : 0;

  const bmr = cw ? calcBMR(profile.sex, profile.age, profile.height, cw) : 0;
  const tdee = bmr ? calcTDEE(bmr, profile.activityLevel) : 0;
  const budget = tdee ? Math.max(1200, tdee - 500) : 0;
  const pred14 = budget ? predictLossKg(tdee - budget, 14) : 0;

  const handleSave = async () => {
    if (!targetWeight || !currentWeight) return;
    setSaving(true);
    const uid = auth.currentUser.uid;
    const today = formatDateStr();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    const endDate = formatDateStr(end);

    await addDoc(collection(db, "users", uid, "objectives"), {
      startDate: today,
      endDate,
      startWeight: cw,
      targetWeight: tw,
      createdAt: Timestamp.now(),
    });

    // Update profile weight if it changed
    if (cw !== profile.weight) {
      await updateDoc(doc(db, "users", uid, "profile", "data"), {
        weight: cw,
        updatedAt: Timestamp.now(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">🎯 Obiectiv nou — 14 zile</h3>
          <p className="text-xs text-gray-400 mt-1">Va dura 14 zile de la data de azi</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Greutatea actuală (kg)</label>
          <input type="number" step="0.1" min="30" max="300"
            value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Greutatea țintă (kg)</label>
          <input type="number" step="0.1" min="30" max="300"
            value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="ex. 73"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400" />
          {weightDiff > 0 && (
            <p className="text-xs text-teal-600 mt-1.5 font-medium">
              Ai de slăbit {weightDiff.toFixed(1)} kg în 14 zile
            </p>
          )}
        </div>

        {budget > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-emerald-700">La {budget} kcal/zi poți slăbi teoretic:</p>
            <p className="text-xl font-bold text-emerald-800">~{pred14.toFixed(1)} kg în 14 zile</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            Anulează
          </button>
          <button onClick={handleSave} disabled={!targetWeight || !currentWeight || saving}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
            {saving ? "Se salvează..." : "🎯 Setează obiectiv"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ─────────────────────────────────────
function EditProfileModal({ profile, onClose }) {
  const [form, setForm] = useState({
    weight: String(profile.weight),
    activityLevel: profile.activityLevel,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const uid = auth.currentUser.uid;
    await updateDoc(doc(db, "users", uid, "profile", "data"), {
      weight: Number(form.weight),
      activityLevel: form.activityLevel,
      updatedAt: Timestamp.now(),
    });
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
          <button onClick={handleSave} disabled={saving || !form.weight}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl transition-colors">
            {saving ? "Se salvează..." : "Salvează"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────
export default function ProfileTab({ profile, onProfileUpdate }) {
  const [objectives, setObjectives] = useState([]);
  const [objLoading, setObjLoading] = useState(true);
  const [dailyLog, setDailyLog] = useState({ steps: 0, water: 0 });
  const [stepsInput, setStepsInput] = useState("");
  const [todayKcal, setTodayKcal] = useState(0);
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);
  const [savingWater, setSavingWater] = useState(false);

  const today = formatDateStr();
  const uid = auth.currentUser?.uid;

  const bmr = calcBMR(profile.sex, profile.age, profile.height, profile.weight);
  const tdee = calcTDEE(bmr, profile.activityLevel);
  const budget = Math.max(1200, tdee - 500);

  // Load objectives (real-time)
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "users", uid, "objectives"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setObjectives(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setObjLoading(false);
    });
  }, [uid]);

  const activeObjective = objectives.find((o) => o.endDate >= today);
  const expiredObjectives = objectives.filter((o) => o.endDate < today);
  const justExpired = !activeObjective && expiredObjectives.length > 0 && daysSince(expiredObjectives[0].endDate) <= 3;

  const { estWeight, dayData, loading: estLoading } = useEstimatedWeight(profile, bmr, activeObjective);

  const steps = dailyLog.steps || 0;
  const stepsKcal = calcStepsCalories(steps, profile.weight);
  const totalBurned = bmr + stepsKcal;
  const netDeficit = totalBurned - todayKcal;
  const todayGrams = deficitToGrams(netDeficit);

  const daysElapsed = activeObjective ? daysSince(activeObjective.startDate) : 0;
  const cycleDay = Math.min(daysElapsed + 1, 14);

  const lostSoFar = estWeight && activeObjective ? (activeObjective.startWeight - estWeight) : 0;
  const progressPct = activeObjective && activeObjective.startWeight > activeObjective.targetWeight
    ? Math.min(100, (lostSoFar / (activeObjective.startWeight - activeObjective.targetWeight)) * 100)
    : 0;

  const gradClass = estWeight && activeObjective
    ? weightScaleColor(estWeight, activeObjective.startWeight, activeObjective.targetWeight)
    : "from-teal-500 to-teal-700";

  const weighIn = nextWeighInDays(dayData);
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

  const saveSteps = async () => {
    if (stepsInput === "") return;
    setSavingSteps(true);
    await setDoc(doc(db, "users", uid, "dailyLogs", today), { steps: Number(stepsInput), updatedAt: Timestamp.now() }, { merge: true });
    setDailyLog((d) => ({ ...d, steps: Number(stepsInput) }));
    setSavingSteps(false);
  };

  const water = dailyLog.water || 0;
  const addWater = async (delta) => {
    const next = Math.max(0, water + delta);
    setSavingWater(true);
    await setDoc(doc(db, "users", uid, "dailyLogs", today), { water: next, updatedAt: Timestamp.now() }, { merge: true });
    setDailyLog((d) => ({ ...d, water: next }));
    setSavingWater(false);
  };

  if (objLoading) {
    return <div className="py-12 text-center text-gray-400 text-sm">Se încarcă...</div>;
  }

  return (
    <div className="space-y-5">

      {/* ── HERO / NO OBJECTIVE ─────────────────────────── */}
      {activeObjective ? (
        <div className={`bg-gradient-to-br ${gradClass} text-white rounded-2xl p-6 shadow-lg`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">Greutate estimată</p>
              {estLoading ? (
                <div className="text-5xl font-black tracking-tight">...</div>
              ) : (
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black tracking-tight leading-none">{estWeight?.toFixed(1)}</span>
                  <span className="text-2xl font-bold mb-1 text-white/80">kg</span>
                </div>
              )}
              {!estLoading && lostSoFar > 0.01 && (
                <p className="text-sm text-white/80 mt-1.5 font-medium">↓ {lostSoFar.toFixed(2)} kg față de start</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60 mb-1">Țintă obiectiv</p>
              <p className="text-2xl font-bold">{activeObjective.targetWeight} kg</p>
              <p className="text-xs text-white/60 mt-1">
                {(estWeight - activeObjective.targetWeight) > 0.05
                  ? `mai ${(estWeight - activeObjective.targetWeight).toFixed(1)} kg`
                  : "obiectiv atins! 🎉"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>Start: {activeObjective.startWeight} kg</span>
              <span>{progressPct.toFixed(0)}% din obiectiv</span>
              <span>Țintă: {activeObjective.targetWeight} kg</span>
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
              <p className="text-sm font-bold">{weighIn.days === 0 ? "Cântărește-te azi!" : weighIn.msg}</p>
              <p className="text-xs text-white/70 mt-0.5">
                {loggedDays > 0
                  ? `Bazat pe ${loggedDays} ${loggedDays === 1 ? "zi" : "zile"} de date`
                  : "Adaugă mese zilnic pentru o estimare mai precisă"}
              </p>
            </div>
            {weighIn.days === 0 && (
              <div className="bg-white text-teal-700 text-xs font-bold px-2 py-1 rounded-lg animate-pulse">AZI</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-4">
          {justExpired && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-2">
              <p className="text-sm font-semibold text-emerald-700">
                🎉 Obiectivul anterior s-a încheiat!
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Start: {expiredObjectives[0].startWeight} kg → Țintă: {expiredObjectives[0].targetWeight} kg
              </p>
            </div>
          )}
          <div className="text-5xl">🎯</div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Niciun obiectiv activ</h3>
            <p className="text-sm text-gray-500 mt-1">Setează un obiectiv de 14 zile pentru a urmări progresul tău zilnic.</p>
          </div>
          <button onClick={() => setShowAddObjective(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            + Adaugă obiectiv nou
          </button>
        </div>
      )}

      {/* ── OBIECTIV — 14 ZILE CALENDAR ─────────────────── */}
      {activeObjective && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Obiectiv curent — 14 zile</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-full">Ziua {cycleDay}/14</span>
              <button onClick={() => setShowAddObjective(true)}
                className="text-xs text-teal-600 border border-teal-200 px-2.5 py-1 rounded-lg hover:bg-teal-50">
                + Nou
              </button>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{new Date(activeObjective.startDate).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}</span>
            <span className="text-gray-400">→</span>
            <span>{new Date(activeObjective.endDate).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}</span>
          </div>

          <Bar pct={(cycleDay / 14) * 100} />

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
                    : logged  ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-50 text-amber-400"
                  }`}
                  title={d ? `${d.date}: ${logged ? d.eaten + " kcal" : "nelogat"}` : ""}>
                  <div>{i + 1}</div>
                  {!isFuture && (
                    <div className="text-[9px] mt-0.5 opacity-80">
                      {isToday ? "azi" : logged ? "✓" : "—"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 inline-block"/>logat</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-200 inline-block"/>nelogat</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block"/>azi</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-100 inline-block"/>urmează</span>
          </div>

          {dayData.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Progres greutate estimată</p>
              <WeightChart
                dayData={dayData}
                startWeight={activeObjective.startWeight}
                targetWeight={activeObjective.targetWeight}
              />
              <div className="flex gap-4 text-xs text-gray-400 mt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-teal-500 inline-block rounded"/>estimat</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" style={{borderTop: '1px dashed'}}/>țintă</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AZI ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-bold text-gray-800">
          Azi — {new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pași parcurși azi</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input type="number" min="0" max="100000" value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)} onBlur={saveSteps}
                placeholder="ex. 8500"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-teal-400 pr-12" />
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

        {/* Water tracker */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Apă consumată azi</label>
          <div className="flex items-center gap-3">
            <button onClick={() => addWater(-250)} disabled={savingWater || water === 0}
              className="w-9 h-9 rounded-xl border border-gray-200 text-lg font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">−</button>
            <div className="flex-1">
              <div className="flex gap-1 mb-1.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={`flex-1 h-5 rounded-md transition-colors ${
                    i < Math.floor(water / 250) ? "bg-blue-400" : "bg-gray-100"
                  }`} />
                ))}
              </div>
              <p className="text-xs text-center text-gray-500">
                <span className="font-bold text-blue-500">{(water / 1000).toFixed(2)}L</span> din 2L recomandat
              </p>
            </div>
            <button onClick={() => addWater(250)} disabled={savingWater}
              className="w-9 h-9 rounded-xl border border-teal-200 text-lg font-bold text-teal-600 hover:bg-teal-50 disabled:opacity-30 transition-colors">+</button>
          </div>
        </div>

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
            </p>
          )}
        </div>
      </div>

      {/* ── PROFIL ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">{auth.currentUser?.displayName?.split(" ")[0]} · Profil</h3>
            <p className="text-xs text-gray-400">{profile.sex === "F" ? "Femeie" : "Bărbat"} · {profile.age} ani · {profile.height} cm · {profile.weight} kg</p>
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

      {/* ── ISTORIC OBIECTIVE ───────────────────────────── */}
      {expiredObjectives.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-gray-800">Istoric obiective</h3>
          <div className="space-y-2">
            {expiredObjectives.map((obj) => (
              <div key={obj.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(obj.startDate).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                    {" → "}
                    {new Date(obj.endDate).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Start: {obj.startWeight} kg · Țintă: {obj.targetWeight} kg
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-600">
                    -{(obj.startWeight - obj.targetWeight).toFixed(1)} kg vizat
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddObjective && (
        <AddObjectiveModal profile={profile} onClose={() => setShowAddObjective(false)} />
      )}
      {showEdit && (
        <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onDone={onProfileUpdate} />
      )}
    </div>
  );
}
