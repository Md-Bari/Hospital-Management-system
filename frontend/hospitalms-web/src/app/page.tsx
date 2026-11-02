import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { Departments } from "@/components/landing/Departments";
import { About } from "@/components/landing/About";
import { Services } from "@/components/landing/Services";
import { Doctors } from "@/components/landing/Doctors";
import { Facilities } from "@/components/landing/Facilities";
import { WhyUs } from "@/components/landing/WhyUs";
import { News } from "@/components/landing/News";
import { CtaBand } from "@/components/landing/CtaBand";
import { SiteFooter } from "@/components/landing/SiteFooter";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediWell Hospital | Expert Care for You and Your Family",
  description:
    "Book appointments with 120+ specialists, access 24/7 emergency care, modern diagnostics and your secure patient portal at MediWell Hospital, Dhaka.",
};

export default function PublicLandingPage() {
  return (
    <div className={`${display.variable} min-h-screen bg-white font-display text-slate-800`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-navy-800 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Departments />
        <About />
        <Services />
        <Suspense fallback={<div id="doctors" className="h-[640px] bg-slate-50" />}>
          <Doctors />
        </Suspense>
        <Facilities />
        <WhyUs />
        <News />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
