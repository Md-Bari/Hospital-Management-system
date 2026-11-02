import Link from "next/link";
import { Clock, Mail, MapPin, PhoneCall } from "lucide-react";
import { CONTACT, DEPARTMENTS, NAV_LINKS } from "./data";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-32 bg-navy-950 text-blue-100/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1.2fr]">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            Compassionate, connected healthcare for Dhaka&apos;s families since 2001.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-500">
              Register as patient
            </Link>
            <Link href="/login" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/5">
              Patient &amp; staff sign in
            </Link>
          </div>
        </div>

        <nav aria-label="Footer">
          <h3 className="text-sm font-bold text-white">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.filter((l) => l.href !== "#top" && l.href !== "#contact").map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-bold text-white">Departments</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {DEPARTMENTS.slice(0, 6).map((d) => (
              <li key={d.slug}>
                <Link href={`/?dept=${d.slug}#doctors`} scroll={false} className="hover:text-white">
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">Contact us</h3>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              <address className="not-italic">
                {CONTACT.address[0]}
                <br />
                {CONTACT.address[1]}
              </address>
            </li>
            <li className="flex gap-3">
              <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              <span>
                Front desk: <a href={`tel:${CONTACT.frontTel}`} className="text-white hover:underline">{CONTACT.front}</a>
                <br />
                Emergency: <a href={`tel:${CONTACT.emergencyTel}`} className="text-white hover:underline">{CONTACT.emergency}</a>
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              <a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              <span>
                OPD: Sat – Thu, 8 AM – 10 PM
                <br />
                Emergency &amp; pharmacy: 24/7
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} MediWell Hospital. All rights reserved.</p>
          <p>In an emergency, call {CONTACT.emergency} or go to the nearest emergency department.</p>
        </div>
      </div>
    </footer>
  );
}
