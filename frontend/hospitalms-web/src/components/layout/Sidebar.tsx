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
  Sparkles,
  ShieldCheck,
  Link as LinkIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { appointmentsApi } from "@/lib/api-client";

export const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Doctors", href: "/doctors", icon: Stethoscope },
  { name: "Clinical / EHR", href: "/clinical", icon: FileText },
  { name: "Laboratory", href: "/laboratory", icon: FlaskConical },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Roles & RBAC", href: "/settings/roles", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const [waitingCount, setWaitingCount] = useState<number | null>(null);

  useEffect(() => {
    appointmentsApi
      .getTodayQueue()
      .then((q) => {
        const queue: Array<{ status: string }> = q?.queue ?? [];
        setWaitingCount(queue.filter((a) => a.status === "Confirmed" || a.status === "CheckedIn").length);
      })
      .catch(() => setWaitingCount(null));
  }, [pathname]);

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
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const badge = item.href === "/appointments" && waitingCount ? waitingCount : null;
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

      {/* Upgrade / Agency Feature Card (as seen in Image 1 bottom left) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white shadow-lg shadow-blue-600/15">
        <div className="absolute top-2 right-2 opacity-15">
          <Sparkles className="w-16 h-16 text-white" />
        </div>
        <p className="text-xs uppercase font-semibold tracking-wider text-blue-200">Agency Pro</p>
        <p className="text-sm font-bold mt-0.5">Enterprise Hospital Management</p>
        <button className="mt-3.5 w-full bg-white text-blue-600 text-xs font-semibold py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
          Upgrade
        </button>
      </div>
    </aside>
  );
}

