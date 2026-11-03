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
  Stethoscope,
  Pill,
  BedDouble,
  Activity,
  FileText,
  Trash2,
  Building2,
  User,
  ArrowRight
} from "lucide-react";
import {
  billingApi,
  laboratoryApi,
  patientsApi,
  doctorsApi,
  InvoiceListItem,
  LabTestItem,
  DoctorItem,
  ServicesCatalogItem,
  getApiError,
} from "@/lib/api-client";

interface BillLineItem {
  id: string;
  itemName: string;
  itemType: string; // Consultation, LabTest, Medicine, Bed, Procedure, Emergency, General
  quantity: number;
  unitPrice: number;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Consultation: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Consultation" },
  LabTest: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", label: "Diagnostics" },
  Diagnostic: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", label: "Diagnostics" },
  Medicine: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Pharmacy" },
  Bed: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", label: "Inpatient/Bed" },
  Procedure: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", label: "Procedure/OT" },
  Emergency: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", label: "Emergency" },
  General: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", label: "General Service" },
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Patients & Catalog Data
  const [patients, setPatients] = useState<Array<{ id: string; patientUid: string; fullName: string; phone: string }>>([]);
  const [catalog, setCatalog] = useState<ServicesCatalogItem | null>(null);

  // Universal Bill Creation Modal State
  const [isUniversalBillOpen, setIsUniversalBillOpen] = useState(false);
  const [activeCatalogTab, setActiveCatalogTab] = useState<"Consultation" | "LabTest" | "Medicine" | "Bed" | "Procedure" | "General" | "Custom">("Consultation");
  const [billPatientId, setBillPatientId] = useState("");
  const [billDoctorId, setBillDoctorId] = useState("");
  const [billItems, setBillItems] = useState<BillLineItem[]>([]);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [billDiscountReason, setBillDiscountReason] = useState("Standard Hospital Tariff");
  const [billTax, setBillTax] = useState<number>(0);
  const [billAmountPaid, setBillAmountPaid] = useState<number>(0);
  const [billPaymentMethod, setBillPaymentMethod] = useState("Cash");
  const [billTxnRef, setBillTxnRef] = useState("");
  const [billNotes, setBillNotes] = useState("");
  const [autoGenLab, setAutoGenLab] = useState(true);

  // Custom Line Item Inputs
  const [customItemName, setCustomItemName] = useState("");
  const [customItemCategory, setCustomItemCategory] = useState("General");
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [customItemQty, setCustomItemQty] = useState<number>(1);

  // Diagnostic Slip Modal State (Quick action)
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticForm, setDiagnosticForm] = useState({
    patientId: "",
    doctorId: "",
    selectedTestIds: [] as string[],
    discountAmount: 0,
    amountPaid: 0,
    paymentMethod: "Cash",
    priority: "Routine",
  });

  // Collect Payment Modal State (for unpaid/partial invoices)
  const [activeInvoice, setActiveInvoice] = useState<InvoiceListItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentTxnRef, setPaymentTxnRef] = useState("");

  // Money Receipt & Voucher Printing Modal State
  const [printedReceiptData, setPrintedReceiptData] = useState<any | null>(null);

  // Toast / Status Feedback
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, sumRes] = await Promise.all([
        billingApi.getInvoices({
          status: statusFilter !== "All" ? statusFilter : undefined,
          itemType: categoryFilter !== "All" ? categoryFilter : undefined,
          search: searchQuery.trim() || undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    // Load patients and services catalog
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

    billingApi
      .getServicesCatalog()
      .then((cat) => setCatalog(cat))
      .catch((err) => console.error("Catalog fetch failed", err));
  }, []);

  // Universal Bill Calculations
  const billSubTotal = useMemo(() => {
    return billItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [billItems]);

  const billNetTotal = useMemo(() => {
    const discounted = Math.max(0, billSubTotal - (Number(billDiscount) || 0));
    return discounted + (Number(billTax) || 0);
  }, [billSubTotal, billDiscount, billTax]);

  const billDueAmount = useMemo(() => {
    return Math.max(0, billNetTotal - (Number(billAmountPaid) || 0));
  }, [billNetTotal, billAmountPaid]);

  // Quick addition of catalog item into the bill
  const addLineItem = (itemName: string, itemType: string, unitPrice: number, quantity = 1) => {
    const existingIndex = billItems.findIndex((i) => i.itemName.toLowerCase() === itemName.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...billItems];
      updated[existingIndex].quantity += quantity;
      setBillItems(updated);
    } else {
      setBillItems([
        ...billItems,
        {
          id: Math.random().toString(36).substring(2, 9),
          itemName,
          itemType,
          quantity,
          unitPrice,
        },
      ]);
    }

    // Auto set amount paid to match net total if not modified
    setTimeout(() => {
      setBillAmountPaid((prev) => (prev === 0 || prev === billSubTotal ? billNetTotal : prev));
    }, 50);
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeLineItem(index);
      return;
    }
    const updated = [...billItems];
    updated[index].quantity = newQty;
    setBillItems(updated);
  };

  const removeLineItem = (index: number) => {
    const updated = billItems.filter((_, i) => i !== index);
    setBillItems(updated);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) {
      showToast("Please enter a service or item name", "error");
      return;
    }
    if (customItemPrice < 0) {
      showToast("Price cannot be negative", "error");
      return;
    }
    addLineItem(customItemName.trim(), customItemCategory, Number(customItemPrice), Number(customItemQty) || 1);
    setCustomItemName("");
    setCustomItemPrice(0);
    setCustomItemQty(1);
  };

  // Open Universal Bill Modal
  const openNewUniversalBill = () => {
    setBillPatientId(patients[0]?.id || "");
    setBillDoctorId("");
    setBillItems([]);
    setBillDiscount(0);
    setBillDiscountReason("Standard Hospital Tariff");
    setBillTax(0);
    setBillAmountPaid(0);
    setBillPaymentMethod("Cash");
    setBillTxnRef("");
    setBillNotes("");
    setIsUniversalBillOpen(true);
  };

  // Submit Universal Bill & Collect Payment
  const handleCreateUniversalBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billPatientId) {
      showToast("Please select a registered patient", "error");
      return;
    }
    if (billItems.length === 0) {
      showToast("Please add at least one billable item to the invoice", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await billingApi.createInvoice({
        patientId: billPatientId,
        doctorId: billDoctorId || undefined,
        discountAmount: Number(billDiscount) || 0,
        discountReason: billDiscountReason,
        taxAmount: Number(billTax) || 0,
        amountPaid: Number(billAmountPaid) || 0,
        paymentMethod: billPaymentMethod,
        transactionReference: billTxnRef || undefined,
        notes: billNotes || undefined,
        autoGenerateLabOrder: autoGenLab,
        items: billItems.map((i) => ({
          itemName: i.itemName,
          itemType: i.itemType,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      setIsUniversalBillOpen(false);
      showToast(res.message || "Hospital Bill and Money Receipt generated successfully!", "success");
      if (res.data?.moneyReceipt) {
        setPrintedReceiptData(res.data.moneyReceipt);
      }
      loadData();
    } catch (err) {
      showToast(getApiError(err, "Failed to create hospital bill"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Record Payment on Due Invoice
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;

    try {
      setSubmitting(true);
      const res = await billingApi.recordPayment({
        invoiceId: activeInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: paymentTxnRef || undefined,
      });

      showToast(`Payment of ৳${paymentAmount.toLocaleString("en-BD")} recorded successfully via ${paymentMethod}!`, "success");
      setActiveInvoice(null);
      if (res?.receipt) {
        // Construct printable voucher
        setPrintedReceiptData({
          receiptNumber: res.receipt.receiptNumber,
          invoiceNumber: res.receipt.invoiceNumber,
          date: res.receipt.date,
          status: res.invoiceStatus,
          isFullyPaid: res.invoiceStatus === "Paid",
          patient: res.receipt.patient,
          items: [{ itemName: "Bill Payment Clearance", itemType: "Payment", quantity: 1, unitPrice: res.receipt.paidAmount, totalPrice: res.receipt.paidAmount, totalPriceDisplay: res.receipt.paidAmountDisplay }],
          financials: {
            subTotal: res.receipt.paidAmount,
            subTotalDisplay: res.receipt.paidAmountDisplay,
            discount: 0,
            discountDisplay: "৳0",
            totalAmount: res.receipt.paidAmount,
            totalAmountDisplay: res.receipt.paidAmountDisplay,
            paidAmount: res.receipt.paidAmount,
            paidAmountDisplay: res.receipt.paidAmountDisplay,
            dueAmount: res.receipt.remainingDue,
            dueAmountDisplay: `৳${res.receipt.remainingDue.toLocaleString("en-BD")}`,
            paymentMethod: res.receipt.paymentMethod,
            transactionReference: res.receipt.transactionReference,
          },
          cashierName: "Accounts & Billing Desk",
          hospital: {
            name: "Dhaka Specialized General Hospital",
            address: "Plot 14, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
            hotline: "+880 2 9660000 / +880 1711-000001",
          },
        });
      }
      loadData();
    } catch (err) {
      showToast(getApiError(err, "Failed to record payment"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Invoice Printable View
  const handleViewInvoiceReceipt = async (invoiceId: string) => {
    try {
      const inv = await billingApi.getInvoiceById(invoiceId);
      if (!inv) return;
      setPrintedReceiptData({
        receiptNumber: inv.Payments?.[0]?.paymentNumber || `INV-${inv.invoiceNumber}`,
        invoiceNumber: inv.invoiceNumber,
        date: new Date(inv.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: inv.status,
        isFullyPaid: inv.status === "Paid",
        patient: inv.Patient,
        items: inv.Items.map((i: any) => ({
          itemName: i.itemName,
          itemType: i.itemType,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          totalPriceDisplay: i.totalPriceDisplay,
        })),
        financials: {
          subTotal: inv.subTotal,
          subTotalDisplay: `৳${inv.subTotal.toLocaleString("en-BD")}`,
          discount: inv.discountAmount,
          discountDisplay: `৳${inv.discountAmount.toLocaleString("en-BD")}`,
          tax: inv.taxAmount,
          taxDisplay: `৳${inv.taxAmount.toLocaleString("en-BD")}`,
          totalAmount: inv.totalAmount,
          totalAmountDisplay: inv.totalAmountDisplay,
          paidAmount: inv.paidAmount,
          paidAmountDisplay: inv.paidAmountDisplay,
          dueAmount: inv.dueAmount,
          dueAmountDisplay: inv.dueAmountDisplay,
          paymentMethod: inv.Payments?.[0]?.paymentMethod || "Cash",
          transactionReference: inv.Payments?.[0]?.transactionReference,
        },
        cashierName: "Accounts & Billing Desk",
        hospital: {
          name: "Dhaka Specialized General Hospital",
          address: "Plot 14, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
          hotline: "+880 2 9660000 / +880 1711-000001",
        },
      });
    } catch (err) {
      showToast(getApiError(err, "Failed to fetch invoice receipt"), "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Billing & Cashier Desk</h1>
          <p className="text-sm text-slate-500 mt-1">
            Universal billing for OPD Consultations, Diagnostics, Pharmacy, Inpatient/Bed charges, Procedures & OT.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNewUniversalBill}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Hospital Bill & Take Payment</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{summary?.totalBilledDisplay ?? "৳0"}</div>
          <div className="mt-1 text-xs text-slate-400">Total hospital invoices generated</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash & Collections</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600">{summary?.totalCollectedDisplay ?? "৳0"}</div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">Realized revenue in cash & digital</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Dues</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-600">{summary?.totalDueDisplay ?? "৳0"}</div>
          <div className="mt-1 text-xs text-rose-500 font-medium">{summary?.unpaidCount ?? 0} invoices with pending balance</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Ratio</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {summary?.totalBilled > 0
              ? `${Math.round((summary.totalCollected / summary.totalBilled) * 100)}%`
              : "100%"}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {summary?.paidCount ?? 0} Fully Paid • {summary?.partialCount ?? 0} Partial
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData()}
            placeholder="Search by Invoice # (INV-...), Patient UID (PAT-...), Name, or Phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Bill Type:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Consultation">OPD Consultation</option>
              <option value="LabTest">Diagnostics / Lab</option>
              <option value="Medicine">Pharmacy</option>
              <option value="Bed">Inpatient / Bed</option>
              <option value="Procedure">Procedure / OT</option>
              <option value="Emergency">Emergency</option>
              <option value="General">General Service</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="PartiallyPaid">Partially Paid</option>
              <option value="Unpaid">Unpaid (Due)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => loadData()}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading billing records...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No hospital invoices found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Invoice & Date</th>
                  <th className="px-6 py-4 font-semibold">Patient Information</th>
                  <th className="px-6 py-4 font-semibold">Category & Items</th>
                  <th className="px-6 py-4 font-semibold">Total Amount</th>
                  <th className="px-6 py-4 font-semibold">Paid / Due</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Cashier Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const categoryMeta = CATEGORY_STYLES[inv.primaryCategory || "General"] || CATEGORY_STYLES.General;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-xs text-blue-700">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(inv.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{inv.patient?.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {inv.patient?.patientUid} • {inv.patient?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${categoryMeta.bg} ${categoryMeta.text}`}>
                          {categoryMeta.label}
                        </span>
                        <div className="text-slate-600 mt-1 max-w-[220px] truncate font-medium">
                          {inv.itemsSummary || `${inv.itemCount} item(s)`}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{inv.totalAmountDisplay}</td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-emerald-600">Paid: {inv.paidAmountDisplay}</div>
                        {inv.dueAmount > 0 && <div className="font-semibold text-rose-600 mt-0.5">Due: {inv.dueAmountDisplay}</div>}
                      </td>
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
                      <td className="px-6 py-4 text-right space-x-2">
                        {inv.dueAmount > 0 && inv.status !== "Cancelled" && (
                          <button
                            onClick={() => {
                              setActiveInvoice(inv);
                              setPaymentAmount(inv.dueAmount);
                              setPaymentMethod("Cash");
                              setPaymentTxnRef("");
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 shadow-xs transition-all"
                          >
                            Take Due
                          </button>
                        )}
                        <button
                          onClick={() => handleViewInvoiceReceipt(inv.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-xs transition-all inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Universal Hospital Bill & Payment Taking Modal */}
      {isUniversalBillOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Hospital Billing & Cash Collection Desk</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select patient, add items across departments, apply discounts, and collect payment.
                </p>
              </div>
              <button onClick={() => setIsUniversalBillOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUniversalBill} className="space-y-6">
              {/* Patient and Doctor Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div>
                  <label className="text-xs font-bold text-slate-700">Patient *</label>
                  <select
                    required
                    value={billPatientId}
                    onChange={(e) => setBillPatientId(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.patientUid}) - {p.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Attending / Referring Doctor</label>
                  <select
                    value={billDoctorId}
                    onChange={(e) => setBillDoctorId(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">General Hospital / OPD Desk</option>
                    {catalog?.doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.specialization} - {d.consultationFeeDisplay})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Catalog Item Picker Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Add Billable Items & Services
                  </span>
                  <span className="text-xs text-slate-400">Click any service to add to the invoice</span>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-bold">
                  {[
                    { id: "Consultation", label: "🩺 Consultations", icon: Stethoscope },
                    { id: "LabTest", label: "🔬 Diagnostics", icon: FlaskConical },
                    { id: "Medicine", label: "💊 Medicines", icon: Pill },
                    { id: "Bed", label: "🛏️ Inpatient/Beds", icon: BedDouble },
                    { id: "Procedure", label: "⚕️ Procedures & OT", icon: Activity },
                    { id: "General", label: "🚑 General & Emergency", icon: Building2 },
                    { id: "Custom", label: "✍️ Custom Item", icon: Plus },
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveCatalogTab(tab.id as any)}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        activeCatalogTab === tab.id
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Consultations */}
                {activeCatalogTab === "Consultation" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {catalog?.standardServices
                      .filter((s) => s.category === "Consultation")
                      .map((s) => (
                        <button
                          type="button"
                          key={s.code}
                          onClick={() => addLineItem(s.name, "Consultation", s.unitPrice)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
                        >
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-700">{s.name}</div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="text-slate-400">{s.description}</span>
                            <span className="font-bold text-blue-700">৳{s.unitPrice.toLocaleString("en-BD")}</span>
                          </div>
                        </button>
                      ))}
                    {/* Doctors Consultations */}
                    {catalog?.doctors.map((d) => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => addLineItem(`Consultation: ${d.fullName}`, "Consultation", d.consultationFee)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
                      >
                        <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-700">{d.fullName}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-slate-400">{d.specialization}</span>
                          <span className="font-bold text-blue-700">{d.consultationFeeDisplay}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tab 2: Lab Tests */}
                {activeCatalogTab === "LabTest" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {catalog?.labTests.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => addLineItem(t.name, "LabTest", t.price)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/50 text-left transition-all group"
                      >
                        <div className="font-semibold text-xs text-slate-900 group-hover:text-purple-700">{t.name}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-slate-400">{t.category} • {t.sampleType}</span>
                          <span className="font-bold text-purple-700">{t.priceDisplay}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tab 3: Medicines */}
                {activeCatalogTab === "Medicine" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {catalog?.medicines.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => addLineItem(`${m.brandName} (${m.strength})`, "Medicine", m.unitPrice)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all group"
                      >
                        <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">{m.brandName} {m.strength}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-slate-400">{m.genericName} ({m.dosageForm})</span>
                          <span className="font-bold text-emerald-700">{m.unitPriceDisplay}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tab 4: Beds & IPD */}
                {activeCatalogTab === "Bed" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {catalog?.standardServices
                      .filter((s) => s.category === "Bed")
                      .map((s) => (
                        <button
                          type="button"
                          key={s.code}
                          onClick={() => addLineItem(s.name, "Bed", s.unitPrice)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all group"
                        >
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-indigo-700">{s.name}</div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="text-slate-400">{s.description}</span>
                            <span className="font-bold text-indigo-700">৳{s.unitPrice.toLocaleString("en-BD")}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* Tab 5: Procedures & OT */}
                {activeCatalogTab === "Procedure" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {catalog?.standardServices
                      .filter((s) => s.category === "Procedure")
                      .map((s) => (
                        <button
                          type="button"
                          key={s.code}
                          onClick={() => addLineItem(s.name, "Procedure", s.unitPrice)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:bg-rose-50/50 text-left transition-all group"
                        >
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-rose-700">{s.name}</div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="text-slate-400">{s.description}</span>
                            <span className="font-bold text-rose-700">৳{s.unitPrice.toLocaleString("en-BD")}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* Tab 6: General & Emergency */}
                {activeCatalogTab === "General" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {catalog?.standardServices
                      .filter((s) => s.category === "General" || s.category === "Emergency")
                      .map((s) => (
                        <button
                          type="button"
                          key={s.code}
                          onClick={() => addLineItem(s.name, s.category, s.unitPrice)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all group"
                        >
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-amber-700">{s.name}</div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="text-slate-400">{s.description}</span>
                            <span className="font-bold text-amber-700">৳{s.unitPrice.toLocaleString("en-BD")}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* Tab 7: Custom Line Item */}
                {activeCatalogTab === "Custom" && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600">Service / Item Description *</label>
                        <input
                          type="text"
                          value={customItemName}
                          onChange={(e) => setCustomItemName(e.target.value)}
                          placeholder="e.g. Special Specialist Assessment, Dressing Kit..."
                          className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600">Category</label>
                        <select
                          value={customItemCategory}
                          onChange={(e) => setCustomItemCategory(e.target.value)}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          <option value="Consultation">Consultation</option>
                          <option value="LabTest">Diagnostics</option>
                          <option value="Medicine">Pharmacy</option>
                          <option value="Bed">Inpatient Bed</option>
                          <option value="Procedure">Procedure</option>
                          <option value="Emergency">Emergency</option>
                          <option value="General">General Service</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600">Price (BDT ৳) *</label>
                        <input
                          type="number"
                          min="0"
                          value={customItemPrice}
                          onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Add Custom Line Item
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Line Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Bill Line Items ({billItems.length})
                  </span>
                  {billItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBillItems([])}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {billItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No items added yet. Click on any item above or add a custom service.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Item Description</th>
                          <th className="px-4 py-2">Category</th>
                          <th className="px-4 py-2 text-center">Qty</th>
                          <th className="px-4 py-2 text-right">Unit Price</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {billItems.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 text-slate-400 font-mono">{index + 1}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-900">{item.itemName}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {item.itemType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(index, item.quantity - 1)}
                                  className="text-slate-500 hover:text-slate-800 font-bold px-1"
                                >
                                  -
                                </button>
                                <span className="font-bold text-slate-800 w-5 text-center">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(index, item.quantity + 1)}
                                  className="text-slate-500 hover:text-slate-800 font-bold px-1"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-slate-700">
                              ৳{item.unitPrice.toLocaleString("en-BD")}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                              ৳{(item.quantity * item.unitPrice).toLocaleString("en-BD")}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Calculations & Payment Collection Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {/* Left: Discounts and Taxes */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Discounts & Concessions
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">Discount Amount (BDT ৳)</label>
                      <input
                        type="number"
                        min="0"
                        max={billSubTotal}
                        value={billDiscount}
                        onChange={(e) => setBillDiscount(Number(e.target.value))}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">Discount Reason / Authority</label>
                      <select
                        value={billDiscountReason}
                        onChange={(e) => setBillDiscountReason(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                      >
                        <option value="Standard Hospital Tariff">Standard Hospital Tariff</option>
                        <option value="Senior Citizen (10%)">Senior Citizen (10%)</option>
                        <option value="Hospital Staff Concession">Hospital Staff Concession</option>
                        <option value="Freedom Fighter (Muktijoddha)">Freedom Fighter (Muktijoddha)</option>
                        <option value="Managing Director Approval">Managing Director Approval</option>
                        <option value="Doctor Discretion">Doctor Discretion</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Accountant / Cashier Remarks</label>
                    <input
                      type="text"
                      value={billNotes}
                      onChange={(e) => setBillNotes(e.target.value)}
                      placeholder="Optional notes or token reference..."
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenLab}
                      onChange={(e) => setAutoGenLab(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Automatically generate Laboratory Orders for diagnostic items</span>
                  </label>
                </div>

                {/* Right: Payment Taking */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Gross Subtotal:</span>
                    <span className="font-bold text-slate-900">৳{billSubTotal.toLocaleString("en-BD")}</span>
                  </div>

                  {billDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 text-emerald-600">
                      <span>Discount ({billDiscountReason}):</span>
                      <span className="font-bold">-৳{billDiscount.toLocaleString("en-BD")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-200 font-bold text-slate-900">
                    <span>Net Payable:</span>
                    <span className="text-base text-blue-700">৳{billNetTotal.toLocaleString("en-BD")}</span>
                  </div>

                  {/* Quick Payment Shortcut Pills */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setBillAmountPaid(billNetTotal)}
                      className="flex-1 py-1 px-2 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    >
                      Pay Full (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillAmountPaid(Math.round(billNetTotal * 0.5))}
                      className="flex-1 py-1 px-2 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      50% Advance
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillAmountPaid(0)}
                      className="flex-1 py-1 px-2 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    >
                      Due / Credit (৳0)
                    </button>
                  </div>

                  {/* Cashier Payment Input */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Amount Paid (BDT ৳) *</label>
                      <input
                        type="number"
                        min="0"
                        max={billNetTotal}
                        value={billAmountPaid}
                        onChange={(e) => setBillAmountPaid(Number(e.target.value))}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Payment Method *</label>
                      <select
                        value={billPaymentMethod}
                        onChange={(e) => setBillPaymentMethod(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                      >
                        <option value="Cash">Cash (BDT ৳)</option>
                        <option value="bKash">bKash Merchant Pay</option>
                        <option value="Nagad">Nagad Online Pay</option>
                        <option value="Card">Visa / MasterCard / POS</option>
                        <option value="BankTransfer">Direct Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  {billPaymentMethod !== "Cash" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">MFS TrxID / POS Slip / Card Ref No</label>
                      <input
                        type="text"
                        value={billTxnRef}
                        onChange={(e) => setBillTxnRef(e.target.value)}
                        placeholder="e.g. 9J87K12L90"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 font-semibold">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className={billDueAmount > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                      {billDueAmount > 0 ? `৳${billDueAmount.toLocaleString("en-BD")} (DUE)` : "৳0 (CLEARED)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUniversalBillOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting || billItems.length === 0}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate Bill & Take Payment</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Collect Due Payment Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Collect Due Payment</h3>
                <p className="text-xs text-slate-400">
                  {activeInvoice.invoiceNumber} • {activeInvoice.patient?.fullName}
                </p>
              </div>
              <button onClick={() => setActiveInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-bold text-slate-900">{activeInvoice.totalAmountDisplay}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-bold text-emerald-600">{activeInvoice.paidAmountDisplay}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Outstanding Due:</span>
                  <span className="font-bold text-rose-600 text-sm">{activeInvoice.dueAmountDisplay}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Amount Being Collected (BDT ৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeInvoice.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Payment Channel *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Cash">Cash (BDT ৳)</option>
                  <option value="bKash">bKash Merchant Pay</option>
                  <option value="Nagad">Nagad Online Pay</option>
                  <option value="Card">Visa / MasterCard / POS</option>
                  <option value="BankTransfer">Direct Bank Transfer</option>
                </select>
              </div>

              {paymentMethod !== "Cash" && (
                <div>
                  <label className="text-xs font-bold text-slate-700">Transaction Reference / Slip No</label>
                  <input
                    type="text"
                    value={paymentTxnRef}
                    onChange={(e) => setPaymentTxnRef(e.target.value)}
                    placeholder="e.g. TrxID or card authorization code"
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm & Receive Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Official Printable Hospital Money Receipt & Tax Invoice */}
      {printedReceiptData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Hospital Money Receipt</h3>
                <p className="text-xs text-slate-400">Invoice #{printedReceiptData.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setPrintedReceiptData(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Hospital Money Receipt Template */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-lg font-bold tracking-tight text-blue-900">
                  {printedReceiptData.hospital?.name || "DHAKA SPECIALIZED GENERAL HOSPITAL"}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {printedReceiptData.hospital?.address || "Plot 14, Road 7, Dhanmondi, Dhaka 1205, Bangladesh"}
                </p>
                <p className="text-[11px] text-slate-400">
                  Hotline: {printedReceiptData.hospital?.hotline || "+880 2 9660000"} • DGHS Reg: DGHS-LIC-2026-9812
                </p>

                <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>OFFICIAL HOSPITAL MONEY RECEIPT & INVOICE</span>
                </div>
              </div>

              {/* Receipt Demographics */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Patient Particulars</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{printedReceiptData.patient?.fullName}</div>
                  <div className="text-slate-600">
                    UID: <span className="font-mono font-semibold">{printedReceiptData.patient?.patientUid}</span>
                    {printedReceiptData.patient?.gender && ` • ${printedReceiptData.patient.gender}`}
                    {printedReceiptData.patient?.age && ` • Age: ${printedReceiptData.patient.age}`}
                    {printedReceiptData.patient?.bloodGroup && ` • Blood: ${printedReceiptData.patient.bloodGroup}`}
                  </div>
                  <div className="text-slate-500">Phone: {printedReceiptData.patient?.phone}</div>
                </div>

                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Billing Information</div>
                  <div className="text-slate-700">Invoice No: <span className="font-mono font-bold text-blue-700">{printedReceiptData.invoiceNumber}</span></div>
                  <div className="text-slate-700">Receipt No: <span className="font-mono font-bold text-slate-900">{printedReceiptData.receiptNumber}</span></div>
                  <div className="text-slate-500">Date: {printedReceiptData.date}</div>
                  {printedReceiptData.doctor && (
                    <div className="text-slate-600 mt-0.5">
                      Doctor: <span className="font-medium text-slate-800">{printedReceiptData.doctor.fullName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-center w-10">#</th>
                      <th className="px-3 py-2">Service / Item Description</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printedReceiptData.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{item.itemName}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {item.itemType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-medium">{item.quantity}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">
                          {item.unitPriceDisplay || `৳${item.unitPrice?.toLocaleString("en-BD")}`}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {item.totalPriceDisplay || `৳${item.totalPrice?.toLocaleString("en-BD")}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown & Stamps */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Left: Payment status badge */}
                <div className="flex flex-col justify-between">
                  <div>
                    {printedReceiptData.isFullyPaid ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">PAID IN FULL</div>
                          <div className="text-[10px] text-emerald-700">Payment received via {printedReceiptData.financials?.paymentMethod}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">PARTIALLY PAID / DUE</div>
                          <div className="text-[10px] text-amber-700">Pending due balance: {printedReceiptData.financials?.dueAmountDisplay}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {printedReceiptData.labOrderNumber && (
                    <div className="mt-3 p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs">
                      <div className="font-bold flex items-center gap-1">
                        <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
                        <span>Diagnostic Token Generated</span>
                      </div>
                      <div className="font-mono text-[11px] text-purple-700 mt-0.5">
                        Lab Slip #: <strong>{printedReceiptData.labOrderNumber}</strong>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 mt-2 font-mono">
                    System Token: {printedReceiptData.receiptNumber} • Thank you for choosing Dhaka Specialized General Hospital.
                  </div>
                </div>

                {/* Right: Financial Totals */}
                <div className="space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Subtotal:</span>
                    <span className="font-semibold">{printedReceiptData.financials?.subTotalDisplay}</span>
                  </div>

                  {printedReceiptData.financials?.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({printedReceiptData.financials?.discountReason || "Special"}):</span>
                      <span className="font-semibold">-{printedReceiptData.financials?.discountDisplay}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
                    <span>Net Amount:</span>
                    <span className="text-blue-700">{printedReceiptData.financials?.totalAmountDisplay}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Amount Paid ({printedReceiptData.financials?.paymentMethod}):</span>
                    <span>{printedReceiptData.financials?.paidAmountDisplay}</span>
                  </div>

                  <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                    <span>Due Balance:</span>
                    <span>{printedReceiptData.financials?.dueAmountDisplay || "৳0"}</span>
                  </div>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="pt-8 flex items-end justify-between border-t border-slate-200 text-xs">
                <div>
                  <div className="border-t border-slate-400 w-32 text-center text-[10px] text-slate-500 pt-1">
                    Patient / Attendant
                  </div>
                </div>
                <div className="text-right">
                  <div className="border-t border-slate-400 w-40 text-center text-[10px] text-slate-700 font-bold pt-1">
                    Authorized Cashier / Accountant
                  </div>
                  <div className="text-[10px] text-slate-400">Dhaka Specialized Accounts Desk</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPrintedReceiptData(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
