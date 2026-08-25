import React, { useState } from 'react';
import axios from 'axios';
import { Columns, Upload, RefreshCw, Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import { API_URL } from '../context/AuthContext';

export default function MultiComparePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparisons, setComparisons] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length + files.length > 10) {
      alert("Maximum limit is 10 images.");
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleRemove = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClear = () => {
    setFiles([]);
    setComparisons([]);
  };

  const handleCompare = async () => {
    if (files.length === 0) return;
    setLoading(true);
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const res = await axios.post('/predict/compare-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setComparisons(res.data.comparisons);
    } catch (err) {
      console.error("Multi-compare failed:", err);
      alert(err.response?.data?.message || "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <Columns className="w-8 h-8 text-primary-500" />
          <span>Multi-Image Comparator</span>
        </h2>
        <p className="text-sm text-slate-400 font-semibold mt-1">
          Upload up to 10 skin lesion images to run synchronous comparative predictions and severity ratings.
        </p>
      </div>

      {comparisons.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Uploader */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel border-2 border-dashed p-10 text-center relative hover:border-primary-500/50 cursor-pointer transition-colors min-h-[220px] flex flex-col justify-center items-center">
              <input 
                type="file" multiple accept="image/*" onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 mb-4" />
              <h4 className="font-extrabold text-base">Select Multiple Lesion Images</h4>
              <p className="text-xs text-slate-400 mt-1">Upload between 2 and 10 photos to initialize comparisons.</p>
            </div>

            {/* Selected files preview */}
            {files.length > 0 && (
              <div className="glass-panel p-6 border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h4 className="font-bold text-sm">Selected Files ({files.length}/10)</h4>
                  <button onClick={handleClear} className="text-xs text-red-500 hover:underline font-bold">Clear All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative aspect-square border rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemove(idx)}
                        className="absolute top-2.5 right-2.5 bg-red-500 text-white rounded-full p-1 text-[10px] hover:scale-105 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form and Trigger */}
          <div className="lg:col-span-4 glass-panel p-6 border shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm border-b pb-2 mb-3 uppercase tracking-wider text-slate-400">Comparison Scope</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                The engine will evaluate each image through standard Dull Razor preprocessing, compute the prediction labels, and cross-reference feature mappings to compare similarities.
              </p>
            </div>
            
            <button
              onClick={handleCompare}
              disabled={files.length < 2 || loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all flex items-center justify-center space-x-2 text-xs shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing comparisons...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Run Predictions Matrix</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">Diagostics comparative compilation grid</span>
            <button 
              onClick={handleClear}
              className="px-5 py-2.5 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition text-xs"
            >
              Compare Different Batch
            </button>
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisons.map((c) => {
              const fullImg = c.original_url.startsWith('http') ? c.original_url : `${API_URL.replace('/api', '')}${c.original_url}`;
              const fullHeat = c.heatmap_url?.startsWith('http') ? c.heatmap_url : `${API_URL.replace('/api', '')}${c.heatmap_url}`;
              
              if (c.error) {
                return (
                  <div key={c.index} className="glass-panel p-6 border border-red-200 dark:border-red-950 bg-red-50/10 text-left flex flex-col justify-between min-h-[280px]">
                    <div className="flex items-center space-x-2 text-red-500">
                      <AlertCircle className="w-5 h-5" />
                      <h4 className="font-extrabold text-sm truncate">{c.filename}</h4>
                    </div>
                    <p className="text-xs text-red-500/80 leading-relaxed mt-4">{c.error}</p>
                    <div className="border-t pt-2 mt-4 text-[10px] text-slate-400">Index {c.index + 1}</div>
                  </div>
                );
              }
              
              return (
                <div key={c.index} className="glass-panel overflow-hidden border hover:border-primary-500/40 transition-all flex flex-col p-4 space-y-4">
                  {/* Photo displays */}
                  <div className="grid grid-cols-2 gap-3 aspect-[2/1] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50">
                    <img src={fullImg} alt="Original" className="w-full h-full object-cover" />
                    <img src={fullHeat} alt="Heatmap" className="w-full h-full object-cover" />
                  </div>

                  <div className="text-left space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm truncate text-slate-800 dark:text-slate-200">{c.filename}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-base text-primary-500">{c.prediction}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          c.severity === 'Mild' ? 'bg-green-100 text-green-700 dark:bg-green-950/30' :
                          (c.severity === 'Moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30' : 
                          'bg-red-100 text-red-700 dark:bg-red-950/30')
                        }`}>
                          {c.severity}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-2 flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400">Inference Confidence:</span>
                      <span className="text-slate-800 dark:text-slate-100 font-bold">{Math.round(c.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
