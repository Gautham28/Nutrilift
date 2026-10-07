import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SimpleDashboard } from './components/SimpleDashboard';
import { TargetSettingsModal } from './components/TargetSettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [targetModalOpen, setTargetModalOpen] = useState(false);
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
    <div className="min-h-screen bg-[#EDE7DA] p-3 sm:p-6 lg:p-10 flex items-center justify-center font-sans">
      {/* App Window matching the warm cream framed aesthetic */}
      <div className="w-full max-w-5xl bg-[#FAF6EE] rounded-[32px] border-2 border-[#1E1E24]/10 shadow-2xl p-5 sm:p-8 lg:p-10 min-h-[85vh]">
        <SimpleDashboard
          key={`${user?.id || 'guest'}-${refreshKey}`}
          user={user}
          onOpenTargetModal={() => setTargetModalOpen(true)}
          onLogout={() => {
            if (user) {
              logout();
              setIsGuest(false);
            } else {
              setAuthModalOpen(true);
            }
          }}
        />
      </div>

      {/* Target Settings Modal */}
      <TargetSettingsModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSaved={handleTargetSaved}
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
