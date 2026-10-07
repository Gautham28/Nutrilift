import React, { useState } from 'react';
import { MealType, FoodItem } from '../types';
import { entriesApi } from '../services/api';
import { Sparkles, Plus, Check, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface AiMealLoggerProps {
  onEntriesAdded: () => void;
  onOpenManualModal: (mealType: MealType) => void;
}

const mealPresets = [
  { label: '2 Rotis & Dal', text: '2 rotis with 1 bowl dal tadka and cucumber salad', type: 'LUNCH' as MealType },
  { label: 'Idli & Sambar', text: '3 idlis with 1 bowl sambar and 2 tbsp coconut chutney', type: 'BREAKFAST' as MealType },
  { label: 'Chicken Biryani', text: '1 plate chicken biryani with 1 bowl cucumber raita', type: 'DINNER' as MealType },
  { label: 'Paneer Bhurji', text: '1 bowl paneer bhurji with 2 parathas', type: 'LUNCH' as MealType },
  { label: 'Chai & Biscuits', text: '1 cup masala chai with milk and 2 Marie biscuits', type: 'SNACK' as MealType },
];

export const AiMealLogger: React.FC<AiMealLoggerProps> = ({ onEntriesAdded, onOpenManualModal }) => {
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [rawText, setRawText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<FoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      setError('Please enter what you ate.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setAnalyzing(true);

    try {
      const items = await entriesApi.parseWithAi(rawText, mealType);
      setParsedItems(items);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (!err.response || err.message === 'Network Error'
          ? 'Cannot reach backend server. Please ensure the Spring Boot backend is running on port 8080.'
          : 'AI could not parse the meal. Please try rephrasing or use manual entry.');
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleItemChange = (index: number, field: keyof FoodItem, value: any) => {
    setParsedItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveToLog = async () => {
    if (parsedItems.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      await entriesApi.createEntries(today, mealType, parsedItems);
      setSuccessMsg(`Logged ${parsedItems.length} item(s) to ${mealType.toLowerCase()}!`);
      setParsedItems([]);
      setRawText('');
      onEntriesAdded();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save food entries.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-slate-700/60 shadow-xl relative overflow-hidden">
      {/* Subtle top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Log a Meal with AI</h2>
            <p className="text-xs text-slate-400">Describe what you ate in natural language (Indian portions supported)</p>
          </div>
        </div>

        {/* Meal Type Selector & Manual Entry button */}
        <div className="flex items-center space-x-2">
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="bg-dark-800 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="BREAKFAST">🌅 Breakfast</option>
            <option value="LUNCH">☀️ Lunch</option>
            <option value="DINNER">🌙 Dinner</option>
            <option value="SNACK">🍎 Snack</option>
          </select>

          <button
            onClick={() => onOpenManualModal(mealType)}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Manual</span>
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={3}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="What did you eat? (e.g. 2 rotis with 1 bowl dal tadka, 1 bowl rice, and salad)"
          className="w-full bg-dark-850/90 text-slate-100 text-sm rounded-xl p-4 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-500 resize-none font-normal"
        />

        {/* Action Bar inside/below */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {/* Quick presets */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Quick tries:</span>
            {mealPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRawText(preset.text);
                  setMealType(preset.type);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !rawText.trim()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-dark-900 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-dark-900" />
                <span>Analyzing Indian Diet...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-dark-900" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Parsed AI Results Preview & Confirmation */}
      {parsedItems.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Parsed {parsedItems.length} Food Item(s)
              </span>
              <span className="text-[11px] text-slate-400">(Review and edit before saving)</span>
            </div>
            <span className="text-xs font-semibold text-slate-300">
              Total:{' '}
              <strong className="text-emerald-400 font-bold">
                {parsedItems.reduce((acc, cur) => acc + (Number(cur.calories) || 0), 0)} kcal
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {parsedItems.map((item, index) => (
              <div
                key={index}
                className="bg-dark-800/90 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between space-y-2 relative group hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <input
                    type="text"
                    value={item.foodName}
                    onChange={(e) => handleItemChange(index, 'foodName', e.target.value)}
                    className="bg-transparent text-sm font-semibold text-white focus:bg-dark-700 px-1 py-0.5 rounded outline-none w-full mr-2"
                  />
                  <button
                    onClick={() => handleRemoveItem(index)}
                    title="Remove item"
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Portion:</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <input
                        type="number"
                        step="0.5"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-14 bg-dark-700 px-1.5 py-0.5 rounded text-white text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-16 bg-dark-700 px-1.5 py-0.5 rounded text-slate-300 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Calories:</span>
                    <div className="flex items-center mt-0.5">
                      <input
                        type="number"
                        value={item.calories}
                        onChange={(e) => handleItemChange(index, 'calories', parseInt(e.target.value) || 0)}
                        className="w-20 bg-dark-700 px-1.5 py-0.5 rounded text-emerald-400 font-bold text-xs outline-none"
                      />
                      <span className="text-[11px] text-slate-400 ml-1">kcal</span>
                    </div>
                  </div>
                </div>

                {/* Macros breakdown */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-700/60 font-medium">
                  <span className="text-blue-400">P: {item.proteinG}g</span>
                  <span className="text-amber-400">C: {item.carbsG}g</span>
                  <span className="text-pink-400">F: {item.fatG}g</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setParsedItems([])}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSaveToLog}
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-dark-900 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-dark-900" /> : <Check className="w-4 h-4" />}
              <span>Confirm & Log to {mealType}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
