import React from 'react';
import { Search, Sliders, Flame } from 'lucide-react';
import { MealType } from '../types';

interface HeaderBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedMealType: MealType;
  setSelectedMealType: (m: MealType) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  onOpenTargetModal: () => void;
  userName?: string;
  targetCalories?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedMealType,
  setSelectedMealType,
  onSearchSubmit,
  onOpenTargetModal,
  userName = 'Lifter',
  targetCalories = 2000,
}) => {
  const mealOptions: { id: MealType; label: string }[] = [
    { id: 'BREAKFAST', label: 'Breakfast' },
    { id: 'LUNCH', label: 'Lunch' },
    { id: 'DINNER', label: 'Dinner' },
    { id: 'SNACK', label: 'Snack' },
  ];

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      {/* Quick Search & Calculate Bar */}
      <form
        onSubmit={onSearchSubmit}
        className="flex-1 bg-[#F6F2E8] border border-[#E4DDD0] rounded-full px-2.5 py-1.5 flex items-center space-x-2 shadow-inner"
      >
        <button
          type="submit"
          title="Calculate nutrients"
          className="w-8 h-8 rounded-full bg-[#FFAEBF] hover:bg-[#ff9cb1] flex items-center justify-center text-[#1E1E24] shrink-0 transition-transform active:scale-95 shadow-sm"
        >
          <Search className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Calculate any food (e.g. 2 rotis with dal, 100g paneer, 2 eggs)..."
          className="bg-transparent flex-1 text-xs sm:text-sm font-medium text-[#1E1E24] placeholder:text-[#8D8878] outline-none px-1"
        />

        {/* Meal filter pills */}
        <div className="hidden md:flex items-center space-x-1 shrink-0 text-[11px] text-[#7A7465]">
          <span className="font-bold text-[#5B5547] mr-1">Meal:</span>
          {mealOptions.map((opt) => {
            const isActive = selectedMealType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedMealType(opt.id)}
                className={`px-2.5 py-0.5 rounded-full font-semibold transition-all text-[11px] ${
                  isActive
                    ? 'bg-[#1E1E24] text-white shadow-sm'
                    : 'bg-[#ECE5D6] text-[#554F42] hover:bg-[#E2DAC8]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </form>

      {/* Target & Profile Quick Info */}
      <div className="flex items-center justify-end space-x-2 shrink-0">
        <button
          onClick={onOpenTargetModal}
          title="Adjust TDEE Goal"
          className="flex items-center space-x-1.5 bg-[#FAF7F0] hover:bg-[#F2ECE0] border border-[#E4DDD0] px-3 py-1.5 rounded-full text-xs font-bold text-[#1E1E24] transition-colors"
        >
          <Flame className="w-3.5 h-3.5 text-[#E06D53]" />
          <span>{targetCalories} kcal goal</span>
          <Sliders className="w-3 h-3 text-[#777063] ml-0.5" />
        </button>

        <div
          title={userName}
          className="w-9 h-9 rounded-full bg-[#1E1E24] text-white font-bold text-xs flex items-center justify-center shadow-sm"
        >
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
