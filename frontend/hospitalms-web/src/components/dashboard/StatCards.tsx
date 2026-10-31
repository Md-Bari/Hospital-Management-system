import { Users, UserCheck, Ambulance, Calendar, Bed } from "lucide-react";

const stats = [
  {
    title: "Patients",
    value: "600",
    icon: Users,
  },
  {
    title: "Staff Members",
    value: "150",
    icon: UserCheck,
  },
  {
    title: "Vehicles",
    value: "35",
    icon: Ambulance,
  },
  {
    title: "Appointment",
    value: "120",
    icon: Calendar,
  },
  {
    title: "Operations",
    value: "28",
    icon: Bed,
  },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{stat.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

