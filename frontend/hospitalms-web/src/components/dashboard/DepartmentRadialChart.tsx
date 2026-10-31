"use client";

import { ChevronDown } from "lucide-react";

export function DepartmentRadialChart() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-slate-900">Patients by Department</h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Today
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Concentric Gauge SVG & Legend */}
      <div className="flex items-center justify-between gap-4 py-3">
        {/* Concentric Rings Visual */}
        <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background Tracks */}
            <circle cx="80" cy="80" r="70" fill="none" stroke="#F1F5F9" strokeWidth="6" />
            <circle cx="80" cy="80" r="58" fill="none" stroke="#F1F5F9" strokeWidth="6" />
            <circle cx="80" cy="80" r="46" fill="none" stroke="#F1F5F9" strokeWidth="6" />
            <circle cx="80" cy="80" r="34" fill="none" stroke="#F1F5F9" strokeWidth="6" />

            {/* Active Colored Arcs matching Mockup */}
            {/* General Medicine: Blue (outer ring) */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#2563EB"
              strokeWidth="6"
              strokeDasharray="440"
              strokeDashoffset="130"
              strokeLinecap="round"
            />
            {/* Orthopedics: Mint/Teal */}
            <circle
              cx="80"
              cy="80"
              r="58"
              fill="none"
              stroke="#10B981"
              strokeWidth="6"
              strokeDasharray="364"
              strokeDashoffset="120"
              strokeLinecap="round"
            />
            {/* Cardiology: Amber */}
            <circle
              cx="80"
              cy="80"
              r="46"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="6"
              strokeDasharray="289"
              strokeDashoffset="90"
              strokeLinecap="round"
            />
            {/* Gynecology: Coral/Rose (inner ring) */}
            <circle
              cx="80"
              cy="80"
              r="34"
              fill="none"
              stroke="#EF4444"
              strokeWidth="6"
              strokeDasharray="213"
              strokeDashoffset="75"
              strokeLinecap="round"
            />
          </svg>

          {/* Central Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">320</span>
            <span className="text-xs font-semibold text-slate-400">Total</span>
          </div>
        </div>

        {/* Legend on the right */}
        <div className="space-y-3 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB] flex-shrink-0"></span>
            <span>General Medicine</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] flex-shrink-0"></span>
            <span>Orthopedics</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] flex-shrink-0"></span>
            <span>Cardiology</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] flex-shrink-0"></span>
            <span>Gynecology</span>
          </div>
        </div>
      </div>
    </div>
  );
}

