import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, History, Home } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-gradient">LLD Practice</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
            }`}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/history"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/history') ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
