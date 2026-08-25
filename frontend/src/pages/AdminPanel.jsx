import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldAlert, Users, Layers, Activity, RefreshCw, Cpu, CheckCircle } from 'lucide-react';

export default function AdminPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrainingStatus, setRetrainingStatus] = useState(''); // 'idle', 'retraining'

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Poll retrain status if active
  useEffect(() => {
    if (retrainingStatus !== 'retraining') return;
    
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/admin/dashboard');
        setData(res.data);
        
        // Check if retraining finished
        const activeRetrain = res.data.retrain_logs.find(l => l.status === 'In Progress');
        if (!activeRetrain) {
          setRetrainingStatus('idle');
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling retrain status failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [retrainingStatus]);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/admin/dashboard');
      setData(res.data);
      
      // Determine if a retrain log is active on mount
      const activeRetrain = res.data.retrain_logs.find(l => l.status === 'In Progress');
      if (activeRetrain) {
        setRetrainingStatus('retraining');
      }
    } catch (err) {
      console.error("Admin dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetrainingStatus('retraining');
    try {
      const res = await axios.post('/admin/retrain');
      alert(res.data.message);
      // Reload immediately to create the log entry
      fetchDashboard();
    } catch (err) {
      console.error("Retrain trigger failed:", err);
      alert("Retrain failed to initiate.");
      setRetrainingStatus('idle');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Activity className="w-10 h-10 text-primary-500 animate-spin" />
        <span className="text-sm text-slate-400 font-bold">Connecting to administrative core...</span>
      </div>
    );
  }

  const logs = data?.retrain_logs || [];
  const users = data?.users || [];
  const stats = data?.stats || { total_users: 0, total_scans: 0, total_doctors: 0 };

  return (
    <div className="space-y-8 text-left pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <span>Admin Console</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            System Supervision &bull; Retrain deep learning classifiers and inspect telemetry.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border shadow-sm flex items-center space-x-4">
          <div className="bg-primary-500/10 text-primary-500 p-4 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{stats.total_users}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Active Registrations</p>
          </div>
        </div>

        <div className="glass-panel p-6 border shadow-sm flex items-center space-x-4">
          <div className="bg-secondary-500/10 text-secondary-500 p-4 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{stats.total_scans}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Queries Logged</p>
          </div>
        </div>

        <div className="glass-panel p-6 border shadow-sm flex items-center space-x-4">
          <div className="bg-accent-500/10 text-accent-500 p-4 rounded-2xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{logs.filter(l => l.status === 'Completed').length}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">CNN Training Cycles</p>
          </div>
        </div>
      </div>

      {/* Model Retraining Control */}
      <div className="glass-panel p-6 border shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 space-y-2">
          <h3 className="font-extrabold text-lg flex items-center space-x-2 text-slate-800 dark:text-slate-100">
            <Cpu className="w-5 h-5 text-primary-500" />
            <span>Retrain CNN Classification Model</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            Triggering retraining compiles newly registered user images and feeds them into the MobileNetV2 optimizer pipeline to recalibrate classification accuracy indices.
          </p>
        </div>

        <div className="lg:col-span-4">
          <button
            onClick={handleRetrain}
            disabled={retrainingStatus === 'retraining'}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-amber-500 text-white font-extrabold rounded-xl shadow-lg shadow-red-500/20 hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all flex items-center justify-center space-x-2 text-xs"
          >
            {retrainingStatus === 'retraining' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fine-tuning Model weights...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Initialize Retraining</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Retraining logs */}
        <div className="lg:col-span-6 glass-panel border shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b bg-slate-50/50 dark:bg-slate-900/30">
            <h4 className="font-extrabold text-sm uppercase text-slate-500 tracking-wider">Model Training Logs</h4>
          </div>

          <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No model retraining logs recorded.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border dark:border-slate-800 p-4 rounded-xl space-y-2 text-xs bg-slate-50/40 dark:bg-slate-900/30">
                  <div className="flex justify-between items-center font-bold">
                    <span>Cycle #{log.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                      log.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/20' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 animate-pulse'
                    }`}>
                      {log.status} ({log.progress})
                    </span>
                  </div>
                  
                  <p className="text-slate-400 leading-normal text-[11px] font-mono whitespace-pre-wrap">{log.details}</p>
                  
                  <div className="border-t pt-2 mt-2 flex justify-between items-center text-[10px] text-slate-400">
                    <span>By: {log.trigger_by}</span>
                    <span>Acc: {log.accuracy === 'N/A' ? 'N/A' : `${(log.accuracy * 100).toFixed(1)}%`}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users list */}
        <div className="lg:col-span-6 glass-panel border shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b bg-slate-50/50 dark:bg-slate-900/30">
            <h4 className="font-extrabold text-sm uppercase text-slate-500 tracking-wider">User Registrations</h4>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-slate-50/20 dark:bg-slate-950/20 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 uppercase font-bold text-slate-400 text-[10px]">
                      {u.role}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        u.is_verified ? 'bg-green-100 text-green-700 dark:bg-green-950/20' : 'bg-red-100 text-red-700 dark:bg-red-950/20'
                      }`}>
                        {u.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
