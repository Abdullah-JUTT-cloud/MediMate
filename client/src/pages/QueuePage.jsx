import { useState, useEffect } from "react";
import { Play, Bell, ClipboardList, CheckCircle, Clock, Plus, Trash, X, Calendar, DollarSign, Activity } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

// Status constants
const QUEUE_STATUSES = {
  WAITING: { label: "Waiting", color: "var(--color-warning)", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)" },
  IN_CONSULTATION: { label: "In Consultation", color: "var(--color-primary)", bg: "rgba(93, 112, 82, 0.12)", border: "rgba(93, 112, 82, 0.3)" },
  COMPLETED: { label: "Completed", color: "var(--color-success)", bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)" },
  NO_SHOW: { label: "No Show", color: "var(--color-danger)", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)" }
};

const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "P";

export default function QueuePage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  // Consultation state
  const [activeConsultation, setActiveConsultation] = useState(null); // appointment object
  const [history, setHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New checkup form state
  const [diseases, setDiseases] = useState("");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const [labTests, setLabTests] = useState("");
  const [patientAdvice, setPatientAdvice] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [consultationDiscount, setConsultationDiscount] = useState("0");
  const [labFee, setLabFee] = useState("");
  const [expandedDateGroups, setExpandedDateGroups] = useState({
    today: true,
    previousDay: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await axiosInstance.get("/appointments/today");
      setAppointments(res.data.appointments || []);
    } catch {
      toast.error("Failed to load today's queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Refresh queue every 45 seconds
    const interval = setInterval(fetchQueue, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleStartConsultation = async (appt) => {
    try {
      const res = await axiosInstance.post(`/appointments/${appt._id}/start`);
      setActiveConsultation(res.data.appointment || appt);
      setHistory(res.data.history || []);
      
      // Reset form states
      setDiseases("");
      setNotes("");
      setDiagnosis("");
      setMedicines([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
      setLabTests("");
      setPatientAdvice("");
      setNextAppointment("");
      setConsultationDiscount("0");
      setLabFee("");

      setDrawerOpen(true);
      toast.success(`Consultation started for ${appt.patient?.name}`);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start consultation");
    }
  };

  const handleSendReminder = async (appt) => {
    try {
      const res = await axiosInstance.post(`/appointments/${appt._id}/remind`);
      toast.success(res.data.message || "Reminder sent successfully via WhatsApp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send WhatsApp reminder");
    }
  };

  // Medicine helper
  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) {
      setMedicines([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
      return;
    }
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleCompleteConsultation = async () => {
    if (!diagnosis.trim()) {
      toast.error("Diagnosis is required");
      return;
    }
    const emptyMed = medicines.some(m => !m.name.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim());
    if (emptyMed) {
      toast.error("Please fill in all required fields (Name, Dosage, Frequency, Duration) for each medicine");
      return;
    }

    setIsSubmitting(true);
    try {
      // Map diseases and lab tests from string lists
      const diseaseList = diseases.split(",").map(d => d.trim()).filter(Boolean);
      const testList = labTests.split(",").map(t => t.trim()).filter(Boolean);

      const originalFee = Number(
        activeConsultation?.originalFee ?? activeConsultation?.consultationFee ?? activeConsultation?.netAmount ?? 0
      );
      const discount = Math.max(0, Number(consultationDiscount) || 0);
      const finalConsultationFee = Math.max(0, Number.isFinite(originalFee) ? originalFee - discount : 0);
      const ancillaryFee = Number(labFee || 0);

      const payload = {
        appointmentId: activeConsultation._id,
        patientId: activeConsultation.patient?._id,
        diseases: diseaseList,
        notes,
        prescription: {
          diagnosis,
          medicines,
          labTests: testList,
          patientAdvice,
          nextAppointment: nextAppointment || undefined
        },
        payment: {
          amount: finalConsultationFee,
          originalFee,
          discountAmount: discount,
          discount,
          netAmount: finalConsultationFee,
          ancillaryFee,
          description: "Consultation",
          method: "Cash",
          isPaid: true
        },
        labFee: ancillaryFee
      };

      await axiosInstance.post("/checkups/complete", payload);
      toast.success("Consultation completed and prescription sent!");
      setDrawerOpen(false);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete checkup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (activeFilter === "All") return true;
    return appt.queueStatus === activeFilter;
  });

  const getDateKey = (value) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  };

  const getDisplayDateLabel = (dateValue) => {
    const date = new Date(dateValue);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (sameDay(date, today)) return "Today";
    if (sameDay(date, yesterday)) return "Previous Day";
    return date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  };

  const appointmentGroups = (() => {
    const groups = {};
    for (const appt of filteredAppointments) {
      const key = getDateKey(appt.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(appt);
    }

    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([key, items]) => ({
        key,
        label: getDisplayDateLabel(key),
        items: items.sort((a, b) => (a.slot || "").localeCompare(b.slot || "")),
      }));
  })();

  const toggleGroup = (groupKey) => {
    setExpandedDateGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return (
    <div className="relative w-full max-w-full space-y-6 px-2 py-2 sm:px-4 lg:px-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl" style={{ fontFamily: "Fraunces" }}>Clinical Assembly Line</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Today's active doctor queue</p>
        </div>
        <button
          onClick={fetchQueue}
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-bg-soft)]"
        >
          🔄 Refresh Queue
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {["All", "WAITING", "IN_CONSULTATION", "COMPLETED", "NO_SHOW"].map((s) => {
          const isSelected = activeFilter === s;
          const statusDetail = QUEUE_STATUSES[s] || { label: "All Patients" };
          return (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border"
              style={{
                background: isSelected ? "rgba(93,112,82,0.14)" : "var(--color-card)",
                borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                color: isSelected ? "var(--color-primary)" : "var(--color-text-secondary)"
              }}
            >
              {statusDetail.label}
            </button>
          );
        })}
      </div>

      {/* Queue Listing */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-[var(--color-text-secondary)]">Loading clinical queue...</p>
        </div>
      ) : appointmentGroups.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/90">
          <p className="text-sm text-[var(--color-text-secondary)]">No patients found in this queue status today.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointmentGroups.map((group) => {
            const isExpanded = expandedDateGroups[group.key] !== false;
            const groupLabel = group.label === "Previous Day" ? "Previous Day (Late-night appointments)" : group.label;

            return (
              <div key={group.key} className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/90 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-[var(--color-bg-soft)]/40"
                >
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{groupLabel}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">{group.items.length} appointment{group.items.length === 1 ? "" : "s"}</p>
                  </div>
                  <span className="text-[var(--color-text-secondary)]">{isExpanded ? "▾" : "▸"}</span>
                </button>

                {isExpanded && (
                  <div className="grid gap-4 p-4">
                    {group.items.map((appt) => {
                      const statusConfig = QUEUE_STATUSES[appt.queueStatus] || QUEUE_STATUSES.WAITING;
                      const patient = appt.patient || {};
                      const isCompleted = appt.queueStatus === "COMPLETED";
                      const inConsultation = appt.queueStatus === "IN_CONSULTATION";
                      const checkInStr = appt.checkInTime ? new Date(appt.checkInTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }) : "—";

                      return (
                        <div
                          key={appt._id}
                          className="rounded-3xl p-5 border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:translate-x-1"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                              style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}
                            >
                              {getInitials(patient.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-bold text-[var(--color-text-primary)] truncate">{patient.name || "Unknown Patient"}</p>
                                {appt.isWalkIn && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] border border-[var(--color-secondary)]/30">
                                    Walk-In
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                {patient.age ? `${patient.age} yrs` : ""} · {patient.gender || ""} · Phone: {patient.phone || "—"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                            <div className="space-y-1">
                              <p className="text-[var(--color-text-secondary)]">Slot Time</p>
                              <p className="font-semibold text-[var(--color-text-primary)]">{appt.slot}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[var(--color-text-secondary)]">Check-In</p>
                              <p className="font-semibold text-[var(--color-text-primary)]">{checkInStr}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[var(--color-text-secondary)]">Upfront Paid</p>
                              <span
                                className={`inline-block font-bold ${
                                  appt.paymentStatus === "PAID" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                                }`}
                              >
                                {appt.paymentStatus === "PAID" ? `✓ Yes (${Number(appt.paymentAmount || appt.netAmount || 0).toLocaleString()} PKR)` : "✗ Pending"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[var(--color-text-secondary)]">Status</p>
                              <span
                                className="px-2.5 py-0.5 rounded-full font-bold border inline-block text-[10px]"
                                style={{ background: statusConfig.bg, borderColor: statusConfig.border, color: statusConfig.color }}
                              >
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            {!isCompleted && (
                              <button
                                onClick={() => handleStartConsultation(appt)}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-white transition-all hover:opacity-90 bg-[var(--color-primary)] shrink-0"
                                style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}
                              >
                                <Play size={12} fill="white" />
                                {inConsultation ? "Resume consultation" : "Start Consultation"}
                              </button>
                            )}
                            {appt.queueStatus === "WAITING" && (
                              <button
                                onClick={() => handleSendReminder(appt)}
                                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-full text-xs font-bold transition-all border hover:bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)]"
                              >
                                <Bell size={12} />
                                Remind
                              </button>
                            )}
                            {isCompleted && (
                              <span className="text-xs font-semibold text-[var(--color-success)] flex items-center gap-1">
                                <CheckCircle size={14} /> Consultation Completed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Split Workspace Drawer */}
      {drawerOpen && activeConsultation && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Overlay backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />

          {/* Main Slide-in drawer container */}
          <div className="relative z-10 flex h-full w-full max-w-none flex-col bg-[var(--color-bg)] shadow-2xl transition-transform duration-300 md:w-full lg:w-full lg:max-w-[100vw]">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)]/80 bg-[var(--color-card)] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Consultation Workspace — {activeConsultation.patient?.name}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Slot: {activeConsultation.slot} · Age/Gender: {activeConsultation.patient?.age} yrs / {activeConsultation.patient?.gender}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Split Panel Body */}
            <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1.08fr_1.32fr]">
              
              {/* Left Column: Checkup History */}
              <div className="space-y-6 overflow-y-auto border-r border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/30 p-4 sm:p-5 lg:p-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-4">
                    Patient History ({history.length} prior visits)
                  </h4>
                  
                  {history.length === 0 ? (
                    <div className="rounded-3xl border border-[var(--color-border)]/50 p-6 bg-[var(--color-card)]/50 text-center">
                      <p className="text-xs text-[var(--color-text-secondary)]">First time consultation. No history records found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((h) => {
                        const dateStr = new Date(h.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        });
                        return (
                          <div key={h._id} className="rounded-3xl p-5 border border-[var(--color-border)] bg-[var(--color-card)] space-y-3">
                            <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 pb-2">
                              <p className="text-xs font-bold text-[var(--color-primary)]">{dateStr}</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                Prescribed
                              </span>
                            </div>
                            
                            {/* Diagnosis & Notes */}
                            <div>
                              <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Diagnosis</p>
                              <p className="text-sm font-bold text-[var(--color-text-primary)]">{h.prescription?.diagnosis || "—"}</p>
                            </div>

                            {h.notes && (
                              <div>
                                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Doctor Notes</p>
                                <p className="text-xs text-[var(--color-text-primary)] leading-relaxed italic">{h.notes}</p>
                              </div>
                            )}

                            {/* Medicines */}
                            {h.prescription?.medicines && h.prescription.medicines.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Medicines</p>
                                <div className="space-y-1">
                                  {h.prescription.medicines.map((med, idx) => (
                                    <div key={idx} className="text-xs p-2 rounded-xl bg-[var(--color-bg-soft)] border border-[var(--color-border)]/50 flex justify-between">
                                      <span><strong>{med.name}</strong> · {med.dosage}</span>
                                      <span className="text-[var(--color-text-secondary)]">{med.frequency} · {med.duration}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lab tests / Advice */}
                            {h.prescription?.labTests && h.prescription.labTests.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Prescribed Lab Tests</p>
                                <p className="text-xs text-[var(--color-text-primary)]">{h.prescription.labTests.join(", ")}</p>
                              </div>
                            )}

                            {h.prescription?.patientAdvice && (
                              <div>
                                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Advice</p>
                                <p className="text-xs text-[var(--color-text-primary)]">{h.prescription.patientAdvice}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: New Checkup Form */}
              <div className="space-y-6 overflow-y-auto p-4 sm:p-5 lg:p-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-4">
                    New Checkup & Prescription Form
                  </h4>

                  <div className="space-y-5">
                    {/* Diseases input */}
                    <div>
                      <label className="block text-[12px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                        Common Diseases / Symptoms (comma separated)
                      </label>
                      <input
                        type="text"
                        value={diseases}
                        onChange={(e) => setDiseases(e.target.value)}
                        placeholder="e.g. Hypertension, Seasonal Flu, Fever"
                        className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-base outline-none transition-all focus:border-[var(--color-primary)]"
                      />
                    </div>

                    {/* Notes input */}
                    <div>
                      <label className="block text-[12px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                        Clinical Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Clinical examination findings, symptoms details..."
                        rows={3}
                        className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-base outline-none resize-none transition-all focus:border-[var(--color-primary)]"
                      />
                    </div>

                    {/* Prescription Section */}
                    <div className="rounded-3xl border border-[var(--color-border)] p-4 bg-[var(--color-card)] space-y-4">
                      <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest border-b border-[var(--color-border)]/50 pb-2">
                        Prescription Details
                      </p>

                      {/* Diagnosis */}
                      <div>
                        <label className="block text-[12px] font-bold text-[var(--color-text-primary)] uppercase mb-2">
                          Diagnosis <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="e.g. Acute Viral Bronchitis"
                          className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-base outline-none transition-all focus:border-[var(--color-primary)]"
                        />
                      </div>

                      {/* Medicines Dynamic Table */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-[12px] font-bold text-[var(--color-text-primary)] uppercase">
                            Prescribed Medicines <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={addMedicineRow}
                            className="text-[11px] font-bold text-[var(--color-primary)] flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Row
                          </button>
                        </div>

                        {medicines.map((med, index) => (
                          <div key={index} className="p-3 rounded-xl bg-[var(--color-bg-soft)] border border-[var(--color-border)]/50 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-3">
                              <input
                                type="text"
                                value={med.name}
                                onChange={(e) => updateMedicine(index, "name", e.target.value)}
                                placeholder="Med Name (e.g. Panadol)"
                                className="min-h-[48px] px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-base outline-none focus:border-[var(--color-primary)]"
                              />
                              <input
                                type="text"
                                value={med.dosage}
                                onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                                placeholder="Dosage (e.g. 500mg)"
                                className="min-h-[48px] px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-base outline-none focus:border-[var(--color-primary)]"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                                placeholder="Frequency (e.g. 1-0-1)"
                                className="min-h-[48px] px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-base outline-none focus:border-[var(--color-primary)]"
                              />
                              <input
                                type="text"
                                value={med.duration}
                                onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                                placeholder="Duration (e.g. 5 days)"
                                className="min-h-[48px] px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-base outline-none focus:border-[var(--color-primary)]"
                              />
                            </div>
                            <div className="flex gap-3 items-center">
                              <input
                                type="text"
                                value={med.instructions}
                                onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
                                placeholder="Instructions (e.g. After meal)"
                                className="flex-1 min-h-[48px] px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-base outline-none focus:border-[var(--color-primary)]"
                              />
                              <button
                                type="button"
                                onClick={() => removeMedicineRow(index)}
                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Lab Tests */}
                      <div>
                        <label className="block text-[12px] font-bold text-[var(--color-text-primary)] uppercase mb-2">
                          Prescribe Lab Tests (comma separated)
                        </label>
                        <input
                          type="text"
                          value={labTests}
                          onChange={(e) => setLabTests(e.target.value)}
                          placeholder="e.g. CBC, Serum Creatinine, Liver Function Test"
                          className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-base outline-none transition-all focus:border-[var(--color-primary)]"
                        />
                      </div>

                      {/* Patient Advice */}
                      <div>
                        <label className="block text-[12px] font-bold text-[var(--color-text-primary)] uppercase mb-2">
                          Patient Advice
                        </label>
                        <textarea
                          value={patientAdvice}
                          onChange={(e) => setPatientAdvice(e.target.value)}
                          placeholder="Diet constraints, bed rest advice, etc."
                          rows={3}
                          className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-base outline-none resize-none transition-all focus:border-[var(--color-primary)]"
                        />
                      </div>

                      {/* Next Appointment Date */}
                      <div>
                        <label className="block text-[12px] font-bold text-[var(--color-text-primary)] uppercase mb-2">
                          Next Appointment
                        </label>
                        <input
                          type="date"
                          value={nextAppointment}
                          onChange={(e) => setNextAppointment(e.target.value)}
                          className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-base outline-none color-scheme-light focus:border-[var(--color-primary)]"
                          style={{ colorScheme: "light" }}
                        />
                      </div>
                    </div>


                    {/* Action buttons */}
                    <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]/50">
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        className="flex-1 py-3 rounded-full border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteConsultation}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-95 bg-[var(--color-primary)] shadow-md disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))" }}
                      >
                        {isSubmitting ? "Processing..." : "Complete & Dispatch ✓"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
