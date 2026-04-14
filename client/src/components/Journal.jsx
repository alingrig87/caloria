import { useState, useEffect, useCallback, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, deleteDoc, doc, Timestamp,
} from "firebase/firestore";

const MEAL_TYPES = ["Mic dejun", "Prânz", "Gustare", "Cină", "Altele"];

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

function DateNav({ selected, onChange }) {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {dates.map((d) => {
        const key = formatDate(d);
        const isSelected = key === selected;
        const isToday = key === formatDate(new Date());
        return (
          <button key={key} onClick={() => onChange(key)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isSelected ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"
            }`}>
            <span className="uppercase text-[10px] opacity-70">
              {d.toLocaleDateString("ro-RO", { weekday: "short" })}
            </span>
            <span className="text-base leading-tight">{d.getDate()}</span>
            {isToday && <span className={`text-[9px] mt-0.5 ${isSelected ? "text-teal-200" : "text-teal-500"}`}>azi</span>}
          </button>
        );
      })}
    </div>
  );
}

function AddMealModal({ onClose }) {
  const [mode, setMode] = useState("text"); // text | photo
  const [mealType, setMealType] = useState("Prânz");

  // text mode
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [estimating, setEstimating] = useState(false);

  // photo mode
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pasteRef = useRef(null);

  // ── text estimate ──────────────────────────────────────
  const estimateText = async () => {
    if (!description.trim()) return;
    setEstimating(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/estimate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch {
      setError("Eroare la calcul. Încearcă din nou.");
    } finally {
      setEstimating(false);
    }
  };

  // ── photo ──────────────────────────────────────────────
  const handlePaste = useCallback((e) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const blob = item.getAsFile();
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage({ base64: ev.target.result.split(",")[1], mediaType: blob.type, preview: ev.target.result });
    };
    reader.readAsDataURL(blob);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage({ base64: ev.target.result.split(",")[1], mediaType: file.type, preview: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!image) return;
    setAnalyzing(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.base64, mediaType: image.mediaType }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      // normalize photo response to same shape as text
      setResult({
        name: data.items?.map((i) => i.name).join(", ") || "Masă analizată",
        kcal: Math.round(data.total_calories || data.totalCalories || 0),
        protein: Math.round(data.total_protein || 0),
        carbs: Math.round(data.total_carbs || 0),
        fat: Math.round(data.total_fat || 0),
        items: data.items?.map((i) => ({ name: i.name, qty: i.quantity, kcal: i.calories })) || [],
      });
    } catch {
      setError("Eroare la analiză. Încearcă din nou.");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── save ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      await addDoc(collection(db, "users", uid, "meals"), {
        mealType,
        name: result.name,
        kcal: result.kcal || null,
        protein: result.protein || null,
        carbs: result.carbs || null,
        fat: result.fat || null,
        items: result.items || [],
        description: description.trim() || null,
        date: formatDate(new Date()),
        createdAt: Timestamp.now(),
      });
      onClose();
    } catch {
      setError("Eroare la salvare. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const loading = estimating || analyzing;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-800">Adaugă masă</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => { setMode("text"); setResult(null); setImage(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${mode === "text" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              ✍️ Descrie cu text
            </button>
            <button onClick={() => { setMode("photo"); setResult(null); setDescription(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${mode === "photo" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              📷 Din poză
            </button>
          </div>

          {/* Meal type */}
          <div className="flex gap-1.5 flex-wrap">
            {MEAL_TYPES.map((t) => (
              <button key={t} onClick={() => setMealType(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  mealType === t ? "bg-teal-100 text-teal-800 border border-teal-300" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Text mode */}
          {mode === "text" && (
            <div className="space-y-3">
              <div>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setResult(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); estimateText(); } }}
                  placeholder="ex: 2 ouă cu 2 roșii și un castravete mic, sau piept de pui 200g cu salată verde"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Apasă Enter sau butonul de mai jos pentru calcul</p>
              </div>
              <button onClick={estimateText} disabled={!description.trim() || loading}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {estimating ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>Calculez caloriile...</>
                ) : "🔍 Calculează calorii"}
              </button>
            </div>
          )}

          {/* Photo mode */}
          {mode === "photo" && (
            <div ref={pasteRef} onPaste={handlePaste} tabIndex={0}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 focus:outline-none focus:border-teal-400 space-y-3">
              {image ? (
                <div className="space-y-3">
                  <img src={image.preview} alt="preview" className="w-full max-h-40 object-contain rounded-lg" />
                  <div className="flex gap-2">
                    <button onClick={analyzePhoto} disabled={analyzing}
                      className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                      {analyzing ? "Analizez..." : "🔍 Calculează calorii"}
                    </button>
                    <button onClick={() => { setImage(null); setResult(null); }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">✕</button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400">Lipește o poză (Ctrl+V) sau</p>
                  <label className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg transition-colors">
                    Alege fișier
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Result preview */}
          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800 text-sm">{result.name}</p>
                <span className="text-2xl font-bold text-teal-700 shrink-0">{result.kcal} kcal</span>
              </div>

              {/* Macros */}
              <div className="flex gap-3 text-xs">
                <span className="bg-white rounded-lg px-2 py-1 text-gray-600">🥩 {result.protein}g proteină</span>
                <span className="bg-white rounded-lg px-2 py-1 text-gray-600">🌾 {result.carbs}g carbo</span>
                <span className="bg-white rounded-lg px-2 py-1 text-gray-600">🫒 {result.fat}g grăsimi</span>
              </div>

              {/* Items breakdown */}
              {result.items?.length > 0 && (
                <div className="space-y-1">
                  {result.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{item.name} <span className="text-gray-400">({item.qty})</span></span>
                      <span className="font-medium">{item.kcal} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleSave} disabled={saving}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors">
                {saving ? "Se salvează..." : "✅ Salvează masa"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MealCard({ meal, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 group">
      <div className="flex items-start gap-3">
        <div className="text-center shrink-0 pt-0.5 w-10">
          <div className="text-xs text-gray-400 font-bold">{formatTime(meal.createdAt)}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">{meal.mealType}</span>
            {meal.kcal && <span className="text-xs font-bold text-gray-700">{meal.kcal} kcal</span>}
            {meal.protein && <span className="text-xs text-gray-400">P:{meal.protein}g</span>}
            {meal.carbs && <span className="text-xs text-gray-400">C:{meal.carbs}g</span>}
            {meal.fat && <span className="text-xs text-gray-400">G:{meal.fat}g</span>}
          </div>
          <p className="text-sm font-medium text-gray-800">{meal.name}</p>
          {meal.description && (
            <p className="text-xs text-gray-400 mt-0.5 italic">"{meal.description}"</p>
          )}
          {meal.items?.length > 0 && (
            <button onClick={() => setExpanded((x) => !x)} className="text-xs text-teal-600 mt-1 hover:underline">
              {expanded ? "Ascunde detalii" : `Vezi ${meal.items.length} ingrediente`}
            </button>
          )}
          {expanded && meal.items?.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {meal.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500">
                  <span>{item.name} <span className="text-gray-400">({item.qty})</span></span>
                  <span>{item.kcal} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(meal.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xl leading-none shrink-0 pt-0.5">
          ×
        </button>
      </div>
    </div>
  );
}

export default function Journal() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setLoading(true);
    const q = query(
      collection(db, "users", uid, "meals"),
      where("date", "==", selectedDate),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [selectedDate]);

  const handleDelete = async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "meals", id));
  };

  const totalKcal = meals.reduce((s, m) => s + (m.kcal || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0);

  const grouped = MEAL_TYPES.reduce((acc, type) => {
    const items = meals.filter((m) => m.mealType === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <DateNav selected={selectedDate} onChange={setSelectedDate} />

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Total calorii</p>
          <p className="text-2xl font-bold text-teal-700">{totalKcal > 0 ? `${totalKcal} kcal` : "—"}</p>
          {totalKcal > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              P:{totalProtein}g · C:{totalCarbs}g · G:{totalFat}g
            </p>
          )}
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm">
          <span className="text-lg leading-none">+</span> Adaugă masă
        </button>
      </div>

      {/* Meals */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Se încarcă...</div>
      ) : meals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-sm">Nicio masă înregistrată pentru această zi.</p>
          <p className="text-xs mt-1">Apasă "+ Adaugă masă" pentru a începe.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{type}</p>
              <div className="space-y-2">
                {items.map((m) => <MealCard key={m.id} meal={m} onDelete={handleDelete} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddMealModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
