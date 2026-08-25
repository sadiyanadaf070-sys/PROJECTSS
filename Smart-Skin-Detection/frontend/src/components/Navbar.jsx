import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Sun, Moon, Monitor, Globe, LogOut, User, Activity, Menu } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ur', name: 'اردو' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b rounded-none px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-primary-500 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-primary-500 to-secondary-500 p-2 rounded-xl text-white shadow-lg shadow-primary-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 dark:from-primary-400 dark:to-accent-400">
            DermAI Pro
          </span>
        </Link>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-4">
        {/* Language Picker */}
        <div className="relative">
          <button 
            onClick={() => setLangOpen(!langOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1"
            title="Switch Language"
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase">{language}</span>
          </button>
          
          {langOpen && (
            <div className="absolute right-0 mt-2 w-40 glass-card rounded-xl shadow-xl overflow-hidden py-1 border z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors ${language === lang.code ? 'font-bold text-primary-500' : ''}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggler */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl space-x-1">
          <button 
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-yellow-500 shadow-sm' : 'text-slate-400'}`}
            title="Light Mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-accent-400 shadow-sm' : 'text-slate-400'}`}
            title="Dark Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-primary-500 shadow-sm' : 'text-slate-400'}`}
            title="System Preference"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* Profile / Logged In Options */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-xl border overflow-hidden py-1 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  {user.role === 'admin' && (
                    <span className="inline-block mt-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 rounded font-bold uppercase">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 rounded-xl transition duration-300 shadow-lg shadow-primary-500/25"
          >
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
