"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, Stethoscope, UserRound } from "lucide-react";
import { DEPARTMENTS } from "./data";

/** Sends the visitor to the doctors section with the chosen filters applied via the URL. */
export function DoctorFinder() {
  const router = useRouter();
  const [dept, setDept] = useState("");
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (dept) params.set("dept", dept);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.replace(`/${qs ? `?${qs}` : ""}#doctors`, { scroll: false });
    document.getElementById("doctors")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Find a doctor"
      className="grid gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-float md:grid-cols-[1fr_1fr_auto] md:gap-0 md:p-2"
    >
      <label className="flex items-center gap-3 rounded-2xl px-4 py-3 md:border-r md:border-slate-100">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Stethoscope className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</span>
          <span className="relative block">
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-semibold text-navy-800 focus:outline-none"
            >
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </span>
        </span>
      </label>

      <label className="flex items-center gap-3 rounded-2xl px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
          <UserRound className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Doctor name</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Dr. Karim"
            className="w-full bg-transparent text-sm font-semibold text-navy-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none"
          />
        </span>
      </label>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <Search className="h-4 w-4" />
        Find a Doctor
      </button>
    </form>
  );
}
