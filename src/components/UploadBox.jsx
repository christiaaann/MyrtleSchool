import { useState } from "react";
import { ImageUp, X } from "lucide-react";
// import { sileo } from "sileo"; // You might not need this anymore if you don't show size errors

const UploadBox = ({ label, file, setFile, validateSize }) => {
  const [isDragging, setIsDragging] = useState(false);

  // function to handle file with automatic resizing
  const handleFile = (file) => {
    if (!file) return;

    if (validateSize) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const expectedPx = 600;
        
        // Create a canvas to resize and crop the image
        const canvas = document.createElement("canvas");
        canvas.width = expectedPx;
        canvas.height = expectedPx;
        const ctx = canvas.getContext("2d");

        // Calculate center crop to avoid stretching the image
        const minSize = Math.min(img.width, img.height);
        const startX = (img.width - minSize) / 2;
        const startY = (img.height - minSize) / 2;

        // Draw the cropped image onto the 600x600 canvas
        ctx.drawImage(
          img,
          startX, startY, minSize, minSize, // Source x, y, width, height (cropping area)
          0, 0, expectedPx, expectedPx      // Destination x, y, width, height (on canvas)
        );

        // Convert the canvas back to a File object
        canvas.toBlob((blob) => {
          if (!blob) return;
          
          const resizedFile = new File([blob], file.name, {
            type: file.type || "image/jpeg",
            lastModified: Date.now(),
          });
          
          setFile(resizedFile);
        }, file.type || "image/jpeg", 0.9); // 0.9 is the image quality (0 to 1)
      };
      
      return;
    }

    // normal file without validation/resizing
    setFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
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
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
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
            alt={file?.name || "Preview"}
            className="w-full h-full object-contain md:object-cover transition-all rounded-xl"
          />
        )}

        {/* Remove button */}
        {file && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the file dialog when clicking remove
              setFile(null);
            }}
            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black transition z-10"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadBox;