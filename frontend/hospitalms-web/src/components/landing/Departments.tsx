import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "./data";
import { SectionHeading } from "./SectionHeading";

export function Departments() {
  return (
    <section id="departments" className="scroll-mt-32 bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Our departments"
          title="Comprehensive care for every stage of life"
          description="Choose a department to see its specialists and their consulting days."
          action={{ label: "View all doctors", href: "#doctors" }}
        />

        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {DEPARTMENTS.map(({ slug, name, blurb, icon: Icon, tone }) => (
            <li key={slug}>
              <Link
                href={`/?dept=${slug}#doctors`}
                scroll={false}
                className={cn(
                  "group relative flex h-full flex-col items-center rounded-2xl border border-transparent px-3 py-6 text-center transition hover:-translate-y-1 hover:shadow-card",
                  tone.tile,
                )}
              >
                <span className={cn("grid h-14 w-14 place-items-center rounded-2xl shadow-sm", tone.chip)}>
                  <Icon className={cn("h-7 w-7", tone.icon)} strokeWidth={1.75} />
                </span>
                <span className="mt-4 text-sm font-bold text-navy-800">{name}</span>
                <span className="mt-1 text-xs leading-snug text-slate-500">{blurb}</span>
                <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-slate-400 opacity-0 transition group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
