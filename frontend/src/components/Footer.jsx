import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t glass-panel rounded-none bg-slate-50/50 dark:bg-slate-900/30 text-center text-xs text-slate-400">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
        <p>&copy; {new Date().getFullYear()} DermAI Pro. All Rights Reserved. Built for SIH Hackathon & Clinical Research.</p>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}
