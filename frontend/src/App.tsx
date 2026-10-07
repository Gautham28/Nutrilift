import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { HistoryStats } from './components/HistoryStats';
import { AuthScreen } from './components/AuthScreen';
import { TargetSettingsModal } from './components/TargetSettingsModal';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTargetSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Loading NutriLift...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTargetModal={() => setTargetModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' ? (
          <Dashboard refreshKey={refreshKey} />
        ) : (
          <HistoryStats refreshKey={refreshKey} />
        )}
      </main>

      <TargetSettingsModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSaved={handleTargetSaved}
      />
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
