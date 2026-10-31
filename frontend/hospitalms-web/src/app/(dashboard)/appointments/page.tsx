"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Calendar as CalendarIcon, Clock, User, Stethoscope, CheckCircle2, ChevronRight, X } from "lucide-react";
import { appointmentsApi, AppointmentItem, patientsApi, doctorsApi, PatientItem, DoctorItem } from "@/lib/api-client";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // For modal options
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [bookingForm, setBookingForm] = useState({
    patientId: "",
    doctorId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    reason: "Regular Consultation",
    isPaid: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [apptRes, queueRes] = await Promise.all([
        appointmentsApi.getAppointments({ pageSize: 30 }),
        appointmentsApi.getTodayQueue().catch(() => null),
      ]);

      if (apptRes?.items) setAppointments(apptRes.items);
      if (queueRes) setQueueData(queueRes);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load lookup data for booking modal
    patientsApi.getPatients({ pageSize: 50 }).then((res) => setPatients(res?.items || []));
    doctorsApi.getDoctors().then((res) => setDoctors(res || []));
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await appointmentsApi.updateStatus(id, newStatus);
      loadData();
    } catch (err) {
      alert("Failed to update appointment status");
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientId || !bookingForm.doctorId) {
      alert("Please select both a patient and a doctor.");
      return;
    }

    try {
      setSubmitting(true);
      await appointmentsApi.createAppointment({
        patientId: bookingForm.patientId,
        doctorId: bookingForm.doctorId,
        appointmentDate: bookingForm.appointmentDate,
        reason: bookingForm.reason,
        isPaid: bookingForm.isPaid,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointment & Queue Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time OPD serial tracking, patient check-in, and chamber scheduling.
          </p>
        </div>

        <button
          onClick={() => {
            if (patients.length > 0 && !bookingForm.patientId) bookingForm.patientId = patients[0].id;
            if (doctors.length > 0 && !bookingForm.doctorId) bookingForm.doctorId = doctors[0].id;
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* OPD Waiting Room Live Serial Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl p-6 shadow-md shadow-blue-500/10 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">OPD Waiting Display</span>
            <h3 className="text-xl font-bold mt-1">Now Serving</h3>
          </div>
          <div className="my-4">
            {queueData?.currentServing ? (
              <div>
                <span className="text-4xl font-extrabold font-mono">
                  #{queueData.currentServing.queueSerialNumber}
                </span>
                <p className="text-sm font-semibold text-blue-100 mt-1">
                  {queueData.currentServing.patientName}
                </p>
                <p className="text-xs text-blue-200">
                  Room: {queueData.currentServing.roomNumber || "Chamber 1"} • {queueData.currentServing.doctorName}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-extrabold font-mono">--</span>
                <p className="text-xs text-blue-200 mt-1">No patient currently inside doctor chamber</p>
              </div>
            )}
          </div>
          <div className="text-[11px] text-blue-200 font-medium">Automatic sync with live queue</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Queue Flow</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">Next In Line</h3>
          </div>
          <div className="my-3">
            {queueData?.nextInLine ? (
              <div>
                <span className="text-3xl font-bold font-mono text-emerald-600">
                  #{queueData.nextInLine.queueSerialNumber}
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{queueData.nextInLine.patientName}</p>
                <p className="text-xs text-slate-400">Doctor: {queueData.nextInLine.doctorName}</p>
              </div>
            ) : (
              <div className="text-slate-400 text-sm py-2">No patients waiting in queue right now</div>
            )}
          </div>
          <div className="text-xs font-semibold text-emerald-600">Please prepare for chamber entry</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Traffic</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">Queue Statistics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 my-2">
            <div>
              <p className="text-2xl font-bold text-slate-900">{queueData?.totalScheduled ?? appointments.length}</p>
              <p className="text-xs text-slate-400">Total Booked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{queueData?.completedCount ?? 0}</p>
              <p className="text-xs text-slate-400">Consulted</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">Dhaka Center • Asia/Dhaka Timezone</div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Scheduled Appointments</h3>
          <span className="text-xs text-slate-400 font-medium">{appointments.length} Total</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No appointments scheduled.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Serial & ID</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Doctor & Chamber</th>
                  <th className="px-6 py-4 font-semibold">Date & Slot</th>
                  <th className="px-6 py-4 font-semibold">Fee (BDT)</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-mono font-bold text-xs flex items-center justify-center">
                          #{a.queueSerialNumber}
                        </span>
                        <span className="font-mono text-xs text-slate-500">{a.appointmentNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{a.patient.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">{a.patient.patientUid} • {a.patient.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{a.doctor.fullName}</div>
                      <div className="text-xs text-slate-400">{a.doctor.specialization} • Room {a.doctor.roomNumber || "1"}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-slate-800">
                        {new Date(a.appointmentDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-slate-400 mt-0.5">{a.timeSlot}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {a.feeAmountDisplay}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          a.status === "Completed"
                            ? "bg-slate-100 text-slate-600"
                            : a.status === "InConsultation"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : a.status === "CheckedIn"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {a.status === "Confirmed" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "CheckedIn")}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                        >
                          Check In
                        </button>
                      )}
                      {a.status === "CheckedIn" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "InConsultation")}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                        >
                          Call Patient
                        </button>
                      )}
                      {a.status === "InConsultation" && (
                        <button
                          onClick={() => handleStatusChange(a.id, "Completed")}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Book New Appointment</h3>
                <p className="text-xs text-slate-400">Assign queue serial and chamber slot</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
                <select
                  required
                  value={bookingForm.patientId}
                  onChange={(e) => setBookingForm({ ...bookingForm, patientId: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientUid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Select Doctor *</label>
                <select
                  required
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} — {d.specialization} ({d.consultationFeeDisplay})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={bookingForm.appointmentDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Reason / Chief Concern</label>
                <input
                  type="text"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                  placeholder="e.g. Chest pain, Follow-up consultation"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={bookingForm.isPaid}
                  onChange={(e) => setBookingForm({ ...bookingForm, isPaid: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="paidCheck" className="text-xs font-medium text-slate-700">
                  Mark consultation fee as paid at counter
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
