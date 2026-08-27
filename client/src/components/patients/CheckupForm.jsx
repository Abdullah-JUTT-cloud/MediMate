import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";
import useAuthStore from "../../store/authStore";
import PrescriptionModal from "../../pages/PrescriptionModal";
import {
  DAY_NAME_TO_INDEX,
  DAY_ORDER,
  DURATIONS,
  FREQUENCIES,
  buildDoctorLocations,
  cls,
  emptyMedicine,
  formatLongDate,
  getTodayDateInput,
  parseDateInputLocal,
} from "./patientTokens";
import {
  BackLink,
  MetaDot,
  PatientAvatar,
  Spinner,
  TagInput,
} from "./patientUi";

const MEDICINE_TEXT_FIELDS = [
  { label: "Name *", field: "name", placeholder: "e.g. Paracetamol" },
  { label: "Dosage *", field: "dosage", placeholder: "e.g. 500mg" },
];

/**
 * Records (or edits) a single consultation: diseases, prescription, lab tests,
 * advice and the doctor-only note. Generates the prescription PDF on demand.
 */
export default function CheckupForm({ patient, existingCheckup, onBack, onSaved }) {
  const { doctor } = useAuthStore();
  const isEdit = Boolean(existingCheckup);
  const minAppointmentDate = getTodayDateInput();

  const [diseases, setDiseases] = useState(existingCheckup?.diseases || []);
  const [diseaseInput, setDiseaseInput] = useState("");
  const [notes, setNotes] = useState(existingCheckup?.notes || "");
  const [diagnosis, setDiagnosis] = useState(
    existingCheckup?.prescription?.diagnosis || "",
  );
  const [nextAppointment, setNextAppointment] = useState(
    existingCheckup?.prescription?.nextAppointment
      ? new Date(existingCheckup.prescription.nextAppointment)
          .toISOString()
          .split("T")[0]
      : "",
  );
  const nextAppointmentDateRef = useRef(null);
  const [medicines, setMedicines] = useState(
    existingCheckup?.prescription?.medicines?.length
      ? existingCheckup.prescription.medicines
      : [emptyMedicine()],
  );
  const [labTests, setLabTests] = useState(existingCheckup?.prescription?.labTests || []);
  const [labInput, setLabInput] = useState("");
  const [patientAdvice, setPatientAdvice] = useState(
    existingCheckup?.prescription?.patientAdvice || "",
  );
  const [visitedFacility, setVisitedFacility] = useState(
    existingCheckup?.visitedFacility || null,
  );
  const [savedCheckupId, setSavedCheckupId] = useState(existingCheckup?._id || null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(
    existingCheckup?.prescription?.pdfUrl || "",
  );
  const [prescriptionCheckup, setPrescriptionCheckup] = useState(null);
  const [autoGeneratePrescription, setAutoGeneratePrescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const doctorLocations = buildDoctorLocations(doctor);

  const normalizeVisitedFacility = (facility) => {
    if (!facility) return null;
    const matched = doctorLocations.find((location) => {
      if (facility.locationId && location.locationId) {
        return (
          location.locationType === facility.locationType &&
          String(location.locationId) === String(facility.locationId)
        );
      }
      return (
        location.locationType === facility.locationType &&
        location.locationName === facility.locationName
      );
    });
    if (matched) return matched;
    return {
      ...facility,
      sessions: Array.isArray(facility.sessions) ? facility.sessions : [],
    };
  };

  const selectedFacility = normalizeVisitedFacility(visitedFacility);
  const availableSessionDays = DAY_ORDER.filter((day) =>
    (selectedFacility?.sessions || []).some((session) => session?.day === day),
  );
  const availableSessionDayIndexes = new Set(
    availableSessionDays.map((day) => DAY_NAME_TO_INDEX[day]),
  );
  const availableSessionDaysLabel = availableSessionDays.join(", ");

  const canGenerate =
    diagnosis.trim().length > 0 && medicines.some((medicine) => medicine.name.trim().length > 0);

  const isDateAllowedForSelectedFacility = (dateValue) => {
    if (!dateValue || !selectedFacility) return true;
    if (availableSessionDayIndexes.size === 0) return false;
    return availableSessionDayIndexes.has(parseDateInputLocal(dateValue).getDay());
  };

  const validateNextAppointment = () => {
    if (!nextAppointment) return true;
    if (nextAppointment < minAppointmentDate) {
      toast.error("Next appointment cannot be in the past");
      return false;
    }
    if (selectedFacility && availableSessionDayIndexes.size === 0) {
      toast.error(
        `No session days configured for ${selectedFacility.locationName}. Update location sessions in Settings first.`,
      );
      return false;
    }
    if (!isDateAllowedForSelectedFacility(nextAppointment)) {
      toast.error(
        `Doctor is not available at ${selectedFacility.locationName} on this day. Available days: ${availableSessionDaysLabel || "none"}`,
      );
      return false;
    }
    return true;
  };

  const handleNextAppointmentChange = (value) => {
    if (!value) {
      setNextAppointment("");
      return;
    }
    if (!selectedFacility) {
      toast.error("Select visit location first");
      return;
    }
    if (!isDateAllowedForSelectedFacility(value)) {
      toast.error(
        `Only session days are allowed for ${selectedFacility.locationName}: ${availableSessionDaysLabel || "none"}`,
      );
      return;
    }
    setNextAppointment(value);
  };

  // Keep the next-appointment date honest when the facility changes underneath it.
  useEffect(() => {
    if (!nextAppointment || !selectedFacility) return;
    if (isDateAllowedForSelectedFacility(nextAppointment)) return;
    setNextAppointment("");
    toast.error(
      `Next appointment date cleared because it is not available for ${selectedFacility.locationName}.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitedFacility, nextAppointment, selectedFacility, availableSessionDaysLabel]);

  const updateMedicine = (index, field, value) =>
    setMedicines((prev) =>
      prev.map((medicine, idx) => (idx === index ? { ...medicine, [field]: value } : medicine)),
    );

  const addMedicine = () => setMedicines((prev) => [...prev, emptyMedicine()]);

  const removeMedicine = (index) => {
    if (medicines.length === 1) {
      toast.error("At least one medicine is required");
      return;
    }
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const buildPayload = () => ({
    diseases,
    notes,
    visitedFacility: selectedFacility
      ? {
          locationType: selectedFacility.locationType,
          locationName: selectedFacility.locationName,
          locationAddress: selectedFacility.locationAddress,
        }
      : null,
    prescription: {
      diagnosis,
      nextAppointment: nextAppointment || undefined,
      medicines,
      labTests,
      patientAdvice,
      pdfUrl: currentPdfUrl,
    },
  });

  const medicinesComplete = !medicines.some(
    (medicine) =>
      !medicine.name.trim() ||
      !medicine.dosage.trim() ||
      !medicine.frequency ||
      !medicine.duration,
  );

  const handleGeneratePrescription = async () => {
    if (!canGenerate) return;
    if (!validateNextAppointment()) return;
    if (!medicinesComplete) {
      toast.error("Fill all required medicine fields");
      return;
    }

    setIsAutoSaving(true);
    try {
      let checkupId = savedCheckupId;
      if (!checkupId) {
        const res = await axiosInstance.post(`/checkups/${patient._id}`, buildPayload());
        checkupId = res.data.checkup._id;
        setSavedCheckupId(checkupId);
      } else {
        await axiosInstance.put(`/checkups/${checkupId}`, buildPayload());
      }

      setAutoGeneratePrescription(true);
      setPrescriptionCheckup({
        _id: checkupId,
        createdAt: existingCheckup?.createdAt || new Date().toISOString(),
        prescription: {
          diagnosis,
          nextAppointment: nextAppointment || undefined,
          medicines: [...medicines],
          labTests: [...labTests],
          patientAdvice,
          pdfUrl: currentPdfUrl,
        },
        notes,
        visitedFacility: selectedFacility
          ? {
              locationType: selectedFacility.locationType,
              locationName: selectedFacility.locationName,
              locationAddress: selectedFacility.locationAddress,
            }
          : null,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to auto-save checkup");
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      toast.error("Diagnosis is required");
      return;
    }
    if (!validateNextAppointment()) return;
    if (!medicinesComplete) {
      toast.error("Fill all required medicine fields");
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      const res = savedCheckupId
        ? await axiosInstance.put(`/checkups/${savedCheckupId}`, payload)
        : await axiosInstance.post(`/checkups/${patient._id}`, payload);
      toast.success(isEdit ? "Checkup updated" : "Checkup saved");
      onSaved(res.data.checkup);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save checkup");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
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
            setCurrentPdfUrl(url);
            setPrescriptionCheckup((prev) =>
              prev ? { ...prev, prescription: { ...prev.prescription, pdfUrl: url } } : null,
            );
          }}
        />
      )}

      <BackLink onClick={onBack} label={`Back to ${patient.name}`} />

      {/* Context strip */}
      <div className={`${cls.card} mb-6 flex items-center gap-4 p-5`}>
        <PatientAvatar name={patient.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900 dark:text-white">
            {patient.name}
          </p>
          <p className={`${cls.metaText} flex items-center gap-1.5`}>
            {patient.age} yrs <MetaDot /> {patient.gender}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-bold text-teal-700 dark:text-teal-300">
            {isEdit ? "Edit Checkup" : "New Checkup"}
          </p>
          <p className={cls.mutedText}>{formatLongDate(new Date())}</p>
        </div>
      </div>

      <div className="space-y-5">
        <section className={`${cls.card} p-6`}>
          <h2 className={`${cls.cardTitle} mb-4`}>This Visit</h2>
          <div className="space-y-5">
            <TagInput
              label="Diseases / Diagnosis This Visit"
              value={diseaseInput}
              onChange={setDiseaseInput}
              onAdd={() => {
                setDiseases((prev) => [...prev, diseaseInput.trim()]);
                setDiseaseInput("");
              }}
              onRemove={(index) => setDiseases((prev) => prev.filter((_, idx) => idx !== index))}
              items={diseases}
              placeholder="e.g. Hypertension"
            />
            <div>
              <label htmlFor="checkup-notes" className={cls.fieldLabel}>
                Visit Notes (Doctor Only)
              </label>
              <textarea
                id="checkup-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Internal notes — never printed on the prescription…"
                className={`${cls.input} resize-none`}
              />
            </div>
          </div>
        </section>

        <section className={`${cls.card} p-6`}>
          <h2 className={`${cls.cardTitle} mb-4`}>Prescription</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="checkup-diagnosis" className={cls.fieldLabel}>
                Diagnosis *
              </label>
              <input
                id="checkup-diagnosis"
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                placeholder="e.g. Hypertension Stage 2"
                className={cls.input}
              />
            </div>

            <div>
              <label htmlFor="checkup-facility" className={cls.fieldLabel}>
                Visit Location (printed on the prescription) *
              </label>
              <select
                id="checkup-facility"
                value={selectedFacility ? JSON.stringify(selectedFacility) : ""}
                onChange={(event) =>
                  setVisitedFacility(event.target.value ? JSON.parse(event.target.value) : null)
                }
                className={cls.input}
              >
                <option value="">Select clinic or hospital</option>
                {doctorLocations.map((location) => (
                  <option
                    key={`${location.locationType}-${location.locationId}`}
                    value={JSON.stringify(location)}
                  >
                    {location.locationType === "Clinic" ? "🏥" : "🏨"} {location.locationName}
                  </option>
                ))}
              </select>
              {selectedFacility && (
                <p className="mt-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                  Patient visited at{" "}
                  <span className="font-bold">
                    {selectedFacility.locationType === "Clinic" ? "🏥" : "🏨"}{" "}
                    {selectedFacility.locationName}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="checkup-next-appointment" className={cls.fieldLabel}>
                Next Appointment (optional)
              </label>
              <div className="relative">
                <input
                  id="checkup-next-appointment"
                  ref={nextAppointmentDateRef}
                  type="date"
                  value={nextAppointment}
                  onChange={(event) => handleNextAppointmentChange(event.target.value)}
                  min={minAppointmentDate}
                  disabled={!selectedFacility}
                  className={`${cls.input} [color-scheme:light] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-60`}
                />
                {/* Imperative trigger (Option B): guarantees a click on the
                    calendar glyph opens the native picker even when disabled
                    styling/z-index quirks would otherwise intercept the hit. */}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Open calendar"
                  disabled={!selectedFacility}
                  onClick={() => nextAppointmentDateRef.current?.showPicker?.()}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition-colors hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  <CalendarDays size={16} />
                </button>
              </div>
              <p className={`${cls.mutedText} mt-1.5`}>
                {!selectedFacility
                  ? "Select the visit location first to enable date selection."
                  : availableSessionDays.length
                    ? `Available days at ${selectedFacility.locationName}: ${availableSessionDaysLabel}`
                    : `No session days configured for ${selectedFacility.locationName}.`}
              </p>
            </div>

            <div>
              <span className={cls.fieldLabel}>Medicines *</span>
              <div className="space-y-3">
                {medicines.map((medicine, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
                        💊 Medicine {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="text-xs font-bold text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {MEDICINE_TEXT_FIELDS.map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label
                            htmlFor={`medicine-${index}-${field}`}
                            className={cls.fieldLabel}
                          >
                            {label}
                          </label>
                          <input
                            id={`medicine-${index}-${field}`}
                            value={medicine[field]}
                            onChange={(event) =>
                              updateMedicine(index, field, event.target.value)
                            }
                            placeholder={placeholder}
                            className={cls.input}
                          />
                        </div>
                      ))}
                      <div>
                        <label htmlFor={`medicine-${index}-frequency`} className={cls.fieldLabel}>
                          Frequency *
                        </label>
                        <select
                          id={`medicine-${index}-frequency`}
                          value={medicine.frequency}
                          onChange={(event) =>
                            updateMedicine(index, "frequency", event.target.value)
                          }
                          className={cls.input}
                        >
                          <option value="">Select</option>
                          {FREQUENCIES.map((frequency) => (
                            <option key={frequency} value={frequency}>
                              {frequency}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`medicine-${index}-duration`} className={cls.fieldLabel}>
                          Duration *
                        </label>
                        <select
                          id={`medicine-${index}-duration`}
                          value={medicine.duration}
                          onChange={(event) => updateMedicine(index, "duration", event.target.value)}
                          className={cls.input}
                        >
                          <option value="">Select</option>
                          {DURATIONS.map((duration) => (
                            <option key={duration} value={duration}>
                              {duration}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`medicine-${index}-instructions`}
                          className={cls.fieldLabel}
                        >
                          Instructions
                        </label>
                        <input
                          id={`medicine-${index}-instructions`}
                          value={medicine.instructions}
                          onChange={(event) =>
                            updateMedicine(index, "instructions", event.target.value)
                          }
                          placeholder="e.g. Take after meal"
                          className={cls.input}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMedicine}
                className="mt-3 w-full rounded-xl border border-dashed border-slate-400 py-3 text-sm font-bold text-teal-700 transition-colors hover:border-teal-500 hover:bg-teal-50 dark:border-slate-600 dark:text-teal-300 dark:hover:bg-teal-950/30"
              >
                + Add Another Medicine
              </button>
            </div>

            <TagInput
              label="Lab Tests (optional)"
              value={labInput}
              onChange={setLabInput}
              onAdd={() => {
                setLabTests((prev) => [...prev, labInput.trim()]);
                setLabInput("");
              }}
              onRemove={(index) => setLabTests((prev) => prev.filter((_, idx) => idx !== index))}
              items={labTests}
              placeholder="e.g. CBC, Blood Sugar"
            />

            <div>
              <label htmlFor="checkup-advice" className={cls.fieldLabel}>
                Patient Advice (printed on the prescription)
              </label>
              <textarea
                id="checkup-advice"
                rows={3}
                value={patientAdvice}
                onChange={(event) => setPatientAdvice(event.target.value)}
                placeholder="e.g. Walk 30 minutes daily, avoid oily food, stay hydrated"
                className={`${cls.input} resize-none`}
              />
            </div>

            <button
              type="button"
              onClick={handleGeneratePrescription}
              disabled={isAutoSaving || !canGenerate}
              className={`${cls.btnSecondary} w-full py-3`}
            >
              {isAutoSaving ? (
                <Spinner label="Saving…" />
              ) : currentPdfUrl ? (
                "📋 Regenerate Prescription PDF"
              ) : (
                "📋 Generate Prescription PDF"
              )}
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`${cls.btnPrimary} w-full py-3.5`}
        >
          {isSaving
            ? <Spinner label="Saving…" />
            : isEdit
              ? "Update Checkup ✓"
              : "Save Checkup ✓"}
        </button>
      </div>
    </div>
  );
}
