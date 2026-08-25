import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, User, Lock, KeyRound, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SignupPage() {
  const { signup, verifyEmailOtp } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification step
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const passwordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-200' };
    if (password.length < 6) return { label: 'Weak', color: 'bg-red-400 w-1/3' };
    if (password.length < 10) return { label: 'Medium', color: 'bg-yellow-400 w-2/3' };
    return { label: 'Strong', color: 'bg-green-400 w-full' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);

    if (result.success) {
      if (result.otpDemo) {
        setDemoOtp(result.otpDemo);
      }
      setIsVerifying(true);
    } else {
      setError(result.message);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyEmailOtp(email, otp);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 border shadow-2xl relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-10 -z-10" />

        {!isVerifying ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Create Account</h2>
              <p className="text-sm text-slate-500">Register to initialize your diagnostics dashboard</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-500 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Sarah Connor"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.org"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                {/* Strength Meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span>Password Strength:</span>
                      <span>{passwordStrength().label}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${passwordStrength().color}`} />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-xl shadow-lg shadow-primary-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Registering...' : 'Sign Up'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 hover:underline font-bold">
                Log In
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Verify Email</h2>
              <p className="text-sm text-slate-500">We have sent a verification code to {email}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-500">
                {error}
              </div>
            )}

            {demoOtp && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-500">
                <strong>Demo Verification Code:</strong> {demoOtp} (Provided for hackathon evaluation)
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">6-Digit Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm tracking-[0.3em] font-extrabold focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-primary-500 text-white font-extrabold rounded-xl hover:bg-primary-600 transition"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
