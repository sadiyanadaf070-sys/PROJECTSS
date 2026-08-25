import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Home, ScanFace, Columns, MapPin, BarChart3, MessageSquare, GraduationCap, ShieldAlert, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const links = [
    { to: "/", icon: Home, label: t('home') },
    { to: "/analyze", icon: ScanFace, label: t('analyze') },
    { to: "/compare", icon: Columns, label: t('compare') },
    { to: "/doctors", icon: MapPin, label: t('doctors') },
    { to: "/tracker", icon: BarChart3, label: t('tracker') },
    { to: "/chatbot", icon: MessageSquare, label: t('chatbot') },
    { to: "/about", icon: GraduationCap, label: t('about') },
  ];

  // Admin blueprint routing conditional
  if (user && user.role === 'admin') {
    links.push({ to: "/admin", icon: ShieldAlert, label: t('admin') });
  }

  const activeStyle = "bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 font-bold border-r-4 border-primary-500";
  const inactiveStyle = "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary-500 transition-all";

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 w-64 glass-panel border-r rounded-none z-50 transform lg:transform-none transition-transform duration-300 lg:relative lg:z-10 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b lg:hidden">
          <span className="font-extrabold text-lg text-primary-600">Navigation</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Sidebar Nav links */}
        <nav className="p-4 space-y-2 mt-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium ${isActive ? activeStyle : inactiveStyle}`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
