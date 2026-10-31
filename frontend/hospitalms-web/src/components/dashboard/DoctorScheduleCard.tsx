"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { dashboardApi } from "@/lib/api-client";

interface DoctorScheduleItem {
  id: string;
  name: string;
  department: string;
  specialization?: string;
  avatarUrl?: string;
  isAvailable: boolean;
  timeSlot: string;
}

const fallbackDoctors = [
  {
    id: "1",
    name: "Dr. James Thompson",
    department: "General Medicine",
    timeSlot: "09:00 AM - 12:00 PM",
    isAvailable: true,
  },
  {
    id: "2",
    name: "Dr. Michael Anderson",
    department: "Orthopedics",
    timeSlot: "10:00 AM - 01:00 PM",
    isAvailable: false,
  },
  {
    id: "3",
    name: "Dr. Olivia Martinez",
    department: "Cardiology",
    timeSlot: "10:00 AM - 01:00 PM",
    isAvailable: true,
  },
  {
    id: "4",
    name: "Dr. Emily Carter",
    department: "Pediatrics",
    timeSlot: "02:00 PM - 04:00 PM",
    isAvailable: true,
  },
];

export function DoctorScheduleCard() {
  const [doctors, setDoctors] = useState<DoctorScheduleItem[]>(fallbackDoctors);

  useEffect(() => {
    dashboardApi.getDoctorSchedule()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setDoctors(res);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Doctor&apos;s Schedule</h3>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {doctors.map((doc) => {
          const initials = doc.name
            .replace(/^Dr\.\s*/i, "")
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2);

          return (
            <div key={doc.id || doc.name} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 leading-tight">{doc.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.department}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    doc.isAvailable
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-rose-50 text-rose-500 border border-rose-100"
                  }`}
                >
                  {doc.isAvailable ? "Available" : "Unavailable"}
                </span>
                <p className="text-[11px] font-medium text-slate-400">{doc.timeSlot}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
