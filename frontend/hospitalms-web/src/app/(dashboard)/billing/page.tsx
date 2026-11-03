"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  X,
  Check,
  Plus,
  Printer,
  FlaskConical,
  Receipt,
  QrCode,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  billingApi,
  laboratoryApi,
  patientsApi,
  doctorsApi,
  InvoiceListItem,
  LabTestItem,
  DoctorItem,
  getApiError,
} from "@/lib/api-client";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  // Payment Modal
  const [activeInvoice, setActiveInvoice] = useState<InvoiceListItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [txnRef, setTxnRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Diagnostic Slip Modal
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [patients, setPatients] = useState<Array<{ id: string; patientUid: string; fullName: string; phone: string }>>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [availableTests, setAvailableTests] = useState<LabTestItem[]>([]);

  const [diagnosticForm, setDiagnosticForm] = useState({
    patientId: "",
    doctorId: "",
    selectedTestIds: [] as string[],
    discountAmount: 0,
    amountPaid: 0,
    paymentMethod: "Cash",
    priority: "Routine",
  });

  const [submittingDiagnostic, setSubmittingDiagnostic] = useState(false);
  const [printedSlipData, setPrintedSlipData] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, sumRes] = await Promise.all([
        billingApi.getInvoices({
          status: statusFilter !== "All" ? statusFilter : undefined,
          pageSize: 50,
        }),
        billingApi.getSummary().catch(() => null),
      ]);

      if (invRes?.items) setInvoices(invRes.items);
      if (sumRes) setSummary(sumRes);
    } catch (err) {
      console.error("Failed to load billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Pre-load patients, doctors, tests for the billing desk
    patientsApi
      .getPatients({ pageSize: 100 })
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

    doctorsApi.getDoctors().then((docs) => setDoctors(docs)).catch(() => {});
    laboratoryApi.getTests().then((t) => setAvailableTests(t || [])).catch(() => {});
  }, [statusFilter]);

  // Calculate diagnostic totals live
  const selectedTestsList = useMemo(() => {
    return availableTests.filter((t) => diagnosticForm.selectedTestIds.includes(t.id));
  }, [availableTests, diagnosticForm.selectedTestIds]);

  const diagnosticSubTotal = useMemo(() => {
    return selectedTestsList.reduce((acc, t) => acc + t.price, 0);
  }, [selectedTestsList]);

  const diagnosticNetTotal = useMemo(() => {
    return Math.max(0, diagnosticSubTotal - diagnosticForm.discountAmount);
  }, [diagnosticSubTotal, diagnosticForm.discountAmount]);

  // When tests change, set default amount paid to net total
  const toggleTest = (testId: string) => {
    setDiagnosticForm((prev) => {
      const exists = prev.selectedTestIds.includes(testId);
      const updated = exists
        ? prev.selectedTestIds.filter((id) => id !== testId)
        : [...prev.selectedTestIds, testId];

      const newSubTotal = availableTests
        .filter((t) => updated.includes(t.id))
        .reduce((sum, t) => sum + t.price, 0);
      const newNet = Math.max(0, newSubTotal - prev.discountAmount);

      return {
        ...prev,
        selectedTestIds: updated,
        amountPaid: newNet,
      };
    });
  };

  const handleOpenPayment = (inv: InvoiceListItem) => {
    setActiveInvoice(inv);
    setPaymentAmount(inv.dueAmount);
    setPaymentMethod("Cash");
    setTxnRef("");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;

    try {
      setSubmittingPayment(true);
      await billingApi.recordPayment({
        invoiceId: activeInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: txnRef || undefined,
      });

      setSuccessMsg(`Payment of ৳${paymentAmount.toLocaleString("en-BD")} recorded successfully via ${paymentMethod}!`);
      setActiveInvoice(null);
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(getApiError(err, "Failed to record payment"));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreateDiagnosticSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosticForm.patientId || diagnosticForm.selectedTestIds.length === 0) {
      alert("Please select a patient and at least one diagnostic test.");
      return;
    }

    try {
      setSubmittingDiagnostic(true);
      const res = await billingApi.createDiagnosticSlip({
        patientId: diagnosticForm.patientId,
        doctorId: diagnosticForm.doctorId || undefined,
        testIds: diagnosticForm.selectedTestIds,
        discountAmount: Number(diagnosticForm.discountAmount) || 0,
        amountPaid: Number(diagnosticForm.amountPaid) || 0,
        paymentMethod: diagnosticForm.paymentMethod,
        priority: diagnosticForm.priority,
      });

      setIsDiagnosticModalOpen(false);
      setPrintedSlipData(res.data);
      setSuccessMsg("Diagnostic bill and Lab Slip generated successfully!");
      setDiagnosticForm({
        patientId: "",
        doctorId: "",
        selectedTestIds: [],
        discountAmount: 0,
        amountPaid: 0,
        paymentMethod: "Cash",
        priority: "Routine",
      });
      loadData();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      alert(getApiError(err, "Failed to create diagnostic slip"));
    } finally {
      setSubmittingDiagnostic(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance & Billing Desk</h1>
              <p className="text-sm text-slate-500">
                Patient invoices, cash collection, and official diagnostic slips (BDT ৳)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDiagnosticModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition"
          >
            <FlaskConical className="w-4 h-4" />
            New Diagnostic Bill & Slip
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.totalBilledDisplay ?? "৳0"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{summary?.totalCollectedDisplay ?? "৳0"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-rose-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Total Due Balance</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{summary?.totalDueDisplay ?? "৳0"}</p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-sm">Patient Billing Records</h3>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="PartiallyPaid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{inv.patient.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">{inv.patient.patientUid} &bull; {inv.patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(inv.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{inv.totalAmountDisplay}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">{inv.paidAmountDisplay}</td>
                    <td className="px-6 py-4 font-semibold text-rose-500">{inv.dueAmountDisplay}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inv.status === "PartiallyPaid"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.dueAmount > 0 && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                        >
                          Collect
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

      {/* ─── MODAL 1: NEW DIAGNOSTIC BILL & SLIP ─────────────────────────────── */}
      {isDiagnosticModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">New Diagnostic Invoicing & Lab Slip</h3>
                  <p className="text-xs text-slate-500">Select prescribed tests, receive payment, and issue lab token</p>
                </div>
              </div>
              <button
                onClick={() => setIsDiagnosticModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiagnosticSlip} className="space-y-4">
              {/* Patient */}
              <div>
                <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
                <select
                  required
                  value={diagnosticForm.patientId}
                  onChange={(e) => setDiagnosticForm({ ...diagnosticForm, patientId: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientUid} &bull; {p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label className="text-xs font-semibold text-slate-700">Prescribing Doctor / Consultant</label>
                <select
                  value={diagnosticForm.doctorId}
                  onChange={(e) => setDiagnosticForm({ ...diagnosticForm, doctorId: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Attending Doctor (Optional) --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialization} - {d.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Diagnostic Tests Selection */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Prescribed Diagnostic Tests *</label>
                  <span className="text-xs text-blue-600 font-semibold">
                    {diagnosticForm.selectedTestIds.length} test(s) selected
                  </span>
                </div>
                <div className="mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50 p-1">
                  {availableTests.map((t) => {
                    const isSelected = diagnosticForm.selectedTestIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition ${
                          isSelected ? "bg-blue-50/80 font-medium" : "hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTest(t.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <div>
                            <span className="text-slate-900">{t.name}</span>
                            <span className="block text-[11px] text-slate-500">
                              {t.category} &bull; Sample: {t.sampleType}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 text-xs">৳{t.price.toLocaleString("en-BD")}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-bold text-slate-900">৳{diagnosticSubTotal.toLocaleString("en-BD")}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Special Discount (৳):</span>
                  <input
                    type="number"
                    min="0"
                    max={diagnosticSubTotal}
                    value={diagnosticForm.discountAmount}
                    onChange={(e) =>
                      setDiagnosticForm({
                        ...diagnosticForm,
                        discountAmount: Number(e.target.value),
                        amountPaid: Math.max(0, diagnosticSubTotal - Number(e.target.value)),
                      })
                    }
                    className="w-28 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Net Payable:</span>
                  <span className="text-blue-600 text-base">৳{diagnosticNetTotal.toLocaleString("en-BD")}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Payment Method</label>
                  <select
                    value={diagnosticForm.paymentMethod}
                    onChange={(e) => setDiagnosticForm({ ...diagnosticForm, paymentMethod: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Amount Paid (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    max={diagnosticNetTotal}
                    value={diagnosticForm.amountPaid}
                    onChange={(e) => setDiagnosticForm({ ...diagnosticForm, amountPaid: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDiagnosticModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiagnostic || diagnosticForm.selectedTestIds.length === 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Issue Diagnostic Slip & Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: PRINTABLE DIAGNOSTIC SLIP & TOKEN ──────────────────────── */}
      {printedSlipData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 print:hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Diagnostic Token</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip
                </button>
                <button
                  onClick={() => setPrintedSlipData(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Paper Body */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4 shadow-xs font-sans">
              {/* Hospital Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-base font-extrabold text-slate-900 tracking-wide">
                  DHAKA CENTRAL HOSPITAL & DIAGNOSTICS
                </h2>
                <p className="text-[11px] text-slate-500">
                  Dhanmondi, Dhaka-1205 &bull; Phone: +880 1700-000000 &bull; 24/7 Hotline
                </p>
                <div className="inline-block px-3 py-0.5 mt-2 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Diagnostic Payment Slip & Laboratory Token
                </div>
              </div>

              {/* Order # and Barcode */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">SLIP / ORDER NO:</span>
                  <div className="text-base font-black font-mono text-blue-600">{printedSlipData.orderNumber}</div>
                  <div className="text-[10px] text-slate-500">Date: {printedSlipData.date}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold tracking-widest text-slate-800 border-2 border-slate-800 px-2 py-1 rounded">
                    |||| | | ||||| |||
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{printedSlipData.patient?.patientUid}</span>
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">PATIENT:</span>
                  <span className="font-bold text-slate-900">{printedSlipData.patient?.fullName}</span>
                  <span className="block text-[11px] text-slate-500">
                    Age: {printedSlipData.patient?.age}y &bull; {printedSlipData.patient?.gender} &bull; Blood: {printedSlipData.patient?.bloodGroup}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">REF BY:</span>
                  <span className="font-medium text-slate-800">
                    {printedSlipData.doctor ? `Dr. ${printedSlipData.doctor.fullName}` : "OPD Consultant"}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {printedSlipData.doctor?.department || "General OPD"}
                  </span>
                </div>
              </div>

              {/* Tests Table */}
              <div>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-1.5">Investigation</th>
                      <th className="py-1.5">Sample</th>
                      <th className="py-1.5 text-right">Fee (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printedSlipData.tests?.map((t: any) => (
                      <tr key={t.id}>
                        <td className="py-2 font-medium text-slate-800">{t.name}</td>
                        <td className="py-2 text-slate-500 text-[11px]">{t.sampleType}</td>
                        <td className="py-2 text-right font-bold text-slate-900">{t.priceDisplay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{printedSlipData.financials?.subTotalDisplay}</span>
                </div>
                {printedSlipData.financials?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount:</span>
                    <span>-{printedSlipData.financials?.discountDisplay}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-100">
                  <span>Net Total:</span>
                  <span>{printedSlipData.financials?.totalAmountDisplay}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Amount Paid ({printedSlipData.financials?.paymentMethod}):</span>
                  <span>{printedSlipData.financials?.paidAmountDisplay}</span>
                </div>
                {printedSlipData.financials?.dueAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Due Balance:</span>
                    <span>{printedSlipData.financials?.dueAmountDisplay}</span>
                  </div>
                )}
              </div>

              {/* Official Paid Stamp */}
              <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-center flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {printedSlipData.isPaid ? "PAID & VERIFIED — PROCEED TO LAB" : "PARTIAL / UNPAID"}
                </span>
              </div>

              {/* Instructions */}
              <p className="text-[10px] text-slate-400 text-center italic">
                Please present this slip at Pathology Sample Collection (Room 104). Reports will automatically publish to your Patient Portal once finalized.
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPrintedSlipData(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
              >
                Close & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: INVOICE PAYMENT ────────────────────────────────────────── */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-400 font-mono">{activeInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setActiveInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Patient</label>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{activeInvoice.patient.fullName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase">Total Bill</span>
                  <span className="text-base font-bold text-slate-900">{activeInvoice.totalAmountDisplay}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl">
                  <span className="text-[11px] text-rose-500 block font-semibold uppercase">Due Amount</span>
                  <span className="text-base font-bold text-rose-600">{activeInvoice.dueAmountDisplay}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={activeInvoice.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="BankTransfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Trx ID / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 9J47K2L8"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Confirm ৳{paymentAmount.toLocaleString("en-BD")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
