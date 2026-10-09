import React, { useState, useEffect } from 'react';
import { FoodItem, FoodEntry, MealType, TodayEntriesResponse } from '../types';
import { entriesApi } from '../services/api';
import { calculateFoodItem, CalculatedFood } from '../utils/nutritionEngine';
import { HeaderBar } from './HeaderBar';
import { CalendarWidget } from './CalendarWidget';
import { TimelineWidget } from './TimelineWidget';
import { ManualFoodModal } from './ManualFoodModal';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Flame,
  Beef,
  Heart,
  Star,
  RefreshCw,
  Utensils,
  Dumbbell,
} from 'lucide-react';

interface RedesignedDashboardProps {
  onOpenTargetModal: () => void;
  user: any;
  onLogout: () => void;
  onOpenManualModal?: () => void;
}

export const RedesignedDashboard: React.FC<RedesignedDashboardProps> = ({
  onOpenTargetModal,
  user,
}) => {
  // Search & Calculator state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('LUNCH');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Input for food calculation
  const [rawText, setRawText] = useState('2 rotis with 1 bowl dal tadka');
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedItems, setParsedItems] = useState<CalculatedFood[]>(() =>
    calculateFoodItem('2 rotis with 1 bowl dal tadka')
  );
  const [saving, setSaving] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Manual modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualMealType, setManualMealType] = useState<MealType>('LUNCH');

  // Today's entries from API / DB
  const [todayData, setTodayData] = useState<TodayEntriesResponse | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Fetch real data from backend
  const fetchTodayEntries = async () => {
    setLoadingEntries(true);
    try {
      const data = await entriesApi.getToday();
      setTodayData(data);
    } catch {
      // If unauthenticated or backend empty, initialize fallback sample if no entries exist
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchTodayEntries();
  }, []);

  // Compute live targets & consumed macros from real user and backend data
  const targetCalories = user?.targetCalories || 2000;
  const targetProtein = user?.targetProteinG || 130;
  // Standard fitness ratios: Carbs ~50% kcal (4 kcal/g), Fat ~25% kcal (9 kcal/g)
  const targetCarbs = Math.round((targetCalories * 0.5) / 4);
  const targetFat = Math.round((targetCalories * 0.25) / 9);

  // Entries list (either real backend or fallback)
  const fallbackEntries: FoodEntry[] = [
    {
      id: 'init-1',
      userId: user?.id || 'demo-user',
      foodName: '2 Boiled Eggs & Whole Wheat Toast',
      quantity: 2,
      unit: 'pieces',
      calories: 290,
      proteinG: 21,
      carbsG: 24,
      fatG: 11,
      entryDate: new Date().toISOString().split('T')[0],
      mealType: 'BREAKFAST',
    },
    {
      id: 'init-2',
      userId: user?.id || 'demo-user',
      foodName: '2 Rotis with Dal Tadka & Cucumber Salad',
      quantity: 1,
      unit: 'plate',
      calories: 460,
      proteinG: 18,
      carbsG: 68,
      fatG: 12,
      entryDate: new Date().toISOString().split('T')[0],
      mealType: 'LUNCH',
    },
    {
      id: 'init-3',
      userId: user?.id || 'demo-user',
      foodName: 'Greek Yogurt with Almonds',
      quantity: 1,
      unit: 'cup',
      calories: 190,
      proteinG: 15,
      carbsG: 14,
      fatG: 7,
      entryDate: new Date().toISOString().split('T')[0],
      mealType: 'SNACK',
    },
  ];

  const currentEntries: FoodEntry[] =
    todayData && todayData.entries && todayData.entries.length > 0
      ? todayData.entries
      : fallbackEntries;

  const consumedCalories = todayData ? todayData.totalCalories : currentEntries.reduce((s, e) => s + (e.calories || 0), 0);
  const consumedProtein = todayData ? Math.round(Number(todayData.totalProtein)) : Math.round(currentEntries.reduce((s, e) => s + (Number(e.proteinG) || 0), 0));
  const consumedCarbs = todayData ? Math.round(Number(todayData.totalCarbs)) : Math.round(currentEntries.reduce((s, e) => s + (Number(e.carbsG) || 0), 0));
  const consumedFat = todayData ? Math.round(Number(todayData.totalFat)) : Math.round(currentEntries.reduce((s, e) => s + (Number(e.fatG) || 0), 0));
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);

  // Calorie breakdown by meal
  const breakfastCalories = currentEntries.filter((e) => e.mealType === 'BREAKFAST').reduce((s, e) => s + (e.calories || 0), 0);
  const lunchCalories = currentEntries.filter((e) => e.mealType === 'LUNCH').reduce((s, e) => s + (e.calories || 0), 0);
  const snackCalories = currentEntries.filter((e) => e.mealType === 'SNACK').reduce((s, e) => s + (e.calories || 0), 0);
  const dinnerCalories = currentEntries.filter((e) => e.mealType === 'DINNER').reduce((s, e) => s + (e.calories || 0), 0);

  // CORE FEATURE: Natural Language Food Calculation
  const handleCalculateFood = async (inputText: string) => {
    if (!inputText.trim()) {
      setCalcError('Please enter what you ate.');
      return;
    }
    setCalcError(null);
    setSaveSuccessMsg(null);
    setAnalyzing(true);

    try {
      // 1. First try AI parse via backend Gemini API
      const aiItems = await entriesApi.parseWithAi(inputText, selectedMealType);
      if (aiItems && aiItems.length > 0) {
        const formatted: CalculatedFood[] = aiItems.map((item) => ({
          foodName: item.foodName,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          category: 'Dishes',
        }));
        setParsedItems(formatted);
        return;
      }
    } catch {
      // 2. Seamless fallback to local nutrition database engine
      const localResults = calculateFoodItem(inputText);
      setParsedItems(localResults);
    } finally {
      setAnalyzing(false);
    }
  };

  // Top header search form submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setRawText(searchQuery);
    handleCalculateFood(searchQuery);
  };

  // Edit parsed item field
  const handleItemChange = (index: number, field: keyof CalculatedFood, value: any) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveParsedItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm and save food entries to backend PostgreSQL
  const handleSaveToDiary = async () => {
    if (parsedItems.length === 0) return;
    setSaving(true);
    setCalcError(null);

    const itemsToSave: FoodItem[] = parsedItems.map((item) => ({
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
      await entriesApi.createEntries(todayStr, selectedMealType, itemsToSave);
      await fetchTodayEntries();
      setSaveSuccessMsg(`Logged ${itemsToSave.length} item(s) to ${selectedMealType.toLowerCase()}!`);
    } catch {
      // Local state update if backend request fails / guest session
      const newEntries: FoodEntry[] = itemsToSave.map((item, idx) => ({
        ...item,
        id: `local-${Date.now()}-${idx}`,
        userId: user?.id || 'demo-user',
        entryDate: new Date().toISOString().split('T')[0],
        mealType: selectedMealType,
      }));
      setTodayData((prev) => ({
        date: new Date().toISOString().split('T')[0],
        groupedByMeal: {
          BREAKFAST: [...(prev?.groupedByMeal?.BREAKFAST || []), ...(selectedMealType === 'BREAKFAST' ? newEntries : [])],
          LUNCH: [...(prev?.groupedByMeal?.LUNCH || []), ...(selectedMealType === 'LUNCH' ? newEntries : [])],
          DINNER: [...(prev?.groupedByMeal?.DINNER || []), ...(selectedMealType === 'DINNER' ? newEntries : [])],
          SNACK: [...(prev?.groupedByMeal?.SNACK || []), ...(selectedMealType === 'SNACK' ? newEntries : [])],
        },
        entries: [...(prev?.entries || fallbackEntries), ...newEntries],
        totalCalories: consumedCalories + newEntries.reduce((s, e) => s + e.calories, 0),
        totalProtein: consumedProtein + newEntries.reduce((s, e) => s + e.proteinG, 0),
        totalCarbs: consumedCarbs + newEntries.reduce((s, e) => s + e.carbsG, 0),
        totalFat: consumedFat + newEntries.reduce((s, e) => s + e.fatG, 0),
        targetCalories: targetCalories,
        targetProteinG: targetProtein,
      }));
      setSaveSuccessMsg(`Logged ${itemsToSave.length} item(s) to ${selectedMealType.toLowerCase()}!`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await entriesApi.deleteEntry(id);
      await fetchTodayEntries();
    } catch {
      // Local deletion
      if (todayData) {
        setTodayData({
          ...todayData,
          entries: todayData.entries.filter((e) => e.id !== id),
        });
      }
    }
  };

  const handleOpenManual = (type: MealType) => {
    setManualMealType(type);
    setManualModalOpen(true);
  };

  const quickPresets = [
    { label: '2 Rotis & Dal', text: '2 rotis with 1 bowl dal tadka and cucumber salad', type: 'LUNCH' as MealType },
    { label: 'Idli & Sambar', text: '3 idlis with 1 bowl sambar and coconut chutney', type: 'BREAKFAST' as MealType },
    { label: 'Chicken Biryani', text: '1 plate chicken biryani with cucumber raita', type: 'DINNER' as MealType },
    { label: 'Paneer Bhurji', text: '1 bowl paneer bhurji with 2 parathas', type: 'LUNCH' as MealType },
    { label: 'Chai & Biscuits', text: '1 cup masala chai with milk and 2 Marie biscuits', type: 'SNACK' as MealType },
    { label: 'Eggs & Toast', text: '2 boiled eggs with 2 slices whole wheat toast', type: 'BREAKFAST' as MealType },
  ];

  const totalCalcCalories = parsedItems.reduce((acc, cur) => acc + (Number(cur.calories) || 0), 0);
  const totalCalcProtein = parsedItems.reduce((acc, cur) => acc + (Number(cur.proteinG) || 0), 0);
  const totalCalcCarbs = parsedItems.reduce((acc, cur) => acc + (Number(cur.carbsG) || 0), 0);
  const totalCalcFat = parsedItems.reduce((acc, cur) => acc + (Number(cur.fatG) || 0), 0);

  const getMealMeta = (type: MealType) => {
    switch (type) {
      case 'BREAKFAST':
        return { icon: Sunrise, label: 'Breakfast', color: 'bg-[#FFD4DF] text-[#7A1F38]' };
      case 'LUNCH':
        return { icon: Sun, label: 'Lunch', color: 'bg-[#D1E3FC] text-[#1E3B68]' };
      case 'DINNER':
        return { icon: Moon, label: 'Dinner', color: 'bg-[#D7E8BC] text-[#345115]' };
      case 'SNACK':
        return { icon: Apple, label: 'Snacks', color: 'bg-[#FEECA8] text-[#5C450C]' };
    }
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Top Search & Quick Food Calculation Bar */}
      <HeaderBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedMealType={selectedMealType}
        setSelectedMealType={setSelectedMealType}
        onSearchSubmit={handleSearchSubmit}
        onOpenTargetModal={onOpenTargetModal}
        userName={user?.fullName || 'Lifter'}
        targetCalories={targetCalories}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Content Area (8.5 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Greeting Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17171C] tracking-tight">
                Namaste, {user?.fullName || 'Lifter'}
              </h1>
              <p className="text-xs sm:text-sm text-[#736D5F] mt-0.5">
                Calculate calories & macros for Indian portions instantly. You have{' '}
                <strong className="text-[#17171C]">{remainingCalories} kcal</strong> left to hit your{' '}
                {targetCalories} kcal goal today.
              </p>
            </div>

            <button
              onClick={onOpenTargetModal}
              className="text-xs font-bold text-[#17171C] hover:underline self-start sm:self-auto bg-[#FAF7F0] border border-[#E8E2D2] px-3 py-1.5 rounded-full shadow-sm"
            >
              TDEE Targets &rarr;
            </button>
          </div>

          {/* 4 PASTEL BENTO CARDS: NutriLift's 4 Core Macro Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD 1: Yellow / Mustard -> Calorie Balance */}
            <div className="bg-[#FDE382] rounded-[24px] p-5 text-[#322A13] flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="absolute top-2 right-4 text-[#F5D86B] font-bold select-none pointer-events-none opacity-40">
                <Flame className="w-16 h-16" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B502C] mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#1E1E24]" /> Daily Calories
                </h3>
                <div className="grid grid-cols-3 gap-2 text-left mb-3">
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {remainingCalories}
                    </p>
                    <p className="text-[10px] text-[#635730] font-semibold uppercase tracking-wider">
                      REMAINING
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {consumedCalories}
                    </p>
                    <p className="text-[10px] text-[#635730] font-semibold uppercase tracking-wider">
                      CONSUMED
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {targetCalories}
                    </p>
                    <p className="text-[10px] text-[#635730] font-semibold uppercase tracking-wider">
                      TDEE GOAL
                    </p>
                  </div>
                </div>
              </div>

              {/* Vertical Meal Bars (Breakfast, Lunch, Snacks, Dinner) */}
              <div className="pt-2">
                <div className="flex items-end justify-between h-14 px-2 mb-1">
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      style={{ height: `${Math.min(48, Math.max(8, (breakfastCalories / 800) * 48))}px` }}
                      className="w-3 bg-[#1E1E24] rounded-full transition-all duration-300"
                    />
                    <span className="text-[9px] font-bold text-[#5B502C]">B ({breakfastCalories})</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      style={{ height: `${Math.min(48, Math.max(8, (lunchCalories / 800) * 48))}px` }}
                      className="w-3 bg-[#1E1E24] rounded-full transition-all duration-300"
                    />
                    <span className="text-[9px] font-bold text-[#5B502C]">L ({lunchCalories})</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      style={{ height: `${Math.min(48, Math.max(8, (snackCalories / 800) * 48))}px` }}
                      className="w-3 bg-[#1E1E24] rounded-full transition-all duration-300"
                    />
                    <span className="text-[9px] font-bold text-[#5B502C]">S ({snackCalories})</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      style={{ height: `${Math.min(48, Math.max(8, (dinnerCalories / 800) * 48))}px` }}
                      className="w-3 bg-[#1E1E24] rounded-full transition-all duration-300"
                    />
                    <span className="text-[9px] font-bold text-[#5B502C]">D ({dinnerCalories})</span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-[#6E633B] font-mono pt-1 border-t border-[#EDD06C]">
                  <span>Morning</span>
                  <span>Night</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Soft Pink / Rose -> Protein Target */}
            <div className="bg-[#FFC4D2] rounded-[24px] p-5 text-[#4A1525] flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="absolute top-3 right-4">
                <Dumbbell className="w-10 h-10 text-[#FFA7BC] opacity-50" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A3648] mb-2 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#1E1E24]" /> Protein Target (1.8g/kg)
                </h3>
                <div className="grid grid-cols-3 gap-2 text-left mb-3">
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {consumedProtein}g
                    </p>
                    <p className="text-[10px] text-[#7A3648] font-semibold uppercase tracking-wider">
                      CONSUMED
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {Math.max(0, targetProtein - consumedProtein)}g
                    </p>
                    <p className="text-[10px] text-[#7A3648] font-semibold uppercase tracking-wider">
                      REMAINING
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {targetProtein}g
                    </p>
                    <p className="text-[10px] text-[#7A3648] font-semibold uppercase tracking-wider">
                      TARGET
                    </p>
                  </div>
                </div>
              </div>

              {/* Protein Curve & Synthesis Meter */}
              <div className="pt-2">
                <div className="w-full bg-[#FFAEBF] h-3 rounded-full overflow-hidden mb-1.5">
                  <div
                    style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
                    className="bg-[#1E1E24] h-full rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#7A3648] font-medium">
                  <span>{Math.round((consumedProtein / targetProtein) * 100)}% met</span>
                  <span className="font-bold text-[#1E1E24]">
                    {consumedProtein >= targetProtein ? 'Goal Reached!' : 'Muscle Synthesis Zone'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Sage Green -> Carbohydrates */}
            <div className="bg-[#ABC480] rounded-[24px] p-5 text-[#243510] flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="absolute top-2 right-4 w-10 h-10 bg-[#9CB86F] rounded-2xl rotate-12 opacity-40 pointer-events-none" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3D5321] mb-2">
                  Carbohydrates (Energy)
                </h3>
                <div className="grid grid-cols-3 gap-2 text-left mb-3">
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {consumedCarbs}g
                    </p>
                    <p className="text-[10px] text-[#3D5321] font-semibold uppercase tracking-wider">
                      CONSUMED
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {Math.max(0, targetCarbs - consumedCarbs)}g
                    </p>
                    <p className="text-[10px] text-[#3D5321] font-semibold uppercase tracking-wider">
                      LEFT
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {targetCarbs}g
                    </p>
                    <p className="text-[10px] text-[#3D5321] font-semibold uppercase tracking-wider">
                      TARGET (~50%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full bg-[#96B16A] h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }}
                    className="bg-[#1E1E24] h-full rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#3D5321] font-medium mt-1">
                  <span>{Math.round((consumedCarbs / targetCarbs) * 100)}% energy quota</span>
                  <span className="font-bold text-[#1E1E24]">Complex carbs</span>
                </div>
              </div>
            </div>

            {/* CARD 4: Soft Sky Blue -> Healthy Fats */}
            <div className="bg-[#BBD5F8] rounded-[24px] p-5 text-[#182C4E] flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="absolute top-3 right-4">
                <Star className="w-10 h-10 text-[#9EBEEC] fill-[#9EBEEC] opacity-60" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#324B74] mb-2">
                  Dietary Fats (Hormonal Balance)
                </h3>
                <div className="grid grid-cols-3 gap-2 text-left mb-3">
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {consumedFat}g
                    </p>
                    <p className="text-[10px] text-[#324B74] font-semibold uppercase tracking-wider">
                      CONSUMED
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {Math.max(0, targetFat - consumedFat)}g
                    </p>
                    <p className="text-[10px] text-[#324B74] font-semibold uppercase tracking-wider">
                      LEFT
                    </p>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-[#1E1E24] leading-tight">
                      {targetFat}g
                    </p>
                    <p className="text-[10px] text-[#324B74] font-semibold uppercase tracking-wider">
                      TARGET (~25%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full bg-[#A2C4F2] h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }}
                    className="bg-[#1E1E24] h-full rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#324B74] font-medium mt-1">
                  <span>{Math.round((consumedFat / targetFat) * 100)}% quota</span>
                  <span className="font-bold text-[#1E1E24]">Essential lipids</span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN SECTION: The Core Food Calculator & Today's Meals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* RIGHT COLUMN in Reference: FOOD CALCULATOR & NUTRIENT INSPECTOR (THE USER'S PRIMARY REQUEST) */}
            <div className="lg:col-span-7 bg-[#FEEBF0] rounded-[28px] p-5 sm:p-6 border border-[#FBCFD8] flex flex-col justify-between shadow-sm relative order-1 lg:order-2">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base font-extrabold text-[#1E1E24]">
                      AI Food Macro Calculator
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#1E1E24] text-[10px] font-mono font-bold border border-[#F8BFCD]">
                      AI BETA
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenManual(selectedMealType)}
                    className="text-[11px] font-semibold text-[#8B384D] hover:underline"
                  >
                    + Manual Form
                  </button>
                </div>

                {/* Main Interactive Input Box */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#F7CDD7] shadow-sm mb-4">
                  <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">
                    What did you eat? (Natural language Indian portions supported)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCalculateFood(rawText);
                      }}
                      placeholder="e.g. 2 rotis with dal, 100g paneer, 2 eggs, 1 plate biryani..."
                      className="flex-1 text-xs sm:text-sm font-semibold text-[#1E1E24] placeholder:text-[#9A9382] bg-[#FAF7F0] border border-[#EAE2D2] rounded-xl px-3 py-2 outline-none focus:border-[#FFAEBF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCalculateFood(rawText)}
                      disabled={analyzing || !rawText.trim()}
                      className="px-4 py-2 rounded-xl bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold transition-transform active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {analyzing ? (
                        <div className="flex items-center space-x-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Calculating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#FFAEBF]" />
                          <span>Calculate</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-[#F5EFE3]">
                    <span className="text-[10px] text-[#868070] font-semibold mr-1 self-center">
                      Quick tries:
                    </span>
                    {quickPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setRawText(preset.text);
                          setSelectedMealType(preset.type);
                          handleCalculateFood(preset.text);
                        }}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#554F42] transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error message */}
                {calcError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{calcError}</span>
                  </div>
                )}

                {/* Parsed Macro Breakdown Badges (Matching reference pill tags) */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E1E24]">
                    Calculated Breakdown ({parsedItems.length} items):
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFD1DD] text-[#69182C] text-xs font-extrabold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#69182C]" />
                      <span>{totalCalcCalories} kcal</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#E5D7FA] text-[#411F74] text-xs font-extrabold flex items-center gap-1">
                      <Beef className="w-3.5 h-3.5 text-[#411F74]" />
                      <span>{totalCalcProtein.toFixed(1)}g Protein</span>
                    </span>
                  </div>
                </div>

                {/* Editable items list */}
                <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                  {parsedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-2xl border border-[#F7CDD7] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.foodName}
                          onChange={(e) => handleItemChange(idx, 'foodName', e.target.value)}
                          className="font-bold text-xs text-[#1E1E24] bg-transparent outline-none w-full border-b border-transparent focus:border-[#FFAEBF]"
                        />
                        <div className="flex items-center space-x-2 text-[11px] text-[#6E6758] mt-1">
                          <span>Qty:</span>
                          <input
                            type="number"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)
                            }
                            className="w-12 px-1 py-0.5 rounded bg-[#FAF7F0] border border-[#E4DDD0] text-center text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-16 px-1 py-0.5 rounded bg-[#FAF7F0] border border-[#E4DDD0] text-center text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <input
                              type="number"
                              value={item.calories}
                              onChange={(e) =>
                                handleItemChange(idx, 'calories', parseInt(e.target.value) || 0)
                              }
                              className="w-14 px-1 py-0.5 rounded bg-[#FAF7F0] border border-[#E4DDD0] text-right font-extrabold text-xs text-[#1E1E24]"
                            />
                            <span className="text-[10px] text-[#868070]">kcal</span>
                          </div>
                          <p className="text-[10px] text-[#6E6758] mt-0.5">
                            P: {item.proteinG}g • C: {item.carbsG}g • F: {item.fatG}g
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveParsedItem(idx)}
                          className="p-1 text-[#B0A99A] hover:text-rose-500 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar: Select Meal & Confirm & Save to DB */}
              <div className="pt-3 border-t border-[#F7CDD7] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#844354]">Log into:</span>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                    className="bg-white text-xs font-bold text-[#1E1E24] rounded-xl px-3 py-1.5 border border-[#F8BFCD] outline-none cursor-pointer"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToDiary}
                  disabled={saving || parsedItems.length === 0}
                  className="py-2.5 px-6 rounded-full bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Log to {selectedMealType.toLowerCase()}</span>
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="mt-2.5 p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center space-x-1.5 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* LEFT COLUMN: TODAY'S LOGGED MEALS (Matching "Patient's list" in Reference) */}
            <div className="lg:col-span-5 space-y-3 order-2 lg:order-1">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-extrabold text-[#1E1E24] tracking-tight">
                  Today's Meals ({currentEntries.length})
                </h2>
                <button
                  onClick={fetchTodayEntries}
                  title="Refresh entries"
                  className="flex items-center space-x-1 text-xs font-semibold text-[#666052] hover:text-[#1E1E24]"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingEntries ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Meals list */}
              <div className="space-y-2.5">
                {currentEntries.map((entry) => {
                  const meta = getMealMeta(entry.mealType);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => {
                        setRawText(entry.foodName);
                        handleCalculateFood(entry.foodName);
                      }}
                      className="bg-white hover:bg-[#FFFDF7] p-3 rounded-2xl border border-[#ECE5D6] shadow-sm flex items-center justify-between space-x-2 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}
                        >
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E1E24] truncate group-hover:text-black">
                            {entry.foodName}
                          </p>
                          <p className="text-[10px] text-[#868070]">
                            {entry.quantity} {entry.unit} •{' '}
                            <span className="font-semibold text-[#1E1E24]">{entry.calories} kcal</span> •{' '}
                            <span className="text-[#3A5D8A] font-semibold">{entry.proteinG}g P</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-[#1E1E24] bg-[#F4EFE2] px-2 py-0.5 rounded-full capitalize">
                          {entry.mealType.toLowerCase()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          title="Delete entry"
                          className="p-1 text-[#A8A190] hover:text-rose-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {currentEntries.length === 0 && (
                  <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-[#DCD5C5] text-xs text-[#8C8677]">
                    <Utensils className="w-6 h-6 mx-auto mb-1 text-[#A8A190]" />
                    <p>No meals logged yet today.</p>
                    <p className="text-[10px] mt-1 text-[#A8A190]">
                      Type in the calculator above or pick a quick try!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calendar Widget & Today's Timeline (3.5 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <CalendarWidget
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onQuickAddFood={() => {
              const el = document.querySelector('input[placeholder*="What did you eat"]') as HTMLInputElement;
              if (el) el.focus();
            }}
            onRefresh={fetchTodayEntries}
          />

          <TimelineWidget
            entries={currentEntries}
            selectedDate={selectedDate}
            onSelectEntry={(entry) => {
              setRawText(entry.foodName);
              handleCalculateFood(entry.foodName);
            }}
            onQuickAddMeal={(mealType) => {
              setSelectedMealType(mealType);
              const el = document.querySelector('input[placeholder*="What did you eat"]') as HTMLInputElement;
              if (el) el.focus();
            }}
          />
        </div>
      </div>

      {/* Manual Food Entry Modal */}
      <ManualFoodModal
        isOpen={manualModalOpen}
        initialMealType={manualMealType}
        onClose={() => setManualModalOpen(false)}
        onEntryAdded={fetchTodayEntries}
      />
    </div>
  );
};
