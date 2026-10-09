import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sliders, Check, Flame, Dumbbell, AlertCircle, Sparkles } from 'lucide-react';

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onOpenAiAdvisor?: () => void;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  onOpenAiAdvisor,
}) => {
  const { user, updateUserTargets } = useAuth();

  const [calories, setCalories] = useState<number>(user?.targetCalories || 2000);
  const [protein, setProtein] = useState<number>(user?.targetProteinG || 120);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && user) {
      setCalories(user.targetCalories || 2000);
      setProtein(user.targetProteinG || 120);
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUserTargets(calories, protein);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update targets.');
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

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-[#FFAEBF] text-[#1E1E24] shadow-sm">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1E1E24] tracking-tight">Adjust Daily Targets</h3>
            <p className="text-xs text-[#7A7363]">Customize your daily nutrition targets</p>
          </div>
        </div>

        {/* AI Advisor Quick Launcher */}
        {onOpenAiAdvisor && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-[#141418] to-[#252530] text-white flex items-center justify-between shadow-sm border border-[#343442]">
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF358B] to-[#FFAEBF] flex items-center justify-center text-[#141418] shrink-0">
                <Sparkles className="w-4 h-4 fill-[#141418]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">Not sure what to target?</p>
                <p className="text-[10px] text-[#A0A0AB] truncate">Let AI calculate your calories & protein</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiAdvisor();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#FFAEBF] hover:bg-[#FFC4D2] text-[#141418] text-xs font-black transition-transform active:scale-95 shrink-0 shadow-xs flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#141418]" />
              <span>Ask AI</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Daily Calories Target Slider */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E2DBD0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-xs font-bold text-[#1E1E24]">
                <Flame className="w-4 h-4 text-[#C24161]" />
                <span>Daily Calorie Target</span>
              </span>
              <span className="bg-[#FDE382] text-[#2E2713] font-black px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                {calories} kcal
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="4500"
              step="50"
              value={calories}
              onChange={(e) => setCalories(parseInt(e.target.value) || 2000)}
              className="w-full accent-[#1E1E24] cursor-pointer h-2 bg-[#E6DFD2] rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-semibold text-[#7A7363]">
              <span>1,000 kcal</span>
              <span>2,500 kcal</span>
              <span>4,500 kcal</span>
            </div>
          </div>

          {/* Daily Protein Target Slider */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E2DBD0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-xs font-bold text-[#1E1E24]">
                <Dumbbell className="w-4 h-4 text-[#1E3B68]" />
                <span>Daily Protein Target</span>
              </span>
              <span className="bg-[#FFC4D2] text-[#421722] font-black px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                {protein}g
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="300"
              step="5"
              value={protein}
              onChange={(e) => setProtein(parseInt(e.target.value) || 120)}
              className="w-full accent-[#1E1E24] cursor-pointer h-2 bg-[#E6DFD2] rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-semibold text-[#7A7363]">
              <span>40g</span>
              <span>150g</span>
              <span>300g</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2.5">
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
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Targets'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
