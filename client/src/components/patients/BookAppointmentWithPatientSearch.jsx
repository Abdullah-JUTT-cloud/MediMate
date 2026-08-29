import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";
import BookAppointmentModal from "./BookAppointmentModal";
import { PatientAvatar } from "./patientUi";
import { cls } from "./patientTokens";

/**
 * Two-step booking flow used by the Appointments page:
 *
 *   Step 1 — patient search. The Appointments page has no notion of a
 *            "current patient" the way the Patients page does, so the
 *            receptionist picks one here. Same debounced `/api/patients`
 *            search as the Patients page (limit=10) so the two surfaces
 *            stay consistent.
 *   Step 2 — BookAppointmentModal. Once a patient is picked, this is
 *            just a thin wrapper around the shared booking modal so
 *            the "Pay at consultation" toggle (and every other field)
 *            lives in ONE place. Any future feature added to the modal
 *            automatically reaches the Appointments page.
 *
 * `preSelectedPatient` skips step 1: when the Appointments page knows
 * the patient (e.g. the reschedule-from-cancelled flow), it can drop
 * the user directly into the shared modal. The patient may be a
 * partial object (no `locations` array) — in that case we hydrate the
 * full record via `/api/patients/:id` before handing off, matching the
 * behavior the old inline form had.
 *
 * Replaces the duplicate `BookAppointmentForm` that previously lived
 * inline in `AppointmentsPage.jsx`. That form drifted out of sync with
 * the Patient-page modal once already (it never got the toggle); the
 * whole point of this wrapper is to make a third drift impossible.
 */
export default function BookAppointmentWithPatientSearch({
  onClose,
  onBooked,
  preSelectedPatient = null,
}) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [hydratingPreSelected, setHydratingPreSelected] = useState(false);

  // If a pre-selected patient was provided, hydrate to a full record so
  // the modal's slot list (which reads from `patient.locations`) works.
  // Skip if the partial already has `locations` populated.
  useEffect(() => {
    if (!preSelectedPatient) {
      setSelectedPatient(null);
      return undefined;
    }
    if (Array.isArray(preSelectedPatient.locations)) {
      setSelectedPatient(preSelectedPatient);
      return undefined;
    }
    if (!preSelectedPatient._id) {
      // Best effort — pass through the partial as-is.
      setSelectedPatient(preSelectedPatient);
      return undefined;
    }
    let cancelled = false;
    setHydratingPreSelected(true);
    (async () => {
      try {
        const res = await axiosInstance.get(`/patients/${preSelectedPatient._id}`);
        if (!cancelled) setSelectedPatient(res.data.patient || preSelectedPatient);
      } catch {
        if (!cancelled) {
          setSelectedPatient(preSelectedPatient);
          toast.error("Failed to load full patient details for reschedule");
        }
      } finally {
        if (!cancelled) setHydratingPreSelected(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preSelectedPatient]);

  // Debounced search. Same 400ms window and `/api/patients?search=` call
  // the inline form used. Drop the search when a patient is selected so
  // the next open of this dialog starts clean.
  useEffect(() => {
    if (selectedPatient) return undefined;
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      setPatients([]);
      setSearchLoading(false);
      return undefined;
    }
    let cancelled = false;
    setSearchLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await axiosInstance.get("/patients", {
          params: { search: trimmed, limit: 10 },
        });
        if (!cancelled) setPatients(res.data.patients || []);
      } catch {
        if (!cancelled) toast.error("Failed to search patients");
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, selectedPatient]);

  // Step 2: a patient is picked — hand off to the shared modal.
  if (selectedPatient) {
    return (
      <BookAppointmentModal
        patient={selectedPatient}
        onClose={onClose}
        onBooked={(appointment) => {
          setSelectedPatient(null);
          setSearch("");
          onBooked?.(appointment);
        }}
      />
    );
  }

  // Pre-selected record still loading — keep the dialog open but show a
  // skeleton so the user doesn't see a blank flash before step 2 mounts.
  if (preSelectedPatient && hydratingPreSelected) {
    return (
      <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:py-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book Appointment"
          className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                Book Appointment
              </h2>
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                Loading patient details…
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking dialog"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-300 text-lg font-bold text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Loading patient schedule…
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Fetching complete location details to calculate slots
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: patient search.
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:py-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Book Appointment"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
              Book Appointment
            </h2>
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pick the patient for this booking, then choose a date and fee.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking dialog"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-300 text-lg font-bold text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:text-white"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <label className={cls.fieldLabel} htmlFor="appt-book-search">
              Select Patient
            </label>
            <div className="relative mb-3 mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                id="appt-book-search"
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedPatient(null);
                }}
                placeholder="Search patient by name or phone..."
                className={`${cls.searchInput} pl-10`}
                autoFocus
              />
            </div>

            {searchLoading && (
              <div className="space-y-2 py-4">
                <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            )}

            {!searchLoading && patients.length > 0 && (
              <div className="space-y-2">
                {patients.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p);
                      setSearch(p.name);
                      setPatients([]);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors"
                  >
                    <PatientAvatar name={p.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {p.age} yrs · {p.phone}
                      </p>
                    </div>
                    {p.locations?.map((loc, i) => (
                      <span
                        key={i}
                        className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                      >
                        {loc.locationType === "Clinic" ? "🏥" : "🏨"} {loc.locationName}
                      </span>
                    ))}
                  </button>
                ))}
              </div>
            )}

            {!searchLoading && search.trim().length >= 2 && patients.length === 0 && (
              <p className="py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                No patients match &quot;{search}&quot;.
              </p>
            )}

            {!searchLoading && search.trim().length < 2 && (
              <p className="py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                Type at least 2 characters to search.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
