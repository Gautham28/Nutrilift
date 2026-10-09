import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../services/api';
import { AiTargetResponse, Gender, ActivityLevel } from '../types';
import {
  X,
  Sparkles,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Zap,
} from 'lucide-react';

interface AiTargetAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTargetsApplied: (calories: number, protein: number) => void;
}

const PRESET_GOALS = [
  { label: '🔥 Lose Belly Fat & Keep Muscle', text: 'I want to burn stubborn belly fat while maintaining my muscle mass. I lift weights 3-4 days a week.' },
  { label: '💪 Lean Muscle Bulk', text: 'I want to build lean muscle size without adding excess body fat. I do regular strength training.' },
  { label: '⚡ Body Recomposition (Tone Up)', text: 'I want to tone up, drop a bit of body fat, and improve muscle definition simultaneously.' },
  { label: '🏃 Athletic Performance & Energy', text: 'I want high daily energy, stamina, and balanced nutrition for an active lifestyle.' },
];

export const AiTargetAdvisorModal: React.FC<AiTargetAdvisorModalProps> = ({
  isOpen,
  onClose,
  onTargetsApplied,
}) => {
  const { user, updateUserTargets } = useAuth();

  // Form State
  const [weightKg, setWeightKg] = useState<number>(user?.weightKg || 70);
  const [heightCm, setHeightCm] = useState<number>(user?.heightCm || 175);
  const [age, setAge] = useState<number>(user?.age || 24);
  const [gender, setGender] = useState<Gender>(user?.gender || 'MALE');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(user?.activityLevel || 'MODERATE');
  const [fitnessGoal, setFitnessGoal] = useState<string>('');

  // Result & UI State
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiTargetResponse | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setWeightKg(user.weightKg || 70);
        setHeightCm(user.heightCm || 175);
        setAge(user.age || 24);
        setGender(user.gender || 'MALE');
        setActivityLevel(user.activityLevel || 'MODERATE');
      }
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fitnessGoal.trim()) {
      setError('Please describe your fitness goal or choose one of the quick options below.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await profileApi.calculateAiTargets({
        weightKg,
        heightCm,
        age,
        gender,
        activityLevel,
        fitnessGoal: fitnessGoal.trim(),
      });

      setAiResult(response);
      setStep('result');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Could not calculate targets. Please verify your inputs and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTargets = async () => {
    if (!aiResult) return;
    setIsApplying(true);
    setError(null);
    try {
      await updateUserTargets(aiResult.targetCalories, aiResult.targetProteinG);
      // Save to guest storage fallback if applicable
      localStorage.setItem('nutrilift_guest_target_calories', String(aiResult.targetCalories));
      localStorage.setItem('nutrilift_guest_target_protein', String(aiResult.targetProteinG));

      onTargetsApplied(aiResult.targetCalories, aiResult.targetProteinG);
      onClose();
      setTimeout(() => setStep('form'), 300);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save new targets.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-white text-[#1E1E24] rounded-[32px] border border-[#E8E2D2] shadow-2xl p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7A7363] hover:text-[#1E1E24] hover:bg-[#FAF7F0] transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FFAEBF] text-[#1E1E24] flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 fill-[#1E1E24]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#1E1E24]">
                AI Target Assistant
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FF358B]/10 text-[#FF358B] border border-[#FF358B]/20">
                Gemini Powered
              </span>
            </div>
            <p className="text-xs text-[#7A7363] mt-0.5 font-medium">
              Personalized daily calorie & macro targets tailored to your goals
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: FORM INPUT */}
        {step === 'form' && (
          <form onSubmit={handleCalculate} className="space-y-4">
            {/* Biometrics Grid */}
            <div className="bg-[#FAF7F0] p-4 sm:p-5 rounded-2xl border border-[#ECE5D6] space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8677]">
                1. Your Biometrics & Activity
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Weight */}
                <div>
                  <label className="text-[10px] font-bold text-[#7A7363] block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 70)}
                    required
                    className="w-full bg-white border border-[#E2DBD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E1E24] focus:outline-none focus:ring-2 focus:ring-[#1E1E24]/10 focus:border-[#1E1E24] shadow-xs"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="text-[10px] font-bold text-[#7A7363] block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value) || 175)}
                    required
                    className="w-full bg-white border border-[#E2DBD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E1E24] focus:outline-none focus:ring-2 focus:ring-[#1E1E24]/10 focus:border-[#1E1E24] shadow-xs"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="text-[10px] font-bold text-[#7A7363] block mb-1">
                    Age (yrs)
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 24)}
                    required
                    className="w-full bg-white border border-[#E2DBD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E1E24] focus:outline-none focus:ring-2 focus:ring-[#1E1E24]/10 focus:border-[#1E1E24] shadow-xs"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="text-[10px] font-bold text-[#7A7363] block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-white border border-[#E2DBD0] rounded-xl px-2 py-2 text-xs font-bold text-[#1E1E24] focus:outline-none focus:ring-2 focus:ring-[#1E1E24]/10 focus:border-[#1E1E24] shadow-xs"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="text-[10px] font-bold text-[#7A7363] block mb-1">
                  Daily Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full bg-white border border-[#E2DBD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E1E24] focus:outline-none focus:ring-2 focus:ring-[#1E1E24]/10 focus:border-[#1E1E24] shadow-xs"
                >
                  <option value="SEDENTARY">Sedentary (desk job, minimal exercise)</option>
                  <option value="LIGHT">Lightly Active (training 1-3 days/week)</option>
                  <option value="MODERATE">Moderately Active (exercise 3-5 days/week)</option>
                  <option value="ACTIVE">Very Active (hard training 6-7 days/week)</option>
                  <option value="VERY_ACTIVE">Extra Active (intense training + physical job)</option>
                </select>
              </div>
            </div>

            {/* Goal Text Box */}
            <div className="bg-[#FAF7F0] p-4 sm:p-5 rounded-2xl border border-[#ECE5D6] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8677]">
                  2. Describe Your Goal & Training
                </label>
                <span className="text-[10px] text-[#A09886] font-semibold">Natural language</span>
              </div>

              <textarea
                rows={3}
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                placeholder="e.g. I work a desk job, lift weights 4 days a week, and want to lose belly fat while building lean muscle..."
                className="w-full bg-white border border-[#E2DBD0] rounded-2xl p-3.5 text-xs font-medium text-[#1E1E24] placeholder-[#A09886] focus:outline-none focus:ring-2 focus:ring-[#1E1E24]/10 focus:border-[#1E1E24] shadow-xs resize-none"
              />

              {/* Quick inspiration chips */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold text-[#8C8677]">Or click a quick goal template:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_GOALS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFitnessGoal(preset.text)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2ECE0] border border-[#E2DBD0] text-[11px] font-bold text-[#1E1E24] transition-all hover:scale-[1.01] shadow-2xs text-left"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-[#1E1E24] hover:bg-[#2C2C38] text-white shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing your metabolism with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Calculate Optimal Targets with AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: AI RECOMMENDATION RESULT */}
        {step === 'result' && aiResult && (
          <div className="space-y-4 animate-in fade-in">
            {/* Strategy Badge Banner */}
            <div className="p-3.5 rounded-2xl bg-[#1E1E24] text-white flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <Zap className="w-4 h-4 text-[#FFAEBF] shrink-0" />
                <span className="text-xs font-black text-[#FFAEBF] truncate">
                  {aiResult.strategy}
                </span>
              </div>
              <span className="text-[10px] text-[#A0A0AB] font-bold whitespace-nowrap shrink-0">
                BMR: {aiResult.bmr} • TDEE: {aiResult.tdee} kcal
              </span>
            </div>

            {/* 4 Signature Bento Cards Matching Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Calories (Warm Yellow) */}
              <div className="bg-[#FDE382] rounded-2xl p-3.5 text-[#2E2713] text-center shadow-xs space-y-1">
                <div className="flex items-center justify-center space-x-1 text-[#63552D]">
                  <Flame className="w-3.5 h-3.5 text-[#C24161]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Calories</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#1E1E24] tracking-tight">
                  {aiResult.targetCalories}
                </p>
                <p className="text-[10px] font-bold text-[#63552D]">kcal / day</p>
              </div>

              {/* Protein (Soft Rose) */}
              <div className="bg-[#FFC4D2] rounded-2xl p-3.5 text-[#421722] text-center shadow-xs space-y-1">
                <div className="flex items-center justify-center space-x-1 text-[#7A3648]">
                  <Dumbbell className="w-3.5 h-3.5 text-[#1E3B68]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Protein</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#1E1E24] tracking-tight">
                  {aiResult.targetProteinG}g
                </p>
                <p className="text-[10px] font-bold text-[#7A3648]">
                  ~{(aiResult.targetProteinG / (weightKg || 1)).toFixed(1)}g / kg
                </p>
              </div>

              {/* Carbs (Sage Green) */}
              <div className="bg-[#ABC480] rounded-2xl p-3.5 text-[#243510] text-center shadow-xs space-y-1">
                <div className="flex items-center justify-center space-x-1 text-[#3D5321]">
                  <Wheat className="w-3.5 h-3.5 text-[#243510]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Carbs</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#1E1E24] tracking-tight">
                  {aiResult.targetCarbsG}g
                </p>
                <p className="text-[10px] font-bold text-[#3D5321]">Daily fuel</p>
              </div>

              {/* Fats (Soft Blue) */}
              <div className="bg-[#BBD5F8] rounded-2xl p-3.5 text-[#182C4E] text-center shadow-xs space-y-1">
                <div className="flex items-center justify-center space-x-1 text-[#324B74]">
                  <Droplet className="w-3.5 h-3.5 text-[#182C4E]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Fats</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#1E1E24] tracking-tight">
                  {aiResult.targetFatG}g
                </p>
                <p className="text-[10px] font-bold text-[#324B74]">Hormone health</p>
              </div>
            </div>

            {/* AI Explanation Box */}
            <div className="bg-[#FAF7F0] p-4 sm:p-5 rounded-2xl border border-[#ECE5D6] space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-black text-[#1E1E24]">
                <Sparkles className="w-3.5 h-3.5 text-[#FF358B]" />
                <span>Nutritionist Rationale</span>
              </div>
              <p className="text-xs text-[#524D42] leading-relaxed font-medium">
                {aiResult.explanation}
              </p>
            </div>

            {/* Actionable Tips */}
            {aiResult.actionableTips && aiResult.actionableTips.length > 0 && (
              <div className="bg-[#FAF7F0] p-4 sm:p-5 rounded-2xl border border-[#ECE5D6] space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-black text-[#1E1E24]">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>3 Practical Diet & Routine Tips:</span>
                </div>
                <ul className="space-y-1.5">
                  {aiResult.actionableTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 text-xs text-[#524D42] font-medium">
                      <span className="w-4 h-4 rounded-full bg-[#1E1E24] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold text-[#1E1E24] hover:bg-[#FAF7F0] border border-[#E2DBD0] bg-white flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#7A7363]" />
                <span>Adjust Inputs</span>
              </button>

              <button
                type="button"
                onClick={handleApplyTargets}
                disabled={isApplying}
                className="w-full sm:flex-1 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-[#1E1E24] hover:bg-[#2C2C38] text-white shadow-xl flex items-center justify-center space-x-2 transition-transform active:scale-98 disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Applying targets...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply to My Daily Targets</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
