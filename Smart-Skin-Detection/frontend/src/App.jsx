import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PredictPage from './pages/PredictPage';
import MultiComparePage from './pages/MultiComparePage';
import DoctorLocator from './pages/DoctorLocator';
import ProgressTracker from './pages/ProgressTracker';
import ChatbotPage from './pages/ChatbotPage';
import AboutPage from './pages/AboutPage';
import AdminPanel from './pages/AdminPanel';

// Route Guards
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-slate-400 font-extrabold animate-pulse">Checking credentials status...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex relative">
        {/* Render Sidebar conditionally when user authenticated */}
        {user && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden flex flex-col justify-between">
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            
            {/* Authenticated Routes */}
            <Route path="/" element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            } />
            <Route path="/analyze" element={
              <RequireAuth>
                <PredictPage />
              </RequireAuth>
            } />
            <Route path="/compare" element={
              <RequireAuth>
                <MultiComparePage />
              </RequireAuth>
            } />
            <Route path="/doctors" element={
              <RequireAuth>
                <DoctorLocator />
              </RequireAuth>
            } />
            <Route path="/tracker" element={
              <RequireAuth>
                <ProgressTracker />
              </RequireAuth>
            } />
            <Route path="/chatbot" element={
              <RequireAuth>
                <ChatbotPage />
              </RequireAuth>
            } />
            <Route path="/about" element={
              <RequireAuth>
                <AboutPage />
              </RequireAuth>
            } />
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminPanel />
              </RequireAdmin>
            } />

            {/* Auth Layouts */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />

            {/* Redirects */}
            <Route path="*" element={<Navigate to={user ? "/" : "/landing"} replace />} />
          </Routes>
          
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
