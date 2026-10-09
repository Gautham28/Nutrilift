export type Gender = 'MALE' | 'FEMALE';

export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface User {
  id: string;
  email: string;
  fullName: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  targetCalories: number;
  targetProteinG: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FoodItem {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isAiParsed?: boolean;
}

export interface FoodEntry extends FoodItem {
  id: string;
  userId: string;
  entryDate: string;
  mealType: MealType;
}

export interface TodayEntriesResponse {
  date: string;
  groupedByMeal: Record<MealType, FoodEntry[]>;
  entries: FoodEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProteinG: number;
}

export interface DailyStats {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProteinG: number;
}

export interface AiTargetRequest {
  weightKg: number;
  heightCm: number;
  age: number;
  gender?: Gender | string;
  activityLevel?: ActivityLevel | string;
  fitnessGoal: string;
}

export interface AiTargetResponse {
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  bmr: number;
  tdee: number;
  strategy: string;
  explanation: string;
  actionableTips: string[];
}

