import React, { useState } from 'react';
import { FoodEntry, MealType } from '../types';
import { entriesApi } from '../services/api';
import { Trash2, Sparkles, Plus, Utensils, Sunrise, Sun, Moon, Apple } from 'lucide-react';

interface MealCardProps {
  mealType: MealType;
  title: string;
  entries: FoodEntry[];
  onEntryDeleted: () => void;
  onOpenManualModal: (mealType: MealType) => void;
}

const mealIcons: Record<MealType, React.ReactNode> = {
  BREAKFAST: <Sunrise className="w-4 h-4 text-amber-400" />,
  LUNCH: <Sun className="w-4 h-4 text-yellow-400" />,
  DINNER: <Moon className="w-4 h-4 text-indigo-400" />,
  SNACK: <Apple className="w-4 h-4 text-rose-400" />,
};

export const MealCard: React.FC<MealCardProps> = ({
  mealType,
  title,
  entries = [],
  onEntryDeleted,
  onOpenManualModal,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalCalories = entries.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalProtein = entries.reduce((acc, curr) => acc + (Number(curr.proteinG) || 0), 0);
  const totalCarbs = entries.reduce((acc, curr) => acc + (Number(curr.carbsG) || 0), 0);
  const totalFat = entries.reduce((acc, curr) => acc + (Number(curr.fatG) || 0), 0);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await entriesApi.deleteEntry(id);
      onEntryDeleted();
    } catch (err) {
      console.error('Failed to delete entry', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 transition-all hover:border-slate-700/80">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-dark-800 border border-slate-700/70">
            {mealIcons[mealType]}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-400">
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-sm font-extrabold text-emerald-400">{totalCalories}</span>
            <span className="text-[10px] text-slate-400 ml-1">kcal</span>
          </div>

          <button
            onClick={() => onOpenManualModal(mealType)}
            title={`Add food to ${title}`}
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-emerald-300 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Macro sub-summary when items exist */}
      {entries.length > 0 && (
        <div className="flex items-center space-x-3 py-2 text-[11px] text-slate-400 border-b border-slate-800/60 font-medium">
          <span className="text-blue-400">P: {totalProtein.toFixed(1)}g</span>
          <span className="text-amber-400">C: {totalCarbs.toFixed(1)}g</span>
          <span className="text-pink-400">F: {totalFat.toFixed(1)}g</span>
        </div>
      )}

      {/* Items list */}
      <div className="mt-3 divide-y divide-slate-800/40">
        {entries.length === 0 ? (
          <div className="py-5 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-1">
            <Utensils className="w-5 h-5 opacity-40 mb-1" />
            <span>No items logged yet</span>
            <button
              onClick={() => onOpenManualModal(mealType)}
              className="text-[11px] text-emerald-400 hover:underline pt-1"
            >
              + Add food
            </button>
          </div>
        ) : (
          entries.map((item) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between group hover:bg-slate-800/20 px-1 rounded-lg transition-colors"
            >
              <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                {item.isAiParsed && (
                  <span
                    title="Parsed by AI"
                    className="mt-0.5 p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                )}
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{item.foodName}</p>
                  <p className="text-[11px] text-slate-400">
                    {item.quantity} {item.unit} •{' '}
                    <span className="text-blue-400/90">P {item.proteinG}g</span> •{' '}
                    <span className="text-amber-400/90">C {item.carbsG}g</span> •{' '}
                    <span className="text-pink-400/90">F {item.fatG}g</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-xs font-bold text-slate-200">
                  {item.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity disabled:opacity-50"
                  title="Delete item"
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
};
