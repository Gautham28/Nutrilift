import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Bookmark } from 'lucide-react';

interface CalendarWidgetProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onQuickAddFood: () => void;
  onRefresh: () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  onSelectDate,
  onQuickAddFood,
  onRefresh,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get starting weekday (0=Sun, 1=Mon, ..., 6=Sat). We want Monday first (0=Mon...6=Sun)
  let startDay = new Date(year, month, 1).getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  startDay = (startDay + 6) % 7;

  const weekdays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  // Days grid
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  // Weeks breakdown
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  days.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0 || index === days.length - 1) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const isSelected = (d: number | null) => {
    if (!d) return false;
    return (
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  return (
    <div className="bg-[#FAF7F0] p-4 rounded-3xl border border-[#ECE5D6]">
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-full text-[#5B5547] hover:text-[#1E1E24] hover:bg-[#EAE4D5] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-[#1E1E24] tracking-wide px-3 py-1 rounded-full bg-[#F3ECE0]">
          {monthNames[month]} {year}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1 rounded-full text-[#5B5547] hover:text-[#1E1E24] hover:bg-[#EAE4D5] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-8 text-center text-[10px] font-semibold text-[#8C8677] mb-2">
        {weekdays.map((w, idx) => (
          <div key={idx}>{w}</div>
        ))}
        <div className="text-[9px] text-[#A69F90]">WK</div>
      </div>

      {/* Days Table */}
      <div className="space-y-1">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-8 items-center text-center text-xs">
            {week.map((d, dIdx) => {
              if (!d) {
                return <div key={dIdx} className="h-7" />;
              }
              const active = isSelected(d);
              return (
                <button
                  key={dIdx}
                  onClick={() => onSelectDate(new Date(year, month, d))}
                  className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center font-medium transition-all ${
                    active
                      ? 'bg-[#FFAEBF] text-[#1E1E24] font-bold shadow-sm ring-2 ring-[#FFAEBF]/40'
                      : 'text-[#443E33] hover:bg-[#EBE4D5]'
                  }`}
                >
                  {d}
                </button>
              );
            })}
            <span className="text-[9px] text-[#A69F90] font-mono">
              w{22 + wIdx}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons below calendar */}
      <div className="mt-5 flex items-center space-x-2">
        <button
          onClick={onQuickAddFood}
          className="flex-1 py-2 px-3 rounded-full bg-[#1E1E24] hover:bg-[#2F2F38] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add food item</span>
        </button>

        <button
          onClick={onRefresh}
          title="Refresh nutrition"
          className="w-8 h-8 rounded-full border border-[#DCD5C5] hover:bg-[#EDE7D9] flex items-center justify-center text-[#443E33] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          title="Bookmark favorite meal"
          className="w-8 h-8 rounded-full border border-[#DCD5C5] hover:bg-[#EDE7D9] flex items-center justify-center text-[#443E33] transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
