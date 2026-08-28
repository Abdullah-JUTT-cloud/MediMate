import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import { ProfileHeaderSkeleton, RowSkeleton } from "../components/SkeletonLoaders";
import BookAppointmentModal from "../components/patients/BookAppointmentModal";
import {
  BLOOD_GROUPS,
  GENDERS,
  buildDoctorLocations,
  cls,
  formatLongDate,
  matchFacility,
  pluralize,
  toLocationValue,
} from "../components/patients/patientTokens";
import {
  BackLink,
  ContentBlock,
  CountChip,
  DiseasePill,
  HistoryPill,
  InfoCard,
  LabTestPill,
  LatestBadge,
  LocationTag,
  MedicineTag,
  MetaDot,
  PaymentPill,
  PatientAvatar,
  Spinner,
  TagInput,
} from "../components/patients/patientUi";
import PrescriptionModal from "./PrescriptionModal";

const EDIT_FIELDS = [
  { name: "name", label: "Full Name", placeholder: "Ahmed Raza", type: "text" },
  { name: "age", label: "Age", placeholder: "34", type: "number" },
  { name: "phone", label: "Phone", placeholder: "03001234567", type: "tel" },
];

/**
 * The API returns the assigned facility both as `locations[0]` and (via the
 * model virtual) as `location`. Normalising here keeps the profile header and
 * the LOCATION column badge in sync whichever one the response carries.
 */
const withLocations = (record) => {
  if (!record || (Array.isArray(record.locations) && record.locations.length > 0)) return record;
  return record.location ? { ...record, locations: [record.location] } : record;
};

/** Seeds the Edit Profile form (including the LOCATION selector) from a record. */
const buildEditForm = (source) => ({
  name: source?.name || "",
  age: source?.age || "",
  gender: source?.gender || "Male",
  phone: source?.phone || "",
  bloodGroup: source?.bloodGroup || "Unknown",
  medicalHistory: source?.medicalHistory || [],
  location: toLocationValue(source?.locations?.[0]),
});

/**
 * Patient profile + full visit history.
 *
 * Accepts either a hydrated `patient` object (dashboard directory flow) or a
 * bare `patientId` (deep-link / route flow) and loads whatever is missing.
 */
export default function PatientDetailPage({
  patient: patientProp,
  patientId,
  onBack,
  onNewCheckup,
  onEditCheckup,
  onPatientUpdated,
  onBooked,
  refreshTrigger,
  confirmAction,
}) {
  const [patient, setPatient] = useState(patientProp || null);
  const [checkups, setCheckups] = useState([]);
  const [isLoading, setIsLoading] = useState(!patientProp);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [prescriptionCheckup, setPrescriptionCheckup] = useState(null);
  const [autoGeneratePrescription, setAutoGeneratePrescription] = useState(false);
  const { doctor } = useAuthStore();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(() => buildEditForm(patientProp));
  // Value the LOCATION dropdown was opened with, so we only push a facility
  // change to the API when the doctor actually picked a different one.
  const [initialLocationValue, setInitialLocationValue] = useState(() =>
    toLocationValue(patientProp?.locations?.[0]),
  );
  const [historyInput, setHistoryInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Every clinic + hospital configured on the logged-in doctor's profile.
  const doctorLocations = useMemo(() => buildDoctorLocations(doctor), [doctor]);

  /**
   * Options for the LOCATION dropdown: one per configured clinic/hospital, plus
   * the patient's current facility when it is missing from the doctor's
   * settings (so an edit never silently drops a historical assignment).
   */
  const locationOptions = useMemo(() => {
    const currentLocation = patient?.locations?.[0] || null;
    const options = doctorLocations.map((location) => ({
      value: toLocationValue(location),
      label: `[${location.locationType}] ${location.locationName}`,
      facility: {
        locationType: location.locationType,
        locationId: location.locationId,
        locationName: location.locationName,
      },
    }));

    if (currentLocation && !matchFacility(doctorLocations, currentLocation)) {
      options.push({
        value: toLocationValue(currentLocation),
        label: `[${currentLocation.locationType}] ${currentLocation.locationName} (removed from settings)`,
        facility: {
          locationType: currentLocation.locationType,
          locationId: currentLocation.locationId,
          locationName: currentLocation.locationName,
        },
      });
    }

    return options;
  }, [doctorLocations, patient]);

  const openEditProfile = () => {
    const nextForm = buildEditForm(patient);
    setEditForm(nextForm);
    setInitialLocationValue(nextForm.location);
    setHistoryInput("");
    setIsEditingProfile(true);
  };

  // Hydrate the record when only an id was supplied.
  useEffect(() => {
    if (patientProp) {
      setPatient(patientProp);
      setIsLoading(false);
      const nextForm = buildEditForm(patientProp);
      setEditForm(nextForm);
      setInitialLocationValue(nextForm.location);
      return;
    }
    if (!patientId) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/patients/${patientId}`);
        if (cancelled) return;
        setPatient(res.data.patient);
      } catch {
        if (!cancelled) toast.error("Failed to load patient");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [patientProp, patientId]);

  useEffect(() => {
    if (!patient?._id) return;
    let cancelled = false;

    const fetchCheckups = async () => {
      setIsHistoryLoading(true);
      try {
        const res = await axiosInstance.get(`/checkups/${patient._id}?limit=500`);
        if (!cancelled) setCheckups(res.data.checkups || []);
      } catch {
        if (!cancelled) toast.error("Failed to load checkups");
      } finally {
        if (!cancelled) setIsHistoryLoading(false);
      }
    };

    fetchCheckups();
    return () => {
      cancelled = true;
    };
  }, [patient?._id, refreshTrigger]);

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) return toast.error("Name is required");
    if (!editForm.age) return toast.error("Age is required");
    if (!editForm.phone.trim()) return toast.error("Phone is required");

    setIsSavingProfile(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        age: Number(editForm.age),
        gender: editForm.gender,
        phone: editForm.phone.trim(),
        bloodGroup: editForm.bloodGroup,
        medicalHistory: editForm.medicalHistory,
      };

      // Facility assignment from the LOCATION dropdown. Sent as the canonical
      // object (or null for "Unassigned"); only included when the selection
      // actually changed so patients attached to several facilities keep the
      // other ones intact.
      if (editForm.location !== initialLocationValue) {
        payload.location =
          locationOptions.find((option) => option.value === editForm.location)?.facility || null;
      }

      const res = await axiosInstance.put(`/patients/${patient._id}`, payload);
      const updatedPatient = withLocations(res.data.patient);
      setPatient(updatedPatient);
      onPatientUpdated?.(updatedPatient);
      toast.success("Patient profile updated");
      setIsEditingProfile(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update patient");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteCheckup = async (checkupId) => {
    const confirmed = await confirmAction({
      title: "Delete Checkup",
      message: "This checkup record will be permanently deleted.",
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/checkups/${checkupId}`);
      setCheckups((prev) => prev.filter((checkup) => checkup._id !== checkupId));
      toast.success("Checkup deleted");
    } catch {
      toast.error("Failed to delete checkup");
    }
  };

  if (isLoading || !patient) {
    return (
      <div className="mx-auto max-w-4xl">
        <ProfileHeaderSkeleton />
      </div>
    );
  }

  const history = Array.isArray(patient.medicalHistory) ? patient.medicalHistory : [];

  return (
    <div className="mx-auto max-w-4xl">
      {prescriptionCheckup && (
        <PrescriptionModal
          checkup={prescriptionCheckup}
          patient={patient}
          autoGenerateOnOpen={autoGeneratePrescription}
          onClose={() => {
            setPrescriptionCheckup(null);
            setAutoGeneratePrescription(false);
          }}
          onSaved={(url) => {
            setCheckups((prev) =>
              prev.map((checkup) =>
                checkup._id === prescriptionCheckup._id
                  ? { ...checkup, prescription: { ...checkup.prescription, pdfUrl: url } }
                  : checkup,
              ),
            );
          }}
        />
      )}

      {isBookingOpen && (
        <BookAppointmentModal
          patient={patient}
          onClose={() => setIsBookingOpen(false)}
          onBooked={(appointment) => onBooked?.(appointment)}
        />
      )}

      <BackLink onClick={onBack} label="Back to Patients" />

      {/* ── Profile overview ─────────────────────────────────────────────── */}
      {isEditingProfile ? (
        <div className={cls.profileCard}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
              <p className={`${cls.mutedText} mt-1`}>
                Update demographics, contact details, assigned facility and known allergies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Cancel
            </button>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EDIT_FIELDS.map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label htmlFor={`edit-${name}`} className={cls.fieldLabel}>
                  {label}
                </label>
                <input
                  id={`edit-${name}`}
                  type={type}
                  value={editForm[name]}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, [name]: event.target.value }))
                  }
                  placeholder={placeholder}
                  className={cls.input}
                />
              </div>
            ))}
            <div>
              <label htmlFor="edit-gender" className={cls.fieldLabel}>
                Gender
              </label>
              <select
                id="edit-gender"
                value={editForm.gender}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, gender: event.target.value }))
                }
                className={cls.input}
              >
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-blood-group" className={cls.fieldLabel}>
                Blood Group
              </label>
              <select
                id="edit-blood-group"
                value={editForm.bloodGroup}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, bloodGroup: event.target.value }))
                }
                className={cls.input}
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-location" className={cls.fieldLabel}>
                Location
              </label>
              <select
                id="edit-location"
                value={editForm.location}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, location: event.target.value }))
                }
                className={cls.input}
              >
                <option value="">Unassigned (—)</option>
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className={`${cls.mutedText} mt-1.5`}>
                {doctorLocations.length === 0
                  ? "No clinics or hospitals configured yet — add one under Settings → Locations."
                  : "The clinic or hospital this patient is assigned to."}
              </p>
            </div>
          </div>

          <div className="mb-5">
            <TagInput
              label="Allergies & Medical History"
              value={historyInput}
              onChange={setHistoryInput}
              onAdd={() => {
                setEditForm((prev) => ({
                  ...prev,
                  medicalHistory: [...prev.medicalHistory, historyInput.trim()],
                }));
                setHistoryInput("");
              }}
              onRemove={(index) =>
                setEditForm((prev) => ({
                  ...prev,
                  medicalHistory: prev.medicalHistory.filter((_, idx) => idx !== index),
                }))
              }
              items={editForm.medicalHistory}
              placeholder="e.g. Penicillin allergy"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className={cls.btnSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className={cls.btnPrimary}
            >
              {isSavingProfile ? <Spinner label="Saving…" /> : "Save Changes ✓"}
            </button>
          </div>
        </div>
      ) : (
        <div className={cls.profileCard}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <PatientAvatar name={patient.name} size="lg" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {patient.name}
                </h1>
                <p className={`${cls.metaText} mt-1.5 flex flex-wrap items-center gap-1.5`}>
                  <span>{patient.age} yrs</span>
                  <MetaDot />
                  <span>{patient.gender}</span>
                  <MetaDot />
                  <span>{patient.bloodGroup || "Unknown"}</span>
                </p>
                {patient.locations?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {patient.locations.map((location, index) => (
                      <LocationTag key={`${location.locationId}-${index}`} location={location} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className={cls.btnPrimary}
              >
                📅 Book Today&apos;s Appointment
              </button>
              <button
                type="button"
                onClick={openEditProfile}
                className={cls.btnSecondary}
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Phone" value={patient.phone} />
            <InfoCard label="Blood Group" value={patient.bloodGroup || "Unknown"} />
            <InfoCard label="Patient Since" value={formatLongDate(patient.createdAt)} />
            <InfoCard label="Allergies / Medical History">
              {history.length > 0 ? (
                <div className="flex flex-wrap">
                  {history.map((entry, index) => (
                    <HistoryPill key={`${entry}-${index}`} name={entry} />
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  None recorded
                </p>
              )}
            </InfoCard>
          </div>
        </div>
      )}

      {/* ── Checkup history stream ───────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Checkup History</h2>
        <div className="flex items-center gap-3">
          <CountChip count={checkups.length} singular="visit" />
          <button
            type="button"
            onClick={onNewCheckup}
            className={`${cls.btnSecondary} px-3 py-2 text-sm`}
          >
            + New Checkup
          </button>
        </div>
      </div>

      {isHistoryLoading ? (
        <div className="space-y-4">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : checkups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <div aria-hidden="true" className="text-4xl">
            🩺
          </div>
          <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">
            No checkups recorded yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-slate-600 dark:text-slate-300">
            Record the first consultation to start this patient&apos;s history.
          </p>
          <button
            type="button"
            onClick={onNewCheckup}
            className={`${cls.btnPrimary} mt-5`}
          >
            + New Checkup
          </button>
        </div>
      ) : (
        <div>
          {checkups.map((checkup, index) => {
            const prescription = checkup.prescription || {};
            const isLatest = index === 0;

            return (
              <article key={checkup._id} className={cls.visitCard}>
                {/* Card header */}
                <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {formatLongDate(checkup.createdAt)}
                    </h3>
                    {isLatest && <LatestBadge />}
                    {checkup.visitedFacility?.locationName && (
                      <LocationTag location={checkup.visitedFacility} />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {prescription.nextAppointment && (
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Follow-up: {formatLongDate(prescription.nextAppointment)}
                      </span>
                    )}
                    <PaymentPill payment={checkup.payment} />
                  </div>
                </header>

                {/* Prescription PDF drawer */}
                {prescription.pdfUrl ? (
                  <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/40">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-teal-900 dark:text-teal-100">
                        📄 Prescription PDF
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-teal-800 dark:text-teal-200">
                        {prescription.diagnosis || "Prescription"} ·{" "}
                        {pluralize(prescription.medicines?.length || 0, "medicine")}
                        {prescription.labTests?.length > 0 &&
                          ` · ${pluralize(prescription.labTests.length, "lab test")}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoGeneratePrescription(false);
                        setPrescriptionCheckup(checkup);
                      }}
                      className={`${cls.pdfLink} flex-shrink-0`}
                    >
                      View / Download PDF →
                    </button>
                  </div>
                ) : prescription.medicines?.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoGeneratePrescription(true);
                      setPrescriptionCheckup(checkup);
                    }}
                    className="mb-4 w-full rounded-xl border border-dashed border-teal-300 bg-teal-50/60 py-3 text-sm font-bold text-teal-700 transition-colors hover:border-teal-500 hover:bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300"
                  >
                    📄 Generate Prescription PDF
                  </button>
                ) : null}

                {/* Medicines */}
                {prescription.medicines?.length > 0 && (
                  <ContentBlock label="Medicines">
                    <div className="flex flex-wrap">
                      {prescription.medicines.map((medicine, medicineIndex) => (
                        <MedicineTag
                          key={`${medicine.name}-${medicineIndex}`}
                          medicine={medicine}
                        />
                      ))}
                    </div>
                  </ContentBlock>
                )}

                {/* Diseases / diagnosis */}
                {(checkup.diseases?.length > 0 || prescription.diagnosis) && (
                  <ContentBlock label="Diseases / Diagnosis">
                    <div className="flex flex-wrap">
                      {checkup.diseases?.map((disease, diseaseIndex) => (
                        <DiseasePill key={`${disease}-${diseaseIndex}`} name={disease} />
                      ))}
                      {prescription.diagnosis &&
                        !checkup.diseases?.includes(prescription.diagnosis) && (
                          <DiseasePill name={prescription.diagnosis} />
                        )}
                    </div>
                  </ContentBlock>
                )}

                {/* Lab tests */}
                {prescription.labTests?.length > 0 && (
                  <ContentBlock label="Lab Tests">
                    <div className="flex flex-wrap">
                      {prescription.labTests.map((test, testIndex) => (
                        <LabTestPill key={`${test}-${testIndex}`} name={test} />
                      ))}
                    </div>
                  </ContentBlock>
                )}

                {/* Patient advice */}
                {prescription.patientAdvice && (
                  <ContentBlock label="Patient Advice">
                    <p className={cls.bodyText}>{prescription.patientAdvice}</p>
                  </ContentBlock>
                )}

                {/* Doctor notes */}
                {checkup.notes && (
                  <ContentBlock label="Doctor Notes (Not Printed)">
                    <p className={cls.bodyText}>{checkup.notes}</p>
                  </ContentBlock>
                )}

                {/* Card footer actions */}
                <footer className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onEditCheckup(checkup)}
                    className={cls.btnSecondary}
                  >
                    ✏️ Edit Checkup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCheckup(checkup._id)}
                    className={cls.btnGhostDanger}
                  >
                    🗑️ Delete
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
