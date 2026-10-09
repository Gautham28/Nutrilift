import React, { useState, useEffect } from 'react';
import { FoodItem, FoodEntry, MealType, TodayEntriesResponse } from '../types';
import { entriesApi } from '../services/api';
import {
  Flame,
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
  Calendar as CalendarIcon,
  Sparkles,
  Camera,
} from 'lucide-react';

interface SimpleDashboardProps {
  user: any;
  onOpenTargetModal: () => void;
  onOpenAiAdvisor?: () => void;
  onOpenPlateScanner?: () => void;
  onLogout: () => void;
  onNavigateToCalendar?: () => void;
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({
  user,
  onOpenTargetModal,
  onOpenAiAdvisor,
  onOpenPlateScanner,
  onLogout,
  onNavigateToCalendar,
}) => {
  // Input for AI food logging
  const [foodInput, setFoodInput] = useState('');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
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

  const handleInputChange = (text: string) => {
    setFoodInput(text);
    setErrorMsg(null);
  };

  // Save food solely with AI
  const handleSaveMeal = async () => {
    const text = foodInput.trim();
    if (!text) {
      setErrorMsg('Please enter what you ate (e.g. 3 dosa, black chana curry).');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      // 100% Real AI Parsing via Gemini backend
      const parsedItems = await entriesApi.parseWithAi(text, mealType);

      if (!parsedItems || parsedItems.length === 0) {
        setErrorMsg('No food items recognized by AI. Please describe what you ate (e.g. 3 dosa, black chana curry).');
        setIsSaving(false);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      await entriesApi.createEntries(todayStr, mealType, parsedItems);
      await fetchToday();

      const totalCals = parsedItems.reduce((acc, cur) => acc + (cur.calories || 0), 0);
      const itemsSummary = parsedItems.map((i) => `${i.quantity} ${i.unit} ${i.foodName}`).join(', ');
      setFoodInput('');
      setSuccessMsg(`Logged with AI: ${itemsSummary} (${totalCals} kcal)!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'AI could not recognize food in your input. Please specify what you ate.';
      setErrorMsg(msg);
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
        const remaining = todayData.entries.filter((e: FoodEntry) => e.id !== id);
        const delItem = todayData.entries.find((e: FoodEntry) => e.id === id);
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
          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E2DBD0] text-xs font-bold text-[#1E1E24] transition-colors shadow-sm"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#FF358B]" />
              <span>Calendar</span>
            </button>
          )}

          <button
            onClick={onOpenTargetModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E2DBD0] text-xs font-bold text-[#1E1E24] transition-colors shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-[#7A7363]" />
            <span>Target: {targetCalories} kcal</span>
          </button>

          {onOpenAiAdvisor && (
            <button
              onClick={onOpenAiAdvisor}
              title="AI Target Assistant"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold transition-transform active:scale-95 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFAEBF]" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>
          )}

          {onOpenPlateScanner && (
            <button
              onClick={onOpenPlateScanner}
              title="Scan Meal Plate with AI Vision"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E2DBD0] text-xs font-bold text-[#1E1E24] transition-colors shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-[#9E4D61]" />
              <span className="hidden sm:inline">Scan Plate</span>
            </button>
          )}

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

      {/* 3. STREAMLINED AI INPUT BAR: Ultra-clean & Simple */}
      <section aria-label="Quick Log Food" className="space-y-2">
        <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-[#E2DBD0] shadow-sm hover:border-[#D5CCBD] focus-within:border-[#1E1E24] focus-within:ring-2 focus-within:ring-[#1E1E24]/5 focus-within:shadow-md transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Meal selector */}
          <div className="shrink-0 relative flex items-center">
            <div className="absolute left-3 pointer-events-none text-[#7A7363]">
              {mealType === 'BREAKFAST' && <Sunrise className="w-3.5 h-3.5 text-amber-500" />}
              {mealType === 'LUNCH' && <Sun className="w-3.5 h-3.5 text-amber-600" />}
              {mealType === 'DINNER' && <Moon className="w-3.5 h-3.5 text-indigo-500" />}
              {mealType === 'SNACK' && <Apple className="w-3.5 h-3.5 text-rose-500" />}
            </div>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full sm:w-auto bg-[#FAF7F0] hover:bg-[#F2ECE0] text-xs font-bold text-[#1E1E24] rounded-xl pl-8 pr-3 py-2.5 border border-[#E2DBD0] outline-none cursor-pointer transition-colors"
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack</option>
            </select>
          </div>

          {/* Natural language AI input */}
          <input
            type="text"
            value={foodInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveMeal();
            }}
            placeholder="What did you eat? (e.g. 2 rotis with dal, 100g paneer, 2 eggs)..."
            className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm font-semibold text-[#1E1E24] placeholder:text-[#A09886] outline-none"
          />

          {/* Plate Scanner Camera button */}
          {onOpenPlateScanner && (
            <button
              type="button"
              onClick={onOpenPlateScanner}
              title="Snap or upload food plate photo"
              className="shrink-0 px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F2ECE0] text-[#1E1E24] border border-[#E2DBD0] text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-[#9E4D61]" />
              <span className="hidden md:inline">Scan Plate</span>
            </button>
          )}

          {/* Single smart Log Meal action button with Enter support */}
          <button
            type="button"
            onClick={handleSaveMeal}
            disabled={isSaving || !foodInput.trim()}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-40 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI Analyzing...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Log Meal</span>
              </>
            )}
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
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
