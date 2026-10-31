import { MoreHorizontal } from "lucide-react";

interface DoctorItem {
  name: string;
  department: string;
  time: string;
  status: "Available" | "Unavailable";
  initials: string;
}

const doctors: DoctorItem[] = [
  {
    name: "Dr. James Thompson",
    department: "General Medicine",
    time: "09:00 AM - 12:00 PM",
    status: "Available",
    initials: "JT",
  },
  {
    name: "Dr. Michael Anderson",
    department: "Orthopedics",
    time: "10:00 AM - 01:00 PM",
    status: "Unavailable",
    initials: "MA",
  },
  {
    name: "Dr. Olivia Martinez",
    department: "Cardiology",
    time: "10:00 AM - 01:00 PM",
    status: "Available",
    initials: "OM",
  },
  {
    name: "Dr. Emily Carter",
    department: "Pediatrics",
    time: "02:00 PM - 04:00 PM",
    status: "Available",
    initials: "EC",
  },
];

export function DoctorScheduleCard() {
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
        {doctors.map((doc) => (
          <div key={doc.name} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                {doc.initials}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">{doc.name}</p>
                <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{doc.department}</p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  doc.status === "Available"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {doc.status}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{doc.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

