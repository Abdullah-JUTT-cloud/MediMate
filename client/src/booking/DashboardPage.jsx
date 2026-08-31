import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  User,
  ChevronRight,
  Menu,
  LayoutGrid,
  List,
  Stethoscope,
  HeartPulse,
  Pill,
  Headphones,
  MessageCircle,
  MapPin,
  AlertCircle,
  Calendar,
  Banknote,
  Phone,
  Star,
  X,
} from "lucide-react";
import "./booking.css";
import MedalertoLogo from "./Logo";
import { GlassBar, MobileDrawer } from "./Nav";
import {
  Button,
  Badge,
  Card,
  Avatar,
  Sparkline,
  Reveal,
  EmptyState,
  StarRating,
} from "./ui";
import { cn } from "./cn";
import { layout, gradient } from "./theme";
import { PATIENT, BOOKINGS, bookingStats, HEALTH_TIPS, shortDate } from "./mockData";

/* ── Filter tab config ─────────────────────────────────────────────────────── */
const TABS = [
  { id: "ALL", label: "All" },
  { id: "Pending", label: "Pending" },
  { id: "Confirmed", label: "Confirmed" },
  { id: "Rejected", label: "Rejected" },
  { id: "Completed", label: "Completed" },
];

const STATUS_META = {
  Pending: { label: "Awaiting Staff Approval", icon: Clock, tone: "amber", spin: true },
  Confirmed: { label: "Booking Confirmed", icon: CheckCircle2, tone: "green" },
  Rejected: { label: "Rejected Request", icon: XCircle, tone: "rose" },
  Cancelled: { label: "Cancelled by you", icon: XCircle, tone: "rose" },
  Completed: { label: "Completed", icon: CheckCircle2, tone: "indigo" },
};

const REJECTED_STATUSES = ["Rejected", "Cancelled"];

const STAT_CARDS = [
  {
    key: "total",
    label: "Total Bookings",
    icon: CalendarDays,
    color: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-100 dark:bg-violet-500/15",
    spark: [2, 3, 4, 3, 5, 6, 6],
    trend: "2 new this week",
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    color: "text-amber-500 dark:text-amber-400",
    chip: "bg-amber-100 dark:bg-amber-500/15",
    spark: [3, 2, 3, 1, 2, 1, 1],
    trend: "Awaiting staff review",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-emerald-500 dark:text-emerald-400",
    chip: "bg-emerald-100 dark:bg-emerald-500/15",
    spark: [1, 2, 2, 3, 3, 4, 3],
    trend: "3 upcoming visits",
  },
  {
    key: "rejected",
    label: "Rejected / Cancelled",
    icon: XCircle,
    color: "text-rose-500 dark:text-rose-400",
    chip: "bg-rose-100 dark:bg-rose-500/15",
    spark: [0, 1, 0, 2, 1, 1, 1],
    trend: "1 needs your action",
  },
];

const QUICK_ACTIONS = [
  { label: "Book Appointment", desc: "Find & book a specialist", icon: Plus, to: "/book/doctors" },
  { label: "Find Doctors", desc: "Browse verified specialists", icon: Search, to: "/book/doctors" },
  { label: "My Profile", desc: "Manage your details", icon: User, to: "#profile" },
];

/* ── Mini month calendar for the reminders widget ──────────────────────────── */
function MiniCalendar({ reminders }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const reminderDays = new Set(
    reminders.map((r) => new Date(r.date + "T00:00:00").getDate())
  );
  const today = now.getDate();
  const week = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
        {week.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: first }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasReminder = reminderDays.has(day);
          const isToday = day === today;
          return (
            <span
              key={day}
              className={cn(
                "relative flex h-7 items-center justify-center rounded-lg text-[11px] font-semibold",
                isToday
                  ? "bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300"
              )}
            >
              {day}
              {hasReminder && !isToday && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-violet-500" />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Confirm modal (cancel booking) ────────────────────────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, title, text }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
          <AlertCircle size={22} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Keep Booking
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Cancel Booking
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Review modal ("Leave Feedback") ──────────────────────────────────────── */
function ReviewModal({ booking, open, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!open) return null;

  const submit = () => {
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }
    onSubmit(rating, comment);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="review-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Rate your visit
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {booking.doctorName} · {booking.specialization}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 text-center">
          <p className="mb-3 text-xs font-bold text-slate-600 dark:text-slate-300">
            How was your experience?
          </p>
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                aria-label={`${s} star${s > 1 ? "s" : ""}`}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={26}
                  className={
                    s <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                  }
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </p>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Share your experience to help other patients…"
            className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white"
          />
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit}>
            Submit Review
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Single booking card ───────────────────────────────────────────────────── */
function BookingCard({ booking, onCancel, onContact, onReview }) {
  const navigate = useNavigate();
  const meta = STATUS_META[booking.status] || STATUS_META.Confirmed;
  const StatusIcon = meta.icon;
  const isRejected = booking.status === "Rejected";
  const isPending = booking.status === "Pending";

  const metaItems = [
    { label: "Booking Date", value: shortDate(booking.date), icon: Calendar },
    { label: "Time Slot", value: booking.slot, icon: Clock },
    { label: "Visit Type", value: booking.type, icon: Stethoscope },
    { label: "Booking Charge", value: `Rs ${booking.fee.toLocaleString()}`, icon: Banknote },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Link
            to={`/book/doctors/${booking.doctorId}`}
            className="group flex items-center gap-3.5"
          >
            <Avatar name={booking.initials} size="lg" />
            <div>
              <h3 className="font-bold text-slate-900 transition group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                {booking.doctorName}
              </h3>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                {booking.specialization}
              </p>
            </div>
          </Link>

          <Badge tone={meta.tone} className="px-3 py-1.5 text-xs">
            <StatusIcon size={14} className={meta.spin ? "animate-spin" : ""} />
            {meta.label}
          </Badge>
        </div>

        {/* Rejection reason alert */}
        {isRejected && booking.rejectionReason && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <AlertCircle size={18} />
            </span>
            <div className="text-sm">
              <p className="font-bold text-rose-800 dark:text-rose-200">Reason for rejection</p>
              <p className="mt-0.5 font-medium text-rose-700 dark:text-rose-300">
                {booking.rejectionReason}
              </p>
              <p className="mt-1 text-xs text-rose-600/90 dark:text-rose-400/90">
                Please contact the clinic or re-book with an updated payment screenshot receipt.
              </p>
            </div>
          </div>
        )}

        {/* Meta grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metaItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/40"
            >
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <item.icon size={12} className="text-violet-500 dark:text-violet-400" />
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-sm font-bold text-slate-800 dark:text-slate-100",
                  item.label === "Booking Charge" && "text-violet-600 dark:text-violet-400"
                )}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-slate-700/50 dark:bg-slate-900/30 sm:px-6">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Ref ID: <span className="font-mono font-semibold">{booking.refId}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {isRejected && (
            <>
              <Button
                size="sm"
                onClick={() => navigate(`/book/doctors/${booking.doctorId}`)}
              >
                <Plus size={15} /> Re-book
              </Button>
              <Button size="sm" variant="outline" onClick={() => onContact(booking)}>
                <Phone size={14} /> Contact Clinic
              </Button>
            </>
          )}
          {isPending && (
            <Button size="sm" variant="danger" onClick={() => onCancel(booking)}>
              <XCircle size={14} /> Cancel Booking
            </Button>
          )}
          {booking.status === "Confirmed" && (
            <>
              <Button size="sm" variant="soft" onClick={() => onContact(booking)}>
                <MapPin size={14} /> Directions
              </Button>
              <Button size="sm" variant="outline" onClick={() => onContact(booking)}>
                <Phone size={14} /> Contact Clinic
              </Button>
            </>
          )}
          {booking.status === "Completed" && (
            <Button
              size="sm"
              disabled={booking.reviewed}
              onClick={() => onReview(booking)}
            >
              {booking.reviewed ? (
                <>
                  <CheckCircle2 size={14} /> Review Submitted
                </>
              ) : (
                <>
                  <StarRating value={5} size={13} /> Leave Feedback
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Dashboard page
 * ──────────────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL");
  const [view, setView] = useState("list");
  const [sort, setSort] = useState("newest");
  const [drawer, setDrawer] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [bookings, setBookings] = useState(BOOKINGS);

  const counts = {
    ALL: bookings.length,
    Pending: bookings.filter((b) => b.status === "Pending").length,
    Confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    Rejected: bookings.filter((b) => REJECTED_STATUSES.includes(b.status)).length,
    Completed: bookings.filter((b) => b.status === "Completed").length,
  };

  const filtered = useMemo(() => {
    let list =
      activeTab === "ALL"
        ? [...bookings]
        : bookings.filter((b) =>
            activeTab === "Rejected"
              ? REJECTED_STATUSES.includes(b.status)
              : b.status === activeTab
          );
    const order = sort === "oldest" ? 1 : -1;
    if (sort === "fee-high") list.sort((a, b) => b.fee - a.fee);
    else if (sort === "fee-low") list.sort((a, b) => a.fee - b.fee);
    else list.sort((a, b) => (a.date < b.date ? order : a.date > b.date ? -order : 0));
    return list;
  }, [bookings, activeTab, sort]);

  const upcoming = bookings.filter((b) => b.status === "Confirmed").slice(0, 3);

  const handleCancel = (b) => {
    setBookings((prev) =>
      prev.map((x) => (x.id === b.id ? { ...x, status: "Cancelled" } : x))
    );
  };

  const handleContact = () => {
    navigate("/book/doctors");
  };

  /* "Leave Feedback" — records the review locally and flips the completed
     booking into the "Review Submitted" (disabled) state. In the live portal
     the same action POSTs to /patient-account/reviews via the authenticated
     patient session; this mock preview keeps the identical UX with no
     backend running. */
  const handleReviewSubmit = (rating, comment) => {
    if (!reviewTarget) return;
    setBookings((prev) =>
      prev.map((x) =>
        x.id === reviewTarget.id ? { ...x, reviewed: true, rating, comment } : x
      )
    );
    toast.success("Thank you for your review!");
    setReviewTarget(null);
  };

  /* Quick actions / drawer links — real routes navigate, "#…" scrolls or toasts. */
  const handleLink = (to) => {
    setDrawer(false);
    if (to.startsWith("#")) {
      const el = document.getElementById(to.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      else toast.success("Coming soon in this preview");
      return;
    }
    navigate(to);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <GlassBar>
        <Link to="/" aria-label="MedAlerto home" className="shrink-0">
          <MedalertoLogo variant="patient" subtitle="PATIENT PORTAL" />
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/70 py-1.5 pl-1.5 pr-4 dark:border-slate-700 dark:bg-slate-800/70">
            <Avatar name={PATIENT.name} size="sm" online />
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {PATIENT.name}
              </p>
              <p className="text-[10px] font-medium text-slate-400">Patient</p>
            </div>
          </div>
          <Button onClick={() => navigate("/book/doctors")}>
            <Plus size={16} /> Book Appointment
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-600 transition hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </GlassBar>

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} label="Patient Portal">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <Avatar name={PATIENT.name} size="md" online />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{PATIENT.name}</p>
            <p className="text-xs text-slate-400">{PATIENT.email}</p>
          </div>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {[
            { label: "Dashboard", to: "/book/dashboard", active: true },
            { label: "Find Doctors", to: "/book/doctors" },
            { label: "My Appointments", to: "/book/dashboard" },
            { label: "My Profile", to: "#profile" },
            { label: "Help & Support", to: "#support" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleLink(item.to)}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition",
                item.active
                  ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {item.label}
              <ChevronRight size={16} />
            </button>
          ))}
        </nav>
        <div className="mt-6">
          <Button className="w-full" onClick={() => { setDrawer(false); navigate("/book/doctors"); }}>
            <Plus size={16} /> Book Appointment
          </Button>
        </div>
      </MobileDrawer>

      <main className={cn(layout.container, "pb-16")}>
        {/* ── Hero welcome banner ─────────────────────────────────────────── */}
        <Reveal>
          <section className="relative mt-6 overflow-hidden rounded-[2rem] text-white shadow-[0_20px_60px_-20px_rgba(76,29,149,0.5)]">
            <div className={cn("absolute inset-0", gradient.brand)} />
            <div className="ma-medical-pattern absolute inset-0 opacity-40" />
            {/* Glow blobs */}
            <div className="ma-pulse absolute -left-16 -top-16 h-64 w-64 rounded-full bg-violet-400/30 blur-3xl" />
            <div className="ma-pulse absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" style={{ animationDelay: "1.2s" }} />
            <div className="ma-pulse absolute right-1/3 top-0 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl" style={{ animationDelay: "2.4s" }} />

            {/* Floating medical icons */}
            <Stethoscope className="ma-float absolute right-[8%] top-10 h-10 w-10 text-white/25" aria-hidden="true" />
            <HeartPulse className="ma-float absolute left-[12%] top-8 h-8 w-8 text-white/20" style={{ animationDelay: "1.5s" }} aria-hidden="true" />
            <Pill className="ma-float absolute bottom-24 right-[18%] h-7 w-7 text-white/20" style={{ animationDelay: "3s" }} aria-hidden="true" />

            <div className="relative px-6 pb-32 pt-12 sm:px-10 sm:pt-16 lg:px-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-indigo-100 backdrop-blur-sm">
                <SparklesIcon /> Your care, organised
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.9rem]">
                Welcome back, {PATIENT.firstName} 👋
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium text-indigo-100/90 sm:text-base">
                Track your appointment requests, review booking status, and view doctor feedback — all in one calm, clear place.
              </p>
            </div>
          </section>
        </Reveal>

        {/* Quick action cards (overlaid) */}
        <div className="relative z-10 -mt-20 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <Reveal key={action.label} delay={i * 90}>
              <button
                type="button"
                onClick={() => handleLink(action.to)}
                className="ma-glass group flex w-full items-center gap-3.5 rounded-2xl p-4 text-left shadow-[0_8px_30px_-12px_rgba(76,29,149,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(124,58,237,0.4)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30">
                  <action.icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    {action.label}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {action.desc}
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500 dark:text-slate-600"
                />
              </button>
            </Reveal>
          ))}
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STAT_CARDS.map((stat, i) => {
            const value = bookingStats[stat.key];
            return (
              <Reveal key={stat.key} delay={i * 70}>
                <Card className="h-full p-4 sm:p-5" interactive>
                  <div className="flex items-start justify-between">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.chip)}>
                      <stat.icon size={20} className={stat.color} />
                    </span>
                    <Sparkline data={stat.spark} stroke={stat.key === "pending" ? "#F59E0B" : stat.key === "confirmed" ? "#10B981" : stat.key === "rejected" ? "#F43F5E" : "#7C3AED"} />
                  </div>
                  <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {stat.trend}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </section>

        {/* ── Filter bar (sticky under navbar) ────────────────────────────── */}
        <div className="sticky top-16 z-30 -mx-4 mt-10 border-y border-slate-200/70 bg-slate-50/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="ma-scroll-fade ma-no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-violet-500/50"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-extrabold",
                      activeTab === tab.id
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                    )}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort bookings"
                  className="appearance-none rounded-full border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs font-bold text-slate-600 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="fee-high">Fee: high to low</option>
                  <option value="fee-low">Fee: low to high</option>
                </select>
                <CalendarDays size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800/60">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="List view"
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition",
                    view === "list" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition",
                    view === "grid" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Booking cards ───────────────────────────────────────────────── */}
        <section className="mt-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon="🗓️"
              title="No appointments here"
              text={
                activeTab === "ALL"
                  ? "You haven't requested any appointments yet. Find a doctor to get started."
                  : `No bookings matching the "${activeTab}" filter.`
              }
              action={
                <Button onClick={() => setActiveTab("ALL")}>
                  <Plus size={16} /> Clear filters
                </Button>
              }
            />
          ) : (
            <div
              className={cn(
                "grid gap-4",
                view === "grid" && "md:grid-cols-2"
              )}
            >
              {filtered.map((b, i) => (
                <Reveal key={b.id} delay={Math.min(i, 4) * 60}>
                  <BookingCard
                    booking={b}
                    onCancel={(x) => setCancelTarget(x)}
                    onContact={handleContact}
                    onReview={(x) => setReviewTarget(x)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* ── Bottom widgets ──────────────────────────────────────────────── */}
        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Quick health tips carousel */}
          <Reveal className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Health Tips</h2>
                <p className="text-xs text-slate-400">Small habits, big difference</p>
              </div>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Daily wellness</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HEALTH_TIPS.map((tip, i) => (
                <Reveal key={tip.id} delay={i * 80}>
                  <Card interactive className="h-full p-5">
                    <span className="text-3xl" aria-hidden="true">
                      {tip.emoji}
                    </span>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{tip.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {tip.text}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* Reminders + support stack */}
          <div className="space-y-6">
            <Reveal>
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <CalendarDays size={16} className="text-violet-600 dark:text-violet-400" />
                    Upcoming Reminders
                  </h3>
                  <Badge tone="purple">{upcoming.length} upcoming</Badge>
                </div>
                <MiniCalendar reminders={upcoming} />
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
                  {upcoming.slice(0, 2).map((b) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900/40">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                        <Clock size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{b.doctorName}</p>
                        <p className="text-[11px] text-slate-400">{shortDate(b.date)} · {b.slot}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>

            <Reveal>
              <div id="support" className={cn("relative overflow-hidden rounded-2xl p-6 text-white", gradient.brand)}>
                <div className="ma-medical-pattern absolute inset-0 opacity-30" />
                <div className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <Headphones size={22} />
                  </span>
                  <h3 className="mt-3 text-base font-bold">Need help with a booking?</h3>
                  <p className="mt-1 text-xs leading-relaxed text-indigo-100/90">
                    Our care team is available 24/7 to help with payments, rescheduling or anything else.
                  </p>
                  <Button
                    variant="soft"
                    className="mt-4 bg-white text-violet-700 hover:bg-white/90 dark:bg-white dark:text-violet-700 dark:hover:bg-indigo-50"
                    onClick={handleContact}
                  >
                    <MessageCircle size={15} /> Talk to Support
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
        title="Cancel this booking?"
        text="Your slot will be released and the clinic will be notified. This action cannot be undone."
      />

      <ReviewModal
        booking={reviewTarget || {}}
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}

/* Small local helpers/icons */
function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM19 15l.9 2.4L22 18.3l-2.1.9L19 21.5l-.9-2.3L16 18.3l2.1-.9L19 15z" />
    </svg>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
