import React, { useState } from 'react';
import { Gender, ActivityLevel } from '../types';
import { ChevronRight, ChevronLeft, Check, Sparkles, AlertCircle } from 'lucide-react';

interface RegisterWizardProps {
  onComplete: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({ onComplete, onCancel, loading }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<Gender>('MALE');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('MODERATE');

  const [formError, setFormError] = useState<string | null>(null);

  // Live Mifflin-St Jeor TDEE & Protein estimation
  const calculateEstimate = () => {
    let bmr =
      gender === 'FEMALE'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
        : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

    const multipliers: Record<ActivityLevel, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.725,
    };

    const tdee = bmr * (multipliers[activityLevel] || 1.2);
    const targetCalories = Math.round(tdee);
    const targetProtein = Math.round(weightKg * 1.8);
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), targetCalories, targetProtein };
  };

  const estimates = calculateEstimate();

  const handleNextFromStep1 = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFormError('Please fill in your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password should be at least 6 characters.');
      return;
    }
    if (age < 12 || age > 100) {
      setFormError('Please enter a valid age.');
      return;
    }
    if (heightCm < 100 || heightCm > 250) {
      setFormError('Please enter a valid height in cm.');
      return;
    }
    if (weightKg < 30 || weightKg > 250) {
      setFormError('Please enter a valid weight in kg.');
      return;
    }
    setFormError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    setFormError(null);
    try {
      await onComplete({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        age,
        gender,
        heightCm,
        weightKg,
        activityLevel,
      });
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to complete registration.');
    }
  };

  return (
    <div className="w-full">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1
                ? 'bg-[#1E1E24] text-white shadow-sm'
                : 'bg-[#FAF7F0] border border-[#E2DBD0] text-[#A09886]'
            }`}
          >
            1
          </div>
          <span className={`text-xs font-bold transition-colors ${step >= 1 ? 'text-[#1E1E24]' : 'text-[#A09886]'}`}>
            Biometrics
          </span>
        </div>
        <div className="w-8 h-0.5 bg-[#E8E2D2]" />
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 2
                ? 'bg-[#1E1E24] text-white shadow-sm'
                : 'bg-[#FAF7F0] border border-[#E2DBD0] text-[#A09886]'
            }`}
          >
            2
          </div>
          <span className={`text-xs font-bold transition-colors ${step >= 2 ? 'text-[#1E1E24]' : 'text-[#A09886]'}`}>
            Activity
          </span>
        </div>
        <div className="w-8 h-0.5 bg-[#E8E2D2]" />
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 3
                ? 'bg-[#1E1E24] text-white shadow-sm'
                : 'bg-[#FAF7F0] border border-[#E2DBD0] text-[#A09886]'
            }`}
          >
            3
          </div>
          <span className={`text-xs font-bold transition-colors ${step === 3 ? 'text-[#1E1E24]' : 'text-[#A09886]'}`}>
            Goals
          </span>
        </div>
      </div>

      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Biometrics & Account */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Gautham Krishna"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] placeholder-[#A09886] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] placeholder-[#A09886] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3.5 py-2.5 text-xs text-[#1E1E24] placeholder-[#A09886] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3 py-2.5 text-xs text-[#1E1E24] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all cursor-pointer"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3 py-2.5 text-xs text-[#1E1E24] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value) || 170)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3 py-2.5 text-xs text-[#1E1E24] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1E24] mb-1.5">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 70)}
                className="w-full bg-[#FAF7F0] border border-[#E2DBD0] rounded-xl px-3 py-2.5 text-xs text-[#1E1E24] font-semibold outline-none focus:border-[#FFAEBF] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-xs font-bold text-[#7A7363] hover:text-[#1E1E24] transition-colors"
            >
              Back to Login
            </button>
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-extrabold text-xs bg-[#1E1E24] hover:bg-[#2F2F38] text-white shadow-md transition-all active:scale-95"
            >
              <span>Next: Activity Level</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Activity Level */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <p className="text-xs text-[#7A7363] mb-2 leading-relaxed">
            Select your regular physical activity routine to calculate your Total Daily Energy Expenditure (TDEE).
          </p>

          <div className="space-y-2">
            {[
              {
                id: 'SEDENTARY' as ActivityLevel,
                title: 'Sedentary',
                desc: 'Desk job, little to no structured exercise (1.2× BMR)',
              },
              {
                id: 'LIGHT' as ActivityLevel,
                title: 'Lightly Active',
                desc: 'Light exercise or sports 1–3 days/week (1.375× BMR)',
              },
              {
                id: 'MODERATE' as ActivityLevel,
                title: 'Moderately Active',
                desc: 'Moderate exercise 3–5 days/week (1.55× BMR)',
              },
              {
                id: 'ACTIVE' as ActivityLevel,
                title: 'Very Active',
                desc: 'Hard exercise or sports 6–7 days/week (1.725× BMR)',
              },
            ].map((option) => {
              const isSelected = activityLevel === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => setActivityLevel(option.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F2F8EE] border-[#88B868] text-[#1E1E24] shadow-sm ring-1 ring-[#88B868]/40'
                      : 'bg-[#FAF7F0] border-[#E2DBD0] text-[#1E1E24] hover:border-[#D5CCBD] hover:bg-[#F5EFE3]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1E1E24]">{option.title}</h4>
                      <p className="text-[11px] text-[#7A7363] mt-0.5">{option.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#437A22] shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-[#7A7363] hover:text-[#1E1E24] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-extrabold text-xs bg-[#1E1E24] hover:bg-[#2F2F38] text-white shadow-md transition-all active:scale-95"
            >
              <span>Next: View Goals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Goals & Mifflin-St Jeor TDEE Review */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D2] text-center">
            <div className="inline-flex p-2 rounded-2xl bg-[#FFAEBF] text-[#1E1E24] mb-2 shadow-sm">
              <Sparkles className="w-5 h-5 text-[#9E4D61]" />
            </div>
            <h3 className="text-sm font-black text-[#1E1E24]">Your Personalized Targets Calculated!</h3>
            <p className="text-xs text-[#7A7363] mt-1">
              Derived scientifically via the <strong className="text-[#1E1E24]">Mifflin-St Jeor Equation</strong>
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#FDE382] p-3.5 rounded-2xl border border-[#ECCF69]/50 text-left shadow-sm">
                <span className="text-[10px] text-[#63552D] uppercase font-extrabold tracking-wide">Daily Calories</span>
                <p className="text-2xl font-black text-[#1E1E24] mt-0.5">{estimates.targetCalories}</p>
                <span className="text-[10px] font-semibold text-[#63552D]">kcal / day (TDEE)</span>
              </div>

              <div className="bg-[#FFC4D2] p-3.5 rounded-2xl border border-[#FFAEBF]/50 text-left shadow-sm">
                <span className="text-[10px] text-[#7A3648] uppercase font-extrabold tracking-wide">Daily Protein</span>
                <p className="text-2xl font-black text-[#1E1E24] mt-0.5">{estimates.targetProtein}</p>
                <span className="text-[10px] font-semibold text-[#7A3648]">grams (1.8g / kg)</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-[#666052] text-left bg-white p-3 rounded-xl border border-[#E2DBD0] space-y-1">
              <p>• Basal Metabolic Rate (BMR): <strong className="text-[#1E1E24]">{estimates.bmr} kcal</strong></p>
              <p>• Estimated Carbs: <strong className="text-[#3D5321]">~{Math.round((estimates.targetCalories * 0.5) / 4)}g</strong></p>
              <p>• Estimated Healthy Fats: <strong className="text-[#1E3B68]">~{Math.round((estimates.targetCalories * 0.25) / 9)}g</strong></p>
            </div>
          </div>

          <div className="pt-3 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-[#7A7363] hover:text-[#1E1E24] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm bg-[#1E1E24] hover:bg-[#2F2F38] text-white shadow-md disabled:opacity-50 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Complete & Start Tracking'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
