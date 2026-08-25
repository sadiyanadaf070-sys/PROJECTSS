import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BarChart3, Plus, Calendar, RefreshCw, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { API_URL } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ProgressTracker() {
  const [trends, setTrends] = useState(null);
  const [activeGroup, setActiveGroup] = useState('');
  const [loading, setLoading] = useState(true);

  // New entry form states
  const [bodyPart, setBodyPart] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [fileSrc, setFileSrc] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const res = await axios.get('/predict/progress/track');
      setTrends(res.data.trends);
      // Select first body part as active if any exists
      const keys = Object.keys(res.data.trends);
      if (keys.length > 0 && !activeGroup) {
        setActiveGroup(keys[0]);
      }
    } catch (err) {
      console.error("Progress tracker load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileSrc(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !bodyPart) return;

    setRegistering(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('bodyPart', bodyPart);
    formData.append('notes', notes);

    try {
      await axios.post('/predict/progress', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormOpen(false);
      setFile(null);
      setFileSrc(null);
      setNotes('');
      setBodyPart('');
      
      // reload
      await fetchTrends();
    } catch (err) {
      alert("Progress registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  // Compile active line chart data
  const chartData = () => {
    const activeEntries = trends?.[activeGroup] || [];
    return {
      labels: activeEntries.map((e) => `Week ${e.week}`),
      datasets: [
        {
          label: 'Lesion Improvement Index (%)',
          data: activeEntries.map((e) => e.improvement_index),
          fill: false,
          borderColor: '#14B8A6',
          backgroundColor: '#14B8A6',
          tension: 0.25,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: document.documentElement.classList.contains('dark') ? '#F8FAFC' : '#1E293B' }
      },
      x: {
        ticks: { color: document.documentElement.classList.contains('dark') ? '#F8FAFC' : '#1E293B' }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Activity className="w-10 h-10 text-primary-500 animate-spin" />
        <span className="text-sm text-slate-400 font-bold">Assembling weekly patient logs...</span>
      </div>
    );
  }

  const activeEntries = trends?.[activeGroup] || [];

  return (
    <div className="space-y-8 text-left pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-primary-500" />
            <span>Weekly Progress Tracker</span>
          </h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Register custom lesion areas and upload weekly photos to track skin healing progression indices.
          </p>
        </div>
        
        <button
          onClick={() => setFormOpen(true)}
          className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-xl shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-1.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Lesion</span>
        </button>
      </div>

      {Object.keys(trends || {}).length === 0 ? (
        <div className="glass-panel p-12 border shadow-sm text-center max-w-lg mx-auto space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-base">No Lesion Progress Tracked</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You can log a specific lesion site (e.g. "Forehead Rash") and upload weekly pictures to inspect healing metrics.
          </p>
          <button 
            onClick={() => setFormOpen(true)}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-bold text-xs shadow-md shadow-primary-500/20"
          >
            Create Progression Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left groups selection */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Healing Profiles</span>
            <div className="space-y-2">
              {Object.keys(trends).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveGroup(key)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-extrabold transition-all border ${
                    activeGroup === key 
                      ? 'bg-secondary-500 text-white shadow-lg border-secondary-400' 
                      : 'glass-panel hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Right graphics dashboard */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Progression Graph */}
            <div className="glass-panel p-6 border shadow-sm flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h4 className="font-extrabold text-base">{activeGroup} Progression Chart</h4>
                  <p className="text-xs text-slate-400 font-medium">Weekly comparison index graph</p>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-secondary-500 font-bold bg-secondary-50 dark:bg-secondary-950/20 px-3 py-1 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                  <span>Healing Index increasing</span>
                </div>
              </div>
              
              <div className="flex-1 relative h-64">
                <Line data={chartData()} options={chartOptions} />
              </div>
            </div>

            {/* Weekly photo comparisons */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg">Progression Image Registry</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {activeEntries.map((entry) => {
                  const fullImg = entry.image_url.startsWith('http') ? entry.image_url : `${API_URL.replace('/api', '')}${entry.image_url}`;
                  return (
                    <div key={entry.id} className="glass-panel p-4 border flex flex-col justify-between space-y-4 shadow-sm text-left">
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-750 flex items-center justify-center shadow-inner">
                        <img src={fullImg} alt={`Week ${entry.week}`} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-400">Week {entry.week}</span>
                          <span className="text-xs font-black text-secondary-500">{entry.improvement_index}% index</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-750 dark:text-slate-100">{entry.disease}</h5>
                        <p className="text-[10px] text-slate-400 italic leading-normal truncate">{entry.notes || 'No description notes registered.'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* New tracker item modal dialog */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 border shadow-2xl relative text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-lg">Register Lesion Tracker</h3>
              <button 
                onClick={() => setFormOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-500"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Body Site Label</label>
                <input 
                  type="text" required value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}
                  placeholder="e.g. Forehead rash, left leg spot"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Image Upload</label>
                <div className="border border-dashed rounded-2xl p-6 text-center hover:border-primary-500/50 cursor-pointer transition-colors relative min-h-[120px] flex flex-col justify-center items-center">
                  <input 
                    type="file" required accept="image/*" onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {fileSrc ? (
                    <img src={fileSrc} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow-md" />
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-[10px] text-slate-500">Select lesion photo for this week</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Weekly Notes</label>
                <textarea 
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on redness levels, itching changes..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs h-16 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <button
                type="submit" disabled={registering}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-xl hover:scale-[1.01] active:scale-95 transition-all text-xs flex items-center justify-center space-x-1.5"
              >
                {registering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving progression...</span>
                  </>
                ) : (
                  <span>Initialize Progress Tracking</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
