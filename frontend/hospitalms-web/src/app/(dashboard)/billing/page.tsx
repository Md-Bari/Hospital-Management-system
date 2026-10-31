"use client";

import { useEffect, useState } from "react";
import { Search, CreditCard, DollarSign, CheckCircle2, Clock, X, Check } from "lucide-react";
import { billingApi, InvoiceListItem, getApiError } from "@/lib/api-client";

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, sumRes] = await Promise.all([
        billingApi.getInvoices({
          status: statusFilter !== "All" ? statusFilter : undefined,
          pageSize: 30,
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
  }, [statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Accounts Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Patient invoices, revenue collection in BDT, Cash / bKash / Nagad / Card reconciliation.
          </p>
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
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.totalBilledDisplay ?? "৳0"}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{summary?.totalCollectedDisplay ?? "৳0"}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Due Balance</p>
            <p className="text-2xl font-bold text-rose-500 mt-0.5">{summary?.totalDueDisplay ?? "৳0"}</p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-sm">Patient Invoices</h3>

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
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Invoice No</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Paid</th>
                  <th className="px-6 py-4 font-semibold">Due</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
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
                      <div className="text-xs text-slate-400 font-mono">{inv.patient.patientUid}</div>
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

      {/* Payment Collection Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Collect Payment</h3>
                <p className="text-xs text-slate-400">
                  {activeInvoice.invoiceNumber} • {activeInvoice.patient.fullName}
                </p>
              </div>
              <button
                onClick={() => setActiveInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400">Due Amount</span>
                  <p className="text-xl font-bold text-rose-500">{activeInvoice.dueAmountDisplay}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Total Bill</span>
                  <p className="text-sm font-semibold text-slate-700">{activeInvoice.totalAmountDisplay}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  max={activeInvoice.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="Cash">Cash (Counter)</option>
                  <option value="bKash">bKash (MFS)</option>
                  <option value="Nagad">Nagad (MFS)</option>
                  <option value="Card">Visa / Mastercard / POS</option>
                  <option value="BankTransfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Transaction Reference / Note</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g. TrxID or Receipt Slip #"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || paymentAmount <= 0 || paymentAmount > activeInvoice.dueAmount}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingPayment ? "Processing..." : `Confirm Payment (৳${paymentAmount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

