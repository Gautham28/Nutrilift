import React, { useState, useEffect } from 'react';
import { FoodItem, FoodEntry, MealType, TodayEntriesResponse } from '../types';
import { entriesApi } from '../services/api';
import { calculateFoodItem, CalculatedFood } from '../utils/nutritionEngine';
import {
  Flame,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Sliders,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface SimpleDashboardProps {
  user: any;
  onOpenTargetModal: () => void;
  onLogout: () => void;
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({
  user,
  onOpenTargetModal,
  onLogout,
}) => {
  // Input for food calculation
  const [foodInput, setFoodInput] = useState('');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [calculatedItems, setCalculatedItems] = useState<CalculatedFood[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Today's entries
  const [todayData, setTodayData] = useState<TodayEntriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch today's logged meals from backend
  const fetchToday = async () => {
    setIsLoading(true);
    try {
      const data = await entriesApi.getToday();
      setTodayData(data);
    } catch {
      // Backend unauthenticated or offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  // Compute live targets & consumed
  const targetCalories = user?.targetCalories || 2000;
  const targetProtein = user?.targetProteinG || 130;
  const targetCarbs = Math.round((targetCalories * 0.5) / 4);
  const targetFat = Math.round((targetCalories * 0.25) / 9);

  // Entries
  const entries: FoodEntry[] = todayData?.entries || [];
  const consumedCalories = todayData?.totalCalories || 0;
  const consumedProtein = Math.round(Number(todayData?.totalProtein) || 0);
  const consumedCarbs = Math.round(Number(todayData?.totalCarbs) || 0);
  const consumedFat = Math.round(Number(todayData?.totalFat) || 0);
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);

  // Live calculation as user types or clicks preset
  const handleInputChange = (text: string) => {
    setFoodInput(text);
    setErrorMsg(null);
    if (!text.trim()) {
      setCalculatedItems([]);
      return;
    }
    const results = calculateFoodItem(text);
    setCalculatedItems(results);
  };

  // Explicit calculation button (tries backend AI first, falls back to engine)
  const handleCalculateAi = async () => {
    if (!foodInput.trim()) {
      setErrorMsg('Please type a food item first.');
      return;
    }
    setErrorMsg(null);
    setIsCalculating(true);

    try {
      const aiResults = await entriesApi.parseWithAi(foodInput, mealType);
      if (aiResults && aiResults.length > 0) {
        const formatted: CalculatedFood[] = aiResults.map((item) => ({
          foodName: item.foodName,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
        }));
        setCalculatedItems(formatted);
      } else {
        setCalculatedItems(calculateFoodItem(foodInput));
      }
    } catch {
      setCalculatedItems(calculateFoodItem(foodInput));
    } finally {
      setIsCalculating(false);
    }
  };

  // Save calculated food to today's log
  const handleSaveMeal = async () => {
    const itemsToSave = calculatedItems.length > 0 ? calculatedItems : calculateFoodItem(foodInput);

    if (itemsToSave.length === 0) {
      setErrorMsg('Please enter a valid food item.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const payload: FoodItem[] = itemsToSave.map((item) => ({
      foodName: item.foodName,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'serving',
      calories: Number(item.calories) || 0,
      proteinG: Number(item.proteinG) || 0,
      carbsG: Number(item.carbsG) || 0,
      fatG: Number(item.fatG) || 0,
    }));

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await entriesApi.createEntries(todayStr, mealType, payload);
      await fetchToday();
      setFoodInput('');
      setCalculatedItems([]);
      setSuccessMsg(`Logged ${payload.length} item(s) to ${mealType.toLowerCase()}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // Local fallback if backend unauthenticated
      const mockEntries: FoodEntry[] = payload.map((p, idx) => ({
        ...p,
        id: `mock-${Date.now()}-${idx}`,
        userId: user?.id || 'demo-user',
        entryDate: new Date().toISOString().split('T')[0],
        mealType: mealType,
      }));

      setTodayData((prev) => {
        const newEntries = [...(prev?.entries || []), ...mockEntries];
        return {
          date: new Date().toISOString().split('T')[0],
          groupedByMeal: {
            BREAKFAST: newEntries.filter((e) => e.mealType === 'BREAKFAST'),
            LUNCH: newEntries.filter((e) => e.mealType === 'LUNCH'),
            DINNER: newEntries.filter((e) => e.mealType === 'DINNER'),
            SNACK: newEntries.filter((e) => e.mealType === 'SNACK'),
          },
          entries: newEntries,
          totalCalories: consumedCalories + payload.reduce((s, i) => s + i.calories, 0),
          totalProtein: consumedProtein + payload.reduce((s, i) => s + i.proteinG, 0),
          totalCarbs: consumedCarbs + payload.reduce((s, i) => s + i.carbsG, 0),
          totalFat: consumedFat + payload.reduce((s, i) => s + i.fatG, 0),
          targetCalories: targetCalories,
          targetProteinG: targetProtein,
        };
      });

      setFoodInput('');
      setCalculatedItems([]);
      setSuccessMsg(`Logged ${payload.length} item(s) to ${mealType.toLowerCase()}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete an entry
  const handleDeleteEntry = async (id: string) => {
    try {
      await entriesApi.deleteEntry(id);
      await fetchToday();
    } catch {
      if (todayData) {
        const remaining = todayData.entries.filter((e) => e.id !== id);
        const delItem = todayData.entries.find((e) => e.id === id);
        setTodayData({
          ...todayData,
          entries: remaining,
          totalCalories: Math.max(0, consumedCalories - (delItem?.calories || 0)),
          totalProtein: Math.max(0, consumedProtein - (Number(delItem?.proteinG) || 0)),
          totalCarbs: Math.max(0, consumedCarbs - (Number(delItem?.carbsG) || 0)),
          totalFat: Math.max(0, consumedFat - (Number(delItem?.fatG) || 0)),
        });
      }
    }
  };

  // Totals for current calculated preview
  const calcCalories = calculatedItems.reduce((acc, cur) => acc + (Number(cur.calories) || 0), 0);
  const calcProtein = calculatedItems.reduce((acc, cur) => acc + (Number(cur.proteinG) || 0), 0);
  const calcCarbs = calculatedItems.reduce((acc, cur) => acc + (Number(cur.carbsG) || 0), 0);
  const calcFat = calculatedItems.reduce((acc, cur) => acc + (Number(cur.fatG) || 0), 0);

  // Quick staple presets
  const presets = [
    { label: '2 Rotis & Dal', text: '2 rotis with 1 bowl dal tadka', type: 'LUNCH' as MealType },
    { label: '100g Paneer', text: '100g paneer bhurji', type: 'LUNCH' as MealType },
    { label: '2 Eggs & Toast', text: '2 boiled eggs with 2 slices toast', type: 'BREAKFAST' as MealType },
    { label: 'Chicken Biryani', text: '1 plate chicken biryani', type: 'DINNER' as MealType },
    { label: 'Idli & Sambar', text: '3 idlis with 1 bowl sambar', type: 'BREAKFAST' as MealType },
    { label: 'Chai & Biscuits', text: '1 cup chai with 2 biscuits', type: 'SNACK' as MealType },
  ];

  const mealsList: { type: MealType; title: string; icon: any; color: string }[] = [
    { type: 'BREAKFAST', title: 'Breakfast', icon: Sunrise, color: 'bg-[#FFD4DF] text-[#7A1F38]' },
    { type: 'LUNCH', title: 'Lunch', icon: Sun, color: 'bg-[#D1E3FC] text-[#1E3B68]' },
    { type: 'SNACK', title: 'Snacks', icon: Apple, color: 'bg-[#FEECA8] text-[#5C450C]' },
    { type: 'DINNER', title: 'Dinner', icon: Moon, color: 'bg-[#D7E8BC] text-[#345115]' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* 1. TOP HEADER: Clean & Minimalist */}
      <header className="flex items-center justify-between pb-4 border-b border-[#E8E2D2]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-[#FFAEBF] flex items-center justify-center text-[#1E1E24] shadow-sm">
            <Flame className="w-5 h-5 fill-[#1E1E24]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1E24] tracking-tight">
              Nutri<span className="text-[#9E4D61]">Lift</span>
            </h1>
            <p className="text-xs text-[#7A7363]">
              Simple Calorie & Macro Calculator for Indian Diets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTargetModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E2DBD0] text-xs font-bold text-[#1E1E24] transition-colors shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-[#7A7363]" />
            <span>Target: {targetCalories} kcal</span>
          </button>

          <button
            onClick={fetchToday}
            title="Refresh entries"
            className="w-8 h-8 rounded-full border border-[#E2DBD0] bg-[#FAF6EE] hover:bg-[#F2ECE0] flex items-center justify-center text-[#1E1E24] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {user?.email ? (
            <button
              onClick={onLogout}
              title={`Sign Out (${user.fullName || user.email})`}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-[#E2DBD0] bg-[#FAF6EE] hover:bg-rose-50 text-xs font-bold text-[#7A7363] hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold transition-transform active:scale-95 shadow-sm"
            >
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. THE 4 PASTEL BENTO CARDS: Clean, Bold, Straightforward */}
      <section aria-label="Daily Macros" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Calories Card (Warm Yellow) */}
        <div className="bg-[#FDE382] rounded-[22px] p-4 sm:p-5 text-[#2E2713] flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#63552D]">
              Calories
            </span>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1E1E24] tracking-tight">
                {consumedCalories}
              </span>
              <span className="text-xs font-bold text-[#63552D]">/ {targetCalories} kcal</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-[#ECCF69] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (consumedCalories / targetCalories) * 100)}%` }}
                className="bg-[#1E1E24] h-full rounded-full transition-all duration-300"
              />
            </div>
            <p className="text-[10px] font-semibold text-[#63552D] mt-1 text-right">
              {remainingCalories} kcal left
            </p>
          </div>
        </div>

        {/* Protein Card (Soft Rose) */}
        <div className="bg-[#FFC4D2] rounded-[22px] p-4 sm:p-5 text-[#421722] flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A3648]">
              Protein
            </span>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1E1E24] tracking-tight">
                {consumedProtein}g
              </span>
              <span className="text-xs font-bold text-[#7A3648]">/ {targetProtein}g</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-[#FFAEBF] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
                className="bg-[#1E1E24] h-full rounded-full transition-all duration-300"
              />
            </div>
            <p className="text-[10px] font-semibold text-[#7A3648] mt-1 text-right">
              {Math.max(0, targetProtein - consumedProtein)}g left
            </p>
          </div>
        </div>

        {/* Carbs Card (Sage Green) */}
        <div className="bg-[#ABC480] rounded-[22px] p-4 sm:p-5 text-[#243510] flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#3D5321]">
              Carbs
            </span>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1E1E24] tracking-tight">
                {consumedCarbs}g
              </span>
              <span className="text-xs font-bold text-[#3D5321]">/ {targetCarbs}g</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-[#96B16A] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }}
                className="bg-[#1E1E24] h-full rounded-full transition-all duration-300"
              />
            </div>
            <p className="text-[10px] font-semibold text-[#3D5321] mt-1 text-right">
              {Math.max(0, targetCarbs - consumedCarbs)}g left
            </p>
          </div>
        </div>

        {/* Fats Card (Soft Blue) */}
        <div className="bg-[#BBD5F8] rounded-[22px] p-4 sm:p-5 text-[#182C4E] flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#324B74]">
              Fats
            </span>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1E1E24] tracking-tight">
                {consumedFat}g
              </span>
              <span className="text-xs font-bold text-[#324B74]">/ {targetFat}g</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-[#A2C4F2] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }}
                className="bg-[#1E1E24] h-full rounded-full transition-all duration-300"
              />
            </div>
            <p className="text-[10px] font-semibold text-[#324B74] mt-1 text-right">
              {Math.max(0, targetFat - consumedFat)}g left
            </p>
          </div>
        </div>
      </section>

      {/* 3. THE MAIN FEATURE: TYPE FOOD & CALCULATE (FRONT & CENTER) */}
      <section aria-label="Calculate Food" className="bg-[#FEEBF0] rounded-[28px] p-5 sm:p-6 border border-[#FBCFD8] shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#1E1E24] tracking-tight">
            Type Food Item & Calculate
          </h2>
          <p className="text-xs text-[#7A3648] mt-0.5">
            Type in natural language (e.g. "2 rotis with dal", "100g paneer", "2 eggs", "chicken biryani")
          </p>
        </div>

        {/* Big Input Row */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#F7CDD7] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Meal selector dropdown pill */}
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="bg-[#FAF7F0] text-xs font-bold text-[#1E1E24] rounded-xl px-3 py-2 border border-[#E6DFD2] outline-none cursor-pointer shrink-0"
          >
            <option value="BREAKFAST">🌅 Breakfast</option>
            <option value="LUNCH">☀️ Lunch</option>
            <option value="DINNER">🌙 Dinner</option>
            <option value="SNACK">🍎 Snack</option>
          </select>

          {/* Text input */}
          <input
            type="text"
            value={foodInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveMeal();
            }}
            placeholder="Type food (e.g. 2 rotis with 1 bowl dal, 100g chicken breast)..."
            className="flex-1 bg-transparent px-2 text-sm font-semibold text-[#1E1E24] placeholder:text-[#A09886] outline-none"
          />

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCalculateAi}
              disabled={isCalculating || !foodInput.trim()}
              title="Deep AI Parse"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#1E1E24] text-xs font-bold transition-all disabled:opacity-40 flex items-center space-x-1"
            >
              {isCalculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#C24161]" />
              )}
              <span className="hidden sm:inline">AI Parse</span>
            </button>

            <button
              type="button"
              onClick={handleSaveMeal}
              disabled={isSaving || !foodInput.trim()}
              className="px-5 py-2 rounded-xl bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-transform active:scale-95 disabled:opacity-40 shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Log to {mealType.toLowerCase()}</span>
            </button>
          </div>
        </div>

        {/* Quick try presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A3648] mr-1">
            Quick tries:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMealType(p.type);
                handleInputChange(p.text);
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white hover:bg-[#FAF7F0] text-[#4A1525] border border-[#F8BFCD] transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Calculated Results Live Badges */}
        {calculatedItems.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-[#F7CDD7] shadow-sm animate-in fade-in space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#1E1E24]">
                Calculated Nutrients:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full bg-[#FFD1DD] text-[#69182C] text-xs font-black">
                  🔥 {calcCalories} kcal
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#D1E3FC] text-[#16386C] text-xs font-black">
                  🥩 {calcProtein.toFixed(1)}g Protein
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#D7E8BC] text-[#315014] text-xs font-black">
                  🍞 {calcCarbs.toFixed(1)}g Carbs
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#FCE3AF] text-[#644408] text-xs font-black">
                  🥑 {calcFat.toFixed(1)}g Fat
                </span>
              </div>
            </div>

            {/* Individual items breakdown if multi-item */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-[#F5EFE3] text-[11px] text-[#6E6758]">
              {calculatedItems.map((item, idx) => (
                <div key={idx} className="bg-[#FAF7F0] px-2.5 py-1 rounded-lg border border-[#EAE2D2]">
                  <strong>{item.foodName}</strong> ({item.quantity} {item.unit}) &rarr;{' '}
                  <span className="text-[#1E1E24] font-bold">{item.calories} kcal</span> •{' '}
                  <span className="text-[#16386C] font-semibold">{item.proteinG}g P</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
      </section>

      {/* 4. TODAY'S LOGGED MEALS (CLEAN 4-MEAL GRID) */}
      <section aria-label="Today's Logged Meals" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-[#1E1E24] tracking-tight">
            Today's Logged Meals
          </h2>
          <span className="text-xs font-bold text-[#7A7363]">
            {entries.length} items logged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealsList.map((meal) => {
            const mealEntries = entries.filter((e) => e.mealType === meal.type);
            const totalMealCalories = mealEntries.reduce((s, e) => s + (e.calories || 0), 0);
            const totalMealProtein = mealEntries.reduce((s, e) => s + (Number(e.proteinG) || 0), 0);
            const Icon = meal.icon;

            return (
              <div
                key={meal.type}
                className="bg-white rounded-[22px] p-4 border border-[#ECE5D6] shadow-sm flex flex-col justify-between"
              >
                {/* Meal header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#F5EFE3]">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${meal.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#1E1E24]">{meal.title}</h3>
                      <p className="text-[10px] text-[#8C8677]">
                        {mealEntries.length} {mealEntries.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-[#1E1E24]">
                      {totalMealCalories} kcal
                    </span>
                    {totalMealProtein > 0 && (
                      <span className="text-[10px] font-bold text-[#16386C] block">
                        {totalMealProtein.toFixed(1)}g protein
                      </span>
                    )}
                  </div>
                </div>

                {/* Meal items */}
                <div className="divide-y divide-[#F5EFE3] mt-1 min-h-[60px]">
                  {mealEntries.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-[#9A9382]">
                      No items logged for {meal.title.toLowerCase()}.
                    </div>
                  ) : (
                    mealEntries.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-[#1E1E24] truncate">{item.foodName}</p>
                          <p className="text-[10px] text-[#8C8677]">
                            {item.quantity} {item.unit} • {item.proteinG}g P • {item.carbsG}g C • {item.fatG}g F
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-extrabold text-[#1E1E24] text-xs">
                            {item.calories} kcal
                          </span>
                          <button
                            onClick={() => handleDeleteEntry(item.id)}
                            title="Delete"
                            className="p-1 text-[#A8A190] hover:text-rose-500 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
