import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Calibrate base URL to local backend port
export const API_URL = 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token to Axios defaults headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('auth_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/auth/profile');
        setUser(res.data.user);
      } catch (err) {
        console.error("Profile load failed:", err);
        // Clean stale tokens
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  const login = async (email, password, rememberMe) => {
    try {
      const res = await axios.post('/auth/login', { email, password, rememberMe });
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, message: res.data.message };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed. Server unreachable.' 
      };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await axios.post('/auth/signup', { name, email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return { 
        success: true, 
        message: res.data.message, 
        otpDemo: res.data.otp_demo // For testing ease
      };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed.' 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const verifyEmailOtp = async (email, otp) => {
    try {
      const res = await axios.post('/auth/verify-otp', { email, otp, purpose: 'verify_email' });
      // Update local state is_verified
      if (user) setUser({ ...user, is_verified: true });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'OTP verification failed.' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      return { success: true, message: res.data.message, otpDemo: res.data.otp_demo };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Forgot password failed.' };
    }
  };

  const verifyResetOtp = async (email, otp) => {
    try {
      const res = await axios.post('/auth/verify-otp', { email, otp, purpose: 'reset_password' });
      return { success: true, resetToken: res.data.reset_token };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Incorrect OTP code.' };
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      const res = await axios.post('/auth/reset-password', { token: resetToken, password });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Reset failed.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, signup, logout, 
      verifyEmailOtp, forgotPassword, verifyResetOtp, resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
