import { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";
import useAuthStore from "../../store/authStore";
import {
  BLOOD_GROUPS,
  GENDERS,
  buildDoctorLocations,
  cls,
} from "./patientTokens";
import { BackLink, Spinner, TagInput } from "./patientUi";

const BASIC_FIELDS = [
  { name: "name", label: "Full Name *", placeholder: "Ahmed Raza", type: "text" },
  { name: "age", label: "Age *", placeholder: "34", type: "number" },
  { name: "phone", label: "Phone *", placeholder: "03001234567", type: "tel" },
];

export default function AddPatientForm({ onBack, onAdded }) {
  const { doctor } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    bloodGroup: "Unknown",
    medicalHistory: [],
  });
  const [historyInput, setHistoryInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const allLocations = buildDoctorLocations(doctor);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const toggleLocation = (location) => {
    setSelectedLocations((prev) => {
      const exists = prev.some((entry) => entry.locationId === location.locationId);
      return exists
        ? prev.filter((entry) => entry.locationId !== location.locationId)
        : [...prev, location];
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.age) return toast.error("Age is required");
    if (!form.gender) return toast.error("Gender is required");
    if (!form.phone.trim()) return toast.error("Phone is required");
    if (selectedLocations.length === 0) {
      return toast.error("Select at least one location");
    }

    setIsSaving(true);
    try {
      const res = await axiosInstance.post("/patients", {
        ...form,
        locations: selectedLocations,
      });
      toast.success("Patient registered");
      onAdded(res.data.patient);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register patient");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink onClick={onBack} label="Back to Patients" />

      <div className={`${cls.card} mb-6 p-6`}>
        <h1 className={cls.pageTitle}>Register New Patient</h1>
        <p className={`${cls.pageSubtitle} mt-1`}>
          Demographics, contact details and medical history — everything the
          consultation record builds on.
        </p>
      </div>

      <div className={`${cls.card} space-y-6 p-6`}>
        <section>
          <h2 className={`${cls.cardTitle} mb-4`}>Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BASIC_FIELDS.map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label htmlFor={`patient-${name}`} className={cls.fieldLabel}>
                  {label}
                </label>
                <input
                  id={`patient-${name}`}
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={(event) => setField(name, event.target.value)}
                  placeholder={placeholder}
                  className={cls.input}
                />
              </div>
            ))}
            <div>
              <label htmlFor="patient-gender" className={cls.fieldLabel}>
                Gender *
              </label>
              <select
                id="patient-gender"
                value={form.gender}
                onChange={(event) => setField("gender", event.target.value)}
                className={cls.input}
              >
                <option value="">Select gender</option>
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="patient-blood-group" className={cls.fieldLabel}>
                Blood Group
              </label>
              <select
                id="patient-blood-group"
                value={form.bloodGroup}
                onChange={(event) => setField("bloodGroup", event.target.value)}
                className={cls.input}
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <TagInput
            label="Allergies & Medical History"
            value={historyInput}
            onChange={setHistoryInput}
            onAdd={() => {
              setField("medicalHistory", [...form.medicalHistory, historyInput.trim()]);
              setHistoryInput("");
            }}
            onRemove={(index) =>
              setField(
                "medicalHistory",
                form.medicalHistory.filter((_, idx) => idx !== index),
              )
            }
            items={form.medicalHistory}
            placeholder="e.g. Penicillin allergy, appendix surgery 2019"
          />
        </section>

        <section>
          <h2 className={`${cls.cardTitle} mb-1`}>Patient Location *</h2>
          <p className={`${cls.mutedText} mb-4`}>
            Where this patient is seen — this drives the slots you can book for them.
          </p>
          {allLocations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                No clinics or hospitals found
              </p>
              <p className={`${cls.mutedText} mt-1`}>
                Add a location in Settings first, then register the patient.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allLocations.map((location) => {
                const isSelected = selectedLocations.some(
                  (entry) => entry.locationId === location.locationId,
                );
                const isClinic = location.locationType === "Clinic";
                return (
                  <button
                    key={`${location.locationType}-${location.locationId}`}
                    type="button"
                    onClick={() => toggleLocation(location)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-950/40"
                        : "border-slate-300 bg-white hover:border-teal-500 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <span aria-hidden="true" className="text-lg">
                      {isClinic ? "🏥" : "🏨"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-bold ${
                          isSelected
                            ? "text-teal-800 dark:text-teal-200"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {location.locationName}
                      </span>
                      <span className={cls.mutedText}>{location.locationType}</span>
                    </span>
                    {isSelected && (
                      <span
                        aria-hidden="true"
                        className="text-sm font-bold text-teal-700 dark:text-teal-300"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className={`${cls.btnPrimary} w-full py-3.5`}
        >
          {isSaving ? <Spinner label="Registering…" /> : "Register Patient ✓"}
        </button>
      </div>
    </div>
  );
}
