import Link from "next/link";
import { ArrowRight, CalendarCheck, PhoneCall, Siren } from "lucide-react";
import { CONTACT } from "./data";

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="bg-white px-4 pb-20 sm:px-6 lg:pb-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-navy-800 px-6 py-12 text-white sm:px-12 lg:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/20 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h2 id="cta-title" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Need medical help?
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-blue-100">
              Our team is here 24 hours a day, 7 days a week. Book a consultation online or reach the emergency
              desk instantly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={`tel:${CONTACT.emergencyTel}`}
              className="group flex flex-col rounded-2xl bg-white p-5 text-navy-800 shadow-float transition hover:-translate-y-0.5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <Siren className="h-5 w-5" />
              </span>
              <span className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Emergency, 24/7</span>
              <span className="mt-1 flex items-center gap-2 whitespace-nowrap font-display text-lg font-extrabold xl:text-xl">
                <PhoneCall className="h-4 w-4 shrink-0 text-rose-600" />
                {CONTACT.emergency}
              </span>
            </a>
            <Link
              href="/register"
              className="group flex flex-col rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-600">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <span className="mt-4 text-xs font-bold uppercase tracking-wider text-blue-200">Online booking</span>
              <span className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold">
                Book appointment
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
