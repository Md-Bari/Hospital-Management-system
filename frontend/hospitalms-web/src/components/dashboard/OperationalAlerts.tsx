"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pill, FlaskConical, CreditCard, Bell, CheckCircle2 } from "lucide-react";
import { dashboardApi } from "@/lib/api-client";

interface AlertItem {
  id: string;
  title: string;
  time: string;
  type: string;
  urgency: "high" | "medium" | "low";
  href: string;
}

const ICONS: Record<string, typeof Bell> = {
  stock: Pill,
  lab: FlaskConical,
  billing: CreditCard,
};

const URGENCY_STYLES: Record<AlertItem["urgency"], string> = {
  high: "bg-rose-500 shadow-rose-500/20",
  medium: "bg-amber-500 shadow-amber-500/20",
  low: "bg-blue-600 shadow-blue-500/20",
};

export function OperationalAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    dashboardApi
      .getAlerts()
      .then((res) => setAlerts(Array.isArray(res) ? res : []))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Operational Alerts</h3>
        {alerts && alerts.length > 0 && (
          <span className="text-[11px] font-semibold text-slate-400">{alerts.length} open</span>
        )}
      </div>

      {/* List */}
      <div className="space-y-3.5">
        {failed && <p className="text-xs text-rose-500">Could not load alerts.</p>}
        {!failed && !alerts && <p className="text-xs text-slate-400">Loading…</p>}
        {alerts?.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium py-4">
            <CheckCircle2 className="w-4 h-4" />
            All clear: no stock, lab, or billing issues.
          </div>
        )}
        {alerts?.map((alert) => {
          const Icon = ICONS[alert.type] ?? Bell;
          return (
            <Link
              key={alert.id}
              href={alert.href}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                    URGENCY_STYLES[alert.urgency] ?? URGENCY_STYLES.low
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {alert.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{alert.time}</p>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
