import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RegisterWizard } from './OnboardingModal';
import { Flame, LogIn, Sparkles, UserPlus, ShieldCheck, HeartHandshake } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setLoginError(
        err.response?.data?.message || 'Invalid email or password. Please verify your credentials or register.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('demo@nutrilift.com');
    setPassword('password123');
    setLoginLoading(true);
    setLoginError(null);

    try {
      await login('demo@nutrilift.com', 'password123');
    } catch (err) {
      // If demo user doesn't exist yet in DB, create it automatically!
      try {
        await register({
          fullName: 'Aarav Patel',
          email: 'demo@nutrilift.com',
          password: 'password123',
          age: 26,
          gender: 'MALE',
          heightCm: 178,
          weightKg: 72,
          activityLevel: 'MODERATE',
        });
      } catch (regErr: any) {
        setLoginError(regErr.response?.data?.message || 'Could not auto-provision demo user.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-emerald-500/30">
      {/* Background radial gradient lights */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-xl shadow-emerald-500/20 mb-3 text-dark-900">
          <Flame className="w-8 h-8 text-slate-950 fill-slate-950" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Nutri<span className="text-emerald-400">Lift</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
          AI Calorie & Macro Intelligence Tailored for Indian Diets
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative z-10">
        {/* Toggle Switch */}
        <div className="flex bg-dark-800 p-1 rounded-xl mb-6 border border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setLoginError(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegisterMode
                ? 'bg-emerald-500 text-dark-900 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setLoginError(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegisterMode
                ? 'bg-emerald-500 text-dark-900 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register (TDEE)</span>
          </button>
        </div>

        {/* Login Mode */}
        {!isRegisterMode ? (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-dark-900 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Quick Demo button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={loginLoading}
                className="w-full py-2 px-3 text-xs font-medium rounded-xl bg-dark-800 hover:bg-dark-700 text-emerald-400 border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Instant Demo Account</span>
              </button>
            </div>
          </form>
        ) : (
          <RegisterWizard
            onComplete={register}
            onCancel={() => setIsRegisterMode(false)}
            loading={loginLoading}
          />
        )}
      </div>

      {/* Footer Features summary */}
      <div className="mt-8 flex items-center space-x-6 text-slate-500 text-xs z-10">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Mifflin-St Jeor TDEE</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Gemini AI Engine</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <HeartHandshake className="w-4 h-4 text-cyan-400" />
          <span>Indian Foods</span>
        </div>
      </div>
    </div>
  );
};
