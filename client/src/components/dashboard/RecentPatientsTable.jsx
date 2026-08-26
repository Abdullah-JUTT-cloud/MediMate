import { ArrowRight, Eye, Users } from "lucide-react";
import { RowSkeleton } from "../SkeletonLoaders";
import { getInitials } from "./dashboardHelpers";

const COLUMNS = ["Patient Name", "Age & Gender", "Phone Number", "Blood Group", "Action"];

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-soft)]/70 text-[var(--color-text-secondary)]">
      <Users className="h-5 w-5" aria-hidden="true" />
    </span>
    <p className="text-sm font-semibold text-[var(--color-text-primary)]">No patients yet</p>
    <p className="text-xs text-[var(--color-text-secondary)]">
      Patients you add will show up here.
    </p>
  </div>
);

const Avatar = ({ name }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
    {getInitials(name)}
  </span>
);

const BloodGroupBadge = ({ bloodGroup }) => (
  <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-danger)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-danger)]">
    {bloodGroup || "Unknown"}
  </span>
);

const ViewButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-all duration-200 hover:bg-[var(--color-primary)]/10"
  >
    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
    View
  </button>
);

export default function RecentPatientsTable({ patients, isLoading, onNavigate }) {
  const recentPatients = patients || [];

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Recent Patients</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            The patients you added most recently
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("patients")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)] transition-all duration-200 hover:bg-[var(--color-primary)]/10"
        >
          View All Patients
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : recentPatients.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Roomy table on tablet and desktop. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {COLUMNS.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] first:pl-0 last:pr-0 last:text-right"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="border-b border-[var(--color-border)]/60 transition-colors duration-200 last:border-0 hover:bg-[var(--color-bg-soft)]/50"
                  >
                    <td className="px-4 py-3.5 pl-0">
                      <span className="flex items-center gap-3">
                        <Avatar name={patient.name} />
                        <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {patient.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
                      {patient.age} yrs · {patient.gender}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
                      {patient.phone}
                    </td>
                    <td className="px-4 py-3.5">
                      <BloodGroupBadge bloodGroup={patient.bloodGroup} />
                    </td>
                    <td className="px-4 py-3.5 pr-0 text-right">
                      <ViewButton onClick={() => onNavigate("patients")} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compact cards on small screens. */}
          <div className="space-y-3 md:hidden">
            {recentPatients.map((patient) => (
              <div
                key={patient._id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={patient.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                      {patient.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {patient.age} yrs · {patient.gender}
                    </p>
                  </div>
                  <BloodGroupBadge bloodGroup={patient.bloodGroup} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">{patient.phone}</span>
                  <ViewButton onClick={() => onNavigate("patients")} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
