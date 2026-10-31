import { StatCards } from "@/components/dashboard/StatCards";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { DepartmentRadialChart } from "@/components/dashboard/DepartmentRadialChart";
import { DoctorScheduleCard } from "@/components/dashboard/DoctorScheduleCard";
import { OperationalAlerts } from "@/components/dashboard/OperationalAlerts";
import { MiniCalendarAgenda } from "@/components/dashboard/MiniCalendarAgenda";

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* 1. Top Stat Cards Row */}
      <StatCards />

      {/* 2. Main Dashboard Grid (Left Operational Analytics + Right Calendar Agenda) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2): Analytics & Real-Time Operational Lists */}
        <div className="xl:col-span-2 space-y-6">
          {/* Row 1: Charts (Total Trends + Patients by Department) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendsChart />
            <DepartmentRadialChart />
          </div>

          {/* Row 2: Operational Status (Doctor's Schedule + Report / Alerts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DoctorScheduleCard />
            <OperationalAlerts />
          </div>
        </div>

        {/* Right Column (Span 1): Mini Calendar & Day Schedule Agenda */}
        <div className="xl:col-span-1 h-full">
          <MiniCalendarAgenda />
        </div>
      </div>
    </div>
  );
}

