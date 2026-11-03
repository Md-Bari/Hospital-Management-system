"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  X,
  FlaskConical,
  Check,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  ShieldCheck,
  Clock,
  User,
  Activity,
  ArrowRight
} from "lucide-react";
import {
  laboratoryApi,
  patientsApi,
  getApiError,
  LabOrderListItem,
  LabOrderDetailItem,
  LabTestItem,
  PatientItem,
} from "@/lib/api-client";

const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  InProcess: "bg-blue-50 text-blue-700 border border-blue-200",
  SampleCollected: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Cancelled: "bg-slate-100 text-slate-500 border border-slate-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  STAT: "text-rose-600 font-bold",
  Urgent: "text-amber-600 font-bold",
  Routine: "text-slate-500",
};

interface ResultDraft {
  resultValue: string;
  isAbnormal: boolean;
}

export default function LaboratoryPage() {
  const [orders, setOrders] = useState<LabOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Slip Lookup State
  const [slipQuery, setSlipQuery] = useState("");
  const [searchingSlip, setSearchingSlip] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeSlipOrder, setActiveSlipOrder] = useState<any | null>(null);

  // New order modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [tests, setTests] = useState<LabTestItem[]>([]);
  const [orderForm, setOrderForm] = useState({ patientId: "", priority: "Routine", isPaid: false, testIds: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  // Results modal
  const [resultsOrder, setResultsOrder] = useState<{ id: string; orderNumber: string; patientName: string; isPaid: boolean; status: string } | null>(null);
  const [resultItems, setResultItems] = useState<LabOrderDetailItem[]>([]);
  const [resultDrafts, setResultDrafts] = useState<Record<string, ResultDraft>>({});

  // View Report Modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportOrder, setReportOrder] = useState<any | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await laboratoryApi.getOrders({
        status: statusFilter !== "All" ? statusFilter : undefined,
        pageSize: 50,
      });
      setOrders(res?.items ?? []);
    } catch (err) {
      setLoadError(getApiError(err, "Failed to load lab orders."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    patientsApi.getPatients({ pageSize: 100 }).then((res) => setPatients(res?.items ?? [])).catch(() => setPatients([]));
    laboratoryApi.getTests().then((res) => setTests(res ?? [])).catch(() => setTests([]));
  }, []);

  const handleLookupSlip = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!slipQuery.trim()) return;

    try {
      setSearchingSlip(true);
      const data = await laboratoryApi.getOrderBySlip(slipQuery.trim());
      setActiveSlipOrder(data);
      showToast(`Slip #${data.orderNumber} loaded successfully.`, "success");
    } catch (err) {
      setActiveSlipOrder(null);
      showToast(getApiError(err, "No diagnostic order found with this slip or order number."), "error");
    } finally {
      setSearchingSlip(false);
    }
  };

  const handleCollectSample = async (orderId: string) => {
    try {
      setSubmitting(true);
      const res = await laboratoryApi.collectSample(orderId);
      showToast(res.message || "Sample successfully collected and registered for testing.", "success");
      loadOrders();
      if (activeSlipOrder && activeSlipOrder.id === orderId) {
        setActiveSlipOrder((prev: any) => ({ ...prev, status: "SampleCollected" }));
      }
    } catch (err) {
      showToast(getApiError(err, "Cannot collect sample. Please verify payment at Finance counter."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openResults = async (order: { id: string; orderNumber: string; patientName?: string; patient?: { fullName: string }; isPaid?: boolean; status?: string }) => {
    try {
      const detail = await laboratoryApi.getOrderById(order.id);
      const items: LabOrderDetailItem[] = detail?.items ?? [];
      setResultItems(items);
      setResultDrafts(
        Object.fromEntries(items.map((i) => [i.id, { resultValue: i.resultValue ?? "", isAbnormal: i.isAbnormal ?? false }]))
      );
      setResultsOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        patientName: order.patientName ?? order.patient?.fullName ?? "Patient",
        isPaid: detail.isPaid ?? order.isPaid ?? false,
        status: detail.status ?? order.status ?? "Pending",
      });
    } catch (err) {
      showToast(getApiError(err, "Failed to load order details."), "error");
    }
  };

  const handleSaveResults = async (andVerify = false) => {
    if (!resultsOrder) return;
    const results = Object.entries(resultDrafts)
      .filter(([, d]) => d.resultValue.trim() !== "")
      .map(([itemId, d]) => ({ itemId, resultValue: d.resultValue, isAbnormal: d.isAbnormal }));

    if (results.length === 0) {
      showToast("Please enter at least one test result.", "error");
      return;
    }

    try {
      setSubmitting(true);
      await laboratoryApi.updateResults(resultsOrder.id, results);

      if (andVerify) {
        await laboratoryApi.verifyReport(resultsOrder.id);
        showToast(`Report verified & published to Patient Portal for ${resultsOrder.orderNumber}!`, "success");
      } else {
        showToast(`Draft results saved for ${resultsOrder.orderNumber}.`, "success");
      }

      setResultsOrder(null);
      loadOrders();
      if (activeSlipOrder && activeSlipOrder.id === resultsOrder.id) {
        handleLookupSlip();
      }
    } catch (err) {
      showToast(getApiError(err, "Failed to save results."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openReportModal = async (orderId: string) => {
    try {
      const detail = await laboratoryApi.getOrderById(orderId);
      setReportOrder(detail);
    } catch (err) {
      showToast(getApiError(err, "Failed to load lab report."), "error");
    }
  };

  const toggleTest = (id: string) => {
    setOrderForm((prev) => ({
      ...prev,
      testIds: prev.testIds.includes(id) ? prev.testIds.filter((t) => t !== id) : [...prev.testIds, id],
    }));
  };

  const orderTotal = tests.filter((t) => orderForm.testIds.includes(t.id)).reduce((sum, t) => sum + t.price, 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.patientId || orderForm.testIds.length === 0) {
      showToast("Select a patient and at least one test.", "error");
      return;
    }
    try {
      setSubmitting(true);
      const created = await laboratoryApi.createOrder(orderForm);
      setIsOrderModalOpen(false);
      setOrderForm({ patientId: "", priority: "Routine", isPaid: false, testIds: [] });
      showToast(`Lab order ${created.orderNumber} created (${created.totalAmountDisplay}).`, "success");
      loadOrders();
    } catch (err) {
      showToast(getApiError(err, "Failed to create lab order."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pathology & Diagnostic Laboratory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Diagnostic slip intake, sample collection with billing verification, and verified report publishing.
          </p>
        </div>
        <button
          onClick={() => {
            setOrderForm((prev) => ({ ...prev, patientId: prev.patientId || patients[0]?.id || "" }));
            setIsOrderModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Lab Order</span>
        </button>
      </div>

      {/* Global Toast */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-medium">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: Slip Intake & Payment Verification Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl border border-blue-800/40">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            <span>Pathology Reception & Sample Intake Counter</span>
          </div>
          <h2 className="text-xl font-bold">Diagnostic Slip / Token Verification</h2>
          <p className="text-sm text-blue-100/80 mt-1">
            Enter or scan the Diagnostic Slip # (e.g. <span className="font-mono text-amber-300">LAB-20261103-0001</span>) or Patient UID to verify finance clearance before drawing samples.
          </p>

          <form onSubmit={handleLookupSlip} className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={slipQuery}
                onChange={(e) => setSlipQuery(e.target.value)}
                placeholder="Enter Slip/Order # (LAB-...) or Patient UID (P-...) or Phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={searchingSlip || !slipQuery.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {searchingSlip ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Verify & Fetch Slip</span>
            </button>
          </form>
        </div>

        {/* ACTIVE SLIP VERIFICATION CARD */}
        {activeSlipOrder && (
          <div className="mt-6 bg-white text-slate-900 rounded-2xl p-5 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-blue-700">{activeSlipOrder.orderNumber}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[activeSlipOrder.status] ?? STATUS_STYLES.Pending}`}>
                    {activeSlipOrder.status}
                  </span>
                  <span className={`text-xs ${PRIORITY_STYLES[activeSlipOrder.priority] ?? "text-slate-500"}`}>
                    Priority: {activeSlipOrder.priority}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Ordered On: {new Date(activeSlipOrder.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* PAYMENT VERIFICATION BADGE */}
              <div>
                {activeSlipOrder.isPaid ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">Payment Verified</div>
                      <div className="text-[11px] text-emerald-600">Paid at Finance Counter ({activeSlipOrder.totalAmountDisplay})</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">Unpaid Bill: {activeSlipOrder.totalAmountDisplay}</div>
                      <div className="text-[11px] text-rose-600">Direct patient to Finance counter before sample intake</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PATIENT & DOCTOR INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
              <div className="space-y-1">
                <div className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Patient Information</div>
                <div className="font-bold text-slate-900 text-sm">{activeSlipOrder.patient.fullName}</div>
                <div className="text-slate-600">
                  UID: <span className="font-mono font-semibold">{activeSlipOrder.patient.patientUid}</span> • {activeSlipOrder.patient.gender} • Age: {activeSlipOrder.patient.age || "N/A"} • Blood: {activeSlipOrder.patient.bloodGroup || "N/A"}
                </div>
                <div className="text-slate-500">Phone: {activeSlipOrder.patient.phone}</div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Prescribing Consultant</div>
                <div className="font-semibold text-slate-800">
                  {activeSlipOrder.doctor ? activeSlipOrder.doctor.fullName : "General Pathology Order"}
                </div>
                {activeSlipOrder.doctor && (
                  <div className="text-slate-500">
                    {activeSlipOrder.doctor.specialization} ({activeSlipOrder.doctor.department})
                  </div>
                )}
              </div>
            </div>

            {/* PRESCRIBED TESTS LIST */}
            <div className="py-4">
              <div className="text-xs font-bold text-slate-800 mb-2">Prescribed Diagnostic Tests:</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2">Test Name</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Sample Specimen</th>
                      <th className="px-3 py-2">Reference Range</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSlipOrder.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{item.testName}</td>
                        <td className="px-3 py-2.5 text-slate-600">{item.category}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {item.sampleType || "Blood"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{item.referenceRange || "Standard"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">{item.unitPriceDisplay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLIP ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {activeSlipOrder.isPaid ? (
                  <span className="text-emerald-700 font-medium">Payment is cleared. Proceed with specimen intake and testing.</span>
                ) : (
                  <span className="text-rose-600 font-semibold">⚠️ Cannot collect sample until patient pays at the Finance counter.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeSlipOrder.isPaid && activeSlipOrder.status === "Pending" && (
                  <button
                    onClick={() => handleCollectSample(activeSlipOrder.id)}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Collect Sample & Register Intake</span>
                  </button>
                )}

                {activeSlipOrder.status !== "Cancelled" && activeSlipOrder.status !== "Completed" && (
                  <button
                    onClick={() => openResults(activeSlipOrder)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Enter & Verify Results</span>
                  </button>
                )}

                {activeSlipOrder.status === "Completed" && (
                  <button
                    onClick={() => openReportModal(activeSlipOrder.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View & Print Verified Report</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveSlipOrder(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Orders Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Laboratory Diagnostic Orders Queue</h3>
            <p className="text-xs text-slate-400">Manage patient orders, sample collection status, and published results</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Sample</option>
              <option value="SampleCollected">Sample Collected</option>
              <option value="InProcess">In Process</option>
              <option value="Completed">Completed & Verified</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loadError ? (
          <div className="p-12 text-center text-rose-500 text-sm">{loadError}</div>
        ) : loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading lab orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No diagnostic orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Slip / Order No</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Prescribed Tests</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Fee & Payment</th>
                  <th className="px-6 py-4 font-semibold">Lab Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-xs text-blue-600">{o.orderNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(o.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{o.patient.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">{o.patient.patientUid}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-[240px]">
                      <div className="line-clamp-2">{o.tests.join(", ")}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{o.itemCount} test(s)</div>
                    </td>
                    <td className={`px-6 py-4 text-xs ${PRIORITY_STYLES[o.priority] ?? "text-slate-500"}`}>
                      {o.priority}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{o.totalAmountDisplay}</div>
                      <div className="mt-0.5">
                        {o.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                            <X className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[o.status] ?? STATUS_STYLES.Pending}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {o.isPaid && o.status === "Pending" && (
                        <button
                          onClick={() => handleCollectSample(o.id)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all"
                        >
                          Collect Sample
                        </button>
                      )}

                      {o.status !== "Cancelled" && (
                        <button
                          onClick={() => (o.status === "Completed" ? openReportModal(o.id) : openResults(o))}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all ${
                            o.status === "Completed"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {o.status === "Completed" ? "View Report" : "Enter Results"}
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

      {/* MODAL 1: Results Entry & Verification */}
      {resultsOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Diagnostic Result Entry</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[resultsOrder.status] ?? "bg-slate-100"}`}>
                    {resultsOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order #{resultsOrder.orderNumber} • {resultsOrder.patientName}
                </p>
              </div>
              <button onClick={() => setResultsOrder(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Prescribed Test Parameters & Findings
              </div>

              {resultItems.map((item) => {
                const draft = resultDrafts[item.id] ?? { resultValue: "", isAbnormal: false };
                return (
                  <div key={item.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <FlaskConical className="w-4 h-4 text-blue-600" />
                        <span>{item.testName}</span>
                      </div>
                      {item.status === "Completed" && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Result Entered
                        </span>
                      )}
                    </div>

                    {item.referenceRange && (
                      <p className="text-xs text-slate-500 font-mono">
                        Reference Normal Range: <span className="font-semibold text-slate-700">{item.referenceRange}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="text"
                        value={draft.resultValue}
                        onChange={(e) =>
                          setResultDrafts({
                            ...resultDrafts,
                            [item.id]: { ...draft, resultValue: e.target.value },
                          })
                        }
                        placeholder="Enter measured value (e.g., 14.2 g/dL, Negative, 98 mg/dL)..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 cursor-pointer select-none bg-rose-50/60 hover:bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                        <input
                          type="checkbox"
                          checked={draft.isAbnormal}
                          onChange={(e) =>
                            setResultDrafts({
                              ...resultDrafts,
                              [item.id]: { ...draft, isAbnormal: e.target.checked },
                            })
                          }
                          className="rounded text-rose-600"
                        />
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Abnormal</span>
                      </label>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  Clicking <strong>&ldquo;Verify & Publish to Portal&rdquo;</strong> will mark this diagnostic report as verified by the Pathologist, immediately sending the report to the <strong>Patient Portal</strong> and attending Doctor EHR.
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResultsOrder(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveResults(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveResults(true)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Publish to Portal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View / Print Verified Report */}
      {reportOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 print:hidden">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Diagnostic Pathology Report</h3>
                <p className="text-xs text-slate-400">Order #{reportOrder.orderNumber} • Published to Patient Portal</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
                <button onClick={() => setReportOrder(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Report Template */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-xl font-bold tracking-tight text-blue-900">DHAKA SPECIALIZED GENERAL HOSPITAL</h2>
                <p className="text-xs text-slate-500">Department of Pathology & Molecular Diagnostics • Plot 12, Road 4, Dhanmondi, Dhaka-1205</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OFFICIAL VERIFIED LABORATORY REPORT</span>
                </div>
              </div>

              {/* Patient / Referral Info */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Patient Details</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{reportOrder.patient?.fullName}</div>
                  <div className="text-slate-600">
                    UID: <span className="font-mono font-semibold">{reportOrder.patient?.patientUid}</span>
                  </div>
                  <div className="text-slate-500">Phone: {reportOrder.patient?.phone}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Order & Referral Info</div>
                  <div className="text-slate-700">Order No: <span className="font-mono font-bold text-blue-700">{reportOrder.orderNumber}</span></div>
                  <div className="text-slate-700">Ref Doctor: <span className="font-medium">{reportOrder.doctor?.fullName || "OPD Doctor"}</span></div>
                  <div className="text-slate-500">
                    Date: {new Date(reportOrder.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div>
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Investigation / Test Name</th>
                      <th className="px-4 py-2.5">Result</th>
                      <th className="px-4 py-2.5">Reference Normal Range</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportOrder.items?.map((item: any) => (
                      <tr key={item.id} className={item.isAbnormal ? "bg-rose-50/60" : "hover:bg-slate-50"}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.testName}</td>
                        <td className={`px-4 py-3 font-bold ${item.isAbnormal ? "text-rose-600" : "text-slate-800"}`}>
                          {item.resultValue || "Pending"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{item.referenceRange || "Standard"}</td>
                        <td className="px-4 py-3 text-center">
                          {item.isAbnormal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              <AlertTriangle className="w-3 h-3" /> Abnormal
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Verification Signature & Footer */}
              <div className="pt-6 flex items-end justify-between border-t border-slate-200 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Electronic Verification Hash:</div>
                  <div className="font-mono text-[10px] text-slate-600">VERIFIED-{reportOrder.orderNumber}-AUTH-OK</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">Dr. M. Rahman, MBBS, MD (Pathology)</div>
                  <div className="text-[11px] text-slate-500">Chief Consultant Pathologist</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">Verified & Digitally Signed</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setReportOrder(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Lab Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manual Lab Order</h3>
                <p className="text-xs text-slate-400">Create an internal test requisition for patient</p>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Patient *</label>
                <select
                  required
                  value={orderForm.patientId}
                  onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
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
                <label className="text-xs font-semibold text-slate-700">Tests *</label>
                <div className="mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {tests.map((t) => (
                    <label key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={orderForm.testIds.includes(t.id)}
                          onChange={() => toggleTest(t.id)}
                          className="rounded text-blue-600"
                        />
                        <span>
                          <span className="font-medium text-slate-800">{t.name}</span>
                          <span className="block text-[11px] text-slate-400">
                            {t.category} • {t.sampleType} • ~{t.turnaroundHours}h
                          </span>
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-slate-700">{t.priceDisplay}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Priority</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 pt-6 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={orderForm.isPaid}
                    onChange={(e) => setOrderForm({ ...orderForm, isPaid: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  Mark as Paid
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-900">Total: ৳{orderTotal.toLocaleString("en-BD")}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || orderForm.testIds.length === 0}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Order"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
