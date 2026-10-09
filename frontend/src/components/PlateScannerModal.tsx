import React, { useState, useRef } from 'react';
import { MealType, FoodItem, PlateScanResponse } from '../types';
import { entriesApi } from '../services/api';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Sunrise,
  Sun,
  Apple,
  Moon,
  RotateCcw,
  Utensils,
  ChevronRight,
  Info,
} from 'lucide-react';

interface PlateScannerModalProps {
  isOpen: boolean;
  initialMealType?: MealType;
  onClose: () => void;
  onMealLogged: () => void;
}

export const PlateScannerModal: React.FC<PlateScannerModalProps> = ({
  isOpen,
  initialMealType = 'LUNCH',
  onClose,
  onMealLogged,
}) => {
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Analysis states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [scanResult, setScanResult] = useState<PlateScanResponse | null>(null);
  const [editableItems, setEditableItems] = useState<FoodItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMealType(initialMealType);
      resetState();
    }
  }, [isOpen, initialMealType]);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setNotes('');
    setIsScanning(false);
    setError(null);
    setScanResult(null);
    setEditableItems([]);
    setIsSaving(false);
  };

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartScan = async () => {
    if (!selectedFile) {
      setError('Please upload or snap a photo of your plate first.');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanStep(1);

    const stepTimer1 = setTimeout(() => setScanStep(2), 1200);
    const stepTimer2 = setTimeout(() => setScanStep(3), 2500);

    try {
      const result = await entriesApi.scanPlate(selectedFile, mealType, notes);
      setScanResult(result);
      setEditableItems(result.items || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to analyze plate. Please try another photo.';
      setError(msg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsScanning(false);
      setScanStep(0);
    }
  };

  // Item adjustments
  const handleItemChange = (index: number, field: keyof FoodItem, value: any) => {
    const updated = [...editableItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditableItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setEditableItems(editableItems.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setEditableItems([
      ...editableItems,
      {
        foodName: 'New Item',
        quantity: 1,
        unit: 'serving',
        calories: 100,
        proteinG: 5,
        carbsG: 12,
        fatG: 3,
        isAiParsed: true,
      },
    ]);
  };

  // Calculate dynamic totals
  const totalCalories = editableItems.reduce((acc, it) => acc + (Number(it.calories) || 0), 0);
  const totalProtein = editableItems.reduce((acc, it) => acc + (Number(it.proteinG) || 0), 0);
  const totalCarbs = editableItems.reduce((acc, it) => acc + (Number(it.carbsG) || 0), 0);
  const totalFat = editableItems.reduce((acc, it) => acc + (Number(it.fatG) || 0), 0);

  const handleSaveToDashboard = async () => {
    if (editableItems.length === 0) {
      setError('Please have at least one food item before logging.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await entriesApi.createEntries(todayStr, mealType, editableItems);
      onMealLogged();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save entries to dashboard.');
    } finally {
      setIsSaving(false);
    }
  };

  const mealOptions: { type: MealType; label: string; icon: any; color: string }[] = [
    { type: 'BREAKFAST', label: 'Breakfast', icon: Sunrise, color: 'text-rose-400' },
    { type: 'LUNCH', label: 'Lunch', icon: Sun, color: 'text-amber-400' },
    { type: 'SNACK', label: 'Snacks', icon: Apple, color: 'text-emerald-400' },
    { type: 'DINNER', label: 'Dinner', icon: Moon, color: 'text-sky-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#141418] border border-[#272730] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#24242D] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FFAEBF] flex items-center justify-center text-[#141418] shadow-sm">
              <Camera className="w-5 h-5 text-[#141418]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Multimodal Plate Scanner
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFAEBF]/15 text-[#FFAEBF] border border-[#FFAEBF]/30 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-[#8E8E9A]">
                Snap or upload your meal plate for instant Indian calorie & macro recognition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#202028] text-[#8E8E9A] hover:text-white hover:bg-[#2C2C36] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Meal Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#A0A0AB] uppercase tracking-wider">
              Meal Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mealOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = mealType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setMealType(opt.type)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#FFAEBF] text-[#141418] shadow-sm font-extrabold'
                        : 'bg-[#1C1C24] text-[#A0A0AB] hover:text-white hover:bg-[#242430] border border-[#272730]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#141418]' : opt.color}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Upload Screen */}
          {!scanResult ? (
            <div className="space-y-4">
              {/* Photo Input Area */}
              {!previewUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-[#FFAEBF] bg-[#FFAEBF]/5 scale-[0.99]'
                      : 'border-[#2D2D38] hover:border-[#FFAEBF]/60 bg-[#1A1A22]'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />

                  <div className="w-14 h-14 rounded-3xl bg-[#242430] border border-[#323242] flex items-center justify-center text-[#FFAEBF] mb-3 shadow-inner">
                    <Camera className="w-7 h-7" />
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">
                    Drag and drop your food photo here
                  </h3>
                  <p className="text-xs text-[#8E8E9A] max-w-sm mb-4">
                    Supports JPG, PNG, or WebP. Take a photo directly from your plate or select from your gallery.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2C2C38] hover:bg-[#383848] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FFAEBF] hover:bg-[#ff9eb2] text-[#141418] text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#141418]" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Image Preview Card */
                <div className="bg-[#1A1A22] rounded-3xl border border-[#272730] p-4 space-y-3">
                  <div className="relative rounded-2xl overflow-hidden max-h-64 flex items-center justify-center bg-black/40 border border-[#2D2D38]">
                    <img
                      src={previewUrl}
                      alt="Plate Preview"
                      className="w-full h-56 object-cover object-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs transition-colors backdrop-blur-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Optional notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#A0A0AB] flex items-center space-x-1">
                      <span>Optional Preparation Notes</span>
                      <span className="text-[10px] text-[#71717A]">(helps AI accuracy)</span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Mom's home cooked yellow dal with 1 tsp ghee, low oil sabzi..."
                      className="w-full bg-[#141418] border border-[#2D2D38] rounded-2xl px-3.5 py-2 text-xs text-white placeholder-[#5A5A66] focus:outline-none focus:border-[#FFAEBF] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {previewUrl && (
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    disabled={isScanning}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-[#1C1C24] hover:bg-[#252530] text-[#A0A0AB] hover:text-white border border-[#272730] text-xs font-bold transition-colors text-center"
                  >
                    Choose Different Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FFAEBF] hover:bg-[#ff9eb2] text-[#141418] text-xs font-black transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#141418]" />
                        <span>
                          {scanStep === 1
                            ? 'Uploading Plate...'
                            : scanStep === 2
                            ? 'Detecting Food Items...'
                            : 'Estimating Portions & Macros...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#141418]" />
                        <span>Analyze Plate with AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results & Review Screen */
            <div className="space-y-5 animate-fadeIn">
              {/* Macro Summary Header */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-[#1C1C24] border border-[#292934] p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-extrabold text-[#F6D878] uppercase block mb-0.5">
                    Calories
                  </span>
                  <span className="text-base sm:text-lg font-black text-white">
                    {totalCalories}
                  </span>
                  <span className="text-[10px] text-[#71717A] block">kcal</span>
                </div>
                <div className="bg-[#1C1C24] border border-[#292934] p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-extrabold text-[#FFAEBF] uppercase block mb-0.5">
                    Protein
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#FFAEBF]">
                    {totalProtein.toFixed(1)}g
                  </span>
                  <span className="text-[10px] text-[#71717A] block">protein</span>
                </div>
                <div className="bg-[#1C1C24] border border-[#292934] p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-extrabold text-[#A8D59D] uppercase block mb-0.5">
                    Carbs
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#A8D59D]">
                    {totalCarbs.toFixed(1)}g
                  </span>
                  <span className="text-[10px] text-[#71717A] block">carbs</span>
                </div>
                <div className="bg-[#1C1C24] border border-[#292934] p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-extrabold text-[#A6C8FF] uppercase block mb-0.5">
                    Fats
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#A6C8FF]">
                    {totalFat.toFixed(1)}g
                  </span>
                  <span className="text-[10px] text-[#71717A] block">fats</span>
                </div>
              </div>

              {/* AI Visual Insight */}
              {scanResult.visualAnalysis && (
                <div className="bg-[#FFAEBF]/10 border border-[#FFAEBF]/20 rounded-2xl p-3.5 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#FFAEBF] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#E1D8CC] leading-relaxed">
                    <span className="font-bold text-white block mb-0.5">Gemini Vision Analysis:</span>
                    {scanResult.visualAnalysis}
                  </div>
                </div>
              )}

              {/* Editable Food Items Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A0A0AB] uppercase tracking-wider">
                    Detected Items ({editableItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] font-bold text-[#FFAEBF] hover:text-[#ff9eb2] flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editableItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1A1A22] border border-[#292934] rounded-2xl p-3 flex items-center justify-between space-x-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.foodName}
                          onChange={(e) => handleItemChange(idx, 'foodName', e.target.value)}
                          className="bg-transparent font-bold text-white text-xs w-full focus:outline-none focus:underline"
                        />
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-[#8E8E9A]">
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          <span>•</span>
                          <span className="text-[#F6D878] font-semibold">{item.calories} kcal</span>
                          <span>•</span>
                          <span className="text-[#FFAEBF] font-semibold">{item.proteinG}g P</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="w-16">
                          <input
                            type="number"
                            min="0"
                            value={item.calories}
                            onChange={(e) =>
                              handleItemChange(idx, 'calories', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-[#141418] border border-[#2E2E3A] rounded-xl px-2 py-1 text-[11px] text-right text-white focus:outline-none focus:border-[#FFAEBF]"
                            title="Calories"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    setEditableItems([]);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[#1C1C24] hover:bg-[#252530] text-[#A0A0AB] hover:text-white border border-[#272730] text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rescan</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToDashboard}
                  disabled={isSaving || editableItems.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FFAEBF] hover:bg-[#ff9eb2] text-[#141418] text-xs font-black transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#141418]" />
                      <span>Logging to Today...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#141418]" />
                      <span>Log {editableItems.length} Items to {mealType}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
