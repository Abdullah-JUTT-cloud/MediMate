import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  User,
  PlusCircle,
  LogOut,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Maximize2,
  ImageOff,
  Stethoscope,
  Building2,
  Phone,
  Star,
  X,
} from "lucide-react";

export default function PatientDashboardPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    // Check session info
    axios
      .get("/patient-account/me")
      .then(({ data }) => setPatientUser(data.patient))
      .catch(() => {});

    // Load appointments
    axios
      .get("/patient-account/appointments")
      .then(({ data }) => setAppointments(data.appointments || []))
      .catch(() => toast.error("Failed to load your appointments"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/patient-account/logout");
      toast.success("Logged out successfully");
      navigate("/book/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const cancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this appointment request?")) return;
    setCancelling(id);
    try {
      await axios.patch(`/patient-account/appointments/${id}/cancel`, {});
      toast.success("Appointment cancelled");
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "Cancelled", cancellationReason: "Patient" } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancelling(null);
    }
  };

  // ── Review ("Leave Feedback") handlers ───────────────────────────────────
  const openReview = (appointment) => {
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
      await axios.post("/patient-account/reviews", {
        appointmentId: reviewTarget._id,
        doctorId: reviewTarget.doctor?._id || reviewTarget.doctorId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Thank you for your review!");
      // One review per appointment — mark it locally so the button flips to
      // the disabled "Review Submitted" state without a refetch.
      setAppointments((prev) =>
        prev.map((x) => (x._id === reviewTarget._id ? { ...x, reviewed: true } : x))
      );
      setReviewTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Metrics counts
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.awaitingOnlineApproval).length;
  const confirmedCount = appointments.filter((a) => a.status === "Confirmed").length;
  const rejectedCount = appointments.filter(
    (a) => a.status === "Cancelled" && (a.rejectionReason || a.cancellationReason === "Payment Rejected")
  ).length;

  // Filtered List
  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return a.awaitingOnlineApproval;
    if (activeTab === "CONFIRMED") return a.status === "Confirmed";
    if (activeTab === "REJECTED")
      return a.status === "Cancelled" && (a.rejectionReason || a.cancellationReason === "Payment Rejected");
    if (activeTab === "COMPLETED") return a.status === "Completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 dark:from-zinc-950 dark:to-zinc-900 pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              M
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">MediMate</span>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 block -mt-1">
                Patient Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {patientUser && (
              <span className="hidden sm:inline-block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mr-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                👤 {patientUser.name}
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

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/50 shadow-sm">
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <XCircle size={12} /> Rejected / Cancelled
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{rejectedCount}</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {[
            { id: "ALL", label: `All (${totalCount})` },
            { id: "PENDING", label: `⏳ Pending (${pendingCount})` },
            { id: "CONFIRMED", label: `✅ Confirmed (${confirmedCount})` },
            { id: "REJECTED", label: `❌ Rejected (${rejectedCount})` },
            { id: "COMPLETED", label: `Completed` },
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
              const isPending = a.awaitingOnlineApproval;
              const isConfirmed = a.status === "Confirmed";
              const isCancelled = a.status === "Cancelled";
              const isCompleted = a.status === "Completed";
              const rejectionText = a.rejectionReason || (a.cancellationReason === "Payment Rejected" ? "Payment screenshot could not be verified by clinic staff" : null);

              return (
                <div
                  key={a._id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                    {/* Doctor Info Header */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-lg shrink-0 overflow-hidden">
                        {a.doctor?.profilePicUrl ? (
                          <img src={a.doctor.profilePicUrl} alt={a.doctor?.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <Stethoscope size={22} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                          {a.doctor?.title ? `${a.doctor.title} ` : "Dr. "}
                          {a.doctor?.fullName || "Medical Specialist"}
                        </h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {a.doctor?.specialization || "General Physician"}
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
                        {new Date(a.date).toLocaleDateString("en-PK", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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
                        Rs {(a.consultationFee || 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions & Cancellation */}
                  <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                    <p className="text-[11px] text-zinc-400">
                      Ref ID: <span className="font-mono">{a._id.slice(-8)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Leave Feedback — completed appointments only. Hidden
                          once a review has been submitted for this appointment
                          (server truth: `a.reviewed` from /patient-account/
                          appointments). */}
                      {isCompleted && !a.reviewed && (
                        <button
                          onClick={() => openReview(a)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 transition"
                        >
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          Leave Feedback
                        </button>
                      )}
                      {isCompleted && a.reviewed && (
                        <button
                          disabled
                          title="You have already submitted a review for this appointment"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 opacity-80 cursor-not-allowed"
                        >
                          <CheckCircle2 size={13} />
                          Review Submitted
                        </button>
                      )}
                      {!["Cancelled", "Completed", "No-show"].includes(a.status) && (
                        <button
                          onClick={() => cancel(a._id)}
                          disabled={cancelling === a._id}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 transition disabled:opacity-50"
                        >
                          {cancelling === a._id ? "Cancelling…" : "Cancel Booking"}
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
                  {reviewTarget.doctor?.fullName || "Medical Specialist"}
                  <span className="text-zinc-400 dark:text-zinc-500"> · {reviewTarget.doctor?.specialization || "General Physician"}</span>
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
    </div>
  );
}
