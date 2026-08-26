import { createElement, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BarChart3, CalendarCheck2, CircleUserRound, ClipboardList, CreditCard, FileText, LayoutDashboard, LifeBuoy, LogOut, MessagesSquare, MessageSquareWarning, UserPlus, Users, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import useThemedLogo from "../hooks/useThemedLogo";
import fullblueLogo from "../assets/fullblue.png";
import SettingsPage from "./SettingsPage";
import PatientsPage from "./PatientsPage";
import PaymentPage from "./PaymentPage";
import AppointmentsPage from "./AppointmentsPage";
import EmergencyCancelledPage from "./EmergencyCancelledPage";
import InsightsPage from "./InsightsPage";
import RevenueLabPage from "./RevenueLabPage";
import SupportCenterPage from "./SupportCenterPage";
import DoctorChatsPage from "./DoctorChatsPage";
import QueuePage from "./QueuePage";
import VerifiedBadge from "../components/VerifiedBadge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CardSkeleton, RowSkeleton, AppointmentRowSkeleton, ChartSkeleton } from "../components/SkeletonLoaders";
import { Skeleton } from "@mui/material";
import { getRealtimeSocketForRole } from "../realtime/socket";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
  { icon: ClipboardList, label: "Doctor Queue", key: "queue" },
  { icon: Users, label: "Patients", key: "patients" },
  { icon: MessagesSquare, label: "Chats", key: "chats" },
  { icon: CalendarCheck2, label: "Appointments", key: "appointments" },
  { icon: CalendarCheck2, label: "Emergency Cancelled", key: "emergency-cancelled" },
  { icon: BarChart3, label: "Insights", key: "insights" },
  { icon: BarChart3, label: "Revenue Lab", key: "revenue-lab" },
  { icon: CreditCard, label: "Payments", key: "payments" },
  { icon: LifeBuoy, label: "Support", key: "support" },
  { icon: CircleUserRound, label: "Profile Page", key: "settings" },
];

const LOCKED_PROFILE_STATUSES = ["Needs Changes", "Rejected"];
const LOCKED_SUBSCRIPTION_STATUSES = ["BLOCKED", "INACTIVE", "PENDING_VERIFICATION"];
const SUPPORT_SEEN_STORAGE_KEY = "support-ticket-seen-map-v2";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
        <p className="font-semibold text-[var(--color-primary)]">{label}</p>
        <p>PKR {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

const isTrialExpired = (doctor) => {
  if (doctor?.subscriptionStatus !== "TRIAL" || !doctor?.subscriptionExpiresAt) return false;
  return new Date(doctor.subscriptionExpiresAt).getTime() <= Date.now();
};

function dashboardGlyph(Icon, className = "h-4 w-4") {
  return createElement(Icon, { className, strokeWidth: 2.2, "aria-hidden": true });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { doctor, logout, setDoctor } = useAuthStore();
  const logo = useThemedLogo();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
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
  const [pendingSupportThreads, setPendingSupportThreads] = useState(0);
  const notificationsMenuRef = useRef(null);
  const notificationsPanelRef = useRef(null);
  const notificationsButtonRef = useRef(null);
  const [notificationsPanelStyle, setNotificationsPanelStyle] = useState({ top: 0, left: 0, width: 320 });

  const isProfileRestricted = LOCKED_PROFILE_STATUSES.includes(doctor?.profileVerificationStatus);
  const isSubscriptionRestricted =
    LOCKED_SUBSCRIPTION_STATUSES.includes(doctor?.subscriptionStatus) || isTrialExpired(doctor);
  const isAccessRestricted = isProfileRestricted || isSubscriptionRestricted;
  const visibleNavItems = isAccessRestricted ? navItems.filter((item) => item.key === "support") : navItems;

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

  const parseSeenMap = (key) => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const getItemLastMessageTime = (item, lastMessage) => {
    const source = lastMessage?.createdAt || item?.lastMessageAt || item?.updatedAt || item?.createdAt;
    const ts = new Date(source).getTime();
    return Number.isFinite(ts) ? ts : 0;
  };

  const refreshSidebarUpdateBadges = async () => {
    try {
      const supportRes = await axiosInstance.get("/issues/doctor?history=false&limit=50");
      const supportSeen = parseSeenMap(SUPPORT_SEEN_STORAGE_KEY);

      const tickets = Array.isArray(supportRes.data?.tickets) ? supportRes.data.tickets : [];
      const pendingSupport = tickets.filter((ticket) => {
        const ticketId = String(ticket?._id || "");
        const list = Array.isArray(ticket?.messages) ? ticket.messages : [];
        const fallbackLast = list.length > 0 ? list[list.length - 1] : null;
        const lastMessage = ticket?.lastMessage || fallbackLast;
        const lastSender = String(lastMessage?.senderRole || "").toLowerCase();
        if (lastSender !== "admin") return false;
        const incomingTailTime = getItemLastMessageTime(ticket, lastMessage);
        if (!incomingTailTime) return false;
        const seenAt = Number(supportSeen?.[ticketId] || 0);
        return seenAt < incomingTailTime;
      }).length;

      setPendingSupportThreads(pendingSupport);
    } catch {
      // Keep existing values on transient network failures.
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

  useEffect(() => {
    if (activeNav !== "dashboard") return;
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
      await refreshSidebarUpdateBadges();
    };

    bootstrap();

    const socket = getRealtimeSocketForRole("doctor");
    const handleRealtimeUpdate = () => {
      loadUnreadCount();
      syncVerificationStatus();
      refreshSidebarUpdateBadges();
    };

    socket.connect();
    socket.on("issue-ticket:list-updated", handleRealtimeUpdate);

    return () => {
      socket.off("issue-ticket:list-updated", handleRealtimeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshSidebarUpdateBadges();
    const timerId = window.setInterval(refreshSidebarUpdateBadges, 20000);
    const handleFocus = () => refreshSidebarUpdateBadges();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(timerId);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!["chats", "support"].includes(activeNav)) return;
    const syncId = window.setTimeout(refreshSidebarUpdateBadges, 350);
    return () => window.clearTimeout(syncId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav]);

  useEffect(() => {
    if (isAccessRestricted && activeNav !== "support") {
      setActiveNav("support");
    }
  }, [isAccessRestricted, activeNav]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationsOpen) return;
      const clickedInsideButton = notificationsMenuRef.current?.contains(event.target);
      const clickedInsidePanel = notificationsPanelRef.current?.contains(event.target);
      if (!clickedInsideButton && !clickedInsidePanel) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notificationsOpen]);

  const recalcNotificationsPanelPosition = () => {
    const buttonEl = notificationsButtonRef.current;
    if (!buttonEl || typeof window === "undefined") return;

    const rect = buttonEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const minMargin = 8;
    const preferredWidth = 352;
    const width = Math.min(preferredWidth, Math.max(260, viewportWidth - minMargin * 2));
    const left = Math.min(
      Math.max(minMargin, rect.right - width),
      Math.max(minMargin, viewportWidth - width - minMargin),
    );

    setNotificationsPanelStyle({
      top: rect.bottom + 10,
      left,
      width,
    });
  };

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    recalcNotificationsPanelPosition();

    const handleViewportChange = () => recalcNotificationsPanelPosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (activeNav !== "dashboard") return;

    const fetchTodayEarnings = async ({ withLoader = false } = {}) => {
      if (withLoader) setIsLoadingTodayEarnings(true);
      try {
        const [revenueRes, insightsRes] = await Promise.all([
          axiosInstance.get("/insights/revenue-lab"),
          axiosInstance.get("/insights"),
        ]);
        setTodayEarnings(Number(revenueRes?.data?.revenue?.daily || 0));
        setMonthlyEarnings(revenueRes?.data?.revenue?.monthlySeries || []);
        setTotalPrescriptions(insightsRes?.data?.counts?.prescriptions ?? null);
        setThisYearEarnings(Number(revenueRes?.data?.revenue?.yearly || 0));
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
    <div className="relative flex h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/55 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-52 h-[26rem] w-[26rem] rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black bg-opacity-60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={"fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[var(--color-border)]/80 bg-[var(--color-card)]/95 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.2)] transition-transform duration-300 lg:static " + (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}
        style={{ width: "240px", flexShrink: 0 }}>

        <div className="flex items-center gap-3 border-b border-[var(--color-border)]/80 px-5 py-4">
          <img src={logo} alt="MedAlerto" className="h-12 sm:h-12 w-auto max-w-[190px] object-contain" />
          <button className="ml-auto rounded-full border border-[var(--color-border)] px-2 py-1 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)] lg:hidden" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="border-b border-[var(--color-border)]/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full border border-[var(--color-border)]/80 bg-[var(--color-primary)] text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]"
              style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}>
              {doctor?.profilePicture ? (
                <img src={doctor.profilePicture} alt="Profile" className="h-full w-full rounded-full object-cover" />
              ) : (
                doctor?.fullName?.charAt(0) || "D"
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{doctor?.fullName || "Doctor"}</p>
                <VerifiedBadge isVerified={["Verified", "Approved"].includes(doctor?.profileVerificationStatus)} compact />
              </div>
              <p className="truncate text-xs text-[var(--color-primary)]">
                {[doctor?.title, doctor?.specialization || "Specialist"].filter(Boolean).join(" ")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="mb-3 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">Main Menu</p>
          {visibleNavItems.map((item) => (
            <button key={item.key} onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
              className="mb-1 flex w-full cursor-pointer items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: activeNav === item.key ? "rgba(93,112,82,0.12)" : "transparent",
                color: activeNav === item.key ? "var(--color-primary)" : "var(--color-text-secondary)",
                border: activeNav === item.key ? "1px solid rgba(93,112,82,0.25)" : "1px solid transparent",
              }}>
              <item.icon size={16} strokeWidth={2} className="shrink-0" />
              <span>{item.label}</span>
              {item.key === "support" && pendingSupportThreads > 0 ? (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-secondary)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-on-primary)]">
                  {pendingSupportThreads > 99 ? "99+" : pendingSupportThreads}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)]/80 px-3 py-4">
          <button onClick={handleLogout}
            className="hover-danger-soft flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-[var(--color-danger)] transition-all duration-200"
          >
            <LogOut size={16} strokeWidth={2} className="shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="relative shrink-0 border-b border-[var(--color-border)]/70 bg-[var(--color-card)]/90 px-4 py-4 backdrop-blur-md sm:px-6 min-h-[90px] flex items-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex flex-col items-center">
            <img
              src={fullblueLogo}
              alt="MedAlerto Logo"
              className="h-20 lg:h-28 w-auto max-w-[360px] lg:max-w-[520px] object-contain transform scale-105"
              style={{ filter: "drop-shadow(0 10px 24px rgba(93,112,82,0.18))" }}
            />
          </div>

          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-2xl border border-[var(--color-border)] p-2.5 hover:bg-[var(--color-bg-soft)] lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <div className="space-y-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block h-0.5 w-5 bg-[var(--color-primary)]" />
                  ))}
                </div>
              </button>
              <div>
                <h1 className="text-base font-bold text-[var(--color-text-primary)] sm:text-lg">{pageTitle}</h1>
                <p className="hidden text-xs text-[var(--color-text-secondary)] sm:block">{todayStr}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative" ref={notificationsMenuRef}>
                <button
                  ref={notificationsButtonRef}
                  onClick={async () => {
                    const nextState = !notificationsOpen;
                    setNotificationsOpen(nextState);
                    if (nextState) {
                      recalcNotificationsPanelPosition();
                      await loadNotifications();
                    }
                  }}
                  className="relative rounded-full border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-soft)]"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-[var(--color-on-primary)]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

              </div>

              <button
                type="button"
                onClick={() => setActiveNav(isAccessRestricted ? "support" : "settings")}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] px-2 py-1.5 transition-colors hover:bg-[var(--color-bg-soft)]"
              >
                <div className="h-8 w-8 rounded-full text-xs font-bold text-[var(--color-on-primary)]" style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}>
                  {doctor?.profilePicture ? (
                    <img src={doctor.profilePicture} alt="Profile" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    doctor?.fullName?.charAt(0) || "D"
                  )}
                </div>
                <span className="hidden text-sm font-medium text-[var(--color-text-primary)] sm:flex sm:items-center sm:gap-1.5">
                  {doctor?.fullName?.split(" ")[0] || "Doctor"}
                  <VerifiedBadge isVerified={["Verified", "Approved"].includes(doctor?.profileVerificationStatus)} compact />
                </span>
              </button>
            </div>
          </div>
        </header>

        {notificationsOpen && typeof document !== "undefined" ? createPortal(
          <div
            ref={notificationsPanelRef}
            className="fixed z-[120] overflow-hidden rounded-4xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.2)]"
            style={{ top: notificationsPanelStyle.top, left: notificationsPanelStyle.left, width: notificationsPanelStyle.width }}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)]/80 px-3 py-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">Notifications</p>
              <button
                onClick={async () => {
                  try {
                    await axiosInstance.patch("/notifications/read-all");
                    setNotifications([]);
                    setUnreadCount(0);
                    toast.success("Notification history cleared");
                  } catch {
                    toast.error("Failed to clear notifications");
                  }
                }}
                className="text-[11px] font-semibold text-[var(--color-primary)]"
              >
                Clear all
              </button>
            </div>
            <div className="overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: "min(20rem, calc(100vh - 7rem))" }}>
              {isLoadingNotifications ? (
                <p className="p-2 text-xs text-[var(--color-text-secondary)]">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="p-2 text-xs text-[var(--color-text-secondary)]">No notifications yet.</p>
              ) : (
                notifications.map((note) => (
                  <button
                    key={note._id}
                    onClick={async () => {
                              if (!note.isRead) {
                                try {
                                  await axiosInstance.patch(`/notifications/${note._id}/read`);
                                  setUnreadCount((count) => Math.max(0, count - 1));
                                  setNotifications((prev) => prev.map((n) => (n._id === note._id ? { ...n, isRead: true } : n)));
                                } catch {
                                  // Ignore mark-read failures on click.
                                }
                              }
                              if (["issue-message", "issue-status", "admin-update"].includes(note.type)) {
                                setActiveNav("support");
                                setNotificationsOpen(false);
                              } else if (note.type === "profile-status") {
                                setActiveNav(isAccessRestricted ? "support" : "settings");
                                setNotificationsOpen(false);
                              }
                            }}
                    className="w-full rounded-3xl border border-[var(--color-border)]/80 p-2 text-left transition hover:bg-[var(--color-bg-soft)]/50"
                  >
                    <p className="line-clamp-1 text-xs font-semibold text-[var(--color-text-primary)]">{note.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--color-text-secondary)]">{note.message}</p>
                    {!note.isRead && <span className="mt-1 inline-block text-[10px] font-bold text-[var(--color-primary)]">New</span>}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        ) : null}

        <main className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-6">
          {isAccessRestricted && (
            <div className="mb-4 rounded-4xl border border-[var(--color-secondary)]/40 bg-[var(--color-secondary)]/12 p-4 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.25)]">
              <p className="text-sm font-bold text-[var(--color-danger)]">
                {isSubscriptionRestricted ? "Subscription access restricted" : "Profile access restricted"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {isSubscriptionRestricted
                  ? "Your free trial has ended or your subscription is waiting for admin approval. Dashboard modules are locked, but Support remains available."
                  : "Admin requested updates to your profile. Dashboard modules are locked until your profile is verified again. You can still use Support to contact admin."}
              </p>
            </div>
          )}

          {isAccessRestricted && (
            <div className="mb-5 rounded-4xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 p-4 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
              <div className="pointer-events-none opacity-70 blur-sm">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="h-20 rounded-3xl bg-[var(--color-bg-soft)]/65" />
                  <div className="h-20 rounded-3xl bg-[var(--color-bg-soft)]/65" />
                  <div className="h-20 rounded-3xl bg-[var(--color-bg-soft)]/65" />
                  <div className="h-20 rounded-3xl bg-[var(--color-bg-soft)]/65" />
                </div>
              </div>
            </div>
          )}

          {isAccessRestricted && activeNav === "support" && <SupportCenterPage />}

          {!isAccessRestricted && (
            <>
          {activeNav === "settings" && <SettingsPage />}
          {activeNav === "queue" && <QueuePage />}
          {activeNav === "patients" && <PatientsPage />}
          {activeNav === "payments" && <PaymentPage onBack={() => setActiveNav("dashboard")} />}
          {activeNav === "chats" && <DoctorChatsPage />}
          {activeNav === "insights" && <InsightsPage />}
          {activeNav === "revenue-lab" && <RevenueLabPage />}
          {activeNav === "support" && <SupportCenterPage />}
          {activeNav === "emergency-cancelled" && (
            <EmergencyCancelledPage
              onReschedule={async (apt) => {
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
            />
          )}
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
                  { icon: UserPlus, label: "New Patient", color: "var(--color-primary)", onClick: () => setActiveNav("patients") },
                  { icon: CalendarCheck2, label: "Book Appointment", color: "var(--color-primary)", onClick: () => setActiveNav("appointments") },
                  { icon: MessageSquareWarning, label: "Feedback/Problem", color: "var(--color-primary)", onClick: () => setActiveNav("support") },
                  { icon: AlertTriangle, label: "Emergency Cancel", color: "var(--color-danger)", onClick: () => setActiveNav("emergency-cancelled") },
                ].map((action) => (
                  <button key={action.label} onClick={action.onClick}
                    className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.22)] sm:px-4 sm:py-2.5 sm:text-sm"
                    style={{
                      background: action.color === "var(--color-danger)" ? "rgba(168,84,72,0.1)" : "rgba(93,112,82,0.1)",
                      border: "1px solid " + (action.color === "var(--color-danger)" ? "rgba(168,84,72,0.25)" : "rgba(93,112,82,0.25)"),
                      color: action.color,
                    }}>
                    <span className="shrink-0">{dashboardGlyph(action.icon)}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">{action.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

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
                    { label: "Total Patients", value: String(totalPatients || 0), sub: "Registered patients", icon: Users, color: "var(--color-primary)", tint: "rgba(93,112,82,0.14)" },
                    { label: "Today's Appointments", value: todayAppointments.length.toString(), sub: todayAppointments.filter((a) => a.status === "Pending").length + " pending", icon: CalendarCheck2, color: "var(--color-secondary)", tint: "rgba(193,140,93,0.16)" },
                    { label: "Today's Earnings", value: `PKR ${todayEarnings.toLocaleString()}`, sub: "From insights", icon: Wallet, color: "var(--color-success)", tint: "rgba(111,138,97,0.15)" },
                    { label: "Prescriptions", value: totalPrescriptions === null ? "0" : String(totalPrescriptions), sub: "PDFs generated", icon: FileText, color: "var(--color-text-secondary)", tint: "rgba(139,125,102,0.16)" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-4xl p-4 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-10px_rgba(93,112,82,0.2)] sm:p-5"
                      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                      <div className="mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-base sm:h-10 sm:w-10 sm:text-lg"
                          style={{ background: stat.tint }}>
                          {/* Fix platform-dependent emoji stats by rendering the dashboard summary icons as SVGs. */}
                          <span className="shrink-0">{dashboardGlyph(stat.icon, "h-4 w-4 sm:h-5 sm:w-5")}</span>
                        </div>
                      </div>
                      <p className="mb-0.5 text-lg font-extrabold text-[var(--color-text-primary)] sm:text-2xl">{stat.value}</p>
                      <p className="mb-1 text-xs font-medium text-[var(--color-text-secondary)] sm:text-sm">{stat.label}</p>
                      <p className="text-xs" style={{ color: stat.color }}>{stat.sub}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2 rounded-4xl p-4 sm:p-6"
                  style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 4px 20px -2px rgba(93,112,82,0.15)" }}>
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

                <div className="rounded-4xl p-4 sm:p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 4px 20px -2px rgba(93,112,82,0.15)" }}>
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
                      <div key={apt._id} className="flex items-center gap-3 rounded-3xl p-3 transition-all hover:bg-[var(--color-bg-soft)]/40"
                        style={{ background: "color-mix(in srgb, var(--color-bg-soft) 58%, transparent)", border: "1px solid var(--color-border)" }}>
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
                            color: apt.status === "Confirmed" ? "var(--color-success)" : "var(--color-warning)",
                          }}>
                          {apt.status === "Confirmed" ? "✓" : "⏳"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-4xl p-4 sm:p-6" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "0 4px 20px -2px rgba(93,112,82,0.15)" }}>
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
                      <div key={patient._id} className="rounded-3xl p-3 transition-all hover:bg-[var(--color-bg-soft)]/40 sm:p-4"
                        style={{ background: "color-mix(in srgb, var(--color-bg-soft) 58%, transparent)", border: "1px solid var(--color-border)" }}>
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

              <div className="mt-4 rounded-3xl border border-[rgba(168,84,72,0.18)] bg-[rgba(168,84,72,0.05)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Reschedule queue</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Open the emergency-cancel page to manage cancellations and reschedules.</p>
                  </div>
                  <button
                    onClick={() => setActiveNav("emergency-cancelled")}
                    className="rounded-full px-4 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 hover:opacity-95"
                    style={{ background: "rgba(93,112,82,0.12)", border: "1px solid rgba(93,112,82,0.24)", color: "var(--color-primary)" }}
                  >
                    Open Queue
                  </button>
                </div>
              </div>
            </>
          )}
          
          </>
          )}

          {!isAccessRestricted && !["dashboard", "queue", "settings", "patients", "chats", "appointments", "emergency-cancelled", "insights", "revenue-lab", "payments", "support"].includes(activeNav) && (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-4xl border border-[var(--color-border)] bg-[var(--color-card)]/95 px-10 py-16 text-center shadow-[0_10px_40px_-10px_rgba(93,112,82,0.18)]">
                <div className="mb-4 text-5xl">🚧</div>
                <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">{pageTitle} Module</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Coming soon. We're building this next!</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
