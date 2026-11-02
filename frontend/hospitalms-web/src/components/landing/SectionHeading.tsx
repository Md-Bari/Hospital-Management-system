import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  action?: { label: string; href: string };
  inverted?: boolean;
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, action, inverted, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-3xl">
        <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", inverted ? "text-teal-300" : "text-brand-600")}>
          {eyebrow}
        </p>
        <h2 className={cn("mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl", inverted ? "text-white" : "text-navy-800")}>
          {title}
        </h2>
        {description && (
          <p className={cn("mt-3 text-base leading-relaxed", inverted ? "text-blue-100/80" : "text-slate-500")}>{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold",
            inverted ? "text-white hover:text-teal-200" : "text-brand-600 hover:text-brand-700",
          )}
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
