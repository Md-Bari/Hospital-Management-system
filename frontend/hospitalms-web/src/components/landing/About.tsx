import Image from "next/image";
import { Award, Building2, Clock, HeartHandshake, UsersRound } from "lucide-react";
import { IMAGES } from "./data";

const PILLARS = [
  { icon: Clock, label: "24-hour services" },
  { icon: UsersRound, label: "Professional medical team" },
  { icon: Building2, label: "Modern facilities" },
  { icon: HeartHandshake, label: "Patient-first care" },
];

const STATS = [
  { value: "50K+", label: "Patients treated yearly" },
  { value: "120+", label: "Expert doctors" },
  { value: "40+", label: "Specialties" },
  { value: "98%", label: "Patient satisfaction" },
];

export function About() {
  return (
    <section id="about" className="relative scroll-mt-32 overflow-hidden bg-gradient-to-br from-brand-50/70 via-white to-teal-50/40 py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-float">
            <Image
              src={IMAGES.building}
              alt="Exterior of the MediWell Hospital building"
              fill
              sizes="(min-width: 1024px) 600px, 95vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-8 left-6 right-6 flex items-center gap-4 rounded-2xl bg-navy-800 p-5 text-white shadow-float sm:left-auto sm:right-8 sm:w-72">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10">
              <Award className="h-6 w-6 text-teal-300" />
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold">25 years</p>
              <p className="text-xs text-blue-100/80">of caring for Dhaka&apos;s families</p>
            </div>
          </div>
        </div>

        <div className="pt-6 lg:pt-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">About MediWell</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">
            A hospital built around <span className="text-brand-600">you</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500">
            We pair world-class clinical infrastructure with a human touch. Every patient gets a care team that
            shares one connected record — so your doctor, nurse, lab and pharmacist always see the same picture.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PILLARS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-start gap-3 sm:items-center sm:text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-600 shadow-card">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-snug text-navy-800">{label}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-200/70 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-4 py-5">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-2xl font-extrabold text-navy-800">{s.value}</dd>
                <dd className="mt-1 text-xs text-slate-500">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
