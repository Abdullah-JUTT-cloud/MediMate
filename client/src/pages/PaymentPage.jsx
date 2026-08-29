/* eslint-disable react-hooks/exhaustive-deps */
/**
 * PaymentPage.jsx — Payment Management & Patient Billing
 *
 * Refactored for WCAG AA/AAA compliance:
 *  • All text uses high-contrast Tailwind utility classes (no CSS-var colours
 *    that could resolve to low-contrast values in either theme).
 *  • Stat boxes, form inputs, status badges, and history cards have explicit
 *    light and dark variants via Tailwind's `dark:` prefix.
 *  • Interactive controls (buttons, toggles, inputs) meet 3:1 non-text and
 *    4.5:1 text contrast ratios.
 *  • No inline style objects are used for colour — layout-only styles remain.
 */

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search, ChevronLeft, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import axiosInstance from "../api/axios";
import { formatPkr } from "../utils/consultationFee";
import { RowSkeleton } from "../components/SkeletonLoaders";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = ["Cash", "Card", "Online Transfer"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";

// ─── Reusable Sub-components ──────────────────────────────────────────────────

/** High-contrast back navigation button */
function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 font-bold text-sm hover:underline mb-4 transition-all"
    >
      <ChevronLeft size={16} strokeWidth={2.5} />
      {label}
    </button>
  );
}

/**
 * High-contrast pill badge for paid / unpaid status.
 * Paid  → emerald (green-family, unambiguous)
 * Unpaid → rose (red-family, unambiguous)
 */
function StatusBadge({ isPaid, amount }) {
  const base =
    "inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-xs border";
  if (isPaid) {
    return (
      <span
        className={`${base} bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700`}
      >
        <CheckCircle2 size={12} strokeWidth={2.5} />
        Paid · PKR {Number(amount || 0).toLocaleString()}
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700`}
    >
      <AlertCircle size={12} strokeWidth={2.5} />
      Unpaid · PKR {Number(amount || 0).toLocaleString()}
    </span>
  );
}

/**
 * Toggle switch pill — replaces the old faint "Paid / Unpaid" button
 * that used low-contrast rgba colours.
 */
function TogglePill({ on, onToggle, labelOn, labelOff }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        on
          ? "bg-teal-600 border-teal-600"
          : "bg-slate-300 border-slate-300 dark:bg-slate-600 dark:border-slate-600"
      }`}
      aria-pressed={on}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
      <span className="sr-only">{on ? labelOn : labelOff}</span>
    </button>
  );
}

/**
 * Shared high-contrast text input / select wrapper styles.
 * Produces a visible, themed input without any CSS custom-property colour.
 */
const inputCls =
  "w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 " +
  "text-slate-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none " +
  "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 " +
  "placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs " +
  "transition-all font-semibold";

// ─── PaymentWorkspace (Patient Detail + Form) ─────────────────────────────────

function PaymentWorkspace({ patient, onBack }) {
  const [checkups, setCheckups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckupId, setSelectedCheckupId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [isPaid, setIsPaid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extraPaymentEnabled, setExtraPaymentEnabled] = useState(false);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState("");
  const [extraPaymentDescription, setExtraPaymentDescription] = useState("Laboratory Test");
  const [extraPaymentMethod, setExtraPaymentMethod] = useState("Cash");
  const [isAddingExtra, setIsAddingExtra] = useState(false);

  const selectedCheckup = useMemo(
    () => checkups.find((c) => c._id === selectedCheckupId) || null,
    [checkups, selectedCheckupId],
  );

  const hydratePaymentForm = (checkup) => {
    if (!checkup) return;
    const existingAmount = Number(checkup.payment?.netAmount ?? checkup.payment?.amount ?? 0);
    setAmount(String(existingAmount));
    setMethod(checkup.payment?.method || "Cash");
    setIsPaid(Boolean(checkup.payment?.isPaid));
    setExtraPaymentEnabled(false);
    setExtraPaymentAmount("");
    setExtraPaymentDescription("Laboratory Test");
    setExtraPaymentMethod("Cash");
  };

  const loadCheckups = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/checkups/${patient._id}?limit=500`);
      const list = Array.isArray(res.data?.checkups) ? res.data.checkups : [];
      setCheckups(list);

      if (list.length > 0) {
        const targetId =
          selectedCheckupId && list.some((item) => item._id === selectedCheckupId)
            ? selectedCheckupId
            : list[0]._id;
        setSelectedCheckupId(targetId);
        hydratePaymentForm(list.find((item) => item._id === targetId) || list[0]);
      } else {
        setSelectedCheckupId("");
        setAmount("");
        setMethod("Cash");
        setIsPaid(false);
      }
    } catch {
      toast.error("Failed to load patient checkups");
      setCheckups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCheckups();
  }, [patient._id]);

  const onSelectCheckup = (checkup) => {
    setSelectedCheckupId(checkup._id);
    hydratePaymentForm(checkup);
  };

  const savePayment = async () => {
    if (!selectedCheckup) return toast.error("Select a checkup first");
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0)
      return toast.error("Enter a valid payment amount");

    setIsSaving(true);
    try {
      const res = await axiosInstance.put(`/checkups/${selectedCheckup._id}`, {
        payment: { amount: parsedAmount, method, isPaid },
      });
      const updated = res.data?.checkup;
      if (updated?._id) {
        setCheckups((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      } else {
        await loadCheckups();
      }
      toast.success("Payment saved successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save payment");
    } finally {
      setIsSaving(false);
    }
  };

  const addExtraPayment = async () => {
    if (!selectedCheckup) return toast.error("Select a checkup first");
    const parsedExtra = Number(extraPaymentAmount);
    if (!extraPaymentEnabled || !Number.isFinite(parsedExtra) || parsedExtra <= 0)
      return toast.error("Enter a valid extra payment amount");

    setIsAddingExtra(true);
    try {
      await axiosInstance.post("/billing/extra-payment", {
        checkupId: selectedCheckup._id,
        patientId: patient._id,
        amount: parsedExtra,
        description: extraPaymentDescription.trim() || "Laboratory Test",
        method: extraPaymentMethod,
      });
      setExtraPaymentEnabled(false);
      setExtraPaymentAmount("");
      setExtraPaymentDescription("Laboratory Test");
      setExtraPaymentMethod("Cash");
      await loadCheckups();
      toast.success("Extra payment recorded successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add extra payment");
    } finally {
      setIsAddingExtra(false);
    }
  };

  // ── Derived totals ────────────────────────────────────────────────────────

  const totalPaid = useMemo(
    () =>
      checkups.reduce(
        (sum, c) =>
          c.payment?.isPaid
            ? sum + Number(c.payment?.amount || c.payment?.netAmount || 0)
            : sum,
        0,
      ),
    [checkups],
  );

  const totalOutstanding = useMemo(
    () =>
      checkups.reduce(
        (sum, c) =>
          !c.payment?.isPaid
            ? sum + Number(c.payment?.amount || c.payment?.netAmount || 0)
            : sum,
        0,
      ),
    [checkups],
  );

  const selectedConsultationFee = useMemo(() => {
    if (!selectedCheckup) return 0;
    const base = Number(selectedCheckup.payment?.netAmount ?? selectedCheckup.payment?.amount ?? 0);
    const extra = Number(selectedCheckup.payment?.ancillaryFee || 0);
    return Math.max(0, base - extra);
  }, [selectedCheckup]);

  const selectedExtraFee = useMemo(
    () => Number(selectedCheckup?.payment?.ancillaryFee || 0),
    [selectedCheckup],
  );

  // Advance already received online + the cash that was taken at the clinic.
  // netAmount/amount hold the FULL billed price, so the split is derived here
  // (never stored back as a discount).
  const selectedAdvancePaid = Number(
    selectedCheckup?.payment?.advanceAmountPaid || 0,
  );
  const selectedTotalPaid = Math.max(
    0,
    Number(
      selectedCheckup?.payment?.netAmount ?? selectedCheckup?.payment?.amount ?? 0,
    ),
  );
  const selectedCollectNow = Math.max(0, selectedTotalPaid - selectedAdvancePaid);
  // Same split, live against whatever is currently in the amount field.
  const selectedAmountTotal = Number(amount || 0);
  const selectedAmountCollectNow = Math.max(
    0,
    selectedAmountTotal - selectedAdvancePaid,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-1">
      {/* ── Back Navigation ── */}
      <BackButton onClick={onBack} label="Back to Patient Search" />

      {/* ── Patient Identity Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0 bg-gradient-to-br from-teal-600 to-teal-400 shadow-md">
            {getInitials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {patient.name}
            </h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {patient.age} yrs · {patient.gender} · {patient.bloodGroup}
            </p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Phone: {patient.phone || "N/A"}
            </p>
          </div>
        </div>

        {/* ── Top 3 Stat Sub-cards ── */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {/* Total Checkups */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Total Checkups
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {checkups.length}
              </span>
            </div>

            {/* Total Paid */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Total Paid
              </span>
              <span className="text-2xl font-extrabold text-teal-700 dark:text-teal-300">
                PKR {totalPaid.toLocaleString()}
              </span>
            </div>

            {/* Outstanding */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Outstanding
              </span>
              <span
                className={`text-2xl font-extrabold ${
                  totalOutstanding > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                PKR {totalOutstanding.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 2-Column Grid: Checkup Selector + Payment Form ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">

        {/* ─ LEFT: Checkup Selector ─ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Select Checkup For Payment Generation
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : checkups.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                No checkups found for this patient
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Add a checkup first, then generate payment against that checkup.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {checkups.map((checkup) => {
                const isSelected = selectedCheckupId === checkup._id;
                const diagnosis =
                  checkup.prescription?.diagnosis || "No diagnosis recorded";
                const diseases = Array.isArray(checkup.diseases) ? checkup.diseases : [];

                return (
                  <button
                    key={checkup._id}
                    onClick={() => onSelectCheckup(checkup)}
                    className={`w-full text-left rounded-2xl p-4 mb-3 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-teal-50/60 dark:bg-teal-950/40 border-2 border-teal-500 shadow-xs"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {formatDateTime(checkup.createdAt)}
                      </p>
                      <StatusBadge
                        isPaid={checkup.payment?.isPaid}
                        amount={checkup.payment?.amount || 0}
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Diagnosis: {diagnosis}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Diseases:{" "}
                      {diseases.length ? diseases.join(", ") : "No diseases listed"}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                      Notes:{" "}
                      {checkup.notes?.trim() ? checkup.notes : "No notes added"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─ RIGHT: Payment Form ─ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Generate / Update Payment For Selected Checkup
          </h3>

          {!selectedCheckup ? (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Select a checkup from the left panel.
              </p>
            </div>
          ) : (
            <>
              {/* ── Fee Breakdown Summary Box ── */}
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Consultation
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    PKR {selectedConsultationFee.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Lab / Extra
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    PKR {selectedExtraFee.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Total Paid
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    PKR{" "}
                    {Number(
                      selectedCheckup.payment?.amount ||
                        selectedCheckup.payment?.netAmount ||
                        0,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Online advance note: this visit's ledger amount is the FULL
                  price, part of which arrived online at booking. Editing the
                  field below must never be used to "subtract" that advance. */}
              {selectedAdvancePaid > 0 && (
                <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3.5 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
                  <p>
                    Rs. {selectedAdvancePaid.toLocaleString()} of this visit was
                    already paid online while booking — it is PART of the{" "}
                    {formatPkr(selectedTotalPaid)} below, not a discount and
                    not a second payment.
                  </p>
                  {selectedCollectNow > 0 && (
                    <p className="mt-1 font-bold text-amber-900 dark:text-amber-100">
                      Collected at the clinic: Rs.{" "}
                      {selectedCollectNow.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Selected Checkup Meta */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Selected Checkup
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatDateTime(selectedCheckup.createdAt)}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                  Diagnosis:{" "}
                  {selectedCheckup.prescription?.diagnosis || "No diagnosis"}
                </p>
              </div>

              <div className="space-y-3">
                {/* Payment Amount */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                    Payment Amount — Full Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                    {selectedAdvancePaid > 0
                      ? selectedAmountCollectNow > 0
                        ? `Enter the complete price, not the cash left over: ${formatPkr(selectedAmountTotal)} here means ${formatPkr(selectedAmountCollectNow)} to collect at the desk.`
                        : `The ${formatPkr(selectedAdvancePaid)} advance already covers this price — nothing more to collect.`
                      : "Enter the complete consultation price for this visit."}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                    Payment Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className={inputCls}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mark As Paid Toggle */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Mark As Paid
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                      Turn off to keep it in outstanding dues.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span
                      className={`text-xs font-bold ${
                        isPaid
                          ? "text-teal-700 dark:text-teal-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPaid ? "Paid" : "Unpaid"}
                    </span>
                    <TogglePill
                      on={isPaid}
                      onToggle={() => setIsPaid((p) => !p)}
                      labelOn="Mark as paid"
                      labelOff="Mark as unpaid"
                    />
                  </div>
                </div>

                {/* Extra Payment Panel */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Add Extra Payment
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                        Optional: lab tests, procedure add-ons, or other charges.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span
                        className={`text-xs font-bold ${
                          extraPaymentEnabled
                            ? "text-teal-700 dark:text-teal-400"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {extraPaymentEnabled ? "On" : "Off"}
                      </span>
                      <TogglePill
                        on={extraPaymentEnabled}
                        onToggle={() => setExtraPaymentEnabled((p) => !p)}
                        labelOn="Disable extra payment"
                        labelOff="Enable extra payment"
                      />
                    </div>
                  </div>

                  {extraPaymentEnabled && (
                    <div className="space-y-3 pt-1">
                      {/* Extra Amount */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                          Extra Payment Amount (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={extraPaymentAmount}
                          onChange={(e) => setExtraPaymentAmount(e.target.value)}
                          placeholder="e.g. 1500"
                          className={inputCls}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={extraPaymentDescription}
                          onChange={(e) => setExtraPaymentDescription(e.target.value)}
                          className={inputCls}
                        />
                      </div>

                      {/* Extra Payment Method */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                          Payment Method
                        </label>
                        <select
                          value={extraPaymentMethod}
                          onChange={(e) => setExtraPaymentMethod(e.target.value)}
                          className={inputCls}
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Record Extra Payment Button */}
                      <button
                        type="button"
                        onClick={addExtraPayment}
                        disabled={isAddingExtra}
                        className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddingExtra ? "Recording…" : "Create Extra Payment Record"}
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Primary CTA ── */}
                <button
                  onClick={savePayment}
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard size={16} strokeWidth={2.5} />
                  {isSaving ? "Saving…" : "Save Payment For This Checkup"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ DETAILED PAYMENT HISTORY STREAM ══════════════════════════════════ */}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Detailed Payment History
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
            (Per Checkup)
          </span>
        </h3>
        <span className="bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 font-bold px-3 py-1 rounded-full text-xs border border-teal-300 dark:border-teal-700">
          {checkups.length} record{checkups.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4 mb-6">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : checkups.length === 0 ? (
        <div className="text-center py-16 rounded-2xl mb-6 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            No payment history available yet
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Once checkups exist, each checkup will show its payment details here.
          </p>
        </div>
      ) : (
        <div className="space-y-5 pb-4">
          {checkups.map((checkup) => {
            const medicines = Array.isArray(checkup.prescription?.medicines)
              ? checkup.prescription.medicines
              : [];
            const labTests = Array.isArray(checkup.prescription?.labTests)
              ? checkup.prescription.labTests
              : [];
            const consultFee = Math.max(
              0,
              Number(checkup.payment?.netAmount ?? checkup.payment?.amount ?? 0) -
                Number(checkup.payment?.ancillaryFee || 0),
            );
            const extraFee = Number(checkup.payment?.ancillaryFee || 0);
            const totalAmt = Number(
              checkup.payment?.amount || checkup.payment?.netAmount || 0,
            );

            return (
              <div
                key={checkup._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-5 shadow-sm"
              >
                {/* ── Card Top Bar ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Checkup Date & Time
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatDateTime(checkup.createdAt)}
                    </p>
                  </div>
                  <StatusBadge isPaid={checkup.payment?.isPaid} amount={totalAmt} />
                </div>

                {/* ── 4-Sub-block Inner Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {/* Sub-block 1: Clinical Details */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2 block">
                      Clinical Details
                    </span>
                    <dl className="space-y-1">
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Diagnosis:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.prescription?.diagnosis || "Not recorded"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Diseases:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {Array.isArray(checkup.diseases) && checkup.diseases.length
                            ? checkup.diseases.join(", ")
                            : "Not listed"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Notes:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.notes?.trim() ? checkup.notes : "No notes"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Next Appt:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.prescription?.nextAppointment
                            ? formatDate(checkup.prescription.nextAppointment)
                            : "Not scheduled"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Sub-block 2: Payment Details */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2 block">
                      Payment Details
                    </span>
                    <dl className="space-y-1">
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Consultation Fee:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          PKR {consultFee.toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Lab / Extra:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          PKR {extraFee.toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Total Paid:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          PKR {totalAmt.toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Method:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.payment?.method || "Cash"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Status:</dt>
                        <dd
                          className={`text-xs font-bold ${
                            checkup.payment?.isPaid
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {checkup.payment?.isPaid ? "Paid" : "Unpaid"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Sub-block 3: Treatment Items */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2 block">
                      Treatment Items
                    </span>
                    <dl className="space-y-1">
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Medicines:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {medicines.length} item{medicines.length !== 1 ? "s" : ""}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Lab Tests:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {labTests.length} item{labTests.length !== 1 ? "s" : ""}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Patient Advice:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.prescription?.patientAdvice?.trim()
                            ? checkup.prescription.patientAdvice
                            : "No advice recorded"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Sub-block 4: Visit Facility */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-xl mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2 block">
                      Visit Facility
                    </span>
                    <dl className="space-y-1">
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Type:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.visitedFacility?.locationType || "Not set"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Name:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.visitedFacility?.locationName || "Not set"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">Address:</dt>
                        <dd className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {checkup.visitedFacility?.locationAddress || "Not set"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PaymentPage (Patient Search / Root View) ─────────────────────────────────

export default function PaymentPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const res = await axiosInstance.get(`/patients?${params.toString()}`);
      setPatients(Array.isArray(res.data?.patients) ? res.data.patients : []);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  /* ── If a patient is selected, render the workspace view ── */
  if (selectedPatient) {
    return (
      <PaymentWorkspace
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  /* ── Otherwise render the search / list view ── */
  return (
    <div className="max-w-3xl mx-auto px-1">

      {/* ── Header Block ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard size={22} strokeWidth={2.5} className="text-teal-600 dark:text-teal-400" />
          Payment Management
        </h1>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
          Search patient, open profile, select a checkup, and generate payment linked to that checkup.
        </p>
      </div>

      {/* ── Search Card Container ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-2xl mx-auto text-center">
        <div className="flex gap-2 w-full">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPatients()}
            placeholder="Search patient by name or phone…"
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={loadPatients}
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Search size={16} strokeWidth={2.5} />
            Search
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {isLoading ? (
        <div className="mt-6 space-y-4">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 rounded-2xl mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            No patients found
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Try searching by name or phone number.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3 max-w-2xl mx-auto">
          {patients.map((patient) => (
            /* ── Patient Search Result Card ── */
            <div
              key={patient._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between mt-4"
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 bg-gradient-to-br from-teal-600 to-teal-400 shadow-sm">
                  {getInitials(patient.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {patient.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                    {patient.age} yrs · {patient.gender} · {patient.phone}
                  </p>
                </div>
              </div>

              {/* Open Action Button */}
              <button
                onClick={() => setSelectedPatient(patient)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1 flex-shrink-0 ml-3"
              >
                Open →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
