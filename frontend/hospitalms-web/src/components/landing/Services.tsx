import Image from "next/image";
import { SERVICES } from "./data";
import { SectionHeading } from "./SectionHeading";

export function Services() {
  return (
    <section id="services" className="scroll-mt-32 bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Our services"
          title="Everything you need, under one roof"
          description="From your first consultation to your last follow-up, every service is connected to your patient record."
        />

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {SERVICES.map(({ icon: Icon, ...service }) => {
            return (
              <li
                key={service.name}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-float"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 200px, (min-width: 1024px) 30vw, 48vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="relative px-4 pb-5 pt-9 sm:px-5 sm:pb-6">
                  <span className="absolute -top-6 left-4 grid sm:left-5 h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-card ring-4 ring-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-bold text-navy-800">{service.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{service.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
