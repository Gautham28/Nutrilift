import React, { useState, useEffect, useCallback } from 'react';
import { ActivityCalendar, DayActivityData } from './ActivityCalendar';
import { FoodEntry, User } from '../types';
import { entriesApi } from '../services/api';
import {
  Calendar,
  Sparkles,
  ArrowLeft,
  Flame,
  Beef,
  Wheat,
  Droplet,
  CheckCircle2,
  TrendingUp,
  Award,
} from 'lucide-react';

interface ActivityCalendarPageProps {
  user: User | null;
  todayStats?: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
  onBackToDashboard: () => void;
  onOpenTargetModal: () => void;
}

export const ActivityCalendarPage: React.FC<ActivityCalendarPageProps> = ({
  user,
  todayStats,
  onBackToDashboard,
  onOpenTargetModal,
}) => {
  const targetCalories = user?.targetCalories || 2000;
  const targetProtein = user?.targetProteinG || 130;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDay, setSelectedDay] = useState<DayActivityData | null>(null);
  const [dayEntries, setDayEntries] = useState<FoodEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [monthStats, setMonthStats] = useState({
    veryHighDays: 0,
    highDays: 0,
    totalLoggedDays: 0,
    hitRatePct: 0,
  });

  const handleMonthStatsCalculated = useCallback(
    (stats: { veryHighDays: number; highDays: number; totalLoggedDays: number; hitRatePct: number }) => {
      setMonthStats((prev) => {
        if (
          prev.veryHighDays === stats.veryHighDays &&
          prev.highDays === stats.highDays &&
          prev.totalLoggedDays === stats.totalLoggedDays &&
          prev.hitRatePct === stats.hitRatePct
        ) {
          return prev;
        }
        return stats;
      });
    },
    []
  );

  // Fetch entries for selected day
  useEffect(() => {
    if (!selectedDay) return;
    const loadEntries = async () => {
      setIsLoadingEntries(true);
      try {
        const entries = await entriesApi.getHistory(selectedDay.dateStr);
        setDayEntries(entries || []);
      } catch {
        setDayEntries([]);
      } finally {
        setIsLoadingEntries(false);
      }
    };
    loadEntries();
  }, [selectedDay]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E2D2]">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="w-9 h-9 rounded-2xl bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E2DBD0] flex items-center justify-center text-[#1E1E24] transition-transform active:scale-95 shadow-xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#8C8677] uppercase tracking-wider">
                NutriLift Schedule
              </span>
              <span className="text-xs text-[#C5BDB0]">•</span>
              <span className="text-xs font-bold text-[#FF358B] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Monthly Adherence
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E1E24] tracking-tight">
              Activity & Nutrition Calendar
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTargetModal}
            className="px-3.5 py-1.5 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E2DBD0] text-xs font-bold text-[#1E1E24] shadow-xs transition-colors"
          >
            Targets: {targetCalories} kcal • {targetProtein}g P
          </button>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-1.5 rounded-full bg-[#1E1E24] hover:bg-[#2C2C38] text-white text-xs font-bold transition-transform active:scale-95 shadow-sm"
          >
            View Dashboard
          </button>
        </div>
      </div>

      {/* 2. CALENDAR + SIDE PANEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: The Activity Calendar (Image 1 replica) */}
        <div className="lg:col-span-7 space-y-4">
          <ActivityCalendar
            targetCalories={targetCalories}
            targetProtein={targetProtein}
            todayStats={todayStats}
            selectedDateStr={selectedDay?.dateStr}
            onSelectDay={(day) => setSelectedDay(day)}
            onMonthStatsCalculated={handleMonthStatsCalculated}
          />
        </div>

        {/* Right Column: Selected Day Detail & Monthly Insights */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Day Overview Card */}
          <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#E8E2D2] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE3]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#E8E2D2] flex items-center justify-center text-[#1E1E24]">
                  <Calendar className="w-4 h-4 text-[#1E1E24]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1E1E24]">
                    {selectedDay
                      ? selectedDay.dateObj.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Today’s Overview'}
                  </h3>
                  <p className="text-[10px] text-[#8C8677]">
                    {selectedDay?.dateStr === todayStr ? 'Current Active Day' : 'Day Nutrition Summary'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {selectedDay && (
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                    selectedDay.tier === 'very_high'
                      ? 'bg-[#FF358B]/15 text-[#FF358B]'
                      : selectedDay.tier === 'high'
                      ? 'bg-[#98EE38]/20 text-[#1F5403]'
                      : selectedDay.tier === 'moderate'
                      ? 'bg-[#BAE6FD]/30 text-[#0369A1]'
                      : 'bg-[#F2ECE1] text-[#7A7363]'
                  }`}
                >
                  {selectedDay.tier === 'very_high' && '🎯 Very High'}
                  {selectedDay.tier === 'high' && '🟢 High Adherence'}
                  {selectedDay.tier === 'moderate' && '💧 Moderate'}
                  {selectedDay.tier === 'low' && '⚪ Low / Rest'}
                </span>
              )}
            </div>

            {/* Quick 4 Macro Pill Counters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#ECE5D6]">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#8C8677]">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Calories</span>
                </div>
                <p className="text-lg font-black text-[#1E1E24] mt-0.5">
                  {selectedDay ? selectedDay.totalCalories : todayStats?.totalCalories || 0}
                  <span className="text-xs font-bold text-[#8C8677] ml-1">/ {targetCalories}</span>
                </p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#ECE5D6]">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#8C8677]">
                  <Beef className="w-3.5 h-3.5 text-rose-500" />
                  <span>Protein</span>
                </div>
                <p className="text-lg font-black text-[#1E1E24] mt-0.5">
                  {selectedDay ? selectedDay.totalProtein : Math.round(Number(todayStats?.totalProtein) || 0)}g
                  <span className="text-xs font-bold text-[#8C8677] ml-1">/ {targetProtein}g</span>
                </p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#ECE5D6]">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#8C8677]">
                  <Wheat className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Carbs</span>
                </div>
                <p className="text-lg font-black text-[#1E1E24] mt-0.5">
                  {selectedDay ? selectedDay.totalCarbs : Math.round(Number(todayStats?.totalCarbs) || 0)}g
                </p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#ECE5D6]">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#8C8677]">
                  <Droplet className="w-3.5 h-3.5 text-blue-500" />
                  <span>Fats</span>
                </div>
                <p className="text-lg font-black text-[#1E1E24] mt-0.5">
                  {selectedDay ? selectedDay.totalFat : Math.round(Number(todayStats?.totalFat) || 0)}g
                </p>
              </div>
            </div>

            {/* Logged Foods List for this day */}
            <div className="pt-2 border-t border-[#F5EFE3] space-y-2">
              <h4 className="text-xs font-extrabold text-[#1E1E24] flex items-center justify-between">
                <span>Logged Items</span>
                <span className="text-[10px] text-[#8C8677] font-semibold">
                  {dayEntries.length} items
                </span>
              </h4>

              {isLoadingEntries ? (
                <p className="text-center py-4 text-xs text-[#8C8677]">Loading meals...</p>
              ) : dayEntries.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#ECE5D6] text-center text-xs text-[#8C8677]">
                  {selectedDay
                    ? `No detailed meals recorded on ${selectedDay.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`
                    : 'Select any day from the calendar to view its logged food history.'}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {dayEntries.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl bg-[#FAF7F0] border border-[#ECE5D6] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-[#1E1E24] truncate">{item.foodName}</p>
                        <p className="text-[10px] text-[#8C8677]">
                          {item.quantity} {item.unit} • {item.proteinG}g P
                        </p>
                      </div>
                      <span className="font-black text-[#1E1E24] text-xs shrink-0">
                        {item.calories} kcal
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Achievement & Progress Card */}
          <div className="bg-[#FAF7F0] rounded-[32px] p-5 border border-[#ECE5D6] space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF358B] text-white flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-[#1E1E24] uppercase tracking-wider">
                Monthly Achievement
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#E8E2D2]">
                <span className="text-[#7A7363] font-medium">Very High Days</span>
                <span className="font-black text-[#FF358B]">
                  {monthStats.veryHighDays} {monthStats.veryHighDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#E8E2D2]">
                <span className="text-[#7A7363] font-medium">High Adherence Days</span>
                <span className="font-black text-[#1F5403]">
                  {monthStats.highDays} {monthStats.highDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#E8E2D2]">
                <span className="text-[#7A7363] font-medium">Active Logged Days</span>
                <span className="font-black text-[#1E1E24]">
                  {monthStats.totalLoggedDays} {monthStats.totalLoggedDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#E8E2D2]">
                <span className="text-[#7A7363] font-medium">Total Goal Hit Rate</span>
                <span className="font-black text-[#1E1E24]">{monthStats.hitRatePct}%</span>
              </div>
            </div>

            <div className="pt-1 flex items-center space-x-2 text-[11px] text-[#7A7363]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Consistency is the #1 driver for muscle growth & fat loss.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
