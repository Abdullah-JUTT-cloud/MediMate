import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import logo from "../assets/logo.svg";
import SettingsPage from "./SettingsPage";
import PatientsPage from "./PatientsPage";
import AppointmentsPage from "./AppointmentsPage";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const earningsData = [
  { month: "Jan", earnings: 32000 }, { month: "Feb", earnings: 28000 },
  { month: "Mar", earnings: 45000 }, { month: "Apr", earnings: 38000 },
  { month: "May", earnings: 52000 }, { month: "Jun", earnings: 47000 },
  { month: "Jul", earnings: 61000 }, { month: "Aug", earnings: 55000 },
  { month: "Sep", earnings: 67000 }, { month: "Oct", earnings: 72000 },
  { month: "Nov", earnings: 64000 }, { month: "Dec", earnings: 80000 },
];

const navItems = [
  { icon: "⊞", label: "Dashboard", key: "dashboard" },
  { icon: "👥", label: "Patients", key: "patients" },
  { icon: "📅", label: "Appointments", key: "appointments" },
  { icon: "📊", label: "Insights", key: "insights" },
  { icon: "⚙️", label: "Settings", key: "settings" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "#0f1923", border: "1px solid rgba(16,184,169,0.3)", color: "white" }}>
        <p className="font-semibold" style={{ color: "#10B8A9" }}>{label}</p>
        <p>PKR {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { doctor, logout } = useAuthStore();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (activeNav !== "dashboard") return;
    const fetchDashboardData = async () => {
      setIsLoadingData(true);
      try {
       const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const [appointmentsRes, patientsRes] = await Promise.all([
          axiosInstance.get("/appointments?date=" + today),
          axiosInstance.get("/patients"),
        ]);
        const appointments = appointmentsRes && appointmentsRes.data && Array.isArray(appointmentsRes.data.appointments)
          ? appointmentsRes.data.appointments
          : [];
        const patients = patientsRes && patientsRes.data && Array.isArray(patientsRes.data.patients)
          ? patientsRes.data.patients
          : [];

        setTodayAppointments(appointments);
        setRecentPatients(Array.isArray(patients) ? patients.slice(0, 4) : []);
        setTotalPatients(
          patientsRes && patientsRes.data && Number.isFinite(Number(patientsRes.data.total))
            ? Number(patientsRes.data.total)
            : patients.length,
        );
      } catch {
        console.error("Failed to load dashboard data");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchDashboardData();
  }, [activeNav]);

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
  const pageTitle = navItems.find((n) => n.key === activeNav)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0f1923" }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black bg-opacity-60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={"fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 " + (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}
        style={{ width: "240px", background: "#0a1628", borderRight: "1px solid rgba(16,184,169,0.1)", flexShrink: 0 }}>

        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(16,184,169,0.1)" }}>
          <img src={logo} alt="MediMate" className="h-8 w-auto brightness-0 invert" />
          <button className="ml-auto lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(16,184,169,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)" }}>
              {doctor?.fullName?.charAt(0) || "D"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{doctor?.fullName || "Doctor"}</p>
              <p className="text-xs truncate" style={{ color: "#10B8A9" }}>
                {[doctor?.title, doctor?.specialization || "Specialist"].filter(Boolean).join(" ")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "#334155" }}>Main Menu</p>
          {navItems.map((item) => (
            <button key={item.key} onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
              className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all duration-200"
              style={{
                background: activeNav === item.key ? "rgba(16,184,169,0.12)" : "transparent",
                color: activeNav === item.key ? "#10B8A9" : "#64748b",
                borderLeft: activeNav === item.key ? "3px solid #10B8A9" : "3px solid transparent",
              }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(16,184,169,0.08)" }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red-500 hover:bg-opacity-10"
            style={{ color: "#ef4444" }}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0"
          style={{ background: "#0a1628", borderBottom: "1px solid rgba(16,184,169,0.1)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-5" onClick={() => setSidebarOpen(true)}>
              <div className="space-y-1.5">
                {[0,1,2].map((i) => <span key={i} className="block w-5 h-0.5" style={{ background: "#10B8A9" }} />)}
              </div>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white">{pageTitle}</h1>
              <p className="text-xs hidden sm:block" style={{ color: "#64748b" }}>{todayStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="relative p-2 rounded-xl transition-colors hover:bg-white hover:bg-opacity-5" style={{ color: "#64748b" }}>
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#10B8A9" }} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-xl transition-colors hover:bg-white hover:bg-opacity-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)" }}>
                {doctor?.fullName?.charAt(0) || "D"}
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">{doctor?.fullName?.split(" ")[0] || "Doctor"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: "#0f1923" }}>
          {activeNav === "settings" && <SettingsPage />}
          {activeNav === "patients" && <PatientsPage />}
          {activeNav === "appointments" && <AppointmentsPage />}

          {activeNav === "dashboard" && (
            <>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                {[
                  { icon: "👤", label: "New Patient", color: "#10B8A9", onClick: () => setActiveNav("patients") },
                  { icon: "📅", label: "Book Appointment", color: "#10B8A9", onClick: () => setActiveNav("appointments") },
                  { icon: "🚨", label: "Emergency Cancel", color: "#ef4444", onClick: () => toast("Emergency Cancel is not available yet") },
                ].map((action) => (
                  <button key={action.label} onClick={action.onClick}
                    className="flex items-center cursor-pointer gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 hover:opacity-90"
                    style={{
                      background: action.color === "#ef4444" ? "rgba(239,68,68,0.1)" : "rgba(16,184,169,0.1)",
                      border: "1px solid " + (action.color === "#ef4444" ? "rgba(239,68,68,0.3)" : "rgba(16,184,169,0.3)"),
                      color: action.color,
                    }}>
                    <span>{action.icon}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">{action.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                  { label: "Total Patients", value: isLoadingData ? "..." : String(totalPatients || 0), sub: "Registered patients", icon: "👥", color: "#10B8A9" },
                  { label: "Today's Appointments", value: isLoadingData ? "..." : todayAppointments.length.toString(), sub: isLoadingData ? "Loading..." : todayAppointments.filter((a) => a.status === "Pending").length + " pending", icon: "📅", color: "#38bdf8" },
                  { label: "Today's Earnings", value: "PKR —", sub: "Insights coming soon", icon: "💰", color: "#22c55e" },
                  { label: "Prescriptions", value: "—", sub: "Coming soon", icon: "📋", color: "#a78bfa" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl  p-4 sm:p-5 transition-all hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="mb-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg"
                        style={{ background: "rgba(" + (stat.color === "#10B8A9" ? "16,184,169" : stat.color === "#38bdf8" ? "56,189,248" : stat.color === "#22c55e" ? "34,197,94" : "167,139,250") + ",0.15)" }}>
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-extrabold text-white mb-0.5">{stat.value}</p>
                    <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#94a3b8" }}>{stat.label}</p>
                    <p className="text-xs" style={{ color: stat.color }}>{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="xl:col-span-2 rounded-2xl p-4 sm:p-6"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">Monthly Earnings</h3>
                      <p className="text-xs" style={{ color: "#64748b" }}>Year 2026 overview (mock)</p>
                    </div>
                    <div className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: "rgba(16,184,169,0.1)", color: "#10B8A9" }}>PKR 80,000 ↑</div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={earningsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B8A9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B8A9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v/1000 + "k"} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="earnings" stroke="#10B8A9" strokeWidth={2} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 5, fill: "#10B8A9" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl p-4 sm:p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-white">Today's Appointments</h3>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(16,184,169,0.1)", color: "#10B8A9" }}>
                      {todayAppointments.length} total
                    </span>
                  </div>
                  <div className="space-y-2.5 overflow-y-auto" style={{ maxHeight: "220px" }}>
                    {isLoadingData ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#10B8A9", borderTopColor: "transparent" }} />
                      </div>
                    ) : todayAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm" style={{ color: "#475569" }}>No appointments today</p>
                      </div>
                    ) : todayAppointments.map((apt) => (
                      <div key={apt._id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white hover:bg-opacity-5"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)" }}>
                          {apt.patient?.name?.charAt(0) || "P"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{apt.patient?.name || "Unknown"}</p>
                          <p className="text-xs" style={{ color: "#64748b" }}>{apt.slot} · {apt.type}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
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

              <div className="rounded-2xl p-4 sm:p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Recent Patients</h3>
                    <p className="text-xs" style={{ color: "#64748b" }}>Latest registered patients</p>
                  </div>
                  <button onClick={() => setActiveNav("patients")} className="text-xs font-semibold transition-colors cursor-pointer hover:text-teal-300" style={{ color: "#10B8A9" }}>View All →</button>
                </div>

                <div className="hidden sm:grid grid-cols-4 gap-4 px-3 mb-2">
                  {["Patient", "Age & Gender", "Phone", "Blood Group"].map((h) => (
                    <p key={h} className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#334155" }}>{h}</p>
                  ))}
                </div>

                {isLoadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#10B8A9", borderTopColor: "transparent" }} />
                  </div>
                ) : recentPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "#475569" }}>No patients yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPatients.map((patient) => (
                      <div key={patient._id} className="rounded-xl p-3 sm:p-4 transition-all hover:bg-white hover:bg-opacity-5"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="sm:hidden flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)" }}>
                            {getInitials(patient.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{patient.name}</p>
                            <p className="text-xs" style={{ color: "#64748b" }}>{patient.age} yrs · {patient.gender}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(16,184,169,0.1)", color: "#10B8A9" }}>{patient.bloodGroup}</span>
                        </div>
                        <div className="hidden sm:grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)" }}>
                              {getInitials(patient.name)}
                            </div>
                            <span className="text-sm font-semibold text-white truncate">{patient.name}</span>
                          </div>
                          <span className="text-sm" style={{ color: "#94a3b8" }}>{patient.age} yrs · {patient.gender}</span>
                          <span className="text-sm" style={{ color: "#94a3b8" }}>{patient.phone}</span>
                          <span className="text-xs px-2.5 py-1 rounded-full w-fit font-semibold" style={{ background: "rgba(16,184,169,0.1)", color: "#10B8A9" }}>{patient.bloodGroup}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {!["dashboard", "settings", "patients", "appointments"].includes(activeNav) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🚧</div>
                <h2 className="text-xl font-bold text-white mb-2">{pageTitle} Module</h2>
                <p className="text-sm" style={{ color: "#64748b" }}>Coming soon. We're building this next!</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}