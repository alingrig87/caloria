import { useState, useCallback } from "react";
import PasteZone from "./components/PasteZone";
import CaloriePanel from "./components/CaloriePanel";

export default function App() {
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

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Eroare server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let rawText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              try {
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                if (jsonMatch) setResult(JSON.parse(jsonMatch[0]));
                else setError("Nu am putut parsa raspunsul.");
              } catch {
                setError("Nu am putut parsa raspunsul. Incearca din nou.");
              }
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) rawText += parsed.text;
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message || "A aparut o eroare. Verifica serverul.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <span className="text-3xl">🥗</span>
          <div>
            <h1 className="text-xl font-bold text-white">Calorie Scanner</h1>
            <p className="text-xs text-gray-400">Paste o poza cu mancare si afla caloriile instant</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <PasteZone image={image} onImagePaste={handleImagePaste} />

        {image && (
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analizez...
                </>
              ) : <>🔍 Calculeaza calorii</>}
            </button>
            <button
              onClick={handleClear}
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-3 px-5 rounded-lg transition-colors"
            >
              Sterge
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        {loading && !result && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center gap-3 text-gray-400">
            <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-sm">Identific alimentele si calculez nutritia...</p>
          </div>
        )}

        {result && <CaloriePanel result={result} />}
      </main>

      <footer className="text-center text-gray-700 text-xs py-4 border-t border-gray-900">
        Calorie Scanner — estimarile sunt aproximative
      </footer>
    </div>
  );
}
