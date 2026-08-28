import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import usePatientAccountStore from "../../store/patientAccountStore";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Stethoscope,
  Star,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Upload,
  User,
  CreditCard,
  ShieldCheck,
  Phone,
  MessageSquare,
} from "lucide-react";

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={`${
            s <= Math.round(value)
              ? "text-amber-400 fill-amber-400"
              : "text-slate-200 dark:text-zinc-700 fill-slate-100 dark:fill-zinc-800"
          }`}
        />
      ))}
    </div>
  );
}

function DoctorProfileAvatar({ profilePicUrl, fullName }) {
  const [imgError, setImgError] = useState(false);
  const isValidUrl = Boolean(
    profilePicUrl &&
      typeof profilePicUrl === "string" &&
      (profilePicUrl.startsWith("http://") || profilePicUrl.startsWith("https://") || profilePicUrl.startsWith("/"))
  );

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-3xl flex items-center justify-center shrink-0 overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50 shadow-md">
      {isValidUrl && !imgError ? (
        <img
          src={profilePicUrl}
          alt={fullName || "Doctor"}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="uppercase tracking-wider font-extrabold">{fullName?.charAt(0) || "D"}</span>
      )}
      <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
    </div>
  );
}

// Canonical 24-hour slot values (match what the doctor portal stores in MongoDB).
const DEFAULT_SLOT_TIMES = [
  "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
  "11:00", "11:20", "11:40", "12:00", "12:20", "12:40",
  "14:00", "14:20", "14:40", "15:00", "15:20", "15:40",
  "16:00", "16:20", "16:40", "17:00", "17:20", "17:40",
];

function parseTimeStrToMinutes(str) {
  if (!str) return 0;
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

/** Converts total minutes to 24h "HH:MM" — canonical slot value stored in DB. */
function formatMinutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Display-only: converts "HH:MM" 24h to "HH:MM AM/PM" for user-friendly labels. */
function to12h(time24) {
  if (!time24 || !time24.includes(":")) return time24;
  // Already has AM/PM — return as-is (handles old DB data gracefully)
  if (/AM|PM/i.test(time24)) return time24;
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

function generateSlotsFromSessions(sessions, slotDuration = 20) {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return DEFAULT_SLOT_TIMES;
  }
  const slots = [];
  sessions.forEach((s) => {
    const startMins = parseTimeStrToMinutes(s.startTime);
    const endMins = parseTimeStrToMinutes(s.endTime);
    for (let current = startMins; current + slotDuration <= endMins; current += slotDuration) {
      slots.push(formatMinutesToTime(current));
    }
  });
  return slots.length > 0 ? slots : DEFAULT_SLOT_TIMES;
}

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = usePatientAccountStore((s) => s.patient);

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getNext7Days()[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Clinic vs Hospital location filter
  const [locationType, setLocationType] = useState("Clinic"); // "Clinic" | "Hospital"
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);

  // Booking form state
  const [type, setType] = useState("Consultation");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [docRes, revRes] = await Promise.all([
          axios.get(`/public/doctors/${id}`),
          axios.get(`/public/doctors/${id}/reviews`).catch(() => ({ data: { reviews: [] } })),
        ]);
        setDoctor(docRes.data.doctor);
        setReviews(revRes.data.reviews || []);
      } catch (err) {
        toast.error("Doctor not found or no longer available");
        navigate("/book/doctors");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  // Load booked slots when doctor or date changes
  useEffect(() => {
    if (!id || !selectedDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const { data } = await axios.get(`/public/doctors/${id}/slots`, {
          params: { date: selectedDate },
        });
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [id, selectedDate]);

  // Practice locations lists
  const hasClinics = doctor?.clinics && doctor.clinics.length > 0;
  const hasHospitals = doctor?.hospitals && doctor.hospitals.length > 0;

  useEffect(() => {
    if (doctor) {
      if (hasClinics) setLocationType("Clinic");
      else if (hasHospitals) setLocationType("Hospital");
    }
  }, [doctor, hasClinics, hasHospitals]);

  const currentLocationList = useMemo(() => {
    if (!doctor) return [];
    return locationType === "Clinic" ? doctor.clinics || [] : doctor.hospitals || [];
  }, [doctor, locationType]);

  const currentLocation = currentLocationList[selectedLocationIndex] || currentLocationList[0] || null;

  // Active day sessions
  const daySessions = useMemo(() => {
    if (!currentLocation?.sessions) return [];
    const dateObj = new Date(selectedDate + "T00:00:00");
    const dayName = DAY_NAMES[dateObj.getDay()];
    return currentLocation.sessions.filter((s) => s.day === dayName);
  }, [currentLocation, selectedDate]);

  // Dynamic slot times
  const dynamicSlotTimes = useMemo(() => {
    return generateSlotsFromSessions(daySessions, doctor?.slotDuration || 20);
  }, [daySessions, doctor?.slotDuration]);

  // Returns the full slot data object from the API (includes isFull, standardCount, etc.)
  const getSlotInfo = (time) => {
    return slots.find((item) => item.time === time) || { standardCount: 0, emergencyCount: 0, totalCount: 0, isFull: false };
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBook = async () => {
    if (!patient) {
      toast.error("Please sign in or register to book an appointment");
      navigate("/book/login", { state: { from: `/book/doctors/${id}` } });
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select a booking time slot");
      return;
    }

    const onlineFee = doctor.onlineBookingFee || doctor.advanceBookingFee || 0;
    if (onlineFee > 0 && !screenshot) {
      toast.error("Please attach your payment screenshot receipt");
      return;
    }

    setBooking(true);
    try {
      const formData = new FormData();
      formData.append("doctorId", id);
      formData.append("date", selectedDate);
      formData.append("slot", selectedSlot);
      formData.append("type", type);
      if (notes) formData.append("notes", notes);
      if (screenshot) formData.append("screenshot", screenshot);

      await axios.post("/patient-account/book", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Appointment request submitted successfully!");
      navigate("/patient/appointments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit appointment request");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Loading Doctor Profile…</p>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  const days7 = getNext7Days();
  const onlineFee = doctor.onlineBookingFee || doctor.advanceBookingFee || 0;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-100 pb-20">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/book/doctors")}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Doctors</span>
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              M
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-base">MedAlerto</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/patient/appointments"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
            >
              <Calendar size={14} />
              <span>My Appointments</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Doctor Profile Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Profile Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <DoctorProfileAvatar profilePicUrl={doctor.profilePicUrl} fullName={doctor.fullName} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {doctor.title ? `${doctor.title} ` : "Dr. "}
                      {doctor.fullName}
                    </h1>
                    <CheckCircle2 size={20} className="text-indigo-500 shrink-0" />
                  </div>

                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {doctor.specialization || "General Physician"}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
                      {doctor.yearsOfExperience || 1} Years Experience
                    </span>
                    {doctor.primaryDegree && (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                        {doctor.primaryDegree}
                      </span>
                    )}
                  </div>

                  {doctor.avgRating > 0 ? (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <StarRating value={doctor.avgRating} />
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        {doctor.avgRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400">({doctor.reviewCount} patient reviews)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-400 font-medium">
                      <Star size={13} className="text-slate-300 fill-slate-300" />
                      <span>No reviews yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Practice Locations Detailed Section */}
              {(hasClinics || hasHospitals) && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <Building2 size={14} /> Practice Locations & Schedules
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {hasClinics &&
                      doctor.clinics.map((c, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50/80 dark:bg-zinc-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                              Clinic
                            </span>
                            {c.phone && <span className="text-[11px] text-slate-400 font-mono">📞 {c.phone}</span>}
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-start gap-1">
                            <MapPin size={13} className="shrink-0 mt-0.5 text-slate-400" />
                            <span>{c.address}</span>
                          </p>
                        </div>
                      ))}

                    {hasHospitals &&
                      doctor.hospitals.map((h, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50/80 dark:bg-zinc-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                              Hospital
                            </span>
                            {h.phone && <span className="text-[11px] text-slate-400 font-mono">📞 {h.phone}</span>}
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{h.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-start gap-1">
                            <MapPin size={13} className="shrink-0 mt-0.5 text-slate-400" />
                            <span>{h.address}</span>
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Patient Reviews Section (Always Visible) */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Patient Reviews</span>
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </h3>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div
                      key={r._id}
                      className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StarRating value={r.rating} />
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            {r.rating}.0
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                          "{r.comment}"
                        </p>
                      )}
                      <p className="text-[11px] font-bold text-slate-400 mt-2">
                        — {r.patientAccountId?.name || "Verified Patient"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50/70 dark:bg-zinc-800/30 rounded-2xl p-8 text-center border border-slate-100 dark:border-zinc-800/80">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <Star size={22} className="fill-amber-400 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">No reviews yet</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Be the first patient to share feedback and review {doctor.title ? `${doctor.title} ` : "Dr. "}{doctor.fullName} after your consultation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Booking Sidebar & Digital Bank Card */}
          <div className="space-y-6">
            {/* Digital Bank Account Payment Card */}
            {onlineFee > 0 && (
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/30 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <CreditCard size={18} />
                    <span className="text-xs font-extrabold uppercase tracking-wider">Payment Account</span>
                  </div>
                  <span className="text-xs font-black bg-indigo-500/30 px-2.5 py-1 rounded-full text-indigo-200 border border-indigo-400/30">
                    Rs {onlineFee.toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4 font-medium leading-relaxed">
                  Transfer the online fee to the doctor's bank account below and attach the payment screenshot to complete your booking.
                </p>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3 border border-white/10 text-xs">
                  {doctor.paymentBankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Bank:</span>
                      <span className="font-bold text-white">{doctor.paymentBankName}</span>
                    </div>
                  )}

                  {doctor.paymentAccountTitle && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account Title:</span>
                      <span className="font-bold text-white">{doctor.paymentAccountTitle}</span>
                    </div>
                  )}

                  {doctor.paymentAccountNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account No:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-200">{doctor.paymentAccountNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(doctor.paymentAccountNumber, "Account Number")}
                          className="p-1 text-slate-400 hover:text-white transition"
                        >
                          {copiedField === "Account Number" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {doctor.paymentIBAN && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="text-slate-400">IBAN:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-indigo-200">{doctor.paymentIBAN}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(doctor.paymentIBAN, "IBAN")}
                          className="p-1 text-slate-400 hover:text-white transition"
                        >
                          {copiedField === "IBAN" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Form Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
              {!patient ? (
                /* ── Auth-Lock State ─────────────────────────────────────────── */
                <div className="flex flex-col items-center text-center py-6 px-2 space-y-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 dark:from-indigo-500/20 dark:to-indigo-700/30 flex items-center justify-center mx-auto border border-indigo-200/60 dark:border-indigo-700/40 shadow-sm">
                      <ShieldCheck size={30} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow">
                      <span className="text-[9px] font-black text-white">!</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Sign In to Book</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-[240px] mx-auto">
                      Please sign in or register a patient account to view real-time slot availability and request an appointment with{" "}
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {doctor.title ? `${doctor.title} ` : "Dr. "}{doctor.fullName}
                      </span>.
                    </p>
                  </div>

                  <div className="w-full space-y-2 pt-1">
                    <Link
                      to="/book/login"
                      state={{ from: `/book/doctors/${id}` }}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs transition shadow-md shadow-indigo-500/20"
                    >
                      <User size={14} />
                      Sign In to Patient Account
                    </Link>
                    <Link
                      to="/book/register"
                      state={{ from: `/book/doctors/${id}` }}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold text-xs transition"
                    >
                      Register New Account
                    </Link>
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-zinc-600">
                    Your data is safe and encrypted 🔒
                  </p>
                </div>
              ) : (
              <>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>Book Appointment</span>
              </h3>

              {/* Location Type Selector */}
              {hasClinics && hasHospitals ? (
                <div className="mb-5">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Select Practice Location
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationType("Clinic");
                        setSelectedLocationIndex(0);
                        setSelectedSlot(null);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        locationType === "Clinic"
                          ? "bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-sm"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🏥 Clinic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocationType("Hospital");
                        setSelectedLocationIndex(0);
                        setSelectedSlot(null);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        locationType === "Hospital"
                          ? "bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🏨 Hospital</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-3 text-xs text-slate-700 dark:text-zinc-200 flex items-center gap-2 border border-slate-200 dark:border-zinc-700">
                  <span>{hasClinics ? "🏥" : "🏨"}</span>
                  <span className="font-bold">{hasClinics ? "Clinic Practice" : "Hospital Practice"}</span>
                </div>
              )}

              {/* Multiple Locations Dropdown */}
              {currentLocationList.length > 1 && (
                <div className="mb-4">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Select Specific {locationType}
                  </label>
                  <select
                    value={selectedLocationIndex}
                    onChange={(e) => {
                      setSelectedLocationIndex(Number(e.target.value));
                      setSelectedSlot(null);
                    }}
                    className="w-full rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {currentLocationList.map((loc, idx) => (
                      <option key={idx} value={idx}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Location Info Summary */}
              {currentLocation && (
                <div className="mb-5 text-xs bg-indigo-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-zinc-700/60">
                  <p className="font-bold text-slate-900 dark:text-white">{currentLocation.name}</p>
                  <p className="text-slate-500 dark:text-zinc-400 mt-0.5">{currentLocation.address}</p>
                  {daySessions.length > 0 ? (
                    <p className="text-teal-700 dark:text-teal-400 font-bold mt-2 flex items-center gap-1">
                      <Clock size={13} />
                      <span>Hours: {daySessions.map((s) => `${s.startTime} - ${s.endTime}`).join(", ")}</span>
                    </p>
                  ) : (
                    <p className="text-indigo-600 dark:text-indigo-400 font-semibold mt-2">
                      ℹ️ Showing standard availability slots
                    </p>
                  )}
                </div>
              )}

              {/* Date Picker Bar */}
              <div className="mb-5">
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Select Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {days7.map((d) => {
                    const date = new Date(d + "T00:00:00");
                    const dayName = DAY_NAMES[date.getDay()];
                    const hasSessionOnDay = currentLocation?.sessions?.some((s) => s.day === dayName);

                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                        }}
                        className={`shrink-0 flex flex-col items-center py-2.5 px-3 rounded-2xl text-xs transition-all min-w-[54px] ${
                          selectedDate === d
                            ? "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/20 scale-105"
                            : hasSessionOnDay
                            ? "border border-teal-300 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 text-slate-800 dark:text-zinc-200 hover:border-indigo-400"
                            : "border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-indigo-400"
                        }`}
                      >
                        <span className="font-bold">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                        <span className="text-sm font-black">{date.getDate()}</span>
                        {hasSessionOnDay && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1 ${
                              selectedDate === d ? "bg-white" : "bg-teal-500"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Select Time Slot
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">({doctor.slotDuration || 20} mins)</span>
                </div>

                {slotsLoading ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-semibold">Loading availability…</div>
                ) : dynamicSlotTimes.length === 0 ? (
                  <div className="text-center py-5 text-slate-400 dark:text-zinc-500 text-xs font-semibold">
                    No sessions scheduled for this day.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {dynamicSlotTimes.map((time) => {
                      const slotInfo = getSlotInfo(time);
                      const isFull = slotInfo.isFull;
                      const bookedCount = slotInfo.totalCount || 0;
                      const isSelected = selectedSlot === time;

                      return (
                        <button
                          key={time}
                          disabled={isFull}
                          onClick={() => setSelectedSlot(time)}
                          className={`flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 rounded-2xl border font-bold transition-all text-center ${
                            isFull
                              ? "border-rose-200/80 bg-rose-50/60 dark:bg-rose-950/20 text-rose-400 cursor-not-allowed opacity-60"
                              : isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                              : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900"
                          }`}
                        >
                          <span className={`text-xs font-extrabold ${isFull ? "line-through" : ""}`}>{to12h(time)}</span>
                          <span className={`text-[9px] font-bold mt-0.5 ${
                            isSelected
                              ? "text-indigo-200"
                              : isFull
                              ? "text-rose-400"
                              : bookedCount > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {isFull ? "Fully Booked" : bookedCount > 0 ? `${bookedCount} booked` : "Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected Slot Occupancy Summary */}
                {selectedSlot && (() => {
                  const info = getSlotInfo(selectedSlot);
                  return (
                    <div className="mt-3 p-3 bg-indigo-50/60 dark:bg-zinc-800/50 rounded-2xl border border-indigo-100 dark:border-zinc-700/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1">
                          <Clock size={12} className="text-indigo-500" />
                          {to12h(selectedSlot)}
                        </span>
                        <span className={`font-extrabold text-[11px] ${
                          info.isFull
                            ? "text-rose-600 dark:text-rose-400"
                            : info.totalCount > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {info.isFull ? "Slot Full" : info.totalCount > 0 ? `${info.totalCount} confirmed booking${info.totalCount > 1 ? "s" : ""} for this slot` : "No other bookings yet"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-PK", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                  );
                })()}
              </div>



              {/* Visit Type */}
              <div className="mb-4">
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Visit Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Consultation</option>
                  <option>Follow-up</option>
                  <option>Check-up</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Reason / Symptoms (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Describe your symptoms or reason for visit…"
                  className="w-full rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Upload Screenshot */}
              {onlineFee > 0 && (
                <div className="mb-5 bg-indigo-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-zinc-700">
                  <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1 flex items-center justify-between">
                    <span>Payment Receipt Screenshot *</span>
                    {screenshot && <span className="text-[10px] text-emerald-600 font-bold">✓ File Selected</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files[0])}
                    className="w-full text-xs text-slate-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-bold hover:file:bg-indigo-700 cursor-pointer"
                  />
                </div>
              )}

              {/* Submit CTA */}
              <button
                onClick={handleBook}
                disabled={booking || !selectedSlot}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 transition-all shadow-md shadow-indigo-500/20"
              >
                {booking ? "Submitting Request…" : "Request Appointment Slot"}
              </button>
              </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
