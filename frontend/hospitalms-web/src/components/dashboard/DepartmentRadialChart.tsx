"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

interface DepartmentSlice {
  name: string;
  value: number;
  color: string;
}

const TIME_FILTERS = ["Today", "This Week", "This Month"];
const RING_RADII = [70, 58, 46, 34];

export function DepartmentRadialChart() {
  const [timeFilter, setTimeFilter] = useState("Today");
  const [total, setTotal] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DepartmentSlice[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    dashboardApi
      .getDepartmentStats(timeFilter)
      .then((res) => {
        setTotal(res?.total ?? 0);
        setDepartments(res?.departments ?? []);
      })
      .catch(() => setFailed(true));
  }, [timeFilter]);

  const rings = departments.slice(0, RING_RADII.length);
  const max = Math.max(1, ...rings.map((d) => d.value));

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-slate-900">Patients by Department</h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none"
        >
          {TIME_FILTERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-4 py-3">
        {/* Concentric rings: each ring's arc is proportional to the busiest department */}
        <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {RING_RADII.map((r) => (
              <circle key={`track-${r}`} cx="80" cy="80" r={r} fill="none" stroke="#F1F5F9" strokeWidth="6" />
            ))}
            {rings.map((d, i) => {
              const r = RING_RADII[i];
              const circumference = 2 * Math.PI * r;
              const fraction = d.value / max;
              return (
                <circle
                  key={d.name}
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - fraction * 0.85)}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {failed ? "—" : total ?? "…"}
            </span>
            <span className="text-xs font-semibold text-slate-400">Visits</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3 text-xs font-medium text-slate-700 min-w-0">
          {failed ? (
            <p className="text-rose-500">Could not load department stats.</p>
          ) : rings.length === 0 ? (
            <p className="text-slate-400">No appointments in this period.</p>
          ) : (
            rings.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                <span className="truncate">{d.name}</span>
                <span className="ml-auto pl-2 font-bold text-slate-900">{d.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
