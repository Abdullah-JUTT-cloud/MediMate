import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import axiosInstance from "../api/axios";
import { CardSkeleton } from "../components/SkeletonLoaders";

const pct = (n) => `${Math.round(Number(n || 0))}%`;
const safeNum = (n) => Number(n || 0);

const trendText = (trend) => {
  if (trend === "up")
    return { icon: TrendingUp, label: "Increasing", color: "rose" };
  if (trend === "down")
    return { icon: TrendingDown, label: "Decreasing", color: "teal" };
  return { icon: Minus, label: "Stable", color: "slate" };
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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Insights
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Simple clinical and clinic operations summary
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const counts = data?.counts || {};
  const topDiseases = data?.topDiseases || [];
  const topMedicines = data?.topMedicines || [];
  const clinical = data?.clinicalQuality || {};
  const flow = data?.patientFlow || {};
  const ops = data?.operationsReliability || {};
  const continuity = data?.careContinuity || {};

  const topDiagnosesMoM = clinical?.topDiagnosesMoM || [];
  const cancellationMix = ops?.cancellationMix || [];

  const followUpsDue = safeNum(clinical?.followUpDueThisWeek);
  const overdueFollowUps = safeNum(clinical?.overdueFollowUps);
  const repeatComplaints = safeNum(clinical?.repeatComplaintPatients);
  const needsAttention = overdueFollowUps + repeatComplaints;

  const new30 = safeNum(flow?.newVsReturning?.days30?.new);
  const returning30 = safeNum(flow?.newVsReturning?.days30?.returning);
  const revisitDays = Number(flow?.revisitIntervalTrend?.currentAvgDays || 0).toFixed(1);

  const noShowRate = pct(ops?.noShowRate30d);
  const completionRate = pct(ops?.onTimeCompletionRate30d);
  const prescriptionCoverage = pct(continuity?.prescriptionCoverageRatio);

  const peakDay = ops?.peakLoad?.bestWeekday?.day || "N/A";
  const peakHour = ops?.peakLoad?.bestHour?.hour || "N/A";

  return (
    <div className="space-y-8">
      {/* HEADER & TITLE BLOCK */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Insights
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
          Simple clinical and clinic operations summary
        </p>
      </div>

      {/* TOP KPI STRIP: "TODAY AT A GLANCE" */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 block">
          Today At A Glance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Follow-ups This Week",
              value: followUpsDue,
              hint: "Patients due for review",
              isDanger: false,
            },
            {
              label: "Patients Needing Attention",
              value: needsAttention,
              hint: "Overdue + repeat complaints",
              isDanger: true,
            },
            {
              label: "No-show Rate",
              value: noShowRate,
              hint: "Last 30 days",
              isDanger: false,
            },
            {
              label: "Prescription Coverage",
              value: prescriptionCoverage,
              hint: "Checkups with prescription",
              isDanger: false,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all hover:border-teal-500/40"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 block">
                {card.label}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                {card.value}
              </p>
              {card.isDanger ? (
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md inline-block">
                  {card.hint}
                </span>
              ) : (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ANALYTICS GRID: PATIENT FLOW & CLINIC RELIABILITY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Patient Flow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            Patient Flow
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
            How patients are moving through your clinic
          </p>

          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 block">
                New vs Returning (Last 30 Days)
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                New: {new30} • Returning: {returning30}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 block">
                Average Revisit Interval
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {revisitDays} days (Last 30 days)
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 block">
                Dormant Patients (90+ Days)
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {safeNum(flow?.dormantBuckets?.d90Plus)}
              </p>
            </div>
          </div>
        </div>

        {/* Clinic Reliability */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            Clinic Reliability
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
            Appointment operations health
          </p>

          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 block">
                On-Time Completion Rate
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {completionRate} (Last 30 days)
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 block">
                Peak Clinic Load
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {peakDay} at {peakHour}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 block">
                Most Common Cancellation Reason
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {cancellationMix[0]?.reason || "No major issue"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CLINICAL TRENDS & PRACTICE TOTALS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Health Concerns Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            Top Health Concerns
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
            Most frequent diagnoses and direction
          </p>

          <div className="space-y-2">
            {topDiagnosesMoM.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Not enough history yet</p>
            ) : (
              topDiagnosesMoM.map((item) => {
                const t = trendText(item.trend);
                const IconComponent = t.icon;
                const colorClass =
                  t.color === "rose"
                    ? "text-rose-800 dark:text-rose-300"
                    : t.color === "teal"
                    ? "text-teal-800 dark:text-teal-300"
                    : "text-slate-600 dark:text-slate-300";
                const bgColor =
                  t.color === "rose"
                    ? "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800"
                    : t.color === "teal"
                    ? "bg-teal-100 dark:bg-teal-950 border-teal-300 dark:border-teal-800"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700";

                return (
                  <div
                    key={item.disease}
                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl mb-2.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {item.disease}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                        {item.currentCount} this month
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`${bgColor} text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border`}>
                        <IconComponent size={12} style={{ stroke: "currentColor" }} />
                        <span className={colorClass}>{t.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Totals & Practice Highlights Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            Quick Totals
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
            Current totals in your practice
          </p>

          {/* Mini 4-Stat Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Patients", value: counts.patients || 0 },
              { label: "Appointments", value: counts.appointments || 0 },
              { label: "Checkups", value: counts.checkups || 0 },
              { label: "Prescriptions", value: counts.prescriptions || 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center"
              >
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {item.value}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Top Medicines */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2 block">
              Top Medicines Given
            </p>
            {topMedicines.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Not enough history yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topMedicines.slice(0, 3).map((item) => (
                  <span
                    key={`med-${item.medicine}`}
                    className="bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-lg text-xs font-bold inline-block mr-2 mb-2"
                  >
                    {item.medicine}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Most Common Diseases */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2 block">
              Most Common Diseases (All Time)
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              {topDiseases.slice(0, 2).map((d) => d.disease).join(" • ") || "Not enough history yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
