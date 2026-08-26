import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import { RowSkeleton } from "../components/SkeletonLoaders";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirmDialog from "../hooks/useConfirmDialog";
import AddPatientForm from "../components/patients/AddPatientForm";
import BookAppointmentModal from "../components/patients/BookAppointmentModal";
import CheckupForm from "../components/patients/CheckupForm";
import {
  BLOOD_GROUPS,
  GENDERS,
  cls,
  formatShortDate,
  pluralize,
} from "../components/patients/patientTokens";
import {
  EmptyState,
  LocationTag,
  PatientAvatar,
} from "../components/patients/patientUi";
import PatientDetailPage from "./PatientDetailPage";

const TABLE_COLUMNS = ["Patient", "Age & Gender", "Phone", "Location", "Actions"];

export default function PatientsPage() {
  const { confirm, dialogProps } = useConfirmDialog();

  const [view, setView] = useState("list");
  const [patients, setPatients] = useState([]);
  const [patientsTotal, setPatientsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [bloodFilter, setBloodFilter] = useState("");
  const [activePatient, setActivePatient] = useState(null);
  const [editingCheckup, setEditingCheckup] = useState(null);
  const [bookingPatient, setBookingPatient] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (search.trim()) params.set("search", search.trim());
        const res = await axiosInstance.get(`/patients?${params.toString()}`);
        if (cancelled) return;
        setPatients(res.data.patients || []);
        setPatientsTotal(
          Number(res?.data?.pagination?.total || res?.data?.patients?.length || 0),
        );
      } catch {
        if (!cancelled) toast.error("Failed to load patients");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchPatients, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const hasFilters = Boolean(genderFilter || bloodFilter);

  const visiblePatients = useMemo(
    () =>
      patients.filter(
        (patient) =>
          (!genderFilter || patient.gender === genderFilter) &&
          (!bloodFilter || (patient.bloodGroup || "Unknown") === bloodFilter),
      ),
    [patients, genderFilter, bloodFilter],
  );

  const openPatient = async (patient) => {
    try {
      const res = await axiosInstance.get(`/patients/${patient._id}`);
      setActivePatient(res.data.patient);
      setView("detail");
    } catch {
      toast.error("Failed to load patient record");
    }
  };

  const handleDeletePatient = async (patientId, event) => {
    event.stopPropagation();
    const confirmed = await confirm({
      title: "Delete Patient",
      message: "This will remove the patient and all linked records.",
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/patients/${patientId}`);
      setPatients((prev) => prev.filter((patient) => patient._id !== patientId));
      setPatientsTotal((prev) => Math.max(0, prev - 1));
      toast.success("Patient deleted");
    } catch {
      toast.error("Failed to delete patient");
    }
  };

  const startBooking = (patient, event) => {
    event.stopPropagation();
    setBookingPatient(patient);
  };

  // ── Sub-views ─────────────────────────────────────────────────────────────

  if (view === "add") {
    return (
      <>
        <AddPatientForm
          onBack={() => setView("list")}
          onAdded={(patient) => {
            setPatients((prev) => [patient, ...prev]);
            setPatientsTotal((prev) => prev + 1);
            setView("list");
          }}
        />
        <ConfirmDialog {...dialogProps} />
      </>
    );
  }

  if (view === "detail" && activePatient) {
    return (
      <>
        <PatientDetailPage
          patient={activePatient}
          onBack={() => setView("list")}
          onNewCheckup={() => {
            setEditingCheckup(null);
            setView("checkup");
          }}
          onEditCheckup={(checkup) => {
            setEditingCheckup(checkup);
            setView("checkup");
          }}
          onPatientUpdated={(updated) => {
            setActivePatient(updated);
            setPatients((prev) =>
              prev.map((patient) => (patient._id === updated._id ? { ...patient, ...updated } : patient)),
            );
          }}
          refreshTrigger={refreshTrigger}
          confirmAction={confirm}
        />
        <ConfirmDialog {...dialogProps} />
      </>
    );
  }

  if (view === "checkup" && activePatient) {
    return (
      <>
        <CheckupForm
          patient={activePatient}
          existingCheckup={editingCheckup}
          onBack={() => setView("detail")}
          onSaved={() => {
            setRefreshTrigger((prev) => prev + 1);
            setView("detail");
          }}
        />
        <ConfirmDialog {...dialogProps} />
      </>
    );
  }

  // ── Directory ─────────────────────────────────────────────────────────────

  return (
    <>
      <div>
        {/* Header bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={cls.pageTitle}>Patients</h1>
            <p className={`${cls.pageSubtitle} mt-1`}>
              {pluralize(patientsTotal, "Total Registered Patient", "Total Registered Patients")}
              {(search.trim() || hasFilters) && (
                <span className="ml-2 font-bold text-teal-700 dark:text-teal-300">
                  · showing {visiblePatients.length}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("add")}
            className={`${cls.btnPrimary} w-fit px-4 py-2.5`}
          >
            + Register New Patient
          </button>
        </div>

        {/* Search & filter bar */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-400 dark:text-slate-500"
            >
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by patient name or phone…"
              aria-label="Search patients"
              className={`${cls.searchInput} pl-11`}
            />
          </div>

          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
            aria-label="Filter by gender"
            className={cls.searchInput}
          >
            <option value="">All Genders</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>

          <select
            value={bloodFilter}
            onChange={(event) => setBloodFilter(event.target.value)}
            aria-label="Filter by blood group"
            className={cls.searchInput}
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setGenderFilter("");
                setBloodFilter("");
              }}
              className="text-xs font-bold text-teal-700 transition-colors hover:underline dark:text-teal-300"
            >
              ✕ Clear filters
            </button>
          </div>
        )}

        {/* Patient table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : visiblePatients.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="👥"
                title={search.trim() || hasFilters ? "No matching patients" : "No patients yet"}
                description={
                  search.trim() || hasFilters
                    ? "Try a different name, phone number, or clear the filters."
                    : "Register your first patient to start building their visit history."
                }
                action={
                  search.trim() || hasFilters ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setGenderFilter("");
                        setBloodFilter("");
                      }}
                      className={cls.btnSecondary}
                    >
                      Reset search
                    </button>
                  ) : (
                    <button type="button" onClick={() => setView("add")} className={cls.btnPrimary}>
                      + Register New Patient
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden w-full sm:table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    {TABLE_COLUMNS.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className={`p-4 ${column === "Actions" ? "text-right" : "text-left"}`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visiblePatients.map((patient) => (
                    <tr
                      key={patient._id}
                      tabIndex={0}
                      onClick={() => openPatient(patient)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openPatient(patient);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/50 dark:focus:bg-slate-800/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <PatientAvatar name={patient.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-slate-900 dark:text-white">
                              {patient.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Registered {formatShortDate(patient.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {patient.age} yrs · {patient.gender}
                      </td>
                      <td className="p-4 text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">
                        {patient.phone}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {patient.locations?.length > 0 ? (
                            patient.locations.map((location, index) => (
                              <LocationTag
                                key={`${location.locationId}-${index}`}
                                location={location}
                              />
                            ))
                          ) : (
                            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openPatient(patient);
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:border-teal-500 hover:text-teal-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:text-teal-300"
                          >
                            View Record
                          </button>
                          <button
                            type="button"
                            onClick={(event) => startBooking(patient, event)}
                            className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-500"
                          >
                            📅 Book Slot
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleDeletePatient(patient._id, event)}
                            aria-label={`Delete ${patient.name}`}
                            className="rounded-lg px-2 py-2 text-sm text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
                {visiblePatients.map((patient) => (
                  <li key={patient._id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openPatient(patient)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openPatient(patient);
                        }
                      }}
                      className="cursor-pointer p-4 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/50 dark:focus:bg-slate-800/50"
                    >
                      <div className="flex items-start gap-3">
                        <PatientAvatar name={patient.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-bold text-slate-900 dark:text-white">
                            {patient.name}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {patient.age} yrs · {patient.gender} · {patient.phone}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {patient.locations?.map((location, index) => (
                              <LocationTag
                                key={`${location.locationId}-${index}`}
                                location={location}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPatient(patient);
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:border-teal-500 hover:text-teal-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:text-teal-300"
                        >
                          View Record
                        </button>
                        <button
                          type="button"
                          onClick={(event) => startBooking(patient, event)}
                          className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-500"
                        >
                          📅 Book Slot
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleDeletePatient(patient._id, event)}
                          aria-label={`Delete ${patient.name}`}
                          className="ml-auto rounded-lg px-2 py-2 text-sm text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {bookingPatient && (
        <BookAppointmentModal
          patient={bookingPatient}
          onClose={() => setBookingPatient(null)}
        />
      )}

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
