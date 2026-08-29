import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  Phone,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

// WhatsApp glyph (brand icon isn't shipped by lucide-react) — inherits currentColor.
const WhatsAppIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className="h-4 w-4"
    {...props}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.173.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04.999-1.04 2.437 0 1.438 1.03 2.828 1.175 3.024.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.36-.214-3.741.982.998-3.648-.243-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.358.101 11.94c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.88 11.88 0 0 0 5.74 1.462h.004c6.582 0 11.94-5.358 11.943-11.94 0-3.195-1.245-6.2-3.472-8.359" />
  </svg>
);

// Common quick disease suggestions
const QUICK_DISEASES = [
  "Hypertension",
  "Seasonal Flu / Fever",
  "Type 2 Diabetes",
  "Acute Bronchitis",
  "Gastritis / GERD",
  "Migraine",
];

// Common quick lab tests
const QUICK_LAB_TESTS = [
  "CBC",
  "LFT (Liver Function Test)",
  "Renal / Serum Creatinine",
  "Lipid Profile",
  "Urine R/E",
  "Fasting Blood Sugar (FBS)",
  "HbA1c",
  "Chest X-Ray",
];

// Frequency presets
const FREQUENCY_PRESETS = ["1-0-1", "1-1-1", "1-0-0", "0-0-1", "2x Daily"];

// Duration presets
const DURATION_PRESETS = ["3 Days", "5 Days", "7 Days", "14 Days", "1 Month"];

const formatVisitDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

// Clean, modern input styling with light theme
const FIELD_INPUT_CLASS =
  "w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none placeholder:text-slate-400 font-normal transition-all";

const FIELD_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 block";

// Accordion component for patient history
const HistoryAccordion = ({ children, title, date, visitNumber, isOpen, onToggle }) => {
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-4 mb-3 shadow-sm last:mb-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-1 -m-1 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Calendar size={12} className="text-teal-600" />
            {date}
          </span>
          <span className="text-sm font-semibold text-slate-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Visit #{visitNumber}
          </span>
          {isOpen ? (
            <ChevronUp size={18} className="text-slate-500" />
          ) : (
            <ChevronDown size={18} className="text-slate-500" />
          )}
        </div>
      </button>
      {isOpen && <div className="mt-4 pt-4 border-t border-slate-100">{children}</div>}
    </article>
  );
};

// Medicine row component
const MedicineRow = ({
  index,
  medicine,
  onUpdate,
  onRemove,
}) => {
  const [activeFrequency, setActiveFrequency] = useState(medicine.frequency || "");
  const [activeDuration, setActiveDuration] = useState(medicine.duration || "");

  const handleFrequencySelect = (preset) => {
    setActiveFrequency(preset);
    onUpdate(index, "frequency", preset);
  };

  const handleDurationSelect = (preset) => {
    setActiveDuration(preset);
    onUpdate(index, "duration", preset);
  };

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-lg mb-3 last:mb-0 shadow-sm">
      {/* Row header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Medicine #{index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Remove medicine #${index + 1}`}
          className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Medicine Name & Dosage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="md:col-span-2">
          <label className={FIELD_LABEL_CLASS}>
            Medicine Name & Formulation
          </label>
          <input
            type="text"
            value={medicine.name}
            onChange={(e) => onUpdate(index, "name", e.target.value)}
            placeholder="e.g. Augmentin, Brufen, Panadol Extra"
            className={FIELD_INPUT_CLASS}
          />
        </div>
        <div className="md:col-span-1">
          <label className={FIELD_LABEL_CLASS}>
            Dosage
          </label>
          <input
            type="text"
            value={medicine.dosage}
            onChange={(e) => onUpdate(index, "dosage", e.target.value)}
            placeholder="e.g. 500mg, 1 tablet"
            className={FIELD_INPUT_CLASS}
          />
        </div>
      </div>

      {/* Frequency & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            Frequency
          </label>
          <input
            type="text"
            value={medicine.frequency}
            onChange={(e) => {
              onUpdate(index, "frequency", e.target.value);
              setActiveFrequency(e.target.value);
            }}
            placeholder="e.g. 1-0-1, 2x Daily"
            className={FIELD_INPUT_CLASS}
          />
          {/* Frequency preset buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {FREQUENCY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleFrequencySelect(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeFrequency === preset
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={FIELD_LABEL_CLASS}>
            Duration
          </label>
          <input
            type="text"
            value={medicine.duration}
            onChange={(e) => {
              onUpdate(index, "duration", e.target.value);
              setActiveDuration(e.target.value);
            }}
            placeholder="e.g. 5 Days, 1 Week"
            className={FIELD_INPUT_CLASS}
          />
          {/* Duration preset buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleDurationSelect(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeDuration === preset
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className={FIELD_LABEL_CLASS}>
          Instructions
        </label>
        <input
          type="text"
          value={medicine.instructions}
          onChange={(e) => onUpdate(index, "instructions", e.target.value)}
          placeholder="e.g. Take after meals with plenty of water"
          className={FIELD_INPUT_CLASS}
        />
      </div>
    </div>
  );
};

// Quick suggestion chip component
const QuickSuggestionChip = ({ item, onClick, selectedItems }) => {
  const isSelected = selectedItems.split(",").some((i) => i.trim() === item);
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isSelected
          ? "bg-teal-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
      }`}
    >
      + {item}
    </button>
  );
};

export default function ConsultationWorkspaceRedesigned({
  isOpen,
  onClose,
  appointment,
  history = [],
  onCheckupComplete,
}) {
  // Form States
  const [diseases, setDiseases] = useState("");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [labTests, setLabTests] = useState("");
  const [patientAdvice, setPatientAdvice] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});
  // "Pay at consultation" appointments: the fee was deferred, so the doctor
  // enters the TOTAL final fee (plus optional discount) right here. The
  // remaining balance after the online advance is computed automatically.
  const [deferredFee, setDeferredFee] = useState("");
  const [deferredDiscount, setDeferredDiscount] = useState("0");
  // Draft auto-save: snapshot of the form fields captured on open (or after
  // the reset-on-open effect runs). Used to diff against current values so
  // the close prompt only appears when something actually changed.
  // The ref is a plain JS object — a snapshot, not reactive — so writes
  // here don't trigger a re-render.
  const baselineSnapshotRef = useRef(null);
  // True while the "Save changes / Discard changes" confirmation is open.
  // When the dialog is open, Escape/overlay click must NOT bypass the
  // prompt and close the panel — that would be data loss.
  const [closePromptOpen, setClosePromptOpen] = useState(false);
  // Saving-during-discard state (Save changes path on the close prompt).
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Reset form when appointment changes or drawer opens.
  // (Deps are intentionally [isOpen, appointment?._id]: prefill reads the
  // stored fee once at open — tracking the fee fields would wipe the
  // doctor's in-progress input if the queue re-fetches the appointment.)
  //
  // Draft resume: if a draft snapshot exists on the appointment, populate
  // every form field from it so the doctor picks up exactly where they
  // left off. If there is no draft, fall back to today's blank defaults.
  //
  // After computing the loaded values, capture them as the "baseline" for
  // the close-prompt dirty check — same snapshot, written into the ref
  // synchronously here so the very next render can diff against it (the
  // setState calls below are async and would otherwise race the diff).
  useEffect(() => {
    if (isOpen) {
      const draft = appointment?.draftCheckup;
      const hasDraft =
        draft && typeof draft === "object" && !Array.isArray(draft);

      const fromDraftString = (value, fallback = "") =>
        typeof value === "string" ? value : fallback;

      // Always start from a clean default so a partial/broken draft cannot
      // leave stale values in the form.
      const nextDiseases = fromDraftString(hasDraft ? draft.diseases : "");
      const nextNotes = fromDraftString(hasDraft ? draft.notes : "");
      const nextDiagnosis = fromDraftString(hasDraft ? draft.diagnosis : "");
      const nextLabTests = fromDraftString(hasDraft ? draft.labTests : "");
      const nextPatientAdvice = fromDraftString(
        hasDraft ? draft.patientAdvice : "",
      );
      const nextNextAppointment = fromDraftString(
        hasDraft ? draft.nextAppointment : "",
      );

      // Medicines: the draft keeps the same row shape (incl. the empty
      // placeholder row), so restore verbatim. If the draft is missing or
      // malformed, start with a single blank row — same as before.
      let nextMedicines;
      if (
        hasDraft &&
        Array.isArray(draft.medicines) &&
        draft.medicines.length > 0 &&
        draft.medicines.every(
          (m) =>
            m &&
            typeof m === "object" &&
            "name" in m &&
            "dosage" in m &&
            "frequency" in m &&
            "duration" in m,
        )
      ) {
        nextMedicines = draft.medicines.map((m) => ({
          name: typeof m.name === "string" ? m.name : "",
          dosage: typeof m.dosage === "string" ? m.dosage : "",
          frequency: typeof m.frequency === "string" ? m.frequency : "",
          duration: typeof m.duration === "string" ? m.duration : "",
          instructions: typeof m.instructions === "string" ? m.instructions : "",
        }));
      } else {
        nextMedicines = [
          { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
        ];
      }

      // Deferred fee: pre-fill from the draft when present (and the visit
      // is a deferred-fee visit) — otherwise fall back to whatever was
      // stored on the appointment from booking. Never a zero — the fee
      // input is required for deferred visits.
      let nextDeferredFee;
      if (hasDraft && typeof draft.deferredFee === "string") {
        nextDeferredFee = draft.deferredFee;
      } else {
        const storedFee = Number(appointment?.standardFee || 0);
        nextDeferredFee = storedFee > 0 ? String(storedFee) : "";
      }
      let nextDeferredDiscount;
      if (hasDraft && typeof draft.deferredDiscount === "string") {
        nextDeferredDiscount = draft.deferredDiscount;
      } else {
        nextDeferredDiscount =
          Number(appointment?.discountAmount || 0) > 0
            ? String(appointment?.discountAmount)
            : "0";
      }

      setDiseases(nextDiseases);
      setNotes(nextNotes);
      setDiagnosis(nextDiagnosis);
      setLabTests(nextLabTests);
      setPatientAdvice(nextPatientAdvice);
      setNextAppointment(nextNextAppointment);
      setMedicines(nextMedicines);
      setDeferredFee(nextDeferredFee);
      setDeferredDiscount(nextDeferredDiscount);
      setFormErrors({});
      setExpandedHistory({});
      setClosePromptOpen(false);

      // Capture the baseline synchronously from the SAME values we just
      // queued into state. The ref must reflect the loaded view, not the
      // pre-load (always-blank) state, so the first dirty-check is
      // immediately accurate.
      baselineSnapshotRef.current = {
        diseases: nextDiseases,
        notes: nextNotes,
        diagnosis: nextDiagnosis,
        medicines: JSON.parse(JSON.stringify(nextMedicines)),
        labTests: nextLabTests,
        patientAdvice: nextPatientAdvice,
        nextAppointment: nextNextAppointment,
        deferredFee: nextDeferredFee,
        deferredDiscount: nextDeferredDiscount,
      };
    } else {
      baselineSnapshotRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointment?._id]);

  // === Draft auto-save: close-prompt dirty check + save/discard handlers ===
  // Defined here (BEFORE the body-scroll useEffect below) so the
  // listener can read the latest `requestClose` from the ref without
  // hitting a temporal-dead-zone reference. The body-scroll effect
  // depends on `requestCloseRef.current` (a stable ref) instead of
  // `requestClose` (a fresh function each render), so it only re-binds
  // when `isOpen` / `onClose` change — not on every state update.

  // Captures the current form state into a plain JS object so the
  // baseline ref (also a plain JS object) can be diffed against it.
  // `JSON.parse(JSON.stringify(...))` on medicines is intentional — the
  // baseline is a deep copy taken at load time, so a later reference
  // comparison would always say "dirty" for an array that was only
  // reseated (not edited).
  const buildCurrentSnapshot = () => ({
    diseases,
    notes,
    diagnosis,
    medicines: JSON.parse(JSON.stringify(medicines)),
    labTests,
    patientAdvice,
    nextAppointment,
    deferredFee,
    deferredDiscount,
  });

  // Diff the current form state against the baseline. Returns true if any
  // field changed. Medicines are compared row-by-row (after stringify
  // normalization) so re-ordering the array would NOT mark dirty — only
  // a real edit would.
  const isDirty = () => {
    const baseline = baselineSnapshotRef.current;
    if (!baseline) return false;
    const current = buildCurrentSnapshot();
    const keys = [
      "diseases",
      "notes",
      "diagnosis",
      "labTests",
      "patientAdvice",
      "nextAppointment",
      "deferredFee",
      "deferredDiscount",
    ];
    for (const key of keys) {
      if (current[key] !== baseline[key]) return true;
    }
    if (current.medicines.length !== baseline.medicines.length) return true;
    for (let i = 0; i < current.medicines.length; i += 1) {
      const a = current.medicines[i];
      const b = baseline.medicines[i];
      if (
        a.name !== b.name ||
        a.dosage !== b.dosage ||
        a.frequency !== b.frequency ||
        a.duration !== b.duration ||
        a.instructions !== b.instructions
      ) {
        return true;
      }
    }
    return false;
  };

  // Persist the current form as a draft snapshot on the appointment, then
  // close. Used by the "Save changes" branch of the close prompt. Errors
  // are surfaced as a toast — the dialog stays open so the doctor can
  // retry or fall back to "Discard changes".
  const persistDraftAndClose = async () => {
    if (!appointment?._id) {
      onClose?.();
      return;
    }
    setIsSavingDraft(true);
    try {
      const snapshot = buildCurrentSnapshot();
      await axiosInstance.put(`/appointments/${appointment._id}`, {
        draftCheckup: {
          diseases: snapshot.diseases,
          notes: snapshot.notes,
          diagnosis: snapshot.diagnosis,
          medicines: snapshot.medicines,
          labTests: snapshot.labTests,
          patientAdvice: snapshot.patientAdvice,
          nextAppointment: snapshot.nextAppointment,
          deferredFee: snapshot.deferredFee,
          deferredDiscount: snapshot.deferredDiscount,
        },
        draftSavedAt: new Date().toISOString(),
      });
      toast.success("Draft saved.");
      // The ref is intentionally NOT updated: the panel is closing, and
      // the next open will reload the freshly-saved draft from the
      // server (which is the source of truth).
      setClosePromptOpen(false);
      onClose?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save draft. Please try again.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Discard path: just close. Matches today's "Cancel" behavior exactly
  // when the doctor has nothing to lose. The dirty state is intentionally
  // not re-baselined because the panel is going away.
  const discardAndClose = () => {
    setClosePromptOpen(false);
    onClose?.();
  };

  // Centralized close handler — replaces the previous onClose on every
  // close affordance (X button, backdrop click, Cancel button, Escape).
  // When the form is dirty, it opens the save/discard dialog instead of
  // closing. The `force` option is used by the consultation-complete
  // success path, which has already persisted everything and must close
  // immediately without re-prompting.
  //
  // A ref mirrors the latest version of this function so the body-scroll
  // Escape listener (which is bound ONCE per `[isOpen, onClose]` change
  // for performance) can always call the current closure.
  const requestCloseRef = useRef(null);
  const requestClose = (options = {}) => {
    if (requestCloseRef.current) requestCloseRef.current(options);
  };
  requestCloseRef.current = (options = {}) => {
    if (options.force) {
      setClosePromptOpen(false);
      onClose?.();
      return;
    }
    if (isDirty()) {
      setClosePromptOpen(true);
      return;
    }
    setClosePromptOpen(false);
    onClose?.();
  };

  // Lock body scroll when open and handle Escape key. Escape routes
  // through `requestCloseRef.current` (a stable ref that always points
  // at the latest `requestClose`) so unsaved changes prompt instead of
  // closing silently — same as the X button and the Cancel button.
  // While the close-prompt dialog is open, Escape is swallowed (the
  // dialog's own X / overlay click is the "cancel the prompt" path).
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (closePromptOpenRef.current) return;
        requestCloseRef.current?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Mirror the closePromptOpen state into a ref so the body-scroll effect's
  // Escape handler can check the current value without re-binding the
  // listener on every prompt open/close (which would be a no-op churn).
  const closePromptOpenRef = useRef(false);
  useEffect(() => {
    closePromptOpenRef.current = closePromptOpen;
  }, [closePromptOpen]);

  // Upfront consultation fees are locked at check-in/booking — EXCEPT when
  // the fee was deferred ("pay at consultation"), in which case the editable
  // section below replaces this read-only derivation.
  const originalFee = useMemo(() => {
    const fee = Number(
      appointment?.originalFee ??
        appointment?.consultationFee ??
        appointment?.netAmount ??
        0,
    );
    return Number.isFinite(fee) ? fee : 0;
  }, [appointment]);

  const discountAmount = useMemo(() => {
    const d = Number(appointment?.discountAmount ?? appointment?.discount ?? 0);
    return Math.max(0, Math.min(d, originalFee));
  }, [appointment, originalFee]);

  const netConsultationFee = useMemo(() => {
    const net = Number(appointment?.netAmount ?? (originalFee - discountAmount));
    return Number.isFinite(net) ? Math.max(0, net) : Math.max(0, originalFee - discountAmount);
  }, [appointment, originalFee, discountAmount]);

  // ── Deferred ("pay at consultation") fee entry ────────────────────────────
  // The doctor enters the TOTAL final fee (e.g. 1000) plus an optional
  // discount. For online bookings the advance was already collected, so the
  // amount collected now is:
  //   netAmount = max(0, standardFee - discountAmount - advanceAmountPaid)
  // (advanceAmountPaid is 0 for plain walk-ins → standardFee - discountAmount)
  const isDeferredFee = appointment?.payAtConsultation === true;
  const advanceAmountPaid = Number(appointment?.advanceAmountPaid || 0);
  const deferredFeeNum = Number(deferredFee);
  const deferredDiscountNum = Number(deferredDiscount || 0);
  const deferredNet =
    Number.isFinite(deferredFeeNum) && Number.isFinite(deferredDiscountNum)
      ? Math.max(0, deferredFeeNum - deferredDiscountNum - advanceAmountPaid)
      : 0;

  // Helper to add preset to comma-separated field
  const appendQuickItem = (setter, currentVal, item) => {
    const list = currentVal
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(item)) {
      list.push(item);
      setter(list.join(", "));
    }
  };

  // Medicine helpers
  const addMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) {
      setMedicines([
        { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
      ]);
      return;
    }
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Quick preset for follow-up date
  const setQuickFollowUp = (daysToAdd) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    setNextAppointment(`${yyyy}-${mm}-${dd}`);
  };

  // Toggle history accordion
  const toggleHistory = (index) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!diagnosis.trim()) {
      errors.diagnosis = "Diagnosis is required";
    }

    const invalidMeds = medicines.some(
      (m) =>
        !m.name.trim() ||
        !m.dosage.trim() ||
        !m.frequency.trim() ||
        !m.duration.trim(),
    );
    if (invalidMeds) {
      errors.medicines =
        "Please fill in Name, Dosage, Frequency, and Duration for each medicine row";
    }

    if (nextAppointment) {
      const selected = new Date(nextAppointment);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.nextAppointment = "Next appointment date cannot be in the past";
      }
    }

    // Deferred fee: required before checkout for pay-at-consultation visits.
    if (isDeferredFee) {
      if (deferredFee === "" || !Number.isFinite(deferredFeeNum) || deferredFeeNum < 0) {
        errors.deferredFee = "Enter the consultation fee";
      }
      if (!Number.isFinite(deferredDiscountNum) || deferredDiscountNum < 0) {
        errors.deferredDiscount = "Enter a valid discount amount";
      } else if (
        deferredFee !== "" &&
        Number.isFinite(deferredFeeNum) &&
        deferredDiscountNum > deferredFeeNum
      ) {
        errors.deferredDiscount = "Discount cannot be larger than the consultation fee";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCompleteConsultation = async () => {
    if (!validateForm()) {
      if (!diagnosis.trim()) {
        toast.error("Diagnosis is required before saving prescription");
      } else if (
        isDeferredFee &&
        (deferredFee === "" || !Number.isFinite(deferredFeeNum) || deferredFeeNum < 0)
      ) {
        toast.error("Enter the consultation fee before saving the checkup");
      } else if (
        isDeferredFee &&
        (!Number.isFinite(deferredDiscountNum) || deferredDiscountNum < 0)
      ) {
        toast.error("Enter a valid discount amount");
      } else if (
        isDeferredFee &&
        deferredDiscountNum > deferredFeeNum
      ) {
        toast.error("Discount cannot be larger than the consultation fee");
      } else {
        toast.error(
          "Please fill in all required fields (Name, Dosage, Frequency, Duration) for every prescribed medicine",
        );
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const diseaseList = diseases
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const testList = labTests
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        appointmentId: appointment._id,
        patientId: appointment.patient?._id,
        diseases: diseaseList.length > 0 ? diseaseList : [diagnosis.trim()],
        notes: notes.trim(),
        prescription: {
          diagnosis: diagnosis.trim(),
          medicines: medicines.map((m) => ({
            name: m.name.trim(),
            dosage: m.dosage.trim(),
            frequency: m.frequency.trim(),
            duration: m.duration.trim(),
            instructions: m.instructions?.trim() || "",
          })),
          labTests: testList,
          patientAdvice: patientAdvice.trim(),
          nextAppointment: nextAppointment || undefined,
        },
        // Deferred fee: send the TOTAL final fee (originalFee/standardFee)
        // plus the raw discount. The backend re-derives netAmount with the
        // shared formula (subtracting the online advance) and creates the
        // Payment record for the first time — nothing here pre-subtracts.
        payment: isDeferredFee
          ? {
              amount: deferredNet,
              originalFee: deferredFeeNum,
              standardFee: deferredFeeNum,
              discountAmount: deferredDiscountNum,
              discount: deferredDiscountNum,
              netAmount: deferredNet,
              ancillaryFee: 0,
              description: "Consultation & Prescription",
              method: appointment?.paymentMethod || "Cash",
              isPaid: true,
            }
          : {
              amount: netConsultationFee,
              originalFee,
              discountAmount,
              discount: discountAmount,
              netAmount: netConsultationFee,
              ancillaryFee: 0,
              description: "Consultation & Prescription",
              method: appointment?.paymentMethod || "Cash",
              isPaid: true,
            },
        labFee: 0,
      };

      await axiosInstance.post("/checkups/complete", payload);
      toast.success("Consultation saved & WhatsApp prescription dispatched!");
      // `force: true` skips the dirty-check — the consultation is
      // already persisted, the draft is already cleared server-side, and
      // re-prompting now would be a false positive.
      requestClose({ force: true });
      onCheckupComplete?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to complete checkup. Please verify all fields.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const patient = appointment.patient || {};
  const todayFormatted = new Date().toISOString().split("T")[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-heading"
      className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] flex-col overflow-hidden"
    >
      {/* Light overlay backdrop — close affordance routes through
          `requestClose` so the unsaved-changes prompt shows if dirty. */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={requestClose}
      />

      {/* Main container - clean, modern clinical workspace */}
      <div className="relative z-10 flex min-h-0 h-full w-full max-w-none flex-col bg-slate-50 text-slate-900 shadow-2xl">
        {/* =========================================================================
            STICKY TOP PATIENT BAR
           ========================================================================= */}
        <header className="safe-top shrink-0 bg-white border-b border-slate-200 p-4 shadow-sm sticky top-0 z-30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Patient Details Left Section */}
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Avatar Circle */}
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold text-white shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #0d9488, #0f766e)",
                }}
              >
                {patient.name
                  ? patient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "PT"}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="workspace-heading"
                    className="text-lg font-bold text-slate-900 truncate"
                  >
                    {patient.name || "Unknown Patient"}
                  </h3>

                  {/* Status indicator pill */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
                    </span>
                    In Consultation
                  </span>

                  {appointment.isWalkIn && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                      Walk-In
                    </span>
                  )}
                </div>

                {/* Patient Metadata Sub-line */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 text-sm font-medium mt-1">
                  <span className="whitespace-nowrap font-semibold text-slate-900">
                    Slot: {appointment.slot || "—"}
                  </span>
                  <span className="whitespace-nowrap">
                    {patient.age ? `${patient.age} Yrs` : "Age N/A"} ·{" "}
                    {patient.gender || "Gender N/A"}
                  </span>
                  <span className="whitespace-nowrap inline-flex items-center gap-1 font-mono">
                    <Phone size={11} className="text-slate-500" />
                    {patient.phone || "No phone"}
                  </span>
                  {patient.bloodGroup && (
                    <span className="whitespace-nowrap font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                      {patient.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Action */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              {/* Financial Status Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  appointment.paymentStatus === "PAID" || appointment.paymentStatus === "REALIZED"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {appointment.paymentStatus === "PAID" || appointment.paymentStatus === "REALIZED" ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>✓ Paid Rs. {Number(appointment.paymentAmount || appointment.netAmount || originalFee).toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <Clock size={13} className="text-amber-600" />
                    <span>Pending Rs. {Number(appointment.paymentAmount || appointment.netAmount || originalFee).toLocaleString()}</span>
                  </>
                )}
              </div>

              {/* Close Button — routes through requestClose so the
                  unsaved-changes prompt appears if anything is dirty. */}
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close consultation workspace"
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <X size={17} />
                <span className="hidden sm:inline">Esc</span>
              </button>
            </div>
          </div>
        </header>

        {/* =========================================================================
            SPLIT WORKSPACE BODY (2 COLUMNS)
           ========================================================================= */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 lg:overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ---------------------------------------------------------------------
              LEFT COLUMN: Patient History (35%)
             --------------------------------------------------------------------- */}
          <section
            aria-label="Patient clinical history"
            className="lg:col-span-5 flex flex-col lg:h-full lg:overflow-hidden bg-white"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Patient History
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200">
                {history.length} Prior Visit{history.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Scrollable History Cards */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {history.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto border border-teal-200">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      First Time Consultation
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto">
                      No previous clinical consultation records exist for this
                      patient. Prescribing now will automatically record their initial
                      medical history.
                    </p>
                  </div>
                </div>
              ) : (
                history.map((h, idx) => {
                  const visitDate = formatVisitDate(h.createdAt);
                  const prescription = h.prescription || {};
                  const meds = prescription.medicines || [];
                  const labTestsList = prescription.labTests || [];
                  const isExpanded = expandedHistory[idx];

                  return (
                    <HistoryAccordion
                      key={h._id || idx}
                      title={prescription.diagnosis || "Consultation"}
                      date={visitDate}
                      visitNumber={history.length - idx}
                      isOpen={isExpanded}
                      onToggle={() => toggleHistory(idx)}
                    >
                      {/* Diagnosis */}
                      {prescription.diagnosis && (
                        <div className="mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1 block">
                            Diagnosis
                          </span>
                          <p className="text-slate-900 text-sm font-medium leading-relaxed">
                            {prescription.diagnosis}
                          </p>
                        </div>
                      )}

                      {/* Diseases / Symptoms tags */}
                      {Array.isArray(h.diseases) && h.diseases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {h.diseases.map((dis, dIdx) => (
                            <span
                              key={dIdx}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {dis}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Doctor Clinical Notes - Conditionally rendered */}
                      {h.notes && h.notes.trim() !== "none" && (
                        <div className="mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1 block">
                            Doctor Notes
                          </span>
                          <div className="text-slate-800 text-sm font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {h.notes}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Medicines List - Conditionally rendered */}
                      {meds.length > 0 && (
                        <div className="mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1 block">
                            Prescribed Medicines ({meds.length})
                          </span>
                          <div className="space-y-2">
                            {meds.map((med, mIdx) => (
                              <div
                                key={mIdx}
                                className="bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg text-xs font-medium shadow-sm"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                  <span className="font-bold text-slate-900">
                                    {med.name} {med.dosage}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="font-bold text-teal-600">
                                      {med.frequency}
                                    </span>
                                    <span>• {med.duration}</span>
                                  </span>
                                </div>
                                {med.instructions && med.instructions.trim() !== "" && (
                                  <p className="text-slate-500 italic mt-1">
                                    {med.instructions}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Tests Section - Conditionally rendered */}
                      {labTestsList.length > 0 && (
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 mb-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                            <FlaskConical size={14} className="text-teal-600" />
                            Prescribed Lab Tests ({labTestsList.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {labTestsList.map((test, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg text-xs font-semibold"
                              >
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Patient Advice - Conditionally rendered */}
                      {prescription.patientAdvice && prescription.patientAdvice.trim() !== "" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-600" />
                            Patient Advice
                          </span>
                          <p className="text-slate-800 text-sm font-medium leading-relaxed mt-1">
                            {prescription.patientAdvice}
                          </p>
                        </div>
                      )}

                      {/* Next Appointment Date - Conditionally rendered */}
                      {prescription.nextAppointment && (
                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <Calendar size={13} className="text-teal-600" />
                          <span>
                            Next Follow-Up:{" "}
                            <strong className="text-slate-900">
                              {formatVisitDate(prescription.nextAppointment)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </HistoryAccordion>
                  );
                })
              )}
            </div>
          </section>

          {/* ---------------------------------------------------------------------
              RIGHT COLUMN: Active Examination & Prescription Form (65%)
             --------------------------------------------------------------------- */}
          <section
            aria-label="Active examination and prescription form"
            className="lg:col-span-7 flex flex-col lg:h-full lg:overflow-hidden bg-slate-50"
          >
            {/* Column Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Active Examination &amp; Prescription
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                All changes dispatched to patient WhatsApp
              </span>
            </div>

            {/* Scrollable Form Fields */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCompleteConsultation();
              }}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
            >
              {/* Module 1: Chief Complaints & Symptoms */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h5 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Chief Complaints & Symptoms
                </h5>
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Common Diseases / Symptoms
                  </label>
                  <input
                    type="text"
                    value={diseases}
                    onChange={(e) => setDiseases(e.target.value)}
                    placeholder="e.g. Hypertension, Seasonal Flu, Type 2 Diabetes"
                    className={FIELD_INPUT_CLASS}
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {QUICK_DISEASES.map((item) => (
                      <QuickSuggestionChip
                        key={item}
                        item={item}
                        onClick={() => appendQuickItem(setDiseases, diseases, item)}
                        selectedItems={diseases}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Module 2: Vitals & Clinical Examination */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h5 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Vitals & Clinical Examination
                </h5>
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Clinical Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Clinical examination findings, vitals (BP, pulse, temp), symptoms timeline, systemic review..."
                    rows={4}
                    className={`${FIELD_INPUT_CLASS} resize-y`}
                  />
                </div>
              </div>

              {/* Module 3: Dynamic Prescription Builder */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Pill size={17} className="text-teal-600" />
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      Prescription Builder
                    </span>
                  </div>
                  <span className="text-xs text-rose-500 font-semibold">
                    * Required fields
                  </span>
                </div>

                {/* Diagnosis (Required) */}
                <div className="mb-4">
                  <label className={FIELD_LABEL_CLASS}>
                    Diagnosis <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (formErrors.diagnosis) {
                        setFormErrors((prev) => ({ ...prev, diagnosis: null }));
                      }
                    }}
                    placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension"
                    className={`w-full bg-white border text-slate-900 text-sm rounded-lg p-3 outline-none placeholder:text-slate-400 font-normal transition-all ${
                      formErrors.diagnosis
                        ? "border-rose-500 ring-1 ring-rose-500/10"
                        : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    }`}
                  />
                  {formErrors.diagnosis && (
                    <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.diagnosis}
                    </p>
                  )}
                </div>

                {/* Medicine Rows */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Prescribed Medicines <span className="text-rose-500">*</span> ({medicines.length})
                    </label>
                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className="bg-teal-100 hover:bg-teal-200 text-teal-700 border border-teal-200 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={13} /> Add Medicine
                    </button>
                  </div>

                  {formErrors.medicines && (
                    <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {formErrors.medicines}
                    </p>
                  )}

                  {/* Render medicine rows */}
                  {medicines.map((med, index) => (
                    <MedicineRow
                      key={index}
                      index={index}
                      medicine={med}
                      onUpdate={updateMedicine}
                      onRemove={removeMedicineRow}
                      isLast={index === medicines.length - 1}
                    />
                  ))}

                  {/* Add another medicine button (full width) */}
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="w-full py-3.5 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={16} />
                    + Add Another Medicine
                  </button>
                </div>
              </div>

              {/* Module 4: Lab Diagnostics & Follow-up */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h5 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Lab Diagnostics & Follow-up
                </h5>

                {/* Lab Tests */}
                <div className="mb-4">
                  <label className={FIELD_LABEL_CLASS}>
                    Prescribe Lab Tests
                  </label>
                  <input
                    type="text"
                    value={labTests}
                    onChange={(e) => setLabTests(e.target.value)}
                    placeholder="e.g. CBC, Serum Creatinine, Liver Function Test (LFT)"
                    className={FIELD_INPUT_CLASS}
                  />
                  {/* Quick lab test suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {QUICK_LAB_TESTS.map((test) => (
                      <QuickSuggestionChip
                        key={test}
                        item={test}
                        onClick={() => appendQuickItem(setLabTests, labTests, test)}
                        selectedItems={labTests}
                      />
                    ))}
                  </div>
                </div>

                {/* Patient Advice */}
                <div className="mb-4">
                  <label className={FIELD_LABEL_CLASS}>
                    Patient Advice & Lifestyle Guidance
                  </label>
                  <textarea
                    value={patientAdvice}
                    onChange={(e) => setPatientAdvice(e.target.value)}
                    placeholder="Diet constraints, bed rest advice, hydration guidance, warning signs to return..."
                    rows={3}
                    className={`${FIELD_INPUT_CLASS} resize-y`}
                  />
                </div>

                {/* Next Follow-Up Appointment */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Next Follow-Up Appointment Date
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <input
                        type="date"
                        min={todayFormatted}
                        value={nextAppointment}
                        onChange={(e) => setNextAppointment(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    {/* Quick follow-up buttons */}
                    <div className="sm:col-span-6 flex flex-wrap items-center gap-1.5">
                      {[
                        { label: "+3 Days", days: 3 },
                        { label: "+1 Week", days: 7 },
                        { label: "+2 Weeks", days: 14 },
                        { label: "+1 Month", days: 30 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setQuickFollowUp(item.days)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Module 5: Consultation Fee — ONLY for deferred ("pay at
                  consultation") visits. Non-deferred visits keep the locked
                  read-only fee behavior (values shown in the header pill). */}
              {isDeferredFee && (
                <div className="bg-white border border-teal-200 dark:border-teal-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign size={17} className="text-teal-600" />
                      <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                        Consultation Fee
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        (pay at consultation)
                      </span>
                    </div>
                    <span className="text-xs text-rose-500 font-semibold">
                      * Required
                    </span>
                  </div>

                  {advanceAmountPaid > 0 && (
                    <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex items-start gap-2">
                      <span className="shrink-0 text-base leading-5">💡</span>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
                        Patient already paid Rs. {advanceAmountPaid.toLocaleString()} online —
                        enter the total fee, the remaining balance will be
                        calculated automatically.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={FIELD_LABEL_CLASS} htmlFor="deferred-fee">
                        Consultation Fee (Rs.) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="deferred-fee"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={deferredFee}
                        onChange={(e) => {
                          setDeferredFee(e.target.value);
                          if (formErrors.deferredFee) {
                            setFormErrors((prev) => ({ ...prev, deferredFee: null }));
                          }
                        }}
                        placeholder="e.g. 1000"
                        className={`w-full bg-white border text-slate-900 text-sm rounded-lg p-3 outline-none placeholder:text-slate-400 font-normal transition-all ${
                          formErrors.deferredFee
                            ? "border-rose-500 ring-1 ring-rose-500/10"
                            : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        }`}
                      />
                      {formErrors.deferredFee && (
                        <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={13} /> {formErrors.deferredFee}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={FIELD_LABEL_CLASS} htmlFor="deferred-discount">
                        Discount (Rs.)
                      </label>
                      <input
                        id="deferred-discount"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={deferredDiscount}
                        onChange={(e) => {
                          setDeferredDiscount(e.target.value);
                          if (formErrors.deferredDiscount) {
                            setFormErrors((prev) => ({ ...prev, deferredDiscount: null }));
                          }
                        }}
                        placeholder="0"
                        className={`w-full bg-white border text-slate-900 text-sm rounded-lg p-3 outline-none placeholder:text-slate-400 font-normal transition-all ${
                          formErrors.deferredDiscount
                            ? "border-rose-500 ring-1 ring-rose-500/10"
                            : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        }`}
                      />
                      {formErrors.deferredDiscount && (
                        <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={13} /> {formErrors.deferredDiscount}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Collected now
                      {advanceAmountPaid > 0 ? " (balance)" : ""}
                    </span>
                    <span className="text-base font-extrabold text-teal-800 dark:text-teal-200">
                      Rs. {deferredNet.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom spacing */}
              <div className="h-6" />
            </form>

            {/* =============================================================
                STICKY ACTION FOOTER
               ============================================================= */}
            <div className="shrink-0 border-t border-slate-200 bg-white px-4 sm:px-6 py-4 shadow-lg safe-bottom">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="min-w-0 truncate text-xs text-slate-600 sm:block">
                  Patient: <strong className="text-slate-900">{patient.name}</strong>
                </div>

                <div className="flex items-stretch gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={requestClose}
                    className="flex-1 sm:flex-initial min-h-[44px] px-5 py-3.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteConsultation}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial min-h-[44px] bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Dispatching Prescription...</span>
                      </>
                    ) : (
                      <>
                        <WhatsAppIcon className="h-4 w-4 shrink-0" />
                        <span className="sm:hidden">Save &amp; Send Rx</span>
                        <span className="hidden sm:inline">
                          Save Checkup &amp; Dispatch WhatsApp Prescription
                        </span>
                        <ChevronRight size={18} className="shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* =========================================================================
          UNSAVED-CHANGES PROMPT
          Two-button dialog (Save changes / Discard changes). Renders ABOVE the
          panel (z-60 vs panel z-50) so the dark backdrop covers the panel and
          the doctor can't edit underneath. The "Cancel" affordance on this
          dialog is the X / overlay click / Escape — each closes the dialog
          without saving, so the doctor can keep editing.
         ========================================================================= */}
      {closePromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-prompt-title"
          aria-describedby="unsaved-prompt-message"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onKeyDown={(e) => {
            // Cancel-the-prompt affordance: pressing Escape while the
            // prompt is open should close the prompt and put the doctor
            // back into editing, NOT close the panel. The body-scroll
            // effect's Escape listener deliberately no-ops while the
            // prompt is open (it checks closePromptOpenRef.current), so
            // this handler is the one that must respond.
            if (e.key === "Escape") {
              e.stopPropagation();
              setClosePromptOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setClosePromptOpen(false)}
            aria-label="Close dialog"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setClosePromptOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 h-8 w-8 rounded-lg text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 transition-all hover:bg-slate-100"
            >
              ×
            </button>
            <h3
              id="unsaved-prompt-title"
              className="pr-10 text-base sm:text-lg font-extrabold text-slate-900"
            >
              Save your changes?
            </h3>
            <p
              id="unsaved-prompt-message"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              You have unsaved edits in this consultation. Save them as a draft
              so you can pick up where you left off, or discard them and close.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={discardAndClose}
                disabled={isSavingDraft}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 transition-all hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={persistDraftAndClose}
                disabled={isSavingDraft}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
              >
                {isSavingDraft ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
