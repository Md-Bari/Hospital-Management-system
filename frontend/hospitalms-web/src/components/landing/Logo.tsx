import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="MediWell Hospital home" className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-navy-700 shadow-lg shadow-brand-600/25">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden="true">
          <path d="M9.5 3h5a1 1 0 0 1 1 1v4.5H20a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4.5H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4.5V4a1 1 0 0 1 1-1Z" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={cn("block font-display text-lg font-extrabold tracking-tight", inverted ? "text-white" : "text-navy-800")}>
          Medi<span className={inverted ? "text-teal-300" : "text-brand-600"}>Well</span>
        </span>
        <span className={cn("mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em]", inverted ? "text-blue-200/70" : "text-slate-400")}>
          Hospital · Dhaka
        </span>
      </span>
    </Link>
  );
}
