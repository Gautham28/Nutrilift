import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RegisterWizard } from './OnboardingModal';
import { Flame, LogIn, Sparkles, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onContinueAsGuest }) => {
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
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setLoginError(
        err.response?.data?.message || 'Invalid email or password. Please verify your credentials or register.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await register(data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to complete registration.';
      setLoginError(msg);
      throw err; // rethrow so RegisterWizard shows the error
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
      if (onSuccess) {
        onSuccess();
      }
    } catch {
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
        if (onSuccess) {
          onSuccess();
        }
      } catch (regErr: any) {
        setLoginError(regErr.response?.data?.message || 'Could not auto-provision demo user.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center py-6 px-4">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFAEBF] shadow-sm mb-2 text-[#1E1E24]">
          <Flame className="w-6 h-6 fill-[#1E1E24]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#1E1E24]">
          Nutri<span className="text-[#9E4D61]">Lift</span>
        </h1>
        <p className="text-xs text-[#7A7363] mt-0.5">
          AI Calorie & Macro Intelligence Tailored for Indian Diets
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white rounded-[28px] p-6 sm:p-7 border border-[#E8E2D2] shadow-xl">
        {/* Toggle Switch */}
        <div className="flex bg-[#FAF7F0] p-1 rounded-2xl mb-6 border border-[#E8E2D2]">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setLoginError(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegisterMode
                ? 'bg-[#1E1E24] text-white shadow-sm'
                : 'text-[#7A7363] hover:text-[#1E1E24]'
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
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegisterMode
                ? 'bg-[#1E1E24] text-white shadow-sm'
                : 'text-[#7A7363] hover:text-[#1E1E24]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register (TDEE)</span>
          </button>
        </div>

        {/* Login Mode */}
        {!isRegisterMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] placeholder-[#A09886] font-semibold outline-none focus:border-[#FFAEBF]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#1E1E24]">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] placeholder-[#A09886] font-semibold outline-none focus:border-[#FFAEBF]"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-[#1E1E24] hover:bg-[#2F2F38] text-white shadow-md disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
            >
              <span>{loginLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo button */}
            <div className="pt-2 space-y-2 text-center">
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={loginLoading}
                className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE0] text-[#1E1E24] border border-[#E2DBD0] transition-colors flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C24161]" />
                <span>Try Instant Demo Account</span>
              </button>

              {onContinueAsGuest && (
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="w-full py-1.5 text-[11px] font-semibold text-[#7A7363] hover:text-[#1E1E24] transition-colors"
                >
                  Continue as Guest without login &rarr;
                </button>
              )}
            </div>
          </form>
        ) : (
          <RegisterWizard
            onComplete={handleRegister}
            onCancel={() => setIsRegisterMode(false)}
            loading={loginLoading}
          />
        )}
      </div>
    </div>
  );
};
