import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
  CalendarCheck2,
  ImageOff,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import {
  computeConsultationFee,
  buildFeeFieldHint,
  buildCollectNowNote,
  formatPkr,
} from "../utils/consultationFee";

// ─── Shared Design Tokens ────────────────────────────────────────────────────
const CARD =
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm";

const BADGE_BASE =
  "inline-flex items-center whitespace-nowrap font-bold px-3 py-1 rounded-full text-xs border";

const STATUS_CLASSES = {
  Pending:
    "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/50",
  Confirmed:
    "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-100 dark:border-teal-400/50",
  Cancelled:
    "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-100 dark:border-rose-400/50",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PaymentScreenshot({ url }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotateRight = () => setRotation((r) => (r + 90) % 360);
  const handleRotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);

  if (!url) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <ImageOff size={14} />
        No screenshot uploaded
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          handleReset();
          setOpen(true);
        }}
        className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 w-20 h-20 shrink-0 bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-indigo-400 transition"
        title="View payment proof in Lightbox"
      >
        {error ? (
          <div className="flex items-center justify-center w-full h-full">
            <ImageOff size={20} className="text-slate-400" />
          </div>
        ) : (
          <img
            src={url}
            alt="Payment proof"
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
          <Maximize2 size={14} />
          Zoom View
        </div>
      </button>

      {/* Lightbox Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-4xl w-full max-h-[92dvh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Controls */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800 shrink-0">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔍</span> High-Resolution Payment Screenshot
              </p>

              {/* Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono font-bold text-indigo-400 px-2 min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <button
                  onClick={handleRotateLeft}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  title="Rotate Left"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={handleRotateRight}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  title="Rotate Right"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 hover:bg-slate-700 rounded-lg transition"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-sm font-bold transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 min-h-[400px] bg-slate-950/50 rounded-2xl mt-3">
              <img
                src={url}
                alt="Payment proof high resolution"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="max-h-[65dvh] max-w-full object-contain rounded-xl shadow-2xl cursor-grab active:cursor-grabbing"
                onError={() => setError(true)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BookingCard({ booking, onApproveClick, onRejectClick, actioning }) {
  const [expanded, setExpanded] = useState(false);
  const status = booking.awaitingOnlineApproval ? "Pending" : booking.status;
  const screenshotUrl = booking.paymentScreenshotUrl || booking.paymentScreenshot;
  const isRejected = booking.status === "Cancelled";

  // Fee readout, same rules as the approval modal:
  //  • `advanceAmountPaid` = what the patient already sent online (part of the
  //    bill, never a discount and never an extra payment).
  //  • The billed total only exists once the booking is approved (a pending row's
  //    `consultationFee` is just the advance seeded by the booking flow), and it
  //    is always the FULL price — the cash still owed is the difference.
  const paidOnline = Number(
    booking.advanceAmountPaid ??
      (booking.awaitingOnlineApproval ? booking.consultationFee : 0),
  ) || 0;
  const billedTotal = booking.awaitingOnlineApproval
    ? 0
    : Number(booking.netAmount ?? booking.consultationFee ?? 0) || 0;
  const collectAtVisit = Math.max(0, billedTotal - paidOnline);

  return (
    <div className={`${CARD} overflow-hidden`}>
      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Payment screenshot thumbnail */}
          <PaymentScreenshot url={screenshotUrl} />

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {booking.patientAccount?.name ||
                    booking.patient?.name ||
                    "Unknown Patient"}
                </p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {booking.patientAccount?.phone ||
                    booking.patient?.phone ||
                    ""}
                </p>
              </div>
              <span className={`${BADGE_BASE} ${STATUS_CLASSES[status] || STATUS_CLASSES.Pending}`}>
                {status === "Pending" ? "⏳ Awaiting Approval" : status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                  Date
                </p>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                  {formatDate(booking.date)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                  Slot
                </p>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                  {booking.slot || "—"}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                  Type
                </p>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                  {booking.type || "—"}
                </p>
              </div>
              {paidOnline > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-700">
                  <p className="text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide text-[10px]">
                    Paid Online (Advance)
                  </p>
                  <p className="font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                    Rs {paidOnline.toLocaleString()}
                  </p>
                </div>
              )}
              {billedTotal > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 border border-emerald-200 dark:border-emerald-700">
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide text-[10px]">
                    Billed Total
                  </p>
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Rs {billedTotal.toLocaleString()}
                  </p>
                  {collectAtVisit > 0 ? (
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-300 mt-0.5">
                      Collect Rs {collectAtVisit.toLocaleString()} at the visit
                    </p>
                  ) : (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 mt-0.5">
                      Covered by the advance
                    </p>
                  )}
                </div>
              )}
              {booking.payAtConsultation && billedTotal === 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                    Price
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    Set at consultation
                  </p>
                </div>
              )}
            </div>

            {/* Reschedule Info Banner */}
            {booking.isRescheduled && booking.awaitingOnlineApproval && (
              <div className="mt-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-2.5 text-xs text-amber-900 dark:text-amber-200 font-medium flex items-start gap-2">
                <span className="shrink-0 mt-0.5">🔄</span>
                <div>
                  <span className="font-bold">Reschedule Request</span>
                  {booking.originalDate && booking.originalSlot && (
                    <p className="mt-0.5">
                      Original: {formatDate(booking.originalDate)} at {booking.originalSlot} → New: {formatDate(booking.date)} at {booking.slot}
                    </p>
                  )}
                  {booking.rescheduleReason && (
                    <p className="mt-1 text-amber-800 dark:text-amber-300">
                      <span className="font-bold">Reason:</span> {booking.rescheduleReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Rejection Reason Banner if rejected */}
            {isRejected && booking.rejectionReason && (
              <div className="mt-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-2.5 text-xs text-rose-900 dark:text-rose-200 font-medium flex items-start gap-2">
                <span className="shrink-0 mt-0.5">❌</span>
                <div>
                  <span className="font-bold">Rejection Reason:</span> {booking.rejectionReason}
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
                >
                  {expanded ? (
                    <ChevronUp size={13} />
                  ) : (
                    <ChevronDown size={13} />
                  )}
                  {expanded ? "Hide notes" : "View notes"}
                </button>
                {expanded && (
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                    {booking.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {booking.awaitingOnlineApproval ? (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onApproveClick(booking)}
              disabled={actioning === booking._id}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm"
            >
              <CheckCircle size={16} />
              {actioning === booking._id ? "Processing…" : "Approve & Set Fee"}
            </button>
            <button
              onClick={() => onRejectClick(booking)}
              disabled={actioning === booking._id}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm"
            >
              <XCircle size={16} />
              {actioning === booking._id ? "Processing…" : "Reject"}
            </button>
          </div>
        ) : isRejected ? (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onApproveClick(booking)}
              disabled={actioning === booking._id}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm"
            >
              <CheckCircle size={16} />
              {actioning === booking._id ? "Processing…" : "Re-Approve & Set Fee"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OnlineBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [rejectedBookings, setRejectedBookings] = useState([]);
  const [showRejectedDropdown, setShowRejectedDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Approval Modal state
  const [approvingBooking, setApprovingBooking] = useState(null);
  // The FULL price for the visit (the online advance is part of it, never a
  // deduction), so an unapproved booking starts empty rather than pre-filled
  // with the advance amount — that was the source of "500 vs 2000" mistakes.
  const [checkupPrice, setCheckupPrice] = useState("");
  // "Pay at consultation" — approve the booking without a final price; the
  // doctor sets the fee at the visit (the online advance is already tracked
  // via the payment proof).
  const [payAtConsultation, setPayAtConsultation] = useState(false);

  // Rejection Modal state
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("Payment screenshot could not be verified");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/appointments/online-pending");
      const data = Array.isArray(res.data?.appointments)
        ? res.data.appointments
        : Array.isArray(res.data)
        ? res.data
        : [];
      const rejectedData = Array.isArray(res.data?.rejectedAppointments)
        ? res.data.rejectedAppointments
        : [];
      setBookings(data);
      setRejectedBookings(rejectedData);
      setPendingCount(data.filter((b) => b.awaitingOnlineApproval).length);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load online bookings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const openApproveModal = (booking) => {
    setApprovingBooking(booking);
    // Only carry over a price that was actually billed (a re-approval of a
    // rejected booking). For a first-time approval `consultationFee` is just
    // the advance the patient sent, so pre-filling it would tempt the doctor
    // into approving the visit at the advance price.
    const alreadyBilled = !booking.awaitingOnlineApproval
      ? Number(booking.netAmount ?? booking.consultationFee ?? 0)
      : 0;
    setCheckupPrice(alreadyBilled > 0 ? String(alreadyBilled) : "");
    setPayAtConsultation(false);
  };

  const handleConfirmApprove = async () => {
    if (!approvingBooking) return;
    const id = approvingBooking._id;
    const priceNum = Number(checkupPrice);

    // With "Pay at consultation" ON the fee is not known yet — no price is
    // required and none is sent. Otherwise an explicit full price is REQUIRED:
    // an empty field must never be silently approved as Rs 0 (Number("") is
    // 0, so the old isNaN check alone could bill a visit for free).
    if (
      !payAtConsultation &&
      (String(checkupPrice).trim() === "" || !Number.isFinite(priceNum) || priceNum < 0)
    ) {
      return toast.error("Enter the full consultation price for this visit");
    }

    setActioning(id);
    try {
      await axiosInstance.patch(`/appointments/${id}/approve-online`, {
        ...(payAtConsultation
          ? { payAtConsultation: true }
          : { checkupPrice: priceNum }),
      });
      toast.success(
        payAtConsultation
          ? advancePaid > 0
            ? `Appointment approved! ${formatPkr(advancePaid)} already received — the doctor will enter the full price at consultation and collect the rest.`
            : "Appointment approved! The doctor will set the fee at consultation."
          : approvalFeeCalc.balanceDue > 0
            ? `Approved! ${formatPkr(approvalFeeCalc.netAmount)} logged to Revenue & Queue — collect ${formatPkr(approvalFeeCalc.balanceDue)} from the patient at the visit.`
            : `Approved! ${formatPkr(approvalFeeCalc.netAmount)} logged to Revenue & Queue — fully covered by the online advance.`,
        { duration: 6000 },
      );
      setBookings((prev) =>
        prev.map((b) =>
          b._id === id
            ? {
                ...b,
                awaitingOnlineApproval: false,
                status: "Confirmed",
                // Deferred fee: the price is not known yet — clear the
                // pre-populated booking fee so no stale price is displayed.
                // Charge-now: store the FULL price (the advance never reduces
                // it) so the card and the queue agree with the ledger.
                consultationFee: payAtConsultation ? 0 : approvalFeeCalc.netAmount,
                netAmount: payAtConsultation ? 0 : approvalFeeCalc.netAmount,
                standardFee: payAtConsultation ? 0 : approvalFeeCalc.standardFee,
                advanceAmountPaid: approvalFeeCalc.advanceAmountPaid,
                payAtConsultation,
              }
            : b
        )
      );
      setRejectedBookings((prev) => prev.filter((b) => b._id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
      setApprovingBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve booking");
    } finally {
      setActioning(null);
    }
  };

  const openRejectModal = (booking) => {
    setRejectingBooking(booking);
    setRejectReason("Payment screenshot could not be verified");
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    const id = rejectingBooking._id;

    setActioning(id);
    try {
      await axiosInstance.patch(`/appointments/${id}/reject-online`, {
        reason: rejectReason,
      });
      toast.success("Booking request rejected");
      const rejectedObj = bookings.find((b) => b._id === id);
      if (rejectedObj) {
        setRejectedBookings((prev) => [
          {
            ...rejectedObj,
            awaitingOnlineApproval: false,
            status: "Cancelled",
            rejectionReason: rejectReason,
          },
          ...prev.filter((b) => b._id !== id),
        ]);
      }
      setBookings((prev) => prev.filter((b) => b._id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
      setRejectingBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject booking");
    } finally {
      setActioning(null);
    }
  };

  const pendingBookings = bookings.filter((b) => b.awaitingOnlineApproval);
  const processedBookings = bookings.filter((b) => !b.awaitingOnlineApproval && b.status !== "Cancelled");

  // What the patient already sent online for the booking being approved. The
  // server mirrors the verified proof amount onto `advanceAmountPaid`; the
  // fallback covers rows created before that (where the seeded consultationFee
  // WAS the advance).
  const advancePaid = Number(
    approvingBooking?.advanceAmountPaid ?? approvingBooking?.consultationFee ?? 0,
  ) || 0;
  // The approval modal takes the FULL price, so the live breakdown is the same
  // formula the consultation workspace and the server use.
  const approvalFeeCalc = computeConsultationFee({
    standardFee: checkupPrice,
    discountAmount: approvingBooking?.discountAmount ?? 0,
    advanceAmountPaid: advancePaid,
  });
  const approvalFeeNote = advancePaid > 0
    ? buildCollectNowNote({
        standardFee: checkupPrice,
        discountAmount: approvingBooking?.discountAmount ?? 0,
        advanceAmountPaid: advancePaid,
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck2
              size={24}
              className="text-indigo-600 dark:text-indigo-400"
            />
            Online Approvals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review online payment screenshots, set checkup prices, and issue appointments directly into the Doctor Queue.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl transition shrink-0"
        >
          <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Pending section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Awaiting Approval
              </h2>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5">
                  {pendingCount}
                </span>
              )}
            </div>

            {pendingBookings.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center">
                <Clock
                  size={32}
                  className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  No pending approval requests
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  New online booking requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    onApproveClick={openApproveModal}
                    onRejectClick={openRejectModal}
                    actioning={actioning}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Rejected section accordion dropdown */}
          {rejectedBookings.length > 0 && (
            <div className="mb-8 border border-rose-200 dark:border-rose-900/60 rounded-2xl overflow-hidden bg-rose-50/30 dark:bg-rose-950/20 transition-all">
              <button
                onClick={() => setShowRejectedDropdown((p) => !p)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition"
              >
                <div className="flex items-center gap-2.5">
                  <XCircle size={18} className="text-rose-500" />
                  <span className="text-sm">Rejected Bookings</span>
                  <span className="bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {rejectedBookings.length}
                  </span>
                </div>
                {showRejectedDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showRejectedDropdown && (
                <div className="p-4 pt-0 space-y-4 border-t border-rose-200/60 dark:border-rose-900/40">
                  <p className="text-xs text-slate-500 dark:text-slate-400 my-2">
                    Review rejected booking details below. You can re-approve any rejected booking if needed.
                  </p>
                  {rejectedBookings.map((b) => (
                    <BookingCard
                      key={b._id}
                      booking={b}
                      onApproveClick={openApproveModal}
                      onRejectClick={openRejectModal}
                      actioning={actioning}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Processed section */}
          {processedBookings.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Recently Processed
              </h2>
              <div className="space-y-4">
                {processedBookings.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    onApproveClick={openApproveModal}
                    onRejectClick={openRejectModal}
                    actioning={actioning}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Approve Modal with Custom Consultation Price */}
      {approvingBooking && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <CheckCircle className="text-emerald-500" size={20} />
              Approve Online Booking
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {payAtConsultation
                ? "Confirming the booking only — the doctor will enter the FULL price at consultation. The patient's online advance stays recorded and is deducted from what they owe at the desk, never from the bill."
                : "Enter the FULL consultation price (advance included). Approving registers the patient and logs this complete price to the Doctor Queue and Revenue ledger — the cash still owed is derived from it."}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs space-y-1.5 mb-4 border border-slate-200 dark:border-slate-700">
              <p>
                <span className="text-slate-500 font-semibold">Patient:</span>{" "}
                <strong className="text-slate-900 dark:text-white">
                  {approvingBooking.patientAccount?.name || "Patient"}
                </strong>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Phone:</span>{" "}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {approvingBooking.patientAccount?.phone || "—"}
                </strong>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Requested Slot:</span>{" "}
                <strong className="text-slate-900 dark:text-white">
                  {formatDate(approvingBooking.date)} at {approvingBooking.slot}
                </strong>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Paid Online By Patient:</span>{" "}
                <strong className="text-amber-600 dark:text-amber-400 font-bold">
                  {advancePaid > 0 ? formatPkr(advancePaid) : "Nothing yet"}
                </strong>
              </p>
            </div>

            {/* Charge timing toggle */}
            <div
              role="group"
              aria-label="When to charge the consultation fee"
              className="inline-flex w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 mb-4"
            >
              <button
                type="button"
                onClick={() => setPayAtConsultation(false)}
                aria-pressed={!payAtConsultation}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  !payAtConsultation
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                Set fee now
              </button>
              <button
                type="button"
                onClick={() => setPayAtConsultation(true)}
                aria-pressed={payAtConsultation}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  payAtConsultation
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                Pay at consultation
              </button>
            </div>

            <div className="mb-5">
              {/* Banner sits with the field it explains: the advance is already
                  in, so the input below takes the FULL price, not the balance
                  left over. In "pay at consultation" mode the doctor's copy is
                  phrased for the visit instead. */}
              {advancePaid > 0 && (
                <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex items-start gap-2">
                  <span className="shrink-0 text-base leading-5">💡</span>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
                    {payAtConsultation
                      ? `${formatPkr(advancePaid)} is already paid by the patient online while booking. You are only confirming the slot — the doctor will enter the FULL price at the consultation and collect the difference.`
                      : buildFeeFieldHint(advancePaid)}
                  </p>
                </div>
              )}
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Full Consultation Price (PKR)
                {!payAtConsultation && " *"}
              </label>
              <div className={`relative ${payAtConsultation ? "opacity-50" : ""}`}>
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">
                  Rs
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={checkupPrice}
                  onChange={(e) => setCheckupPrice(e.target.value)}
                  disabled={payAtConsultation}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800"
                  placeholder={payAtConsultation ? "Set at consultation" : "e.g. 2000 (the complete fee)"}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {payAtConsultation
                  ? "You're only confirming the booking — the doctor enters the full price at the visit."
                  : "Enter the complete price for the visit — the system adds this number to Revenue Lab as-is."}
              </p>

              {/* Live split so nobody has to do the advance math by hand. */}
              {!payAtConsultation && approvalFeeNote && (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2.5 text-xs font-bold leading-relaxed ${
                    approvalFeeNote.tone === "due"
                      ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                      : approvalFeeNote.tone === "covered"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                  aria-live="polite"
                >
                  {approvalFeeNote.text}
                </div>
              )}
              {!payAtConsultation && advancePaid <= 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  No online advance recorded — the patient pays the full{" "}
                  {formatPkr(approvalFeeCalc.netAmount)} at the clinic.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setApprovingBooking(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actioning === approvingBooking._id}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
              >
                {actioning === approvingBooking._id ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <XCircle className="text-rose-500" size={20} />
              Reject Online Booking
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Provide a reason for rejecting this booking request. The patient will be notified via WhatsApp.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
                placeholder="Explain why payment proof was rejected…"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actioning === rejectingBooking._id}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm"
              >
                {actioning === rejectingBooking._id ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
