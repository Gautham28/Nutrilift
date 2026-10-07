import React from 'react';
import {
  LayoutGrid,
  Calculator,
  UtensilsCrossed,
  TrendingUp,
  Sliders,
  PlusCircle,
  LogOut,
  Flame,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenTargetModal: () => void;
  onOpenManualModal: () => void;
  onLogout: () => void;
  userName?: string;
  isGuest?: boolean;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  setActiveNav,
  onOpenTargetModal,
  onOpenManualModal,
  onLogout,
  userName = 'Lifter',
  isGuest = false,
  onOpenAuth,
}) => {
  const generalNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'calculator', label: 'AI Calculator', icon: Calculator },
    { id: 'meals', label: 'Today\'s Meals', icon: UtensilsCrossed },
    { id: 'stats', label: '7-Day Trends', icon: TrendingUp },
  ];

  const toolsNavItems = [
    { id: 'targets', label: 'TDEE Targets', icon: Sliders, onClick: onOpenTargetModal },
    { id: 'manual', label: 'Manual Entry', icon: PlusCircle, onClick: onOpenManualModal },
  ];

  return (
    <aside className="w-full lg:w-56 bg-[#17171C] text-slate-300 flex flex-col justify-between p-5 rounded-[28px] shrink-0 select-none shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1 mb-7">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFAEBF] flex items-center justify-center text-[#17171C]">
              <Flame className="w-4 h-4 fill-[#17171C]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Nutri<span className="text-[#FFAEBF]">Lift</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Indian Diet AI</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#ABC480]" title="Online" />
        </div>

        {/* User Card */}
        <div className="bg-[#22222A] p-2.5 rounded-2xl mb-6 border border-[#2E2E38] flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#FFAEBF] text-[#17171C] font-bold text-xs flex items-center justify-center shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400">{isGuest ? 'Guest Mode' : 'Account'}</p>
            </div>
          </div>
          {isGuest && (
            <button
              onClick={onOpenAuth}
              className="text-[10px] font-bold text-[#FFAEBF] hover:underline"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Section: General */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {generalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#262631] text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E1E26]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFAEBF]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: Tools */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Tools
          </p>
          <nav className="space-y-1">
            {toolsNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#1E1E26] transition-all"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Logout / Switch Account */}
      <div className="pt-4 border-t border-slate-800/80 px-1 mt-4">
        {isGuest ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-2 text-xs font-semibold text-[#FFAEBF] hover:text-white transition-colors w-full px-2 py-1.5 rounded-xl hover:bg-[#202028]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Login / Register</span>
          </button>
        ) : (
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors w-full px-2 py-1.5 rounded-xl hover:bg-[#202028]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </aside>
  );
};
