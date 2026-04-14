import { useState, useCallback, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import AuthScreen from "./components/AuthScreen";
import ProfileSetup from "./components/ProfileSetup";
import ProfileTab from "./components/ProfileTab";
import PasteZone from "./components/PasteZone";
import CaloriePanel from "./components/CaloriePanel";
import DietForm from "./components/DietForm";
import VitalisDiet from "./components/VitalisDiet";
import Journal from "./components/Journal";
import ProfileRefresh from "./components/ProfileRefresh";

function ScannerTab() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImagePaste = useCallback((imageData) => {
    setImage(imageData);
    setResult(null);
    setError("");
  }, []);

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.base64, mediaType: image.mediaType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Eroare server");
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (err) {
      setError(err.message || "A aparut o eroare. Verifica serverul.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { setImage(null); setResult(null); setError(""); };

  return (
    <div className="flex flex-col gap-6">
      <PasteZone image={image} onImagePaste={handleImagePaste} />
      {image && (
        <div className="flex gap-3">
          <button onClick={handleAnalyze} disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>Analizez...</>
            ) : <>🔍 Calculeaza calorii</>}
          </button>
          <button onClick={handleClear} disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 border border-gray-300 disabled:opacity-50 text-gray-700 py-3 px-5 rounded-lg transition-colors">
            Sterge
          </button>
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">⚠️ {error}</div>}
      {loading && !result && (
        <div className="bg-white border border-green-100 rounded-xl p-8 flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm">Identific alimentele si calculez nutritia...</p>
        </div>
      )}
      {result && <CaloriePanel result={result} />}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 gap-6">
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl">🥗</span>
        <h1 className="text-2xl font-bold text-green-800">Caloria</h1>
      </div>
      <svg className="animate-spin h-8 w-8 text-teal-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );
}

export default function App() {
  // With browserLocalPersistence, auth.currentUser is set synchronously from
  // localStorage before first render — skip the loading screen for returning users
  const [user, setUser] = useState(auth.currentUser); // null | User (never undefined)
  const [profile, setProfile] = useState(auth.currentUser ? undefined : null);
  const [activeTab, setActiveTab] = useState("vitalis");

  // Auth + profile in one effect — avoids the render-cycle gap between the two
  useEffect(() => {
    let profileUnsub = null;
    const authUnsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }
      if (u) {
        setProfile(undefined); // show LoadingScreen while Firestore fetches
        profileUnsub = onSnapshot(
          doc(db, "users", u.uid, "profile", "data"),
          (snap) => setProfile(snap.exists() ? snap.data() : null),
          () => setProfile(null)
        );
      } else {
        setProfile(null);
      }
    });
    return () => { authUnsub(); if (profileUnsub) profileUnsub(); };
  }, []);

  // Profile is still loading (user is known but profile doc not yet fetched)
  if (profile === undefined) {
    return <LoadingScreen />;
  }

  // Not logged in
  if (!user) return <AuthScreen />;

  // No profile yet → onboarding
  if (profile === null) {
    return <ProfileSetup onDone={() => setActiveTab("profile")} />;
  }

  // Profile exists but 14+ days since last update → check-in
  const lastUpdate = profile.updatedAt?.toDate?.() ?? profile.createdAt?.toDate?.();
  const daysSinceUpdate = lastUpdate
    ? (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  if (daysSinceUpdate >= 14) {
    return <ProfileRefresh profile={profile} onDone={() => setActiveTab("vitalis")} />;
  }

  const tabs = [
    { id: "vitalis", label: "✨ Dieta Vitalis" },
    { id: "journal", label: "📔 Jurnal" },
    { id: "profile", label: "👤 Profil" },
    { id: "scanner", label: "📷 Scanner" },
    { id: "diet",    label: "🥗 Plan AI" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-green-50">
      <header className="border-b border-green-100 bg-white px-4 md:px-6 py-4 no-print shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥗</span>
            <div>
              <h1 className="text-xl font-bold text-green-800">Caloria</h1>
              <p className="text-xs text-green-600">Nutriție inteligentă cu ajutorul AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-gray-200" />
            )}
            <button onClick={() => signOut(auth)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Ieși
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-green-100 bg-white px-4 md:px-6 no-print">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 w-full px-4 md:px-6 py-6 md:py-8 max-w-5xl mx-auto">
        {activeTab === "scanner"  && <ScannerTab />}
        {activeTab === "vitalis"  && <VitalisDiet />}
        {activeTab === "diet"     && <DietForm />}
        {activeTab === "journal"  && <Journal profile={profile} onGoToJournal={() => setActiveTab("journal")} />}
        {activeTab === "profile"  && (
          <ProfileTab profile={profile} onProfileUpdate={() => {}} />
        )}
      </main>

      <footer className="text-center text-gray-400 text-xs py-4 border-t border-green-100 bg-white no-print">
        Caloria — estimările sunt aproximative · Consultați un specialist pentru sfaturi medicale
      </footer>
    </div>
  );
}
