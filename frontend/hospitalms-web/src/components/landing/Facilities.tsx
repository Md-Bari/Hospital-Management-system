import Image from "next/image";
import { Cpu, ShieldCheck, Sparkles } from "lucide-react";
import { FACILITIES } from "./data";

const HIGHLIGHTS = [
  { icon: Cpu, text: "3T MRI, 128-slice CT and digital mammography" },
  { icon: ShieldCheck, text: "Infection-controlled ICU with 1:1 nursing" },
  { icon: Sparkles, text: "Private cabins with family stay-over space" },
];

export function Facilities() {
  return (
    <section id="facilities" className="relative scroll-mt-32 overflow-hidden bg-navy-900 py-20 text-white lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Facilities</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Modern facilities for faster recovery
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-100/80">
            Calm, well-equipped spaces designed with clinicians and families — so you can focus on getting better.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-blue-50">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-teal-300">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <ul className="grid grid-cols-2 gap-4">
          {FACILITIES.map((f, i) => (
            <li
              key={f.name}
              className={`group relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10 ${i % 2 === 1 ? "sm:translate-y-8" : ""}`}
            >
              <Image
                src={f.image}
                alt={f.name}
                fill
                sizes="(min-width: 1024px) 360px, 48vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-sm font-bold sm:text-base">{f.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
