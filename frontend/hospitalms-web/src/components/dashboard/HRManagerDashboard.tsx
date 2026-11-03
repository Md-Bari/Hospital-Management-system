"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Users, UserCheck, Activity } from "lucide-react";
import { doctorsApi, usersApi, DoctorItem, UserListItem, getApiError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const STAFF_ROLES = [
  "Nurse", "Receptionist", "Pharmacist", "LabTechnician", "BloodBankTechnician",
  "Radiologist", "Physiotherapist", "Dietitian", "SocialWorker", "MedicalCoder",
  "HRManager", "Cashier", "Accountant", "ITStaff",
];

export function HRManagerDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [docRes, userRes] = await Promise.all([
          doctorsApi.getDoctors({}),
          usersApi.getUsers({ pageSize: 200 }),
        ]);
        setDoctors(docRes ?? []);
        setAllUsers(userRes?.items ?? []);
      } catch (err) {
        setError(getApiError(err, "Failed to load HR data."));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const staffUsers = allUsers.filter((u) =>
    u.roles.some((r) => STAFF_ROLES.includes(r))
  );
  const activeStaff = staffUsers.filter((u) => u.isActive).length;
  const departmentMap: Record<string, number> = {};
  allUsers.forEach((u) => {
    if (u.departmentName) {
      departmentMap[u.departmentName] = (departmentMap[u.departmentName] ?? 0) + 1;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading HR dashboard…
      </div>
    );
  }

  if (error) {
    return <div className="p-6 bg-red-50 rounded-2xl text-red-600 text-sm border border-red-200">{error}</div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          HR Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Welcome, {user?.fullName ?? "HR Manager"} · Staff performance and department overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Doctors", value: doctors.length, icon: Stethoscope, color: "blue" },
          { label: "Available Now", value: doctors.filter((d) => d.isAvailable).length, icon: Activity, color: "emerald" },
          { label: "Total Staff", value: staffUsers.length, icon: Users, color: "slate" },
          { label: "Active Staff", value: activeStaff, icon: UserCheck, color: "amber" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              color === "blue" ? "bg-blue-50 text-blue-600" :
              color === "emerald" ? "bg-emerald-50 text-emerald-600" :
              color === "amber" ? "bg-amber-50 text-amber-600" :
              "bg-slate-100 text-slate-500"
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Doctors List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Doctors Roster
            </h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {doctors.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{d.fullName}</p>
                  <p className="text-xs text-slate-400">{d.specialization} · {d.departmentName}</p>
                </div>
                <span className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                  d.isAvailable
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {d.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff by Department */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Staff by Department
            </h2>
          </div>
          {Object.keys(departmentMap).length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">No department data available.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {Object.entries(departmentMap)
                .sort(([, a], [, b]) => b - a)
                .map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm font-semibold text-slate-800">{dept}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((count / (allUsers.length || 1)) * 100 * 5, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Members Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            All Staff Members
          </h2>
        </div>
        {staffUsers.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">No staff members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{u.roles.join(", ")}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{u.departmentName ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
