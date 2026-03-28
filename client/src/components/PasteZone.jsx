import { useEffect, useRef, useState } from "react";

export default function PasteZone({ image, onImagePaste }) {
  const [dragging, setDragging] = useState(false);
  const zoneRef = useRef(null);

  // Asculta paste global
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type;
      onImagePaste({ base64, mediaType, url: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      ref={zoneRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
        ${dragging
          ? "border-green-400 bg-green-900/20"
          : image
          ? "border-gray-600 bg-gray-900"
          : "border-gray-600 bg-gray-900 hover:border-gray-500"
        }
      `}
      style={{ minHeight: image ? "auto" : "280px" }}
    >
      {image ? (
        /* Imaginea pastata */
        <div className="flex flex-col items-center gap-3 p-4">
          <img
            src={image.url}
            alt="Food photo"
            className="max-w-full rounded-lg shadow-xl"
            style={{ maxHeight: "500px", objectFit: "contain" }}
          />
          <p className="text-xs text-gray-500">
            Paste o poza noua pentru a inlocui imaginea curenta (Ctrl+V)
          </p>
        </div>
      ) : (
        /* Zona de paste goala */
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <div className="text-6xl opacity-30">🥗</div>
          <div className="text-center">
            <p className="text-gray-300 font-semibold text-lg">
              Paste o poza cu mancare
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Apasa <kbd className="bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">Ctrl+V</kbd> oriunde pe pagina
            </p>
          </div>
          <div className="flex items-center gap-3 text-gray-600 text-sm">
            <span>sau</span>
          </div>
          <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
            Alege fisier
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
          <p className="text-gray-600 text-xs">
            Drag & drop functioneaza de asemenea
          </p>
        </div>
      )}
    </div>
  );
}
