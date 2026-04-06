export function RouteSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="h-12 w-1/3 animate-pulse rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/80" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`route-skeleton-card-${index}`}
              className="h-36 animate-pulse rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/80"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSectionSkeleton() {
  return (
    <div className="rounded-4xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 p-4 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] sm:p-6">
      <div className="mb-4 h-8 w-48 animate-pulse rounded-xl bg-[var(--color-bg-soft)]/70" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`dashboard-section-skeleton-${index}`}
            className="h-28 animate-pulse rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/55"
          />
        ))}
      </div>
    </div>
  );
}
