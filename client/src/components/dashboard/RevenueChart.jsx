import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { ChartSkeleton } from "../SkeletonLoaders";
import { formatPKR } from "./dashboardHelpers";

// Small, calm tooltip that matches the card styling.
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-sm font-bold text-[var(--color-primary)]">{formatPKR(payload[0].value)}</p>
    </div>
  );
};

// Keeps the Y axis short, e.g. 5000 -> "5k".
const formatTick = (value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : value);

export default function RevenueChart({ monthlyEarnings, yearlyEarnings, isLoading }) {
  const hasEarnings = Array.isArray(monthlyEarnings) && monthlyEarnings.length > 0;

  return (
    <section className="h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Monthly Revenue</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            What the clinic earned each month (PKR)
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
          This year: {formatPKR(yearlyEarnings)}
        </span>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : !hasEarnings ? (
        <div className="flex h-[230px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-6 text-center sm:h-[260px]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-soft)]/70 text-[var(--color-text-secondary)]">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">No earnings yet</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Your monthly earnings will appear here.
          </p>
        </div>
      ) : (
        <div className="h-[230px] sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyEarnings} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={formatTick}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "var(--color-primary)", stroke: "var(--color-card)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
