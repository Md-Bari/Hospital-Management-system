import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, Clock3, HeartPulse, ShieldCheck, Star } from "lucide-react";
import { DoctorFinder } from "./DoctorFinder";
import { IMAGES } from "./data";

const TRUST = [
  { icon: ShieldCheck, label: "Accredited care", sub: "International safety protocols" },
  { icon: Clock3, label: "24/7 Emergency", sub: "Trauma team always on site" },
  { icon: BadgeCheck, label: "120+ Specialists", sub: "Across 40 specialties" },
];

export function Hero() {
  return (
    <section id="top" className="relative scroll-mt-32 overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-white">
      {/* Decorative background shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-teal-100/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-100/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
            <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
            Your health, our priority
          </p>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy-800 sm:text-5xl lg:text-[3.6rem]">
            Expert care for a{" "}
            <span className="relative whitespace-nowrap text-brand-600">
              healthier
              <svg aria-hidden="true" viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-3 w-full text-teal-400/70">
                <path d="M2 9C50 3 150 2 198 7" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>{" "}
            you and your family
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
            Experienced specialists, modern diagnostics and compassionate nursing under one roof —
            with appointments, reports and prescriptions in your secure patient portal.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
            >
              <CalendarCheck className="h-4 w-4" />
              Book an Appointment
            </Link>
            <a
              href="#services"
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-navy-800 transition hover:border-brand-200 hover:text-brand-700"
            >
              Explore Services
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, label, sub }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-card">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-navy-800">{label}</span>
                  <span className="block text-xs text-slate-500">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-float sm:aspect-square lg:aspect-[10/11]">
            <Image
              src={IMAGES.hero}
              alt="A doctor reviewing results with a patient in a consultation room"
              fill
              priority
              sizes="(min-width: 1024px) 560px, 90vw"
              className="object-cover object-[30%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/30 via-transparent to-transparent" />
          </div>

          {/* Floating cards */}
          <div className="absolute -left-4 top-10 hidden w-60 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-float backdrop-blur sm:block lg:-left-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Next available</p>
            <p className="mt-1 text-sm font-bold text-navy-800">Today, 4:30 PM</p>
            <p className="text-xs text-slate-500">Cardiology · Dr. Nusrat Karim</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              3 slots left
            </div>
          </div>

          <div className="absolute -bottom-6 right-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-float sm:right-8">
            <div className="flex -space-x-2">
              {["bg-brand-200", "bg-teal-200", "bg-amber-200"].map((c, i) => (
                <span key={c} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white text-[11px] font-bold text-navy-800 ${c}`}>
                  {["SP", "AC", "MS"][i]}
                </span>
              ))}
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-navy-800">
                4.9 <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </p>
              <p className="text-xs text-slate-500">12,000+ patient reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        <DoctorFinder />
      </div>
    </section>
  );
}
