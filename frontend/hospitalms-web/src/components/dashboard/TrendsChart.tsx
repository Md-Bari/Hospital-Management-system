"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

const trendData = [
  { name: "13 Apr", Male: 17, Female: 23, Children: 28 },
  { name: "14 Apr", Male: 25, Female: 12, Children: 18 },
  { name: "15 Apr", Male: 27, Female: 34, Children: 16 },
  { name: "16 Apr", Male: 6, Female: 18, Children: 36 },
  { name: "17 Apr", Male: 26, Female: 32, Children: 42 },
  { name: "18 Apr", Male: 34, Female: 26, Children: 29 },
  { name: "19 Apr", Male: 24, Female: 32, Children: 14 },
];

export function TrendsChart() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">Total Trends</h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Last week
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Chart */}
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} barGap={3} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              domain={[0, 40]}
              ticks={[0, 10, 20, 30, 40]}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid #F1F5F9",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="Male" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Female" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Children" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-50 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]"></span>
          <span>Male</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]"></span>
          <span>Female</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]"></span>
          <span>Children</span>
        </div>
      </div>
    </div>
  );
}

