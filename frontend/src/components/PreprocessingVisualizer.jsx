import React, { useState } from 'react';
import { ChevronRight, Maximize2, X } from 'lucide-react';
import { API_URL } from '../context/AuthContext';

export default function PreprocessingVisualizer({ steps }) {
  const [activeStep, setActiveStep] = useState(null);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Dermatological Preprocessing Pipeline
          </h3>
          <p className="text-sm text-slate-500">
            10-stage sequential CV filters applied to clarify lesion structure before CNN inference.
          </p>
        </div>
        <span className="mt-2 md:mt-0 text-[10px] uppercase font-bold tracking-wider bg-secondary-100 text-secondary-700 dark:bg-secondary-950/30 dark:text-secondary-400 px-2.5 py-1 rounded-full border border-secondary-200 dark:border-secondary-900/50">
          OpenCV Engine Active
        </span>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {steps.map((step, idx) => {
          // Adjust URLs for local serving
          const fullImgUrl = step.url.startsWith('http') ? step.url : `${axiosDefaultsBaseUrl()}${step.url}`;
          return (
            <div 
              key={step.step}
              onClick={() => setActiveStep(step)}
              className="glass-panel group overflow-hidden border border-slate-200/60 dark:border-slate-800/80 hover:border-primary-500/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex flex-col p-2.5"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img 
                  src={fullImgUrl} 
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to base64 if url fails
                    if (step.base64) {
                      e.target.src = `data:image/jpeg;base64,${step.base64}`;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-primary-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                  {idx + 1}
                </div>
              </div>
              
              <div className="mt-2 text-center">
                <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                  {step.title.split(' ').slice(1).join(' ') || step.title}
                </h4>
                <span className="text-[9px] text-slate-400 font-semibold block uppercase mt-0.5">
                  {step.step.replace(/^[0-9]+_/, '').replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active step modal view */}
      {activeStep && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl overflow-hidden max-w-2xl w-full border shadow-2xl relative flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h4 className="font-extrabold text-lg">{activeStep.title}</h4>
                <p className="text-xs text-slate-400 uppercase font-semibold">
                  Step {steps.indexOf(activeStep) + 1} of 10 &bull; {activeStep.step.replace(/^[0-9]+_/, '').replace('_', ' ')}
                </p>
              </div>
              <button 
                onClick={() => setActiveStep(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-64 h-64 flex-shrink-0 bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 flex items-center justify-center">
                <img 
                  src={activeStep.url.startsWith('http') ? activeStep.url : `${axiosDefaultsBaseUrl()}${activeStep.url}`} 
                  alt={activeStep.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (activeStep.base64) {
                      e.target.src = `data:image/jpeg;base64,${activeStep.base64}`;
                    }
                  }}
                />
              </div>
              <div className="space-y-4">
                <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 p-4 rounded-xl">
                  <h5 className="font-bold text-sm text-primary-600 dark:text-primary-400 mb-1">
                    Image Operations & Rationale
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeStep.description}
                  </p>
                </div>
                <div className="text-[10px] space-y-1 bg-slate-50 dark:bg-slate-900/30 border p-3.5 rounded-xl text-slate-400">
                  <p>&bull; Target Dimensions: 224 x 224 px</p>
                  <p>&bull; Color Profile: BGR OpenCV Matrix format</p>
                  <p>&bull; Interpolation: Bilinear Area interpolation</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-end bg-slate-50/50 dark:bg-slate-900/30">
              <button 
                onClick={() => setActiveStep(null)}
                className="px-5 py-2.5 text-xs font-bold bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-md shadow-primary-500/20"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Helper to access api base url dynamically
function axiosDefaultsBaseUrl() {
  return API_URL.replace('/api', '');
}
