"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "@/lib/api-client";

interface TrendPoint {
  date: string;
  male: number;
  female: number;
  children: number;
  other: number;
}

const SERIES = [
  { key: "male", label: "Male", color: "#2563EB" },
  { key: "female", label: "Female", color: "#10B981" },
  { key: "children", label: "Children (<18)", color: "#F59E0B" },
  { key: "other", label: "Other", color: "#8B5CF6" },
] as const;

export function TrendsChart() {
  const [data, setData] = useState<TrendPoint[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    dashboardApi
      .getTrends()
      .then((res) => setData(Array.isArray(res) ? res : []))
      .catch(() => setFailed(true));
  }, []);

  const total = data?.reduce((sum, d) => sum + d.male + d.female + d.children + d.other, 0) ?? 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Appointment Trends</h2>
          <p className="text-xs text-slate-400">Last 7 days • {total} visits</p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-56">
        {failed ? (
          <div className="h-full flex items-center justify-center text-xs text-rose-500">Could not load trends.</div>
        ) : !data ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={3} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} allowDecimals={false} />
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
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-50 text-xs font-medium text-slate-600">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }}></span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
