import React from 'react';
import {
  LayoutGrid,
  Calendar,
  Sliders,
  Clock,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
  User as UserIcon,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'calendar';
  onSelectTab: (tab: 'dashboard' | 'calendar') => void;
  onOpenTargetModal: () => void;
  onLogout: () => void;
  userName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenTargetModal,
  onLogout,
  userName = 'Gautham',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`bg-[#141418] text-[#A0A0AB] flex flex-col justify-between p-4 sm:p-5 rounded-[32px] select-none shadow-2xl transition-all duration-300 relative border border-[#272730] shrink-0 ${
        isCollapsed ? 'w-20' : 'w-56 sm:w-60'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#24242D] mb-5">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[#FFAEBF] flex items-center justify-center text-[#141418] shrink-0 shadow-sm">
              <Flame className="w-4 h-4 fill-[#141418]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-lg font-black tracking-tight text-white font-sans block leading-none">
                  nutri<span className="text-[#FFAEBF]">lift</span>
                </span>
                <span className="text-[9px] font-semibold text-[#71717A] tracking-wider uppercase">
                  Diet & Macro AI
                </span>
              </div>
            )}
          </div>

          {/* Pink circular collapse toggle matching Image 2 */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="w-5 h-5 rounded-full bg-[#FFAEBF] hover:bg-[#FFC4D2] text-[#141418] flex items-center justify-center text-xs transition-transform active:scale-95 shadow-sm shrink-0"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ChevronLeft className="w-3 h-3 stroke-[2.5]" />
              )}
            </button>
          )}
        </div>

        {/* Section: General */}
        <div className="mb-6 space-y-1.5">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider px-3 mb-2">
              General
            </p>
          )}

          {/* 1. Dashboard Tab */}
          <button
            onClick={() => onSelectTab('dashboard')}
            title="Dashboard"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
            } py-2.5 rounded-2xl text-xs font-bold transition-all relative ${
              activeTab === 'dashboard'
                ? 'bg-[#22222A] text-white shadow-sm'
                : 'text-[#8E8E9A] hover:text-white hover:bg-[#1C1C22]'
            }`}
          >
            {/* Left Accent Bar matching Image 2 */}
            {activeTab === 'dashboard' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FFAEBF] rounded-r-full" />
            )}
            <LayoutGrid
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'dashboard' ? 'text-[#FFAEBF]' : 'text-[#8E8E9A]'
              }`}
            />
            {!isCollapsed && <span className="truncate">Dashboard</span>}
          </button>

          {/* 2. Calendar Tab (Opens the Activity Calendar Page) */}
          <button
            onClick={() => onSelectTab('calendar')}
            title="Activity Calendar"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
            } py-2.5 rounded-2xl text-xs font-bold transition-all relative ${
              activeTab === 'calendar'
                ? 'bg-[#22222A] text-white shadow-sm'
                : 'text-[#8E8E9A] hover:text-white hover:bg-[#1C1C22]'
            }`}
          >
            {activeTab === 'calendar' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FFAEBF] rounded-r-full" />
            )}
            <Calendar
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'calendar' ? 'text-[#FFAEBF]' : 'text-[#8E8E9A]'
              }`}
            />
            {!isCollapsed && <span className="truncate">Calendar</span>}
          </button>

          {/* 3. Targets Settings Modal */}
          <button
            onClick={onOpenTargetModal}
            title="Adjust Targets"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
            } py-2.5 rounded-2xl text-xs font-bold transition-all text-[#8E8E9A] hover:text-white hover:bg-[#1C1C22]`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Targets</span>}
          </button>
        </div>

        {/* Section: Tools */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider px-3 mb-2">
              Tools
            </p>
          )}

          <button
            onClick={() => onSelectTab('calendar')}
            title="History"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
            } py-2.5 rounded-2xl text-xs font-bold transition-all text-[#8E8E9A] hover:text-white hover:bg-[#1C1C22]`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">History</span>}
          </button>

          <button
            onClick={onOpenTargetModal}
            title="Settings"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
            } py-2.5 rounded-2xl text-xs font-bold transition-all text-[#8E8E9A] hover:text-white hover:bg-[#1C1C22]`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </button>
        </div>
      </div>

      {/* Bottom Footer: User Info & Logout */}
      <div className="pt-4 border-t border-[#24242D] space-y-2">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-[#272732] border border-[#343440] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-[#71717A] leading-none">Standard User</p>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          title="Log out"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3.5'
          } py-2 rounded-2xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
};
