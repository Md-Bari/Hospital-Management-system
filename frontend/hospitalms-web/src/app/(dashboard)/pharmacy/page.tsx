"use client";

import { useEffect, useState } from "react";
import { Search, Pill, AlertTriangle, Plus, Minus, Check } from "lucide-react";
import { pharmacyApi, MedicineItem } from "@/lib/api-client";

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dosageForm, setDosageForm] = useState("All");
  const [toastMsg, setToastMsg] = useState("");

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const res = await pharmacyApi.getMedicines({
        search: search || undefined,
        lowStock: lowStockOnly || undefined,
        dosageForm: dosageForm !== "All" ? dosageForm : undefined,
        pageSize: 30,
      });
      if (res?.items) {
        setMedicines(res.items);
      }
    } catch (err) {
      console.error("Failed to load medicines", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [lowStockOnly, dosageForm]);

  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      const updated = await pharmacyApi.adjustStock(id, delta);
      setMedicines((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, stockQuantity: updated.stockQuantity, isLowStock: updated.isLowStock }
            : m
        )
      );
      setToastMsg(`Stock adjusted for ${updated.brandName}: now ${updated.stockQuantity} units.`);
      setTimeout(() => setToastMsg(""), 3500);
    } catch (err) {
      alert("Failed to adjust stock");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pharmacy & Drug Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock monitoring, pricing in BDT, reorder thresholds, and quick dispensing.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search brand, generic name, or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadMedicines()}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Low Stock Alert Only</span>
          </label>

          <div className="flex items-center gap-2">
            <span>Form:</span>
            <select
              value={dosageForm}
              onChange={(e) => setDosageForm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Forms</option>
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading medicines...</div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No medicines found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Medicine Name</th>
                  <th className="px-6 py-4 font-semibold">Generic & Strength</th>
                  <th className="px-6 py-4 font-semibold">Manufacturer</th>
                  <th className="px-6 py-4 font-semibold">Unit Price (BDT)</th>
                  <th className="px-6 py-4 font-semibold">Stock Quantity</th>
                  <th className="px-6 py-4 font-semibold text-right">Quick Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{m.brandName}</div>
                          <div className="text-xs text-slate-400">{m.dosageForm}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{m.genericName}</div>
                      <div className="text-xs text-slate-400">{m.strength}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {m.manufacturer}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {m.unitPriceDisplay}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${m.isLowStock ? "text-amber-600" : "text-slate-900"}`}>
                          {m.stockQuantity}
                        </span>
                        {m.isLowStock && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Low (Reorder &le; {m.reorderLevel})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdjustStock(m.id, -10)}
                          disabled={m.stockQuantity <= 0}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
                          title="Reduce 10 units"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAdjustStock(m.id, 10)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                          title="Add 10 units"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAdjustStock(m.id, 50)}
                          className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                          title="Restock 50 units"
                        >
                          +50
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
