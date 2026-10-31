"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, Stethoscope, FlaskConical, Pill, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DemoRolePreset {
  role: string;
  name: string;
  email: string;
  password: string;
  category: "admin" | "clinical" | "diagnostics" | "pharmacy" | "support";
  badge: string;
}

const DEMO_PRESETS: DemoRolePreset[] = [
  // Admin & Ops
  { role: "SuperAdmin", name: "System Administrator", email: "admin@hospitalms.com", password: "Admin@123456", category: "admin", badge: "Full Global Access" },
  { role: "HospitalAdmin", name: "Dr. Farhana Ahmed", email: "hospitaladmin@hospitalms.com", password: "Staff@123456", category: "admin", badge: "Hospital Ops & Config" },
  { role: "BranchManager", name: "Tanvir Hasan", email: "branchmanager@hospitalms.com", password: "Staff@123456", category: "admin", badge: "Branch Operations" },
  { role: "HRManager", name: "Sadia Chowdhury", email: "hrmanager@hospitalms.com", password: "Staff@123456", category: "admin", badge: "Staff & Rosters" },

  // Clinical
  { role: "Doctor", name: "Dr. James Thompson", email: "dr.thompson@hospitalms.com", password: "Doctor@123456", category: "clinical", badge: "OPD & Clinical EHR" },
  { role: "Nurse", name: "Rokeya Begum", email: "nurse@hospitalms.com", password: "Staff@123456", category: "clinical", badge: "Care & Vitals" },
  { role: "EmergencyStaff", name: "Dr. Arif Billah", email: "emergency@hospitalms.com", password: "Staff@123456", category: "clinical", badge: "Trauma & Triage" },

  // Diagnostics
  { role: "Pathologist", name: "Dr. Shamsul Alam", email: "pathologist@hospitalms.com", password: "Staff@123456", category: "diagnostics", badge: "Verification & Reports" },
  { role: "LabTechnician", name: "Kamal Hossain", email: "labtech@hospitalms.com", password: "Staff@123456", category: "diagnostics", badge: "Samples & Processing" },
  { role: "Radiologist", name: "Dr. Shirin Akhtar", email: "radiologist@hospitalms.com", password: "Staff@123456", category: "diagnostics", badge: "Imaging & Scans" },

  // Pharmacy & Finance
  { role: "Pharmacist", name: "Mahmudul Karim", email: "pharmacist@hospitalms.com", password: "Staff@123456", category: "pharmacy", badge: "Dispensing & Stock" },
  { role: "Cashier", name: "Sabbir Hossain", email: "cashier@hospitalms.com", password: "Staff@123456", category: "pharmacy", badge: "Billing & Cash Desk" },
  { role: "Accountant", name: "Nazrul Islam", email: "accountant@hospitalms.com", password: "Staff@123456", category: "pharmacy", badge: "Reconciliation & Ledgers" },
  { role: "InventoryManager", name: "Shafiqul Rahman", email: "inventory@hospitalms.com", password: "Staff@123456", category: "pharmacy", badge: "Supply Chain & POs" },

  // Support & Patient
  { role: "Receptionist", name: "Nusrat Jahan", email: "reception@hospitalms.com", password: "Staff@123456", category: "support", badge: "Registration & Desk" },
  { role: "BloodBankTechnician", name: "Moniruzzaman", email: "bloodbank@hospitalms.com", password: "Staff@123456", category: "support", badge: "Donors & Screening" },
  { role: "Patient", name: "Rahim Uddin", email: "patient@hospitalms.com", password: "Patient@123456", category: "support", badge: "Personal Portal" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@hospitalms.com");
  const [password, setPassword] = useState("Admin@123456");
  const [selectedPreset, setSelectedPreset] = useState<string>("SuperAdmin");
  const [selectedCategory, setSelectedCategory] = useState<"admin" | "clinical" | "diagnostics" | "pharmacy" | "support">("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSelectPreset = (p: DemoRolePreset) => {
    setSelectedPreset(p.role);
    setEmail(p.email);
    setPassword(p.password);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.ok) {
        router.push("/dashboard");
      } else {
        setError(result.error ?? "Invalid email or password.");
      }
    } catch {
      setError("Failed to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPresets = DEMO_PRESETS.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-blue-900">Hospital</span>
            <span className="text-2xl font-black tracking-tight text-teal-600">Link</span>
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Hospital Operational Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Centralized Role-Based Access Control (RBAC) across 17 Healthcare Disciplines
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow-[0_10px_35px_rgba(0,0,0,0.05)] sm:rounded-3xl border border-slate-100 sm:px-10">
          
          {/* Preset Roles Selector Tabs */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick RBAC Demo Switcher (17 Roles)</span>
              </span>
              <span className="text-[11px] text-blue-600 font-semibold">Click to Test Any Role</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "admin", label: "Admin & Ops", icon: ShieldCheck },
                { id: "clinical", label: "Clinical", icon: Stethoscope },
                { id: "diagnostics", label: "Diagnostics", icon: FlaskConical },
                { id: "pharmacy", label: "Pharmacy & Finance", icon: Pill },
                { id: "support", label: "Support & Patient", icon: User },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors flex-shrink-0 text-xs",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredPresets.map((p) => {
                const isSelected = selectedPreset === p.role;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={cn(
                      "p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between",
                      isSelected
                        ? "bg-blue-50/90 border-blue-300 text-blue-900 shadow-xs"
                        : "bg-slate-50/60 border-slate-100 hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    <div>
                      <p className="font-bold text-xs truncate">{p.role}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.name}</p>
                    </div>
                    <span className="text-[9px] font-semibold text-blue-600 bg-white px-1.5 py-0.5 rounded-full mt-1.5 inline-block border border-slate-100 truncate">
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700">Email Address</label>
              <div className="mt-1.5 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="admin@hospitalms.com"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400">Standard test credentials</span>
              </div>
              <div className="mt-1.5 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md shadow-blue-500/25 transition-all"
            >
              {loading ? "Authenticating & Granting Permissions..." : `Sign In as ${selectedPreset}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Patient Self-Registration Option */}
          <div className="mt-5 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/80 hover:bg-blue-100/80 px-3.5 py-2 rounded-xl border border-blue-200/60"
            >
              <span>Are you a new patient? Self-Register with Email OTP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Hospital Link & MediWell Healthcare Enterprise Management &copy; 2026
        </p>
      </div>
    </div>
  );
}
