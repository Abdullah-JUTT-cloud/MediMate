import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import usePatientAccountStore from "../../store/patientAccountStore";
import BrandLogo from "../../components/BrandLogo";
import UserAvatar from "../../components/UserAvatar";
import {
  Clock,
  PlusCircle,
  LogOut,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Star,
  X,
  CalendarClock,
} from "lucide-react";

const STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO-SHOW",
};

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .replace(/_/g, "-")
    .toUpperCase();
}

function extractAppointments(payload) {
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.appointments)) return payload.appointments;
  return [];
}

function hasAppointmentList(payload) {
  return Array.isArray(payload?.bookings) || Array.isArray(payload?.appointments);
}

async function fetchPatientBookings() {
  try {
    const bookingsRes = await axios.get("/patient-account/bookings");
    if (hasAppointmentList(bookingsRes.data)) return extractAppointments(bookingsRes.data);
  } catch (err) {
    // Backward-compatible fallback for deployments that have not picked up the
    // new /bookings alias yet. Auth and server errors should still surface.
    if (err.response?.status && err.response.status !== 404) throw err;
  }

  const appointmentsRes = await axios.get("/patient-account/appointments");
  return extractAppointments(appointmentsRes.data);
}

function getAppointmentId(appointment) {
  return String(appointment?._id || appointment?.id || "");
}

function getDoctorId(appointment) {
  if (typeof appointment?.doctor === "string") return appointment.doctor;
  return String(appointment?.doctor?._id || appointment?.doctorId || "");
}

function getDoctorImageUrl(doctor) {
  const raw =
    doctor?.profilePicUrl ||
    doctor?.profilePicture ||
    doctor?.avatarUrl ||
    doctor?.avatar ||
    doctor?.image ||
    "";
  return typeof raw === "string" ? raw.trim() : "";
}

function hasSubmittedReview(appointment) {
  return Boolean(
    appointment?.reviewed ||
      appointment?.hasReview ||
      appointment?.reviewSubmitted ||
      appointment?.review?.isSubmitted
  );
}

function isRejectedOrCancelled(appointment) {
  const status = normalizeStatus(appointment?.status);
  return (
    status === STATUS.REJECTED ||
    status === STATUS.CANCELLED ||
    Boolean(appointment?.rejectionReason) ||
    appointment?.cancellationReason === "Payment Rejected"
  );
}

function formatAppointmentDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAppointmentFee(appointment) {
  return Number(
    appointment?.consultationFee ??
      appointment?.standardFee ??
      appointment?.onlineBookingFee ??
      appointment?.advanceBookingFee ??
      0
  );
}

export default function PatientDashboardPage() {
  const navigate = useNavigate();
  const clearPatientSession = usePatientAccountStore((state) => state.clearSession);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [patientUser, setPatientUser] = useState(null);

  // ── Review ("Leave Feedback") modal state ────────────────────────────────
  const [reviewTarget, setReviewTarget] = useState(null); // appointment being reviewed
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // ── Reschedule modal state ──────────────────────────────────────────────
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleDoctor, setRescheduleDoctor] = useState(null);
  const [rescheduleDays, setRescheduleDays] = useState([]);
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [apiSlots, setApiSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const DAY_NAMES_RES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const asArray = (v) => (Array.isArray(v) ? v : []);
  const parseTimeStr = (s) => {
    if (typeof s !== "string") return NaN;
    const m = s.trim().match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
  };
  const fmtTime = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  const to12h = (t24) => {
    if (!t24 || !t24.includes(":")) return t24;
    if (/AM|PM/i.test(t24)) return t24;
    const [h, m] = t24.split(":").map(Number);
    return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  const genSlots = (sessions, dur) => {
    const list = asArray(sessions);
    const d = Number(dur) > 0 ? Number(dur) : 20;
    if (!list.length) return [];
    const out = [];
    list.forEach((s) => {
      const st = parseTimeStr(s?.startTime);
      const en = parseTimeStr(s?.endTime);
      if (!Number.isFinite(st) || !Number.isFinite(en) || en <= st) return;
      for (let c = st; c + d <= en; c += d) out.push(fmtTime(c));
    });
    return [...new Set(out)].sort();
  };
  const getOperatingDays = (loc) => {
    const sessions = asArray(loc?.sessions);
    if (!sessions.length) return null;
    const ds = new Set();
    sessions.forEach((s) => { if (s?.day && DAY_NAMES_RES.includes(s.day)) ds.add(s.day); });
    return ds.size > 0 ? ds : null;
  };
  const dayNameOf = (ds) => DAY_NAMES_RES[new Date(ds + "T00:00:00").getDay()];
  const getNextDays = (n) => {
    const days = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const y = d.getFullYear(); const mo = String(d.getMonth() + 1).padStart(2, "0"); const da = String(d.getDate()).padStart(2, "0");
      days.push(`${y}-${mo}-${da}`);
    }
    return days;
  };
  const shortDay = (ds) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(ds + "T00:00:00").getDay()];

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [sessionRes, patientBookings] = await Promise.all([
          axios.get("/patient-account/me").catch(() => null),
          fetchPatientBookings(),
        ]);

        if (!mounted) return;
        setPatientUser(sessionRes?.data?.patient || null);
        setAppointments(patientBookings);
      } catch (err) {
        if (!mounted) return;
        setAppointments([]);
        if (err.response?.status === 401) {
          toast.error("Please sign in to view your appointments");
          navigate("/book/login", { state: { from: "/book/dashboard" }, replace: true });
        } else {
          toast.error(err.response?.data?.message || "Failed to load your appointments");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("/patient-account/logout");
      clearPatientSession();
      setPatientUser(null);
      toast.success("Logged out successfully");
      navigate("/book/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const cancel = async (appointment) => {
    const id = getAppointmentId(appointment);
    if (!id) return;
    if (!confirm("Are you sure you want to cancel this appointment request?")) return;
    setCancelling(id);
    try {
      await axios.patch(`/patient-account/appointments/${id}/cancel`, {});
      toast.success("Appointment cancelled");
      setAppointments((prev) =>
        prev.map((a) =>
          getAppointmentId(a) === id
            ? { ...a, status: "Cancelled", awaitingOnlineApproval: false, cancellationReason: "Patient" }
            : a
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancelling(null);
    }
  };

  // ── Review ("Leave Feedback") handlers ───────────────────────────────────
  const openReview = (appointment) => {
    if (!getAppointmentId(appointment) || !getDoctorId(appointment)) {
      toast.error("This appointment is missing review details. Please contact support.");
      return;
    }
    setReviewTarget(appointment);
    setReviewRating(0);
    setReviewComment("");
  };

  const closeReview = () => {
    if (reviewSubmitting) return;
    setReviewTarget(null);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    if (!reviewRating) {
      toast.error("Please select a star rating");
      return;
    }
    setReviewSubmitting(true);
    try {
      // POSTs through the authenticated patient session (axios sends the
      // `patientAccountToken` cookie; the server validates ownership + that
      // the appointment is Completed before saving).
      const appointmentId = getAppointmentId(reviewTarget);
      const doctorId = getDoctorId(reviewTarget);
      await axios.post("/patient-account/reviews", {
        appointmentId,
        doctorId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Thank you for your review!");
      // One review per appointment — mark it locally so the button flips to
      // the disabled "Review Submitted" state without a refetch.
      setAppointments((prev) =>
        prev.map((x) =>
          getAppointmentId(x) === appointmentId ? { ...x, reviewed: true, reviewSubmitted: true } : x
        )
      );
      setReviewTarget(null);
    } catch (err) {
      if (err.response?.status === 409) {
        const appointmentId = getAppointmentId(reviewTarget);
        setAppointments((prev) =>
          prev.map((x) =>
            getAppointmentId(x) === appointmentId ? { ...x, reviewed: true, reviewSubmitted: true } : x
          )
        );
        setReviewTarget(null);
      }
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Reschedule handlers ────────────────────────────────────────────────
  const openReschedule = async (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleDate("");
    setRescheduleSlot("");
    setRescheduleReason("");
    setGeneratedSlots([]);
    setApiSlots([]);
    setRescheduleDoctor(null);
    // Fetch doctor profile to get sessions + slotDuration
    try {
      const doctorId = getDoctorId(appointment);
      const { data } = await axios.get(`/public/doctors/${doctorId}`);
      setRescheduleDoctor(data.doctor || data);
      // Generate days from doctor's operating days
      const doc = data.doctor || data;
      const allLocations = [...asArray(doc?.clinics), ...asArray(doc?.hospitals)];
      const allDays = new Set();
      allLocations.forEach((loc) => {
        const ds = getOperatingDays(loc);
        if (ds) ds.forEach((d) => allDays.add(d));
      });
      const days7 = getNextDays(14);
      const filtered = allDays.size > 0 ? days7.filter((d) => allDays.has(dayNameOf(d))) : days7;
      setRescheduleDays(filtered);
    } catch {
      setRescheduleDays(getNextDays(14));
    }
  };

  const closeReschedule = () => {
    if (rescheduleLoading) return;
    setRescheduleTarget(null);
  };

  // When date changes: generate slots from sessions + fetch API availability
  useEffect(() => {
    if (!rescheduleDate || !rescheduleTarget) {
      setGeneratedSlots([]);
      setApiSlots([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setSlotsLoading(true);
      setRescheduleSlot("");
      const doctorId = getDoctorId(rescheduleTarget);
      // 1) Generate slot times from doctor's sessions
      let allSlots = [];
      if (rescheduleDoctor) {
        const allLocs = [...asArray(rescheduleDoctor?.clinics), ...asArray(rescheduleDoctor?.hospitals)];
        const dayNm = dayNameOf(rescheduleDate);
        allLocs.forEach((loc) => {
          const sessions = asArray(loc?.sessions).filter((s) => s?.day === dayNm);
          allSlots = [...allSlots, ...genSlots(sessions, rescheduleDoctor?.slotDuration || 20)];
        });
        allSlots = [...new Set(allSlots)].sort();
      }
      // 2) Fetch API availability
      let apiData = [];
      try {
        const { data } = await axios.get(`/public/doctors/${doctorId}/slots`, { params: { date: rescheduleDate } });
        apiData = Array.isArray(data?.slots) ? data.slots : [];
      } catch { /* ignore */ }
      if (cancelled) return;
      setGeneratedSlots(allSlots);
      setApiSlots(apiData);
      setSlotsLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [rescheduleDate, rescheduleTarget, rescheduleDoctor]);

  const submitReschedule = async () => {
    if (!rescheduleTarget) return;
    if (!rescheduleDate) {
      toast.error("Please select a new date");
      return;
    }
    if (!rescheduleSlot) {
      toast.error("Please select a time slot");
      return;
    }
    const appointmentId = getAppointmentId(rescheduleTarget);
    const status = normalizeStatus(rescheduleTarget.status);
    const isConfirmed = status === STATUS.CONFIRMED && !rescheduleTarget.awaitingOnlineApproval;
    if (isConfirmed && !rescheduleReason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }

    setRescheduleLoading(true);
    try {
      await axios.patch(`/patient-account/appointments/${appointmentId}/reschedule`, {
        newDate: rescheduleDate,
        newSlot: rescheduleSlot,
        reason: rescheduleReason.trim() || undefined,
      });
      toast.success(isConfirmed
        ? "Reschedule request sent to the doctor"
        : "Appointment rescheduled successfully"
      );
      // Update local state
      setAppointments((prev) =>
        prev.map((a) => {
          if (getAppointmentId(a) !== appointmentId) return a;
          return {
            ...a,
            date: rescheduleDate,
            slot: rescheduleSlot,
            isRescheduled: true,
            originalDate: a.date,
            originalSlot: a.slot,
            rescheduleReason: rescheduleReason.trim() || null,
            // CONFIRMED reschedules get bumped back to pending approval
            ...(isConfirmed
              ? { status: "Pending", awaitingOnlineApproval: true, awaitingRescheduleApproval: true }
              : {}),
          };
        })
      );
      setRescheduleTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reschedule");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Metrics counts — derived only from the live patient booking API.
  const summary = useMemo(() => {
    const counts = { total: appointments.length, pending: 0, confirmed: 0, completed: 0, rejected: 0 };
    appointments.forEach((appointment) => {
      const status = normalizeStatus(appointment.status);
      const terminal = [STATUS.CANCELLED, STATUS.REJECTED, STATUS.COMPLETED, STATUS.NO_SHOW].includes(status);
      if ((appointment.awaitingOnlineApproval || status === STATUS.PENDING) && !terminal) counts.pending += 1;
      if (status === STATUS.CONFIRMED) counts.confirmed += 1;
      if (status === STATUS.COMPLETED) counts.completed += 1;
      if (isRejectedOrCancelled(appointment)) counts.rejected += 1;
    });
    return counts;
  }, [appointments]);

  // Filtered List
  const filteredAppointments = useMemo(
    () =>
      appointments.filter((a) => {
        const status = normalizeStatus(a.status);
        if (activeTab === "ALL") return true;
        if (activeTab === "PENDING") {
          return (
            (a.awaitingOnlineApproval || status === STATUS.PENDING) &&
            ![STATUS.CANCELLED, STATUS.REJECTED, STATUS.COMPLETED, STATUS.NO_SHOW].includes(status)
          );
        }
        if (activeTab === "CONFIRMED") return status === STATUS.CONFIRMED;
        if (activeTab === "REJECTED") return isRejectedOrCancelled(a);
        if (activeTab === "COMPLETED") return status === STATUS.COMPLETED;
        return true;
      }),
    [appointments, activeTab]
  );

  const totalCount = summary.total;
  const pendingCount = summary.pending;
  const confirmedCount = summary.confirmed;
  const completedCount = summary.completed;
  const rejectedCount = summary.rejected;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 dark:from-zinc-950 dark:to-zinc-900 pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link
            to="/"
            aria-label="MedAlerto home"
            className="shrink-0 rounded-xl transition-opacity duration-300 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/70 focus-visible:ring-offset-2"
          >
            <BrandLogo variant="patient" markSize={34} subtitle="PATIENT PORTAL" />
          </Link>

          <div className="flex items-center gap-2">
            {patientUser && (
              /* Logged-in patient pill — safe avatar (initials fallback, never
                 a broken image) + name. */
              <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 mr-2 bg-zinc-100 dark:bg-zinc-800 pl-1 pr-3 py-1 rounded-full">
                <UserAvatar
                  src={patientUser?.image || patientUser?.avatar || ""}
                  name={patientUser?.name || "Patient"}
                  size={22}
                />
                {patientUser.name}
              </span>
            )}
            <button
              onClick={() => navigate("/book/doctors")}
              aria-label="Book Appointment"
              className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-2.5 py-2 min-[400px]:px-3.5 rounded-xl transition shadow-sm"
            >
              <PlusCircle size={15} />
              {/* Icon-only on the narrowest phones so the header fits 320px */}
              <span className="hidden min-[400px]:inline">Book Appointment</span>
            </button>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area — fluid from 320px up */}
      <main className="w-full max-w-7xl mx-auto px-4 pt-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Welcome back{patientUser?.name ? `, ${patientUser.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track your appointment requests, review booking status, and view doctor feedback.
          </p>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{totalCount}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/50 shadow-sm">
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} /> Pending Approval
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={12} /> Confirmed
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{confirmedCount}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50 shadow-sm">
            <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={12} /> Completed
            </p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{completedCount}</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {[
            { id: "ALL", label: `All (${totalCount})` },
            { id: "PENDING", label: `⏳ Pending (${pendingCount})` },
            { id: "CONFIRMED", label: `✅ Confirmed (${confirmedCount})` },
            { id: "COMPLETED", label: `✅ Completed (${completedCount})` },
            { id: "REJECTED", label: `❌ Rejected / Cancelled (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-md mx-auto my-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 text-2xl font-black">
              🗓️
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">No appointments found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-6">
              {activeTab === "ALL"
                ? "You haven't requested any medical appointments yet."
                : `No appointments matching the "${activeTab}" filter.`}
            </p>
            <button
              onClick={() => navigate("/book/doctors")}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md"
            >
              <PlusCircle size={15} />
              Book New Appointment
            </button>
          </div>
        ) : (
          /* Appointment Cards List */
          <div className="space-y-4">
            {filteredAppointments.map((a) => {
              const appointmentId = getAppointmentId(a);
              const status = normalizeStatus(a.status);
              const isPending = Boolean(a.awaitingOnlineApproval) || status === STATUS.PENDING;
              const isConfirmed = status === STATUS.CONFIRMED;
              const isCompleted = status === STATUS.COMPLETED;
              const isCancelled = status === STATUS.CANCELLED || status === STATUS.REJECTED;
              const alreadyReviewed = hasSubmittedReview(a);
              const doctorImageUrl = getDoctorImageUrl(a.doctor);
              const doctorName = a.doctor?.fullName || a.doctorName || "Medical Specialist";
              const doctorTitle = a.doctor?.title
                ? `${a.doctor.title} `
                : String(doctorName).startsWith("Dr.")
                ? ""
                : "Dr. ";
              const specialization = a.doctor?.specialization || a.specialization || "General Physician";
              const rejectionText =
                a.rejectionReason ||
                (a.cancellationReason === "Payment Rejected"
                  ? "Payment screenshot could not be verified by clinic staff"
                  : null);
              const fee = getAppointmentFee(a);

              return (
                <div
                  key={appointmentId || `${doctorName}-${a.date}-${a.slot}`}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                    {/* Doctor Info Header */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-lg shrink-0 overflow-hidden">
                        {doctorImageUrl ? (
                          <img src={doctorImageUrl} alt={doctorName} className="w-full h-full object-cover" />
                        ) : (
                          <Stethoscope size={22} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                          {doctorTitle}
                          {doctorName}
                        </h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {specialization}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-full text-xs font-bold">
                          <Clock size={13} className="animate-spin text-amber-500" />
                          ⏳ Awaiting Staff Approval
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-bold">
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          ✅ Booking Confirmed
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-full text-xs font-bold">
                          <XCircle size={13} className="text-rose-500" />
                          {rejectionText ? "❌ Rejected Request" : "Cancelled"}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-full text-xs font-bold">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason Alert Box (Crucial user request requirement!) */}
                  {isCancelled && rejectionText && (
                    <div className="mt-4 p-3.5 bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
                      <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide text-[10px]">
                          Reason for Rejection:
                        </p>
                        <p className="mt-0.5 font-medium leading-relaxed">{rejectionText}</p>
                        <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-400">
                          Please contact the clinic or re-book with a updated payment screenshot receipt.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px]">Booking Date</p>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {formatAppointmentDate(a.date)}
                      </p>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px]">Time Slot</p>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{a.slot || "Scheduled Slot"}</p>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px]">Visit Type</p>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{a.type || "Consultation"}</p>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px]">Booking Charge</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        Rs {fee.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Location Info */}
                  {(a.locationName || a.locationAddress) && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <svg className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{a.locationName}</span>
                      {a.locationAddress && (
                        <span className="text-zinc-400 dark:text-zinc-500">· {a.locationAddress}</span>
                      )}
                    </div>
                  )}

                  {/* Footer Actions & Cancellation */}
                  <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                    <p className="text-[11px] text-zinc-400">
                      Ref ID: <span className="font-mono">{appointmentId ? appointmentId.slice(-8) : "—"}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Leave Feedback — completed appointments only. Hidden
                          once a review has been submitted for this appointment
                          (server truth: `a.reviewed` from /patient-account/
                          bookings). */}
                      {isCompleted && !alreadyReviewed && (
                        <button
                          onClick={() => openReview(a)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 transition"
                        >
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          Leave Feedback
                        </button>
                      )}
                      {isCompleted && alreadyReviewed && (
                        <button
                          disabled
                          title="You have already submitted a review for this appointment"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 opacity-80 cursor-not-allowed"
                        >
                          <CheckCircle2 size={13} />
                          Review Submitted
                        </button>
                      )}
                      {(isPending || isConfirmed) && (
                        <button
                          onClick={() => openReschedule(a)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 transition"
                        >
                          <CalendarClock size={13} />
                          Reschedule
                        </button>
                      )}
                      {![STATUS.CANCELLED, STATUS.REJECTED, STATUS.COMPLETED, STATUS.NO_SHOW].includes(status) && (
                        <button
                          onClick={() => cancel(a)}
                          disabled={cancelling === appointmentId}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 transition disabled:opacity-50"
                        >
                          {cancelling === appointmentId ? "Cancelling…" : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Review Submission Modal ─────────────────────────────────────── */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            onClick={closeReview}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h3 id="review-modal-title" className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Rate your visit
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {reviewTarget.doctor?.title ? `${reviewTarget.doctor.title} ` : "Dr. "}
                  {reviewTarget.doctor?.fullName || reviewTarget.doctorName || "Medical Specialist"}
                  <span className="text-zinc-400 dark:text-zinc-500"> · {reviewTarget.doctor?.specialization || reviewTarget.specialization || "General Physician"}</span>
                </p>
              </div>
              <button
                onClick={closeReview}
                disabled={reviewSubmitting}
                aria-label="Close review modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {/* Star Rating */}
            <div className="mt-4 text-center">
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-2">
                How was your experience?
              </p>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    disabled={reviewSubmitting}
                    aria-label={`${s} star${s > 1 ? "s" : ""}`}
                    className="transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Star
                      size={26}
                      className={s <= reviewRating ? "text-amber-400 fill-amber-400" : "text-zinc-300 dark:text-zinc-600 fill-zinc-200 dark:fill-zinc-700"}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Comment (optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                disabled={reviewSubmitting}
                rows={3}
                maxLength={1000}
                placeholder="Share your experience to help other patients…"
                className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-60"
              />
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={closeReview}
                disabled={reviewSubmitting}
                className="flex-1 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={reviewSubmitting || !reviewRating}
                className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
              >
                {reviewSubmitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Appointment Modal ──────────────────────────────────── */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            onClick={closeReschedule}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-modal-title"
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h3 id="reschedule-modal-title" className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Reschedule Appointment
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {rescheduleTarget.doctor?.title ? `${rescheduleTarget.doctor.title} ` : "Dr. "}
                  {rescheduleTarget.doctor?.fullName || rescheduleTarget.doctorName || "Medical Specialist"}
                </p>
              </div>
              <button
                onClick={closeReschedule}
                disabled={rescheduleLoading}
                aria-label="Close reschedule modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current appointment info */}
            <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
              <p className="font-bold text-zinc-500 dark:text-zinc-400 uppercase text-[10px] mb-1">Current Appointment</p>
              <p className="text-zinc-800 dark:text-zinc-200">
                {formatAppointmentDate(rescheduleTarget.date)} at {rescheduleTarget.slot || "—"}
              </p>
            </div>

            {/* Date Selector — clickable day pills */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                New Date <span className="text-amber-500">*</span>
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {rescheduleDays.map((d) => {
                  const isSelected = rescheduleDate === d;
                  const dayNum = new Date(d + "T00:00:00").getDate();
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setRescheduleDate(d)}
                      disabled={rescheduleLoading}
                      className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-[11px] font-bold transition border ${
                        isSelected
                          ? "bg-amber-500 text-white border-amber-500 shadow-md"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-amber-400"
                      }`}
                    >
                      <span className="text-[9px] uppercase">{shortDay(d)}</span>
                      <span className="text-sm mt-0.5">{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Grid */}
            {rescheduleDate && (
              <div className="mt-3">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                  New Time Slot <span className="text-amber-500">*</span>
                </label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2 text-xs text-zinc-500">Loading slots...</span>
                  </div>
                ) : generatedSlots.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">Doctor is not available on this date</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                    {generatedSlots.map((time) => {
                      const apiInfo = apiSlots.find((s) => s.time === time) || {};
                      const booked = apiInfo.standardCount || 0;
                      const maxPerSlot = 3;
                      const remaining = maxPerSlot - booked;
                      const isFull = remaining <= 0;
                      const isSelected = rescheduleSlot === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => !isFull && setRescheduleSlot(time)}
                          disabled={isFull || rescheduleLoading}
                          className={`flex flex-col items-center px-2 py-1.5 rounded-lg text-[11px] font-semibold transition border ${
                            isSelected
                              ? "bg-amber-500 text-white border-amber-500 shadow-md"
                              : isFull
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-50"
                              : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-amber-400"
                          }`}
                        >
                          <span>{to12h(time)}</span>
                          <span className={`text-[9px] mt-0.5 ${isFull ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {isFull ? "Full" : `${remaining} left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Reason (required for confirmed, optional for pending) */}
            <div className="mt-3">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Reason {normalizeStatus(rescheduleTarget.status) === STATUS.CONFIRMED && !rescheduleTarget.awaitingOnlineApproval ? "(required)" : "(optional)"}
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                disabled={rescheduleLoading}
                rows={2}
                maxLength={500}
                placeholder="Why do you need to reschedule?"
                className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none disabled:opacity-60"
              />
            </div>

            {/* Info note for confirmed reschedules */}
            {normalizeStatus(rescheduleTarget.status) === STATUS.CONFIRMED && !rescheduleTarget.awaitingOnlineApproval && (
              <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-200">
                Your reschedule request will be sent to the doctor for approval. No additional payment is required.
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={closeReschedule}
                disabled={rescheduleLoading}
                className="flex-1 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                disabled={rescheduleLoading || !rescheduleDate || !rescheduleSlot}
                className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
              >
                {rescheduleLoading ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
