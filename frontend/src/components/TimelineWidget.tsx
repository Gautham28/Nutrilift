import React from 'react';
import { FoodEntry, MealType } from '../types';
import { Sunrise, Sun, Moon, Apple, Plus, ChevronRight } from 'lucide-react';

interface TimelineWidgetProps {
  entries: FoodEntry[];
  selectedDate: Date;
  onSelectEntry: (entry: FoodEntry) => void;
  onQuickAddMeal: (mealType: MealType) => void;
}

export const TimelineWidget: React.FC<TimelineWidgetProps> = ({
  entries,
  selectedDate,
  onSelectEntry,
  onQuickAddMeal,
}) => {
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const mealSlots: {
    mealType: MealType;
    time: string;
    label: string;
    icon: any;
    color: string;
  }[] = [
    {
      mealType: 'BREAKFAST',
      time: '08:00',
      label: 'Breakfast',
      icon: Sunrise,
      color: 'bg-[#FFD4DF] text-[#7A1F38]',
    },
    {
      mealType: 'LUNCH',
      time: '13:00',
      label: 'Lunch',
      icon: Sun,
      color: 'bg-[#D1E3FC] text-[#1E3B68]',
    },
    {
      mealType: 'SNACK',
      time: '16:30',
      label: 'Snacks',
      icon: Apple,
      color: 'bg-[#FEECA8] text-[#5C450C]',
    },
    {
      mealType: 'DINNER',
      time: '20:30',
      label: 'Dinner',
      icon: Moon,
      color: 'bg-[#D7E8BC] text-[#345115]',
    },
  ];

  return (
    <div className="bg-[#FAF7F0] p-4 sm:p-5 rounded-3xl border border-[#ECE5D6]">
      {/* Date Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ECE5D6] mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#938C7D]">
            Time
          </span>
          <span className="text-xs font-extrabold text-[#1E1E24]">
            {formattedDate} Meals Timeline
          </span>
        </div>
        <span className="text-[10px] font-semibold text-[#736D60]">
          {entries.length} items logged
        </span>
      </div>

      {/* Timeline Slots */}
      <div className="space-y-3 relative">
        {/* Dotted vertical line */}
        <div className="absolute top-2 bottom-3 left-[34px] w-px border-l border-dashed border-[#D5CDBC]" />

        {mealSlots.map((slot) => {
          const mealEntries = entries.filter((e) => e.mealType === slot.mealType);
          const totalCalories = mealEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
          const totalProtein = mealEntries.reduce((sum, e) => sum + (Number(e.proteinG) || 0), 0);
          const Icon = slot.icon;

          return (
            <div key={slot.mealType} className="flex items-start space-x-2.5 relative z-10">
              {/* Time */}
              <span className="text-[10px] font-mono font-bold text-[#7A7465] w-8 shrink-0 pt-1.5 text-right">
                {slot.time}
              </span>

              {/* Slot Card */}
              <div className="flex-1 bg-white hover:bg-[#FFFDF7] p-2.5 rounded-2xl border border-[#ECE5D6] shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${slot.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1E1E24] leading-tight">
                        {slot.label}
                      </p>
                      <p className="text-[10px] text-[#8C8677] truncate">
                        {mealEntries.length > 0
                          ? mealEntries.map((e) => e.foodName).join(', ')
                          : 'Nothing logged yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {totalCalories > 0 ? (
                      <span className="text-[10px] font-bold text-[#1E1E24] bg-[#F7F2E7] px-2 py-0.5 rounded-full">
                        {totalCalories} kcal
                      </span>
                    ) : (
                      <button
                        onClick={() => onQuickAddMeal(slot.mealType)}
                        className="text-[10px] font-bold text-[#944458] hover:text-[#1E1E24] p-1 flex items-center space-x-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub details when items exist */}
                {mealEntries.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-[#F7F2E7] flex items-center justify-between text-[10px]">
                    <span className="text-[#3A5D8A] font-semibold">
                      Protein: <strong>{totalProtein.toFixed(1)}g</strong>
                    </span>
                    <button
                      onClick={() => onSelectEntry(mealEntries[0])}
                      className="text-[#8F887A] hover:text-[#1E1E24] flex items-center space-x-0.5 font-medium"
                    >
                      <span>View items</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
