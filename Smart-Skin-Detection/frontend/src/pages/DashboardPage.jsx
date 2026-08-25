import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { LayoutDashboard, FileText, CheckCircle, AlertTriangle, HelpCircle, ArrowRight, Activity, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Register Chart.js models
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          axios.get('/analytics/stats'),
          axios.get('/predict/history')
        ]);
        
        setStats(statsRes.data);
        setRecentScans(historyRes.data.scans.slice(0, 5)); // top 5 recent scans
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Activity className="w-10 h-10 text-primary-500 animate-spin" />
        <span className="text-sm text-slate-400 font-bold">Compiling medical telemetry...</span>
      </div>
    );
  }

  // Pre-load chart configs
  const diseaseData = {
    labels: stats?.disease_distribution.map(d => d.disease) || [],
    datasets: [{
      data: stats?.disease_distribution.map(d => d.count) || [],
      backgroundColor: [
        '#3B82F6', '#14B8A6', '#A855F7', '#EF4444', '#F59E0B', 
        '#EC4899', '#6366F1', '#10B981', '#64748B', '#F43F5E'
      ],
      borderWidth: 1,
    }]
  };

  const activityData = {
    labels: stats?.monthly_activity.map(a => a.month) || [],
    datasets: [{
      label: 'Monthly Scans Volume',
      data: stats?.monthly_activity.map(a => a.scans) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.65)',
      borderColor: '#3B82F6',
      borderWidth: 1,
      borderRadius: 8,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#F8FAFC' : '#1E293B',
          font: { size: 10, weight: 'bold' }
        }
      }
    }
  };

  return (
    <div className="space-y-8 text-left pb-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <LayoutDashboard className="w-8 h-8 text-primary-500" />
            <span>Clinical Workspace</span>
          </h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Hello, {user?.name} &bull; Manage dermatological profiles and AI diagnostic history.
          </p>
        </div>
        <Link
          to="/analyze"
          className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-xl shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-1.5 text-sm"
        >
          <span>New Lesion Scan</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border shadow-sm flex items-center space-x-4">
          <div className="bg-primary-500/10 text-primary-500 p-4 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{stats?.total_scans || 0}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Total Predictions</p>
          </div>
        </div>

        <div className="glass-panel p-6 border shadow-sm flex items-center space-x-4">
          <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{stats?.severity_counts?.Mild || 0}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Mild Conditions</p>
          </div>
        </div>

        <div className="glass-panel p-6 border shadow-sm flex items-center space-x-4">
          <div className="bg-amber-500/10 text-amber-500 p-4 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{stats?.severity_counts?.Moderate || 0}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Moderate Cases</p>
          </div>
        </div>

        <div className="glass-panel p-6 border shadow-sm flex items-center space-x-4">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{stats?.severity_counts?.Severe || 0}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Severe Cases</p>
          </div>
        </div>
      </div>

      {/* Graph Panels */}
      {stats?.total_scans > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 border shadow-sm flex flex-col min-h-[300px]">
            <h4 className="font-extrabold text-sm text-slate-500 mb-4 uppercase tracking-wide">
              Primary Diagnostic Prevalence
            </h4>
            <div className="flex-1 relative h-64">
              <Doughnut data={diseaseData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-panel p-6 border shadow-sm flex flex-col min-h-[300px]">
            <h4 className="font-extrabold text-sm text-slate-500 mb-4 uppercase tracking-wide">
              Monthly Screening volume
            </h4>
            <div className="flex-1 relative h-64">
              <Bar data={activityData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Predictions */}
      <div className="glass-panel border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
          <h3 className="font-extrabold text-base">Recent Diagnostic Scans</h3>
          <Link to="/tracker" className="text-xs text-primary-500 hover:underline font-bold">
            Track Weekly Progress
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-4">
            <Calendar className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No skin scans registered yet. Begin by uploading a lesion photo.</p>
            <Link to="/analyze" className="inline-block px-5 py-2.5 bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/25">
              Analyze Lesion
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">AI Prediction</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentScans.map((scan) => {
                  const sevColors = {
                    Mild: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
                    Moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
                    Severe: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                  };
                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4.5 font-semibold">{scan.patient_name}</td>
                      <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">{scan.prediction}</td>
                      <td className="px-6 py-4.5 font-bold text-primary-500">{roundConf(scan.confidence)}</td>
                      <td className="px-6 py-4.5">
                        <span className={`px-2.5 py-0.5 rounded-md font-extrabold uppercase text-[10px] ${sevColors[scan.severity] || 'bg-slate-100 text-slate-500'}`}>
                          {scan.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-slate-400">{new Date(scan.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4.5 text-right">
                        <Link
                          to={`/analyze?report=${scan.id}`}
                          className="px-4 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all inline-block"
                        >
                          {t('view_details')}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function roundConf(val) {
  return `${Math.round(val * 100)}%`;
}
