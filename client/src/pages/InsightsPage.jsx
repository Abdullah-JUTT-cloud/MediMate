import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import axiosInstance from "../api/axios";
import { CardSkeleton } from "../components/SkeletonLoaders";

// Design tokens for Organic/Natural system
const tokens = {
  colors: {
    background: "#FDFCF8",
    foreground: "#2C2C24",
    primary: "#5D7052",
    primaryForeground: "#F3F4F1",
    secondary: "#C18C5D",
    secondary_foreground: "#FFFFFF",
    accent: "#E6DCCD",
    accentForeground: "#4A4A40",
    muted: "#F0EBE5",
    mutedForeground: "#78786C",
    border: "#DED8CF",
    destructive: "#A85448",
  },
  shadows: {
    soft: "0 4px 20px -2px rgba(93, 112, 82, 0.15)",
    float: "0 10px 40px -10px rgba(193, 140, 93, 0.2)",
    deepHover: "0 6px 24px -4px rgba(93, 112, 82, 0.25)",
  },
};

const pct = (n) => `${Math.round(Number(n || 0))}%`;
const safeNum = (n) => Number(n || 0);

const trendText = (trend) => {
  if (trend === "up")
    return { icon: TrendingUp, label: "Increasing", color: tokens.colors.destructive };
  if (trend === "down")
    return { icon: TrendingDown, label: "Decreasing", color: tokens.colors.primary };
  return { icon: Minus, label: "Stable", color: tokens.colors.mutedForeground };
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
          <h2 className="text-3xl font-bold text-[#2C2C24]" style={{ fontFamily: "Fraunces" }}>
            Insights
          </h2>
          <p className="text-sm mt-2 text-[#78786C]">
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
  const dormant90 = safeNum(flow?.dormantBuckets?.d90Plus);
  const revisitDays = Number(flow?.revisitIntervalTrend?.currentAvgDays || 0).toFixed(1);

  const noShowRate = pct(ops?.noShowRate30d);
  const completionRate = pct(ops?.onTimeCompletionRate30d);
  const prescriptionCoverage = pct(continuity?.prescriptionCoverageRatio);

  const topCancelReason = cancellationMix[0]?.reason || "No major issue";
  const peakDay = ops?.peakLoad?.bestWeekday?.day || "N/A";
  const peakHour = ops?.peakLoad?.bestHour?.hour || "N/A";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#2C2C24] mb-2" style={{ fontFamily: "Fraunces", fontWeight: 700 }}>
          Insights
        </h1>
        <p className="text-base text-[#78786C]">
          Simple clinical and clinic operations summary
        </p>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-[#78786C]">
          Today At A Glance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: "Follow-ups This Week", 
              value: followUpsDue, 
              hint: "Patients due for review", 
              color: tokens.colors.primary,
              Icon: null
            },
            { 
              label: "Patients Needing Attention", 
              value: needsAttention, 
              hint: "Overdue + repeat complaints", 
              color: tokens.colors.destructive,
              Icon: null 
            },
            { 
              label: "No-show Rate", 
              value: noShowRate, 
              hint: "Last 30 days", 
              color: tokens.colors.secondary,
              Icon: null 
            },
            { 
              label: "Prescription Coverage", 
              value: prescriptionCoverage, 
              hint: "Checkups with prescription", 
              color: tokens.colors.primary,
              Icon: null 
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group"
              style={{
                background: tokens.colors.background,
                border: `1px solid ${tokens.colors.border}`,
                boxShadow: tokens.shadows.soft,
              }}
            >
              <p className="text-4xl md:text-5xl font-bold text-[#2C2C24] leading-none mb-3">
                {card.value}
              </p>
              <p className="text-sm font-semibold mb-1" style={{ color: card.color }}>
                {card.label}
              </p>
              <p className="text-xs text-[#78786C]">{card.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Patient Flow */}
        <div
          className="rounded-3xl p-6 transition-all duration-300 hover:shadow-lg"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <h3 className="text-lg md:text-xl font-bold text-[#2C2C24] mb-2" style={{ fontFamily: "Fraunces" }}>
            Patient Flow
          </h3>
          <p className="text-sm text-[#78786C] mb-4">
            How patients are moving through your clinic
          </p>

          <div className="space-y-3">
            <div
              className="rounded-2xl p-4"
              style={{
                background: `${tokens.colors.muted}20`,
                border: `1px solid ${tokens.colors.border}`,
              }}
            >
              <p className="text-xs text-[#78786C] font-medium">New vs Returning (Last 30 Days)</p>
              <p className="text-base font-semibold text-[#2C2C24] mt-1">
                New: {new30} • Returning: {returning30}
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: `${tokens.colors.muted}20`,
                border: `1px solid ${tokens.colors.border}`,
              }}
            >
              <p className="text-xs text-[#78786C] font-medium">Average revisit interval</p>
              <p className="text-base font-semibold text-[#2C2C24] mt-1">{revisitDays} days</p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: `${tokens.colors.muted}20`,
                border: `1px solid ${tokens.colors.border}`,
              }}
            >
              <p className="text-xs text-[#78786C] font-medium">Dormant patients (90+ days)</p>
              <p className="text-base font-semibold text-[#2C2C24] mt-1">{dormant90}</p>
            </div>
          </div>
        </div>

        {/* Clinic Reliability */}
        <div
          className="rounded-3xl p-6 transition-all duration-300 hover:shadow-lg"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <h3 className="text-lg md:text-xl font-bold text-[#2C2C24] mb-2" style={{ fontFamily: "Fraunces" }}>
            Clinic Reliability
          </h3>
          <p className="text-sm text-[#78786C] mb-4">
            Appointment operations health
          </p>

          <div className="space-y-3">
            <div
              className="rounded-2xl p-4"
              style={{
                background: `${tokens.colors.muted}20`,
                border: `1px solid ${tokens.colors.border}`,
              }}
            >
              <p className="text-xs text-[#78786C] font-medium">On-time completion rate</p>
              <p className="text-base font-semibold text-[#2C2C24] mt-1">
                {completionRate} (Last 30 days)
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: `${tokens.colors.muted}20`,
                border: `1px solid ${tokens.colors.border}`,
              }}
            >
              <p className="text-xs text-[#78786C] font-medium">Peak clinic load</p>
              <p className="text-base font-semibold text-[#2C2C24] mt-1">
                {peakDay} at {peakHour}
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: `${tokens.colors.muted}20`,
                border: `1px solid ${tokens.colors.border}`,
              }}
            >
              <p className="text-xs text-[#78786C] font-medium">Most common cancellation reason</p>
              <p className="text-base font-semibold text-[#2C2C24] mt-1">{topCancelReason}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Health Concerns & Quick Totals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Health Concerns */}
        <div
          className="rounded-3xl p-6 transition-all duration-300 hover:shadow-lg"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <h3 className="text-lg md:text-xl font-bold text-[#2C2C24] mb-2" style={{ fontFamily: "Fraunces" }}>
            Top Health Concerns
          </h3>
          <p className="text-sm text-[#78786C] mb-4">
            Most frequent diagnoses and direction
          </p>

          <div className="space-y-2">
            {topDiagnosesMoM.length === 0 ? (
              <p className="text-sm text-[#78786C]">Not enough history yet</p>
            ) : (
              topDiagnosesMoM.map((item) => {
                const t = trendText(item.trend);
                const IconComponent = t.icon;
                return (
                  <div
                    key={item.disease}
                    className="rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-md"
                    style={{
                      background: `${tokens.colors.muted}20`,
                      border: `1px solid ${tokens.colors.border}`,
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2C2C24]">{item.disease}</p>
                      <p className="text-xs text-[#78786C] mt-1">{item.currentCount} this month</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconComponent size={18} color={t.color} />
                      <p className="text-xs font-semibold" style={{ color: t.color }}>
                        {t.label}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Totals */}
        <div
          className="rounded-3xl p-6 transition-all duration-300 hover:shadow-lg"
          style={{
            background: tokens.colors.background,
            border: `1px solid ${tokens.colors.border}`,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <h3 className="text-lg md:text-xl font-bold text-[#2C2C24] mb-2" style={{ fontFamily: "Fraunces" }}>
            Quick Totals
          </h3>
          <p className="text-sm text-[#78786C] mb-4">
            Current totals in your practice
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Patients", value: counts.patients || 0 },
              { label: "Appointments", value: counts.appointments || 0 },
              { label: "Checkups", value: counts.checkups || 0 },
              { label: "Prescriptions", value: counts.prescriptions || 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-4 transition-all duration-300 hover:scale-105"
                style={{
                  background: `${tokens.colors.muted}20`,
                  border: `1px solid ${tokens.colors.border}`,
                }}
              >
                <p className="text-xs text-[#78786C] font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-[#2C2C24] mt-2">{item.value}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: `${tokens.colors.muted}20`,
              border: `1px solid ${tokens.colors.border}`,
            }}
          >
            <p className="text-xs text-[#78786C] font-medium mb-2">Top Medicines Given</p>
            {topMedicines.length === 0 ? (
              <p className="text-sm text-[#78786C]">Not enough history yet</p>
            ) : (
              <div className="space-y-2">
                {topMedicines.slice(0, 3).map((item) => (
                  <div key={`med-${item.medicine}`} className="flex justify-between text-sm">
                    <span className="text-[#2C2C24]">{item.medicine}</span>
                    <span className="font-semibold text-[#78786C]">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="rounded-2xl p-4 mt-3"
            style={{
              background: `${tokens.colors.muted}20`,
              border: `1px solid ${tokens.colors.border}`,
            }}
          >
            <p className="text-xs text-[#78786C] font-medium">Most common diseases (all time)</p>
            <p className="text-sm text-[#2C2C24] mt-2">
              {topDiseases.slice(0, 2).map((d) => d.disease).join(" • ") || "Not enough history yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
