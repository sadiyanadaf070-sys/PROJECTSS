import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import ImageCanvasEditor from '../components/ImageCanvasEditor';
import PreprocessingVisualizer from '../components/PreprocessingVisualizer';
import { API_URL } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Icons
import { 
  Upload, Sparkles, FileText, CheckCircle, RefreshCw, BarChart2,
  FileCheck, ShieldCheck, Microscope, Database, Download, CheckCircle2,
  AlertTriangle, Stethoscope, BookOpen, User, Flame
} from 'lucide-react';

export default function PredictPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report');

  // Flow states: 'select', 'edit', 'uploading', 'result'
  const [flow, setFlow] = useState('select');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSrc, setSelectedSrc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form details
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  // Result metadata
  const [resultData, setResultData] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Load existing report details if reportId is passed
  useEffect(() => {
    if (reportId) {
      loadReportDetails(reportId);
    }
  }, [reportId]);

  const loadReportDetails = async (id) => {
    setFlow('uploading');
    setUploadProgress(40);
    try {
      const res = await axios.get(`/predict/details/${id}`);
      setUploadProgress(100);
      setResultData(res.data.scan);
      setFlow('result');
      // Look up PDF if exists
      setPdfUrl(`/static/reports/report_${id}.pdf`);
    } catch (err) {
      console.error("Report details fetch failed:", err);
      setFlow('select');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setSelectedSrc(URL.createObjectURL(file));
      setFlow('edit');
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setSelectedSrc(URL.createObjectURL(file));
      setFlow('edit');
    }
  };

  const handleEditorSave = async (fileBlob, previewDataUrl) => {
    // Transition to upload state
    setFlow('uploading');
    setUploadProgress(10);
    
    // Prepare multi-part request
    const formData = new FormData();
    formData.append('image', fileBlob);
    formData.append('patientName', patientName || 'Standard Patient');
    formData.append('age', age || 'N/A');
    formData.append('gender', gender);

    try {
      const res = await axios.post('/predict/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      // Complete
      setResultData(res.data.data);
      setFlow('result');
      
      // Fire confetti for success
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      
    } catch (err) {
      console.error("Analysis request failed:", err);
      alert(err.response?.data?.message || "Prediction failed. Check backend connection.");
      setFlow('select');
    }
  };

  const generatePdf = async () => {
    if (!resultData?.id) return;
    setPdfGenerating(true);
    try {
      const res = await axios.get(`/reports/generate/${resultData.id}`);
      setPdfUrl(res.data.url);
      
      // Trigger download automatically
      const downloadUrl = `${API_URL}/reports/download/${resultData.id}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `DermAI_Report_${resultData.id.slice(0, 6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const restartScan = () => {
    setSelectedFile(null);
    setSelectedSrc(null);
    setResultData(null);
    setPdfUrl(null);
    setFlow('select');
  };

  return (
    <div className="space-y-8 text-left pb-10">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <Microscope className="w-8 h-8 text-primary-500" />
          <span>Dermatology Lab Core</span>
        </h2>
        <p className="text-sm text-slate-400 font-semibold mt-1">
          Perform clinical image uploads, adjust filters, and evaluate CNN target probability matrices.
        </p>
      </div>

      {flow === 'select' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Details input form */}
          <div className="lg:col-span-4 glass-panel p-6 border shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider mb-2">Patient Records</h4>
            
            <div>
              <label className="text-xs font-bold block mb-1">Patient Name</label>
              <input 
                type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                placeholder="Name or Patient ID"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1">Age</label>
                <input 
                  type="number" value={age} onChange={(e) => setAge(e.target.value)}
                  placeholder="Years"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Gender</label>
                <select 
                  value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload panel */}
          <div className="lg:col-span-8">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="glass-panel border-2 border-dashed border-slate-200/80 dark:border-slate-800 hover:border-primary-500/50 p-12 text-center shadow-sm cursor-pointer transition-colors duration-300 relative group min-h-[300px] flex flex-col justify-center items-center"
            >
              <input 
                type="file" accept="image/*" onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              
              <div className="bg-primary-50 dark:bg-primary-950/20 p-5 rounded-3xl text-primary-500 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8" />
              </div>
              
              <h3 className="font-extrabold text-lg mt-6 text-slate-800 dark:text-slate-100">
                {t('upload_drag')}
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Supports clinical JPEG, PNG formats. Max file resolution size 10MB.
              </p>
            </div>
          </div>
        </div>
      )}

      {flow === 'edit' && (
        <div className="max-w-2xl mx-auto">
          <ImageCanvasEditor 
            imageSrc={selectedSrc} 
            onSave={handleEditorSave} 
            onCancel={restartScan} 
          />
        </div>
      )}

      {flow === 'uploading' && (
        <div className="glass-panel max-w-md mx-auto p-8 border shadow-lg text-center space-y-6">
          <RefreshCw className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
          <div>
            <h3 className="font-extrabold text-base">Processing Lesion Telemetry</h3>
            <p className="text-xs text-slate-400 mt-1">Applying OpenCV filters & evaluating model weights...</p>
          </div>
          
          <div className="space-y-1">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-primary-500">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {flow === 'result' && resultData && (
        <div className="space-y-8">
          
          {/* Main Predict Diagnosis Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Visual Overlays & Grad-CAM */}
            <div className="lg:col-span-5 glass-panel p-6 border shadow-sm flex flex-col justify-between">
              <h4 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider mb-4">Grad-CAM Activation Visuals</h4>
              
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border bg-slate-900 group shadow-md">
                {/* Side-by-side transition animation */}
                <img 
                  src={resultData.original_url.startsWith('http') ? resultData.original_url : `${axiosDefaultsBaseUrl()}${resultData.original_url}`} 
                  alt="Original"
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
                
                {/* Heatmap overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <img 
                    src={resultData.heatmap_url.startsWith('http') ? resultData.heatmap_url : `${axiosDefaultsBaseUrl()}${resultData.heatmap_url}`} 
                    alt="Grad-CAM"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (resultData.heatmap_b64) {
                        e.target.src = `data:image/jpeg;base64,${resultData.heatmap_b64}`;
                      }
                    }}
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-950/70 text-white p-2.5 rounded-xl text-center backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Heatmap highlighting prediction factors</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Hover photo to overlay Heatmap
                </span>
              </div>
            </div>

            {/* CNN outputs */}
            <div className="lg:col-span-7 glass-panel p-6 border shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-primary-500 uppercase block">AI Primary Diagnosis</span>
                  <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {resultData.prediction}
                  </h3>
                </div>
                
                {/* Severity Badge */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Lesion Severity</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase ${
                    resultData.severity === 'Mild' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                    (resultData.severity === 'Moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 
                    'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400')
                  }`}>
                    {resultData.severity}
                  </span>
                </div>
              </div>

              {/* Confidence Matrix */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-500 uppercase tracking-wide">Target Class Probabilities</h4>
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-2">
                  {resultData.all_predictions.slice(0, 5).map((pred) => (
                    <div key={pred.disease} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span>{pred.disease}</span>
                        <span>{roundConf(pred.confidence)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pred.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Actions */}
              <div className="flex flex-wrap gap-4 pt-2 border-t">
                <button
                  onClick={generatePdf}
                  disabled={pdfGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-xl shadow-lg shadow-primary-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center space-x-2 text-xs"
                >
                  {pdfGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating report...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{t('download_report')}</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={restartScan}
                  className="px-6 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold rounded-xl transition text-xs"
                >
                  Analyze Another Lesion
                </button>
              </div>

            </div>
          </div>

          {/* OpenCV Pipeline Visualizer */}
          <div className="border-t pt-8">
            <PreprocessingVisualizer steps={resultData.preprocessed_steps} />
          </div>

          {/* Dataset Matches */}
          <div className="glass-panel border shadow-sm p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b pb-4">
              <Database className="w-6 h-6 text-secondary-500" />
              <h3 className="font-extrabold text-lg">Dataset Similarity Comparison</h3>
            </div>
            
            <p className="text-xs text-slate-500">
              Matches features against verified clinical registries: **ISIC Archive**, **HAM10000**, and **DermNet NZ** utilizing Cosine Similarity matrices.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {resultData.dataset_matches.map((match, idx) => (
                <div key={idx} className="border dark:border-slate-800 p-4 rounded-xl space-y-3 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                      {match.dataset}
                    </span>
                    <h5 className="font-bold text-xs truncate mt-2 text-slate-800 dark:text-slate-200">{match.filename}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Label: {match.label}</p>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400 text-[10px]">Similarity:</span>
                      <span className="text-secondary-500">{match.similarity_percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="glass-panel border shadow-sm p-6 space-y-6 text-left">
            <div className="flex items-center space-x-2 border-b pb-4">
              <Stethoscope className="w-6 h-6 text-accent-500" />
              <h3 className="font-extrabold text-lg">Clinical Guidance Recommendations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-primary-500">
                  <BookOpen className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Symptoms & Causes</h4>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border space-y-3 text-xs">
                  <p><strong>Common Symptoms:</strong> redness, mild local swelling, itchiness, scaling skin.</p>
                  <p><strong>Potential Causes:</strong> environmental irritants, genetic skin barrier issues, allergen reactions.</p>
                </div>
              </div>

              {/* Box 2 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-secondary-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Actionable Care & Meds</h4>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border space-y-3 text-xs">
                  <p><strong>OTC Suggestions:</strong> Calamine lotion, aloe extract, standard skin barriers creams.</p>
                  <p><strong>Dietary Guidance:</strong> Eat leafy greens, antioxidants, omega-3 rich fish. Avoid refined sugars, high fats, trans fats.</p>
                </div>
              </div>

              {/* Box 3 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Precautions & Warnings</h4>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border space-y-3 text-xs">
                  <p><strong>Precautions:</strong> Do not squeeze, pick, or scratch. Keep area clean and dry. Apply sun blocker SPF 30+ daily.</p>
                  <p className="text-red-500 font-semibold"><strong>Dermatologist Consultation:</strong> Visit a doctor immediately if lesion bleeds, shifts shape, or forms deep painful cysts.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

function roundConf(val) {
  return `${Math.round(val * 100)}%`;
}

function axiosDefaultsBaseUrl() {
  return API_URL.replace('/api', '');
}
