"use client";

import { useEffect, useState } from "react";
import { Users, Stethoscope, Calendar, FlaskConical, Pill } from "lucide-react";
import { dashboardApi } from "@/lib/api-client";

interface StatValue {
  count: number;
  label: string;
  detail?: string;
}

interface StatsData {
  patients: StatValue;
  doctors: StatValue;
  todayAppointments: StatValue;
  pendingLabOrders: StatValue;
  lowStockMedicines: StatValue;
}

export function StatCards() {
  const [data, setData] = useState<StatsData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => setData(res))
      .catch(() => setFailed(true));
  }, []);

  const stats = [
    { key: "patients", fallbackTitle: "Patients", icon: Users },
    { key: "doctors", fallbackTitle: "Doctors", icon: Stethoscope },
    { key: "todayAppointments", fallbackTitle: "Today's Appointments", icon: Calendar },
    { key: "pendingLabOrders", fallbackTitle: "Pending Lab Orders", icon: FlaskConical },
    { key: "lowStockMedicines", fallbackTitle: "Low Stock Medicines", icon: Pill },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = data?.[stat.key];
        return (
          <div
            key={stat.key}
            className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {value ? value.count.toLocaleString() : failed ? "—" : "…"}
              </p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{value?.label ?? stat.fallbackTitle}</p>
              {value?.detail && <p className="text-[11px] text-emerald-600 font-medium">{value.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
