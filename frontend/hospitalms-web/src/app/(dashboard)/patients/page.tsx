"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Filter, Phone, Droplet, User, HeartPulse, X, Check, Mail, FileText } from "lucide-react";
import { patientsApi, PatientItem, getApiError, localDateString } from "@/lib/api-client";
import { WritePrescriptionModal } from "@/components/dashboard/WritePrescriptionModal";
import { PrescriptionPrintModal } from "@/components/dashboard/PrescriptionPrintModal";

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 text-sm">Loading patient records...</div>}>
      <PatientsPageContent />
    </Suspense>
  );
}

function PatientsPageContent() {
  const urlSearch = useSearchParams().get("search") ?? "";
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [gender, setGender] = useState("All");
  const [bloodGroup, setBloodGroup] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "Male",
    bloodGroup: "O+",
    dateOfBirth: "1990-01-01",
    address: "Dhaka, Bangladesh",
    emergencyContactName: "",
    emergencyContactPhone: "",
    knownAllergies: "",
    chronicConditions: "",
  });

  const [loadError, setLoadError] = useState("");
  const [writeRxPatient, setWriteRxPatient] = useState<{ id: string; fullName: string } | null>(null);
  const [printRxId, setPrintRxId] = useState<string | null>(null);

  const loadPatients = async (searchTerm: string = search) => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await patientsApi.getPatients({
        search: searchTerm || undefined,
        gender: gender !== "All" ? gender : undefined,
        bloodGroup: bloodGroup !== "All" ? bloodGroup : undefined,
        pageSize: 20,
      });
      if (res?.items) {
        setPatients(res.items);
      }
    } catch (err) {
      setLoadError(getApiError(err, "Failed to load patients."));
    } finally {
      setLoading(false);
    }
  };

  // Re-run when the top-bar search box navigates here with ?search=, or a filter changes.
  // Only a new ?search= value overwrites the search box; filter changes keep what the user typed.
  const lastUrlSearch = useRef(urlSearch);
  useEffect(() => {
    let term = search;
    if (lastUrlSearch.current !== urlSearch) {
      lastUrlSearch.current = urlSearch;
      term = urlSearch;
      setSearch(urlSearch);
    }
    loadPatients(term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, gender, bloodGroup]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients();
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await patientsApi.createPatient({
        ...formData,
        // Send the calendar date as-is; toISOString() can shift it a day depending on time zone.
        dateOfBirth: formData.dateOfBirth,
      });
      setSuccessMsg("Patient registered successfully!");
      setIsModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "Male",
        bloodGroup: "O+",
        dateOfBirth: "1990-01-01",
        address: "Dhaka, Bangladesh",
        emergencyContactName: "",
        emergencyContactPhone: "",
        knownAllergies: "",
        chronicConditions: "",
      });
      loadPatients();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(getApiError(err, "Failed to register patient. Please check required fields."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered patients directory, electronic medical records, and quick intake.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all text-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email OTP Registration</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, patient UID (DCH-...), or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Gender:</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Droplet className="w-3.5 h-3.5 text-rose-500" />
            <span>Blood:</span>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Groups</option>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {loadError ? (
          <div className="p-12 text-center text-rose-500 text-sm">{loadError}</div>
        ) : loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading patient records...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No patients found. Try adjusting your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Patient UID</th>
                  <th className="px-6 py-4 font-semibold">Name & Demographic</th>
                  <th className="px-6 py-4 font-semibold">Contact & Address</th>
                  <th className="px-6 py-4 font-semibold">Blood Group</th>
                  <th className="px-6 py-4 font-semibold">Allergies & History</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600">
                      {p.patientUid}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.fullName}</div>
                      <div className="text-xs text-slate-400">
                        {p.gender} • {p.age} yrs
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone}</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                        {p.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                        <Droplet className="w-3 h-3 fill-rose-600" />
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {p.knownAllergies ? (
                        <span className="text-amber-700 font-medium">Allergy: {p.knownAllergies}</span>
                      ) : (
                        <span className="text-slate-400">None reported</span>
                      )}
                      {p.chronicConditions && (
                        <div className="text-slate-400 mt-0.5">{p.chronicConditions}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setWriteRxPatient({ id: p.id, fullName: p.fullName })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                        title="Write Prescription"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Write Rx
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Write Prescription Modal */}
      {writeRxPatient && (
        <WritePrescriptionModal
          patientId={writeRxPatient.id}
          patientName={writeRxPatient.fullName}
          onClose={() => setWriteRxPatient(null)}
          onSuccess={(id) => {
            setWriteRxPatient(null);
            setPrintRxId(id);
          }}
        />
      )}

      {/* Prescription Print Modal */}
      <PrescriptionPrintModal
        prescriptionId={printRxId}
        onClose={() => setPrintRxId(null)}
      />

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register New Patient</h3>
                <p className="text-xs text-slate-400">Enter patient demographic and medical details</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    placeholder="e.g. Rafiqul"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    placeholder="e.g. Islam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    placeholder="+8801700..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email Address (for SMTP OTP)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    placeholder="patient@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  placeholder="Street, City, Bangladesh"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Known Allergies</label>
                  <input
                    type="text"
                    value={formData.knownAllergies}
                    onChange={(e) => setFormData({ ...formData, knownAllergies: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                    placeholder="e.g. Penicillin"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Chronic Conditions</label>
                  <input
                    type="text"
                    value={formData.chronicConditions}
                    onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                    placeholder="e.g. Hypertension"
                  />
                </div>
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
                  {submitting ? "Saving..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

