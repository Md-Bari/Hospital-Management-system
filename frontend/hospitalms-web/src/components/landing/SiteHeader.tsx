"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock, Mail, Menu, PhoneCall, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT, NAV_LINKS } from "./data";
import { Logo } from "./Logo";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the nav link for the section currently in view.
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(Boolean) as Element[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden bg-navy-900 text-xs text-blue-100/80 md:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-teal-300" />
              OPD: Sat – Thu, 8:00 AM – 10:00 PM
            </span>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-white">
              <Mail className="h-3.5 w-3.5 text-teal-300" />
              {CONTACT.email}
            </a>
          </div>
          <a href={`tel:${CONTACT.emergencyTel}`} className="flex items-center gap-2 font-semibold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            24/7 Emergency: {CONTACT.emergency}
          </a>
        </div>
      </div>

      <div
        className={cn(
          "border-b bg-white/90 backdrop-blur-lg transition-shadow",
          scrolled ? "border-slate-200/70 shadow-[0_6px_24px_-12px_rgba(14,47,99,0.18)]" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={active === link.href ? "true" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                      active === link.href ? "text-brand-600" : "text-slate-600 hover:text-navy-800",
                    )}
                  >
                    {link.label}
                    {active === link.href && (
                      <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand-600" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2.5 text-sm font-bold text-navy-800 hover:bg-slate-100 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="hidden items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 sm:inline-flex"
            >
              <CalendarCheck className="h-4 w-4" />
              Book Appointment
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-navy-800 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="border-t border-slate-100 bg-white px-4 pb-6 pt-2 lg:hidden">
            <ul className="divide-y divide-slate-100">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-base font-semibold text-navy-800"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/login" className="rounded-full border border-slate-200 py-3 text-center text-sm font-bold text-navy-800">
                Sign in
              </Link>
              <Link href="/register" className="rounded-full bg-brand-600 py-3 text-center text-sm font-bold text-white">
                Book Appointment
              </Link>
            </div>
            <a
              href={`tel:${CONTACT.emergencyTel}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-600"
            >
              <PhoneCall className="h-4 w-4" />
              Emergency {CONTACT.emergency}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
