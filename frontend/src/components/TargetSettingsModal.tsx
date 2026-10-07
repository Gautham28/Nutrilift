import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sliders, Check, Flame, Dumbbell } from 'lucide-react';

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Adjust Daily Targets</h3>
            <p className="text-xs text-slate-400">Override your AI Mifflin-St Jeor daily goals</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Calorie Target (kcal)</span>
              </span>
              <span className="text-emerald-400 font-bold">{calories} kcal</span>
            </label>
            <input
              type="range"
              min="1000"
              max="4500"
              step="50"
              value={calories}
              onChange={(e) => setCalories(parseInt(e.target.value) || 2000)}
              className="w-full accent-emerald-500 bg-dark-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1000 kcal</span>
              <span>2500 kcal</span>
              <span>4500 kcal</span>
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                <span>Daily Protein Target (grams)</span>
              </span>
              <span className="text-blue-400 font-bold">{protein}g</span>
            </label>
            <input
              type="range"
              min="40"
              max="300"
              step="5"
              value={protein}
              onChange={(e) => setProtein(parseInt(e.target.value) || 120)}
              className="w-full accent-blue-500 bg-dark-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>40g</span>
              <span>150g</span>
              <span>300g</span>
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
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Targets'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
