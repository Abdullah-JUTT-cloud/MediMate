import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import logo from "../assets/logo.svg";
import SettingsPage from "./SettingsPage";
import PatientsPage from "./PatientsPage";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const earningsData = [
  { month: "Jan", earnings: 32000 },
  { month: "Feb", earnings: 28000 },
  { month: "Mar", earnings: 45000 },
  { month: "Apr", earnings: 38000 },
  { month: "May", earnings: 52000 },
  { month: "Jun", earnings: 47000 },
  { month: "Jul", earnings: 61000 },
  { month: "Aug", earnings: 55000 },
  { month: "Sep", earnings: 67000 },
  { month: "Oct", earnings: 72000 },
  { month: "Nov", earnings: 64000 },
  { month: "Dec", earnings: 80000 },
];

const upcomingAppointments = [
  {
    id: 1,
    name: "Ahmed Raza",
    time: "09:00 AM",
    type: "Follow-up",
    status: "confirmed",
  },
  {
    id: 2,
    name: "Sara Khan",
    time: "10:30 AM",
    type: "Consultation",
    status: "confirmed",
  },
  {
    id: 3,
    name: "Bilal Tariq",
    time: "11:00 AM",
    type: "Check-up",
    status: "pending",
  },
  {
    id: 4,
    name: "Fatima Ali",
    time: "12:30 PM",
    type: "Follow-up",
    status: "confirmed",
  },
  {
    id: 5,
    name: "Usman Malik",
    time: "02:00 PM",
    type: "Consultation",
    status: "pending",
  },
];

const recentPatients = [
  {
    id: 1,
    name: "Ahmed Raza",
    age: 34,
    condition: "Hypertension",
    lastVisit: "Today",
    avatar: "AR",
  },
  {
    id: 2,
    name: "Sara Khan",
    age: 28,
    condition: "Diabetes Type 2",
    lastVisit: "Yesterday",
    avatar: "SK",
  },
  {
    id: 3,
    name: "Bilal Tariq",
    age: 45,
    condition: "Cardiac Review",
    lastVisit: "2 days ago",
    avatar: "BT",
  },
  {
    id: 4,
    name: "Fatima Ali",
    age: 52,
    condition: "Arthritis",
    lastVisit: "3 days ago",
    avatar: "FA",
  },
];

const navItems = [
  { icon: "⊞", label: "Dashboard", key: "dashboard" },
  { icon: "👥", label: "Patients", key: "patients" },
  { icon: "📅", label: "Appointments", key: "appointments" },
  { icon: "📊", label: "Insights", key: "insights" },
  { icon: "⚙️", label: "Settings", key: "settings" },
];

// ─── Custom Tooltip for Chart ─────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-sm"
        style={{
          background: "#0f1923",
          border: "1px solid rgba(16,184,169,0.3)",
          color: "white",
        }}
      >
        <p className="font-semibold" style={{ color: "#10B8A9" }}>
          {label}
        </p>
        <p>PKR {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { doctor, logout } = useAuthStore();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Active page label for top navbar
  const pageTitle =
    navItems.find((n) => n.key === activeNav)?.label || "Dashboard";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0f1923" }}
    >
      {/* ── Sidebar Overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: "240px",
          background: "#0a1628",
          borderRight: "1px solid rgba(16,184,169,0.1)",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(16,184,169,0.1)" }}
        >
          <img
            src={logo}
            alt="MediMate"
            className="h-8 w-auto brightness-0 invert"
          />
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Doctor info */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(16,184,169,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #10B8A9, #0d9488)",
              }}
            >
              {doctor?.fullName?.charAt(0) || "D"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {doctor?.fullName || "Doctor"}
              </p>
              <p className="text-xs truncate" style={{ color: "#10B8A9" }}>
                {doctor?.specialization || "Specialist"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto ">
          <p
            className="text-xs font-semibold uppercase tracking-widest px-3 mb-3"
            style={{ color: "#334155" }}
          >
            Main Menu
          </p>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveNav(item.key);
                setSidebarOpen(false);
              }}
              className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all duration-200"
              style={{
                background:
                  activeNav === item.key
                    ? "rgba(16,184,169,0.12)"
                    : "transparent",
                color: activeNav === item.key ? "#10B8A9" : "#64748b",
                borderLeft:
                  activeNav === item.key
                    ? "3px solid #10B8A9"
                    : "3px solid transparent",
              }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div
          className="px-3 py-4"
          style={{ borderTop: "1px solid rgba(16,184,169,0.08)" }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red-500 hover:text-white hover:bg-opacity-10"
            style={{ color: "#ffffff" }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── TOP NAVBAR ── */}
        <header
          className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0"
          style={{
            background: "#0a1628",
            borderBottom: "1px solid rgba(16,184,169,0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-5"
              onClick={() => setSidebarOpen(true)}
            >
              <div className="space-y-1.5">
                <span
                  className="block w-5 h-0.5"
                  style={{ background: "#10B8A9" }}
                ></span>
                <span
                  className="block w-5 h-0.5"
                  style={{ background: "#10B8A9" }}
                ></span>
                <span
                  className="block w-5 h-0.5"
                  style={{ background: "#10B8A9" }}
                ></span>
              </div>
            </button>
            <div>
              {/* Title updates based on active nav */}
              <h1 className="text-base sm:text-lg font-bold text-white">
                {pageTitle}
              </h1>
              <p
                className="text-xs hidden sm:block"
                style={{ color: "#64748b" }}
              >
                {today}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="relative p-2 rounded-xl transition-colors hover:bg-white hover:bg-opacity-5"
              style={{ color: "#64748b" }}
            >
              🔔
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#10B8A9" }}
              ></span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-xl transition-colors hover:bg-white hover:bg-opacity-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #10B8A9, #0d9488)",
                }}
              >
                {doctor?.fullName?.charAt(0) || "D"}
              </div>
              <span className="text-sm font-medium text-red-500 hidden sm:block">
                {doctor?.fullName?.split(" ")[0] || "Doctor"}
              </span>
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 "
          style={{ background: "#0f1923" }}
        >
          {/* ── SETTINGS PAGE ── */}
          {activeNav === "settings" && <SettingsPage />}
          {/* ── PATIENTS PAGE ── */}
          {activeNav === "patients" && <PatientsPage />}

          {/* ── DASHBOARD HOME ── */}
          {activeNav === "dashboard" && (
            <>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                {[
                  { icon: "👤", label: "New Patient", color: "#10B8A9" },
                  { icon: "📅", label: "Book Appointment", color: "#10B8A9" },
                  { icon: "🚨", label: "Emergency Cancel", color: "#ef4444" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 hover:opacity-90"
                    style={{
                      background:
                        action.color === "#ef4444"
                          ? "rgba(239,68,68,0.1)"
                          : "rgba(16,184,169,0.1)",
                      border: `1px solid ${action.color === "#ef4444" ? "rgba(239,68,68,0.3)" : "rgba(16,184,169,0.3)"}`,
                      color: action.color,
                    }}
                  >
                    <span>{action.icon}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">
                      {action.label.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                  {
                    label: "Today's Patients",
                    value: "12",
                    sub: "+2 from yesterday",
                    icon: "👥",
                    color: "#10B8A9",
                  },
                  {
                    label: "Appointments",
                    value: "8",
                    sub: "3 pending",
                    icon: "📅",
                    color: "#38bdf8",
                  },
                  {
                    label: "Today's Earnings",
                    value: "PKR 8,400",
                    sub: "6 consultations",
                    icon: "💰",
                    color: "#22c55e",
                  },
                  {
                    label: "Prescriptions",
                    value: "10",
                    sub: "All sent via WhatsApp",
                    icon: "📋",
                    color: "#a78bfa",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl p-4 sm:p-5 transition-all hover:scale-105"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg"
                        style={{
                          background: `rgba(${stat.color === "#10B8A9" ? "16,184,169" : stat.color === "#38bdf8" ? "56,189,248" : stat.color === "#22c55e" ? "34,197,94" : "167,139,250"},0.15)`,
                        }}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-extrabold text-white mb-0.5">
                      {stat.value}
                    </p>
                    <p
                      className="text-xs sm:text-sm font-medium mb-1"
                      style={{ color: "#94a3b8" }}
                    >
                      {stat.label}
                    </p>
                    <p className="text-xs" style={{ color: stat.color }}>
                      {stat.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Chart + Appointments row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div
                  className="xl:col-span-2 rounded-2xl p-4 sm:p-6"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Monthly Earnings
                      </h3>
                      <p className="text-xs" style={{ color: "#64748b" }}>
                        Year 2026 overview
                      </p>
                    </div>
                    <div
                      className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        background: "rgba(16,184,169,0.1)",
                        color: "#10B8A9",
                      }}
                    >
                      PKR 80,000 ↑
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={earningsData}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="earningsGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10B8A9"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10B8A9"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v / 1000}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="#10B8A9"
                        strokeWidth={2}
                        fill="url(#earningsGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: "#10B8A9" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div
                  className="rounded-2xl p-4 sm:p-5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Today's Appointments
                    </h3>
                    <span
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: "rgba(16,184,169,0.1)",
                        color: "#10B8A9",
                      }}
                    >
                      {upcomingAppointments.length} total
                    </span>
                  </div>
                  <div
                    className="space-y-2.5 overflow-y-auto"
                    style={{ maxHeight: "220px" }}
                  >
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white hover:bg-opacity-5 cursor-default"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #10B8A9, #0d9488)",
                          }}
                        >
                          {apt.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {apt.name}
                          </p>
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            {apt.time} · {apt.type}
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{
                            background:
                              apt.status === "confirmed"
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(245,158,11,0.1)",
                            color:
                              apt.status === "confirmed"
                                ? "#22c55e"
                                : "#f59e0b",
                          }}
                        >
                          {apt.status === "confirmed" ? "✓" : "⏳"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Patients */}
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Recent Patients
                    </h3>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      Last visited patients
                    </p>
                  </div>
                  <button
                    className="text-xs font-semibold transition-colors hover:text-teal-300"
                    style={{ color: "#10B8A9" }}
                  >
                    View All →
                  </button>
                </div>

                <div className="hidden sm:grid grid-cols-4 gap-4 px-3 mb-2">
                  {["Patient", "Age", "Condition", "Last Visit"].map((h) => (
                    <p
                      key={h}
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#334155" }}
                    >
                      {h}
                    </p>
                  ))}
                </div>

                <div className="space-y-2">
                  {recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="rounded-xl p-3 sm:p-4 transition-all hover:bg-white hover:bg-opacity-5 cursor-default"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div className="sm:hidden flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #10B8A9, #0d9488)",
                          }}
                        >
                          {patient.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {patient.name}
                          </p>
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            {patient.condition} · Age {patient.age}
                          </p>
                        </div>
                        <span className="text-xs" style={{ color: "#10B8A9" }}>
                          {patient.lastVisit}
                        </span>
                      </div>
                      <div className="hidden sm:grid grid-cols-4 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, #10B8A9, #0d9488)",
                            }}
                          >
                            {patient.avatar}
                          </div>
                          <span className="text-sm font-semibold text-white truncate">
                            {patient.name}
                          </span>
                        </div>
                        <span className="text-sm" style={{ color: "#94a3b8" }}>
                          {patient.age} yrs
                        </span>
                        <span className="text-sm" style={{ color: "#94a3b8" }}>
                          {patient.condition}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#10B8A9" }}
                        >
                          {patient.lastVisit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── COMING SOON pages ── */}
          {!["dashboard", "settings", "patients"].includes(activeNav) && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🚧</div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {pageTitle} Module
                </h2>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Coming soon. We're building this next!
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
