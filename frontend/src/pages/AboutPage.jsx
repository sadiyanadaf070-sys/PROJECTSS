import React from 'react';
import { GraduationCap, Microscope, BookOpen, Cpu, ShieldCheck, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 text-left pb-10">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <GraduationCap className="w-8 h-8 text-primary-500" />
          <span>Research & Methodology</span>
        </h2>
        <p className="text-sm text-slate-400 font-semibold mt-1">
          Final Year Engineering Project &bull; Academic Architecture Overview.
        </p>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="glass-panel p-6 border shadow-sm space-y-4">
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-primary-500" />
          <span>Project Abstract & Objectives</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Skin diseases are highly prevalent across populations, yet clinical diagnosis requires specialized dermatological visual checks which are often unavailable in rural areas. Early detection of malignant Melanoma compared to benign lesions (like Eczema or Psoriasis) drastically increases patient survival index. 
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          **Core Objective**: Build a complete client-server neural diagnostic engine that performs automated Dull Razor hair removal, localized CLAHE contrast balancing, and MobileNetV2 Deep Convolutional network prediction.
        </p>
      </div>

      {/* Preprocessing Equations */}
      <div className="glass-panel p-6 border shadow-sm space-y-6">
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <Microscope className="w-5 h-5 text-secondary-500" />
          <span>Image Preprocessing Mathematical Formulations</span>
        </h3>
        
        <div className="space-y-4 text-xs">
          {/* Gaussian Blur */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border">
            <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">1. Gaussian Filtering Kernels</h5>
            <p className="text-slate-400 leading-relaxed mt-1">
              Used to suppress high frequency sensor noise. The 2D Gaussian kernel distribution is mathematically formulated as:
            </p>
            <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border text-center font-mono my-2 overflow-x-auto text-[10px]">
              G(x, y) = [ 1 / (2 * π * σ²) ] * e^[ -(x² + y²) / (2 * σ²) ]
            </div>
            <p className="text-slate-400">Where x and y define kernel spatial coordinates and σ represents standard deviation.</p>
          </div>

          {/* Otsu Segmentation */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border">
            <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">2. Otsu Binarization Skin Segmentation</h5>
            <p className="text-slate-400 leading-relaxed mt-1">
              Calculates thresholding boundaries dynamically by maximizing between-class variance represented as:
            </p>
            <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border text-center font-mono my-2 overflow-x-auto text-[10px]">
              σ_w²(t) = ω_0(t)σ_0²(t) + ω_1(t)σ_1²(t)
            </div>
            <p className="text-slate-400">Determines threshold *t* separating background and lesion pixels by weighting variance proportions.</p>
          </div>
        </div>
      </div>

      {/* CNN architecture */}
      <div className="glass-panel p-6 border shadow-sm space-y-4">
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-accent-500" />
          <span>Deep CNN Transfer Learning Architecture</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The prediction pipeline leverages **MobileNetV2** transfer learning. Features are extracted using Depthwise Separable convolutions reducing parameters, suitable for fast mobile diagnostics. 
        </p>
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border text-xs">
          <p><strong>Input Shape:</strong> 224 x 224 x 3 pixels (RGB)</p>
          <p className="mt-1"><strong>Convolution Backbone:</strong> Depthwise separable blocks + linear bottlenecks (MobileNetV2 pre-trained on ImageNet)</p>
          <p className="mt-1"><strong>Custom Head:</strong> Global Average Pooling 2D &rarr; Dropout (20%) &rarr; Softmax Dense Classification Layer (14 target classes)</p>
        </div>
      </div>

      {/* Credits Team */}
      <div className="glass-panel p-6 border shadow-sm space-y-6">
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          <span>Project Credits & Mentors</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2 border-r pr-6 dark:border-slate-850">
            <h5 className="font-extrabold text-sm uppercase text-slate-400">Team Roster</h5>
            <p><strong>Lead AI Engineer:</strong> Sadiya (Registration ID: SIH-2026-0421)</p>
            <p><strong>Full Stack & UI Designer:</strong> Pair Programmer Partner</p>
            <p><strong>System Architect:</strong> Advanced Engineering Team</p>
          </div>

          <div className="space-y-2 pl-2">
            <h5 className="font-extrabold text-sm uppercase text-slate-400">Academic Guides</h5>
            <p><strong>Project Director:</strong> Dr. Rajeshwari Kumar, HOD Dermatology</p>
            <p><strong>Technical Mentor:</strong> Prof. Amit Sen, Department of Computer Science</p>
            <p><strong>Institution:</strong> Smart India Engineering Institute (SIEI)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
