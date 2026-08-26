import { useCallback, useEffect, useState } from "react";
import { CalendarCheck2, FileText, Users, Wallet } from "lucide-react";
import axiosInstance from "../../api/axios";
import { CardSkeleton } from "../SkeletonLoaders";
import GreetingCard from "./GreetingCard";
import MetricCard from "./MetricCard";
import RevenueChart from "./RevenueChart";
import TodayAppointmentsList from "./TodayAppointmentsList";
import RecentPatientsTable from "./RecentPatientsTable";
import { formatPKR, getGreetingName, getTodayDateInput, getTodayLabel } from "./dashboardHelpers";

/**
 * The doctor's dashboard home.
 * Loads today's numbers and lays them out in soft, easy-to-scan cards.
 */
export default function DashboardHome({ doctor, onNavigate }) {
  const [appointments, setAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isClinicLoading, setIsClinicLoading] = useState(true);

  const [todayEarnings, setTodayEarnings] = useState(0);
  const [yearlyEarnings, setYearlyEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);
  const [prescriptionsSent, setPrescriptionsSent] = useState(0);
  const [isRevenueLoading, setIsRevenueLoading] = useState(true);

  // Today's appointments and the most recent patients.
  const fetchClinicData = useCallback(async ({ withLoader = false } = {}) => {
    if (withLoader) setIsClinicLoading(true);
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        axiosInstance.get(`/appointments?date=${getTodayDateInput()}&limit=50`),
        axiosInstance.get("/patients?limit=4&sort=-createdAt"),
      ]);

      const todayAppointments = Array.isArray(appointmentsRes?.data?.appointments)
        ? appointmentsRes.data.appointments
        : [];
      const patients = Array.isArray(patientsRes?.data?.patients) ? patientsRes.data.patients : [];

      setAppointments(todayAppointments.filter((appointment) => appointment.status !== "Cancelled"));
      setRecentPatients(patients);
      setTotalPatients(
        Number.isFinite(Number(patientsRes?.data?.pagination?.total))
          ? Number(patientsRes.data.pagination.total)
          : patients.length,
      );
    } catch {
      // Keep whatever we already show; a quiet refresh can fail sometimes.
    } finally {
      setIsClinicLoading(false);
    }
  }, []);

  // Earnings and prescription counts for the summary cards and the chart.
  const fetchRevenueData = useCallback(async ({ withLoader = false } = {}) => {
    if (withLoader) setIsRevenueLoading(true);
    try {
      const [revenueRes, insightsRes] = await Promise.all([
        axiosInstance.get("/insights/revenue-lab"),
        axiosInstance.get("/insights"),
      ]);
      const revenue = revenueRes?.data?.revenue || {};

      setTodayEarnings(Number(revenue.daily || 0));
      setYearlyEarnings(Number(revenue.yearly || 0));
      setMonthlyEarnings(Array.isArray(revenue.monthlySeries) ? revenue.monthlySeries : []);
      setPrescriptionsSent(Number(insightsRes?.data?.counts?.prescriptions || 0));
    } catch {
      // Keep the last known numbers on a failed refresh.
    } finally {
      setIsRevenueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinicData({ withLoader: true });
    fetchRevenueData({ withLoader: true });

    // Silently refresh when the doctor comes back to this tab.
    const refreshSilently = () => {
      fetchClinicData();
      fetchRevenueData();
    };
    window.addEventListener("focus", refreshSilently);
    return () => window.removeEventListener("focus", refreshSilently);
  }, [fetchClinicData, fetchRevenueData]);

  const pendingVisits = appointments.filter((appointment) => appointment.status === "Pending").length;

  const summaryCards = [
    {
      icon: Users,
      label: "Total Patients",
      value: totalPatients.toLocaleString(),
      subtitle: "Registered in system",
    },
    {
      icon: CalendarCheck2,
      label: "Today's Appointments",
      value: String(appointments.length),
      subtitle:
        pendingVisits === 0 ? "No pending visits" : `${pendingVisits} pending visit${pendingVisits === 1 ? "" : "s"}`,
    },
    {
      icon: Wallet,
      label: "Today's Revenue",
      value: formatPKR(todayEarnings),
      subtitle: "Daily checkup fees",
    },
    {
      icon: FileText,
      label: "Prescriptions Generated",
      value: prescriptionsSent.toLocaleString(),
      subtitle: "WhatsApp PDFs sent",
    },
  ];

  const isSummaryLoading = isClinicLoading || isRevenueLoading;

  return (
    <div className="space-y-5 sm:space-y-6">
      <GreetingCard
        doctorName={getGreetingName(doctor?.fullName)}
        dateLabel={getTodayLabel()}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {isSummaryLoading
          ? [0, 1, 2, 3].map((key) => <CardSkeleton key={key} />)
          : summaryCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart
            monthlyEarnings={monthlyEarnings}
            yearlyEarnings={yearlyEarnings}
            isLoading={isRevenueLoading}
          />
        </div>
        <TodayAppointmentsList
          appointments={appointments}
          isLoading={isClinicLoading}
          onOpenQueue={() => onNavigate("queue")}
        />
      </div>

      <RecentPatientsTable patients={recentPatients} isLoading={isClinicLoading} onNavigate={onNavigate} />
    </div>
  );
}
