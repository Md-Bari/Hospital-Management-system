"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Stethoscope, Clock, ShieldCheck, Phone, CheckCircle2, XCircle } from "lucide-react";
import { doctorsApi, DoctorItem, getApiError } from "@/lib/api-client";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    doctorsApi
      .getSpecialties()
      .then((res) => setDepartments((res?.departments ?? []).map((d: { name: string }) => d.name)))
      .catch(() => setDepartments([]));
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorsApi.getDoctors({
        search: search || undefined,
        department: department !== "All" ? department : undefined,
      });
      if (Array.isArray(data)) {
        setDoctors(data);
      }
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [department]);

  const handleToggleStatus = async (doctor: DoctorItem) => {
    try {
      const nextStatus = !doctor.isAvailable;
      // Optimistic update
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, isAvailable: nextStatus } : d))
      );
      await doctorsApi.toggleStatus(doctor.id, nextStatus);
    } catch (err) {
      alert(getApiError(err, "Failed to update availability"));
      // Revert on failure
      loadDoctors();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor & Specialist Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Chamber schedules, consultation fees in BDT, licensing, and live duty availability.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctor by name, specialty, or qualifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadDoctors()}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Department:</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Departments</option>
            {departments.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">No doctors found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => {
            const initials = doc.fullName
              .replace(/^Dr\.\s*/i, "")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-snug">{doc.fullName}</h3>
                        <p className="text-xs font-semibold text-blue-600">{doc.specialization}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{doc.departmentName}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(doc)}
                      title="Click to toggle availability"
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                        doc.isAvailable
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      {doc.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-500" />
                          <span>Unavailable</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Qualifications & BMDC */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-mono text-[11px]">BMDC: {doc.licenseNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate" title={doc.qualifications}>
                      {doc.qualifications}
                    </div>
                    {doc.roomNumber && (
                      <div className="text-[11px] font-medium text-slate-700">
                        Room: <span className="text-slate-900 font-semibold">{doc.roomNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Chamber Schedules */}
                  <div className="mt-3 bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>Chamber Schedules</span>
                    </div>
                    {doc.schedules && doc.schedules.length > 0 ? (
                      <div className="space-y-1">
                        {doc.schedules.slice(0, 2).map((s) => (
                          <div key={s.id} className="flex justify-between text-[11px] text-slate-500">
                            <span>{s.day}</span>
                            <span className="font-medium text-slate-700">{s.timeDisplay}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">No chamber schedule set</div>
                    )}
                  </div>
                </div>

                {/* Footer with Fee in BDT */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Consultation Fee</span>
                    <p className="text-base font-bold text-slate-900">{doc.consultationFeeDisplay}</p>
                  </div>

                  {doc.phone && (
                    <a
                      href={`tel:${doc.phone}`}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

