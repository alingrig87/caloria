import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.code ? `${err.code}` : err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-6">
        <div>
          <span className="text-5xl">🥗</span>
          <h1 className="text-2xl font-bold text-green-800 mt-3">Caloria</h1>
          <p className="text-sm text-gray-500 mt-1">Nutriție inteligentă cu ajutorul AI</p>
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-3">
          <p className="text-sm text-gray-600">Autentifică-te pentru a-ți salva jurnalul alimentar</p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 rounded-xl py-3 px-4 transition-colors font-medium text-gray-700 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            {loading ? "Se conectează..." : "Continuă cu Google"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <p className="text-xs text-gray-400">
          Datele tale sunt private și accesibile doar din contul tău.
        </p>
      </div>
    </div>
  );
}
