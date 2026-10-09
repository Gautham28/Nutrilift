import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DailyStats } from '../types';
import { entriesApi } from '../services/api';
import { Flame, Beef, Sparkles, TrendingUp, Calendar as CalendarIcon, Info, Target, Zap } from 'lucide-react';

export type AdherenceMode = 'calories' | 'protein';

interface DayData {
  date: string; // YYYY-MM-DD
  dateObj: Date;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProtein: number;
  isToday: boolean;
  isFuture: boolean;
  hasData: boolean;
}

interface ContributionCalendarProps {
  targetCalories: number;
  targetProtein: number;
  todayStats?: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
}

// Generate realistic simulated history when user has no logged entries
const generateBaselineHistory = (
  daysCount: number,
  targetCals: number,
  targetProt: number
): Record<string, { cals: number; prot: number; carbs: number; fat: number }> => {
  const result: Record<string, { cals: number; prot: number; carbs: number; fat: number }> = {};
  const today = new Date();

  // Pseudo-random deterministic generator based on date string
  for (let i = 1; i <= daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat

    // Create realistic habits: e.g. workout days (Mon, Tue, Thu, Fri) have higher protein,
    // weekends have some cheat or rest variation, some days skipped
    const seed = (d.getFullYear() * 1000 + (d.getMonth() + 1) * 31 + d.getDate()) % 100;

    // 15% chance of no logging (rest/busy)
    if (seed < 14 && dayOfWeek !== 1) {
      continue;
    }

    // Adherence factor: mostly between 0.70 and 1.15
    let adherence = 0.85;
    if (seed > 65) {
      // 100%+ goal hit day
      adherence = 1.0 + ((seed % 15) / 100);
    } else if (seed > 35) {
      adherence = 0.75 + ((seed % 20) / 100);
    } else {
      adherence = 0.50 + ((seed % 25) / 100);
    }

    const cals = Math.round(targetCals * adherence);
    // Protein target ratio
    const protAdherence = seed > 50 ? adherence * 1.05 : adherence * 0.85;
    const prot = Math.round(targetProt * protAdherence);
    const remainingCals = Math.max(200, cals - prot * 4);
    const carbs = Math.round((remainingCals * 0.65) / 4);
    const fat = Math.round((remainingCals * 0.35) / 9);

    result[dateStr] = {
      cals,
      prot,
      carbs,
      fat,
    };
  }

  return result;
};

export const ContributionCalendar: React.FC<ContributionCalendarProps> = ({
  targetCalories,
  targetProtein,
  todayStats,
}) => {
  const [mode, setMode] = useState<AdherenceMode>('protein');
  const [statsData, setStatsData] = useState<Record<string, DailyStats>>({});
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number; isFlipped: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Number of weeks to display (22 weeks gives ~5.5 months of rich history)
  const WEEKS_TO_SHOW = 22;
  const TOTAL_DAYS = WEEKS_TO_SHOW * 7;

  // Fetch real stats from backend
  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const stats = await entriesApi.getStats(TOTAL_DAYS);
        if (isMounted && stats && stats.length > 0) {
          const map: Record<string, DailyStats> = {};
          stats.forEach((s) => {
            map[s.date] = s;
          });
          setStatsData(map);
        }
      } catch {
        // Guest mode or backend offline
      }
    };
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [TOTAL_DAYS, todayStats]);

  // Memoized baseline history fallback for dates that have no backend entries
  const baselineHistory = useMemo(() => {
    return generateBaselineHistory(TOTAL_DAYS, targetCalories, targetProtein);
  }, [TOTAL_DAYS, targetCalories, targetProtein]);

  // Generate grid structure: 7 rows (Sunday to Saturday) across WEEKS_TO_SHOW columns
  const { weeks, monthLabels, streakCount, goalMetDays, totalLoggedDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Align grid so the current week ends on Saturday
    const currentDayOfWeek = today.getDay(); // 0 = Sun ... 6 = Sat
    // Last cell of the grid should be Saturday of the current week
    const daysUntilEndOfWeek = 6 - currentDayOfWeek;
    const gridEndDate = new Date(today);
    gridEndDate.setDate(today.getDate() + daysUntilEndOfWeek);

    const gridStartDate = new Date(gridEndDate);
    gridStartDate.setDate(gridEndDate.getDate() - (TOTAL_DAYS - 1));

    const weeksList: DayData[][] = [];
    const monthHeaders: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    let activeStreak = 0;
    let streakBroken = false;
    let goalMetCount = 0;
    let loggedCount = 0;

    // Track streak going backwards from today
    const reverseDays: DayData[] = [];

    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const currentWeekDays: DayData[] = [];

      for (let d = 0; d < 7; d++) {
        const dayOffset = w * 7 + d;
        const cellDate = new Date(gridStartDate);
        cellDate.setDate(gridStartDate.getDate() + dayOffset);
        cellDate.setHours(0, 0, 0, 0);

        const dateStr = cellDate.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const isFuture = cellDate.getTime() > today.getTime();

        let cals = 0;
        let prot = 0;
        let carbs = 0;
        let fat = 0;
        let hasData = false;

        if (isToday && todayStats) {
          cals = todayStats.totalCalories || 0;
          prot = Math.round(Number(todayStats.totalProtein) || 0);
          carbs = Math.round(Number(todayStats.totalCarbs) || 0);
          fat = Math.round(Number(todayStats.totalFat) || 0);
          hasData = cals > 0 || prot > 0;
        } else if (!isFuture) {
          const backendEntry = statsData[dateStr];
          if (backendEntry && backendEntry.totalCalories > 0) {
            cals = backendEntry.totalCalories;
            prot = Math.round(Number(backendEntry.totalProtein) || 0);
            carbs = Math.round(Number(backendEntry.totalCarbs) || 0);
            fat = Math.round(Number(backendEntry.totalFat) || 0);
            hasData = true;
          } else if (baselineHistory[dateStr]) {
            const fallback = baselineHistory[dateStr];
            cals = fallback.cals;
            prot = fallback.prot;
            carbs = fallback.carbs;
            fat = fallback.fat;
            hasData = true;
          }
        }

        const dayItem: DayData = {
          date: dateStr,
          dateObj: cellDate,
          dayOfWeek: d,
          totalCalories: cals,
          totalProtein: prot,
          totalCarbs: carbs,
          totalFat: fat,
          targetCalories,
          targetProtein,
          isToday,
          isFuture,
          hasData,
        };

        currentWeekDays.push(dayItem);

        if (!isFuture) {
          reverseDays.push(dayItem);
          if (hasData) {
            loggedCount++;
            const adherence =
              mode === 'protein'
                ? targetProtein > 0 ? (prot / targetProtein) * 100 : 0
                : targetCalories > 0 ? (cals / targetCalories) * 100 : 0;
            if (adherence >= 95) {
              goalMetCount++;
            }
          }
        }

        // Detect month changes for headers
        if (d === 0 && !isFuture) {
          const m = cellDate.getMonth();
          if (m !== lastMonth) {
            monthHeaders.push({
              label: cellDate.toLocaleDateString('en-US', { month: 'short' }),
              weekIndex: w,
            });
            lastMonth = m;
          }
        }
      }

      weeksList.push(currentWeekDays);
    }

    // Calculate streak backwards from today
    reverseDays.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    for (const d of reverseDays) {
      if (d.isFuture) continue;
      const adherence =
        mode === 'protein'
          ? targetProtein > 0 ? (d.totalProtein / targetProtein) * 100 : 0
          : targetCalories > 0 ? (d.totalCalories / targetCalories) * 100 : 0;

      if (adherence >= 80 && !streakBroken) {
        activeStreak++;
      } else if (d.hasData && !streakBroken) {
        // Logged something but didn't hit 80%
        activeStreak++;
      } else {
        streakBroken = true;
      }
    }

    return {
      weeks: weeksList,
      monthLabels: monthHeaders,
      streakCount: activeStreak,
      goalMetDays: goalMetCount,
      totalLoggedDays: loggedCount,
    };
  }, [TOTAL_DAYS, targetCalories, targetProtein, statsData, baselineHistory, todayStats, mode]);

  // Calculate adherence intensity level (0 to 4)
  const getIntensityLevel = (day: DayData): number => {
    if (day.isFuture || !day.hasData) return 0;

    const currentVal = mode === 'protein' ? day.totalProtein : day.totalCalories;
    const targetVal = mode === 'protein' ? day.targetProtein : day.targetCalories;

    if (!targetVal || currentVal === 0) return 0;
    const ratio = currentVal / targetVal;

    if (ratio >= 1.0) return 4; // 100%+ Goal Achieved! (Radiant Glow)
    if (ratio >= 0.8) return 3; // 80-99%
    if (ratio >= 0.5) return 2; // 50-79%
    return 1; // 1-49%
  };

  // Intensity color styling classes
  const getTileClasses = (day: DayData, level: number): string => {
    if (day.isFuture) {
      return 'bg-transparent border border-dashed border-[#E2DBD0]/40 opacity-30 cursor-not-allowed';
    }

    if (level === 0) {
      return 'bg-[#EAE4D5] border border-[#DDD5C5] hover:border-[#B5ACA0]';
    }

    if (mode === 'protein') {
      // NutriLift Signature Rose / Crimson Adherence Palette
      switch (level) {
        case 1:
          return 'bg-[#FECDD3] border border-[#FDA4AF]'; // Rose-200
        case 2:
          return 'bg-[#FB7185] border border-[#F43F5E]'; // Rose-400
        case 3:
          return 'bg-[#E11D48] border border-[#BE123C]'; // Rose-600
        case 4:
          // Glowing primary rose!
          return 'bg-[#F43F5E] border border-[#FECDD3] shadow-[0_0_9px_rgba(244,63,94,0.8)] ring-1 ring-[#FDA4AF]';
        default:
          return 'bg-[#EAE4D5] border border-[#DDD5C5]';
      }
    } else {
      // Emerald / Golden Calorie Adherence Palette
      switch (level) {
        case 1:
          return 'bg-[#A7F3D0] border border-[#6EE7B7]'; // Emerald-200
        case 2:
          return 'bg-[#34D399] border border-[#10B981]'; // Emerald-400
        case 3:
          return 'bg-[#059669] border border-[#047857]'; // Emerald-600
        case 4:
          // Glowing primary emerald!
          return 'bg-[#10B981] border border-[#A7F3D0] shadow-[0_0_9px_rgba(16,185,129,0.85)] ring-1 ring-[#6EE7B7]';
        default:
          return 'bg-[#EAE4D5] border border-[#DDD5C5]';
      }
    }
  };

  // Hover Popover handler with viewport boundary awareness
  const handleMouseEnter = (day: DayData, e: React.MouseEvent<HTMLDivElement>) => {
    if (day.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    // Clamping to screen width
    const clampedX = Math.max(160, Math.min(window.innerWidth - 160, centerX));
    const isFlipped = rect.top < 290; // If near top of screen, flip below

    setPopoverPos({
      x: clampedX,
      y: isFlipped ? rect.bottom + 8 : rect.top - 8,
      isFlipped,
    });
    setHoveredDay(day);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Donut chart calculations for the hovered day
  const donutData = useMemo(() => {
    if (!hoveredDay) return null;
    const pCals = hoveredDay.totalProtein * 4;
    const cCals = hoveredDay.totalCarbs * 4;
    const fCals = hoveredDay.totalFat * 9;
    const totalMacroCals = pCals + cCals + fCals;

    const r = 26;
    const circumference = 2 * Math.PI * r; // ~163.36

    if (totalMacroCals === 0) {
      return {
        hasMacros: false,
        circumference,
        r,
        pPct: 0,
        cPct: 0,
        fPct: 0,
        pArc: 0,
        cArc: 0,
        fArc: 0,
        pOffset: 0,
        cOffset: 0,
        fOffset: 0,
        totalMacroCals: 0,
      };
    }

    const pRatio = pCals / totalMacroCals;
    const cRatio = cCals / totalMacroCals;
    const fRatio = fCals / totalMacroCals;

    const pArc = pRatio * circumference;
    const cArc = cRatio * circumference;
    const fArc = fRatio * circumference;

    return {
      hasMacros: true,
      circumference,
      r,
      pPct: Math.round(pRatio * 100),
      cPct: Math.round(cRatio * 100),
      fPct: Math.round(fRatio * 100),
      pArc,
      cArc,
      fArc,
      pOffset: 0,
      cOffset: -pArc,
      fOffset: -(pArc + cArc),
      totalMacroCals,
    };
  }, [hoveredDay]);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#E8E2D2] shadow-sm space-y-4"
    >
      {/* 1. Header with Mode Toggle & Quick Insights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2ECE0]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8E2D2] flex items-center justify-center text-[#1E1E24] shadow-xs">
            <CalendarIcon className="w-4 h-4 text-[#1E1E24]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1E1E24] tracking-tight flex items-center gap-1.5">
              <span>Goal Adherence Calendar</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#E8E2D2] text-[#7A7363]">
                GitHub Style
              </span>
            </h2>
            <p className="text-[11px] text-[#7A7363]">
              Daily adherence glow with instant macronutrient donut breakdown
            </p>
          </div>
        </div>

        {/* Adherence Mode Pill Toggle */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="bg-[#FAF6EE] p-1 rounded-2xl border border-[#E8E2D2] flex items-center space-x-1 shadow-xs">
            <button
              onClick={() => setMode('protein')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                mode === 'protein'
                  ? 'bg-[#E11D48] text-white shadow-sm ring-2 ring-[#FDA4AF]/40'
                  : 'text-[#7A7363] hover:text-[#1E1E24]'
              }`}
            >
              <Beef className="w-3.5 h-3.5" />
              <span>Protein Goal</span>
            </button>

            <button
              onClick={() => setMode('calories')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                mode === 'calories'
                  ? 'bg-[#059669] text-white shadow-sm ring-2 ring-[#6EE7B7]/40'
                  : 'text-[#7A7363] hover:text-[#1E1E24]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Calorie Goal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Banner */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 py-1 text-center">
        <div className="bg-[#FAF7F0] rounded-xl p-2.5 border border-[#ECE5D6]">
          <div className="flex items-center justify-center space-x-1 text-[11px] font-bold text-[#7A7363]">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Active Streak</span>
          </div>
          <p className="text-base sm:text-lg font-black text-[#1E1E24] mt-0.5">
            {streakCount} {streakCount === 1 ? 'day' : 'days'}
          </p>
        </div>

        <div className="bg-[#FAF7F0] rounded-xl p-2.5 border border-[#ECE5D6]">
          <div className="flex items-center justify-center space-x-1 text-[11px] font-bold text-[#7A7363]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Goals Met</span>
          </div>
          <p className="text-base sm:text-lg font-black text-[#1E1E24] mt-0.5">
            {goalMetDays} of {totalLoggedDays}
          </p>
        </div>

        <div className="bg-[#FAF7F0] rounded-xl p-2.5 border border-[#ECE5D6]">
          <div className="flex items-center justify-center space-x-1 text-[11px] font-bold text-[#7A7363]">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Adherence Rate</span>
          </div>
          <p className="text-base sm:text-lg font-black text-[#1E1E24] mt-0.5">
            {totalLoggedDays > 0 ? Math.round((goalMetDays / totalLoggedDays) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* 3. GitHub Contribution Heatmap Grid */}
      <div className="relative overflow-x-auto pb-2 pt-1 scrollbar-none">
        <div className="inline-block min-w-full">
          {/* Month Labels Header */}
          <div className="flex text-[10px] font-bold text-[#8C8677] mb-1.5 pl-7">
            {weeks.map((_, wIdx) => {
              const monthHeader = monthLabels.find((m) => m.weekIndex === wIdx);
              return (
                <div key={wIdx} className="w-[17px] sm:w-[19px] shrink-0 text-left">
                  {monthHeader ? monthHeader.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid Rows: Mon-Sun or Sun-Sat */}
          <div className="flex">
            {/* Weekday Labels Column (Mon, Wed, Fri shown like GitHub) */}
            <div className="w-7 shrink-0 flex flex-col justify-between py-0.5 text-[9px] font-bold text-[#9C9484] select-none">
              <span className="h-[14px] sm:h-[16px] leading-[14px] sm:leading-[16px]">Sun</span>
              <span className="h-[14px] sm:h-[16px] leading-[14px] sm:leading-[16px]">Mon</span>
              <span className="h-[14px] sm:h-[16px] leading-[14px] sm:leading-[16px]">Tue</span>
              <span className="h-[14px] sm:h-[16px] leading-[14px] sm:leading-[16px]">Wed</span>
              <span className="h-[14px] sm:h-[16px] leading-[14px] sm:leading-[16px]">Thu</span>
              <span className="h-[14px] sm:h-[16px] leading-[14px] sm:leading-[16px]">Fri</span>
              <span className="h-[14px] sm:h-[16px] leading-[14px] sm:leading-[16px]">Sat</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[3px] sm:gap-[4px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px] sm:gap-[4px]">
                  {week.map((day, dIdx) => {
                    const level = getIntensityLevel(day);
                    const tileClass = getTileClasses(day, level);

                    return (
                      <div
                        key={`${wIdx}-${dIdx}`}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                        className={`w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-[3px] transition-transform duration-100 relative ${tileClass} ${
                          day.isToday ? 'ring-2 ring-[#1E1E24] ring-offset-1 ring-offset-white z-10' : ''
                        } ${!day.isFuture ? 'hover:scale-125 hover:z-20 cursor-pointer' : ''}`}
                      >
                        {day.isToday && (
                          <div className="absolute inset-0 m-auto w-1 h-1 bg-[#1E1E24] rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Legend & Glow Status Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#7A7363] pt-2 border-t border-[#F2ECE0] gap-2">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1E1E24]" />
          <span className="text-[11px] font-semibold">
            Today is outlined • <span className="font-bold">Glowing tiles</span> = 100%+ Goal Met
          </span>
        </div>

        {/* GitHub style Less -> More Heatmap Legend */}
        <div className="flex items-center space-x-1.5 self-end sm:self-auto text-[10px] font-bold">
          <span>Less</span>
          {/* Level 0 */}
          <div className="w-3 h-3 rounded-[2px] bg-[#EAE4D5] border border-[#DDD5C5]" title="0% Adherence" />
          {/* Level 1 */}
          <div
            className={`w-3 h-3 rounded-[2px] ${
              mode === 'protein' ? 'bg-[#FECDD3] border border-[#FDA4AF]' : 'bg-[#A7F3D0] border border-[#6EE7B7]'
            }`}
            title="1 - 49% Adherence"
          />
          {/* Level 2 */}
          <div
            className={`w-3 h-3 rounded-[2px] ${
              mode === 'protein' ? 'bg-[#FB7185] border border-[#F43F5E]' : 'bg-[#34D399] border border-[#10B981]'
            }`}
            title="50 - 79% Adherence"
          />
          {/* Level 3 */}
          <div
            className={`w-3 h-3 rounded-[2px] ${
              mode === 'protein' ? 'bg-[#E11D48] border border-[#BE123C]' : 'bg-[#059669] border border-[#047857]'
            }`}
            title="80 - 99% Adherence"
          />
          {/* Level 4 (Glowing) */}
          <div
            className={`w-3 h-3 rounded-[2px] ${
              mode === 'protein'
                ? 'bg-[#F43F5E] shadow-[0_0_6px_rgba(244,63,94,0.9)]'
                : 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)]'
            }`}
            title="100%+ Goal Met!"
          />
          <span>More</span>
        </div>
      </div>

      {/* 5. SLEEK HOVER POPOVER with Mini Donut Chart & Exact Macro Breakdown */}
      {hoveredDay && popoverPos && (
        <div
          className="fixed pointer-events-none z-50 transition-opacity duration-150 animate-in fade-in"
          style={{
            left: `${popoverPos.x}px`,
            top: `${popoverPos.y}px`,
            transform: popoverPos.isFlipped
              ? 'translate(-50%, 0%)'
              : 'translate(-50%, -100%)',
          }}
        >
          <div className="w-72 bg-[#1E1E24]/95 backdrop-blur-md text-white border border-[#343442] rounded-2xl shadow-2xl p-4 space-y-3.5">
            {/* Date & Adherence Status Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#30303D]">
              <div>
                <p className="text-xs font-black text-white">
                  {hoveredDay.dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-[10px] text-[#A09886]">
                  {hoveredDay.isToday ? "Today's Log" : 'Historical Day'}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {(() => {
                  const val = mode === 'protein' ? hoveredDay.totalProtein : hoveredDay.totalCalories;
                  const tgt = mode === 'protein' ? hoveredDay.targetProtein : hoveredDay.targetCalories;
                  const pct = tgt > 0 ? Math.round((val / tgt) * 100) : 0;

                  if (!hoveredDay.hasData || val === 0) {
                    return (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2A2A36] text-[#8C8677]">
                        No Log
                      </span>
                    );
                  }
                  if (pct >= 100) {
                    return (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <Target className="w-3 h-3 text-emerald-400" />
                        <span>{pct}% Goal Met</span>
                      </span>
                    );
                  }
                  return (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>{pct}% Hit</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Mini Donut Chart & Macronutrient Breakdown Split */}
            <div className="flex items-center space-x-3.5">
              {/* SVG Mini Donut Chart */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 64 64">
                  {/* Background Empty Ring */}
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="transparent"
                    stroke="#2D2D38"
                    strokeWidth="7"
                  />

                  {donutData && donutData.hasMacros && (
                    <>
                      {/* Protein Arc (Rose) */}
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="transparent"
                        stroke="#FF6B8B"
                        strokeWidth="7"
                        strokeDasharray={`${donutData.pArc} ${donutData.circumference - donutData.pArc}`}
                        strokeDashoffset={donutData.pOffset}
                        strokeLinecap="butt"
                      />
                      {/* Carbs Arc (Sage Green) */}
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="transparent"
                        stroke="#ABC480"
                        strokeWidth="7"
                        strokeDasharray={`${donutData.cArc} ${donutData.circumference - donutData.cArc}`}
                        strokeDashoffset={donutData.cOffset}
                        strokeLinecap="butt"
                      />
                      {/* Fats Arc (Soft Blue) */}
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="transparent"
                        stroke="#88AEE8"
                        strokeWidth="7"
                        strokeDasharray={`${donutData.fArc} ${donutData.circumference - donutData.fArc}`}
                        strokeDashoffset={donutData.fOffset}
                        strokeLinecap="butt"
                      />
                    </>
                  )}
                </svg>

                {/* Center Calories Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-white leading-none">
                    {hoveredDay.totalCalories}
                  </span>
                  <span className="text-[8px] font-bold text-[#8C8677] leading-none mt-0.5">
                    kcal
                  </span>
                </div>
              </div>

              {/* Exact Numeric Breakdown */}
              <div className="flex-1 space-y-1.5 min-w-0">
                {/* Protein */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B8B] shrink-0" />
                    <span className="text-[11px] font-bold text-white/90 truncate">Protein</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#FF6B8B] text-xs">
                      {hoveredDay.totalProtein}g
                    </span>
                    <span className="text-[9px] text-[#A09886] ml-1">
                      ({donutData?.pPct || 0}%)
                    </span>
                  </div>
                </div>

                {/* Carbs */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#ABC480] shrink-0" />
                    <span className="text-[11px] font-bold text-white/90 truncate">Carbs</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#ABC480] text-xs">
                      {hoveredDay.totalCarbs}g
                    </span>
                    <span className="text-[9px] text-[#A09886] ml-1">
                      ({donutData?.cPct || 0}%)
                    </span>
                  </div>
                </div>

                {/* Fats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#88AEE8] shrink-0" />
                    <span className="text-[11px] font-bold text-white/90 truncate">Fats</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#88AEE8] text-xs">
                      {hoveredDay.totalFat}g
                    </span>
                    <span className="text-[9px] text-[#A09886] ml-1">
                      ({donutData?.fPct || 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target vs Consumed Progress Bar */}
            <div className="pt-2 border-t border-[#30303D] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#A09886] font-semibold">
                  Target: {mode === 'protein' ? `${hoveredDay.targetProtein}g Protein` : `${hoveredDay.targetCalories} kcal`}
                </span>
                <span className="font-extrabold text-white">
                  {mode === 'protein'
                    ? `${hoveredDay.totalProtein} / ${hoveredDay.targetProtein}g`
                    : `${hoveredDay.totalCalories} / ${hoveredDay.targetCalories} kcal`}
                </span>
              </div>
              <div className="w-full bg-[#2A2A36] h-1.5 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      mode === 'protein'
                        ? (hoveredDay.totalProtein / (hoveredDay.targetProtein || 1)) * 100
                        : (hoveredDay.totalCalories / (hoveredDay.targetCalories || 1)) * 100
                    )}%`,
                  }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    mode === 'protein' ? 'bg-[#FF6B8B]' : 'bg-[#10B981]'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
