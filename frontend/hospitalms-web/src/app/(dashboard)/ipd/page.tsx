"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BedDouble,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  LogOut,
  Sparkles,
  RefreshCw,
  Building2,
  ShieldAlert,
  Activity,
  HeartPulse,
  UserCheck,
} from "lucide-react";
import {
  ipdApi,
  IpdOverview,
  WardItem,
  BedItem,
  InpatientAdmissionItem,
  patientsApi,
  doctorsApi,
  DoctorItem,
} from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export default function InpatientDepartmentPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<IpdOverview | null>(null);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [beds, setBeds] = useState<BedItem[]>([]);
  const [admissions, setAdmissions] = useState<InpatientAdmissionItem[]>([]);
  const [patients, setPatients] = useState<Array<{ id: string; patientUid: string; fullName: string; phone: string }>>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "active" | "history">("matrix");
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Selected records for modals
  const [selectedBedForAdmit, setSelectedBedForAdmit] = useState<BedItem | null>(null);
  const [selectedAdmissionForAction, setSelectedAdmissionForAction] = useState<InpatientAdmissionItem | null>(null);

  // Form states
  const [admitForm, setAdmitForm] = useState({
    patientId: "",
    doctorId: "",
    wardId: "",
    bedId: "",
    provisionalDiagnosis: "",
    admissionPriority: "Routine",
    initialDeposit: 5000,
    estimatedDays: 3,
    careInstructions: "",
  });

  const [dischargeSummary, setDischargeSummary] = useState("");
  const [transferTargetBedId, setTransferTargetBedId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, wardsData, bedsData, admissionsData] = await Promise.all([
        ipdApi.getOverview(),
        ipdApi.getWards(),
        ipdApi.getBeds(),
        ipdApi.getAdmissions({ status: "All", pageSize: 50 }),
      ]);

      setOverview(overviewData);
      setWards(wardsData);
      setBeds(bedsData);
      setAdmissions(admissionsData.items || []);
    } catch (err: any) {
      console.error("Failed to load IPD data", err);
      showToast(err.response?.data?.error || "Failed to load IPD data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Pre-load patients and doctors for the admission form
  useEffect(() => {
    loadData();
    patientsApi
      .getPatients({ page: 1, pageSize: 50 })
      .then((res: any) => {
        const list = res.patients || res.items || [];
        setPatients(
          list.map((p: any) => ({
            id: p.id,
            patientUid: p.patientUid,
            fullName: `${p.firstName} ${p.lastName}`,
            phone: p.phone,
          }))
        );
      })
      .catch(() => {});

    doctorsApi
      .getDoctors()
      .then((docs) => setDoctors(docs))
      .catch(() => {});
  }, []);

  // Filtered beds for the Matrix view
  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const matchesWard = selectedWardFilter === "All" || b.ward.id === selectedWardFilter;
      const matchesStatus = selectedStatusFilter === "All" || b.status.toLowerCase() === selectedStatusFilter.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.ward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.currentAdmission?.patientName && b.currentAdmission.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.currentAdmission?.patientUid && b.currentAdmission.patientUid.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesWard && matchesStatus && matchesSearch;
    });
  }, [beds, selectedWardFilter, selectedStatusFilter, searchQuery]);

  // Active admitted patients
  const activeAdmissionsList = useMemo(() => {
    return admissions.filter((a) => a.status === "Admitted");
  }, [admissions]);

  // Discharged history
  const historyAdmissionsList = useMemo(() => {
    return admissions.filter((a) => a.status !== "Admitted");
  }, [admissions]);

  // Handle Bed Click -> Quick Admit if Available
  const handleBedClick = (bed: BedItem) => {
    if (bed.status === "Available") {
      setSelectedBedForAdmit(bed);
      setAdmitForm((prev) => ({
        ...prev,
        wardId: bed.ward.id,
        bedId: bed.id,
      }));
      setIsAdmitModalOpen(true);
    } else if (bed.status === "Occupied") {
      const matched = admissions.find((a) => a.bed.id === bed.id && a.status === "Admitted");
      if (matched) {
        setSelectedAdmissionForAction(matched);
      }
    }
  };

  // Submit Admission
  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.patientId || !admitForm.doctorId || !admitForm.bedId) {
      showToast("Please select Patient, Doctor, and Bed", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await ipdApi.admitPatient({
        patientId: admitForm.patientId,
        doctorId: admitForm.doctorId,
        bedId: admitForm.bedId,
        provisionalDiagnosis: admitForm.provisionalDiagnosis,
        admissionPriority: admitForm.admissionPriority,
        initialDeposit: Number(admitForm.initialDeposit),
        estimatedDays: Number(admitForm.estimatedDays),
        careInstructions: admitForm.careInstructions,
      });

      showToast(res.message || "Patient successfully admitted to ward!");
      setIsAdmitModalOpen(false);
      setAdmitForm({
        patientId: "",
        doctorId: "",
        wardId: "",
        bedId: "",
        provisionalDiagnosis: "",
        admissionPriority: "Routine",
        initialDeposit: 5000,
        estimatedDays: 3,
        careInstructions: "",
      });
      setSelectedBedForAdmit(null);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to admit patient", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Discharge
  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionForAction) return;

    setSubmitting(true);
    try {
      const res = await ipdApi.dischargePatient(selectedAdmissionForAction.id, dischargeSummary);
      showToast(res.message || "Patient discharge processed successfully!");
      setIsDischargeModalOpen(false);
      setSelectedAdmissionForAction(null);
      setDischargeSummary("");
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to discharge patient", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionForAction || !transferTargetBedId) {
      showToast("Please choose target bed", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await ipdApi.transferBed(selectedAdmissionForAction.id, transferTargetBedId, transferReason);
      showToast(res.message || "Patient bed transfer completed!");
      setIsTransferModalOpen(false);
      setSelectedAdmissionForAction(null);
      setTransferTargetBedId("");
      setTransferReason("");
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to transfer patient", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Bed Status (e.g. Cleaned -> Available)
  const handleBedStatusUpdate = async (bedId: string, status: string) => {
    try {
      await ipdApi.updateBedStatus(bedId, status);
      showToast(`Bed status updated to ${status}`);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to update bed status", "error");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inpatient Department (IPD) & Wards</h1>
              <p className="text-sm text-slate-500">Live bed occupancy, inpatient admissions, and ward care management</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setSelectedBedForAdmit(null);
              setIsAdmitModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Admit Patient
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Beds</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{overview?.totalBeds ?? 0}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{overview?.totalWards ?? 0} active hospital wards</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Available Beds */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Available Beds</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{overview?.availableBeds ?? 0}</h3>
            <p className="text-xs text-emerald-600/80 mt-0.5">Ready for immediate intake</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Occupied Beds */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Occupied Beds</p>
            <h3 className="text-2xl font-bold text-rose-700 mt-1">{overview?.occupiedBeds ?? 0}</h3>
            <p className="text-xs text-rose-600/80 mt-0.5">{overview?.activeAdmissions ?? 0} admitted inpatients</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Occupancy Rate</p>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {overview?.occupancyRate ?? 0}%
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overview?.occupancyRate ?? 0, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
              <span>Cleaning: {overview?.cleaningBeds ?? 0}</span>
              <span>Maintenance: {overview?.maintenanceBeds ?? 0}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "matrix"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BedDouble className="w-4 h-4" />
          Bed Matrix & Wards ({filteredBeds.length})
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "active"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Active Inpatients ({activeAdmissionsList.length})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          Discharged History ({historyAdmissionsList.length})
        </button>
      </div>

      {/* ─── TAB 1: BED MATRIX & WARD GRID ────────────────────────────────────────── */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search bed, ward, patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Ward Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Ward:</span>
              </div>
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Wards ({wards.length})</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Fl. {w.floorNumber})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
                <span>Status:</span>
              </div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available Only</option>
                <option value="Occupied">Occupied Only</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Wards Breakdown */}
          {wards
            .filter((w) => selectedWardFilter === "All" || w.id === selectedWardFilter)
            .map((ward) => {
              const wardBeds = filteredBeds.filter((b) => b.ward.id === ward.id);
              if (wardBeds.length === 0 && (selectedStatusFilter !== "All" || searchQuery)) return null;

              return (
                <div key={ward.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  {/* Ward Header */}
                  <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        Fl {ward.floorNumber}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">{ward.name}</h2>
                        <p className="text-xs text-slate-500">
                          {ward.wardType} Ward &bull; Gender: {ward.genderRestriction} &bull; Base Rate: {ward.dailyRateDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-medium rounded-full border border-emerald-200">
                        {ward.availableBeds} Available
                      </span>
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-medium rounded-full border border-rose-200">
                        {ward.occupiedBeds} Occupied
                      </span>
                      {ward.cleaningBeds > 0 && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-medium rounded-full border border-amber-200">
                          {ward.cleaningBeds} Cleaning
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bed Matrix Grid */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wardBeds.map((bed) => {
                      const isAvail = bed.status === "Available";
                      const isOcc = bed.status === "Occupied";
                      const isClean = bed.status === "Cleaning";
                      const isMaint = bed.status === "Maintenance";

                      return (
                        <div
                          key={bed.id}
                          className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                            isAvail
                              ? "bg-emerald-50/30 border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer"
                              : isOcc
                              ? "bg-rose-50/20 border-rose-200 shadow-sm"
                              : isClean
                              ? "bg-amber-50/30 border-amber-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                          onClick={() => isAvail && handleBedClick(bed)}
                        >
                          <div>
                            {/* Top row: Bed # and Status Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <BedDouble className={`w-4 h-4 ${isAvail ? "text-emerald-600" : isOcc ? "text-rose-600" : "text-amber-600"}`} />
                                <span>{bed.bedNumber}</span>
                              </div>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                  isAvail
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : isOcc
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : isClean
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : "bg-slate-200 text-slate-700 border-slate-300"
                                }`}
                              >
                                {bed.status}
                              </span>
                            </div>

                            {/* Bed Type & Rate */}
                            <p className="text-xs text-slate-500 mb-3">
                              {bed.bedType} &bull; {bed.dailyRateDisplay}
                            </p>

                            {/* Occupant Info if Occupied */}
                            {isOcc && bed.currentAdmission && (
                              <div className="p-3 bg-white rounded-xl border border-rose-100 shadow-2xs space-y-1 mb-3">
                                <p className="text-xs font-bold text-slate-900 flex items-center gap-1 truncate">
                                  <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span className="truncate">{bed.currentAdmission.patientName}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {bed.currentAdmission.patientUid} &bull; {bed.currentAdmission.phone}
                                </p>
                                <p className="text-[11px] text-blue-700 font-medium truncate">
                                  Dr. {bed.currentAdmission.doctorName}
                                </p>
                                <p className="text-[11px] text-slate-600 truncate italic">
                                  &ldquo;{bed.currentAdmission.provisionalDiagnosis}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* Cleaning info */}
                            {isClean && (
                              <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-800 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Sanitization in progress</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            {isAvail && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBedClick(bed);
                                }}
                                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Admit Patient
                              </button>
                            )}

                            {isOcc && (
                              <div className="grid grid-cols-2 gap-1.5 w-full">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const match = admissions.find((a) => a.bed.id === bed.id && a.status === "Admitted");
                                    if (match) {
                                      setSelectedAdmissionForAction(match);
                                      setIsTransferModalOpen(true);
                                    }
                                  }}
                                  className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-slate-600" />
                                  Transfer
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const match = admissions.find((a) => a.bed.id === bed.id && a.status === "Admitted");
                                    if (match) {
                                      setSelectedAdmissionForAction(match);
                                      setIsDischargeModalOpen(true);
                                    }
                                  }}
                                  className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition"
                                >
                                  <LogOut className="w-3 h-3 text-rose-600" />
                                  Discharge
                                </button>
                              </div>
                            )}

                            {isClean && (
                              <button
                                onClick={() => handleBedStatusUpdate(bed.id, "Available")}
                                className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Ready / Available
                              </button>
                            )}

                            {isMaint && (
                              <button
                                onClick={() => handleBedStatusUpdate(bed.id, "Available")}
                                className="w-full py-1.5 px-3 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Restore to Service
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ─── TAB 2: ACTIVE INPATIENTS ────────────────────────────────────────────── */}
      {activeTab === "active" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Currently Admitted Patients ({activeAdmissionsList.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Admission ID</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Ward & Bed</th>
                  <th className="px-6 py-3.5">Attending Doctor</th>
                  <th className="px-6 py-3.5">Admitted On</th>
                  <th className="px-6 py-3.5">Diagnosis</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAdmissionsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      No patients currently admitted.
                    </td>
                  </tr>
                ) : (
                  activeAdmissionsList.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 text-xs">
                        {adm.admissionNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{adm.patient.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {adm.patient.patientUid} &bull; {adm.patient.phone} &bull; {adm.patient.bloodGroup}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{adm.bed.bedNumber}</span>
                        <div className="text-xs text-slate-500">{adm.ward.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{adm.doctor.fullName}</div>
                        <div className="text-xs text-slate-500">{adm.doctor.department}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(adm.admissionDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-700" title={adm.provisionalDiagnosis}>
                        {adm.provisionalDiagnosis}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            adm.admissionPriority === "Emergency"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : adm.admissionPriority === "Urgent"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}
                        >
                          {adm.admissionPriority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdmissionForAction(adm);
                              setIsTransferModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          >
                            Transfer
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAdmissionForAction(adm);
                              setIsDischargeModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                          >
                            Discharge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: DISCHARGE HISTORY ────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Discharged Inpatients History ({historyAdmissionsList.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Admission ID</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Ward & Bed</th>
                  <th className="px-6 py-3.5">Attending Doctor</th>
                  <th className="px-6 py-3.5">Admitted</th>
                  <th className="px-6 py-3.5">Discharged</th>
                  <th className="px-6 py-3.5">Discharge Summary</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyAdmissionsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      No discharge history recorded yet.
                    </td>
                  </tr>
                ) : (
                  historyAdmissionsList.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 text-xs">
                        {adm.admissionNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{adm.patient.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono">{adm.patient.patientUid}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {adm.bed.bedNumber} ({adm.ward.name})
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-900">
                        {adm.doctor.fullName}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(adm.admissionDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600" title={adm.dischargeSummary || ""}>
                        {adm.dischargeSummary || "Standard recovery discharge"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {adm.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADMIT PATIENT ──────────────────────────────────────────────── */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Inpatient Admission Order</h3>
                  <p className="text-xs text-slate-500">Assign ward bed, attending physician, and intake terms</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdmitModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientUid} &bull; {p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Attending Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Consultant / Doctor *</label>
                <select
                  required
                  value={admitForm.doctorId}
                  onChange={(e) => setAdmitForm({ ...admitForm, doctorId: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Attending Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialization} - {d.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward and Bed Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Ward *</label>
                  <select
                    required
                    value={admitForm.wardId}
                    onChange={(e) => {
                      const wid = e.target.value;
                      const availableInWard = beds.filter((b) => b.ward.id === wid && b.status === "Available");
                      setAdmitForm({
                        ...admitForm,
                        wardId: wid,
                        bedId: availableInWard.length > 0 ? availableInWard[0].id : "",
                      });
                    }}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Ward --</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Floor {w.floorNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available Bed *</label>
                  <select
                    required
                    value={admitForm.bedId}
                    onChange={(e) => setAdmitForm({ ...admitForm, bedId: e.target.value })}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Available Bed --</option>
                    {beds
                      .filter((b) => (!admitForm.wardId || b.ward.id === admitForm.wardId) && b.status === "Available")
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bedNumber} ({b.bedType} - {b.dailyRateDisplay})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Priority & Estimated Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Priority</label>
                  <select
                    value={admitForm.admissionPriority}
                    onChange={(e) => setAdmitForm({ ...admitForm, admissionPriority: e.target.value })}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Routine">Routine Elective</option>
                    <option value="Urgent">Urgent Inpatient</option>
                    <option value="Emergency">Emergency / Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Deposit (BDT ৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={admitForm.initialDeposit}
                    onChange={(e) => setAdmitForm({ ...admitForm, initialDeposit: Number(e.target.value) })}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Provisional Diagnosis */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provisional Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute appendicitis, Pneumonia, Post-Op recovery..."
                  value={admitForm.provisionalDiagnosis}
                  onChange={(e) => setAdmitForm({ ...admitForm, provisionalDiagnosis: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Immediate Clinical Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Nursing & Clinical Care Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. NPO from midnight, IV normal saline at 80ml/hr, continuous cardiac monitor..."
                  value={admitForm.careInstructions}
                  onChange={(e) => setAdmitForm({ ...admitForm, careInstructions: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirm Inpatient Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DISCHARGE PATIENT ─────────────────────────────────────────── */}
      {isDischargeModalOpen && selectedAdmissionForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Finalize Inpatient Discharge</h3>
                  <p className="text-xs text-slate-500">Record discharge summary and release bed for sanitization</p>
                </div>
              </div>
              <button
                onClick={() => setIsDischargeModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="space-y-4">
              {/* Summary box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900 text-sm">{selectedAdmissionForAction.patient.fullName}</p>
                <p className="text-slate-600">
                  Admission ID: <span className="font-mono font-medium">{selectedAdmissionForAction.admissionNumber}</span>
                </p>
                <p className="text-slate-600">
                  Ward & Bed: <span className="font-bold text-slate-800">{selectedAdmissionForAction.bed.bedNumber}</span> ({selectedAdmissionForAction.ward.name})
                </p>
                <p className="text-slate-600">
                  Attending Consultant: <span className="font-medium text-slate-800">{selectedAdmissionForAction.doctor.fullName}</span>
                </p>
              </div>

              {/* Discharge Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discharge Summary & Advice *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Patient afebrile for 48 hours, incision clean, advised complete oral antibiotic course and follow-up in 7 days..."
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bed {selectedAdmissionForAction.bed.bedNumber} will automatically transition to <strong>Cleaning</strong> status upon discharge.</span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Authorize Discharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: TRANSFER BED ──────────────────────────────────────────────── */}
      {isTransferModalOpen && selectedAdmissionForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Transfer Patient Bed / Ward</h3>
                  <p className="text-xs text-slate-500">Reassign patient to an available ward or private cabin</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900 text-sm">{selectedAdmissionForAction.patient.fullName}</p>
                <p className="text-slate-600">
                  Current Location: <span className="font-bold text-slate-800">{selectedAdmissionForAction.bed.bedNumber}</span> ({selectedAdmissionForAction.ward.name})
                </p>
              </div>

              {/* Target Bed */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select New Available Bed *</label>
                <select
                  required
                  value={transferTargetBedId}
                  onChange={(e) => setTransferTargetBedId(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Target Bed --</option>
                  {beds
                    .filter((b) => b.status === "Available" && b.id !== selectedAdmissionForAction.bed.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} &bull; {b.ward.name} ({b.bedType} - {b.dailyRateDisplay})
                      </option>
                    ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  placeholder="e.g. Upgraded to private cabin, Post-op ICU transfer, Patient request..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
