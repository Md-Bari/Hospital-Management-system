"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { appointmentsApi, AppointmentItem, localDateString } from "@/lib/api-client";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const lastOfMonth = new Date(year, month + 1, 0);
  const cellCount = Math.ceil((first.getDay() + lastOfMonth.getDate()) / 7) * 7;
  return Array.from({ length: cellCount }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date, isCurrentMonth: date.getMonth() === month };
  });
}

export function MiniCalendarAgenda() {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(today);
  const [appointments, setAppointments] = useState<AppointmentItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const selectedKey = localDateString(selected);
  const todayKey = localDateString(today);
  const days = useMemo(() => buildMonthGrid(viewMonth.year, viewMonth.month), [viewMonth]);

  useEffect(() => {
    setAppointments(null);
    setFailed(false);
    appointmentsApi
      .getAppointments({ date: selectedKey, pageSize: 50 })
      .then((res) => setAppointments(res?.items ?? []))
      .catch(() => setFailed(true));
  }, [selectedKey]);

  const shiftMonth = (delta: number) => {
    setViewMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const activeAppointments = appointments?.filter((a) => a.status !== "Cancelled") ?? [];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col h-full">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-2">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 text-center text-xs gap-y-1 mb-6">
        {days.map(({ date, isCurrentMonth }) => {
          const key = localDateString(date);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          return (
            <div key={key} className="h-7 flex items-center justify-center">
              <button
                onClick={() => setSelected(date)}
                className={
                  isSelected
                    ? "w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/30"
                    : `w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? "ring-1 ring-blue-300 text-blue-700 font-bold" : ""
                      } ${isCurrentMonth ? "text-slate-700 hover:text-blue-600 font-medium" : "text-slate-300"}`
                }
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Agenda Header */}
      <div className="border-t border-slate-100 pt-4 mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">
          {selected.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">{activeAppointments.length} appointments</span>
      </div>

      {/* Day's appointments */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {failed && <p className="text-xs text-rose-500">Could not load appointments.</p>}
        {!failed && !appointments && <p className="text-xs text-slate-400">Loading…</p>}
        {appointments && activeAppointments.length === 0 && (
          <p className="text-xs text-slate-400 py-2">No appointments booked for this day.</p>
        )}
        {activeAppointments.map((a) => (
          <div key={a.id} className="flex items-start gap-3">
            <span className="text-[11px] font-semibold text-slate-400 w-10 pt-1.5 flex-shrink-0">
              {a.timeSlot.split(" - ")[0]}
            </span>
            <div
              className={`flex-1 rounded-xl p-2.5 shadow-sm ${
                a.status === "Completed" ? "bg-slate-100 text-slate-600" : "bg-blue-600 text-white"
              }`}
            >
              <p className="text-xs font-bold leading-tight">
                #{a.queueSerialNumber} {a.patient.fullName}
              </p>
              <p className={`text-[10px] mt-0.5 ${a.status === "Completed" ? "text-slate-400" : "text-blue-100"}`}>
                {a.doctor.fullName} • {a.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
