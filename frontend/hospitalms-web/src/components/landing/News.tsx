import Image from "next/image";
import { Clock3 } from "lucide-react";
import { ARTICLES } from "./data";
import { SectionHeading } from "./SectionHeading";

export function News() {
  return (
    <section id="news" className="scroll-mt-32 bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Health tips"
          title="Advice from our specialists"
          description="Practical guidance written and reviewed by MediWell clinicians."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {ARTICLES.map((a) => (
            <article key={a.title} className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card transition hover:shadow-float">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={a.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 400px, 95vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-brand-700">
                  {a.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-bold leading-snug text-navy-800">{a.title}</h3>
                <p className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <time>{a.date}</time>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {a.read} read
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
