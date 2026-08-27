import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";
import useAuthStore from "../../store/authStore";
import {
  APPOINTMENT_TYPES,
  PAYMENT_METHODS,
  buildSlotsForDate,
  cls,
  formatLongDate,
  formatMoney,
  getTodayDateInput,
} from "./patientTokens";
import SlotPicker from "./SlotPicker";
import { useSlotAvailability } from "./slotAvailability";
import { PatientAvatar, Spinner } from "./patientUi";

/**
 * Books a slot for one patient and logs the upfront consultation fee in the
 * same request — the appointment controller writes the Payment record too.
 */
export default function BookAppointmentModal({ patient, onClose, onBooked }) {
  const { doctor } = useAuthStore();

  const [date, setDate] = useState(getTodayDateInput());
  const [slot, setSlot] = useState("");
  const [type, setType] = useState("Consultation");
  const [notes, setNotes] = useState("");
  const [fee, setFee] = useState("");
  const [discount, setDiscount] = useState("0");
  const [method, setMethod] = useState("Cash");
  // Emergency Mode override — defaults OFF; when ON full slots become
  // selectable and the backend bypasses the 3-per-slot capacity check.
  const [isEmergency, setIsEmergency] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const slots = useMemo(
    () => buildSlotsForDate({ doctor, patient, date }),
    [doctor, patient, date],
  );

  // Live per-slot occupancy (standardCount / emergencyCount / isFull) shared
  // with the Appointments booking form.
  const { availability, isLoading: isLoadingSlots } = useSlotAvailability(date);

  // Reset the picked slot whenever the slot list changes underneath it.
  useEffect(() => {
    if (slot && !slots.some((entry) => entry.time === slot)) setSlot("");
  }, [slots, slot]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const parsedFee = Number(fee);
  const parsedDiscount = Number(discount || 0);
  const netAmount = Number.isFinite(parsedFee) && Number.isFinite(parsedDiscount)
    ? Math.max(0, parsedFee - parsedDiscount)
    : 0;
  const feeIsValid = fee !== "" && Number.isFinite(parsedFee) && parsedFee >= 0;
  const discountIsValid = Number.isFinite(parsedDiscount) && parsedDiscount >= 0;
  const canBook = Boolean(date && slot && type && feeIsValid && discountIsValid);

  const handleBook = async () => {
    if (!date) return toast.error("Select an appointment date");
    if (!slot) return toast.error("Select a time slot");
    if (!type) return toast.error("Select an appointment type");
    if (!feeIsValid) return toast.error("Enter the upfront consultation fee");
    if (!discountIsValid) return toast.error("Enter a valid discount amount");
    if (parsedDiscount > parsedFee) {
      return toast.error("Discount cannot be larger than the consultation fee");
    }

    setIsBooking(true);
    try {
      // Send the RAW base fee + RAW discount only. Do NOT pre-subtract the
      // discount into `standardFee`/`consultationFee` here — the backend
      // (appointment.controller.js) is the single source of truth that
      // computes netAmount = standardFee - discount exactly once. Sending an
      // already-discounted value under `consultationFee`/`amount` caused the
      // backend to subtract the discount a second time (the double-discount
      // bug: 500 fee - 50 discount showed up as 400 instead of 450).
      const res = await axiosInstance.post("/appointments", {
        patientId: patient._id,
        date,
        slot,
        type,
        notes,
        isEmergency,
        isWalkIn: true,
        standardFee: parsedFee,
        amount: parsedFee,
        discount: parsedDiscount,
        description: "Consultation",
        paymentMethod: method,
      });
      toast.success(`Slot ${slot} booked · ${formatMoney(netAmount)} recorded`);
      onBooked?.(res.data.appointment);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <button
        type="button"
        aria-label="Close booking dialog"
        className="fixed inset-0 cursor-default bg-transparent"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Book appointment for ${patient?.name}`}
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden dark:bg-slate-900 dark:border dark:border-slate-800"
      >
        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <PatientAvatar name={patient?.name} size="md" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                Book Appointment
              </h2>
              <p className="truncate text-sm font-semibold text-slate-600 dark:text-slate-300">
                {patient?.name}
                <span className="mx-1.5 text-slate-400 dark:text-slate-600">•</span>
                {patient?.age} yrs
                <span className="mx-1.5 text-slate-400 dark:text-slate-600">•</span>
                {patient?.gender}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-300 text-lg font-bold text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label htmlFor="booking-date" className={cls.fieldLabel}>
              Appointment Date
            </label>
            <div className="relative">
              <input
                id="booking-date"
                type="date"
                value={date}
                min={getTodayDateInput()}
                onChange={(event) => setDate(event.target.value)}
                className={`${cls.input} cursor-pointer [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
            <p className={cls.mutedText + " mt-1.5"}>
              {formatLongDate(date)} — slots come from the sessions configured at this
              patient&apos;s clinic or hospital.
            </p>
          </div>

          <div>
            <span className={cls.fieldLabel}>Time Slot</span>
            <SlotPicker
              slots={slots}
              availability={availability}
              selectedSlot={slot}
              onSelectSlot={setSlot}
              isEmergency={isEmergency}
              onEmergencyChange={setIsEmergency}
              isLoading={isLoadingSlots}
              emptyHint={`No session is scheduled here on ${formatLongDate(date)}. Pick another date or add sessions in Settings.`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="booking-type" className={cls.fieldLabel}>
                Appointment Type
              </label>
              <select
                id="booking-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className={cls.input}
              >
                {APPOINTMENT_TYPES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="booking-method" className={cls.fieldLabel}>
                Payment Method
              </label>
              <select
                id="booking-method"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className={cls.input}
              >
                {PAYMENT_METHODS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <span className={cls.blockLabel}>Upfront Consultation Fee</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="booking-fee" className={cls.fieldLabel}>
                  Fee (Rs.)
                </label>
                <input
                  id="booking-fee"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={fee}
                  onChange={(event) => setFee(event.target.value)}
                  placeholder="2000"
                  className={cls.input}
                />
              </div>
              <div>
                <label htmlFor="booking-discount" className={cls.fieldLabel}>
                  Discount (Rs.)
                </label>
                <input
                  id="booking-discount"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  placeholder="0"
                  className={cls.input}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-800 dark:bg-teal-950/40">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Collected now
              </span>
              <span className="text-base font-extrabold text-teal-800 dark:text-teal-200">
                {formatMoney(netAmount)}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="booking-notes" className={cls.fieldLabel}>
              Notes (optional)
            </label>
            <textarea
              id="booking-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Reason for visit, walk-in context…"
              className={`${cls.input} resize-none`}
            />
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t bg-gray-50 border-slate-200 dark:border-slate-800 dark:bg-slate-800/50 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className={cls.btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBook}
            disabled={!canBook || isBooking}
            className={cls.btnPrimary}
          >
            {isBooking ? <Spinner label="Booking…" /> : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
