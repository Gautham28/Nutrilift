import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SimpleDashboard } from './components/SimpleDashboard';
import { TargetSettingsModal } from './components/TargetSettingsModal';
import { AiTargetAdvisorModal } from './components/AiTargetAdvisorModal';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ActivityCalendarPage } from './components/ActivityCalendarPage';
import { Loader2, Menu, X, Calendar, LayoutGrid } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [aiAdvisorOpen, setAiAdvisorOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTargetSaved = () => {
    setRefreshKey((prev) => prev + 1);
    setTargetModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDE7DA] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#1E1E24] animate-spin" />
        <p className="text-xs font-semibold text-[#666052] tracking-wider uppercase">
          Loading NutriLift...
        </p>
      </div>
    );
  }

  // If user is not logged in and has not chosen to continue as guest, show the clean AuthScreen
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-[#EDE7DA] flex items-center justify-center p-4">
        <AuthScreen
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
          }}
          onContinueAsGuest={() => setIsGuest(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDE7DA] p-2 sm:p-4 lg:p-6 flex flex-col justify-center font-sans">
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2.5 mb-2 bg-[#141418] text-white rounded-2xl border border-[#272730] shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl bg-[#22222A] text-white hover:bg-[#2C2C36] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-extrabold text-sm tracking-tight">
            nutri<span className="text-[#FFAEBF]">lift</span>
          </span>
        </div>

        {/* Quick tab switcher on mobile */}
        <div className="flex items-center space-x-1 bg-[#22222A] p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
              activeTab === 'dashboard' ? 'bg-[#FFAEBF] text-[#141418]' : 'text-[#A0A0AB]'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('calendar');
              setMobileMenuOpen(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
              activeTab === 'calendar' ? 'bg-[#FFAEBF] text-[#141418]' : 'text-[#A0A0AB]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Main Container: Left Sidebar + Warm Cream Main App Window */}
      <div className="w-full max-w-7xl mx-auto flex gap-4 lg:gap-6 min-h-[90vh] items-stretch">
        {/* 1. Left Sidebar (Image 2 design) */}
        <div
          className={`shrink-0 transition-all duration-300 ${
            mobileMenuOpen
              ? 'fixed inset-y-0 left-0 z-50 p-4 bg-[#EDE7DA] flex'
              : 'hidden lg:flex'
          }`}
        >
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setMobileMenuOpen(false);
            }}
            onOpenTargetModal={() => setTargetModalOpen(true)}
            onOpenAiAdvisor={() => setAiAdvisorOpen(true)}
            onLogout={() => {
              if (user) {
                logout();
                setIsGuest(false);
              } else {
                setAuthModalOpen(true);
              }
            }}
            userName={user?.fullName || (isGuest ? 'Guest Lifter' : 'Lifter')}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* 2. Main Content Area */}
        <main className="flex-1 min-w-0 bg-[#FAF6EE] rounded-[32px] border-2 border-[#1E1E24]/10 shadow-2xl p-4 sm:p-7 lg:p-9 flex flex-col justify-between overflow-y-auto">
          {activeTab === 'dashboard' ? (
            <SimpleDashboard
              key={`${user?.id || 'guest'}-${refreshKey}`}
              user={user}
              onOpenTargetModal={() => setTargetModalOpen(true)}
              onOpenAiAdvisor={() => setAiAdvisorOpen(true)}
              onNavigateToCalendar={() => setActiveTab('calendar')}
              onLogout={() => {
                if (user) {
                  logout();
                  setIsGuest(false);
                } else {
                  setAuthModalOpen(true);
                }
              }}
            />
          ) : (
            <ActivityCalendarPage
              user={user}
              onBackToDashboard={() => setActiveTab('dashboard')}
              onOpenTargetModal={() => setTargetModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Target Settings Modal */}
      <TargetSettingsModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSaved={handleTargetSaved}
        onOpenAiAdvisor={() => setAiAdvisorOpen(true)}
      />

      {/* AI Target Advisor Modal */}
      <AiTargetAdvisorModal
        isOpen={aiAdvisorOpen}
        onClose={() => setAiAdvisorOpen(false)}
        onTargetsApplied={(_cals, _prot) => {
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* Auth Modal when in guest mode */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-white z-20 text-sm font-bold bg-black/40 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
            >
              ✕
            </button>
            <AuthScreen
              onSuccess={() => {
                setAuthModalOpen(false);
                setIsGuest(false);
                setRefreshKey((prev) => prev + 1);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
