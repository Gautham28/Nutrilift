import React from 'react';

interface MacroRingProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: 'emerald' | 'blue' | 'amber' | 'rose';
  subLabel?: string;
}

const colorMap = {
  emerald: {
    stroke: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    bgTrack: '#0f291e',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  },
  blue: {
    stroke: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.35)',
    bgTrack: '#13233f',
    text: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  },
  amber: {
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.35)',
    bgTrack: '#33230a',
    text: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  },
  rose: {
    stroke: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.35)',
    bgTrack: '#331326',
    text: 'text-pink-400',
    badge: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  },
};

export const MacroRing: React.FC<MacroRingProps> = ({
  label,
  consumed,
  target,
  unit,
  color,
  subLabel,
}) => {
  const radius = 48;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;

  const validTarget = target > 0 ? target : 1;
  const percentage = Math.min(Math.round((consumed / validTarget) * 100), 200);
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const style = colorMap[color];
  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between relative overflow-hidden transition-all duration-300 hover:border-slate-600/60 hover:shadow-xl">
      {/* Background glow circle */}
      <div
        className="absolute w-28 h-28 rounded-full pointer-events-none opacity-20 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: style.stroke }}
      />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-3 z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
          {percentage}%
        </span>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative w-32 h-32 flex items-center justify-center my-1 z-10">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={style.bgTrack}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={style.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${style.glow})`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {Math.round(consumed)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium -mt-0.5">
            / {target} {unit}
          </span>
        </div>
      </div>

      {/* Bottom Subtext */}
      <div className="mt-2 text-center z-10">
        <p className="text-xs text-slate-400">
          {consumed > target ? (
            <span className="text-rose-400 font-medium">+{Math.round(consumed - target)} {unit} over</span>
          ) : (
            <span>
              <strong className="text-slate-200 font-semibold">{Math.round(remaining)} {unit}</strong> remaining
            </span>
          )}
        </p>
        {subLabel && <p className="text-[10px] text-slate-500 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
};
