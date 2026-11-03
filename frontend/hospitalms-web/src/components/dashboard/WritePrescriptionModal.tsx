"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, FileText } from "lucide-react";
import { clinicalApi, doctorsApi, DoctorItem, getApiError, localDateString } from "@/lib/api-client";

interface MedicineRow {
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  totalQuantity: number;
  mealInstruction: string;
  specialInstructions: string;
}

const BLANK_MED: MedicineRow = {
  medicineName: "",
  genericName: "",
  dosage: "1-0-1",
  frequency: "Daily",
  durationDays: 7,
  totalQuantity: 14,
  mealInstruction: "After Meal",
  specialInstructions: "",
};

interface Props {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSuccess: (prescriptionId: string) => void;
}

export function WritePrescriptionModal({ patientId, patientName, onClose, onSuccess }: Props) {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [medicines, setMedicines] = useState<MedicineRow[]>([{ ...BLANK_MED }]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    doctorsApi
      .getDoctors({})
      .then((data: DoctorItem[]) => {
        const list = Array.isArray(data) ? data : [];
        setDoctors(list);
        if (list.length) setDoctorId(list[0].id);
      })
      .catch(() => setDoctors([]));
  }, []);

  const updateMed = (index: number, field: keyof MedicineRow, value: string | number) => {
    setMedicines((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addMed = () => setMedicines((prev) => [...prev, { ...BLANK_MED }]);
  const removeMed = (i: number) => setMedicines((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validMeds = medicines.filter((m) => m.medicineName.trim());
    if (!validMeds.length) {
      setError("At least one medicine with a name is required.");
      return;
    }
    if (!doctorId) {
      setError("Please select a prescribing doctor.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const result = await clinicalApi.createPrescription({
        patientId,
        doctorId,
        doctorNotes: doctorNotes.trim() || undefined,
        lifestyleAdvice: lifestyleAdvice.trim() || undefined,
        followUpDate: followUpDate || undefined,
        medicines: validMeds.map((m) => ({
          medicineName: m.medicineName.trim(),
          genericName: m.genericName.trim() || undefined,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: m.durationDays,
          totalQuantity: m.totalQuantity,
          mealInstruction: m.mealInstruction,
          specialInstructions: m.specialInstructions.trim() || undefined,
        })),
      });
      onSuccess(result.id);
    } catch (err) {
      setError(getApiError(err, "Failed to create prescription."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              Write Prescription
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Patient: <strong className="text-slate-700">{patientName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Doctor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Prescribing Doctor *</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {doctors.length === 0 ? (
                <option value="">Loading doctors…</option>
              ) : (
                doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} — {d.specialization}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700">Prescribed Medicines *</label>
              <button
                type="button"
                onClick={addMed}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medicine {i + 1}</span>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMed(i)}
                        className="text-rose-400 hover:text-rose-600 p-1 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Medicine Name *</label>
                      <input
                        type="text"
                        value={med.medicineName}
                        onChange={(e) => updateMed(i, "medicineName", e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        placeholder="e.g. Napa Extra 500mg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Generic Name</label>
                      <input
                        type="text"
                        value={med.genericName}
                        onChange={(e) => updateMed(i, "genericName", e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        placeholder="e.g. Paracetamol"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMed(i, "dosage", e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        placeholder="1-0-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => updateMed(i, "frequency", e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
                      >
                        <option>Daily</option>
                        <option>Twice Daily (BD)</option>
                        <option>Three Times Daily (TDS)</option>
                        <option>Four Times Daily (QDS)</option>
                        <option>Every 8 Hours</option>
                        <option>Every 12 Hours</option>
                        <option>Weekly</option>
                        <option>As Needed (SOS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Duration (days)</label>
                      <input
                        type="number"
                        min={1}
                        value={med.durationDays}
                        onChange={(e) => updateMed(i, "durationDays", parseInt(e.target.value) || 7)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Meal Instruction</label>
                      <select
                        value={med.mealInstruction}
                        onChange={(e) => updateMed(i, "mealInstruction", e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none"
                      >
                        <option>After Meal</option>
                        <option>Before Meal</option>
                        <option>Empty Stomach</option>
                        <option>With Meal</option>
                        <option>No Restriction</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Total Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={med.totalQuantity}
                        onChange={(e) => updateMed(i, "totalQuantity", parseInt(e.target.value) || 14)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Special Instructions (optional)</label>
                    <input
                      type="text"
                      value={med.specialInstructions}
                      onChange={(e) => updateMed(i, "specialInstructions", e.target.value)}
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      placeholder="e.g. Avoid with alcohol, take with plenty of water"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Advice */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Clinical Notes / Diagnosis</label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none"
                placeholder="Diagnosis and clinical observations for this prescription…"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lifestyle & Care Advice</label>
              <textarea
                value={lifestyleAdvice}
                onChange={(e) => setLifestyleAdvice(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none"
                placeholder="Rest, dietary recommendations, activity restrictions…"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={localDateString()}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? "Issuing Rx…" : "Issue Prescription"}
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
