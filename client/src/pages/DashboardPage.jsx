import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import logo from "../assets/logo-compact.webp";
import SettingsPage from "./SettingsPage";
import PatientsPage from "./PatientsPage";
import AppointmentsPage from "./AppointmentsPage";
import InsightsPage from "./InsightsPage";
import RevenueLabPage from "./RevenueLabPage";
import SupportCenterPage from "./SupportCenterPage";
import VerifiedBadge from "../components/VerifiedBadge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CardSkeleton, RowSkeleton, AppointmentRowSkeleton, ChartSkeleton } from "../components/SkeletonLoaders";
import { Skeleton } from "@mui/material";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";

const navItems = [
  { icon: "⊞", label: "Dashboard", key: "dashboard" },
  { icon: "👥", label: "Patients", key: "patients" },
  { icon: "📅", label: "Appointments", key: "appointments" },
  { icon: "📊", label: "Insights", key: "insights" },
  { icon: "💹", label: "Revenue Lab", key: "revenue-lab" },
  { icon: "🛟", label: "Support", key: "support" },
  { icon: "⚙️", label: "Profile Page", key: "settings" },
];

const LOCKED_PROFILE_STATUSES = ["Needs Changes", "Rejected"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-sm border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)]">
        <p className="font-semibold text-[var(--color-primary)]">{label}</p>
        <p>PKR {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

export default function DashboardPage() {
  const { confirm, dialogProps } = useConfirmDialog();
  const navigate = useNavigate();
  const { doctor, logout, setDoctor } = useAuthStore();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showEmergencySection, setShowEmergencySection] = useState(false);
  const [emergencyStartDate, setEmergencyStartDate] = useState("");
  const [emergencyStartTime, setEmergencyStartTime] = useState("");
  const [emergencyEndDate, setEmergencyEndDate] = useState("");
  const [emergencyEndTime, setEmergencyEndTime] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [isLoadingCancelled, setIsLoadingCancelled] = useState(false);
  const [rescheduleContext, setRescheduleContext] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [isLoadingTodayEarnings, setIsLoadingTodayEarnings] = useState(false);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);
  const [totalPrescriptions, setTotalPrescriptions] = useState(null);
  const [thisYearEarnings, setThisYearEarnings] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationsMenuRef = useRef(null);

  const isProfileRestricted = LOCKED_PROFILE_STATUSES.includes(doctor?.profileVerificationStatus);
  const visibleNavItems = isProfileRestricted ? navItems.filter((item) => item.key === "support") : navItems;

  const loadUnreadCount = async () => {
    try {
      const res = await axiosInstance.get("/notifications/unread-count");
      setUnreadCount(Number(res.data?.unreadCount || 0));
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const res = await axiosInstance.get("/notifications?limit=10");
      setNotifications(Array.isArray(res.data?.notifications) ? res.data.notifications : []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const syncVerificationStatus = async () => {
    try {
      const res = await axiosInstance.get("/doctor/verification-status");
      setDoctor({ ...(doctor || {}), ...res.data });
    } catch {
      // Ignore errors to avoid blocking dashboard rendering.
    }
  };

  const fetchCancelledAppointments = async () => {
    setIsLoadingCancelled(true);
    try {
      const res = await axiosInstance.get("/appointments?status=Cancelled&limit=500");
      const emergency = res.data.appointments.filter((a) => a.emergencyCancelled === true);
      setCancelledAppointments(emergency);
    } catch {
      console.error("Failed to load cancelled appointments");
    } finally {
      setIsLoadingCancelled(false);
    }
  };

  useEffect(() => {
    if (activeNav !== "dashboard") return;
    fetchCancelledAppointments();
    const fetchDashboardData = async ({ withLoader = false } = {}) => {
      if (withLoader) setIsLoadingData(true);
      try {
       const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const [appointmentsRes, patientsRes] = await Promise.all([
          axiosInstance.get("/appointments?date=" + today + "&limit=50"),
          axiosInstance.get("/patients?limit=4&sort=-createdAt"),
        ]);
        const appointments = appointmentsRes && appointmentsRes.data && Array.isArray(appointmentsRes.data.appointments)
          ? appointmentsRes.data.appointments
          : [];
        const patients = patientsRes && patientsRes.data && Array.isArray(patientsRes.data.patients)
          ? patientsRes.data.patients
          : [];
        const activeTodayAppointments = appointments.filter((a) => a.status !== "Cancelled");

        setTodayAppointments(activeTodayAppointments);
        setRecentPatients(Array.isArray(patients) ? patients.slice(0, 4) : []);
        setTotalPatients(
          patientsRes && patientsRes.data && Number.isFinite(Number(patientsRes.data?.pagination?.total))
            ? Number(patientsRes.data.pagination.total)
            : patients.length,
        );
      } catch {
        console.error("Failed to load dashboard data");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchDashboardData({ withLoader: true });

    const onFocus = () => fetchDashboardData({ withLoader: false });
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [activeNav]);

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([syncVerificationStatus(), loadUnreadCount()]);
    };

    bootstrap();
    const timer = setInterval(() => {
      bootstrap();
    }, 10000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isProfileRestricted && activeNav !== "support") {
      setActiveNav("support");
    }
  }, [isProfileRestricted, activeNav]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationsOpen) return;
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (activeNav !== "dashboard") return;

    const fetchTodayEarnings = async ({ withLoader = false } = {}) => {
      if (withLoader) setIsLoadingTodayEarnings(true);
      try {
        const res = await axiosInstance.get("/insights");
        setTodayEarnings(Number(res?.data?.earnings?.today || 0));
        setMonthlyEarnings(res?.data?.monthly || []);
        setTotalPrescriptions(res?.data?.counts?.prescriptions ?? null);
        setThisYearEarnings(Number(res?.data?.earnings?.thisYear || 0));
      } catch {
        setTodayEarnings(0);
        setMonthlyEarnings([]);
        setTotalPrescriptions(null);
        setThisYearEarnings(0);
      } finally {
        setIsLoadingTodayEarnings(false);
      }
    };

    fetchTodayEarnings({ withLoader: true });

    const onFocus = () => fetchTodayEarnings({ withLoader: false });
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [activeNav]);

  const handleEmergencyRescheduleComplete = async (cancelledAppointmentId) => {
    if (!cancelledAppointmentId) return;
    try {
      await axiosInstance.put(`/appointments/${cancelledAppointmentId}`, { emergencyCancelled: false });
      setCancelledAppointments((p) => p.filter((a) => a._id !== cancelledAppointmentId));
      setRescheduleContext(null);
      toast.success("Rescheduling completed");
    } catch {
      toast.error("Booked, but failed to mark previous emergency-cancelled appointment as resolved");
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      logout();
      navigate("/login");
    }
  };

  const todayStr = new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const pageTitle = visibleNavItems.find((n) => n.key === activeNav)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black bg-opacity-60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={"fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 bg-[var(--color-card)] border-r border-[var(--color-border)] " + (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}
        style={{ width: "240px", flexShrink: 0 }}>

        <div className="px-5 py-5 flex items-center gap-3 border-b border-[var(--color-border)]">
          <img src={logo} alt="MedAlerto" className="h-8 w-auto" />
          <button className="ml-auto lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}>
              {doctor?.profilePicture ? (
                <img src={doctor.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-xl" />
              ) : (
                doctor?.fullName?.charAt(0) || "D"
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{doctor?.fullName || "Doctor"}</p>
                <VerifiedBadge isVerified={["Verified", "Approved"].includes(doctor?.profileVerificationStatus)} compact />
              </div>
              <p className="text-xs truncate text-[var(--color-primary)]">
                {[doctor?.title, doctor?.specialization || "Specialist"].filter(Boolean).join(" ")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3 text-[var(--color-text-secondary)]">Main Menu</p>
          {visibleNavItems.map((item) => (
            <button key={item.key} onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
              className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all duration-200"
              style={{
                background: activeNav === item.key ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
                color: activeNav === item.key ? "var(--color-primary)" : "var(--color-text-secondary)",
                borderLeft: activeNav === item.key ? "3px solid var(--color-primary)" : "3px solid transparent",
              }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[var(--color-border)]">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover-danger-soft"
            style={{ color: "var(--color-danger)" }}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="relative flex items-center justify-between px-4 sm:px-6 py-4 shrink-0"
          style={{ background: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}>
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center">
            <span
              className="text-base lg:text-lg font-black tracking-[0.28em]"
              style={{
                background: "linear-gradient(90deg, #38bdf8 0%, var(--color-primary) 45%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textShadow: "0 0 28px color-mix(in srgb, var(--color-primary) 40%, transparent)",
              }}
            >
              MEDALERTO
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
              Smart Healthcare Workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg transition-colors hover:bg-[var(--color-bg)]" onClick={() => setSidebarOpen(true)}>
              <div className="space-y-1.5">
                {[0,1,2].map((i) => <span key={i} className="block w-5 h-0.5 bg-[var(--color-primary)]" />)}
              </div>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">{pageTitle}</h1>
              <p className="text-xs hidden sm:block text-[var(--color-text-secondary)]">{todayStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" ref={notificationsMenuRef}>
              <button
                onClick={async () => {
                  const nextState = !notificationsOpen;
                  setNotificationsOpen(nextState);
                  if (nextState) {
                    await loadNotifications();
                  }
                }}
                className="relative p-2 rounded-xl transition-colors hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)]"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl z-40">
                  <div className="px-3 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Notifications</p>
                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.patch("/notifications/read-all");
                          setUnreadCount(0);
                          await loadNotifications();
                        } catch {
                          toast.error("Failed to mark notifications as read");
                        }
                      }}
                      className="text-[11px] text-[var(--color-primary)] font-semibold"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                    {isLoadingNotifications ? (
                      <p className="text-xs text-[var(--color-text-secondary)] p-2">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-secondary)] p-2">No notifications yet.</p>
                    ) : (
                      notifications.map((note) => (
                        <button
                          key={note._id}
                          onClick={async () => {
                            if (!note.isRead) {
                              try {
                                await axiosInstance.patch(`/notifications/${note._id}/read`);
                                setUnreadCount((count) => Math.max(0, count - 1));
                                setNotifications((prev) => prev.map((n) => n._id === note._id ? { ...n, isRead: true } : n));
                              } catch {
                                // Ignore mark-read failures on click.
                              }
                            }
                            if (note.type === "issue-message" || note.type === "issue-status") {
                              setActiveNav("support");
                              setNotificationsOpen(false);
                            }
                          }}
                          className="w-full text-left rounded-xl border border-[var(--color-border)] p-2 hover:bg-[var(--color-bg)]"
                        >
                          <p className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">{note.title}</p>
                          <p className="text-[11px] mt-0.5 text-[var(--color-text-secondary)] line-clamp-2">{note.message}</p>
                          {!note.isRead && <span className="inline-block mt-1 text-[10px] font-bold text-[var(--color-primary)]">New</span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveNav(isProfileRestricted ? "support" : "settings")}
              className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-xl transition-colors hover:bg-[var(--color-bg)]"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                {doctor?.profilePicture ? (
                  <img src={doctor.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  doctor?.fullName?.charAt(0) || "D"
                )}
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)] hidden sm:flex sm:items-center sm:gap-1.5">
                {doctor?.fullName?.split(" ")[0] || "Doctor"}
                <VerifiedBadge isVerified={["Verified", "Approved"].includes(doctor?.profileVerificationStatus)} compact />
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--color-bg)]">
          {isProfileRestricted && (
            <div className="mb-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4">
              <p className="text-sm font-bold text-amber-300">Profile access restricted</p>
              <p className="text-xs mt-1 text-[var(--color-text-secondary)]">
                Admin requested updates to your profile. Dashboard modules are locked until your profile is verified again. You can still use Support to contact admin.
              </p>
            </div>
          )}

          {isProfileRestricted && (
            <div className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="pointer-events-none blur-sm opacity-70">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="h-20 rounded-xl bg-[var(--color-bg)]" />
                  <div className="h-20 rounded-xl bg-[var(--color-bg)]" />
                  <div className="h-20 rounded-xl bg-[var(--color-bg)]" />
                  <div className="h-20 rounded-xl bg-[var(--color-bg)]" />
                </div>
              </div>
            </div>
          )}

          {isProfileRestricted && activeNav === "support" && <SupportCenterPage />}

          {!isProfileRestricted && (
            <>
          {activeNav === "settings" && <SettingsPage />}
          {activeNav === "patients" && <PatientsPage />}
          {activeNav === "insights" && <InsightsPage />}
          {activeNav === "revenue-lab" && <RevenueLabPage />}
          {activeNav === "support" && <SupportCenterPage />}
          {activeNav === "appointments" && (
            <AppointmentsPage
              initialPatient={rescheduleContext?.patient || null}
              rescheduleCancelledAppointmentId={rescheduleContext?.cancelledAppointmentId || null}
              onEmergencyRescheduleComplete={handleEmergencyRescheduleComplete}
            />
          )}

          {activeNav === "dashboard" && (
            <>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                {[
                  { icon: "👤", label: "New Patient", color: "var(--color-primary)", onClick: () => setActiveNav("patients") },
                  { icon: "📅", label: "Book Appointment", color: "var(--color-primary)", onClick: () => setActiveNav("appointments") },
                  { icon: "🛟", label: "Feedback/Problem", color: "var(--color-primary)", onClick: () => setActiveNav("support") },
                  { icon: "🚨", label: "Emergency Cancel", color: "var(--color-danger)", onClick: () => setShowEmergencySection((p) => !p) },
                ].map((action) => (
                  <button key={action.label} onClick={action.onClick}
                    className="flex items-center cursor-pointer gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 hover:opacity-90"
                    style={{
                      background: action.color === "var(--color-danger)" ? "color-mix(in srgb, var(--color-danger) 12%, transparent)" : "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      border: "1px solid " + (action.color === "var(--color-danger)" ? "color-mix(in srgb, var(--color-danger) 30%, transparent)" : "color-mix(in srgb, var(--color-primary) 30%, transparent)"),
                      color: action.color,
                    }}>
                    <span>{action.icon}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">{action.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              {showEmergencySection && (
                <div className="mb-5 p-5 rounded-2xl"
                  style={{ background: "color-mix(in srgb, var(--color-danger) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)" }}>
                  <p className="text-sm font-bold mb-4 text-[var(--color-danger)]">🚨 Emergency Cancel Appointments</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">Start Date & Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={emergencyStartDate}
                          onChange={(e) => setEmergencyStartDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-[var(--color-bg)] border border-[var(--color-danger)]/35 text-[var(--color-text-primary)]" />
                        <input type="time" value={emergencyStartTime}
                          onChange={(e) => setEmergencyStartTime(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-[var(--color-bg)] border border-[var(--color-danger)]/35 text-[var(--color-text-primary)]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">End Date & Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={emergencyEndDate}
                          onChange={(e) => setEmergencyEndDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-[var(--color-bg)] border border-[var(--color-danger)]/35 text-[var(--color-text-primary)]" />
                        <input type="time" value={emergencyEndTime}
                          onChange={(e) => setEmergencyEndTime(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-[var(--color-bg)] border border-[var(--color-danger)]/35 text-[var(--color-text-primary)]" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={async () => {
                      if (!emergencyStartDate || !emergencyStartTime || !emergencyEndDate || !emergencyEndTime) {
                        toast.error("Select start/end date and time");
                        return;
                      }
                      const startDateTime = new Date(`${emergencyStartDate}T${emergencyStartTime}:00`);
                      const endDateTime = new Date(`${emergencyEndDate}T${emergencyEndTime}:00`);
                      if (startDateTime > endDateTime) { toast.error("Start date/time must be before end date/time"); return; }
                      const confirmed = await confirm({
                        title: "Emergency Cancel",
                        message: `Cancel all appointments from ${emergencyStartDate} ${emergencyStartTime} to ${emergencyEndDate} ${emergencyEndTime}?`,
                        confirmText: "Yes, Cancel All",
                        cancelText: "Keep Appointments",
                        tone: "danger",
                      });
                      if (!confirmed) return;
                      setIsCancelling(true);
                      try {
                        const res = await axiosInstance.post("/appointments/emergency-cancel", {
                          startDate: emergencyStartDate,
                          startTime: emergencyStartTime,
                          endDate: emergencyEndDate,
                          endTime: emergencyEndTime,
                        });
                        toast.success(`${res.data.cancelledAppointments.length} appointments cancelled`);
                        setCancelledAppointments((p) => [...res.data.cancelledAppointments, ...p]);
                        setShowEmergencySection(false);
                        setEmergencyStartDate("");
                        setEmergencyStartTime("");
                        setEmergencyEndDate("");
                        setEmergencyEndTime("");
                      } catch {
                        toast.error("Failed to cancel appointments");
                      } finally {
                        setIsCancelling(false);
                      }
                    }}
                      disabled={isCancelling}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "color-mix(in srgb, var(--color-danger) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)", color: "var(--color-danger)" }}>
                      {isCancelling ? "Cancelling..." : "Cancel All Appointments"}
                    </button>
                    <button onClick={() => setShowEmergencySection(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: "var(--color-bg)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {isLoadingData || isLoadingTodayEarnings ? (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                ) : (
                  [
                    { label: "Total Patients", value: String(totalPatients || 0), sub: "Registered patients", icon: "👥", color: "var(--color-primary)" },
                    { label: "Today's Appointments", value: todayAppointments.length.toString(), sub: todayAppointments.filter((a) => a.status === "Pending").length + " pending", icon: "📅", color: "#38bdf8" },
                    { label: "Today's Earnings", value: `PKR ${todayEarnings.toLocaleString()}`, sub: "From insights", icon: "💰", color: "#22c55e" },
                    { label: "Prescriptions", value: totalPrescriptions === null ? "0" : String(totalPrescriptions), sub: "PDFs generated", icon: "📋", color: "#a78bfa" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl  p-4 sm:p-5 transition-all hover:scale-105"
                      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                      <div className="mb-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg"
                          style={{ background: "rgba(" + (stat.color === "var(--color-primary)" ? "59,130,246" : stat.color === "#38bdf8" ? "56,189,248" : stat.color === "#22c55e" ? "34,197,94" : "167,139,250") + ",0.15)" }}>
                          {stat.icon}
                        </div>
                      </div>
                      <p className="text-lg sm:text-2xl font-extrabold text-[var(--color-text-primary)] mb-0.5">{stat.value}</p>
                      <p className="text-xs sm:text-sm font-medium mb-1 text-[var(--color-text-secondary)]">{stat.label}</p>
                      <p className="text-xs" style={{ color: stat.color }}>{stat.sub}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="xl:col-span-2 rounded-2xl p-4 sm:p-6"
                  style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">Monthly Earnings</h3>
                      <p className="text-xs text-[var(--color-text-secondary)]">Year 2026 — real data</p>
                    </div>
                    <div className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] min-w-[100px] flex justify-center">
                      {isLoadingTodayEarnings ? <Skeleton variant="text" width={60} sx={{ bgcolor: "rgba(var(--color-primary-rgb), 0.1)" }} /> : `PKR ${thisYearEarnings.toLocaleString()}`}
                    </div>
                  </div>
                  {isLoadingTodayEarnings ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={monthlyEarnings} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v/1000 + "k"} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="earnings" stroke="var(--color-primary)" strokeWidth={2} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 5, fill: "var(--color-primary)" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">Today's Appointments</h3>
                    <span className="text-xs px-2 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      {todayAppointments.length} total
                    </span>
                  </div>
                  <div className="space-y-2.5 overflow-y-auto" style={{ maxHeight: "220px" }}>
                    {isLoadingData ? (
                      <div className="space-y-2.5">
                        <AppointmentRowSkeleton />
                        <AppointmentRowSkeleton />
                        <AppointmentRowSkeleton />
                      </div>
                    ) : todayAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-[var(--color-text-secondary)]">No appointments today</p>
                      </div>
                    ) : todayAppointments.map((apt) => (
                      <div key={apt._id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--color-bg)]"
                        style={{ background: "color-mix(in srgb, var(--color-bg) 65%, var(--color-card))", border: "1px solid var(--color-border)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                          {apt.patient?.name?.charAt(0) || "P"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{apt.patient?.name || "Unknown"}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{apt.slot} · {apt.type}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={{
                            background: apt.status === "Confirmed" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                            color: apt.status === "Confirmed" ? "#22c55e" : "#f59e0b",
                          }}>
                          {apt.status === "Confirmed" ? "✓" : "⏳"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-4 sm:p-6" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">Recent Patients</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Latest registered patients</p>
                  </div>
                  <button onClick={() => setActiveNav("patients")} className="text-xs font-semibold transition-colors cursor-pointer text-[var(--color-primary)] hover:opacity-85">View All →</button>
                </div>

                <div className="hidden sm:grid grid-cols-4 gap-4 px-3 mb-2">
                  {["Patient", "Age & Gender", "Phone", "Blood Group"].map((h) => (
                    <p key={h} className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{h}</p>
                  ))}
                </div>

                {isLoadingData ? (
                  <div className="space-y-2">
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                  </div>
                ) : recentPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[var(--color-text-secondary)]">No patients yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPatients.map((patient) => (
                      <div key={patient._id} className="rounded-xl p-3 sm:p-4 transition-all hover:bg-[var(--color-bg)]"
                        style={{ background: "color-mix(in srgb, var(--color-bg) 65%, var(--color-card))", border: "1px solid var(--color-border)" }}>
                        <div className="sm:hidden flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                            {getInitials(patient.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{patient.name}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{patient.age} yrs · {patient.gender}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{patient.bloodGroup}</span>
                        </div>
                        <div className="hidden sm:grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                              {getInitials(patient.name)}
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{patient.name}</span>
                          </div>
                          <span className="text-sm text-[var(--color-text-secondary)]">{patient.age} yrs · {patient.gender}</span>
                          <span className="text-sm text-[var(--color-text-secondary)]">{patient.phone}</span>
                          <span className="text-xs px-2.5 py-1 rounded-full w-fit font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{patient.bloodGroup}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isLoadingCancelled && (
                <div className="space-y-2 mt-6">
                  <RowSkeleton hasAvatar={true} />
                </div>
              )}

              {!isLoadingCancelled && cancelledAppointments.length > 0 && (
                <div className="rounded-2xl p-4 sm:p-6 mt-6"
                  style={{ background: "color-mix(in srgb, var(--color-danger) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">🚨 Emergency Cancelled Appointments</h3>
                      <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">{cancelledAppointments.length} appointments need rescheduling</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cancelledAppointments.map((apt) => (
                      <div key={apt._id} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl"
                        style={{ background: "color-mix(in srgb, var(--color-bg) 65%, var(--color-card))", border: "1px solid color-mix(in srgb, var(--color-danger) 20%, var(--color-border))" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg,var(--color-danger),color-mix(in srgb, var(--color-danger) 85%, black))" }}>
                          {apt.patient?.name?.charAt(0) || "P"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{apt.patient?.name || "Unknown"}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {new Date(apt.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} at {apt.slot} · {apt.type}
                          </p>
                        </div>
                        <button onClick={async () => {
                          try {
                            await axiosInstance.post(`/appointments/${apt._id}/reschedule-whatsapp`);
                            toast.success("Patient notified. Complete rescheduling to resolve this item.");
                          } catch {
                            toast.error("Failed to send WhatsApp message");
                            return;
                          }
                          setRescheduleContext({ patient: apt.patient, cancelledAppointmentId: apt._id });
                          setActiveNav("appointments");
                        }}
                          className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 shrink-0"
                          style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-primary) 22%, transparent)", color: "var(--color-primary)" }}>
                          Reschedule
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          </>
          )}

          {!isProfileRestricted && !["dashboard", "settings", "patients", "appointments", "insights", "revenue-lab", "support"].includes(activeNav) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🚧</div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{pageTitle} Module</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Coming soon. We're building this next!</p>
              </div>
            </div>
          )}
        </main>
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
