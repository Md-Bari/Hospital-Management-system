import Image from "next/image";
import { CircleCheck } from "lucide-react";
import { IMAGES } from "./data";
import { Testimonials } from "./Testimonials";

const REASONS = [
  "Board-certified consultants in 40+ specialties",
  "One connected record across doctor, lab and pharmacy",
  "Transparent, itemised billing — no surprises",
  "Lab reports and prescriptions in your patient portal",
  "Same-day appointments for urgent concerns",
];

export function WhyUs() {
  return (
    <section id="why-us" className="scroll-mt-32 bg-gradient-to-b from-white to-brand-50/60 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr_0.95fr] lg:items-stretch">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Why patients trust us</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">
            More than a hospital — a partner in your health
          </h2>
          <ul className="mt-8 space-y-3.5">
            {REASONS.map((r) => (
              <li key={r} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[320px] overflow-hidden rounded-3xl shadow-float">
          <Image
            src={IMAGES.care}
            alt="A doctor talking with a patient at her bedside"
            fill
            sizes="(min-width: 1024px) 420px, 95vw"
            className="object-cover"
          />
        </div>

        <Testimonials />
      </div>
    </section>
  );
}
