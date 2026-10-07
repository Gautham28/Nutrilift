import axios from 'axios';
import { AuthResponse, FoodItem, FoodEntry, TodayEntriesResponse, DailyStats, User, MealType } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nutrilift_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle session expiration or stale token (401/403)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('nutrilift_token');
      localStorage.removeItem('nutrilift_user');
      window.dispatchEvent(new Event('nutrilift_session_expired'));
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    age: number;
    gender: string;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
};

// Profile API
export const profileApi = {
  getProfile: async (): Promise<User> => {
    const res = await apiClient.get<User>('/profile');
    return res.data;
  },
  updateTargets: async (targets: { targetCalories: number; targetProteinG: number }): Promise<User> => {
    const res = await apiClient.put<User>('/profile/targets', targets);
    return res.data;
  },
};

// Food Entries API
export const entriesApi = {
  parseWithAi: async (rawText: string, mealType: MealType): Promise<FoodItem[]> => {
    const res = await apiClient.post<FoodItem[]>('/entries/ai-parse', { rawText, mealType });
    return res.data;
  },
  createEntries: async (entryDate: string, mealType: MealType, items: FoodItem[]): Promise<FoodEntry[]> => {
    const res = await apiClient.post<FoodEntry[]>('/entries', {
      entryDate,
      mealType,
      items,
    });
    return res.data;
  },
  getToday: async (): Promise<TodayEntriesResponse> => {
    const res = await apiClient.get<TodayEntriesResponse>('/entries/today');
    return res.data;
  },
  getHistory: async (date: string): Promise<FoodEntry[]> => {
    const res = await apiClient.get<FoodEntry[]>(`/entries/history?date=${date}`);
    return res.data;
  },
  getStats: async (days: number = 7): Promise<DailyStats[]> => {
    const res = await apiClient.get<DailyStats[]>(`/entries/stats?days=${days}`);
    return res.data;
  },
  deleteEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/entries/${id}`);
  },
};
