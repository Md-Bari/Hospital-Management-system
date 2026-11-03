"use client";

import { Search, Bell, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { staffNavigationItems, patientNavigationItems } from "@/components/layout/Sidebar";

export function Topbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const isPatient =
    user?.roles?.includes("Patient") &&
    !user?.roles?.includes("SuperAdmin") &&
    !user?.roles?.includes("HospitalAdmin") &&
    !user?.roles?.includes("BranchManager");

  const navItems = isPatient ? patientNavigationItems : staffNavigationItems;

  const pageTitle =
    navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.name ?? "Dashboard";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      </div>

      {/* Right Controls: Search, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Search Bar — staff only */}
        {!isPatient && (
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) router.push(`/patients?search=${encodeURIComponent(query.trim())}`);
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name, UID, phone..."
              className="w-72 bg-slate-50 border border-slate-200/80 rounded-full pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
        )}

        {/* Notifications Icon Button */}
        <button
          className="relative w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </button>

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm">
              {user?.fullName?.charAt(0) || "?"}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.fullName}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {user?.roles?.[0] ?? ""}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

