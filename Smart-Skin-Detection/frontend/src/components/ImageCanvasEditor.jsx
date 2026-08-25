import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, ZoomIn, ZoomOut, RotateCcw, Check, RefreshCw, Eye } from 'lucide-react';

export default function ImageCanvasEditor({ imageSrc, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1);
  const [imgObj, setImgObj] = useState(null);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgObj(img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!imgObj) return;
    draw();
  }, [imgObj, brightness, contrast, rotation, zoom]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Standard bounding boxes
    const w = imgObj.width;
    const h = imgObj.height;
    
    // Adjust size for rotation
    const isRotatedOrtho = rotation === 90 || rotation === 270;
    const canvasWidth = isRotatedOrtho ? h : w;
    const canvasHeight = isRotatedOrtho ? w : h;
    
    // Set canvas dimensions (capped for UI preview bounds)
    const maxWidth = 500;
    const scale = Math.min(maxWidth / canvasWidth, 1);
    
    canvas.width = canvasWidth * scale * zoom;
    canvas.height = canvasHeight * scale * zoom;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save state
    ctx.save();
    
    // Align transform coordinates around center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    // Draw
    const drawWidth = w * scale * zoom;
    const drawHeight = h * scale * zoom;
    ctx.drawImage(imgObj, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    ctx.restore();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setZoom(1);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Generate file/blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "edited_lesion.jpg", { type: "image/jpeg" });
      onSave(file, canvas.toDataURL('image/jpeg'));
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="glass-panel p-6 flex flex-col items-center space-y-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
        <Eye className="w-5 h-5 text-primary-500" />
        <span>Lesion Preprocessing Editor</span>
      </h3>
      
      {/* Editor Canvas */}
      <div className="relative border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 rounded-2xl overflow-hidden max-w-full flex items-center justify-center p-4">
        {!imgObj ? (
          <div className="w-64 h-64 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg rounded-xl max-w-full object-contain" />
        )}
      </div>

      {/* Control sliders */}
      <div className="w-full space-y-4 max-w-md">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>Brightness: {brightness}%</span>
          </div>
          <input 
            type="range" min="50" max="180" value={brightness} 
            onChange={(e) => setBrightness(e.target.value)}
            className="w-full accent-primary-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>Contrast: {contrast}%</span>
          </div>
          <input 
            type="range" min="50" max="180" value={contrast} 
            onChange={(e) => setContrast(e.target.value)}
            className="w-full accent-secondary-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Button Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button 
          onClick={handleRotate}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 text-xs font-semibold"
          title="Rotate 90 Deg"
        >
          <RotateCw className="w-4 h-4" />
          <span>Rotate</span>
        </button>
        <button 
          onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 text-xs font-semibold"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
          <span>Zoom +</span>
        </button>
        <button 
          onClick={() => setZoom((z) => Math.max(z - 0.1, 0.7))}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 text-xs font-semibold"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
          <span>Zoom -</span>
        </button>
        <button 
          onClick={handleReset}
          className="p-2.5 rounded-xl border border-red-200 dark:border-red-950 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center space-x-1.5 text-xs font-semibold"
          title="Reset adjustments"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Confirmation controls */}
      <div className="flex space-x-3 w-full max-w-sm pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 rounded-xl shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center space-x-1"
        >
          <Check className="w-4 h-4" />
          <span>Apply Adjustments</span>
        </button>
      </div>
    </div>
  );
}
