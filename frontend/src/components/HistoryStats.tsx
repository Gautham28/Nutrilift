import React, { useState, useEffect } from 'react';
import { DailyStats, FoodEntry } from '../types';
import { entriesApi } from '../services/api';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Calendar, ChevronRight, Utensils, Sparkles, TrendingUp, Award, Flame, Trash2, Plus } from 'lucide-react';
import { ManualFoodModal } from './ManualFoodModal';

interface HistoryStatsProps {
  refreshKey?: number;
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ refreshKey }) => {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDateEntries, setSelectedDateEntries] = useState<FoodEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  useEffect(() => {
    if (selectedDate) {
      fetchEntriesForDate(selectedDate);
    }
  }, [selectedDate, refreshKey]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await entriesApi.getStats(7);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchEntriesForDate = async (date: string) => {
    setLoadingEntries(true);
    try {
      const data = await entriesApi.getHistory(date);
      setSelectedDateEntries(data);
    } catch (err) {
      console.error('Failed to load history entries', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await entriesApi.deleteEntry(id);
      await fetchEntriesForDate(selectedDate);
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete entry', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Format date for chart labels (e.g. 'Oct 6')
  const chartData = stats.map((s) => {
    const d = new Date(s.date + 'T00:00:00');
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return {
      rawDate: s.date,
      displayDate: dayLabel,
      calories: s.totalCalories,
      protein: Number(s.totalProtein),
      carbs: Number(s.totalCarbs),
      fat: Number(s.totalFat),
      targetCalories: s.targetCalories,
      targetProtein: s.targetProteinG,
    };
  });

  const avgCalories =
    stats.length > 0
      ? Math.round(stats.reduce((acc, cur) => acc + cur.totalCalories, 0) / stats.length)
      : 0;

  const targetCalories = stats.length > 0 ? stats[0].targetCalories : 2000;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>7-Day Average</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{avgCalories}</span>
            <span className="text-xs text-slate-400">kcal / day</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Target is {targetCalories} kcal ({avgCalories <= targetCalories ? 'Within' : 'Exceeding'} goal)
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
            <Flame className="w-4 h-4 text-blue-400" />
            <span>Target Calorie Goal</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">{targetCalories}</span>
            <span className="text-xs text-slate-400">kcal</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Calculated via Mifflin-St Jeor TDEE</p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Active Days Logged</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-300">
              {stats.filter((s) => s.totalCalories > 0).length} / 7
            </span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Consistency builds lifelong fitness</p>
        </div>
      </div>

      {/* Recharts 7-Day Trend Chart */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Calorie Intake (Last 7 Days)</h3>
            <p className="text-xs text-slate-400">Daily calorie consumption compared against your target</p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-300">Calories Consumed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400/80 inline-block" />
              <span className="text-slate-400">Target ({targetCalories} kcal)</span>
            </div>
          </div>
        </div>

        {loadingStats ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
            Loading 7-day analytics...
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-dark-850 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200">{data.displayDate}</p>
                          <p className="text-emerald-400 font-bold">
                            Calories: {data.calories} kcal
                          </p>
                          <p className="text-slate-400">Target: {data.targetCalories} kcal</p>
                          <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex space-x-2 text-[10px]">
                            <span className="text-blue-400">P: {data.protein}g</span>
                            <span className="text-amber-400">C: {data.carbs}g</span>
                            <span className="text-pink-400">F: {data.fat}g</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={targetCalories}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar
                  dataKey="calories"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                  onClick={(data: any) => {
                    const raw = data?.rawDate || data?.payload?.rawDate;
                    if (raw) setSelectedDate(raw);
                  }}
                  className="cursor-pointer hover:opacity-85"
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#34d399' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Date Selector & Daily Entry Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Past Dates List */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Past Dates</h4>
          </div>

          <div className="space-y-1.5">
            {stats.map((s) => {
              const isSelected = s.date === selectedDate;
              const dateObj = new Date(s.date + 'T00:00:00');
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const isToday = s.date === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={s.date}
                  onClick={() => setSelectedDate(s.date)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold shadow-sm'
                      : 'bg-dark-800/60 hover:bg-dark-700/60 border border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="flex items-center space-x-1.5">
                      <span>{formattedDate}</span>
                      {isToday && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                          Today
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      P: {s.totalProtein}g • C: {s.totalCarbs}g • F: {s.totalFat}g
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{s.totalCalories} kcal</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Logged Meals */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white">
                Meals on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h4>
              <p className="text-xs text-slate-400">
                Total for day:{' '}
                <strong className="text-emerald-400 font-bold">
                  {selectedDateEntries.reduce((acc, c) => acc + (c.calories || 0), 0)} kcal
                </strong>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-dark-800 border border-slate-700 text-slate-300">
                {selectedDateEntries.length} logged items
              </span>
              <button
                onClick={() => setManualModalOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm"
                title="Log meal to this date"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Food</span>
              </button>
            </div>
          </div>

          {loadingEntries ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading food entries...</div>
          ) : selectedDateEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
              <Utensils className="w-6 h-6 opacity-40 mb-1" />
              <p>No food entries logged for this date.</p>
              <button
                onClick={() => setManualModalOpen(true)}
                className="text-emerald-400 hover:underline text-xs font-semibold pt-1"
              >
                + Log food to this date
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
              {selectedDateEntries.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs group">
                  <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                    {item.isAiParsed && (
                      <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5 flex-shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate">{item.foodName}</p>
                      <p className="text-[11px] text-slate-400">
                        <span className="capitalize text-emerald-400 font-medium">[{item.mealType.toLowerCase()}]</span>{' '}
                        {item.quantity} {item.unit} • P: {item.proteinG}g • C: {item.carbsG}g • F: {item.fatG}g
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="font-bold text-slate-100">
                      {item.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ManualFoodModal
        isOpen={manualModalOpen}
        initialMealType="LUNCH"
        targetDate={selectedDate}
        onClose={() => setManualModalOpen(false)}
        onEntryAdded={() => {
          fetchEntriesForDate(selectedDate);
          fetchStats();
        }}
      />
    </div>
  );
};
