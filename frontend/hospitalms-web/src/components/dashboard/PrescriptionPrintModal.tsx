"use client";

import { useEffect, useRef, useState } from "react";
import { X, Printer, Activity } from "lucide-react";
import { clinicalApi, PrescriptionDetail } from "@/lib/api-client";

interface Props {
  prescriptionId: string | null;
  onClose: () => void;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function PrescriptionPrintModal({ prescriptionId, onClose }: Props) {
  const [rx, setRx] = useState<PrescriptionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const printZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!prescriptionId) { setRx(null); return; }
    setLoading(true);
    clinicalApi
      .getPrescriptionById(prescriptionId)
      .then(setRx)
      .catch(() => setRx(null))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  // Inject @media print CSS so only the prescription zone prints
  useEffect(() => {
    if (!prescriptionId) return;
    const style = document.createElement("style");
    style.id = "rx-print-styles";
    style.textContent = `
      @media print {
        body > * { visibility: hidden !important; }
        #rx-print-zone { visibility: visible !important; position: fixed; top: 0; left: 0; width: 100%; padding: 24px; background: white; }
        #rx-print-zone * { visibility: visible !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("rx-print-styles")?.remove(); };
  }, [prescriptionId]);

  if (!prescriptionId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-sm">
            {loading ? "Loading Prescription…" : rx ? `Rx — ${rx.prescriptionNumber}` : "Prescription"}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={loading || !rx}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading prescription…</div>
          ) : !rx ? (
            <div className="py-12 text-center text-rose-500 text-sm">Failed to load prescription.</div>
          ) : (
            <div id="rx-print-zone" ref={printZoneRef} className="text-slate-800 space-y-5">
              {/* Hospital Header */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-blue-900 leading-tight">HospitalLink Medical Centre</h2>
                    <p className="text-[11px] text-slate-500">Dhaka, Bangladesh &nbsp;•&nbsp; +880 2 9660000 &nbsp;•&nbsp; info@hospitallink.com.bd</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">e-Prescription</p>
                  <p className="font-mono font-bold text-blue-700 text-base mt-0.5">{rx.prescriptionNumber}</p>
                  <p className="text-[11px] text-slate-400">{fmt(rx.createdAt)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${rx.status === "Active" ? "bg-blue-50 text-blue-700" : rx.status === "Dispensed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {rx.status}
                  </span>
                </div>
              </div>

              {/* Doctor & Patient */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">Prescribing Doctor</p>
                  <p className="font-bold text-slate-900 text-sm">{rx.doctor.fullName}</p>
                  <p className="text-xs font-semibold text-blue-700">{rx.doctor.specialization}</p>
                  <p className="text-xs text-slate-500">{rx.doctor.department}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">BMDC: {rx.doctor.licenseNumber}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Patient Information</p>
                  <p className="font-bold text-slate-900 text-sm">{rx.patient.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {rx.patient.gender} • {rx.patient.age} yrs •{" "}
                    <span className="font-bold text-red-600">Blood: {rx.patient.bloodGroup}</span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">ID: {rx.patient.patientUid}</p>
                </div>
              </div>

              {/* Rx Symbol & Medicines */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-serif text-blue-700 leading-none">℞</span>
                  <div className="h-0.5 flex-1 bg-blue-100" />
                  <span className="text-xs font-semibold text-slate-400">{rx.medicines.length} Medicine(s)</span>
                </div>

                <div className="space-y-2">
                  {rx.medicines.map((med, i) => (
                    <div key={med.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{med.medicineName}</p>
                            {med.genericName && (
                              <p className="text-[11px] text-slate-400 mt-0.5">({med.genericName})</p>
                            )}
                            {med.specialInstructions && (
                              <p className="text-xs text-amber-700 mt-1">{med.specialInstructions}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-800 text-sm">{med.dosage}</p>
                          <p className="text-[11px] text-slate-500">{med.mealInstruction}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 ml-7 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{med.frequency}</span>
                        <span className="text-slate-400">×</span>
                        <span>{med.durationDays} days</span>
                        <span className="ml-auto text-slate-600">
                          Qty: <strong className="text-slate-800">{med.totalQuantity}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Notes */}
              {rx.doctorNotes && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1.5">Clinical Notes / Diagnosis</p>
                  <p className="text-xs text-amber-900 leading-relaxed">{rx.doctorNotes}</p>
                </div>
              )}

              {/* Lifestyle Advice */}
              {rx.lifestyleAdvice && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">Lifestyle & Care Advice</p>
                  <p className="text-xs text-emerald-900 leading-relaxed">{rx.lifestyleAdvice}</p>
                </div>
              )}

              {/* Follow-up & Signature */}
              <div className="flex items-end justify-between pt-4 border-t border-slate-200 mt-4">
                <div>
                  {rx.followUpDate && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="text-xs text-blue-700 font-semibold">Follow-up: {fmt(rx.followUpDate)}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">
                    This is a digitally issued prescription by HospitalLink Medical Centre.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-36 border-t-2 border-slate-300 pt-1.5 mx-auto">
                    <p className="text-[11px] text-slate-500">Doctor's Signature</p>
                    <p className="text-xs font-bold text-slate-800">{rx.doctor.fullName}</p>
                    <p className="text-[10px] text-slate-400">{rx.doctor.licenseNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
