import { useEffect, useRef } from "react";

// Parseaza markdown simplu: **bold**, ## headings, liste
function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Heading
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="text-green-400 font-bold text-base mt-4 mb-1">
          {line.slice(3)}
        </h2>
      );
    }
    // Numerotare cu bold (1. **Situatia**)
    if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return (
        <p
          key={i}
          className="mt-3 text-sm"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    // Bold inline
    if (line.includes("**")) {
      const content = line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-yellow-300'>$1</strong>");
      return (
        <p
          key={i}
          className="text-sm mt-1"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    // Linie goala
    if (line.trim() === "") {
      return <br key={i} />;
    }
    return (
      <p key={i} className="text-sm mt-1">
        {line}
      </p>
    );
  });
}

// Detecteaza decizia recomandata pentru highlight
function detectDecision(text) {
  const upper = text.toUpperCase();
  if (upper.includes("ALL-IN") || upper.includes("ALL IN")) return { label: "ALL-IN", color: "red" };
  if (upper.includes("RAISE")) return { label: "RAISE", color: "orange" };
  if (upper.includes("CALL")) return { label: "CALL", color: "blue" };
  if (upper.includes("CHECK")) return { label: "CHECK", color: "green" };
  if (upper.includes("FOLD")) return { label: "FOLD", color: "gray" };
  return null;
}

const decisionColors = {
  red: "bg-red-900/60 border-red-600 text-red-300",
  orange: "bg-orange-900/60 border-orange-600 text-orange-300",
  blue: "bg-blue-900/60 border-blue-600 text-blue-300",
  green: "bg-green-900/60 border-green-600 text-green-300",
  gray: "bg-gray-800 border-gray-600 text-gray-300",
};

export default function AnalysisPanel({ analysis, loading }) {
  const bottomRef = useRef(null);
  const decision = analysis ? detectDecision(analysis) : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [analysis]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header panel */}
      <div className="bg-gray-800 px-5 py-3 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">📊 Analiza</span>
        {decision && (
          <span
            className={`border text-xs font-bold px-3 py-1 rounded-full ${decisionColors[decision.color]}`}
          >
            {decision.label}
          </span>
        )}
      </div>

      {/* Continut */}
      <div className="px-5 py-4 min-h-[120px]">
        {loading && !analysis && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Analizez imaginea...
          </div>
        )}

        <div className="text-gray-300 leading-relaxed">
          {renderMarkdown(analysis)}
          {loading && analysis && (
            <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse rounded-sm" />
          )}
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
