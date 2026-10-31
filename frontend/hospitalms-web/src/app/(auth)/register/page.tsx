"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Mail,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  Droplet,
  MapPin,
  Clock,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { authApi } from "@/lib/api-client";

export default function PatientRegisterPage() {
  const router = useRouter();

  // Stepper: 1 = Details, 2 = Verify OTP, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+880",
    gender: "Male",
    bloodGroup: "O+",
    address: "Dhaka, Bangladesh",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Timer for OTP resend (60 seconds)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.sendPatientOtp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      if (res.success) {
        if (res.data?.devCode) {
          setDevCode(res.data.devCode);
        }
        setStep(2);
        setTimer(60);
        setCanResend(false);
      } else {
        setError(res.error || "Failed to send OTP verification code.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error connecting to SMTP email server.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.sendPatientOtp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      if (res.success) {
        if (res.data?.devCode) {
          setDevCode(res.data.devCode);
        }
        setTimer(60);
        setCanResend(false);
      } else {
        setError(res.error || "Failed to resend OTP.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authApi.verifyPatientOtp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        otp: otp.trim(),
        password: formData.password || undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
      });

      if (res.success) {
        setSuccessInfo(res.data);
        if (typeof window !== "undefined" && res.data?.token) {
          localStorage.setItem("hospitalms_token", res.data.token);
          localStorage.setItem("hospitalms_refresh", res.data.refreshToken);
        }
        setStep(3);
      } else {
        setError(res.error || "Invalid verification code.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Verification failed. Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-blue-900">Hospital</span>
            <span className="text-2xl font-black tracking-tight text-teal-600">Link</span>
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Patient Registration
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Register with your Name, Phone, and Email using SMTP One-Time Password verification.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              step === 1
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span>1</span>
            <span>Details</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-200" />
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              step === 2
                ? "bg-blue-600 text-white shadow-sm"
                : step === 3
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <span>2</span>
            <span>Email OTP</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-200" />
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              step === 3 ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"
            }`}
          >
            <span>3</span>
            <span>Complete</span>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-[0_10px_35px_rgba(0,0,0,0.05)] rounded-3xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: PATIENT INFORMATION */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div>
                <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                <div className="mt-1 relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    placeholder="e.g. Mohammad Rafiqul Islam"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Phone Number *</label>
                <div className="mt-1 relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-mono"
                    placeholder="+88017XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Email Address (for SMTP OTP) *</label>
                <div className="mt-1 relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    placeholder="yourname@domain.com"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We will send a 6-digit verification code to this email.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Residential City / Address</label>
                <div className="mt-1 relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    placeholder="e.g. Dhanmondi, Dhaka"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 text-sm"
              >
                {loading ? "Sending OTP Code..." : "Send Verification OTP Code"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY EMAIL OTP */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-center">
                <Mail className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
                <h4 className="text-sm font-bold text-slate-900">Check Your Email</h4>
                <p className="text-xs text-slate-600 mt-1">
                  We sent a 6-digit code to <strong className="text-blue-900 font-semibold">{formData.email}</strong>.
                </p>
                {devCode && (
                  <div className="mt-2.5 inline-block bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                    Development OTP: {devCode}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 text-center mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-48 text-center bg-slate-50 border-2 border-blue-500 rounded-2xl py-3 text-2xl font-mono font-extrabold tracking-widest text-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
                    placeholder="••••••"
                  />
                </div>
              </div>

              {/* Optional Portal Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Create Portal Password (Optional)
                </label>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    placeholder="Create a password for patient login"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Allows you to view diagnostic lab results and prescriptions online.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 text-sm"
              >
                {loading ? "Verifying OTP..." : "Verify Code & Register Patient"}
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change Email
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend Code
                  </button>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Resend in {timer}s
                  </span>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS & PATIENT UID */}
          {step === 3 && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Registration Complete!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your email has been verified and your official hospital record is active.
                </p>
              </div>

              {/* Patient Card Preview */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl text-left shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                      HospitalLink Patient Card
                    </span>
                    <h4 className="text-base font-bold mt-0.5">{successInfo?.fullName || formData.name}</h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Droplet className="w-3 h-3 fill-rose-300" />
                    {successInfo?.bloodGroup || formData.bloodGroup}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Patient ID</span>
                    <p className="text-lg font-mono font-extrabold text-blue-400">
                      {successInfo?.patientUid || "DCH-202610-0001"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Phone</span>
                    <p className="text-xs font-mono text-slate-300">{successInfo?.phone || formData.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => router.push("/appointments")}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all text-sm"
                >
                  <span>Book Chamber Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Enter Portal Workspace
                </button>
              </div>
            </div>
          )}

          {/* Quick Return to Login */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-800">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
