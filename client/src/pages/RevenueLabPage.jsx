import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Coins, FileSpreadsheet, FileText, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { CardSkeleton, ChartSkeleton } from "../components/SkeletonLoaders";
import { organicCardStyle, organicTheme } from "../styles/organicTheme";

const S = {
  card: organicCardStyle,
  strongCard: {
    background: "linear-gradient(145deg, rgba(93,112,82,0.12), #FEFEFA)",
    border: "1px solid rgba(93,112,82,0.28)",
    boxShadow: organicTheme.shadows.soft,
  },
};

const fmtMoney = (n) => `PKR ${Math.round(Number(n || 0)).toLocaleString()}`;

const trendLabel = (n) => {
  const v = Number(n || 0);
  if (v > 0) return { text: `+${v.toFixed(1)}%`, tone: "#5D7052", icon: ArrowUpRight };
  if (v < 0) return { text: `${v.toFixed(1)}%`, tone: "#A85448", icon: ArrowDownRight };
  return { text: "0.0%", tone: "#78786C", icon: ArrowRight };
};

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm" style={S.card}>
      <p className="font-semibold" style={{ color: organicTheme.colors.primary }}>{label}</p>
      <p>{fmtMoney(payload[0].value)}</p>
    </div>
  );
};

const PeakTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const appointments = payload.find((p) => p.dataKey === "appointments")?.value || 0;
  const checkups = payload.find((p) => p.dataKey === "checkups")?.value || 0;
  return (
    <div className="px-3 py-2 rounded-xl text-sm" style={S.card}>
      <p className="font-semibold" style={{ color: organicTheme.colors.primary }}>{label}</p>
      <p>Appointments: {appointments}</p>
      <p>Checkups: {checkups}</p>
    </div>
  );
};

const toInputDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RevenueLabPage() {
  const [data, setData] = useState(null);
  const [billingLog, setBillingLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingUpdatingId, setBillingUpdatingId] = useState("");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");
  const [billingSearch, setBillingSearch] = useState("");
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/insights/revenue-lab", {
          params: { startDate, endDate },
        });
        setData(res.data);
        setBillingLog(res.data?.billingLog || []);
      } catch {
        toast.error("Failed to load Revenue Lab data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const revenue = data?.revenue || {};
  const trends = revenue?.trends || {};
  const missed = data?.missedRevenue || {};
  const reasonBreakdown = missed?.byReason || {};
  const peak = data?.peakDays || { series: [], best: { day: "N/A", appointments: 0, checkups: 0 } };

  const projectionSeries = useMemo(() => {
    const monthly = revenue?.monthlySeries || [];
    const monthlyRunRate = Number(revenue?.projectedYearly || 0) / 12;
    return monthly.map((m) => ({
      ...m,
      projected: monthlyRunRate,
    }));
  }, [revenue?.monthlySeries, revenue?.projectedYearly]);

  const handleExport = async (format) => {
    if (!startDate || !endDate) {
      toast.error("Select report start and end date");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setIsExporting(true);
    try {
      const res = await axiosInstance.get("/reports/financial", {
        params: { format, startDate, endDate },
        responseType: "blob",
      });
      const mime = format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${startDate}-to-${endDate}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch {
      toast.error(`Failed to download ${format.toUpperCase()} report`);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchBillingLog = useCallback(async () => {
    if (!startDate || !endDate) return;
    setBillingLoading(true);
    try {
      const res = await axiosInstance.get("/billing/log", {
        params: {
          status: billingStatusFilter,
          startDate,
          endDate,
          search: billingSearch,
          limit: 100,
        },
      });
      setBillingLog(res.data?.billingLog || []);
    } catch {
      toast.error("Failed to load billing log");
    } finally {
      setBillingLoading(false);
    }
  }, [billingSearch, billingStatusFilter, endDate, startDate]);

  useEffect(() => {
    fetchBillingLog();
  }, [fetchBillingLog]);

  const handleToggleBillingStatus = async (row) => {
    setBillingUpdatingId(row.id);
    try {
      const nextPaid = !row.isPaid;
      await axiosInstance.patch(`/billing/${row.id}/status`, { isPaid: nextPaid });
      setBillingLog((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, isPaid: nextPaid, status: nextPaid ? "Paid" : "Unpaid" } : x))
      );
      toast.success(`Marked as ${nextPaid ? "Paid" : "Unpaid"}`);
    } catch {
      toast.error("Failed to update billing status");
    } finally {
      setBillingUpdatingId("");
    }
  };

  const handleExportTax = async (format) => {
    setIsExporting(true);
    try {
      const res = await axiosInstance.get("/reports/tax-summary", {
        params: { format, year: taxYear },
        responseType: "blob",
      });
      const mime = format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-summary-${taxYear}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Tax ${format.toUpperCase()} downloaded`);
    } catch {
      toast.error(`Failed to download tax ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-4xl font-bold text-[#2C2C24]" style={{ fontFamily: "Fraunces" }}>Revenue Lab</h2>
          <p className="text-sm mt-1 text-[#78786C]">Money intelligence for your practice</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2"><ChartSkeleton height={280} /></div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 className="text-4xl font-bold text-[#2C2C24]" style={{ fontFamily: "Fraunces" }}>Revenue Lab</h2>
          <p className="text-sm mt-1 text-[#78786C]">If you keep going like this, here is what you will make this year.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex items-center gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#78786C]">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block mt-1 px-3 py-2 rounded-full text-xs outline-none"
                style={{ background: "rgba(255,255,255,0.65)", border: "1px solid #DED8CF", color: "#2C2C24" }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#78786C]">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block mt-1 px-3 py-2 rounded-full text-xs outline-none"
                style={{ background: "rgba(255,255,255,0.65)", border: "1px solid #DED8CF", color: "#2C2C24" }}
              />
            </div>
          </div>
          <button
            onClick={() => handleExport("xlsx")}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1"
            style={{ background: "rgba(93,112,82,0.12)", color: "#5D7052", border: "1px solid rgba(93,112,82,0.28)" }}
          >
            <FileSpreadsheet size={14} />
            {isExporting ? "Exporting..." : "Export Excel (.xlsx)"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1"
            style={{ background: "rgba(240,235,229,0.45)", color: "#78786C", border: "1px solid #DED8CF" }}
          >
            <FileText size={14} />
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
          <input
            type="number"
            min="2000"
            max="3000"
            value={taxYear}
            onChange={(e) => setTaxYear(Number(e.target.value || new Date().getFullYear()))}
            className="px-3 py-2.5 rounded-full text-xs w-[90px] outline-none"
            style={{ background: "rgba(255,255,255,0.65)", color: "#2C2C24", border: "1px solid #DED8CF" }}
          />
          <button
            onClick={() => handleExportTax("xlsx")}
            disabled={isExporting}
            className="px-3 py-2.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(193,140,93,0.14)", color: "#C18C5D", border: "1px solid rgba(193,140,93,0.3)" }}
          >
            Tax XLSX
          </button>
          <button
            onClick={() => handleExportTax("pdf")}
            disabled={isExporting}
            className="px-3 py-2.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(193,140,93,0.08)", color: "#C18C5D", border: "1px solid rgba(193,140,93,0.24)" }}
          >
            Tax PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Daily Income", value: fmtMoney(revenue.daily), trend: trendLabel(trends.dailyPct), Icon: Coins },
          { label: "Weekly Income", value: fmtMoney(revenue.weekly), trend: trendLabel(trends.weeklyPct), Icon: CalendarDays },
          { label: "Monthly Income", value: fmtMoney(revenue.monthly), trend: trendLabel(trends.monthlyPct), Icon: Wallet },
          { label: "Year Projection", value: fmtMoney(revenue.projectedYearly), trend: { text: "Run-rate model", tone: "#C18C5D", icon: ArrowRight }, Icon: BarChart3 },
        ].map((card) => (
          <div key={card.label} className="rounded-[2rem] p-4" style={card.label === "Year Projection" ? S.strongCard : S.card}>
            <div className="flex items-start justify-between mb-2">
              <span className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(93,112,82,0.12)", color: "#5D7052" }}><card.Icon size={18} /></span>
              <span className="text-xs font-semibold" style={{ color: card.trend.tone }}>
                <span className="inline-flex items-center gap-1"><card.trend.icon size={14} /> {card.trend.text}</span>
              </span>
            </div>
            <p className="text-base sm:text-lg font-extrabold text-[#2C2C24]">{card.value}</p>
            <p className="text-xs text-[#78786C]">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl p-4 sm:p-6" style={S.card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">Monthly Revenue + Projection</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Actual earnings versus run-rate line</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {fmtMoney(revenue.yearly)} YTD
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={projectionSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="earnings" stroke="var(--color-primary)" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="projected" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} strokeDasharray="5 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">Peak Patient Days</h3>
          <p className="text-xs mb-3 text-[var(--color-text-secondary)]">
            Best day: {peak.best?.day} ({peak.best?.appointments || 0} appointments, {peak.best?.checkups || 0} checkups)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peak.series || []} margin={{ top: 5, right: 0, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<PeakTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="appointments" name="Appointments" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="checkups" name="Checkups" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 rounded-2xl p-4 sm:p-5" style={S.strongCard}>
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-2">Missed Revenue Detector</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">Psychological metric: potential earnings leakage this month</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Missed appointments</span>
              <strong className="text-[var(--color-text-primary)]">{missed.missedAppointments || 0}</strong>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              No-show: {reasonBreakdown?.["No-show"]?.count || 0} | Patient cancel: {reasonBreakdown?.Patient?.count || 0} | Emergency: {reasonBreakdown?.Emergency?.count || 0}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Patients not returning (90d)</span>
              <strong className="text-[var(--color-text-primary)]">{missed.nonReturningPatients || 0}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Estimated avg fee</span>
              <strong className="text-[var(--color-text-primary)]">{fmtMoney(missed.estimatedAvgFee)}</strong>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <p className="text-xs uppercase tracking-widest text-red-300 mb-1">Potentially lost this month</p>
            <p className="text-xl font-extrabold text-red-400">{fmtMoney(missed.totalPotentialLoss)}</p>
            <p className="text-xs text-red-200 mt-1">
              From missed appointments: {fmtMoney(missed.missedAppointmentsRevenue)}
            </p>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl p-4 sm:p-5" style={S.card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">Simple Billing Log</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Patient, fee, paid/unpaid. Kept intentionally lightweight.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: "All", value: "all" },
              { label: "Paid", value: "paid" },
              { label: "Unpaid", value: "unpaid" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setBillingStatusFilter(f.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: billingStatusFilter === f.value ? "color-mix(in srgb, var(--color-primary) 14%, transparent)" : "var(--color-bg)",
                  color: billingStatusFilter === f.value ? "var(--color-primary)" : "var(--color-text-secondary)",
                  border: `1px solid ${billingStatusFilter === f.value ? "color-mix(in srgb, var(--color-primary) 30%, transparent)" : "var(--color-border)"}`,
                }}
              >
                {f.label}
              </button>
            ))}
            <input
              value={billingSearch}
              onChange={(e) => setBillingSearch(e.target.value)}
              placeholder="Search patient"
              className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
            />
          </div>

          {billingLoading ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">Loading billing log...</div>
          ) : billingLog.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">No billing data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                    <th className="pb-2">Patient</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Fee</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billingLog.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--color-border)]">
                      <td className="py-2 font-medium text-[var(--color-text-primary)]">{row.patientName}</td>
                      <td className="py-2 text-[var(--color-text-secondary)]">{new Date(row.date).toLocaleDateString("en-PK")}</td>
                      <td className="py-2 text-[var(--color-text-primary)]">{fmtMoney(row.fee)}</td>
                      <td className="py-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: row.status === "Paid" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                            color: row.status === "Paid" ? "#22c55e" : "#f59e0b",
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleToggleBillingStatus(row)}
                          disabled={billingUpdatingId === row.id}
                          className="text-xs px-2 py-1 rounded-lg font-semibold"
                          style={{
                            background: row.isPaid ? "rgba(245,158,11,0.14)" : "rgba(34,197,94,0.14)",
                            color: row.isPaid ? "#f59e0b" : "#22c55e",
                            border: `1px solid ${row.isPaid ? "rgba(245,158,11,0.35)" : "rgba(34,197,94,0.35)"}`,
                          }}
                        >
                          {billingUpdatingId === row.id ? "Saving..." : row.isPaid ? "Mark Unpaid" : "Mark Paid"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
