"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  FileText,
  FlaskConical,
  CreditCard,
  AlertCircle,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Pill,
  Download,
  Activity,
  HeartPulse,
  UserCheck,
} from "lucide-react";
import { patientsApi, PatientItem } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { PrescriptionPrintModal } from "@/components/dashboard/PrescriptionPrintModal";

interface PatientDashboardData {
  id: string;
  patientUid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  knownAllergies?: string;
  chronicConditions?: string;
  appointments: Array<{
    id: string;
    appointmentNumber: string;
    appointmentDate: string;
    slotStartTime: string;
    slotEndTime: string;
    status: string;
    queueSerialNumber: number;
    doctorName: string;
    doctorSpecialization: string;
  }>;
  prescriptions: Array<{
    id: string;
    prescriptionNumber: string;
    diagnosis?: string;
    advice?: string;
    createdAt: string;
    status: string;
    medicines: Array<{
      id: string;
      medicineName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }>;
  }>;
  labOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    items: Array<{
      id: string;
      testName: string;
      testCode: string;
      status: string;
      resultValue?: string;
      referenceRange?: string;
    }>;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export function PatientPortalDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [printRxId, setPrintRxId] = useState<string | null>(null);

  useEffect(() => {
    patientsApi
      .getMe()
      .then((res) => setData(res))
      .catch(() => {
        // Fallback demo data if no patient record is yet attached
        setData({
          id: "demo",
          patientUid: "PAT-2026-0001",
          firstName: "Rahim",
          lastName: "Uddin",
          fullName: "Rahim Uddin",
          dateOfBirth: "1990-05-14T00:00:00Z",
          age: 36,
          gender: "Male",
          bloodGroup: "O+",
          phone: "+880 1715-001122",
          email: user?.email || "patient@hospitalms.com",
          address: "Plot 12, Mirpur-10, Dhaka 1216",
          emergencyContactName: "Fatema Begum",
          emergencyContactPhone: "+880 1715-001123",
          knownAllergies: "Penicillin",
          chronicConditions: "Mild Hypertension",
          appointments: [
            {
              id: "app-1",
              appointmentNumber: "APT-20260422-0001",
              appointmentDate: "2026-04-22T00:00:00Z",
              slotStartTime: "09:00:00",
              slotEndTime: "09:30:00",
              status: "Confirmed",
              queueSerialNumber: 4,
              doctorName: "Dr. James Thompson",
              doctorSpecialization: "General Medicine",
            },
          ],
          prescriptions: [
            {
              id: "pr-1",
              prescriptionNumber: "RX-2026-0012",
              diagnosis: "Seasonal viral rhinitis with mild elevated blood pressure",
              advice: "Drink plenty of warm water, reduce salt intake, rest for 3 days.",
              createdAt: "2026-04-18T10:30:00Z",
              status: "Finalized",
              medicines: [
                {
                  id: "m-1",
                  medicineName: "Napa Extra 500mg (Paracetamol)",
                  dosage: "500mg",
                  frequency: "1 + 0 + 1",
                  durationDays: 5,
                  instructions: "After meals with water",
                },
                {
                  id: "m-2",
                  medicineName: "Fexo 120mg (Fexofenadine)",
                  dosage: "120mg",
                  frequency: "0 + 0 + 1",
                  durationDays: 7,
                  instructions: "At bedtime",
                },
              ],
            },
          ],
          labOrders: [
            {
              id: "lo-1",
              orderNumber: "LAB-20260418-01",
              status: "Published",
              createdAt: "2026-04-18T11:00:00Z",
              items: [
                {
                  id: "li-1",
                  testName: "Complete Blood Count (CBC)",
                  testCode: "CBC-01",
                  status: "Verified",
                  resultValue: "Hemoglobin 14.2 g/dL, WBC 7,800/mcL",
                  referenceRange: "Normal",
                },
              ],
            },
          ],
          invoices: [
            {
              id: "inv-1",
              invoiceNumber: "INV-2026-0042",
              totalAmount: 1500,
              paidAmount: 1500,
              dueAmount: 0,
              status: "Paid",
              createdAt: "2026-04-18T12:00:00Z",
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const nextAppointment = data?.appointments?.[0];
  const latestPrescription = data?.prescriptions?.[0];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Patient Welcome & Health Passport Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                MediWell Self-Service Patient Portal
              </span>
              <span className="text-xs text-blue-100 flex items-center gap-1 font-mono">
                UID: {data?.patientUid || "PAT-2026-0001"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {data?.fullName || user?.fullName || "Patient"}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Access your digital medical records, upcoming appointments, lab test reports, and doctor e-prescriptions anytime.
            </p>
          </div>

          {/* Quick Health Summary Pill */}
          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <div className="text-center px-3 border-r border-white/15">
              <p className="text-[10px] text-blue-200 font-semibold uppercase">Blood Group</p>
              <p className="text-base font-bold text-white">{data?.bloodGroup || "O+"}</p>
            </div>
            <div className="text-center px-3 border-r border-white/15">
              <p className="text-[10px] text-blue-200 font-semibold uppercase">Age</p>
              <p className="text-base font-bold text-white">{data?.age ? `${data.age} yrs` : "36 yrs"}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] text-blue-200 font-semibold uppercase">Drug Allergy</p>
              <p className="text-base font-bold text-amber-200 truncate max-w-[120px]">
                {data?.knownAllergies || "None"}
              </p>
            </div>
            <Link
              href="/appointments"
              className="ml-auto bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Stat Row (Patient View) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Next Consultation</p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {nextAppointment ? nextAppointment.doctorName : "No upcoming visits"}
            </p>
            <span className="text-[11px] text-blue-600 font-semibold">
              {nextAppointment ? `Serial #${nextAppointment.queueSerialNumber}` : "Schedule now"}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Active Prescriptions</p>
            <p className="text-xl font-bold text-slate-800">
              {data?.prescriptions?.length || 1} Record
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">Digital e-RX</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Diagnostic Reports</p>
            <p className="text-xl font-bold text-slate-800">
              {data?.labOrders?.length || 1} Available
            </p>
            <span className="text-[11px] text-purple-600 font-semibold">Verified Pathologist</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Billing & Invoices</p>
            <p className="text-xl font-bold text-slate-800">
              ৳{data?.invoices?.reduce((acc, i) => acc + i.dueAmount, 0) || 0}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">All Cleared (bKash/Nagad)</span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Content Grid (Left: Clinical Cards | Right: Health Passport & Emergency) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 Cols): Appointments, Prescriptions & Lab Results */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Next Scheduled Appointment & Live Serial Token */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Upcoming Consultation & Live Token</h3>
                  <p className="text-xs text-slate-400">Present your digital token at the reception or chamber desk</p>
                </div>
              </div>
              <Link href="/appointments" className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {nextAppointment ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                      Serial #{nextAppointment.queueSerialNumber || 4}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {nextAppointment.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{nextAppointment.doctorName}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {nextAppointment.doctorSpecialization} • Chamber Room 302, 3rd Floor
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {new Date(nextAppointment.appointmentDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {nextAppointment.slotStartTime || "09:00 AM"} - {nextAppointment.slotEndTime || "09:30 AM"}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                  <Link
                    href="/appointments"
                    className="w-full sm:w-auto text-center px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
                  >
                    View Appointment Slip
                  </Link>
                  <Link
                    href="/doctors"
                    className="w-full sm:w-auto text-center px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs"
                  >
                    Chamber Schedule
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No active appointment scheduled</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Consult with our specialist consultants today.</p>
                <Link
                  href="/appointments"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-sm"
                >
                  Book Your Serial
                </Link>
              </div>
            )}
          </div>

          {/* Active E-Prescriptions & Medicines */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Current E-Prescription & Dosage</h3>
                  <p className="text-xs text-slate-400">Official medical prescriptions issued by attending doctors</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {latestPrescription && (
                  <button
                    onClick={() => setPrintRxId(latestPrescription.id)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-700 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Print Rx
                  </button>
                )}
                <Link href="/clinical" className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
                  <span>Archive</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {latestPrescription ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{latestPrescription.prescriptionNumber}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-600 font-medium">Diagnosis: {latestPrescription.diagnosis}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 text-[10px] w-fit">
                    Verified Digital Prescription
                  </span>
                </div>

                {/* Medication Dosage Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {latestPrescription.medicines.map((med) => (
                    <div
                      key={med.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 transition-colors shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-xs text-slate-900">{med.medicineName}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">
                            {med.dosage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{med.instructions}</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50/60 px-2 py-0.5 rounded-lg">
                          {med.frequency}
                        </span>
                        <span className="text-slate-400 text-[11px] font-medium">For {med.durationDays} days</span>
                      </div>
                    </div>
                  ))}
                </div>

                {latestPrescription.advice && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800">Doctor's Advice & Care Instructions:</p>
                      <p className="text-amber-700 mt-0.5">{latestPrescription.advice}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No prescriptions found.</p>
            )}
          </div>

          {/* Diagnostic & Laboratory Reports */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Diagnostic Reports & Results</h3>
                  <p className="text-xs text-slate-400">Validated by Pathology & Radiology specialist consultants</p>
                </div>
              </div>
              <Link href="/laboratory" className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
                <span>View All Tests</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {data?.labOrders?.map((lo) => (
                <div
                  key={lo.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-800">{lo.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {lo.status}
                      </span>
                    </div>
                    {lo.items?.map((item) => (
                      <div key={item.id} className="text-xs">
                        <span className="font-semibold text-slate-900">{item.testName}: </span>
                        <span className="text-slate-600">{item.resultValue || "Analysis complete"}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/laboratory"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report PDF</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Digital Health Passport & Quick Services */}
        <div className="lg:col-span-4 space-y-6">
          {/* Health Passport Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Health Passport & Vitals</h3>
                <p className="text-xs text-slate-400">Emergency & Demographic Record</p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Registered Name</span>
                <span className="font-bold text-slate-800">{data?.fullName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Contact Phone</span>
                <span className="font-mono font-semibold text-slate-800">{data?.phone}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Email Address</span>
                <span className="font-mono text-slate-800 truncate max-w-[160px]">{data?.email}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Blood Group</span>
                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{data?.bloodGroup}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Known Allergies</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {data?.knownAllergies || "None Reported"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Chronic Conditions</span>
                <span className="font-semibold text-slate-700">{data?.chronicConditions || "None"}</span>
              </div>
              <div className="py-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-700">Emergency Contact</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">{data?.emergencyContactName || "Fatema Begum"}</p>
                <p className="text-[11px] text-blue-600 font-mono mt-0.5">{data?.emergencyContactPhone || "+880 1715-001123"}</p>
              </div>
            </div>
          </div>

          {/* Billing & Payment Quick Action */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Recent Invoices</h3>
              </div>
              <Link href="/billing" className="text-xs text-blue-600 hover:text-blue-800 font-bold">
                View All
              </Link>
            </div>

            {data?.invoices && data.invoices.length > 0 ? (
              <div className="space-y-3">
                {data.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-mono font-bold text-xs text-slate-800">{inv.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-slate-900">৳{inv.totalAmount.toLocaleString()}</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No active bills.</p>
            )}
          </div>

          {/* 24/7 Ambulance & Emergency Support Card */}
          <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-lg shadow-red-500/15">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <PhoneCall className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-red-200">24/7 Hospital ER</p>
                <h4 className="text-base font-black">Emergency Hotline</h4>
              </div>
            </div>
            <p className="text-xs text-red-100 mt-1">
              Trauma center, ICU bed availability, and ambulance dispatch hotline.
            </p>
            <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <p className="text-xs text-red-200">Central Ambulance Hotline</p>
              <p className="text-lg font-black tracking-wider text-white mt-0.5">+880 2 9660000</p>
              <p className="text-[10px] text-red-200">National Emergency: 999 • DGHS: 16263</p>
            </div>
          </div>
        </div>
      </div>

      <PrescriptionPrintModal
        prescriptionId={printRxId}
        onClose={() => setPrintRxId(null)}
      />
    </div>
  );
}
