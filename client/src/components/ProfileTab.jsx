import { useState, useEffect } from "react";
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, where, orderBy, getDocs, onSnapshot, Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  calcBMR, calcTDEE, calcDayBurned, calcStepsCalories,
  deficitToGrams, predictLossKg, daysSince, formatDateStr, ACTIVITY_LEVELS,
} from "../utils/calculations";

// ─── helpers ─────────────────────────────────────────────
function StatCard({ label, value, unit, accent }) {
  return (
    <div className={`rounded-xl p-4 text-center ${accent ?? "bg-gray-50"}`}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
      {unit && <p className="text-xs text-gray-400 mt-0.5">{unit}</p>}
    </div>
  );
}

function Bar({ pct, color = "bg-teal-500" }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ─── Check-in modal ──────────────────────────────────────
function CheckInModal({ profile, bmr, tdee, onClose, onDone }) {
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const actualLoss = weight
    ? (profile.cycleStartWeight - Number(weight)).toFixed(1)
    : null;
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
            Ciclu pornit pe {new Date(profile.cycleStartDate).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })},
            greutate start: <strong>{profile.cycleStartWeight} kg</strong>
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
          <p className="text-xs text-emerald-600 font-semibold mb-1">Predicție teoretică</p>
          <p className="text-2xl font-bold text-emerald-800">-{theoreticalLoss} kg</p>
          <p className="text-xs text-emerald-600">(urmând planul recomandat)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Greutatea actuală (kg)</label>
          <input
            type="number" step="0.1" min="30" max="300"
            value={weight} onChange={(e) => setWeight(e.target.value)}
            placeholder="ex. 73.5"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400"
          />
          {actualLoss !== null && (
            <p className={`text-sm font-bold mt-1.5 ${Number(actualLoss) >= 0 ? "text-teal-700" : "text-red-500"}`}>
              {Number(actualLoss) >= 0 ? `Ai slăbit ${actualLoss} kg` : `Ai luat ${Math.abs(Number(actualLoss))} kg`}
              {" "}
              {Number(actualLoss) >= Number(theoreticalLoss)
                ? "🎉 Mai mult decât predicția!"
                : Number(actualLoss) >= 0
                ? "— continuă!"
                : "— revizuiește planul"}
            </p>
          )}
        </div>

        <textarea
          placeholder="Note opționale (ex. am ținut 10 din 14 zile)"
          value={note} onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-none"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            Anulează
          </button>
          <button
            onClick={handleSave} disabled={!weight || saving}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl transition-colors"
          >
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
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Greutate țintă (kg)</label>
          <input type="number" step="0.1" value={form.targetWeight} onChange={(e) => set("targetWeight", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" />
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

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            Anulează
          </button>
          <button onClick={handleSave} disabled={saving || !form.weight || !form.targetWeight}
            className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl transition-colors">
            {saving ? "Se salvează..." : "Salvează"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────
export default function ProfileTab({ profile, onProfileUpdate }) {
  const [dailyLog, setDailyLog] = useState({ steps: 0, weight: null });
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
  const dailyDeficit = tdee - budget;
  const steps = dailyLog.steps || 0;
  const stepsKcal = calcStepsCalories(steps, profile.weight);
  const totalBurned = bmr + stepsKcal;
  const netDeficit = totalBurned - todayKcal;
  const todayGrams = deficitToGrams(netDeficit);
  const pred14 = predictLossKg(dailyDeficit, 14);

  // Cycle info
  const daysElapsed = daysSince(profile.cycleStartDate);
  const cycleDay = Math.min(daysElapsed + 1, 14);
  const isCheckInDue = daysElapsed >= 14;
  const theoreticalSoFar = predictLossKg(dailyDeficit, Math.min(daysElapsed, 14));

  // Load daily log
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid, "dailyLogs", today)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDailyLog(data);
        setStepsInput(String(data.steps || ""));
      }
    });
  }, [uid, today]);

  // Listen to today's meals calories
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "users", uid, "meals"),
      where("date", "==", today)
    );
    const unsub = onSnapshot(q, (snap) => {
      const total = snap.docs.reduce((s, d) => s + (d.data().kcal || 0), 0);
      setTodayKcal(total);
    });
    return unsub;
  }, [uid, today]);

  // Load check-ins
  useEffect(() => {
    if (!uid) return;
    getDocs(query(collection(db, "users", uid, "checkIns"), orderBy("createdAt", "desc")))
      .then((snap) => setCheckIns(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [uid]);

  const saveSteps = async () => {
    if (!stepsInput && stepsInput !== "0") return;
    setSavingSteps(true);
    await setDoc(doc(db, "users", uid, "dailyLogs", today), {
      steps: Number(stepsInput),
      updatedAt: Timestamp.now(),
    }, { merge: true });
    setDailyLog((d) => ({ ...d, steps: Number(stepsInput) }));
    setSavingSteps(false);
  };

  const weightDiff = profile.weight - profile.targetWeight;
  const progressPct = profile.cycleStartWeight > profile.targetWeight
    ? Math.min(100, ((profile.cycleStartWeight - profile.weight) / (profile.cycleStartWeight - profile.targetWeight)) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Check-in banner */}
      {isCheckInDue && (
        <div className="bg-emerald-500 text-white rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">14 zile s-au încheiat! 🎯</p>
            <p className="text-xs text-emerald-100 mt-0.5">Înregistrează greutatea actuală pentru a vedea progresul</p>
          </div>
          <button
            onClick={() => setShowCheckIn(true)}
            className="bg-white text-emerald-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors shrink-0 ml-3"
          >
            Check-in
          </button>
        </div>
      )}

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{auth.currentUser?.displayName?.split(" ")[0]}'s profil</h2>
            <p className="text-xs text-gray-400">
              {profile.sex === "F" ? "Femeie" : "Bărbat"} · {profile.age} ani · {profile.height} cm
            </p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium border border-teal-200 px-3 py-1.5 rounded-lg"
          >
            Editează
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Greutate" value={profile.weight} unit="kg" />
          <StatCard label="Obiectiv" value={profile.targetWeight} unit="kg" />
          <StatCard label="Diferență" value={weightDiff > 0 ? `-${weightDiff.toFixed(1)}` : `+${Math.abs(weightDiff).toFixed(1)}`} unit="kg" accent={weightDiff > 0 ? "bg-amber-50" : "bg-green-50"} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="BMR" value={bmr} unit="kcal/zi" />
          <StatCard label="TDEE" value={tdee} unit="kcal/zi" />
          <StatCard label="Budget rec." value={budget} unit="kcal/zi" accent="bg-teal-50" />
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progres obiectiv</span>
            <span>{progressPct.toFixed(0)}%</span>
          </div>
          <Bar pct={progressPct} />
        </div>
      </div>

      {/* Today */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-bold text-gray-800">
          Azi — {new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
        </h3>

        {/* Steps input */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pași parcurși azi</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number" min="0" max="100000"
                value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)}
                onBlur={saveSteps}
                placeholder="ex. 8500"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">pași</span>
            </div>
            <button
              onClick={saveSteps} disabled={savingSteps}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 text-white px-4 rounded-xl text-sm font-semibold transition-colors"
            >
              {savingSteps ? "..." : "Salvează"}
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
            <p className="text-xl font-bold text-gray-800">{todayKcal}</p>
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

        {/* Daily interpretation */}
        <div className={`rounded-xl px-4 py-3 text-sm ${netDeficit > 0 ? "bg-emerald-50 border border-emerald-100" : todayKcal === 0 ? "bg-gray-50" : "bg-amber-50 border border-amber-100"}`}>
          {todayKcal === 0 ? (
            <p className="text-gray-400 text-xs">Adaugă mese în Jurnal pentru a vedea bilanțul caloric.</p>
          ) : netDeficit > 0 ? (
            <p className="text-emerald-800">
              Azi ai slăbit teoretic <strong>{todayGrams}g</strong> de grăsime.
              {steps > 0 && ` Din care ${Math.round(stepsKcal / 7.7)}g datorită celor ${steps.toLocaleString()} pași.`}
            </p>
          ) : (
            <p className="text-amber-800">
              Azi ai consumat cu <strong>{Math.abs(netDeficit)} kcal</strong> mai mult decât ai ars.
              Încearcă să reduci porția la cină sau să adaugi o plimbare.
            </p>
          )}
        </div>
      </div>

      {/* 2-week cycle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Ciclul curent</h3>
          <span className="text-xs text-gray-400">Ziua {cycleDay} / 14</span>
        </div>

        <Bar pct={(cycleDay / 14) * 100} color="bg-teal-500" />

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Start ciclu</p>
            <p className="text-sm font-bold text-gray-800">
              {new Date(profile.cycleStartDate).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
            </p>
            <p className="text-xs text-gray-500">{profile.cycleStartWeight} kg</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Predicție la zi 14</p>
            <p className="text-sm font-bold text-emerald-800">-{pred14.toFixed(1)} kg</p>
            <p className="text-xs text-gray-500">teoretic</p>
          </div>
        </div>

        {daysElapsed > 0 && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-sm text-teal-800">
            La ritmul planificat, până acum (ziua {cycleDay}) ar trebui să fi slăbit teoretic{" "}
            <strong>~{theoreticalSoFar.toFixed(2)} kg</strong>.
          </div>
        )}

        {!isCheckInDue && (
          <p className="text-xs text-gray-400 text-center">
            Check-in disponibil în {14 - daysElapsed} {14 - daysElapsed === 1 ? "zi" : "zile"}
          </p>
        )}
      </div>

      {/* Check-in history */}
      {checkIns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-gray-800">Istoric check-in-uri</h3>
          <div className="space-y-2">
            {checkIns.map((ci) => (
              <div key={ci.id} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
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
                  <p className="text-xs text-gray-400">real vs -{ci.theoreticalLoss.toFixed(1)} kg teoretic</p>
                </div>
                <div className="text-lg">
                  {ci.actualLoss >= ci.theoreticalLoss ? "🎉" : ci.actualLoss >= 0 ? "✅" : "📉"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCheckIn && (
        <CheckInModal
          profile={profile} bmr={bmr} tdee={tdee}
          onClose={() => setShowCheckIn(false)}
          onDone={onProfileUpdate}
        />
      )}

      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onDone={onProfileUpdate}
        />
      )}
    </div>
  );
}
