import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

const S = {
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" },
  section: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" },
};

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-sm"
        style={{ background: "#0f1923", border: "1px solid rgba(16,184,169,0.3)", color: "white" }}>
        <p className="font-semibold" style={{ color: "#10B8A9" }}>{label}</p>
        <p>PKR {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get("/insights");
        setData(res.data);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#10B8A9", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const earnings = data?.earnings || {};
  const counts = data?.counts || {};
  const monthly = data?.monthly || [];
  const topDiseases = data?.topDiseases || [];
  const maxDiseaseCount = topDiseases[0]?.count || 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Insights</h2>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Your practice performance overview</p>
      </div>

      {/* Earnings Cards */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Earnings</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Today", value: fmt(earnings.today), color: "#10B8A9", icon: "💰" },
            { label: "This Week", value: fmt(earnings.thisWeek), color: "#38bdf8", icon: "📅" },
            { label: "This Month", value: fmt(earnings.thisMonth), color: "#a78bfa", icon: "🗓" },
            { label: "This Year", value: fmt(earnings.thisYear), color: "#22c55e", icon: "📈" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-4 sm:p-5" style={S.card}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-3"
                style={{ background: `rgba(${card.color === "#10B8A9" ? "16,184,169" : card.color === "#38bdf8" ? "56,189,248" : card.color === "#a78bfa" ? "167,139,250" : "34,197,94"},0.15)` }}>
                {card.icon}
              </div>
              <p className="text-base sm:text-lg font-extrabold text-white mb-0.5">{card.value}</p>
              <p className="text-xs font-medium" style={{ color: card.color }}>{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Count Cards */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Practice Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Patients", value: counts.patients || 0, color: "#10B8A9", icon: "👥" },
            { label: "Total Appointments", value: counts.appointments || 0, color: "#38bdf8", icon: "📅" },
            { label: "Total Checkups", value: counts.checkups || 0, color: "#f59e0b", icon: "🩺" },
            { label: "Prescriptions", value: counts.prescriptions || 0, color: "#a78bfa", icon: "📋" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-4 sm:p-5" style={S.card}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-3"
                style={{ background: `rgba(${card.color === "#10B8A9" ? "16,184,169" : card.color === "#38bdf8" ? "56,189,248" : card.color === "#f59e0b" ? "245,158,11" : "167,139,250"},0.15)` }}>
                {card.icon}
              </div>
              <p className="text-2xl font-extrabold text-white mb-0.5">{card.value}</p>
              <p className="text-xs font-medium" style={{ color: card.color }}>{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Earnings Chart + Top Diseases */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

        {/* Chart */}
        <div className="xl:col-span-2 rounded-2xl p-4 sm:p-6" style={S.card}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Monthly Earnings</h3>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {new Date().getFullYear()} — real data
              </p>
            </div>
            <div className="px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(16,184,169,0.1)", color: "#10B8A9" }}>
              {fmt(earnings.thisYear)} total
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="insightsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B8A9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B8A9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? v / 1000 + "k" : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="earnings" stroke="#10B8A9" strokeWidth={2}
                fill="url(#insightsGrad)" dot={false} activeDot={{ r: 5, fill: "#10B8A9" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Diseases */}
        <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
          <h3 className="text-sm sm:text-base font-bold text-white mb-1">Most Common Diseases</h3>
          <p className="text-xs mb-4" style={{ color: "#64748b" }}>Top 5 across all checkups</p>

          {topDiseases.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">🩺</div>
              <p className="text-sm" style={{ color: "#475569" }}>No disease data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topDiseases.map((item, i) => {
                const pct = Math.round((item.count / maxDiseaseCount) * 100);
                const colors = ["#10B8A9", "#38bdf8", "#a78bfa", "#f59e0b", "#22c55e"];
                const color = colors[i] || "#10B8A9";
                return (
                  <div key={item.disease}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-white truncate max-w-[70%]">{item.disease}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `rgba(${color === "#10B8A9" ? "16,184,169" : color === "#38bdf8" ? "56,189,248" : color === "#a78bfa" ? "167,139,250" : color === "#f59e0b" ? "245,158,11" : "34,197,94"},0.15)`, color }}>
                        {item.count} case{item.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Total Earnings Footer */}
      <div className="rounded-2xl p-5 flex items-center justify-between" style={S.card}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#475569" }}>All Time Earnings</p>
          <p className="text-2xl font-extrabold text-white">{fmt(earnings.total)}</p>
        </div>
        <div className="text-4xl">💎</div>
      </div>
    </div>
  );
}