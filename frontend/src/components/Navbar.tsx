import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, Activity, LogOut, Sliders, Calendar } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'history';
  setActiveTab: (tab: 'dashboard' | 'history') => void;
  onOpenTargetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenTargetModal }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-dark-900/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-dark-900 font-extrabold text-xl">
            <Flame className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Nutri<span className="text-emerald-400">Lift</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Beta
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden sm:block">Indian Diet Calorie & Macro Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="flex items-center space-x-1 bg-dark-800/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Today</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>7-Day Stats</span>
            </button>
          </nav>
        )}

        {/* User Profile & Actions */}
        {user && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenTargetModal}
              title="Customize Calorie & Protein Targets"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user.targetCalories} kcal</span>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-700 flex items-center justify-center text-xs font-bold text-white shadow">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-slate-200 truncate max-w-[110px]">{user.fullName}</p>
                <p className="text-[11px] text-emerald-400">{user.targetProteinG}g protein</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
