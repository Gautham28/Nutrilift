import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, profileApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUserTargets: (targetCalories: number, targetProteinG: number) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nutrilift_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('nutrilift_token');
      const storedUser = localStorage.getItem('nutrilift_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user data from API in background
          const freshProfile = await profileApi.getProfile();
          setUser(freshProfile);
          localStorage.setItem('nutrilift_user', JSON.stringify(freshProfile));
        } catch (err: any) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            console.warn('Session expired or invalidated, resetting login state');
            localStorage.removeItem('nutrilift_token');
            localStorage.removeItem('nutrilift_user');
            setUser(null);
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('nutrilift_session_expired', handleExpired);
    return () => window.removeEventListener('nutrilift_session_expired', handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('nutrilift_token', res.token);
    localStorage.setItem('nutrilift_user', JSON.stringify(res.user));
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('nutrilift_token', res.token);
    localStorage.setItem('nutrilift_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nutrilift_token');
    localStorage.removeItem('nutrilift_user');
  };

  const updateUserTargets = async (targetCalories: number, targetProteinG: number) => {
    const updated = await profileApi.updateTargets({ targetCalories, targetProteinG });
    setUser(updated);
    localStorage.setItem('nutrilift_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserTargets, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
