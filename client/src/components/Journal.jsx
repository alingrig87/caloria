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
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isSelected
                ? "bg-teal-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"
            }`}
          >
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

function AddMealModal({ onClose, onSaved }) {
  const [mode, setMode] = useState("manual"); // manual | photo
  const [mealType, setMealType] = useState("Prânz");
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [kcal, setKcal] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pasteRef = useRef(null);

  const handlePaste = useCallback((e) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const blob = item.getAsFile();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const mediaType = blob.type;
      setImage({ base64, mediaType, preview: ev.target.result });
    };
    reader.readAsDataURL(blob);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setImage({ base64, mediaType: file.type, preview: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!image) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.base64, mediaType: image.mediaType }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.items?.length) {
        setName(data.items.map((i) => i.name).join(", "));
        const totalKcal = data.items.reduce((s, i) => s + (i.calories || 0), 0);
        setKcal(String(Math.round(totalKcal)));
      }
      if (data.totalCalories) setKcal(String(Math.round(data.totalCalories)));
    } catch {
      setError("Eroare la analiză. Încearcă din nou.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Introdu numele mesei."); return; }
    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      await addDoc(collection(db, "users", uid, "meals"), {
        mealType,
        name: name.trim(),
        grams: grams ? Number(grams) : null,
        kcal: kcal ? Number(kcal) : null,
        note: note.trim() || null,
        date: formatDate(new Date()),
        createdAt: Timestamp.now(),
      });
      onSaved();
      onClose();
    } catch {
      setError("Eroare la salvare. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Adaugă masă</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "manual" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              ✍️ Manual
            </button>
            <button
              onClick={() => setMode("photo")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "photo" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              📷 Din poză
            </button>
          </div>

          {/* Meal type */}
          <div className="flex gap-1.5 flex-wrap">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${mealType === t ? "bg-teal-100 text-teal-800 border border-teal-300" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {mode === "photo" && (
            <div
              ref={pasteRef}
              onPaste={handlePaste}
              tabIndex={0}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 focus:outline-none focus:border-teal-400 space-y-3"
            >
              {image ? (
                <div className="space-y-3">
                  <img src={image.preview} alt="preview" className="w-full max-h-40 object-contain rounded-lg" />
                  <div className="flex gap-2">
                    <button
                      onClick={analyzePhoto}
                      disabled={analyzing}
                      className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      {analyzing ? "Analizez..." : "🔍 Calculează calorii"}
                    </button>
                    <button onClick={() => setImage(null)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                      ✕
                    </button>
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

          {/* Name */}
          <input
            type="text"
            placeholder="Numele mesei (ex. piept de pui, salată)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"
          />

          {/* Grams + kcal */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                placeholder="Grame"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">g</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                placeholder="Calorii"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kcal</span>
            </div>
          </div>

          {/* Note */}
          <textarea
            placeholder="Notă opțională (ex. am deviat cu o pizza 🍕)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? "Se salvează..." : "Salvează masa"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MealCard({ meal, onDelete }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-start gap-3 group">
      <div className="text-center shrink-0 pt-0.5">
        <div className="text-xs text-gray-400 font-bold">{formatTime(meal.createdAt)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
            {meal.mealType}
          </span>
          {meal.kcal && (
            <span className="text-xs text-gray-400">~{meal.kcal} kcal</span>
          )}
          {meal.grams && (
            <span className="text-xs text-gray-400">{meal.grams}g</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800">{meal.name}</p>
        {meal.note && (
          <p className="text-xs text-amber-600 mt-1 italic">📝 {meal.note}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(meal.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg leading-none shrink-0"
      >
        ×
      </button>
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

  const grouped = MEAL_TYPES.reduce((acc, type) => {
    const items = meals.filter((m) => m.mealType === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <DateNav selected={selectedDate} onChange={setSelectedDate} />

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Total calorii</p>
          <p className="text-2xl font-bold text-teal-700">
            {totalKcal > 0 ? `${totalKcal} kcal` : "—"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
        >
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
                {items.map((m) => (
                  <MealCard key={m.id} meal={m} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddMealModal
          onClose={() => setShowModal(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
