import React, { useState } from 'react';
import { Gender, ActivityLevel } from '../types';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

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
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-emerald-500 text-dark-900' : 'bg-dark-800 text-slate-500'
            }`}
          >
            1
          </div>
          <span className={`text-xs font-semibold ${step >= 1 ? 'text-slate-200' : 'text-slate-500'}`}>
            Biometrics
          </span>
        </div>
        <div className="w-8 h-0.5 bg-slate-800" />
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-emerald-500 text-dark-900' : 'bg-dark-800 text-slate-500'
            }`}
          >
            2
          </div>
          <span className={`text-xs font-semibold ${step >= 2 ? 'text-slate-200' : 'text-slate-500'}`}>
            Activity
          </span>
        </div>
        <div className="w-8 h-0.5 bg-slate-800" />
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 3 ? 'bg-emerald-500 text-dark-900' : 'bg-dark-800 text-slate-500'
            }`}
          >
            3
          </div>
          <span className={`text-xs font-semibold ${step === 3 ? 'text-slate-200' : 'text-slate-500'}`}>
            Goals
          </span>
        </div>
      </div>

      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {formError}
        </div>
      )}

      {/* STEP 1: Biometrics & Account */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Gautham Krishna"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value) || 170)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 70)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Back to Login
            </button>
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-dark-900 shadow-lg shadow-emerald-500/20"
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
          <p className="text-xs text-slate-400 mb-2">
            Select your regular physical activity routine to calculate your Total Daily Energy Expenditure (TDEE).
          </p>

          <div className="space-y-2">
            {[
              {
                id: 'SEDENTARY' as ActivityLevel,
                title: 'Sedentary',
                desc: 'Desk job, little to no structured exercise (1.2x BMR)',
              },
              {
                id: 'LIGHT' as ActivityLevel,
                title: 'Lightly Active',
                desc: 'Light exercise or sports 1–3 days/week (1.375x BMR)',
              },
              {
                id: 'MODERATE' as ActivityLevel,
                title: 'Moderately Active',
                desc: 'Moderate exercise 3–5 days/week (1.55x BMR)',
              },
              {
                id: 'ACTIVE' as ActivityLevel,
                title: 'Very Active',
                desc: 'Hard exercise or sports 6–7 days/week (1.725x BMR)',
              },
            ].map((option) => {
              const isSelected = activityLevel === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => setActivityLevel(option.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-dark-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold">{option.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{option.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center space-x-1 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-dark-900 shadow-lg shadow-emerald-500/20"
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-dark-800 to-dark-850 border border-emerald-500/30 text-center">
            <div className="inline-flex p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Your Personalized Targets Calculated!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Derived scientifically via the <strong className="text-slate-300">Mifflin-St Jeor Equation</strong>
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-dark-900/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Daily Calories</span>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">{estimates.targetCalories}</p>
                <span className="text-[10px] text-slate-400">kcal / day (TDEE)</span>
              </div>

              <div className="bg-dark-900/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Daily Protein</span>
                <p className="text-2xl font-black text-blue-400 mt-0.5">{estimates.targetProtein}</p>
                <span className="text-[10px] text-slate-400">grams (1.8g / kg)</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-left bg-dark-900/50 p-2.5 rounded-lg border border-slate-800">
              <p>• Basal Metabolic Rate (BMR): <strong className="text-slate-200">{estimates.bmr} kcal</strong></p>
              <p>• Estimated Carbs: <strong className="text-amber-400">~{Math.round((estimates.targetCalories * 0.5) / 4)}g</strong></p>
              <p>• Estimated Healthy Fats: <strong className="text-pink-400">~{Math.round((estimates.targetCalories * 0.25) / 9)}g</strong></p>
            </div>
          </div>

          <div className="pt-3 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center space-x-1 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-dark-900 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
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
