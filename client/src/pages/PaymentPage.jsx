/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import axiosInstance from "../api/axios";
import { RowSkeleton } from "../components/SkeletonLoaders";

const PAYMENT_METHODS = ["Cash", "Card", "Online Transfer"];

const ORGANIC = {
  fg: "var(--color-text-primary)",
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  mutedFg: "var(--color-text-secondary)",
  border: "var(--color-border)",
  shadowSoft: "0 4px 20px -2px rgba(93, 112, 82, 0.15)",
};

const S = {
  input: {
    background:
      "color-mix(in srgb, var(--color-card-elevated) 82%, var(--color-bg) 18%)",
    border:
      "1.5px solid color-mix(in srgb, var(--color-border) 82%, transparent)",
    color: ORGANIC.fg,
    borderRadius: "999px",
  },
  card: {
    background: "color-mix(in srgb, var(--color-card) 92%, var(--color-bg) 8%)",
    border:
      "1px solid color-mix(in srgb, var(--color-border) 78%, transparent)",
    borderRadius: "2rem",
    boxShadow: ORGANIC.shadowSoft,
  },
  section: {
    background:
      "color-mix(in srgb, var(--color-bg-soft) 48%, var(--color-card) 52%)",
    border:
      "1px solid color-mix(in srgb, var(--color-border) 76%, transparent)",
    borderRadius: "1.5rem",
  },
};

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

const focusInput = (e) => {
  e.target.style.border = `1.5px solid ${ORGANIC.primary}`;
  e.target.style.boxShadow =
    "0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent)";
};

const blurInput = (e) => {
  e.target.style.border =
    "1.5px solid color-mix(in srgb, var(--color-border) 82%, transparent)";
  e.target.style.boxShadow = "none";
};

function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-semibold transition-all mb-6 group hover:translate-x-1"
      style={{ color: ORGANIC.primary }}
    >
      ← {label}
    </button>
  );
}

function PaymentWorkspace({ patient, onBack }) {
  const [checkups, setCheckups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckupId, setSelectedCheckupId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [isPaid, setIsPaid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCheckup = useMemo(
    () => checkups.find((c) => c._id === selectedCheckupId) || null,
    [checkups, selectedCheckupId],
  );

  const hydratePaymentForm = (checkup) => {
    if (!checkup) return;
    const existingAmount = Number(checkup.payment?.amount ?? 0);
    const existingMethod = checkup.payment?.method || "Cash";
    const existingIsPaid = Boolean(checkup.payment?.isPaid);
    setAmount(String(existingAmount));
    setMethod(existingMethod);
    setIsPaid(existingIsPaid);
  };

  const loadCheckups = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/checkups/${patient._id}?limit=500`);
      const list = Array.isArray(res.data?.checkups) ? res.data.checkups : [];
      setCheckups(list);

      if (list.length > 0) {
        const targetId =
          selectedCheckupId &&
          list.some((item) => item._id === selectedCheckupId)
            ? selectedCheckupId
            : list[0]._id;
        setSelectedCheckupId(targetId);
        const target = list.find((item) => item._id === targetId) || list[0];
        hydratePaymentForm(target);
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
    if (!selectedCheckup) {
      toast.error("Select a checkup first");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        payment: {
          amount: parsedAmount,
          method,
          isPaid,
        },
      };
      const res = await axiosInstance.put(
        `/checkups/${selectedCheckup._id}`,
        payload,
      );
      const updatedCheckup = res.data?.checkup;

      if (updatedCheckup?._id) {
        setCheckups((prev) =>
          prev.map((c) => (c._id === updatedCheckup._id ? updatedCheckup : c)),
        );
      } else {
        await loadCheckups();
      }
      toast.success("Payment saved successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save payment");
    } finally {
      setIsSaving(false);
    }
  };

  const totalPaid = useMemo(
    () =>
      checkups.reduce(
        (sum, c) =>
          c.payment?.isPaid ? sum + Number(c.payment?.amount || 0) : sum,
        0,
      ),
    [checkups],
  );

  const totalOutstanding = useMemo(
    () =>
      checkups.reduce(
        (sum, c) =>
          !c.payment?.isPaid ? sum + Number(c.payment?.amount || 0) : sum,
        0,
      ),
    [checkups],
  );

  return (
    <div className="max-w-6xl mx-auto px-1">
      <BackButton onClick={onBack} label="Back to Patient Search" />

      <div className="rounded-2xl p-5 sm:p-6 mb-5" style={S.card}>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
              boxShadow: ORGANIC.shadowSoft,
            }}
          >
            {getInitials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold" style={{ color: ORGANIC.fg }}>
              {patient.name}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: ORGANIC.mutedFg }}>
              {patient.age} yrs · {patient.gender} · {patient.bloodGroup}
            </p>
            <p className="text-sm mt-0.5" style={{ color: ORGANIC.mutedFg }}>
              Phone: {patient.phone || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl p-4" style={S.section}>
            <p
              className="text-xs mb-1 font-medium"
              style={{ color: ORGANIC.mutedFg }}
            >
              Total Checkups
            </p>
            <p className="text-2xl font-bold" style={{ color: ORGANIC.fg }}>
              {checkups.length}
            </p>
          </div>
          <div className="rounded-2xl p-4" style={S.section}>
            <p
              className="text-xs mb-1 font-medium"
              style={{ color: ORGANIC.mutedFg }}
            >
              Total Paid
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: ORGANIC.primary }}
            >
              PKR {totalPaid.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl p-4" style={S.section}>
            <p
              className="text-xs mb-1 font-medium"
              style={{ color: ORGANIC.mutedFg }}
            >
              Outstanding
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: ORGANIC.secondary }}
            >
              PKR {totalOutstanding.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl p-4" style={S.card}>
          <h3
            className="text-base font-bold mb-3"
            style={{ color: ORGANIC.fg }}
          >
            Select Checkup For Payment Generation
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : checkups.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl"
              style={{
                background: "rgba(93, 112, 82, 0.05)",
                border: `1.5px dashed ${ORGANIC.border}`,
              }}
            >
              <p
                className="text-sm font-bold mb-1"
                style={{ color: ORGANIC.fg }}
              >
                No checkups found for this patient
              </p>
              <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                Add a checkup first, then generate payment against that checkup.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {checkups.map((checkup) => {
                const isSelected = selectedCheckupId === checkup._id;
                const diagnosis =
                  checkup.prescription?.diagnosis || "No diagnosis recorded";
                const diseases = Array.isArray(checkup.diseases)
                  ? checkup.diseases
                  : [];
                return (
                  <button
                    key={checkup._id}
                    onClick={() => onSelectCheckup(checkup)}
                    className="w-full text-left rounded-2xl p-4 transition-all"
                    style={{
                      ...S.section,
                      border: isSelected
                        ? `1.5px solid ${ORGANIC.primary}`
                        : S.section.border,
                      boxShadow: isSelected
                        ? "0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent)"
                        : "none",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: ORGANIC.mutedFg }}
                      >
                        Checkup Date: {formatDateTime(checkup.createdAt)}
                      </p>
                      <span
                        className="text-xs px-3 py-1 rounded-full font-semibold"
                        style={{
                          background: checkup.payment?.isPaid
                            ? "rgba(93, 112, 82, 0.12)"
                            : "rgba(193, 140, 93, 0.12)",
                          color: checkup.payment?.isPaid
                            ? ORGANIC.primary
                            : ORGANIC.secondary,
                        }}
                      >
                        {checkup.payment?.isPaid ? "Paid" : "Unpaid"} · PKR{" "}
                        {Number(checkup.payment?.amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: ORGANIC.fg }}
                    >
                      Diagnosis: {diagnosis}
                    </p>
                    <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                      Diseases:{" "}
                      {diseases.length
                        ? diseases.join(", ")
                        : "No diseases listed"}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Notes:{" "}
                      {checkup.notes?.trim() ? checkup.notes : "No notes added"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={S.card}>
          <h3
            className="text-base font-bold mb-3"
            style={{ color: ORGANIC.fg }}
          >
            Generate / Update Payment For Selected Checkup
          </h3>

          {!selectedCheckup ? (
            <div
              className="text-center py-12 rounded-2xl"
              style={{
                background: "rgba(93, 112, 82, 0.05)",
                border: `1.5px dashed ${ORGANIC.border}`,
              }}
            >
              <p className="text-sm font-bold" style={{ color: ORGANIC.fg }}>
                Select a checkup from the left panel.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl p-4 mb-4" style={S.section}>
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: ORGANIC.mutedFg }}
                >
                  Selected Checkup
                </p>
                <p className="text-sm font-bold" style={{ color: ORGANIC.fg }}>
                  {formatDateTime(selectedCheckup.createdAt)}
                </p>
                <p className="text-xs mt-1" style={{ color: ORGANIC.mutedFg }}>
                  Diagnosis:{" "}
                  {selectedCheckup.prescription?.diagnosis || "No diagnosis"}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    className="text-xs font-semibold block mb-2"
                    style={{ color: ORGANIC.mutedFg }}
                  >
                    Payment Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-5 py-3 rounded-full text-sm outline-none transition-all"
                    style={S.input}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                <div>
                  <label
                    className="text-xs font-semibold block mb-2"
                    style={{ color: ORGANIC.mutedFg }}
                  >
                    Payment Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-5 py-3 rounded-full text-sm outline-none transition-all"
                    style={S.input}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={S.section}
                >
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: ORGANIC.fg }}
                    >
                      Mark As Paid
                    </p>
                    <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                      Turn off to keep it in outstanding dues.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPaid((prev) => !prev)}
                    className="px-4 py-2 rounded-full text-xs font-semibold border"
                    style={{
                      background: isPaid
                        ? "rgba(93, 112, 82, 0.14)"
                        : "rgba(193, 140, 93, 0.14)",
                      color: isPaid ? ORGANIC.primary : ORGANIC.secondary,
                      borderColor: isPaid
                        ? "rgba(93, 112, 82, 0.32)"
                        : "rgba(193, 140, 93, 0.32)",
                    }}
                  >
                    {isPaid ? "Paid" : "Unpaid"}
                  </button>
                </div>

                <button
                  onClick={savePayment}
                  disabled={isSaving}
                  className="w-full px-6 py-3 rounded-full text-sm font-bold border transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  style={{
                    borderColor: "var(--color-border)",
                    color: ORGANIC.primary,
                    background: "rgba(93, 112, 82, 0.10)",
                  }}
                >
                  {isSaving ? "Saving..." : "Save Payment For This Checkup"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: ORGANIC.fg }}>
          Detailed Payment History (Per Checkup)
        </h3>
        <span
          className="text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{
            background: "rgba(93, 112, 82, 0.12)",
            color: ORGANIC.primary,
          }}
        >
          {checkups.length} checkup record{checkups.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4 mb-6">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : checkups.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl mb-6"
          style={{
            background: "rgba(93, 112, 82, 0.05)",
            border: `1.5px dashed ${ORGANIC.border}`,
          }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: ORGANIC.fg }}>
            No payment history available yet
          </p>
          <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
            Once checkups exist, each checkup will show its payment details
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {checkups.map((checkup) => {
            const medicines = Array.isArray(checkup.prescription?.medicines)
              ? checkup.prescription.medicines
              : [];
            const labTests = Array.isArray(checkup.prescription?.labTests)
              ? checkup.prescription.labTests
              : [];
            return (
              <div key={checkup._id} className="rounded-2xl p-5" style={S.card}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Checkup Date & Time
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: ORGANIC.fg }}
                    >
                      {formatDateTime(checkup.createdAt)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-3 py-1.5 rounded-full font-semibold w-fit"
                    style={{
                      background: checkup.payment?.isPaid
                        ? "rgba(93, 112, 82, 0.12)"
                        : "rgba(193, 140, 93, 0.12)",
                      color: checkup.payment?.isPaid
                        ? ORGANIC.primary
                        : ORGANIC.secondary,
                    }}
                  >
                    {checkup.payment?.isPaid ? "Paid" : "Unpaid"} · PKR{" "}
                    {Number(checkup.payment?.amount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4" style={S.section}>
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Clinical Details
                    </p>
                    <p className="text-sm mb-1" style={{ color: ORGANIC.fg }}>
                      <span className="font-semibold">Diagnosis:</span>{" "}
                      {checkup.prescription?.diagnosis || "Not recorded"}
                    </p>
                    <p
                      className="text-xs mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      <span className="font-semibold">Diseases:</span>{" "}
                      {Array.isArray(checkup.diseases) &&
                      checkup.diseases.length
                        ? checkup.diseases.join(", ")
                        : "Not listed"}
                    </p>
                    <p
                      className="text-xs mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      <span className="font-semibold">Notes:</span>{" "}
                      {checkup.notes?.trim() ? checkup.notes : "No notes"}
                    </p>
                    <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                      <span className="font-semibold">Next Appointment:</span>{" "}
                      {checkup.prescription?.nextAppointment
                        ? formatDate(checkup.prescription.nextAppointment)
                        : "Not scheduled"}
                    </p>
                  </div>

                  <div className="rounded-2xl p-4" style={S.section}>
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Payment Details
                    </p>
                    <p className="text-sm mb-1" style={{ color: ORGANIC.fg }}>
                      <span className="font-semibold">Amount:</span> PKR{" "}
                      {Number(checkup.payment?.amount || 0).toLocaleString()}
                    </p>
                    <p
                      className="text-xs mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      <span className="font-semibold">Method:</span>{" "}
                      {checkup.payment?.method || "Cash"}
                    </p>
                    <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                      <span className="font-semibold">Status:</span>{" "}
                      {checkup.payment?.isPaid ? "Paid" : "Unpaid"}
                    </p>
                  </div>

                  <div className="rounded-2xl p-4" style={S.section}>
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Treatment Items
                    </p>
                    <p className="text-sm mb-1" style={{ color: ORGANIC.fg }}>
                      <span className="font-semibold">Medicines Count:</span>{" "}
                      {medicines.length}
                    </p>
                    <p
                      className="text-xs mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      <span className="font-semibold">Lab Tests Count:</span>{" "}
                      {labTests.length}
                    </p>
                    <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                      <span className="font-semibold">Patient Advice:</span>{" "}
                      {checkup.prescription?.patientAdvice?.trim()
                        ? checkup.prescription.patientAdvice
                        : "No advice recorded"}
                    </p>
                  </div>

                  <div className="rounded-2xl p-4" style={S.section}>
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      Visit Facility
                    </p>
                    <p className="text-sm mb-1" style={{ color: ORGANIC.fg }}>
                      <span className="font-semibold">Type:</span>{" "}
                      {checkup.visitedFacility?.locationType || "Not set"}
                    </p>
                    <p
                      className="text-xs mb-1"
                      style={{ color: ORGANIC.mutedFg }}
                    >
                      <span className="font-semibold">Name:</span>{" "}
                      {checkup.visitedFacility?.locationName || "Not set"}
                    </p>
                    <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
                      <span className="font-semibold">Address:</span>{" "}
                      {checkup.visitedFacility?.locationAddress || "Not set"}
                    </p>
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
      const list = Array.isArray(res.data?.patients) ? res.data.patients : [];
      setPatients(list);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  if (selectedPatient) {
    return (
      <PaymentWorkspace
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-1">
      <div className="rounded-2xl p-5" style={S.card}>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Payment Management
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Search patient, open profile, select a checkup, and generate payment
            linked to that checkup.
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPatients()}
            placeholder="Search patient by name or phone"
            className="flex-1 px-5 py-3 rounded-full text-sm border outline-none transition-all"
            style={S.input}
            onFocus={focusInput}
            onBlur={blurInput}
          />
          <button
            onClick={loadPatients}
            disabled={isLoading}
            className="px-6 py-3 rounded-full text-sm font-semibold border inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{
              borderColor: "var(--color-border)",
              color: ORGANIC.primary,
            }}
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : patients.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl mt-6"
          style={{
            background: "rgba(93, 112, 82, 0.05)",
            border: `1.5px dashed ${ORGANIC.border}`,
          }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: ORGANIC.fg }}>
            No patients found
          </p>
          <p className="text-xs" style={{ color: ORGANIC.mutedFg }}>
            Try searching by name or phone number.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {patients.map((patient) => (
            <button
              key={patient._id}
              onClick={() => setSelectedPatient(patient)}
              className="w-full rounded-2xl overflow-hidden text-left transition-all hover:scale-102 active:scale-95"
              style={S.card}
            >
              <div className="flex items-center gap-4 p-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${ORGANIC.primary}, ${ORGANIC.secondary})`,
                  }}
                >
                  {getInitials(patient.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold"
                    style={{ color: ORGANIC.fg }}
                  >
                    {patient.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: ORGANIC.mutedFg }}
                  >
                    {patient.age} yrs · {patient.gender} · {patient.phone}
                  </p>
                </div>
                <span
                  className="text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0"
                  style={{
                    background: "rgba(93, 112, 82, 0.12)",
                    color: ORGANIC.primary,
                  }}
                >
                  Open →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
