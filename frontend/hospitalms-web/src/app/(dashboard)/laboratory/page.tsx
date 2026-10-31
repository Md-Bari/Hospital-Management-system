"use client";

import { useEffect, useState } from "react";
import { Plus, X, FlaskConical, Check, AlertTriangle } from "lucide-react";
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
  Cancelled: "bg-slate-100 text-slate-500",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  STAT: "text-rose-600",
  Urgent: "text-amber-600",
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
  const [toast, setToast] = useState("");

  // New order modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [tests, setTests] = useState<LabTestItem[]>([]);
  const [orderForm, setOrderForm] = useState({ patientId: "", priority: "Routine", isPaid: false, testIds: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  // Results modal
  const [resultsOrder, setResultsOrder] = useState<{ id: string; orderNumber: string; patientName: string } | null>(null);
  const [resultItems, setResultItems] = useState<LabOrderDetailItem[]>([]);
  const [resultDrafts, setResultDrafts] = useState<Record<string, ResultDraft>>({});

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
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
      alert("Select a patient and at least one test.");
      return;
    }
    try {
      setSubmitting(true);
      const created = await laboratoryApi.createOrder(orderForm);
      setIsOrderModalOpen(false);
      setOrderForm({ patientId: "", priority: "Routine", isPaid: false, testIds: [] });
      showToast(`Lab order ${created.orderNumber} created (${created.totalAmountDisplay}).`);
      loadOrders();
    } catch (err) {
      alert(getApiError(err, "Failed to create lab order."));
    } finally {
      setSubmitting(false);
    }
  };

  const openResults = async (order: LabOrderListItem) => {
    try {
      const detail = await laboratoryApi.getOrderById(order.id);
      const items: LabOrderDetailItem[] = detail?.items ?? [];
      setResultItems(items);
      setResultDrafts(
        Object.fromEntries(items.map((i) => [i.id, { resultValue: i.resultValue ?? "", isAbnormal: i.isAbnormal ?? false }]))
      );
      setResultsOrder({ id: order.id, orderNumber: order.orderNumber, patientName: order.patient.fullName });
    } catch (err) {
      alert(getApiError(err, "Failed to load order details."));
    }
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultsOrder) return;
    const results = Object.entries(resultDrafts)
      .filter(([, d]) => d.resultValue.trim() !== "")
      .map(([itemId, d]) => ({ itemId, resultValue: d.resultValue, isAbnormal: d.isAbnormal }));
    if (results.length === 0) {
      alert("Enter at least one result.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await laboratoryApi.updateResults(resultsOrder.id, results);
      showToast(`Results saved for ${resultsOrder.orderNumber}. Order is now ${res?.status ?? "updated"}.`);
      setResultsOrder(null);
      loadOrders();
    } catch (err) {
      alert(getApiError(err, "Failed to save results."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laboratory & Diagnostics</h1>
          <p className="text-sm text-slate-500 mt-1">Test orders, sample priority, and result entry.</p>
        </div>
        <button
          onClick={() => {
            setOrderForm((prev) => ({ ...prev, patientId: prev.patientId || patients[0]?.id || "" }));
            setIsOrderModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Lab Order</span>
        </button>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-sm">Lab Orders</h3>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="InProcess">In Process</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loadError ? (
          <div className="p-12 text-center text-rose-500 text-sm">{loadError}</div>
        ) : loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading lab orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No lab orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order No</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Tests</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
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
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-[260px]">{o.tests.join(", ")}</td>
                    <td className={`px-6 py-4 text-xs font-bold ${PRIORITY_STYLES[o.priority] ?? "text-slate-500"}`}>{o.priority}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{o.totalAmountDisplay}</div>
                      <div className={`text-[11px] ${o.isPaid ? "text-emerald-600" : "text-rose-500"}`}>{o.isPaid ? "Paid" : "Unpaid"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[o.status] ?? STATUS_STYLES.Pending}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {o.status !== "Cancelled" && (
                        <button
                          onClick={() => openResults(o)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                        >
                          {o.status === "Completed" ? "View Results" : "Enter Results"}
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

      {/* New Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Lab Order</h3>
                <p className="text-xs text-slate-400">Select patient and diagnostic tests</p>
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
                        <input type="checkbox" checked={orderForm.testIds.includes(t.id)} onChange={() => toggleTest(t.id)} className="rounded text-blue-600" />
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
                  Paid at counter
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

      {/* Results Modal */}
      {resultsOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Test Results</h3>
                <p className="text-xs text-slate-400">
                  {resultsOrder.orderNumber} • {resultsOrder.patientName}
                </p>
              </div>
              <button onClick={() => setResultsOrder(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResults} className="space-y-4">
              {resultItems.map((item) => {
                const draft = resultDrafts[item.id] ?? { resultValue: "", isAbnormal: false };
                return (
                  <div key={item.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <FlaskConical className="w-4 h-4 text-blue-600" />
                        {item.testName}
                      </div>
                      {item.status === "Completed" && <span className="text-[11px] font-semibold text-emerald-600">Reported</span>}
                    </div>
                    {item.referenceRange && <p className="text-[11px] text-slate-400 mt-0.5">Ref: {item.referenceRange}</p>}
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="text"
                        value={draft.resultValue}
                        onChange={(e) => setResultDrafts({ ...resultDrafts, [item.id]: { ...draft, resultValue: e.target.value } })}
                        placeholder="Result value"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                      <label className="flex items-center gap-1.5 text-xs font-medium text-rose-600 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={draft.isAbnormal}
                          onChange={(e) => setResultDrafts({ ...resultDrafts, [item.id]: { ...draft, isAbnormal: e.target.checked } })}
                          className="rounded text-rose-600"
                        />
                        <AlertTriangle className="w-3 h-3" />
                        Abnormal
                      </label>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setResultsOrder(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Results"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
