import React, { useState } from 'react';
import { MealType, FoodItem } from '../types';
import { entriesApi } from '../services/api';
import { X, Utensils, Check, Loader2, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[28px] p-6 sm:p-7 border border-[#E8E2D2] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#7A7363] hover:text-[#1E1E24] hover:bg-[#FAF7F0] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-[#FFAEBF] text-[#1E1E24] shadow-sm">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-[#1E1E24] tracking-tight">Manual Food Entry</h3>
              {isCustomDate && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F0] border border-[#E2DBD0] text-[#7A7363] font-bold">
                  {formattedDate}
                </span>
              )}
            </div>
            <p className="text-xs text-[#7A7363]">Log custom food and macro values directly</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Meal</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3 py-2.5 text-xs text-[#1E1E24] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all cursor-pointer"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Food Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Masala Dosa"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] placeholder-[#A09886] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Portion Quantity</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Serving Unit</label>
              <input
                type="text"
                placeholder="e.g. piece, bowl, g"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] placeholder-[#A09886] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="bg-[#FDE382] p-2.5 rounded-xl border border-[#ECCF69]/50">
              <label className="block text-[10px] font-extrabold uppercase text-[#63552D] mb-0.5">Calories</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                className="w-full bg-white/80 border border-[#ECCF69] rounded-lg px-2 py-1 text-xs text-[#1E1E24] font-bold outline-none"
              />
            </div>
            <div className="bg-[#FFC4D2] p-2.5 rounded-xl border border-[#FFAEBF]/50">
              <label className="block text-[10px] font-extrabold uppercase text-[#7A3648] mb-0.5">Protein (g)</label>
              <input
                type="number"
                step="0.5"
                value={proteinG}
                onChange={(e) => setProteinG(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/80 border border-[#FFAEBF] rounded-lg px-2 py-1 text-xs text-[#1E1E24] font-bold outline-none"
              />
            </div>
            <div className="bg-[#ABC480] p-2.5 rounded-xl border border-[#97B368]/50">
              <label className="block text-[10px] font-extrabold uppercase text-[#3D5321] mb-0.5">Carbs (g)</label>
              <input
                type="number"
                step="0.5"
                value={carbsG}
                onChange={(e) => setCarbsG(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/80 border border-[#97B368] rounded-lg px-2 py-1 text-xs text-[#1E1E24] font-bold outline-none"
              />
            </div>
            <div className="bg-[#D1E3FC] p-2.5 rounded-xl border border-[#B5D0F6]/50">
              <label className="block text-[10px] font-extrabold uppercase text-[#1E3B68] mb-0.5">Fat (g)</label>
              <input
                type="number"
                step="0.5"
                value={fatG}
                onChange={(e) => setFatG(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/80 border border-[#B5D0F6] rounded-lg px-2 py-1 text-xs text-[#1E1E24] font-bold outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#7A7363] hover:text-[#1E1E24] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-extrabold text-xs bg-[#1E1E24] hover:bg-[#2F2F38] text-white shadow-md disabled:opacity-50 transition-all active:scale-95"
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
