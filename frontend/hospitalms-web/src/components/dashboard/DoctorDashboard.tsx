"use client";

import { useEffect, useState } from "react";
import { Calendar, FileText, Users, Clock, ChevronRight, Printer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  doctorsApi,
  appointmentsApi,
  clinicalApi,
  DoctorItem,
  AppointmentItem,
  EncounterListItem,
  PrescriptionListItem,
  getApiError,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PrescriptionPrintModal } from "@/components/dashboard/PrescriptionPrintModal";
import Link from "next/link";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  CheckedIn: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Pending: "bg-slate-100 text-slate-600 border-slate-200",
};

export function DoctorDashboard() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorItem | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [encounters, setEncounters] = useState<EncounterListItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionListItem[]>([]);
  const [printRxId, setPrintRxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Find the doctor profile that matches the logged-in user's name
        const allDoctors: DoctorItem[] = await doctorsApi.getDoctors({});
        const matched = allDoctors.find(
          (d) => d.fullName.trim().toLowerCase() === (user?.fullName ?? "").trim().toLowerCase()
        );
        setDoctor(matched ?? null);

        const docId = matched?.id;
        const [apptRes, encRes, rxRes] = await Promise.all([
          appointmentsApi.getAppointments({ pageSize: 20, doctorId: docId }),
          clinicalApi.getEncounters({ pageSize: 10, doctorId: docId }),
          clinicalApi.getPrescriptions({ pageSize: 10 }),
        ]);
        setAppointments(apptRes?.items ?? []);
        setEncounters(encRes?.items ?? []);
        setPrescriptions(rxRes?.items ?? []);
      } catch (err) {
        setError(getApiError(err, "Failed to load your dashboard."));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.appointmentDate?.startsWith(today));
  const waiting = todayAppts.filter((a) => a.status === "Confirmed" || a.status === "CheckedIn").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading your dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl text-red-600 text-sm border border-red-200">{error}</div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Good day, {user?.fullName?.split(" ")[0] ?? "Doctor"}
        </h1>
        {doctor && (
          <p className="text-sm text-slate-500 mt-0.5">
            {doctor.specialization} · {doctor.departmentName}
          </p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: todayAppts.length, icon: Calendar, color: "blue" },
          { label: "Waiting Patients", value: waiting, icon: Clock, color: "amber" },
          { label: "Total Appointments", value: appointments.length, icon: Users, color: "slate" },
          { label: "Prescriptions Issued", value: prescriptions.length, icon: FileText, color: "emerald" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              color === "blue" ? "bg-blue-50 text-blue-600" :
              color === "amber" ? "bg-amber-50 text-amber-600" :
              color === "emerald" ? "bg-emerald-50 text-emerald-600" :
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
        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-800">Today&apos;s Schedule</h2>
            </div>
            <span className="text-xs text-slate-400">{todayAppts.length} appointments</span>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">No appointments today.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {todayAppts.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.patient.fullName}</p>
                    <p className="text-xs text-slate-400">
                      {a.timeSlot} · Serial #{a.queueSerialNumber}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                      STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Encounters / Clinical History */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-800">Recent Clinical Records</h2>
            </div>
            <Link href="/clinical" className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {encounters.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">No encounters recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {encounters.map((e) => (
                <div key={e.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{e.patient.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{e.diagnosis}</p>
                      <p className="text-[11px] text-slate-400">{fmtDate(e.encounterDateTime)}</p>
                    </div>
                    {e.hasPrescription && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex-shrink-0">
                        Rx Issued
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-800">Recent Prescriptions</h2>
          </div>
          <Link href="/clinical" className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline">
            Archive <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {prescriptions.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">No prescriptions issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-semibold">Rx #</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Medicines</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-xs text-blue-600">{p.prescriptionNumber}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{p.patient.fullName}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      <span className="font-bold">{p.medicineCount}</span> · {p.medicinesSummary}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(p.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                        p.status === "Active" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        p.status === "Dispensed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setPrintRxId(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-slate-200 hover:border-blue-200 transition-all"
                        title="Print Prescription"
                      >
                        <Printer className="w-3 h-3" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PrescriptionPrintModal prescriptionId={printRxId} onClose={() => setPrintRxId(null)} />
    </div>
  );
}
