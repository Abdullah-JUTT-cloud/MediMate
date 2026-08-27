import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  Stethoscope,
  Users,
  X,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import ConsultationWorkspace from "./ConsultationWorkspaceRedesigned";
import useAuthStore from "../store/authStore";
import VerifiedBadge from "../components/VerifiedBadge";

const demoPatients = [
  {
    _id: "demo-104",
    token: "A-104",
    patient: { name: "Maham Ali", age: 28, gender: "Female", phone: "+92 300 845 1129" },
    slot: "09:30 AM",
    checkInTime: "09:18 AM",
    queueStatus: "IN_CONSULTATION",
    isWalkIn: false,
    paymentStatus: "PAID",
    paymentAmount: 3000,
  },
  {
    _id: "demo-105",
    token: "A-105",
    patient: { name: "Bilal Ahmed", age: 42, gender: "Male", phone: "+92 321 662 9088" },
    slot: "09:45 AM",
    checkInTime: "09:37 AM",
    queueStatus: "WAITING",
    isWalkIn: true,
    paymentStatus: "PAID",
    paymentAmount: 3000,
  },
  {
    _id: "demo-106",
    token: "A-106",
    patient: { name: "Sara Khan", age: 35, gender: "Female", phone: "+92 333 214 7642" },
    slot: "10:00 AM",
    checkInTime: "09:51 AM",
    queueStatus: "WAITING",
    isWalkIn: false,
    paymentStatus: "PAID",
    paymentAmount: 3000,
  },
  {
    _id: "demo-103",
    token: "A-103",
    patient: { name: "Omar Farooq", age: 61, gender: "Male", phone: "+92 312 450 1180" },
    slot: "08:45 AM",
    checkInTime: "08:42 AM",
    queueStatus: "COMPLETED",
    isWalkIn: false,
    paymentStatus: "PAID",
    paymentAmount: 2500,
  },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { label: "Doctor Queue", icon: ClipboardList, key: "queue" },
  { label: "Patients", icon: Users, key: "patients" },
  { label: "Chats", icon: MessageSquare, key: "chats" },
  { label: "Appointments", icon: CalendarDays, key: "appointments" },
  { label: "Insights", icon: BarChart3, key: "insights" },
  { label: "Revenue Lab", icon: Activity, key: "revenue" },
  { label: "Payments", icon: CreditCard, key: "payments" },
];

const statusConfig = {
  WAITING: {
    label: "Waiting",
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  },
  IN_CONSULTATION: {
    label: "In Consultation",
    dot: "bg-teal-500",
    badge: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/70 dark:bg-teal-950/40 dark:text-teal-300",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  NO_SHOW: {
    label: "No Show",
    dot: "bg-rose-500",
    badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
  },
};

const getInitials = (name = "Patient") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatTime = (value) => {
  if (!value) return "—";
  if (typeof value === "string" && value.match(/\d{1,2}:\d{2}\s?(AM|PM)/i)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
};

const formatFee = (appointment) =>
  Number(appointment.paymentAmount || appointment.netAmount || appointment.originalFee || appointment.consultationFee || 0).toLocaleString();

function QueueSidebar({ collapsed, mobileOpen, onClose, onToggle, activeKey, onNavigate, doctor }) {
  const doctorName = doctor?.fullName || "Dr. Ayesha Rahman";
  const specialty = [doctor?.title, doctor?.specialization].filter(Boolean).join(" ") || "Dermatologist";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 lg:static lg:z-auto ${
          collapsed ? "lg:w-[78px]" : "lg:w-[248px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`flex h-[76px] shrink-0 items-center border-b border-slate-100 dark:border-slate-800 ${collapsed ? "justify-center px-3" : "justify-between px-5"}`}>
          <button type="button" className="flex items-center gap-3" onClick={() => onNavigate("dashboard")} aria-label="Go to dashboard">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/20">
              <Stethoscope size={19} strokeWidth={2.4} />
            </span>
            {!collapsed && (
              <span className="text-[17px] font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white">
                Med<span className="text-teal-600 dark:text-teal-400">Alerto</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft size={16} className={collapsed ? "rotate-180" : ""} />
          </button>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <div className={`border-b border-slate-100 py-4 dark:border-slate-800 ${collapsed ? "px-3" : "px-4"}`}>
          <div className={`flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {doctor?.profilePicture ? <img src={doctor.profilePicture} alt="Doctor" className="h-full w-full object-cover" /> : "AR"}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">{doctorName}</p>
                  <VerifiedBadge isVerified compact />
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{specialty}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Workspace</p>}
          <div className="space-y-1">
            {navItems.map(({ label, icon: Icon, key }) => {
              const active = key === activeKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onNavigate(key)}
                  title={collapsed ? label : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    active
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  {createElement(Icon, { size: 17, strokeWidth: active ? 2.3 : 1.9, className: active ? "text-teal-600 dark:text-teal-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" })}
                  {!collapsed && <span>{label}</span>}
                  {!collapsed && key === "chats" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-500" />}
                </button>
              );
            })}
          </div>

          {!collapsed && (
            <div className="mt-7 rounded-xl border border-teal-100 bg-teal-50/70 p-3 dark:border-teal-900/60 dark:bg-teal-950/30">
              <div className="flex items-center gap-2 text-[11px] font-bold text-teal-700 dark:text-teal-300"><Zap size={13} fill="currentColor" /> Queue is live</div>
              <p className="mt-1 text-[10px] leading-4 text-teal-700/70 dark:text-teal-300/70">Patient updates sync automatically every 45 seconds.</p>
            </div>
          )}
        </nav>

        <div className={`border-t border-slate-100 p-3 dark:border-slate-800 ${collapsed ? "flex justify-center" : ""}`}>
          <button type="button" title={collapsed ? "Settings" : undefined} onClick={() => onNavigate("settings")} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white ${collapsed ? "justify-center" : "w-full"}`}>
            <Settings2 size={17} />
            {!collapsed && <span>Workspace settings</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function QueueTopbar({ doctor, onMenu, onProfile }) {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
        <div className="hidden h-7 w-px bg-slate-200 dark:bg-slate-800 sm:block" />
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Clinic operations</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">Wednesday, 26 August 2026 <span className="mx-1.5 text-slate-300">•</span> Islamabad clinic</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300 sm:flex">
          <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
          Live sync
        </div>
        <button type="button" className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200" aria-label="Notifications"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" /></button>
        <button type="button" onClick={onProfile} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 transition hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900" aria-label="Open profile">
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-[10px] font-bold text-white">{doctor?.profilePicture ? <img src={doctor.profilePicture} alt="Profile" className="h-full w-full object-cover" /> : "AR"}</span>
          <span className="hidden text-[11px] font-bold text-slate-700 dark:text-slate-200 sm:inline">{doctor?.fullName?.split(" ")[0] || "Ayesha"}</span>
        </button>
      </div>
    </header>
  );
}

function MetricCard({ label, value, icon: Icon, tone, note }) {
  const tones = {
    slate: { icon: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", accent: "bg-slate-400" },
    amber: { icon: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300", accent: "bg-amber-400" },
    teal: { icon: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300", accent: "bg-teal-500" },
    emerald: { icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300", accent: "bg-emerald-500" },
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] dark:border-slate-800 dark:bg-slate-900">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${tones.accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.04em] text-slate-900 dark:text-white">{value}</p>
          <p className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">{note}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones.icon}`}>{createElement(Icon, { size: 18 })}</div>
      </div>
    </div>
  );
}

function PatientRow({ appointment, onStart }) {
  const patient = appointment.patient || {};
  const config = statusConfig[appointment.queueStatus] || statusConfig.WAITING;
  const isCompleted = appointment.queueStatus === "COMPLETED";
  const isInConsultation = appointment.queueStatus === "IN_CONSULTATION";

  return (
    <div className={`group grid gap-4 border-b border-slate-100 px-4 py-4 transition last:border-b-0 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30 sm:px-5 lg:grid-cols-[minmax(240px,1.3fr)_112px_118px_154px_190px] lg:items-center ${isInConsultation ? "bg-teal-50/[0.35] dark:bg-teal-950/[0.12]" : ""}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden w-11 shrink-0 font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:block">{appointment.token || "—"}</span>
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${isInConsultation ? "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
          {getInitials(patient.name)}
          {isInConsultation && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500 dark:border-slate-900" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[13px] font-extrabold text-slate-900 dark:text-white">{patient.name || "Unknown Patient"}</h3>
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] ${appointment.isWalkIn ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" : "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"}`}>{appointment.isWalkIn ? "Walk-in" : "Appointment"}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>{patient.age ? `${patient.age} yrs` : "Age N/A"}</span><span className="text-slate-300 dark:text-slate-700">•</span><span>{patient.gender || "Gender N/A"}</span>
            <span className="hidden text-slate-300 dark:text-slate-700 sm:inline">•</span><span className="flex items-center gap-1 font-mono text-[10px]"><Phone size={11} className="text-slate-400" />{patient.phone || "—"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 lg:block">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500">Slot time</p><p className="mt-1 text-[12px] font-extrabold text-slate-800 dark:text-slate-200">{appointment.slot || "—"}</p></div>
        <div><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500">Checked in</p><p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">{formatTime(appointment.checkInTime)}</p></div>
      </div>

      <div className="hidden lg:block"><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500">Upfront fee</p><span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold ${appointment.paymentStatus === "PAID" || appointment.paymentStatus === "REALIZED" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"}`}><Check size={11} strokeWidth={3} />{appointment.paymentStatus === "PAID" || appointment.paymentStatus === "REALIZED" ? `Paid Rs. ${formatFee(appointment)}` : `Pending Rs. ${formatFee(appointment)}`}</span></div>

      <div className="flex items-center justify-between gap-2 lg:block"><div><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500">Status</p><span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-extrabold ${config.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${isInConsultation ? "animate-pulse" : ""}`} />{config.label}</span></div><div className="lg:hidden"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold ${appointment.paymentStatus === "PAID" || appointment.paymentStatus === "REALIZED" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700"}`}><Check size={10} />Rs. {formatFee(appointment)}</span></div></div>

      <div className="flex items-center justify-start lg:justify-end"><button type="button" disabled={isCompleted} onClick={() => onStart(appointment)} className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-extrabold transition sm:w-auto ${isCompleted ? "cursor-default border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500" : isInConsultation ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20 hover:bg-teal-700" : "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"}`}>{isCompleted ? <>✓ Consultation Completed</> : <>{isInConsultation ? "Resume Consultation" : "Start Consultation"}<span className="text-sm leading-none">→</span></>}</button><button type="button" className="ml-2 hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 sm:block" aria-label="More patient options"><MoreHorizontal size={16} /></button></div>
    </div>
  );
}

function QueueContent({ appointments, loading, refreshing, filter, setFilter, searchQuery, setSearchQuery, onRefresh, onStart, selectedDate, setSelectedDate }) {
  const noShow = appointments.filter((patient) => patient.queueStatus === "NO_SHOW").length;
  const stats = useMemo(() => ({
    total: appointments.length,
    waiting: appointments.filter((patient) => patient.queueStatus === "WAITING").length,
    consultation: appointments.filter((patient) => patient.queueStatus === "IN_CONSULTATION").length,
    completed: appointments.filter((patient) => patient.queueStatus === "COMPLETED").length,
  }), [appointments]);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const base = appointments.filter((appointment) => {
      const matchesFilter = filter === "ALL" || appointment.queueStatus === filter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return [appointment.token, appointment.patient?.name, appointment.patient?.phone, appointment.slot]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    const parseSlotTime = (slotStr) => {
      if (!slotStr) return Infinity;
      const parts = String(slotStr).trim().split(' ');
      if (parts.length < 2) return Infinity;
      const [timePart, meridiem] = parts;
      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr, 10) || 0;
      const m = parseInt(mStr, 10) || 0;
      if (meridiem && meridiem.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (meridiem && meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    return [...base].sort((a, b) => {
      const aActive = a.queueStatus !== "COMPLETED";
      const bActive = b.queueStatus !== "COMPLETED";
      if (aActive !== bActive) return aActive ? -1 : 1;
      if (aActive && bActive) {
        const ta = parseSlotTime(a.slot);
        const tb = parseSlotTime(b.slot);
        if (ta !== tb) return ta - tb;
        return new Date(a.checkInTime || 0) - new Date(b.checkInTime || 0);
      }
      const aToken = parseInt(String(a.token || '').replace(/\D/g, ''), 10) || 0;
      const bToken = parseInt(String(b.token || '').replace(/\D/g, ''), 10) || 0;
      if (aToken !== bToken) return aToken - bToken;
      return new Date(a.checkInTime || 0) - new Date(b.checkInTime || 0);
    });
  }, [appointments, filter, searchQuery]);

  const filters = [
    { key: "ALL", label: "All Patients", count: stats.total },
    { key: "WAITING", label: "Waiting", count: stats.waiting },
    { key: "IN_CONSULTATION", label: "In Consultation", count: stats.consultation },
    { key: "COMPLETED", label: "Completed", count: stats.completed },
    { key: "NO_SHOW", label: "No Show", count: noShow },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/70">
      <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-6 sm:px-7 sm:py-7">
        <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Doctor queue / Today</p>
            <h1 className="text-[28px] font-extrabold tracking-[-0.045em] text-slate-950 dark:text-white sm:text-[32px]">Clinical Assembly Line</h1>
            <p className="mt-1.5 max-w-2xl text-[12px] font-medium leading-5 text-slate-500 dark:text-slate-400 sm:text-[13px]">Real-time patient queue, live token sequencing &amp; WhatsApp prescription dispatch.</p>
          </div>
          <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-teal-600 px-4 text-[12px] font-extrabold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-70 xl:self-auto"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Refreshing queue" : "Refresh Queue"}</button>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard label="Total Today" value={stats.total} icon={Users} tone="slate" note="All scheduled visits" />
          <MetricCard label="Waiting Now" value={stats.waiting} icon={Clock3} tone="amber" note={stats.waiting ? "Next patient is ready" : "Queue is clear"} />
          <MetricCard label="In Consultation" value={stats.consultation} icon={Stethoscope} tone="teal" note="Active clinical room" />
          <MetricCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="emerald" note={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% of today's queue`} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between lg:px-5">
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
              {filters.map((item) => {
                const active = filter === item.key;
                return <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${active ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}><span>{item.label}</span><span className={`rounded px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-900" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{item.count}</span></button>;
              })}
            </div>
            <div className="relative w-full lg:max-w-[282px]"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, phone or token..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-[11px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900" />{searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search"><X size={13} /></button>}</div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30 sm:px-5"><div className="flex min-w-0 items-center gap-2.5 overflow-x-auto pb-0.5"><CalendarDays size={15} className="text-teal-600 dark:text-teal-400 shrink-0" /><h2 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap">{selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Today'} <span className="font-medium text-slate-400">•</span> {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'}</h2><input type="date" value={selectedDate || new Date().toISOString().slice(0, 10)} onChange={(e) => { const v = e.target.value; const todayStr = new Date().toISOString().slice(0, 10); setSelectedDate(v === todayStr ? '' : v); }} className="ml-2 h-7 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" /></div><div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Last synced just now</div></div>

          {loading ? <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-slate-500"><RefreshCw size={21} className="animate-spin text-teal-500" /><p className="text-[12px] font-semibold">Loading clinical assembly line...</p></div> : filteredPatients.length === 0 ? <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center"><div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400 dark:bg-slate-800"><Search size={20} /></div><h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">No patients found</h3><p className="mt-1 text-[11px] text-slate-500">Try a different status filter or search term.</p></div> : <div><div className="hidden grid-cols-[minmax(240px,1.3fr)_112px_118px_154px_190px] gap-4 border-b border-slate-100 px-5 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:text-slate-500 lg:grid"><span>Patient details</span><span>Visit timing</span><span>Payment</span><span>Queue status</span><span className="text-right">Action</span></div>{filteredPatients.map((appointment) => <PatientRow key={appointment._id} appointment={appointment} onStart={onStart} />)}</div>}
        </section>

        <div className="flex items-center gap-2 px-1 text-[10px] font-medium text-slate-400 dark:text-slate-500"><Zap size={12} className="text-teal-500" fill="currentColor" /> Patient actions update the queue instantly. WhatsApp dispatch is available after consultation completion.</div>
      </div>
    </main>
  );
}

export default function DoctorQueuePage({ standalone = false, demo = false, onBackToDashboard }) {
  const navigate = useNavigate();
  const doctor = useAuthStore((state) => state.doctor);
  const [appointments, setAppointments] = useState(demo ? demoPatients : []);
  const [loading, setLoading] = useState(!demo);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [history, setHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(""); // empty = today

  const fetchQueue = useCallback(async (showLoader = false) => {
    if (demo) {
      setRefreshing(true);
      window.setTimeout(() => setRefreshing(false), 500);
      return;
    }
    if (showLoader) setLoading(true);
    setRefreshing(true);
    try {
      const dateParam = selectedDate ? `?date=${selectedDate}` : "";
      const response = await axiosInstance.get(`/appointments/today${dateParam}`);
      const incoming = response.data?.appointments || [];
      // Some older API records predate token IDs; keep the queue legible and searchable.
      setAppointments(incoming.map((item, index) => ({
        ...item,
        token: item.token || `A-${String(index + 1).padStart(3, "0")}`,
      })));
    } catch {
      // The dashboard remains useful while the API is unavailable. This also makes
      // the shell render a representative queue during local frontend development.
      setAppointments(demoPatients);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [demo, selectedDate]);

  useEffect(() => {
    if (demo) return undefined;
    fetchQueue(true);
    const interval = window.setInterval(() => fetchQueue(false), 45000);
    return () => window.clearInterval(interval);
  }, [demo, fetchQueue]);

  const handleStart = async (appointment) => {
    if (demo || String(appointment._id).startsWith("demo-")) {
      setAppointments((current) => current.map((item) => item._id === appointment._id ? { ...item, queueStatus: "IN_CONSULTATION" } : item));
      toast.success(`${appointment.patient?.name || "Patient"} moved to consultation`);
      return;
    }

    try {
      const response = await axiosInstance.post(`/appointments/${appointment._id}/start`);
      setActiveConsultation(response.data?.appointment || appointment);
      setHistory(response.data?.history || []);
      setDrawerOpen(true);
      setAppointments((current) => current.map((item) => item._id === appointment._id ? { ...item, queueStatus: "IN_CONSULTATION" } : item));
      toast.success(`Consultation initiated for ${appointment.patient?.name || "Patient"}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start consultation");
    }
  };

  const navigateFromSidebar = (key) => {
    setMobileOpen(false);
    if (key === "queue") return;
    if (key === "dashboard") {
      if (onBackToDashboard) onBackToDashboard();
      else navigate("/dashboard");
      return;
    }
    toast(`${key === "revenue" ? "Revenue Lab" : key[0].toUpperCase() + key.slice(1)} is available from the dashboard shell`, { icon: "•" });
  };

  const content = <QueueContent appointments={appointments} loading={loading} refreshing={refreshing} filter={filter} setFilter={setFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onRefresh={() => fetchQueue(false)} onStart={handleStart} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;

  if (!standalone) {
    return <>{content}<ConsultationWorkspace isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} appointment={activeConsultation} history={history} onCheckupComplete={() => { setDrawerOpen(false); fetchQueue(false); }} /></>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-body text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <QueueSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onToggle={() => setCollapsed((value) => !value)} activeKey="queue" onNavigate={navigateFromSidebar} doctor={doctor} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <QueueTopbar doctor={doctor} onMenu={() => setMobileOpen(true)} onProfile={() => toast("Profile settings are available in the dashboard")} />
        {content}
      </div>
    </div>
  );
}
