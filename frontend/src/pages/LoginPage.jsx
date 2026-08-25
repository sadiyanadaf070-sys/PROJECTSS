import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Lock, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, forgotPassword, verifyResetOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [flow, setFlow] = useState('login'); // 'login', 'forgot', 'otp', 'reset'
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password, rememberMe);
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await forgotPassword(email);
    setLoading(false);
    
    if (result.success) {
      setSuccess(result.message);
      if (result.otpDemo) {
        setDemoOtp(result.otpDemo);
      }
      setFlow('otp');
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyResetOtp(email, otp);
    setLoading(false);
    
    if (result.success) {
      setResetToken(result.resetToken);
      setFlow('reset');
    } else {
      setError(result.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await resetPassword(resetToken, newPassword);
    setLoading(false);
    
    if (result.success) {
      setSuccess(result.message);
      setFlow('login');
      setPassword('');
      setDemoOtp('');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 border shadow-2xl relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-10 -z-10" />

        {flow === 'login' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Welcome Back</h2>
              <p className="text-sm text-slate-500">Sign in to your clinical dashboard</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-500 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-xs text-green-500 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">Password</label>
                  <button
                    type="button" onClick={() => setFlow('forgot')}
                    className="text-xs text-primary-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-primary-500 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs font-semibold text-slate-500 ml-2 cursor-pointer select-none">
                  Remember my session (30 days)
                </label>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-extrabold rounded-xl shadow-lg shadow-primary-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-500 hover:underline font-bold">
                Create Account
              </Link>
            </p>
          </div>
        )}

        {flow === 'forgot' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Recover Password</h2>
              <p className="text-sm text-slate-500">We will mail you a 6-digit OTP verification code</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
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

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-primary-500 text-white font-extrabold rounded-xl hover:bg-primary-600 transition"
              >
                {loading ? 'Sending Code...' : 'Request OTP'}
              </button>

              <button
                type="button" onClick={() => setFlow('login')}
                className="w-full text-center text-xs font-bold text-slate-400 hover:underline"
              >
                Back to Login
              </button>
            </form>
          </div>
        )}

        {flow === 'otp' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Verify OTP</h2>
              <p className="text-sm text-slate-500">Enter code sent to {email}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-500">
                {error}
              </div>
            )}

            {demoOtp && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-500">
                <strong>Demo OTP Code:</strong> {demoOtp} (Provided for hackathon evaluation)
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          </div>
        )}

        {flow === 'reset' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Set New Password</h2>
              <p className="text-sm text-slate-500">Enter your new secure password credential</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-primary-500 text-white font-extrabold rounded-xl hover:bg-primary-600 transition"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
