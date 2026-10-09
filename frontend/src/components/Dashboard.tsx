import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TodayEntriesResponse, MealType } from '../types';
import { entriesApi } from '../services/api';
import { MacroRing } from './MacroRing';
import { AiMealLogger } from './AiMealLogger';
import { MealCard } from './MealCard';
import { ManualFoodModal } from './ManualFoodModal';
import { Activity, RefreshCw } from 'lucide-react';

interface DashboardProps {
  refreshKey?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ refreshKey }) => {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState<TodayEntriesResponse | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedMealForManual, setSelectedMealForManual] = useState<MealType>('LUNCH');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchToday = async () => {
    try {
      const data = await entriesApi.getToday();
      setTodayData(data);
    } catch (err) {
      console.error('Failed to load today data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, [refreshKey]);

  const targetCalories = user?.targetCalories || 2000;
  const targetProtein = user?.targetProteinG || 120;
  // Standard healthy macro ratios for Indian fitness diets:
  // Carbs: ~50% of calories (4 kcal/g), Fat: ~25% of calories (9 kcal/g)
  const targetCarbs = Math.round((targetCalories * 0.5) / 4);
  const targetFat = Math.round((targetCalories * 0.25) / 9);

  const consumedCalories = todayData?.totalCalories || 0;
  const consumedProtein = Number(todayData?.totalProtein) || 0;
  const consumedCarbs = Number(todayData?.totalCarbs) || 0;
  const consumedFat = Number(todayData?.totalFat) || 0;

  const handleOpenManual = (mealType: MealType) => {
    setSelectedMealForManual(mealType);
    setManualModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Namaste, <span className="text-emerald-400">{user?.fullName || 'Lifter'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track Indian portions effortlessly. Let AI do the nutrient math for you.
          </p>
        </div>

        <button
          onClick={fetchToday}
          title="Refresh Today's Data"
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* TOP: 4 Circular Progress Bars (Calories, Protein, Carbs, Fats) */}
      <section aria-label="Daily Nutrition Goals">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Daily Macro Progress
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Goal: <strong className="text-emerald-400">{targetCalories} kcal</strong> •{' '}
            <strong className="text-blue-400">{targetProtein}g protein</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <MacroRing
            label="Calories"
            consumed={consumedCalories}
            target={targetCalories}
            unit="kcal"
            color="emerald"
            subLabel="Mifflin-St Jeor TDEE"
          />
          <MacroRing
            label="Protein"
            consumed={consumedProtein}
            target={targetProtein}
            unit="g"
            color="blue"
            subLabel="1.8g / kg target"
          />
          <MacroRing
            label="Carbohydrates"
            consumed={consumedCarbs}
            target={targetCarbs}
            unit="g"
            color="amber"
            subLabel="Energy source"
          />
          <MacroRing
            label="Fats"
            consumed={consumedFat}
            target={targetFat}
            unit="g"
            color="rose"
            subLabel="Healthy fats"
          />
        </div>
      </section>

      {/* MIDDLE: Large text area: "What did you eat?" with dropdown for Meal Type and "Analyze with AI" button */}
      <section aria-label="AI Meal Logger">
        <AiMealLogger
          onEntriesAdded={fetchToday}
          onOpenManualModal={handleOpenManual}
        />
      </section>

      {/* BOTTOM: List of today's logged meals, grouped by Breakfast/Lunch/Dinner/Snack */}
      <section aria-label="Today's Logged Meals">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-base font-bold text-white tracking-tight">Today's Meals</h2>
          <span className="text-xs text-slate-400">
            {todayData?.entries?.length || 0} items logged today
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MealCard
            mealType="BREAKFAST"
            title="Breakfast"
            entries={todayData?.groupedByMeal?.BREAKFAST || []}
            onEntryDeleted={fetchToday}
            onOpenManualModal={handleOpenManual}
          />
          <MealCard
            mealType="LUNCH"
            title="Lunch"
            entries={todayData?.groupedByMeal?.LUNCH || []}
            onEntryDeleted={fetchToday}
            onOpenManualModal={handleOpenManual}
          />
          <MealCard
            mealType="DINNER"
            title="Dinner"
            entries={todayData?.groupedByMeal?.DINNER || []}
            onEntryDeleted={fetchToday}
            onOpenManualModal={handleOpenManual}
          />
          <MealCard
            mealType="SNACK"
            title="Snacks & Beverages"
            entries={todayData?.groupedByMeal?.SNACK || []}
            onEntryDeleted={fetchToday}
            onOpenManualModal={handleOpenManual}
          />
        </div>
      </section>

      {/* Manual Food Entry Modal */}
      <ManualFoodModal
        isOpen={manualModalOpen}
        initialMealType={selectedMealForManual}
        onClose={() => setManualModalOpen(false)}
        onEntryAdded={fetchToday}
      />
    </div>
  );
};
