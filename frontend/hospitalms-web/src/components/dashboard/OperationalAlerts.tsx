"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MoreHorizontal, Flame, Ambulance, Sparkles, UserCheck } from "lucide-react";
import { dashboardApi } from "@/lib/api-client";

interface AlertItem {
  id: number;
  title: string;
  time: string;
  type?: string;
}

const fallbackAlerts: AlertItem[] = [
  {
    id: 1,
    title: "Oxygen Cylinder Refill Needed",
    time: "10 minutes ago",
    type: "oxygen",
  },
  {
    id: 2,
    title: "Ambulance Dispatched",
    time: "30 minutes ago",
    type: "ambulance",
  },
  {
    id: 3,
    title: "Room Cleaning Needed",
    time: "1 hour ago",
    type: "cleaning",
  },
  {
    id: 4,
    title: "Patient Transport Required",
    time: "Yesterday",
    type: "transport",
  },
];

export function OperationalAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>(fallbackAlerts);

  useEffect(() => {
    dashboardApi.getAlerts()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setAlerts(res);
        }
      })
      .catch(() => {});
  }, []);

  const getIcon = (type?: string, title?: string) => {
    const t = (type || title || "").toLowerCase();
    if (t.includes("ambulance")) return Ambulance;
    if (t.includes("cleaning") || t.includes("room")) return Sparkles;
    if (t.includes("transport") || t.includes("patient")) return UserCheck;
    return Flame;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Report</h3>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-3.5">
        {alerts.map((report) => {
          const Icon = getIcon(report.type, report.title);
          return (
            <div
              key={report.id || report.title}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-blue-500/20">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {report.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{report.time}</p>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
