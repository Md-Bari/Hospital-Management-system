"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, RefreshCw } from "lucide-react";
import { dashboardApi, billingApi, getApiError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month";

interface TrendItem {
  date: string;
  male?: number;
  female?: number;
  children?: number;
  other?: number;
  total?: number;
}

interface BillingSummary {
  totalRevenue?: number;
  totalRevenueDisplay?: string;
  pendingRevenue?: number;
  pendingRevenueDisplay?: string;
  paidInvoices?: number;
  unpaidInvoices?: number;
  totalInvoices?: number;
}

export default function ExecutiveSummaryPage() {
  const { hasAnyRole } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [billing, setBilling] = useState<BillingSummary>({});
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canView = hasAnyRole(["SuperAdmin", "HospitalAdmin", "BranchManager"]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [statsRes, trendsRes, billingRes] = await Promise.all([
        dashboardApi.getStats().catch(() => ({})),
        dashboardApi.getTrends().catch(() => []),
        billingApi.getSummary().catch(() => ({})),
      ]);
      setStats(statsRes ?? {});
      setTrends(Array.isArray(trendsRes) ? trendsRes : (trendsRes?.trends ?? []));
      setBilling(billingRes ?? {});
    } catch (err) {
      setError(getApiError(err, "Failed to load executive summary."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!canView) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        You do not have permission to view this page.
      </div>
    );
  }

  // Filter trends by period
  const now = new Date();
  const filteredTrends = trends.filter((t) => {
    const d = new Date(t.date);
    if (period === "today") return d.toDateString() === now.toDateString();
    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    return d >= monthAgo;
  });

  const totalPatients = filteredTrends.reduce(
    (s, t) => s + (t.total ?? (t.male ?? 0) + (t.female ?? 0) + (t.children ?? 0) + (t.other ?? 0)),
    0
  );

  // Bar chart max
  const maxCount = Math.max(
    ...filteredTrends.map((t) => t.total ?? (t.male ?? 0) + (t.female ?? 0) + (t.children ?? 0) + (t.other ?? 0)),
    1
  );

  const fmtCurrency = (val?: number) =>
    val !== undefined ? `৳ ${val.toLocaleString("en-BD")}` : "—";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Executive Summary
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Business performance — revenue, patient count & appointment trends
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-2xl text-red-600 text-xs border border-red-200">{error}</div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: billing.totalRevenueDisplay ?? fmtCurrency(billing.totalRevenue),
            sub: `${billing.paidInvoices ?? 0} paid invoices`,
            icon: DollarSign,
            color: "emerald",
          },
          {
            label: "Pending Revenue",
            value: billing.pendingRevenueDisplay ?? fmtCurrency(billing.pendingRevenue),
            sub: `${billing.unpaidInvoices ?? 0} unpaid invoices`,
            icon: TrendingUp,
            color: "amber",
          },
          {
            label: "Total Patients",
            value: stats.totalPatients ?? "—",
            sub: `${stats.newPatientsToday ?? 0} new today`,
            icon: Users,
            color: "blue",
          },
          {
            label: "Today's Appointments",
            value: stats.todayAppointments ?? "—",
            sub: `${stats.completedToday ?? 0} completed`,
            icon: Calendar,
            color: "slate",
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                color === "amber" ? "bg-amber-50 text-amber-600" :
                color === "blue" ? "bg-blue-50 text-blue-600" :
                "bg-slate-100 text-slate-500"
              )}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{loading ? "…" : value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Period:</span>
        {(["today", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors",
              period === p ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {p === "today" ? "Today" : p === "week" ? "Last 7 Days" : "Last 30 Days"}
          </button>
        ))}
      </div>

      {/* Patient Count Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-sm text-slate-800">Patient Visit Trends</h2>
            <p className="text-xs text-slate-400 mt-0.5">{totalPatients} patients in selected period</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            {[
              { key: "male", color: "bg-blue-500", label: "Male" },
              { key: "female", color: "bg-pink-500", label: "Female" },
              { key: "children", color: "bg-amber-500", label: "Children" },
              { key: "other", color: "bg-slate-400", label: "Other" },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1 text-slate-500">
                <span className={cn("w-2.5 h-2.5 rounded-sm", color)} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading chart…</div>
        ) : filteredTrends.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data for selected period.</div>
        ) : (
          <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
            {filteredTrends.map((t, i) => {
              const m = t.male ?? 0;
              const f = t.female ?? 0;
              const c = t.children ?? 0;
              const o = t.other ?? 0;
              const total = t.total ?? (m + f + c + o);
              const barH = maxCount > 0 ? (total / maxCount) * 160 : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 28 }}>
                  <span className="text-[10px] text-slate-500 font-semibold">{total || ""}</span>
                  <div className="flex flex-col-reverse w-5 rounded-t-sm overflow-hidden" style={{ height: Math.max(barH, 2) }}>
                    <div className="bg-blue-500" style={{ height: `${(m / (total || 1)) * 100}%` }} />
                    <div className="bg-pink-500" style={{ height: `${(f / (total || 1)) * 100}%` }} />
                    <div className="bg-amber-500" style={{ height: `${(c / (total || 1)) * 100}%` }} />
                    <div className="bg-slate-400" style={{ height: `${(o / (total || 1)) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-400 -rotate-45 origin-top-left truncate w-8">
                    {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Billing Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Invoices", value: billing.totalInvoices ?? 0, bg: "bg-slate-50", text: "text-slate-700" },
          { label: "Paid Invoices", value: billing.paidInvoices ?? 0, bg: "bg-emerald-50", text: "text-emerald-700" },
          { label: "Unpaid Invoices", value: billing.unpaidInvoices ?? 0, bg: "bg-amber-50", text: "text-amber-700" },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={cn("rounded-2xl p-5 border", bg, "border-slate-100")}>
            <p className={cn("text-xs font-semibold", text)}>{label}</p>
            <p className={cn("text-3xl font-bold mt-1", text)}>{loading ? "…" : value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
