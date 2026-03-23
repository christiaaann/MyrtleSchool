import { useState } from "react";
import { ImageUp, X } from "lucide-react";
import { sileo } from "sileo";
const UploadBox = ({ label, file, setFile, validateSize }) => {
  const [isDragging, setIsDragging] = useState(false);

  // function to handle file with optional validation
  const handleFile = (file) => {
    if (!file) return;

    if (validateSize) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // 2x2 inches at 300dpi ~ 600x600px
        const expectedPx = 600;
        if (Math.abs(width - expectedPx) > 10 || Math.abs(height - expectedPx) > 10) {
          sileo.error({
            title: "Invalid image size! ID Picture must be 2x2 inches (600x600px).",
            fill: "black"
          });
          setFile(null);
          return;
        }

        // valid file
        setFile(file);
      };
      return;
    }

    // normal file without validation
    setFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-xs font-bold text-gray-600 uppercase">{label}</p>

      <div className="relative w-full h-40 md:h-48 rounded-xl border border-dashed dark:border-neutral-900 overflow-hidden">
        {/* Drop area */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition
          ${isDragging ? "bg-green-50 border-green-400" : ""}`}
          onClick={() => document.getElementById(label).click()}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            id={label}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {!preview && (
            <div className="text-center dark:text-neutral-400 px-4">
              <div className="flex justify-center mb-2">
                <ImageUp className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-sm font-medium">Drop or click to upload</p>
              <p className="text-xs text-gray-400">Image</p>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            alt={file?.name}
            className="w-full h-full object-contain md:object-cover transition-all rounded-xl"
          />
        )}

        {/* Remove button */}
        {file && (
          <button
            onClick={() => setFile(null)}
            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black transition"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadBox;