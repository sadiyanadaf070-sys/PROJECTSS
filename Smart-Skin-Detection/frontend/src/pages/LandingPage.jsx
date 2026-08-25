import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Activity, ShieldCheck, Microscope, Cpu, ArrowRight, Star, HeartHandshake, PhoneCall, HelpCircle } from 'lucide-react';

export default function LandingPage() {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="w-full space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 md:pt-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 px-3.5 py-1.5 rounded-full border border-primary-200 dark:border-primary-900/50 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>SIH 2026 Innovation Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-800 dark:text-slate-100">
              Smart Skin <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 via-secondary-400 to-accent-500">
                Disease Detection
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-xl">
              Leverage the power of advanced OpenCV morphological filters and MobileNetV2 Deep Learning to perform clinical skin classification. Compare structures, track lesion improvements, and consult local specialists instantly.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                to="/analyze" 
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-2xl shadow-xl shadow-primary-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-2"
              >
                <span>Analyze Scan Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/about" 
                className="px-8 py-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold rounded-2xl transition duration-200"
              >
                Learn Methodology
              </Link>
            </div>
          </div>

          {/* Graphic Mockup Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500 to-secondary-400 opacity-20 rounded-full blur-2xl animate-pulse-slow" />
            <motion.div 
              initial={{ rotate: -3, scale: 0.95 }}
              animate={{ rotate: 1, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
              className="glass-panel w-full max-w-sm p-6 relative border shadow-2xl space-y-6"
            >
              {/* Card top */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Dermatological Analytics</span>
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping" />
              </div>

              {/* Lesion graphic representation */}
              <div className="relative aspect-square w-full rounded-2xl bg-slate-900 border border-slate-700/50 flex items-center justify-center overflow-hidden">
                <div className="absolute w-24 h-24 rounded-full bg-red-500/30 blur-xl" />
                <div className="w-16 h-12 rounded-full border-4 border-dashed border-red-500/60 rotate-12 flex items-center justify-center">
                  <Microscope className="w-6 h-6 text-red-400" />
                </div>
                {/* Horizontal scanner light */}
                <div className="absolute w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-400 shadow-md shadow-primary-500 top-1/2 left-0 transform -translate-y-1/2 animate-bounce" />
              </div>

              {/* Progress meters */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>Melanoma Likelihood</span>
                  <span className="text-red-500">89.4% (Severe)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full w-[89%]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "94.2%", label: "Inference Accuracy" },
            { value: "10 Stages", label: "Image Preprocessing" },
            { value: "14 Classes", label: "Diseases Detected" },
            { value: "0.2s", label: "Inference Time" }
          ].map((stat, idx) => (
            <div key={idx} className="glass-panel p-6 text-center border shadow-sm">
              <h3 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                {stat.value}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 font-bold uppercase mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features */}
      <section className="max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
            Engineered For Clinical Excellence
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Designed for SIH Hackathons and research publication, integrating cutting-edge features.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { 
              icon: Microscope, 
              title: "10-Step Preprocessing", 
              desc: "Sequential Dull Razor hair removal, CLAHE histogram normalization, and Canny/Otsu filters to extract crisp borders.",
              color: "from-blue-500 to-cyan-400"
            },
            { 
              icon: Cpu, 
              title: "CNN Image Classification", 
              desc: "MobileNetV2 Deep Neural Networks fine-tuned to classify 14 distinct dermatological diseases with probability metrics.",
              color: "from-teal-500 to-emerald-400"
            },
            { 
              icon: ShieldCheck, 
              title: "Explainable AI (Grad-CAM)", 
              desc: "Gradient-weighted Class Activation Mapping displays visual overlays highlighting relevant features leading to predictions.",
              color: "from-purple-500 to-indigo-400"
            }
          ].map((feat, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="glass-panel p-6 border shadow-sm text-left hover:shadow-lg transition-shadow group"
            >
              <div className={`bg-gradient-to-tr ${feat.color} p-3 rounded-2xl text-white inline-block shadow-md group-hover:scale-105 transition-transform`}>
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg mt-4 text-slate-800 dark:text-slate-100">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black">How It Works</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Get instant screening report in four easy stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            { step: "01", title: "Upload / Capture", desc: "Upload single/multiple lesion images." },
            { step: "02", title: "Apply Preprocessing", desc: "Adjust parameters using our canvas tools." },
            { step: "03", title: "Deep Learning Prediction", desc: "Model computes classification probabilities." },
            { step: "04", title: "Generate Report", desc: "Download PDF report with Grad-CAM and nearby clinics." }
          ].map((s, idx) => (
            <div key={idx} className="glass-panel p-6 border shadow-sm text-left relative flex flex-col justify-between min-h-[160px]">
              <span className="text-4xl font-black text-primary-500/20 absolute top-4 right-4">{s.step}</span>
              <div className="space-y-2 mt-4">
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial & Support */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="glass-panel p-8 border shadow-sm flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-slate-500 italic leading-relaxed text-sm">
              "The 10-step preprocessing visualization allows clinical researchers to trace exactly how the image noise is cleared out. Outstanding product that matches high-end clinical tools in aesthetics and utility."
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-6">
            <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center font-extrabold text-sm text-primary-500">
              Dr
            </div>
            <div>
              <h5 className="font-bold text-sm">Dr. Suresh Ramachandran</h5>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Chief Dermatologist, AIIMS Delhi</p>
            </div>
          </div>
        </div>

        {/* Contact section */}
        <div className="glass-panel p-8 border shadow-sm text-left flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-black text-2xl flex items-center space-x-2">
              <HeartHandshake className="w-6 h-6 text-primary-500" />
              <span>Reach Out & Collaborate</span>
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Have questions regarding research collaboration, API access, or deployment? Fill out the contact form or call our emergency hotline.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
              <PhoneCall className="w-5 h-5 text-primary-500" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold block uppercase">Call Hotline</p>
                <p className="text-xs font-bold">+91 11-26588500</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
              <HelpCircle className="w-5 h-5 text-secondary-500" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold block uppercase">Support Email</p>
                <p className="text-xs font-bold">sih@smartskin.gov.in</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
