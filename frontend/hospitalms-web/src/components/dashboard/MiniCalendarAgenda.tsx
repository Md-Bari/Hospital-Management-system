"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function MiniCalendarAgenda() {
  const [selectedDay] = useState(22);

  // Calendar days grid for April 2025
  const calendarDays = [
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true, isSelected: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col h-full">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">April 2025</h3>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-2">
        <span>SUN</span>
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 text-center text-xs gap-y-1 mb-6">
        {calendarDays.map((item, idx) => (
          <div key={idx} className="h-7 flex items-center justify-center">
            {item.isSelected ? (
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/30">
                {item.day}
              </span>
            ) : (
              <span
                className={
                  item.isCurrentMonth
                    ? "text-slate-700 hover:text-blue-600 font-medium cursor-pointer"
                    : "text-slate-300"
                }
              >
                {item.day}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Agenda Header */}
      <div className="border-t border-slate-100 pt-4 mb-4">
        <h4 className="text-sm font-bold text-slate-900">Tuesday, {selectedDay} April</h4>
      </div>

      {/* Time Slot Schedule matching Mockup */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {/* 08:00 Item */}
        <div className="flex items-start gap-3">
          <span className="text-[11px] font-semibold text-slate-400 w-10 pt-1.5 flex-shrink-0">08:00</span>
          <div className="flex-1 bg-blue-600 text-white rounded-xl p-2.5 shadow-sm">
            <p className="text-xs font-bold leading-tight">Morning Staff Meeting</p>
            <p className="text-[10px] text-blue-100 mt-0.5">08:00 AM - 09:00 AM</p>
          </div>
        </div>

        {/* 09:00 Empty Slot */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-400 w-10 flex-shrink-0">09:00</span>
          <div className="flex-1 h-8 rounded-xl bg-slate-50/70 border border-dashed border-slate-200"></div>
        </div>

        {/* 10:00 Item */}
        <div className="flex items-start gap-3">
          <span className="text-[11px] font-semibold text-slate-400 w-10 pt-1.5 flex-shrink-0">10:00</span>
          <div className="flex-1 bg-blue-700 text-white rounded-xl p-2.5 shadow-sm">
            <p className="text-xs font-bold leading-tight">Surgery - Orthopedics</p>
            <p className="text-[10px] text-blue-200 mt-0.5">Dr. Michael Anderson</p>
            <p className="text-[10px] text-blue-200 mt-0.5">10:00 AM - 12:00 PM</p>
          </div>
        </div>

        {/* 12:00 Empty Slot */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-400 w-10 flex-shrink-0">12:00</span>
          <div className="flex-1 h-8 rounded-xl bg-slate-50/70 border border-dashed border-slate-200"></div>
        </div>

        {/* 01:00 Item */}
        <div className="flex items-start gap-3">
          <span className="text-[11px] font-semibold text-slate-400 w-10 pt-1.5 flex-shrink-0">01:00</span>
          <div className="flex-1 bg-blue-600 text-white rounded-xl p-2.5 shadow-sm">
            <p className="text-xs font-bold leading-tight">Training Session (Dr. Olivia)</p>
            <p className="text-[10px] text-blue-100 mt-0.5">01:00 PM - 02:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

