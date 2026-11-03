"use client";

import { useEffect, useState } from "react";
import { FileText, Pill, Printer } from "lucide-react";
import { clinicalApi, getApiError, EncounterListItem, PrescriptionListItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PrescriptionPrintModal } from "@/components/dashboard/PrescriptionPrintModal";

type Tab = "encounters" | "prescriptions";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ClinicalPage() {
  const [tab, setTab] = useState<Tab>("encounters");
  const [encounters, setEncounters] = useState<EncounterListItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [printRxId, setPrintRxId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        if (tab === "encounters") {
          const res = await clinicalApi.getEncounters({ pageSize: 50 });
          setEncounters(res?.items ?? []);
        } else {
          const res = await clinicalApi.getPrescriptions({ pageSize: 50 });
          setPrescriptions(res?.items ?? []);
        }
      } catch (err) {
        setLoadError(getApiError(err, `Failed to load ${tab}.`));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  const rows = tab === "encounters" ? encounters : prescriptions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Records / EHR</h1>
        <p className="text-sm text-slate-500 mt-1">Consultation encounters, diagnoses, and issued prescriptions.</p>
      </div>

      <div className="inline-flex rounded-xl bg-white border border-slate-100 p-1 shadow-sm">
        {(
          [
            { key: "encounters", label: "Encounters", icon: FileText },
            { key: "prescriptions", label: "Prescriptions", icon: Pill },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              tab === key ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {loadError ? (
          <div className="p-12 text-center text-rose-500 text-sm">{loadError}</div>
        ) : loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading {tab}...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No {tab} recorded yet.</div>
        ) : tab === "encounters" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Encounter</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Doctor</th>
                  <th className="px-6 py-4 font-semibold">Complaints & Diagnosis</th>
                  <th className="px-6 py-4 font-semibold">Rx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {encounters.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors align-top">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-xs text-blue-600">{e.encounterNumber}</div>
                      <div className="text-[11px] text-slate-400">{formatDate(e.encounterDateTime)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{e.patient.fullName}</div>
                      <div className="text-xs text-slate-400">
                        {e.patient.patientUid} • {e.patient.gender} • {e.patient.age} yrs
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{e.doctor.fullName}</div>
                      <div className="text-xs text-slate-400">{e.doctor.specialization}</div>
                    </td>
                    <td className="px-6 py-4 text-xs max-w-[320px]">
                      <div className="text-slate-500">{e.chiefComplaints}</div>
                      <div className="font-semibold text-slate-900 mt-0.5">{e.diagnosis}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {e.hasPrescription ? (
                        <span className="text-emerald-600 font-semibold">Issued</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Prescription</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Doctor</th>
                  <th className="px-6 py-4 font-semibold">Medicines</th>
                  <th className="px-6 py-4 font-semibold">Follow-up</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors align-top">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-xs text-blue-600">{p.prescriptionNumber}</div>
                      <div className="text-[11px] text-slate-400">{formatDate(p.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.patient.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.patient.patientUid}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{p.doctor.fullName}</div>
                      <div className="text-xs text-slate-400">{p.doctor.specialization}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-[280px]">
                      <span className="font-semibold text-slate-900">{p.medicineCount}</span> • {p.medicinesSummary}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{p.followUpDate ? formatDate(p.followUpDate) : "—"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          p.status === "Active"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : p.status === "Dispensed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setPrintRxId(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-semibold rounded-xl transition-all border border-slate-200 hover:border-blue-200"
                        title="View & Print Prescription"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PrescriptionPrintModal
        prescriptionId={printRxId}
        onClose={() => setPrintRxId(null)}
      />
    </div>
  );
}
