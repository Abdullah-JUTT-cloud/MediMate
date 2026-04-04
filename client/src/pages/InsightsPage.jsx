import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { CardSkeleton } from "../components/SkeletonLoaders";

const S = {
  card: { background: "var(--color-card)", border: "1px solid var(--color-border)" },
  section: { background: "var(--color-bg)", border: "1px solid var(--color-border)" },
};

const pct = (n) => `${Math.round(Number(n || 0))}%`;
const safeNum = (n) => Number(n || 0);

const trendText = (trend) => {
  if (trend === "up") return { icon: "↑", label: "Increasing", color: "#ef4444" };
  if (trend === "down") return { icon: "↓", label: "Decreasing", color: "#22c55e" };
  return { icon: "→", label: "Stable", color: "#94a3b8" };
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
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Insights</h2>
          <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">Simple clinical and clinic operations summary</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
  const dormant90 = safeNum(flow?.dormantBuckets?.d90Plus);
  const revisitDays = Number(flow?.revisitIntervalTrend?.currentAvgDays || 0).toFixed(1);

  const noShowRate = pct(ops?.noShowRate30d);
  const completionRate = pct(ops?.onTimeCompletionRate30d);
  const prescriptionCoverage = pct(continuity?.prescriptionCoverageRatio);

  const topCancelReason = cancellationMix[0]?.reason || "No major issue";
  const peakDay = ops?.peakLoad?.bestWeekday?.day || "N/A";
  const peakHour = ops?.peakLoad?.bestHour?.hour || "N/A";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Insights</h2>
        <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">Simple clinical and clinic operations summary</p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--color-text-secondary)]">Today At A Glance</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Follow-ups This Week", value: followUpsDue, hint: "Patients due for review", color: "#10B8A9", icon: "🗓" },
            { label: "Patients Needing Attention", value: needsAttention, hint: "Overdue + repeat complaints", color: "#ef4444", icon: "⚠️" },
            { label: "No-show Rate", value: noShowRate, hint: "Last 30 days", color: "#f59e0b", icon: "🚫" },
            { label: "Prescription Coverage", value: prescriptionCoverage, hint: "Checkups with prescription", color: "#38bdf8", icon: "📋" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-4" style={S.card}>
              <div className="text-lg mb-2">{card.icon}</div>
              <p className="text-2xl font-extrabold text-[var(--color-text-primary)] leading-none">{card.value}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: card.color }}>{card.label}</p>
              <p className="text-[11px] mt-1 text-[var(--color-text-secondary)]">{card.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">Patient Flow</h3>
          <p className="text-xs mb-3 text-[var(--color-text-secondary)]">How patients are moving through your clinic</p>

          <div className="space-y-2">
            <div className="rounded-xl p-3" style={S.section}>
              <p className="text-xs text-[var(--color-text-secondary)]">New vs Returning (Last 30 Days)</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">New: {new30} • Returning: {returning30}</p>
            </div>
            <div className="rounded-xl p-3" style={S.section}>
              <p className="text-xs text-[var(--color-text-secondary)]">Average revisit interval</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{revisitDays} days</p>
            </div>
            <div className="rounded-xl p-3" style={S.section}>
              <p className="text-xs text-[var(--color-text-secondary)]">Dormant patients (90+ days)</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{dormant90}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">Clinic Reliability</h3>
          <p className="text-xs mb-3 text-[var(--color-text-secondary)]">Appointment operations health</p>

          <div className="space-y-2">
            <div className="rounded-xl p-3" style={S.section}>
              <p className="text-xs text-[var(--color-text-secondary)]">On-time completion rate</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{completionRate} (Last 30 days)</p>
            </div>
            <div className="rounded-xl p-3" style={S.section}>
              <p className="text-xs text-[var(--color-text-secondary)]">Peak clinic load</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{peakDay} at {peakHour}</p>
            </div>
            <div className="rounded-xl p-3" style={S.section}>
              <p className="text-xs text-[var(--color-text-secondary)]">Most common cancellation reason</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{topCancelReason}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">Top Health Concerns</h3>
          <p className="text-xs mb-3 text-[var(--color-text-secondary)]">Most frequent diagnoses and direction</p>

          <div className="space-y-2">
            {topDiagnosesMoM.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Not enough history yet</p>
            ) : (
              topDiagnosesMoM.map((item) => {
                const t = trendText(item.trend);
                return (
                  <div key={item.disease} className="rounded-xl p-3 flex items-center justify-between" style={S.section}>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.disease}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">{item.currentCount} this month</p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: t.color }}>{t.icon} {t.label}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl p-4 sm:p-5" style={S.card}>
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">Quick Totals</h3>
          <p className="text-xs mb-3 text-[var(--color-text-secondary)]">Current totals in your practice</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: "Patients", value: counts.patients || 0 },
              { label: "Appointments", value: counts.appointments || 0 },
              { label: "Checkups", value: counts.checkups || 0 },
              { label: "Prescriptions", value: counts.prescriptions || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3" style={S.section}>
                <p className="text-[11px] text-[var(--color-text-secondary)]">{item.label}</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3" style={S.section}>
            <p className="text-xs text-[var(--color-text-secondary)] mb-1">Top Medicines Given</p>
            {topMedicines.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Not enough history yet</p>
            ) : (
              <div className="space-y-1.5">
                {topMedicines.slice(0, 3).map((item) => {
                  return (
                    <div key={`med-${item.medicine}`} className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-primary)]">{item.medicine}</span>
                      <span className="font-semibold text-[var(--color-text-secondary)]">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl p-3" style={S.section}>
            <p className="text-xs text-[var(--color-text-secondary)]">Most common diseases (all time)</p>
            <p className="text-sm text-[var(--color-text-primary)] mt-1">
              {topDiseases.slice(0, 2).map((d) => d.disease).join(" • ") || "Not enough history yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
