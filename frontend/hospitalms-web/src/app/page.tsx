import Link from "next/link";
import {
  PhoneCall,
  Calendar,
  Search,
  Pill,
  FlaskConical,
  HeartPulse,
  Activity,
  Brain,
  Baby,
  ShieldCheck,
  Clock,
  Users,
  User,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Ambulance,
} from "lucide-react";

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* 1. Top Utility & Main Navigation */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-blue-900">Medi</span>
              <span className="text-xl font-extrabold tracking-tight text-teal-600">Well</span>
              <span className="text-[10px] block font-bold text-slate-400 tracking-wider uppercase -mt-1">
                Hospital & Pharma
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/" className="text-blue-600">Home</Link>
            <Link href="#services" className="hover:text-blue-600 transition-colors">Our Services</Link>
            <Link href="#doctors" className="hover:text-blue-600 transition-colors">Doctors</Link>
            <Link href="#pharmacy" className="hover:text-blue-600 transition-colors">Pharmacy</Link>
            <Link href="#emergency" className="hover:text-blue-600 transition-colors">Emergency</Link>
            <Link href="#contact" className="hover:text-blue-600 transition-colors">Contact</Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">+880 1700-000000</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-tight">24/7 Support</p>
              </div>
            </div>

            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Patient Registration (OTP)
            </Link>

            <Link
              href="/dashboard"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book Appointment
            </Link>

            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-blue-600 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Matching Image 2) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Hero Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Your Health, Our Priority
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Better Science. <br />
              <span className="text-blue-600">Better Health.</span>
            </h1>

            <p className="text-base text-slate-500 leading-relaxed max-w-lg">
              We are committed to improving and extending lives through innovative medicines,
              cutting-edge diagnostic technology, and compassionate patient care.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Register with Email OTP
              </Link>
              <Link
                href="#services"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2"
              >
                Explore Services
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm px-7 py-3.5 rounded-full border border-slate-200 shadow-sm transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" />
                Find a Doctor
              </Link>
            </div>

            {/* Trust Metric Badge */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex -space-x-2">
                {["1", "2", "3", "4"].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700"
                  >
                    U{i}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">100K+ Patients</p>
                <p className="text-xs text-slate-400">Trust us for healthcare every year</p>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Cards */}
          <div className="relative">
            <div className="w-full h-[460px] rounded-3xl bg-gradient-to-tr from-blue-600 via-teal-500 to-blue-700 p-8 shadow-2xl flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply pointer-events-none"></div>

              <div>
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Accredited Hospital
                </span>
                <h3 className="text-3xl font-extrabold mt-4 leading-snug">
                  Advanced Medical Care <br />& Diagnostics
                </h3>
                <p className="text-sm text-blue-100 mt-2 max-w-sm">
                  Equipped with modern laboratories, 24/7 trauma center, and top medical specialists.
                </p>
              </div>

              {/* Floating Credibility Pills */}
              <div className="space-y-3 relative z-10">
                <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">24/7 Emergency Support</p>
                    <p className="text-[10px] text-slate-400 leading-tight">Rapid ambulance and triage response</p>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Certified Quality Medicines</p>
                    <p className="text-[10px] text-slate-400 leading-tight">100% verified batch & FEFO pharmacy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Quick Action Floating Bar ("How Can We Help You?") */}
        <div className="max-w-6xl mx-auto px-6 -mb-24 mt-12 relative z-20">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.06)]">
            <h2 className="text-center text-lg font-bold text-slate-900 mb-6">
              How Can We Help You?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { title: "Find a Doctor", icon: Search, desc: "Connect with specialist doctors", href: "/dashboard" },
                { title: "Book Appointment", icon: Calendar, desc: "Schedule an appointment easily", href: "/dashboard" },
                { title: "Pharmacy", icon: Pill, desc: "Wide range of medicines", href: "/dashboard" },
                { title: "Lab Tests", icon: FlaskConical, desc: "Accurate & reliable diagnostic tests", href: "/dashboard" },
                { title: "Health Packages", icon: HeartPulse, desc: "Preventive health checkup packages", href: "/dashboard" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all text-center flex flex-col items-center group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {action.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {action.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Healthcare Services Section */}
      <section id="services" className="pt-32 pb-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Healthcare Services</h2>
            <p className="text-sm text-slate-500 mt-2">Comprehensive healthcare solutions for you and your family.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Pharmacy", desc: "Genuine medicines at best prices", icon: Pill, color: "text-blue-600" },
              { title: "Cardiology", desc: "Advanced cardiac care for your heart", icon: HeartPulse, color: "text-rose-600" },
              { title: "Neurology", desc: "Expert treatment for brain & nervous system", icon: Brain, color: "text-amber-600" },
              { title: "Pathology Lab", desc: "Accurate reports and trusted results", icon: FlaskConical, color: "text-teal-600" },
              { title: "Pediatrics", desc: "Special care for your little ones", icon: Baby, color: "text-emerald-600" },
            ].map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.title}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                      <Icon className={`w-6 h-6 ${srv.color}`} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{srv.title}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{srv.desc}</p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-colors cursor-pointer">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Impact Stats Ribbon (Matching Image 2 Gradient Ribbon) */}
      <section className="bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-500 py-10 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          <div>
            <p className="text-3xl font-extrabold tracking-tight">25+</p>
            <p className="text-xs text-blue-100 mt-1 font-medium">Years of Excellence</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight">150+</p>
            <p className="text-xs text-blue-100 mt-1 font-medium">Expert Doctors</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight">500+</p>
            <p className="text-xs text-blue-100 mt-1 font-medium">Medical Services</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight">100K+</p>
            <p className="text-xs text-blue-100 mt-1 font-medium">Happy Patients</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight">50+</p>
            <p className="text-xs text-blue-100 mt-1 font-medium">Healthcare Centers</p>
          </div>
        </div>
      </section>

      {/* 6. Why Choose MediWell & Emergency Hotline */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Choose <span className="text-teal-600">MediWell</span> Hospital?
            </h2>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              We combine innovation, medical expertise, and patient-first care to deliver the highest clinical outcomes.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "DGHS & WHO-GMP Certified Standards",
                "High Quality & 100% Genuine Medicines",
                "Affordable & Accessible Healthcare for All",
                "Experienced Specialists & Dedicated Nursing Staff",
                "State-of-the-art Technology & Automated Laboratory",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Learn More About Us
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Emergency Callout Card matching Image 2 */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between h-full relative overflow-hidden">
            <div className="space-y-4">
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Emergency Hotline
              </span>
              <h3 className="text-2xl font-extrabold">Need Emergency Help?</h3>
              <p className="text-xs text-blue-100 max-w-sm leading-relaxed">
                We are available 24/7 for urgent clinical emergencies, cardiac trauma, and ambulance dispatch.
              </p>

              <div className="pt-2">
                <a
                  href="tel:+880170000000"
                  className="bg-white text-blue-800 text-sm font-bold px-6 py-3 rounded-full inline-flex items-center gap-2 shadow-md hover:bg-blue-50 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  +880 1700-000000
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-blue-500/40 flex items-center gap-3 text-xs text-blue-100">
              <Ambulance className="w-5 h-5 text-white" />
              <span>Fleet of 35 ICU Ambulances available across Dhaka</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-teal-600" />
              <span className="font-extrabold text-slate-900">MediWell Hospital</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Committed to a healthier tomorrow through innovation, expert care, and trusted medicine.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Links</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <p><Link href="/dashboard" className="hover:text-blue-600">Doctor Directory</Link></p>
              <p><Link href="/dashboard" className="hover:text-blue-600">Online Appointment</Link></p>
              <p><Link href="/dashboard" className="hover:text-blue-600">Diagnostic Tests</Link></p>
              <p><Link href="/login" className="hover:text-blue-600">Staff Portal</Link></p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Departments</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <p>General Medicine</p>
              <p>Cardiology</p>
              <p>Orthopedics</p>
              <p>Pediatrics</p>
              <p>Gynecology</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Location</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Plot 14, Road 7, Dhanmondi R/A<br />
              Dhaka 1205, Bangladesh<br />
              Phone: +880 2 9660000<br />
              Email: info@mediwellhospital.com
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
          <p>© 2026 MediWell Hospital Management System. All Rights Reserved.</p>
          <p>Bangladesh (BDT / Asia/Dhaka)</p>
        </div>
      </footer>
    </div>
  );
}

