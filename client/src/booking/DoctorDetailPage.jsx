import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Hospital,
  Clock,
  Calendar,
  Check,
  Copy,
  CreditCard,
  ShieldCheck,
  Upload,
  X,
  MessageSquare,
  Star,
  BadgeCheck,
  Languages,
  Video,
  Lock,
  Headphones,
  ChevronRight,
  Receipt,
  Sun,
  Moon,
} from "lucide-react";
import useTheme from "../hooks/useTheme";
import "./booking.css";
import MedalertoLogo from "./Logo";
import { GlassBar } from "./Nav";
import {
  Button,
  Badge,
  Card,
  Avatar,
  Reveal,
  StarRating,
} from "./ui";
import { cn } from "./cn";
import { layout, gradient } from "./theme";
import { getDoctor, getSimilarDoctors, REVIEWS, dayOffset } from "./mockData";

/* ── Date & slot helpers ──────────────────────────────────────────────────── */
function to12h(time24) {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ampm}`;
}

function generateSlots(start, end, duration = 20) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const slots = [];
  for (let t = startMin; t + duration <= endMin; t += duration) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayNameFor = (iso) => DAY_NAMES[new Date(iso + "T00:00:00").getDay()];

/* ── Booking steps (for the "Step X of 5" indicator) ──────────────────────── */
const STEPS = ["Location", "Date & Time", "Visit Type", "Details", "Payment"];

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const doctor = getDoctor(id);

  // Declared at the top of the component, BEFORE any handler/step-indicator
  // that references it. Previously `const fee` was declared near the bottom of
  // the component body while `handleSubmit` and `activeStep` referenced it
  // above that declaration — the moment a patient selected a time slot the
  // re-render evaluated `fee > 0` inside the temporal dead zone and threw
  // `ReferenceError: Cannot access 'fee' before initialization`, crashing the
  // whole booking flow into the global ErrorBoundary ("Something went wrong").
  const fee = doctor?.onlineBookingFee || 0;

  const days7 = useMemo(() => Array.from({ length: 7 }, (_, i) => dayOffset(i)), []);

  const [locationType, setLocationType] = useState(
    doctor?.clinics?.length ? "Clinic" : "Hospital"
  );
  const [selectedDate, setSelectedDate] = useState(days7[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [type, setType] = useState("Consultation");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copied, setCopied] = useState(null);

  /* SEO title */
  useEffect(() => {
    document.title = `${doctor.title} ${doctor.fullName} — ${doctor.specialization} | Book Online | MedAlerto`;
  }, [doctor]);

  const locations = locationType === "Clinic" ? doctor.clinics || [] : doctor.hospitals || [];
  const location = locations[0];

  /* Operating weekdays for the selected facility */
  const operatingDays = useMemo(() => {
    const sessions = location?.sessions;
    if (!sessions?.length) return null; // null = open every day
    const set = new Set(sessions.map((s) => s.day));
    return set.size ? set : null;
  }, [location]);

  const dayOperates = (iso) => !operatingDays || operatingDays.has(dayNameFor(iso));

  /* Snap to the first operating day when the location toggles */
  useEffect(() => {
    if (!dayOperates(selectedDate)) {
      const next = days7.find((d) => dayOperates(d)) || days7[0];
      setSelectedDate(next);
      setSelectedSlot(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationType]);

  /* Slots for the selected day */
  const daySlots = useMemo(() => {
    const sessions = location?.sessions;
    if (sessions?.length) {
      const day = dayNameFor(selectedDate);
      const daySessions = sessions.filter((s) => s.day === day);
      if (daySessions.length) {
        return daySessions.flatMap((s) =>
          generateSlots(s.startTime, s.endTime, doctor.slotDuration || 20)
        );
      }
      return [];
    }
    // Standard availability fallback (no sessions configured)
    return generateSlots("09:00", "12:00", doctor.slotDuration || 20);
  }, [location, selectedDate, doctor.slotDuration]);

  /* First slot of the day is shown as already having 1 booking (demo). */
  const bookedSlot = daySlots[0];

  const copy = (text, field) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot to continue");
      return;
    }
    if (fee > 0 && !screenshot) {
      toast.error("Please attach your payment screenshot receipt");
      return;
    }
    toast.success("Appointment request submitted — we'll notify you once the clinic confirms.");
    navigate("/book/dashboard");
  };

  /* Step indicator — advances as the booking form is completed. */
  const activeStep = !selectedSlot ? 2 : fee > 0 && !screenshot ? 5 : 5;

  const reviews = REVIEWS[doctor.id] || [];
  const similar = getSimilarDoctors(doctor.id);

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-slate-50/80 pb-28 text-slate-900 lg:pb-16 dark:bg-slate-950 dark:text-slate-100">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <GlassBar>
        <button
          type="button"
          onClick={() => navigate("/book/doctors")}
          className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-bold text-slate-600 transition hover:text-violet-700 dark:text-slate-300 dark:hover:text-violet-300"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Doctors</span>
        </button>

        <Link to="/" className="shrink-0" aria-label="MedAlerto home">
          <MedalertoLogo badge={null} subtitle={null} markSize={32} />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/book/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
          >
            <Calendar size={14} />
            <span className="hidden sm:inline">My Appointments</span>
            <span className="sm:hidden">Appts</span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-600 transition hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </GlassBar>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <main className={cn(layout.container, "pt-8")}>
        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* LEFT (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Profile card */}
            <Reveal>
              <Card className="p-6 sm:p-8">
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <Avatar name={doctor.fullName} size="xl" online src={doctor.avatarUrl || doctor.profilePicUrl || ""} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        {doctor.title} {doctor.fullName}
                      </h1>
                      <BadgeCheck size={22} className="shrink-0 text-sky-500" aria-label="PMDC verified" />
                    </div>
                    <p className="mt-1 text-sm font-bold text-violet-600 dark:text-violet-400">
                      {doctor.specialization}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="slate">{doctor.yearsOfExperience} Years Experience</Badge>
                      <Badge tone="purple">{doctor.primaryDegree}</Badge>
                      {doctor.extraDegree && <Badge tone="indigo">{doctor.extraDegree}</Badge>}
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700/50">
                      <StarRating value={doctor.avgRating} />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {doctor.avgRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({doctor.reviewCount} patient {doctor.reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-700/50">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    <MapPin size={14} className="text-violet-500" /> Practice Locations & Schedules
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {doctor.clinics?.map((c, i) => (
                      <div
                        key={`c${i}`}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-teal-300 dark:border-slate-700/60 dark:bg-slate-900/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                            <Building2 size={11} /> Clinic
                          </span>
                          {c.phone && <span className="text-[11px] font-medium text-slate-400">{c.phone}</span>}
                        </div>
                        <h4 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
                          {c.address}
                        </p>
                      </div>
                    ))}
                    {doctor.hospitals?.map((h, i) => (
                      <div
                        key={`h${i}`}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-indigo-300 dark:border-slate-700/60 dark:bg-slate-900/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                            <Hospital size={11} /> Hospital
                          </span>
                          {h.phone && <span className="text-[11px] font-medium text-slate-400">{h.phone}</span>}
                        </div>
                        <h4 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">{h.name}</h4>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
                          {h.address}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* About doctor */}
            <Reveal>
              <Card className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">About Dr. {doctor.fullName.split(" ").slice(-1)[0]}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {doctor.bio}
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <Languages size={13} className="text-violet-500" /> Languages
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {doctor.languages.map((l) => (
                        <span key={l} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <Video size={13} className="text-indigo-500" /> Consultation Modes
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {doctor.modes.map((m) => (
                        <span key={m} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <StethoscopeSmall /> Specialisation
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{doctor.specialization}</p>
                    <p className="text-[11px] text-slate-400">Acne · Eczema · Hair & skin care</p>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* Reviews */}
            <Reveal>
              <Card className="p-6 sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                    <MessageSquare size={18} className="text-violet-600 dark:text-violet-400" />
                    Patient Reviews
                  </h2>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/50 dark:bg-slate-900/40"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StarRating value={r.rating} />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{r.rating}.0</span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-400">{r.date}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium italic leading-relaxed text-slate-600 dark:text-slate-300">
                          “{r.comment}”
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-400">— {r.author}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No reviews yet.</p>
                )}

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-4 dark:border-violet-500/30 dark:bg-violet-500/5">
                  <Star size={20} className="shrink-0 fill-amber-400 text-amber-400" />
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Had a visit? Your feedback helps other patients choose with confidence.
                  </p>
                </div>
              </Card>
            </Reveal>

            {/* Similar doctors */}
            {similar.length > 0 && (
              <Reveal>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Similar Doctors</h2>
                  <Link to="/book/doctors" className="text-xs font-bold text-violet-600 hover:underline dark:text-violet-400">
                    View all
                  </Link>
                </div>
                <div className="ma-scroll-fade ma-no-scrollbar flex gap-4 overflow-x-auto pb-2">
                  {similar.map((s) => (
                    <Link
                      key={s.id}
                      to={`/book/doctors/${s.id}`}
                      className="group w-64 shrink-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(124,58,237,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_16px_36px_-14px_rgba(124,58,237,0.28)] dark:border-slate-700/60 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={s.fullName} size="md" online />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {s.title} {s.fullName}
                          </p>
                          <p className="text-xs text-violet-600 dark:text-violet-400">{s.specialization}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <StarRating value={s.avgRating} size={13} />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {s.avgRating.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-slate-400">({s.reviewCount})</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-700/50">
                        <span className="font-bold text-slate-500 dark:text-slate-400">
                          Rs {s.onlineBookingFee.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-violet-600 transition group-hover:gap-2 dark:text-violet-400">
                          View <ChevronRight size={14} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          {/* RIGHT (4 cols, sticky on desktop) */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:col-span-4">
            {/* Payment account card */}
            {fee > 0 && (
              <Reveal>
                <div
                  className={cn(
                    "ma-glow-border relative overflow-hidden rounded-[1.75rem] p-6 text-white",
                    gradient.dark
                  )}
                >
                  <div className="ma-medical-pattern absolute inset-0 opacity-20" />
                  <div className="ma-pulse absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400/25 blur-3xl" />
                  <div className="relative">
                    <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                        <CreditCard size={16} /> Payment Account
                      </span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-black text-white ring-1 ring-white/20">
                        Rs {fee.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-slate-300">
                      Transfer the online fee to the doctor's bank account below and attach the payment screenshot to complete your booking.
                    </p>
                    <div className="mt-4 space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs backdrop-blur-sm">
                      {[
                        { label: "Bank", value: doctor.payment.bank, copyable: false },
                        { label: "Account Title", value: doctor.payment.accountTitle, copyable: false },
                        { label: "Account No", value: doctor.payment.accountNumber, copyable: true, field: "Account Number" },
                        { label: "IBAN", value: doctor.payment.iban, copyable: true, field: "IBAN" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-slate-400">{row.label}:</span>
                          <span className="min-w-0 flex items-center gap-2">
                            <span className="truncate font-mono font-bold text-indigo-100">{row.value}</span>
                            {row.copyable && (
                              <button
                                type="button"
                                onClick={() => copy(row.value, row.field)}
                                aria-label={`Copy ${row.field}`}
                                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                              >
                                {copied === row.field ? (
                                  <Check size={14} className="text-emerald-400" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Booking card */}
            <Reveal>
              <Card className="p-6">
                {/* Header + step indicator */}
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                    <Calendar size={18} className="text-violet-600 dark:text-violet-400" />
                    Book Appointment
                  </h2>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-extrabold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    Step {activeStep} of 5
                  </span>
                </div>
                {/* Step dots */}
                <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
                  {STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        i + 1 <= activeStep
                          ? "bg-gradient-to-r from-violet-600 to-indigo-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  ))}
                </div>

                {/* Step 1 — location */}
                <div className="mb-5">
                  <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    1 · Select Practice Location
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900/50">
                    {[
                      { type: "Clinic", label: "Clinic", icon: Building2, show: doctor.clinics?.length > 0 },
                      { type: "Hospital", label: "Hospital", icon: Hospital, show: doctor.hospitals?.length > 0 },
                    ]
                      .filter((o) => o.show)
                      .map((o) => (
                        <button
                          key={o.type}
                          type="button"
                          onClick={() => {
                            setLocationType(o.type);
                            setSelectedSlot(null);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all",
                            locationType === o.type
                              ? "bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-300"
                              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                          )}
                        >
                          <o.icon size={15} /> {o.label}
                        </button>
                      ))}
                  </div>

                  {location && (
                    <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-3.5 text-xs dark:border-violet-500/20 dark:bg-violet-500/5">
                      <p className="font-bold text-slate-900 dark:text-white">{location.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <MapPin size={12} className="shrink-0" /> {location.address}
                      </p>
                      {location.hours && (
                        <p className="mt-1.5 flex items-center gap-1 font-bold text-teal-700 dark:text-teal-300">
                          <Clock size={12} /> Hours: {location.hours}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2 — date */}
                <div className="mb-5">
                  <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    2 · Select Date
                  </label>
                  <div className="ma-scroll-fade ma-no-scrollbar flex gap-2 overflow-x-auto pb-2">
                    {days7.map((d) => {
                      const date = new Date(d + "T00:00:00");
                      const operates = dayOperates(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={!operates}
                          onClick={() => {
                            setSelectedDate(d);
                            setSelectedSlot(null);
                          }}
                          className={cn(
                            "flex min-w-[58px] shrink-0 flex-col items-center rounded-2xl px-3 py-2.5 text-xs transition-all",
                            selectedDate === d
                              ? "bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30"
                              : operates
                                ? "border border-slate-200 bg-white text-slate-700 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                                : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900"
                          )}
                        >
                          <span className="font-bold">
                            {date.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className="text-base font-black">{date.getDate()}</span>
                          <span className={cn("mt-0.5 text-[8px] font-extrabold uppercase tracking-wide", selectedDate === d ? "text-white/80" : operates ? "text-emerald-500" : "text-slate-400")}>
                            {operates ? "Open" : "Closed"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3 — time slots */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      3 · Select Time Slot
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">({doctor.slotDuration || 20} mins)</span>
                  </div>

                  {!dayOperates(selectedDate) ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 py-6 text-center text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900/40">
                      This facility is closed on {dayNameFor(selectedDate)}. Pick an “Open” day.
                    </div>
                  ) : (
                    <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {daySlots.map((time) => {
                        const isFull = time === bookedSlot;
                        const isSelected = selectedSlot === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlot(time)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-0.5 rounded-2xl border py-2.5 font-bold transition-all",
                              isFull
                                ? "cursor-not-allowed border-rose-200 bg-rose-50/70 text-rose-400 opacity-70 dark:border-rose-500/30 dark:bg-rose-500/10"
                                : isSelected
                                  ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-500/30"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50/50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-violet-500/50"
                            )}
                          >
                            <span className={cn("text-xs font-extrabold", isFull && "line-through")}>
                              {to12h(time)}
                            </span>
                            <span
                              className={cn(
                                "text-[9px] font-bold",
                                isSelected ? "text-violet-200" : isFull ? "text-rose-400" : "text-emerald-500"
                              )}
                            >
                              {isFull ? "1 booked" : "Available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 4 — visit type */}
                <div className="mb-4">
                  <label htmlFor="visit-type" className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    4 · Visit Type
                  </label>
                  <select
                    id="visit-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
                  >
                    <option>Consultation</option>
                    <option>Follow-up</option>
                    <option>Check-up</option>
                  </select>
                </div>

                {/* Step 5 — reason */}
                <div className="mb-4">
                  <label htmlFor="reason" className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    5 · Reason / Symptoms <span className="font-semibold normal-case text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="reason"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe your symptoms or reason for visit..."
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>

                {/* Step 6 — payment screenshot */}
                {fee > 0 && (
                  <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-3.5 dark:border-violet-500/20 dark:bg-violet-500/5">
                    <label className="mb-2 flex items-center justify-between text-xs font-bold text-violet-900 dark:text-violet-200">
                      <span className="flex items-center gap-1.5">
                        <Receipt size={14} /> Payment Receipt Screenshot <span className="text-rose-500">*</span>
                      </span>
                      {screenshot && <span className="text-[10px] font-bold text-emerald-600">✓ Attached</span>}
                    </label>
                    {!previewUrl ? (
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-white px-4 py-3 text-xs font-bold text-violet-600 transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-500/40 dark:bg-slate-900/40 dark:text-violet-300">
                        <Upload size={15} /> Choose File
                        <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3">
                        <img
                          src={previewUrl}
                          alt="Payment receipt preview"
                          className="h-14 w-14 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{screenshot.name}</p>
                          <p className="text-[10px] text-slate-400">Receipt uploaded</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null);
                            setPreviewUrl(null);
                          }}
                          aria-label="Remove screenshot"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!selectedSlot}
                  onClick={handleSubmit}
                >
                  <ShieldCheck size={17} /> Request Appointment Slot
                </Button>

                {/* Trust row */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1"><Lock size={12} /> Secure Payment</span>
                  <span className="flex items-center gap-1"><BadgeCheck size={12} className="text-sky-500" /> PMDC Verified</span>
                  <span className="flex items-center gap-1"><Headphones size={12} /> 24/7 Support</span>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </main>

      {/* ── Mobile sticky bottom CTA ─────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden dark:border-slate-700 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3">
          <div className="shrink-0 leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Online fee</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">Rs {fee.toLocaleString()}</p>
          </div>
          <Button className="flex-1" disabled={!selectedSlot} onClick={handleSubmit}>
            <ShieldCheck size={16} /> Request Appointment Slot
          </Button>
        </div>
      </div>
    </div>
  );
}

function StethoscopeSmall() {
  return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500" aria-hidden="true"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></svg>;
}
