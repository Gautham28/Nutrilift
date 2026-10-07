import React, { useState } from 'react';
import { MealType, FoodItem } from '../types';
import { entriesApi } from '../services/api';
import { X, Utensils, Check, Loader2 } from 'lucide-react';

interface ManualFoodModalProps {
  isOpen: boolean;
  initialMealType: MealType;
  targetDate?: string;
  onClose: () => void;
  onEntryAdded: () => void;
}

export const ManualFoodModal: React.FC<ManualFoodModalProps> = ({
  isOpen,
  initialMealType,
  targetDate,
  onClose,
  onEntryAdded,
}) => {
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('piece');
  const [calories, setCalories] = useState<number>(150);
  const [proteinG, setProteinG] = useState<number>(5);
  const [carbsG, setCarbsG] = useState<number>(20);
  const [fatG, setFatG] = useState<number>(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initialMealType if changed
  React.useEffect(() => {
    if (isOpen) {
      setMealType(initialMealType);
      setError(null);
    }
  }, [isOpen, initialMealType]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeDate = targetDate || todayStr;
  const isCustomDate = activeDate !== todayStr;
  const formattedDate = new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setError('Food name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const item: FoodItem = {
      foodName: foodName.trim(),
      quantity,
      unit,
      calories,
      proteinG,
      carbsG,
      fatG,
      isAiParsed: false,
    };

    try {
      await entriesApi.createEntries(activeDate, mealType, [item]);
      onEntryAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save food entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Manual Food Entry</h3>
              {isCustomDate && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  {formattedDate}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Log custom food and macro values directly</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Meal</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Food Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Masala Dosa"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Portion Quantity</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Serving Unit</label>
              <input
                type="text"
                placeholder="e.g. piece, bowl, g"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-semibold text-emerald-400 mb-1">Calories</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                className="w-full bg-dark-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-blue-400 mb-1">Protein (g)</label>
              <input
                type="number"
                step="0.5"
                value={proteinG}
                onChange={(e) => setProteinG(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-blue-300 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-amber-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.5"
                value={carbsG}
                onChange={(e) => setCarbsG(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-pink-400 mb-1">Fat (g)</label>
              <input
                type="number"
                step="0.5"
                value={fatG}
                onChange={(e) => setFatG(parseFloat(e.target.value) || 0)}
                className="w-full bg-dark-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-pink-300 font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-dark-900 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Log Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
