import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarCheck2, CircleUserRound, ClipboardList, CreditCard, LayoutDashboard, LifeBuoy, LogOut, MessagesSquare, Users } from "lucide-react";
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
import DoctorQueuePage from "./DoctorQueuePage";
import OnlineBookingsPage from "./OnlineBookingsPage";
import VerifiedBadge from "../components/VerifiedBadge";
import DashboardHome from "../components/dashboard/DashboardHome";
import { getRealtimeSocketForRole } from "../realtime/socket";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
  { icon: ClipboardList, label: "Doctor Queue", key: "queue" },
  { icon: CalendarCheck2, label: "Online Approvals", key: "online-bookings" },
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

const isTrialExpired = (doctor) => {
  if (doctor?.subscriptionStatus !== "TRIAL" || !doctor?.subscriptionExpiresAt) return false;
  return new Date(doctor.subscriptionExpiresAt).getTime() <= Date.now();
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { doctor, logout, setDoctor } = useAuthStore();
  const logo = useThemedLogo();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rescheduleContext, setRescheduleContext] = useState(null);
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

  // Shared helper so dashboard links update the page and close the mobile sidebar.
  const handleNavigate = (navKey) => {
    setActiveNav(navKey);
    setSidebarOpen(false);
  };

  const todayStr = new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const pageTitle = visibleNavItems.find((n) => n.key === activeNav)?.label || "Dashboard";

  return (
    <div className="relative flex  h-[100dvh] overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
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
            <div className="overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: "min(20rem, calc(100dvh - 7rem))" }}>
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
          {activeNav === "queue" && <DoctorQueuePage />}
          {activeNav === "online-bookings" && <OnlineBookingsPage />}
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
            <DashboardHome doctor={doctor} onNavigate={handleNavigate} />
          )}
          
          </>
          )}

          {!isAccessRestricted && !["dashboard", "queue", "online-bookings", "settings", "patients", "chats", "appointments", "emergency-cancelled", "insights", "revenue-lab", "payments", "support"].includes(activeNav) && (
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
