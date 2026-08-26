import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Coins,
  Download,
  Wallet,
} from "lucide-react";
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

const fmtMoney = (n) => `PKR ${Math.round(Number(n || 0)).toLocaleString()}`;

const trendLabel = (n) => {
  const value = Number(n || 0);
  if (value > 0) return { text: `+${value.toFixed(1)}%`, icon: ArrowUpRight };
  if (value < 0) return { text: `${value.toFixed(1)}%`, icon: ArrowDownRight };
  return { text: "0.0%", icon: ArrowRight };
};

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const earnings = payload.find((item) => item.dataKey === "earnings")?.value ?? payload[0].value;
  const projected = payload.find((item) => item.dataKey === "projected")?.value;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-bold text-slate-900 dark:text-white">{label}: {fmtMoney(earnings)}</p>
      {projected !== undefined && (
        <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Projection: {fmtMoney(projected)}
        </p>
      )}
    </div>
  );
};

const PeakTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const appointments = payload.find((item) => item.dataKey === "appointments")?.value || 0;
  const checkups = payload.find((item) => item.dataKey === "checkups")?.value || 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-bold text-slate-900 dark:text-white">{label}</p>
      <p className="font-semibold text-slate-700 dark:text-slate-300">Appointments: {appointments}</p>
      <p className="font-semibold text-slate-700 dark:text-slate-300">Checkups: {checkups}</p>
    </div>
  );
};

const toInputDate = (date) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const skeletonCard = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export default function RevenueLabPage() {
  const [data, setData] = useState(null);
  const [billingLog, setBillingLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingRevenueDetails, setIsDownloadingRevenueDetails] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingUpdatingId, setBillingUpdatingId] = useState("");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");
  const [billingSearch, setBillingSearch] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/insights/revenue-lab", {
          params: { startDate, endDate },
        });
        setData(response.data);
        setBillingLog(response.data?.billingLog || []);
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
  const peak = data?.peakDays || {
    series: [],
    best: { day: "N/A", appointments: 0, checkups: 0 },
  };

  const projectionSeries = useMemo(() => {
    const monthly = revenue?.monthlySeries || [];
    const monthlyRunRate = Number(revenue?.projectedYearly || 0) / 12;

    return monthly.map((month) => ({
      ...month,
      projected: monthlyRunRate,
    }));
  }, [revenue?.monthlySeries, revenue?.projectedYearly]);

  const handleDownloadRevenueDetails = async () => {
    if (!startDate || !endDate) {
      toast.error("Select report start and end date");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setIsDownloadingRevenueDetails(true);
    try {
      const response = await axiosInstance.get("/reports/revenue-details", {
        params: { startDate, endDate },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `revenue-details-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Revenue details downloaded");
    } catch {
      toast.error("Failed to download revenue details");
    } finally {
      setIsDownloadingRevenueDetails(false);
    }
  };

  const fetchBillingLog = useCallback(async () => {
    if (!startDate || !endDate) return;
    setBillingLoading(true);

    try {
      const response = await axiosInstance.get("/billing/log", {
        params: {
          status: billingStatusFilter,
          startDate,
          endDate,
          search: billingSearch,
          limit: 100,
        },
      });
      setBillingLog(response.data?.billingLog || []);
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
      const currentPaid = row.status === "Paid" || row.isPaid;
      const nextPaid = !currentPaid;
      await axiosInstance.patch(`/billing/${row.id}/status`, { isPaid: nextPaid });
      setBillingLog((previous) =>
        previous.map((item) =>
          item.id === row.id
            ? { ...item, isPaid: nextPaid, status: nextPaid ? "Paid" : "Unpaid" }
            : item
        )
      );
      toast.success(`Marked as ${nextPaid ? "Paid" : "Unpaid"}`);
    } catch {
      toast.error("Failed to update billing status");
    } finally {
      setBillingUpdatingId("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">Revenue Lab</h2>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            Money intelligence for your practice
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={`${skeletonCard} animate-pulse`}>
              <div className="mb-4 h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mb-2 h-8 w-36 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className={`${skeletonCard} h-[340px] animate-pulse xl:col-span-2`} />
          <div className={`${skeletonCard} h-[340px] animate-pulse`} />
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Daily Income", value: fmtMoney(revenue.daily), trend: trendLabel(trends.dailyPct), Icon: Coins },
    { label: "Weekly Income", value: fmtMoney(revenue.weekly), trend: trendLabel(trends.weeklyPct), Icon: CalendarDays },
    { label: "Monthly Income", value: fmtMoney(revenue.monthly), trend: trendLabel(trends.monthlyPct), Icon: Wallet },
    { label: "Year Projection", value: fmtMoney(revenue.projectedYearly), trend: { text: "Run-rate model", icon: ArrowRight }, Icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            Revenue Lab
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            If you keep going like this, here is what you will make this year.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex items-end gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="mb-1 block">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="mb-1 block">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleDownloadRevenueDetails}
            disabled={isDownloadingRevenueDetails}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            <Download size={15} strokeWidth={2.5} />
            {isDownloadingRevenueDetails ? "Downloading..." : "Download Revenue Details"}
          </button>
        </div>
      </header>

      <section aria-label="Revenue metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, trend, Icon }) => {
          const TrendIcon = trend.icon;
          return (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-teal-500/40 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  <Icon size={18} strokeWidth={2.25} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <TrendIcon size={13} strokeWidth={2.5} />
                  {trend.text}
                </span>
              </div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {label}
              </span>
              <p className="mb-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {value}
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Compared with prior period</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3" aria-label="Financial charts">
        <article className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="mb-1 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Revenue + Projection</h3>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Actual earnings versus run-rate line
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-900 dark:bg-teal-950 dark:text-teal-300">
              {fmtMoney(revenue.yearly)} YTD
            </span>
          </div>
          <div className="mt-5" aria-label="Monthly revenue chart">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={projectionSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueLabGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--color-text-primary)", fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fill: "var(--color-text-primary)", fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : value)}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "var(--color-border-strong)" }} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  name="Revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fill="url(#revenueLabGradient)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-card)", fill: "var(--color-primary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  name="Projection"
                  stroke="var(--color-warning)"
                  strokeWidth={2}
                  fillOpacity={0}
                  strokeDasharray="6 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Peak Patient Days</h3>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Best day: <span className="font-bold text-slate-900 dark:text-white">{peak.best?.day}</span> ({peak.best?.appointments || 0} appointments, {peak.best?.checkups || 0} checkups)
          </p>
          <div className="mt-5" aria-label="Peak patient days chart">
            <ResponsiveContainer width="100%" height={244}>
              <BarChart data={peak.series || []} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--color-text-primary)", fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--color-text-primary)", fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <Tooltip content={<PeakTooltip />} cursor={{ fill: "var(--color-bg-soft)", opacity: 0.6 }} />
                <Legend
                  wrapperStyle={{ color: "var(--color-text-primary)", fontSize: "11px", fontWeight: 700, paddingTop: "10px" }}
                />
                <Bar dataKey="appointments" name="Appointments" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="checkups" name="Checkups" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3" aria-label="Revenue leakage and billing log">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">Missed Revenue Detector</h3>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Psychological metric: potential earnings leakage this month
          </p>

          <div className="mt-4">
            <div className="mb-2.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Missed appointments</span>
                <span className="mt-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  No-show: {reasonBreakdown?.["No-show"]?.count || 0} · Patient cancel: {reasonBreakdown?.Patient?.count || 0} · Emergency: {reasonBreakdown?.Emergency?.count || 0}
                </span>
              </div>
              <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{missed.missedAppointments || 0}</strong>
            </div>
            <div className="mb-2.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Patients not returning (90d)</span>
              <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{missed.nonReturningPatients || 0}</strong>
            </div>
            <div className="mb-2.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Estimated average fee</span>
              <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{fmtMoney(missed.estimatedAvgFee)}</strong>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Potentially Lost This Month
            </span>
            <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">{fmtMoney(missed.totalPotentialLoss)}</p>
            <p className="mt-1 text-xs font-semibold text-rose-800 dark:text-rose-300">
              From missed appointments: {fmtMoney(missed.missedAppointmentsRevenue)}
            </p>
          </div>
        </article>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2" aria-labelledby="billing-log-title">
          <div className="p-6 pb-5">
            <h3 id="billing-log-title" className="text-base font-bold text-slate-900 dark:text-white">Simple Billing Log</h3>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              Patient, fee, paid/unpaid. Kept intentionally lightweight.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 pb-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Billing status filter">
              {[
                { label: "All", value: "all" },
                { label: "Paid", value: "paid" },
                { label: "Unpaid", value: "unpaid" },
              ].map((filter) => {
                const isActive = billingStatusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setBillingStatusFilter(filter.value)}
                    className={isActive
                      ? "rounded-full bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                      : "rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <label className="relative block">
              <span className="sr-only">Search patient</span>
              <input
                value={billingSearch}
                onChange={(event) => setBillingSearch(event.target.value)}
                placeholder="Search patient"
                className="w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
              />
            </label>
          </div>

          {billingLoading ? (
            <div className="px-6 py-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Loading billing log...</div>
          ) : billingLog.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">No billing data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="p-4">Patient</th>
                    <th scope="col" className="p-4">Date</th>
                    <th scope="col" className="p-4">Fee</th>
                    <th scope="col" className="p-4">Status</th>
                    <th scope="col" className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billingLog.map((row) => {
                    const isPaid = row.status === "Paid" || row.isPaid;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{row.patientName}</td>
                        <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(row.date).toLocaleDateString("en-PK")}
                        </td>
                        <td className="p-4 text-sm font-extrabold text-slate-900 dark:text-white">{fmtMoney(row.fee)}</td>
                        <td className="p-4">
                          <span className={isPaid
                            ? "inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"}
                          >
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleBillingStatus(row)}
                            disabled={billingUpdatingId === row.id}
                            className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            {billingUpdatingId === row.id ? "Saving..." : isPaid ? "Mark Unpaid" : "Mark Paid"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
