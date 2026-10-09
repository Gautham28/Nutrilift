import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DailyStats } from '../types';
import { entriesApi } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Beef,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export type AdherenceMode = 'protein' | 'calories';

export type AdherenceTier = 'very_high' | 'high' | 'moderate' | 'low';

export interface DayActivityData {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dateObj: Date;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProtein: number;
  adherencePct: number;
  tier: AdherenceTier;
  isToday: boolean;
  hasData: boolean;
}

interface ActivityCalendarProps {
  targetCalories: number;
  targetProtein: number;
  todayStats?: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
  onSelectDay?: (day: DayActivityData) => void;
  selectedDateStr?: string;
  onMonthStatsCalculated?: (stats: {
    veryHighDays: number;
    highDays: number;
    totalLoggedDays: number;
    hitRatePct: number;
  }) => void;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  targetCalories,
  targetProtein,
  todayStats,
  onSelectDay,
  selectedDateStr,
  onMonthStatsCalculated,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [mode, setMode] = useState<AdherenceMode>('protein');
  const [statsData, setStatsData] = useState<Record<string, DailyStats>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Popover state
  const [hoveredDay, setHoveredDay] = useState<DayActivityData | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number; isFlipped: boolean } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Fetch real stats directly from database for the selected month range
  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      setIsLoading(true);
      const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      try {
        const stats = await entriesApi.getStats(daysInMonth, startStr, endStr);
        if (isMounted && stats) {
          const map: Record<string, DailyStats> = {};
          stats.forEach((s) => {
            map[s.date] = s;
          });
          setStatsData(map);
        }
      } catch (err) {
        console.error('Failed to load stats from database:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth, daysInMonth, todayStats]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Build the 7-column calendar matrix (Monday - Sunday)
  let firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay();
  firstDayWeekday = (firstDayWeekday + 6) % 7; // Convert so Monday is 0 and Sunday is 6

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDateStr = today.toISOString().split('T')[0];

  const daysGrid: (DayActivityData | null)[] = useMemo(() => {
    const list: (DayActivityData | null)[] = [];

    let veryHighCount = 0;
    let highCount = 0;
    let loggedCount = 0;

    // Empty cells before the 1st day of month
    for (let i = 0; i < firstDayWeekday; i++) {
      list.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dObj = new Date(currentYear, currentMonth, d);
      dObj.setHours(0, 0, 0, 0);
      const dateStr = dObj.toISOString().split('T')[0];
      const isToday = dateStr === todayDateStr;

      let cals = 0;
      let prot = 0;
      let carbs = 0;
      let fat = 0;
      let hasData = false;

      const backendEntry = statsData[dateStr];
      if (backendEntry && (backendEntry.totalCalories > 0 || backendEntry.totalProtein > 0)) {
        cals = backendEntry.totalCalories;
        prot = Math.round(Number(backendEntry.totalProtein) || 0);
        carbs = Math.round(Number(backendEntry.totalCarbs) || 0);
        fat = Math.round(Number(backendEntry.totalFat) || 0);
        hasData = true;
      } else if (isToday && todayStats && (todayStats.totalCalories > 0 || todayStats.totalProtein > 0)) {
        cals = todayStats.totalCalories || 0;
        prot = Math.round(Number(todayStats.totalProtein) || 0);
        carbs = Math.round(Number(todayStats.totalCarbs) || 0);
        fat = Math.round(Number(todayStats.totalFat) || 0);
        hasData = true;
      }

      const currentVal = mode === 'protein' ? prot : cals;
      const targetVal = mode === 'protein' ? targetProtein : targetCalories;
      const adherencePct = (targetVal > 0 && hasData) ? Math.round((currentVal / targetVal) * 100) : 0;

      // Classify strictly by real logged data
      let tier: AdherenceTier = 'low';
      if (hasData) {
        loggedCount++;
        if (adherencePct >= 100) {
          tier = 'very_high';
          veryHighCount++;
        } else if (adherencePct >= 75) {
          tier = 'high';
          highCount++;
        } else if (adherencePct >= 50) {
          tier = 'moderate';
        } else {
          tier = 'low';
        }
      }

      list.push({
        dateStr,
        dayNumber: d,
        dateObj: dObj,
        totalCalories: cals,
        totalProtein: prot,
        totalCarbs: carbs,
        totalFat: fat,
        targetCalories,
        targetProtein,
        adherencePct,
        tier,
        isToday,
        hasData,
      });
    }

    return list;
  }, [
    currentYear,
    currentMonth,
    daysInMonth,
    firstDayWeekday,
    todayDateStr,
    mode,
    targetCalories,
    targetProtein,
    statsData,
    todayStats,
  ]);

  // Compute month summary metrics cleanly from daysGrid
  const monthMetrics = useMemo(() => {
    let veryHighCount = 0;
    let highCount = 0;
    let loggedCount = 0;

    daysGrid.forEach((day) => {
      if (!day || !day.hasData) return;
      loggedCount++;
      if (day.tier === 'very_high') veryHighCount++;
      else if (day.tier === 'high') highCount++;
    });

    const totalMet = veryHighCount + highCount;
    const hitRate = loggedCount > 0 ? Math.round((totalMet / loggedCount) * 100) : 0;
    return {
      veryHighDays: veryHighCount,
      highDays: highCount,
      totalLoggedDays: loggedCount,
      hitRatePct: hitRate,
    };
  }, [daysGrid]);

  // Safely notify parent using ref to eliminate any infinite re-render loops
  const onMonthStatsRef = useRef(onMonthStatsCalculated);
  useEffect(() => {
    onMonthStatsRef.current = onMonthStatsCalculated;
  }, [onMonthStatsCalculated]);

  useEffect(() => {
    onMonthStatsRef.current?.(monthMetrics);
  }, [monthMetrics.veryHighDays, monthMetrics.highDays, monthMetrics.totalLoggedDays, monthMetrics.hitRatePct]);

  // Color styling matching Image 1
  const getTierClasses = (tier: AdherenceTier, hasData: boolean, isSelected: boolean) => {
    let base = '';
    if (!hasData) {
      base = 'bg-[#F2ECE1] text-[#7A7363] hover:bg-[#EAE2D4]';
    } else {
      switch (tier) {
        case 'very_high':
          base = 'bg-[#FF358B] text-white shadow-[0_2px_8px_rgba(255,53,139,0.35)] hover:bg-[#F4257D]';
          break;
        case 'high':
          base = 'bg-[#98EE38] text-[#163604] hover:bg-[#8AE426]';
          break;
        case 'moderate':
          base = 'bg-[#BAE6FD] text-[#0C4A6E] hover:bg-[#A5DDFB]';
          break;
        case 'low':
        default:
          base = 'bg-[#F2ECE1] text-[#7A7363] hover:bg-[#EAE2D4]';
          break;
      }
    }

    if (isSelected) {
      return `${base} ring-2 ring-[#1E1E24] ring-offset-2 scale-105 z-10`;
    }
    return base;
  };

  // Hover Popover handler
  const handleMouseEnter = (day: DayActivityData, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const clampedX = Math.max(160, Math.min(window.innerWidth - 160, centerX));
    const isFlipped = rect.top < 290;

    setPopoverPos({
      x: clampedX,
      y: isFlipped ? rect.bottom + 10 : rect.top - 10,
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
    const circumference = 2 * Math.PI * r;

    if (!hoveredDay.hasData || totalMacroCals === 0) {
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

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-[#E8E2D2] shadow-sm space-y-6 select-none relative">
      {/* 1. TOP HEADER: "Activity" and "month v" Pill Dropdown */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E1E24] tracking-tight">
              Activity
            </h2>
            {isLoading && (
              <span className="text-[10px] text-[#A09886] font-semibold animate-pulse">
                Syncing with DB...
              </span>
            )}
          </div>
          <p className="text-xs text-[#7A7363] mt-0.5 font-medium">
            Daily goal adherence connected directly to database logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Adherence Mode Pill Toggle */}
          <div className="bg-[#FAF7F0] p-1 rounded-full border border-[#E8E2D2] hidden sm:flex items-center space-x-1">
            <button
              onClick={() => setMode('protein')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-all ${
                mode === 'protein'
                  ? 'bg-[#FF358B] text-white shadow-xs'
                  : 'text-[#7A7363] hover:text-[#1E1E24]'
              }`}
            >
              <Beef className="w-3 h-3" />
              <span>Protein</span>
            </button>
            <button
              onClick={() => setMode('calories')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-all ${
                mode === 'calories'
                  ? 'bg-[#1E1E24] text-white shadow-xs'
                  : 'text-[#7A7363] hover:text-[#1E1E24]'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Calories</span>
            </button>
          </div>

          {/* Month selector dropdown (Styled like "month v" pill in Image 1) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="px-4 py-2 rounded-full bg-[#1E1E24] hover:bg-[#2C2C36] text-white text-xs font-bold flex items-center space-x-1.5 transition-transform active:scale-95 shadow-sm"
            >
              <span>{monthNames[currentMonth].slice(0, 3)} {currentYear}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>

            {isMonthDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1E1E24] text-white border border-[#343440] rounded-2xl p-2 shadow-2xl z-30 space-y-1">
                <div className="flex items-center justify-between px-2 py-1 text-xs font-bold border-b border-[#30303C]">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-[#2E2E3A] rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>{monthNames[currentMonth]} {currentYear}</span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-[#2E2E3A] rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] font-semibold text-center">
                  {monthNames.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => {
                        setCurrentDate(new Date(currentYear, idx, 1));
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`py-1.5 rounded-lg transition-colors ${
                        idx === currentMonth
                          ? 'bg-[#FF358B] text-white font-bold'
                          : 'hover:bg-[#2C2C38] text-white/80'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. WEEKDAYS HEADER (Mon Tue Wed Thu Fri Sat Sun) */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#8C8677] tracking-tight">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* 3. DAYS GRID WITH CIRCULAR BADGES MATCHING IMAGE 1 */}
      <div className="grid grid-cols-7 gap-y-3 sm:gap-y-4 gap-x-2 sm:gap-x-3 text-center">
        {daysGrid.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
          }

          const isSelected = selectedDateStr === day.dateStr;
          const tierClass = getTierClasses(day.tier, day.hasData, isSelected);

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDay?.(day)}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={handleMouseLeave}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-xs sm:text-sm mx-auto transition-transform active:scale-95 relative ${tierClass} ${
                day.isToday ? 'ring-2 ring-[#1E1E24] ring-offset-2' : ''
              }`}
            >
              <span>{day.dayNumber}</span>
              {day.isToday && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#1E1E24]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. LEGEND AT BOTTOM (Very high, High, Moderate, Low) MATCHING IMAGE 1 */}
      <div className="pt-3 border-t border-[#F2ECE0] flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#7A7363]">
        <div className="flex items-center space-x-4 sm:space-x-6 flex-wrap gap-y-2">
          {/* Very High */}
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF358B] shadow-xs" />
            <span className="text-[#1E1E24] font-bold">Very high</span>
          </div>

          {/* High */}
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#98EE38]" />
            <span className="text-[#1E1E24] font-bold">High</span>
          </div>

          {/* Moderate */}
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#BAE6FD]" />
            <span className="text-[#1E1E24] font-bold">Moderate</span>
          </div>

          {/* Low */}
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#F2ECE1] border border-[#DDD6C5]" />
            <span className="text-[#1E1E24] font-bold">Low / Empty</span>
          </div>
        </div>

        <div className="text-[11px] text-[#A09886] font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#FF358B]" />
          <span>Click day for meal breakdown</span>
        </div>
      </div>

      {/* 5. SLEEK HOVER POPOVER WITH MINI DONUT CHART & NUMERIC BREAKDOWN */}
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
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#30303D]">
              <div>
                <p className="text-xs font-black text-white">
                  {hoveredDay.dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-[10px] text-[#A09886]">
                  {hoveredDay.isToday ? "Today's Log" : 'Database Log'}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {(() => {
                  if (!hoveredDay.hasData || hoveredDay.totalCalories === 0) {
                    return (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2A2A36] text-[#A09886]">
                        ⚪ No Entries
                      </span>
                    );
                  }
                  switch (hoveredDay.tier) {
                    case 'very_high':
                      return (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FF358B]/20 text-[#FF65A5] border border-[#FF358B]/30 flex items-center gap-1">
                          <span>🎯 Very High ({hoveredDay.adherencePct}%)</span>
                        </span>
                      );
                    case 'high':
                      return (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#98EE38]/20 text-[#B2F562] border border-[#98EE38]/30">
                          🟢 High ({hoveredDay.adherencePct}%)
                        </span>
                      );
                    case 'moderate':
                      return (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#BAE6FD]/20 text-[#BAE6FD] border border-[#BAE6FD]/30">
                          💧 Moderate ({hoveredDay.adherencePct}%)
                        </span>
                      );
                    case 'low':
                    default:
                      return (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2A2A36] text-[#A09886]">
                          ⚪ Low ({hoveredDay.adherencePct}%)
                        </span>
                      );
                  }
                })()}
              </div>
            </div>

            {/* Mini Donut Chart & Macronutrient Breakdown Split */}
            <div className="flex items-center space-x-3.5">
              {/* SVG Mini Donut Chart */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 64 64">
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
                    mode === 'protein' ? 'bg-[#FF358B]' : 'bg-[#98EE38]'
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
