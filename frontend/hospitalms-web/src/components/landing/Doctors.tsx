"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, PhoneCall, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT, DEPARTMENTS, DOCTORS } from "./data";

const deptName = (slug: string) => DEPARTMENTS.find((d) => d.slug === slug)?.name ?? slug;

export function Doctors() {
  const router = useRouter();
  const params = useSearchParams();
  const dept = params.get("dept") ?? "";
  const query = params.get("q") ?? "";
  const trackRef = useRef<HTMLUListElement>(null);

  const doctors = useMemo(() => {
    const q = query.toLowerCase();
    return DOCTORS.filter((d) => (!dept || d.dept === dept) && (!q || d.name.toLowerCase().includes(q)));
  }, [dept, query]);

  const setFilter = (slug: string) => {
    const next = new URLSearchParams(params.toString());
    if (slug) next.set("dept", slug);
    else next.delete("dept");
    next.delete("q");
    const qs = next.toString();
    router.replace(`/${qs ? `?${qs}` : ""}#doctors`, { scroll: false });
    trackRef.current?.scrollTo({ left: 0 });
  };

  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("li");
    track.scrollBy({ left: dir * ((card?.clientWidth ?? 280) + 20), behavior: "smooth" });
  };

  const chips = [{ slug: "", name: "All" }, ...DEPARTMENTS.filter((d) => DOCTORS.some((doc) => doc.dept === d.slug))];

  return (
    <section id="doctors" className="scroll-mt-32 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Our doctors</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">
              Experienced specialists, exceptional care
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-500">
              Board-certified consultants who take the time to listen. Book online and get a confirmation by email.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous doctors"
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-navy-800 transition hover:border-brand-300 hover:text-brand-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next doctors"
              className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by department">
          {chips.map((c) => (
            <button
              key={c.slug || "all"}
              type="button"
              onClick={() => setFilter(c.slug)}
              aria-pressed={dept === c.slug}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                dept === c.slug
                  ? "bg-navy-800 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700",
              )}
            >
              {c.name}
            </button>
          ))}
          {query && (
            <button
              type="button"
              onClick={() => setFilter(dept)}
              aria-label={`Clear name filter “${query}”`}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700"
            >
              Name: “{query}”
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {doctors.length} doctor{doctors.length === 1 ? "" : "s"} shown
        </p>

        {doctors.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="font-display text-lg font-bold text-navy-800">
              No online listing for {dept ? deptName(dept) : "that doctor"} yet
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Our front desk can match you with the right specialist and book your visit over the phone.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={`tel:${CONTACT.frontTel}`}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white"
              >
                <PhoneCall className="h-4 w-4" />
                Call {CONTACT.front}
              </a>
              <button
                type="button"
                onClick={() => setFilter("")}
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-navy-800"
              >
                Show all doctors
              </button>
            </div>
          </div>
        ) : (
          <ul
            ref={trackRef}
            className="-mx-4 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
          >
            {doctors.map((doc) => (
              <li
                key={doc.name}
                className="group w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card sm:w-[46%] lg:w-[calc((100%-60px)/4)]"
              >
                <div className="relative aspect-[4/4.2] overflow-hidden bg-brand-50">
                  <Image
                    src={doc.image}
                    alt={`Portrait of ${doc.name}`}
                    fill
                    sizes="(min-width: 1024px) 290px, (min-width: 640px) 46vw, 78vw"
                    className="object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-brand-700 shadow-sm">
                    {deptName(doc.dept)}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-navy-800">{doc.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{doc.title}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {doc.rating}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>{doc.experience} yrs experience</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-teal-600" />
                      {doc.days}
                    </span>
                  </div>
                  <Link
                    href="/register"
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-brand-50 py-2.5 text-sm font-bold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white"
                  >
                    Book a visit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
