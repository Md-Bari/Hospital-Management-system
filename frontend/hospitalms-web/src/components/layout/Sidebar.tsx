"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  FlaskConical,
  Pill,
  CreditCard,
  ShieldCheck,
  PhoneCall,
  Link as LinkIcon,
  UserCog,
  ClipboardList,
  BarChart3,
  UsersRound,
  BedDouble,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { appointmentsApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

// ─── Navigation item sets by role ─────────────────────────────────────────────

const adminNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Inpatient / Wards", href: "/ipd", icon: BedDouble },
  { name: "Doctors", href: "/doctors", icon: Stethoscope },
  { name: "Clinical / EHR", href: "/clinical", icon: FileText },
  { name: "Laboratory", href: "/laboratory", icon: FlaskConical },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Roles & RBAC", href: "/settings/roles", icon: ShieldCheck },
  { name: "User Management", href: "/settings/users", icon: UserCog },
  { name: "Activity Logs", href: "/settings/logs", icon: ClipboardList },
  { name: "Executive Summary", href: "/settings/summary", icon: BarChart3 },
];

// Branch manager = same as admin (restriction is on forms only – cannot create BranchManager users)
const branchManagerNavItems = adminNavItems;

const doctorNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inpatient / Wards", href: "/ipd", icon: BedDouble },
  { name: "Clinical / EHR", href: "/clinical", icon: FileText },
];

const nurseNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inpatient / Wards", href: "/ipd", icon: BedDouble },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Clinical / EHR", href: "/clinical", icon: FileText },
];

const receptionistNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inpatient / Wards", href: "/ipd", icon: BedDouble },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

const hrManagerNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Doctors", href: "/doctors", icon: Stethoscope },
  { name: "Staff & Users", href: "/settings/users", icon: UsersRound },
];

export const staffNavigationItems = adminNavItems;

export const patientNavigationItems = [
  { name: "My Health Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Book Appointment", href: "/appointments", icon: Calendar },
  { name: "Specialist Doctors", href: "/doctors", icon: Stethoscope },
  { name: "My Prescriptions", href: "/clinical", icon: FileText },
  { name: "My Lab Reports", href: "/laboratory", icon: FlaskConical },
  { name: "My Invoices & Bills", href: "/billing", icon: CreditCard },
];

export const navigationItems = staffNavigationItems;

function getNavItems(roles: string[]) {
  const has = (r: string) => roles.includes(r);

  if (has("Patient") && !has("SuperAdmin") && !has("HospitalAdmin") && !has("BranchManager")) {
    return patientNavigationItems;
  }
  if (has("SuperAdmin") || has("HospitalAdmin")) return adminNavItems;
  if (has("BranchManager")) return branchManagerNavItems;
  if (has("Doctor")) return doctorNavItems;
  if (has("Nurse")) return nurseNavItems;
  if (has("Receptionist")) return receptionistNavItems;
  if (has("HRManager")) return hrManagerNavItems;
  // All other staff roles – show a sensible subset without admin tools
  return [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inpatient / Wards", href: "/ipd", icon: BedDouble },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Clinical / EHR", href: "/clinical", icon: FileText },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [waitingCount, setWaitingCount] = useState<number | null>(null);

  const roles = user?.roles ?? [];
  const isPatient =
    roles.includes("Patient") &&
    !roles.includes("SuperAdmin") &&
    !roles.includes("HospitalAdmin") &&
    !roles.includes("BranchManager");

  const currentNavItems = getNavItems(roles);

  useEffect(() => {
    if (isPatient) return;
    appointmentsApi
      .getTodayQueue()
      .then((q) => {
        const queue: Array<{ status: string }> = q?.queue ?? [];
        setWaitingCount(queue.filter((a) => a.status === "Confirmed" || a.status === "CheckedIn").length);
      })
      .catch(() => setWaitingCount(null));
  }, [pathname, isPatient]);

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0 px-4 py-6 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Hospital</span>
            <span className="text-xl font-bold tracking-tight text-blue-600">Link</span>
            {isPatient && (
              <span className="block text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                Patient Portal
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {currentNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const badge =
              item.href === "/appointments" && waitingCount && !isPatient ? waitingCount : null;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
                  <span>{item.name}</span>
                </div>
                {badge !== null && (
                  <span
                    title="Patients waiting today"
                    className="min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center"
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Card */}
      {isPatient ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-4 text-white shadow-lg shadow-red-600/15">
          <div className="flex items-center gap-2 mb-1.5">
            <PhoneCall className="w-4 h-4 text-red-200" />
            <p className="text-xs uppercase font-bold tracking-wider text-red-200">24/7 Helpline</p>
          </div>
          <p className="text-sm font-black">+880 2 9660000</p>
          <p className="text-[11px] text-red-100 mt-0.5">Ambulance & Trauma Center</p>
          <a
            href="tel:+88029660000"
            className="mt-3 block text-center w-full bg-white text-red-600 text-xs font-bold py-2 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
          >
            Emergency Call
          </a>
        </div>
      ) : (
        <div className="px-3 py-3 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
          <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{user?.fullName ?? "Staff"}</p>
          <p className="text-[11px] text-slate-400 truncate">{roles.join(", ") || "Staff"}</p>
        </div>
      )}
    </aside>
  );
}
