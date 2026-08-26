import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Bell,
  CheckCircle2,
  Clock,
  Search,
  ArrowLeft,
  RefreshCw,
  Phone,
  Calendar,
  Activity,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import ConsultationWorkspace from "./ConsultationWorkspace";

// Queue status configs — strict WCAG-safe semantic contrast classes in both themes
const QUEUE_STATUS_CONFIG = {
  WAITING: {
    label: "Waiting",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  IN_CONSULTATION: {
    label: "In Consultation",
    badgeClass:
      "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800",
    dotClass: "bg-teal-500",
    hasPulse: true,
  },
  COMPLETED: {
    label: "Completed",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  NO_SHOW: {
    label: "No Show",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
};

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PT";

export default function DoctorQueuePage({ standalone = false, onBackToDashboard }) {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Consultation state
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [history, setHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Accordion state for grouped dates
  const [expandedDateGroups, setExpandedDateGroups] = useState({
    today: true,
    previousDay: true,
  });

  const fetchQueue = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await axiosInstance.get("/appointments/today");
      setAppointments(res.data.appointments || []);
    } catch {
      toast.error("Failed to load today's doctor queue");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue(true);
    // Background polling every 45s
    const interval = setInterval(() => fetchQueue(false), 45000);
    return () => clearInterval(interval);
  }, []);

  const handleStartConsultation = async (appt) => {
    try {
      const res = await axiosInstance.post(`/appointments/${appt._id}/start`);
      setActiveConsultation(res.data.appointment || appt);
      setHistory(res.data.history || []);
      setDrawerOpen(true);
      toast.success(`Consultation initiated for ${appt.patient?.name || "Patient"}`);
      fetchQueue(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start consultation");
    }
  };

  const handleSendReminder = async (appt) => {
    try {
      const res = await axiosInstance.post(`/appointments/${appt._id}/remind`);
      toast.success(res.data.message || "WhatsApp reminder sent to patient");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send WhatsApp reminder");
    }
  };

  // Date helpers
  const getDateKey = (value) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  };

  const getDisplayDateLabel = (dateValue) => {
    const date = new Date(dateValue);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(date, today)) return "Today";
    if (sameDay(date, yesterday)) return "Previous Day (Late-night)";
    return date.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Filtering & searching
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesFilter =
        activeFilter === "All" || appt.queueStatus === activeFilter;

      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const patientName = appt.patient?.name?.toLowerCase() || "";
      const patientPhone = appt.patient?.phone?.toLowerCase() || "";
      const slot = appt.slot?.toLowerCase() || "";

      return (
        patientName.includes(q) ||
        patientPhone.includes(q) ||
        slot.includes(q)
      );
    });
  }, [appointments, activeFilter, searchQuery]);

  // Grouping by date
  const appointmentGroups = useMemo(() => {
    const groups = {};
    for (const appt of filteredAppointments) {
      const key = getDateKey(appt.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(appt);
    }

    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([key, items]) => ({
        key,
        label: getDisplayDateLabel(key),
        items: items.sort((a, b) => (a.slot || "").localeCompare(b.slot || "")),
      }));
  }, [filteredAppointments]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = appointments.length;
    const waiting = appointments.filter((a) => a.queueStatus === "WAITING").length;
    const inConsultation = appointments.filter(
      (a) => a.queueStatus === "IN_CONSULTATION",
    ).length;
    const completed = appointments.filter(
      (a) => a.queueStatus === "COMPLETED",
    ).length;
    return { total, waiting, inConsultation, completed };
  }, [appointments]);

  const toggleGroup = (groupKey) => {
    setExpandedDateGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleBack = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* =========================================================================
          STANDALONE TOP NAVIGATION BAR (If viewed directly on /queue route)
         ========================================================================= */}
      {standalone && (
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all"
            >
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline uppercase tracking-wider">
              MedAlerto Clinical Assembly Line
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchQueue(false)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-teal-600" : ""}
              />
              <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </header>
      )}

      {/* =========================================================================
          PAGE HEADER & SUMMARY CARDS
         ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-slate-900 dark:text-white font-bold text-2xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Clinical Assembly Line
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            Real-time patient queue, live token sequencing & WhatsApp prescription dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!standalone && (
            <button
              onClick={() => fetchQueue(false)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-teal-600" : ""}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Queue"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Flow Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Total Today
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Waiting Now
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.waiting}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              In Consultation
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.inConsultation}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Completed
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.completed}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTROLS: SEARCH & STATUS FILTER CHIPS
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: "All", label: "All Patients", count: stats.total },
            { key: "WAITING", label: "Waiting", count: stats.waiting },
            { key: "IN_CONSULTATION", label: "In Consultation", count: stats.inConsultation },
            { key: "COMPLETED", label: "Completed", count: stats.completed },
            {
              key: "NO_SHOW",
              label: "No Show",
              count: appointments.filter((a) => a.queueStatus === "NO_SHOW").length,
            },
          ].map((tab) => {
            const isSelected = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-teal-700 text-white border-teal-700 shadow-sm hover:bg-teal-600"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] sm:w-72 shrink-0">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, phone, slot..."
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 py-2.5 pl-10 pr-4 text-xs font-semibold rounded-xl outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* =========================================================================
          QUEUE LISTING CARDS
         ========================================================================= */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Loading clinical assembly line...
          </p>
        </div>
      ) : appointmentGroups.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mx-auto flex items-center justify-center">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No patients found
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
            {searchQuery
              ? `No appointments match "${searchQuery}" under ${activeFilter} status.`
              : "No patient visits scheduled for this queue status currently."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointmentGroups.map((group) => {
            const isExpanded = expandedDateGroups[group.key] !== false;

            return (
              <div
                key={group.key}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
              >
                {/* Date Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {group.label}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      {group.items.length} patient{group.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400">
                    {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                  </span>
                </button>

                {/* Patient Cards in this date group */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {group.items.map((appt) => {
                      const statusConfig =
                        QUEUE_STATUS_CONFIG[appt.queueStatus] ||
                        QUEUE_STATUS_CONFIG.WAITING;
                      const patient = appt.patient || {};
                      const isCompleted = appt.queueStatus === "COMPLETED";
                      const inConsultation = appt.queueStatus === "IN_CONSULTATION";
                      const checkInStr = appt.checkInTime
                        ? new Date(appt.checkInTime).toLocaleTimeString("en-PK", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—";

                      const feeValue = Number(
                        appt.paymentAmount || appt.netAmount || appt.originalFee || 0,
                      );

                      return (
                        <div
                          key={appt._id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          {/* Left: Patient Avatar & High-Visibility Details */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Avatar Initials Badge */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--color-primary, #0d9488), #0f766e)",
                              }}
                            >
                              {getInitials(patient.name)}
                            </div>

                            {/* Patient Info */}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                  {patient.name || "Unknown Patient"}
                                </h3>

                                {appt.isWalkIn && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                                    Walk-In
                                  </span>
                                )}
                              </div>

                              {/* Age/Gender & Phone Number */}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {patient.age ? `${patient.age} yrs` : "Age N/A"} ·{" "}
                                  {patient.gender || "Gender N/A"}
                                </span>

                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  <Phone size={12} className="text-slate-400" />
                                  <span className="font-mono">{patient.phone || "—"}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Slot, Check-in, Status Badges & Financial Pills */}
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs">
                            {/* Slot Time */}
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Slot Time
                              </p>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">
                                {appt.slot || "—"}
                              </p>
                            </div>

                            {/* Check-In Time */}
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Check-In
                              </p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                {checkInStr}
                              </p>
                            </div>

                            {/* Upfront Paid Financial Pill */}
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Upfront Fee
                              </p>
                              {appt.paymentStatus === "PAID" ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                                  ✓ Paid Rs. {feeValue.toLocaleString()}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                                  ⏳ Pending Rs. {feeValue.toLocaleString()}
                                </span>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Status
                              </p>
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}
                              >
                                {statusConfig.hasPulse ? (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                                  </span>
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`}
                                  />
                                )}
                                <span>{statusConfig.label}</span>
                              </span>
                            </div>
                          </div>

                          {/* Right: High-contrast Action Buttons */}
                          <div className="flex items-center gap-2.5 pt-2 lg:pt-0 shrink-0">
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleStartConsultation(appt)}
                                className="bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
                              >
                                <Play size={14} fill="currentColor" />
                                <span>
                                  {inConsultation
                                    ? "Resume Consultation"
                                    : "Start Consultation"}
                                </span>
                              </button>
                            )}

                            {appt.queueStatus === "WAITING" && (
                              <button
                                type="button"
                                onClick={() => handleSendReminder(appt)}
                                className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <Bell size={13} />
                                <span>Remind</span>
                              </button>
                            )}

                            {isCompleted && (
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700">
                                <CheckCircle2 size={15} />
                                <span>Consultation Completed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          CONSULTATION WORKSPACE SPLIT DRAWER
         ========================================================================= */}
      <ConsultationWorkspace
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        appointment={activeConsultation}
        history={history}
        onCheckupComplete={() => {
          setDrawerOpen(false);
          fetchQueue(false);
        }}
      />
    </div>
  );
}
