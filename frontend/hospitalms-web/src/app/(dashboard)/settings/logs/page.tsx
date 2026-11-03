"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, RefreshCw, Clock, UserCheck, Activity } from "lucide-react";
import { usersApi, UserListItem, getApiError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

export default function ActivityLogsPage() {
  const { hasAnyRole } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const canView = hasAnyRole(["SuperAdmin", "HospitalAdmin", "BranchManager"]);

  const load = async (q = search) => {
    try {
      setLoading(true);
      setError("");
      const res = await usersApi.getUsers({ pageSize: 100, search: q || undefined });
      const items: UserListItem[] = res?.items ?? [];
      // Sort by last login (most recent first), then joined date
      items.sort((a, b) => {
        const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return bTime - aTime;
      });
      setUsers(items);
      setTotal(res?.total ?? 0);
    } catch (err) {
      setError(getApiError(err, "Failed to load activity log."));
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

  const activeToday = users.filter((u) => {
    if (!u.lastLoginAt) return false;
    const d = new Date(u.lastLoginAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Activity Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            System user activity and last-login tracking
          </p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: total, icon: UserCheck, color: "blue" },
          { label: "Active Today", value: activeToday, icon: Activity, color: "emerald" },
          { label: "Inactive Users", value: users.filter((u) => !u.isActive).length, icon: Clock, color: "amber" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              color === "blue" ? "bg-blue-50 text-blue-600" :
              color === "emerald" ? "bg-emerald-50 text-emerald-600" :
              "bg-amber-50 text-amber-600"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className="text-xl font-bold text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-2xl text-red-600 text-xs border border-red-200">{error}</div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        />
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading activity data…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Roles</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Last Login</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isOnlineToday = u.lastLoginAt
                    ? new Date(u.lastLoginAt).toDateString() === new Date().toDateString()
                    : false;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            isOnlineToday ? "bg-emerald-500" : "bg-slate-300"
                          )} />
                          <div>
                            <p className="font-semibold text-slate-900">{u.fullName}</p>
                            <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{u.departmentName ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {fmtDateTime(u.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {u.lastLoginAt ? (
                          <div>
                            <p className="text-slate-800 font-medium">{fmtDateTime(u.lastLoginAt)}</p>
                            {isOnlineToday && (
                              <p className="text-emerald-600 font-semibold text-[11px]">Active today</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Never logged in</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                          u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
