"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "./data";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const t = TESTIMONIALS[index];
  const go = (delta: number) => setIndex((i) => (i + delta + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <figure className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-float" aria-roledescription="carousel" aria-label="Patient stories">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Quote className="h-5 w-5" />
        </span>
        <span className="flex gap-0.5" aria-label="Rated 5 out of 5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          ))}
        </span>
      </div>

      <blockquote className="mt-5 flex-1 text-base leading-relaxed text-slate-600" aria-live="polite">
        “{t.quote}”
      </blockquote>

      <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
            {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="text-sm font-bold text-navy-800">{t.name}</p>
            <p className="text-xs text-slate-500">{t.role}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => go(-1)} aria-label="Previous story" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-navy-800 hover:border-brand-300">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next story" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-navy-800 hover:border-brand-300">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </figcaption>

      <div className="mt-5 flex justify-center gap-1.5">
        {TESTIMONIALS.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show story ${i + 1}`}
            aria-current={i === index}
            className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-brand-600" : "w-2 bg-slate-300")}
          />
        ))}
      </div>
    </figure>
  );
}
