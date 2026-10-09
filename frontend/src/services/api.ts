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
    try {
      const res = await apiClient.post<FoodEntry[]>('/entries', {
        entryDate,
        mealType,
        items,
      });
      return res.data;
    } catch (err) {
      // Guest mode fallback
      const guestEntriesRaw = localStorage.getItem('nutrilift_guest_entries');
      const allEntries: FoodEntry[] = guestEntriesRaw ? JSON.parse(guestEntriesRaw) : [];
      const newEntries: FoodEntry[] = items.map((item, idx) => ({
        ...item,
        id: `guest-${Date.now()}-${idx}`,
        userId: 'guest',
        entryDate,
        mealType,
      }));
      const updated = [...allEntries, ...newEntries];
      localStorage.setItem('nutrilift_guest_entries', JSON.stringify(updated));
      return newEntries;
    }
  },
  getToday: async (): Promise<TodayEntriesResponse> => {
    try {
      const res = await apiClient.get<TodayEntriesResponse>('/entries/today');
      return res.data;
    } catch (err) {
      // Guest mode fallback from localStorage
      const guestEntriesRaw = localStorage.getItem('nutrilift_guest_entries');
      const allEntries: FoodEntry[] = guestEntriesRaw ? JSON.parse(guestEntriesRaw) : [];
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEntries = allEntries.filter((e) => e.entryDate === todayStr);

      const totalCal = todayEntries.reduce((s, e) => s + (e.calories || 0), 0);
      const totalP = todayEntries.reduce((s, e) => s + (Number(e.proteinG) || 0), 0);
      const totalC = todayEntries.reduce((s, e) => s + (Number(e.carbsG) || 0), 0);
      const totalF = todayEntries.reduce((s, e) => s + (Number(e.fatG) || 0), 0);

      const grouped: Record<MealType, FoodEntry[]> = {
        BREAKFAST: todayEntries.filter((e) => e.mealType === 'BREAKFAST'),
        LUNCH: todayEntries.filter((e) => e.mealType === 'LUNCH'),
        DINNER: todayEntries.filter((e) => e.mealType === 'DINNER'),
        SNACK: todayEntries.filter((e) => e.mealType === 'SNACK'),
      };

      return {
        date: todayStr,
        groupedByMeal: grouped,
        entries: todayEntries,
        totalCalories: totalCal,
        totalProtein: totalP,
        totalCarbs: totalC,
        totalFat: totalF,
        targetCalories: 2000,
        targetProteinG: 130,
      };
    }
  },
  getHistory: async (date: string): Promise<FoodEntry[]> => {
    try {
      const res = await apiClient.get<FoodEntry[]>(`/entries/history?date=${date}`);
      return res.data;
    } catch {
      const guestEntriesRaw = localStorage.getItem('nutrilift_guest_entries');
      const allEntries: FoodEntry[] = guestEntriesRaw ? JSON.parse(guestEntriesRaw) : [];
      return allEntries.filter((e) => e.entryDate === date);
    }
  },
  getStats: async (days: number = 30, startDate?: string, endDate?: string): Promise<DailyStats[]> => {
    let url = `/entries/stats?days=${days}`;
    if (startDate && endDate) {
      url = `/entries/stats?startDate=${startDate}&endDate=${endDate}`;
    }
    try {
      const res = await apiClient.get<DailyStats[]>(url);
      return res.data;
    } catch {
      // Guest mode calculation from local storage
      const guestEntriesRaw = localStorage.getItem('nutrilift_guest_entries');
      const allEntries: FoodEntry[] = guestEntriesRaw ? JSON.parse(guestEntriesRaw) : [];
      
      const byDate: Record<string, FoodEntry[]> = {};
      allEntries.forEach((e) => {
        if (!byDate[e.entryDate]) byDate[e.entryDate] = [];
        byDate[e.entryDate].push(e);
      });

      const stats: DailyStats[] = [];
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const cur = new Date(start);
        while (cur <= end) {
          const dStr = cur.toISOString().split('T')[0];
          const dayItems = byDate[dStr] || [];
          const cals = dayItems.reduce((s, e) => s + (e.calories || 0), 0);
          const p = dayItems.reduce((s, e) => s + (Number(e.proteinG) || 0), 0);
          const c = dayItems.reduce((s, e) => s + (Number(e.carbsG) || 0), 0);
          const f = dayItems.reduce((s, e) => s + (Number(e.fatG) || 0), 0);
          stats.push({
            date: dStr,
            totalCalories: cals,
            totalProtein: p,
            totalCarbs: c,
            totalFat: f,
            targetCalories: 2000,
            targetProteinG: 130,
          });
          cur.setDate(cur.getDate() + 1);
        }
      }
      return stats;
    }
  },
  deleteEntry: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/entries/${id}`);
    } catch {
      const guestEntriesRaw = localStorage.getItem('nutrilift_guest_entries');
      if (guestEntriesRaw) {
        const allEntries: FoodEntry[] = JSON.parse(guestEntriesRaw);
        const updated = allEntries.filter((e) => e.id !== id);
        localStorage.setItem('nutrilift_guest_entries', JSON.stringify(updated));
      }
    }
  },
};
