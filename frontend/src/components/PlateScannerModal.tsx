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
        calories: 120,
        proteinG: 5,
        carbsG: 15,
        fatG: 4,
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

  const mealOptions: { type: MealType; label: string; icon: any }[] = [
    { type: 'BREAKFAST', label: 'Breakfast', icon: Sunrise },
    { type: 'LUNCH', label: 'Lunch', icon: Sun },
    { type: 'SNACK', label: 'Snacks', icon: Apple },
    { type: 'DINNER', label: 'Dinner', icon: Moon },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-[#E8E2D2] rounded-[28px] sm:rounded-[32px] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans text-[#1E1E24]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-7 py-5 border-b border-[#ECE5D6] shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFAEBF] flex items-center justify-center text-[#1E1E24] shadow-sm shrink-0">
              <Camera className="w-5 h-5 text-[#1E1E24]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#1E1E24]">
                  AI Plate Scanner
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FF358B]/10 text-[#FF358B] border border-[#FF358B]/20 flex items-center">
                  <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-[#7A7363] mt-0.5 font-medium">
                Snap or upload your meal plate for instant Indian calorie & macro recognition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7A7363] hover:text-[#1E1E24] hover:bg-[#FAF7F0] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Meal Slot Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8677]">
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
                    className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#1E1E24] text-white shadow-sm'
                        : 'bg-[#FAF7F0] text-[#666052] hover:text-[#1E1E24] hover:bg-[#F2ECE0] border border-[#ECE5D6]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Upload Screen */}
          {!scanResult ? (
            <div className="space-y-4">
              {/* Photo Upload Zone */}
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
                      ? 'border-[#9E4D61] bg-[#FF358B]/5 scale-[0.99]'
                      : 'border-[#DCD5C5] hover:border-[#9E4D61] bg-[#FAF7F0]'
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

                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2DBD0] flex items-center justify-center text-[#9E4D61] mb-3 shadow-xs">
                    <Camera className="w-7 h-7" />
                  </div>

                  <h3 className="text-sm font-extrabold text-[#1E1E24] mb-1">
                    Drag and drop your food photo here
                  </h3>
                  <p className="text-xs text-[#7A7363] max-w-sm mb-4 font-medium">
                    Supports JPG, PNG, or WebP. Take a photo directly from your plate or select from your gallery.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE0] border border-[#E2DBD0] text-[#1E1E24] text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#7A7363]" />
                      <span>Browse Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-full bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#FFAEBF]" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Image Preview Container */
                <div className="bg-[#FAF7F0] rounded-3xl border border-[#ECE5D6] p-4 space-y-3">
                  <div className="relative rounded-2xl overflow-hidden max-h-60 flex items-center justify-center bg-black/5 border border-[#E2DBD0]">
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
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black text-white text-xs transition-colors backdrop-blur-sm shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Optional notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#7A7363] flex items-center space-x-1">
                      <span>Optional Preparation Notes</span>
                      <span className="text-[10px] text-[#A09886]">(e.g. homemade, low oil, cooked in ghee)</span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Yellow moong dal with 1 tsp ghee, 2 rotis without butter..."
                      className="w-full bg-white border border-[#E2DBD0] rounded-xl px-3.5 py-2 text-xs font-medium text-[#1E1E24] placeholder:text-[#A09886] focus:outline-none focus:ring-2 focus:ring-[#1E1E24]/10 focus:border-[#1E1E24] shadow-xs transition-colors"
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
                    className="flex-1 px-4 py-2.5 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] text-[#1E1E24] border border-[#E2DBD0] text-xs font-bold transition-colors text-center"
                  >
                    Choose Different Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="flex-1 px-5 py-2.5 rounded-full bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFAEBF]" />
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
                        <Sparkles className="w-4 h-4 text-[#FFAEBF]" />
                        <span>Analyze Plate with AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results & Review Screen */
            <div className="space-y-5 animate-in fade-in">
              {/* Macro Bento Cards (Matching NutriLift Signature Palette) */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {/* Calories (Warm Yellow) */}
                <div className="bg-[#FDE382] border border-[#ECCF69] p-3 rounded-2xl text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#63552D] block mb-0.5">
                    Calories
                  </span>
                  <span className="text-base sm:text-xl font-black text-[#1E1E24]">
                    {totalCalories}
                  </span>
                  <span className="text-[10px] text-[#63552D] font-bold block">kcal</span>
                </div>

                {/* Protein (Soft Rose) */}
                <div className="bg-[#FFC4D2] border border-[#FFAEBF] p-3 rounded-2xl text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#7A3648] block mb-0.5">
                    Protein
                  </span>
                  <span className="text-base sm:text-xl font-black text-[#421722]">
                    {totalProtein.toFixed(1)}g
                  </span>
                  <span className="text-[10px] text-[#7A3648] font-bold block">protein</span>
                </div>

                {/* Carbs (Soft Green) */}
                <div className="bg-[#C6E2B5] border border-[#B1D49C] p-3 rounded-2xl text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#365922] block mb-0.5">
                    Carbs
                  </span>
                  <span className="text-base sm:text-xl font-black text-[#223B12]">
                    {totalCarbs.toFixed(1)}g
                  </span>
                  <span className="text-[10px] text-[#365922] font-bold block">carbs</span>
                </div>

                {/* Fats (Soft Blue) */}
                <div className="bg-[#BBD5F8] border border-[#A2C4F2] p-3 rounded-2xl text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#324B74] block mb-0.5">
                    Fats
                  </span>
                  <span className="text-base sm:text-xl font-black text-[#182C4E]">
                    {totalFat.toFixed(1)}g
                  </span>
                  <span className="text-[10px] text-[#324B74] font-bold block">fats</span>
                </div>
              </div>

              {/* Gemini Vision Visual Insight */}
              {scanResult.visualAnalysis && (
                <div className="bg-[#FFF5F7] border border-[#FFD0DB] rounded-2xl p-3.5 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#9E4D61] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#591C2C] leading-relaxed">
                    <span className="font-extrabold text-[#1E1E24] block mb-0.5">Gemini Vision Analysis:</span>
                    {scanResult.visualAnalysis}
                  </div>
                </div>
              )}

              {/* Detected Items Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#8C8677] uppercase tracking-wider">
                    Detected Items ({editableItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#9E4D61] hover:text-[#7A1F38] flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editableItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FAF7F0] border border-[#ECE5D6] rounded-2xl p-3 flex items-center justify-between space-x-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.foodName}
                          onChange={(e) => handleItemChange(idx, 'foodName', e.target.value)}
                          className="bg-transparent font-extrabold text-[#1E1E24] text-xs w-full focus:outline-none focus:underline"
                        />
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-[#7A7363]">
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          <span>•</span>
                          <span className="text-[#875D0D] font-bold">{item.calories} kcal</span>
                          <span>•</span>
                          <span className="text-[#9E4D61] font-bold">{item.proteinG}g P</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="w-18">
                          <input
                            type="number"
                            min="0"
                            value={item.calories}
                            onChange={(e) =>
                              handleItemChange(idx, 'calories', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-[#E2DBD0] rounded-xl px-2 py-1 text-[11px] text-right font-bold text-[#1E1E24] focus:outline-none focus:border-[#1E1E24]"
                            title="Calories"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-lg text-[#A09886] hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
                  className="px-4 py-2.5 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] text-[#1E1E24] border border-[#E2DBD0] text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rescan</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToDashboard}
                  disabled={isSaving || editableItems.length === 0}
                  className="flex-1 px-5 py-2.5 rounded-full bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFAEBF]" />
                      <span>Logging to Today...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#FFAEBF]" />
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
