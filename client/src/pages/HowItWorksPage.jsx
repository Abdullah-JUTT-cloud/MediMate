import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  FileText,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useRevealOnScroll from "../hooks/useRevealOnScroll";

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                 */
/* ------------------------------------------------------------------ */

/** Glassmorphic surface used across the page (design-system token driven). */
const GLASS =
  "rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/90 backdrop-blur-sm";

/** Device-window frame for every micro-mockup. */
const FRAME =
  "relative overflow-hidden rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)] shadow-[var(--shadow-float)] backdrop-blur-sm";

/** Micro label used inside mockups. */
const MICRO_LABEL =
  "font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]";

/** Primary micro button used inside mockups. */
const MICRO_BTN =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-2.5 text-xs font-bold text-[var(--color-on-primary)] shadow-[0_6px_18px_-8px_rgba(var(--color-primary-rgb),0.7)] transition-colors hover:bg-[var(--color-primary-hover)]";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Scroll-reveal wrapper. Direction is passed via modifier class so each
 * mockup can slide in from the side it sits on in the alternating layout.
 */
function Reveal({ className = "", delay = 0, from = "up", children }) {
  const [ref, isVisible] = useRevealOnScroll();
  return (
    <div
      ref={ref}
      className={`hiw-reveal hiw-from-${from} ${isVisible ? "hiw-in" : ""} ${className}`}
      style={{ "--hiw-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Pulsing status dot (green = live). */
function PulseDot({ className = "bg-emerald-500" }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${className}`}
      />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${className}`} />
    </span>
  );
}

/** Eyebrow pill used at the top of each section. */
function Eyebrow({ children, dot = "bg-emerald-500" }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 py-2 pl-3.5 pr-4">
      <PulseDot className={dot} />
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--color-primary)]">
        {children}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 01 — Reception modal (slot + discount micro-interactions)    */
/* ------------------------------------------------------------------ */

const SLOTS = ["6:45 PM", "7:00 PM", "7:30 PM"];
const ORIGINAL_FEE = 2000;
const DISCOUNT_VALUE = 200;

function ReceptionMockup() {
  const [slot, setSlot] = useState("7:30 PM");
  const [discountOn, setDiscountOn] = useState(true);
  const netFee = ORIGINAL_FEE - (discountOn ? DISCOUNT_VALUE : 0);

  return (
    <div className={FRAME}>
      {/* window bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <UserPlus className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-xs font-bold leading-tight">New Patient Visit</p>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Reception · Modal Flow
            </p>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)]/80 text-[var(--color-text-muted)]"
        >
          <X className="h-3 w-3" />
        </span>
      </div>

      <div className="space-y-3.5 p-4">
        {/* patient row */}
        <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-extrabold text-[var(--color-on-primary)]">
            KD
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">Kamran Dinani</p>
            <p className="font-mono text-[9px] tracking-wide text-[var(--color-text-muted)]">
              PATIENT #4821 · 0300-8455219
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 font-mono text-[8px] font-bold tracking-[0.14em] text-[var(--color-primary)]">
            CONSULTATION
          </span>
        </div>

        {/* slot picker */}
        <div>
          <p className={MICRO_LABEL}>Today's Time Slot</p>
          <div className="mt-1.5 flex gap-1.5" role="group" aria-label="Select today's time slot">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 font-mono text-[10px] font-bold transition-colors ${
                  slot === s
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40"
                }`}
              >
                <Clock className="h-3 w-3" />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* billing */}
        <div className="divide-y divide-[var(--color-border)]/70 overflow-hidden rounded-xl border border-[var(--color-border)]/80">
          <div className="flex items-center justify-between bg-[var(--color-bg-soft)]/40 px-3 py-2.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
              Original Fee
            </span>
            <span className="font-mono text-xs font-bold">Rs. {ORIGINAL_FEE.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between bg-[var(--color-bg-soft)]/40 px-3 py-2.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
              Discount
            </span>
            <span className="flex items-center gap-2">
              <span
                className={`font-mono text-xs font-bold ${
                  discountOn ? "text-emerald-600" : "text-[var(--color-text-muted)]"
                }`}
              >
                {discountOn ? `−Rs. ${DISCOUNT_VALUE}` : "−Rs. 0"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={discountOn}
                aria-label="Toggle patient discount"
                onClick={() => setDiscountOn((v) => !v)}
                className={`h-4 w-7 shrink-0 rounded-full p-0.5 transition-colors ${
                  discountOn ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]"
                }`}
              >
                <span
                  className={`block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                    discountOn ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </button>
            </span>
          </div>
          <div className="flex items-center justify-between bg-[var(--color-primary)]/[0.08] px-3 py-2.5">
            <span className="text-[11px] font-extrabold">Net Fee</span>
            <span className="font-mono text-sm font-extrabold text-[var(--color-primary)]">
              Rs. {netFee.toLocaleString()}
            </span>
          </div>
        </div>

        <button type="button" className={MICRO_BTN}>
          Charge at Reception · {slot}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 02 — Live queue (click a card to advance its status)         */
/* ------------------------------------------------------------------ */

function StatusPill({ status }) {
  if (status === "IN_CONSULTATION") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/12 px-2.5 py-1 font-mono text-[8px] font-bold tracking-[0.12em] text-[var(--color-primary)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />
        IN_CONSULTATION
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono text-[8px] font-bold tracking-[0.12em] text-amber-600">
      WAITING
    </span>
  );
}

function QueueMockup() {
  const [rows, setRows] = useState([
    { name: "Ayesha Khan", time: "7:00 PM", fee: "Rs. 1,800", status: "IN_CONSULTATION", overdue: false },
    { name: "Daniyal Rehman", time: "7:15 PM", fee: "Rs. 1,800", status: "WAITING", overdue: true },
    { name: "Kamran Dinani", time: "7:30 PM", fee: "Rs. 1,800", status: "WAITING", overdue: false },
    { name: "Fatima Noor", time: "8:15 PM", fee: "Rs. 1,600", status: "WAITING", overdue: false },
  ]);
  const [reminded, setReminded] = useState(false);

  const advance = (index) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index && !row.overdue
          ? {
              ...row,
              status: row.status === "WAITING" ? "IN_CONSULTATION" : "WAITING",
            }
          : row,
      ),
    );
  };

  return (
    <div className={FRAME}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Clock className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-xs font-bold leading-tight">Doctor Queue</p>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Wed · Aug 26 · 4 visits
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[8px] font-bold tracking-[0.14em] text-emerald-600">
          <PulseDot className="bg-emerald-500" />
          LIVE · 8:20 PM
        </span>
      </div>

      <div className="space-y-2 p-4">
        {rows.map((row, index) => (
          <div
            key={row.name}
            role="button"
            tabIndex={row.overdue ? -1 : 0}
            aria-label={
              row.overdue
                ? `${row.name}, ${row.time}, overdue`
                : `Advance ${row.name} from ${row.status.replace("_", " ")}`
            }
            onClick={() => advance(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                advance(index);
              }
            }}
            className={`rounded-xl border px-3 py-2.5 transition-all ${
              row.overdue
                ? "cursor-default border-rose-500/40 bg-rose-500/[0.05]"
                : "cursor-pointer border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/[0.04]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 shrink-0">
                <p className="font-mono text-[10px] font-bold tracking-wide text-[var(--color-text-secondary)]">
                  {row.time}
                </p>
                {row.overdue && (
                  <p className="mt-0.5 flex items-center gap-0.5 text-[8px] font-bold tracking-wider text-rose-600">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    OVERDUE
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{row.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                  <Check className="h-2.5 w-2.5 text-emerald-500" strokeWidth={3} />
                  {row.fee} paid upfront
                </p>
              </div>
              <StatusPill status={row.status} />
            </div>
            {row.overdue && (
              <div className="mt-2 pl-[4.25rem]">
                <button
                  type="button"
                  disabled={reminded}
                  onClick={(e) => {
                    e.stopPropagation();
                    setReminded(true);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[9px] font-bold tracking-wide transition-colors ${
                    reminded
                      ? "cursor-default border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                  }`}
                >
                  {reminded ? (
                    <>
                      <Check className="h-3 w-3" strokeWidth={3} />
                      Reminder Sent
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3" />
                      Send Late Reminder
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
        <p className="pt-1 text-center font-mono text-[9px] tracking-wide text-[var(--color-text-muted)]">
          → TAP ANY CARD TO TRANSITION ITS STATUS
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 03 — Doctor workspace (history drawer + spacious Rx fields)  */
/* ------------------------------------------------------------------ */

const PATIENT_VISITS = [
  { date: "AUG 12", note: "BP 130/85 · antihypertensive review" },
  { date: "JUL 28", note: "Prescription renewed · 28-day supply" },
  { date: "JUN 02", note: "First visit · lipid panel ordered" },
];

const FREQ_CHIPS = ["1-0-1", "1-1-1", "1-0-0"];

function PrescriptionMockup() {
  const [freq, setFreq] = useState("1-0-1");

  return (
    <div className={FRAME}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Stethoscope className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-xs font-bold leading-tight">Doctor Workspace</p>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Kamran Dinani · #4821
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/12 px-2.5 py-1 font-mono text-[8px] font-bold tracking-[0.14em] text-[var(--color-primary)]">
          <PulseDot className="bg-[var(--color-primary)]" />
          IN CONSULT
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* patient history drawer */}
        <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40">
          <p className={`${MICRO_LABEL} flex items-center gap-1.5 px-3 pt-3`}>
            <ClipboardList className="h-3 w-3" />
            Patient History
          </p>
          <div className="space-y-2 p-3">
            {PATIENT_VISITS.map((visit) => (
              <div
                key={visit.date}
                className="rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-card)]/70 px-2.5 py-2"
              >
                <p className="font-mono text-[8px] font-bold tracking-[0.14em] text-[var(--color-text-muted)]">
                  {visit.date}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold leading-snug text-[var(--color-text-secondary)]">
                  {visit.note}
                </p>
              </div>
            ))}
          </div>
          <div className="px-3 pb-3">
            <span className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-[10px] font-bold text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Penicillin Allergy
            </span>
          </div>
        </div>

        {/* prescription workspace */}
        <div className="space-y-3">
          <div>
            <p className={MICRO_LABEL}>Medicine Search · Salt-Aware</p>
            <div className="relative mt-1.5">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                readOnly
                value="Amoxi"
                aria-label="Medicine search (demo)"
                className="w-full rounded-lg border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 py-2 pl-8 pr-3 text-xs font-semibold outline-none"
              />
            </div>
            <div className="mt-1.5 divide-y divide-[var(--color-border)]/60 overflow-hidden rounded-lg border border-[var(--color-border)]/80">
              <div className="flex items-center justify-between bg-amber-500/[0.06] px-2.5 py-2">
                <div>
                  <p className="text-[11px] font-bold">Amoxicillin 500 mg</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-amber-600">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Penicillin class — blocked
                  </p>
                </div>
                <X className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              </div>
              <div className="flex items-center justify-between bg-[var(--color-primary)]/[0.06] px-2.5 py-2">
                <div>
                  <p className="text-[11px] font-bold">Azithromycin 500 mg</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-[var(--color-primary)]">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    Salt-safe alternative · in stock
                  </p>
                </div>
                <span className="rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-1 font-mono text-[8px] font-bold tracking-wider text-[var(--color-primary)]">
                  ADD
                </span>
              </div>
            </div>
          </div>

          {/* spacious dosage fields */}
          <div>
            <p className={MICRO_LABEL}>Dose & Frequency</p>
            <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
              <input
                readOnly
                value="500mg"
                aria-label="Dose amount (demo)"
                className="w-full rounded-lg border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 px-3 py-2.5 text-sm font-extrabold outline-none"
              />
              <div className="flex gap-1.5" role="group" aria-label="Dose frequency">
                {FREQ_CHIPS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFreq(f)}
                    aria-pressed={freq === f}
                    className={`rounded-lg border px-2.5 py-2.5 font-mono text-[10px] font-bold transition-colors ${
                      freq === f
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                        : "border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* optional lab fee */}
          <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--color-border-strong)]/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-sky-600" />
              <div>
                <p className="text-[11px] font-bold leading-tight">Lipid Profile</p>
                <p className="text-[9px] text-[var(--color-text-muted)]">Secondary lab fee</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[var(--color-text-secondary)]">
                Rs. 1,500
              </span>
              <button
                type="button"
                aria-label="Attach lab test fee"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <button type="button" className={MICRO_BTN}>
            Save Checkup & Generate PDF
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 04 — R2 + WhatsApp dispatch (phone chat widget)              */
/* ------------------------------------------------------------------ */

function DispatchMockup() {
  return (
    <div className={FRAME}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Send className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-xs font-bold leading-tight">Automated Dispatch</p>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              PDF → R2 → WhatsApp
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[8px] font-bold tracking-[0.14em] text-emerald-600">
          <PulseDot className="bg-emerald-500" />
          UNDER 2S
        </span>
      </div>

      {/* compile → store → deliver pipeline strip */}
      <div className="flex items-center justify-center gap-2 border-b border-[var(--color-border)]/60 px-4 py-2.5">
        {["PDF COMPILED", "STREAMED TO R2", "DELIVERED"].map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && (
              <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" aria-hidden="true" />
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[8px] font-bold tracking-[0.12em] ${
                i === 2
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                  : "border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 text-[var(--color-text-secondary)]"
              }`}
            >
              {i === 2 && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              {label}
            </span>
          </span>
        ))}
      </div>

      {/* WhatsApp chat (fixed brand theme — authentic in both modes) */}
      <div className="overflow-hidden rounded-2xl border border-[#182229] bg-[#0b141a] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]">
        {/* chat header */}
        <div className="flex items-center gap-2.5 bg-[#202c33] px-3.5 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-extrabold text-white">
            DA
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[11px] font-bold leading-tight text-white">
              <span className="truncate">Dr. Ahmed Clinic</span>
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#53bdeb]" />
            </p>
            <p className="text-[9px] text-[#8696a0]">MedAlerto · Automated dispatch</p>
          </div>
          <Send className="h-4 w-4 text-[#8696a0]" aria-hidden="true" />
        </div>

        {/* messages */}
        <div
          className="space-y-2 px-3 py-3"
          style={{
            backgroundImage:
              "radial-gradient(rgba(134,150,160,0.08) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        >
          <span className="mx-auto block rounded-md bg-[#111b21] px-2.5 py-1 font-mono text-[8px] font-bold tracking-wider text-[#8696a0]">
            TODAY
          </span>

          {/* outgoing text bubble */}
          <div className="ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 shadow">
            <p className="text-[11px] font-medium leading-snug text-white">
              Assalam o Alaikum, Mr. Dinani 👋
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#c8f7e5]">
              Your prescription from today's visit is ready.
            </p>
            <p className="mt-1 text-right text-[8px] text-[#c8f7e5]/70">7:31 PM</p>
          </div>

          {/* outgoing file bubble */}
          <div className="ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-[#005c4b] p-1.5 shadow">
            <div className="flex items-center gap-2.5 rounded-md bg-[#111b21] px-2.5 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500/15 text-red-400">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-white">
                  Prescription_KDN.pdf
                </p>
                <p className="text-[9px] text-[#8696a0]">248 KB · PDF · Tap to download</p>
              </div>
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f2c34] text-[#53bdeb]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
                </svg>
              </span>
            </div>
            <p className="mt-1 flex items-center justify-end gap-1 px-1 pb-0.5 text-[8px] text-[#c8f7e5]/70">
              7:31 PM
              <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
            </p>
          </div>

          {/* patient reply */}
          <div className="w-fit max-w-[85%] rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2 shadow">
            <p className="text-[11px] leading-snug text-white">Ji doctor, shukriya 🙏</p>
            <p className="mt-0.5 text-right text-[8px] text-[#c8f7e5]/60">7:32 PM</p>
          </div>
        </div>
      </div>

      {/* R2 security strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-text-secondary)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          Cloudflare R2 · Zero-Egress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider text-[var(--color-primary)]">
            LATENCY &lt; 150MS
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider text-emerald-600">
            DELIVERED 1.8S
          </span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 05 — Financial dashboard (earnings, discounts, breakdown)    */
/* ------------------------------------------------------------------ */

const WEEK_BARS = [
  { day: "M", h: 22 },
  { day: "T", h: 34 },
  { day: "W", h: 26 },
  { day: "T", h: 46 },
  { day: "F", h: 38 },
  { day: "S", h: 54 },
  { day: "S", h: 66 },
];

function FinancialsMockup() {
  return (
    <div className={FRAME}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Wallet className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-xs font-bold leading-tight">Financials — Today</p>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Wed · Aug 26 · Real-Time
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[8px] font-bold tracking-[0.14em] text-emerald-600">
          <PulseDot className="bg-emerald-500" />
          LIVE
        </span>
      </div>

      <div className="space-y-3 p-4">
        {/* stat tiles */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40 p-2.5">
            <p className={MICRO_LABEL}>Net Earnings</p>
            <p className="mt-1 font-mono text-sm font-extrabold text-[var(--color-primary)]">
              Rs. 23,400
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
              <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.5} />
              +12% vs yesterday
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40 p-2.5">
            <p className={`${MICRO_LABEL} flex items-center gap-1`}>
              <Coins className="h-2.5 w-2.5" />
              Discounts
            </p>
            <p className="mt-1 font-mono text-sm font-extrabold text-amber-600">Rs. 1,800</p>
            <p className="mt-0.5 text-[9px] font-semibold text-[var(--color-text-muted)]">
              6 patients
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40 p-2.5">
            <p className={`${MICRO_LABEL} flex items-center gap-1`}>
              <FileText className="h-2.5 w-2.5" />
              Lab Revenue
            </p>
            <p className="mt-1 font-mono text-sm font-extrabold text-sky-600">Rs. 4,500</p>
            <p className="mt-0.5 text-[9px] font-semibold text-[var(--color-text-muted)]">
              3 tests
            </p>
          </div>
        </div>

        {/* category breakdown */}
        <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40 p-3">
          <div className="flex items-center justify-between">
            <p className={MICRO_LABEL}>Category Breakdown</p>
            <p className="font-mono text-[8px] font-bold tracking-[0.12em] text-[var(--color-text-muted)]">
              CONSULTATION VS LAB FEES
            </p>
          </div>
          <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]/40">
            <div className="w-[62%] bg-[var(--color-primary)]" />
            <div className="w-[38%] bg-sky-500" />
          </div>
          <div className="mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--color-text-secondary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              Consultation · 62%
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--color-text-secondary)]">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Lab Fees · 38%
            </span>
          </div>
        </div>

        {/* 7-day trend */}
        <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40 p-3">
          <div className="flex h-16 items-end gap-1.5">
            {WEEK_BARS.map((bar, i) => (
              <div key={`${bar.day}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div
                  className={`w-full rounded-t-md ${
                    i === WEEK_BARS.length - 1
                      ? "bg-[var(--color-primary)]"
                      : "bg-[var(--color-primary)]/25"
                  }`}
                  style={{ height: `${bar.h}px` }}
                />
                <span className="font-mono text-[8px] font-bold text-[var(--color-text-muted)]">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline data                                                     */
/* ------------------------------------------------------------------ */

const STAGE_CHIPS = [
  { icon: UserPlus, label: "Reception" },
  { icon: Clock, label: "Live Queue" },
  { icon: Stethoscope, label: "Consultation" },
  { icon: Send, label: "Dispatch" },
  { icon: BarChart3, label: "Financials" },
];

const STEPS = [
  {
    badge: "STEP 01 — RECEPTION",
    title: "Patient Registration & Upfront Payment",
    description:
      "The receptionist registers or selects the patient, assigns today's time slot, and logs upfront consultation fees in a single modal flow.",
    output: "Patient lands in today's queue automatically",
    flow: "AUTO-ADVANCE",
    Mockup: ReceptionMockup,
  },
  {
    badge: "STEP 02 — LIVE QUEUE",
    title: "Automated Doctor Queue Management",
    description:
      "Today's visits auto-sort chronologically (7:00 PM, 7:15 PM, 7:30 PM). Clicking a card transitions status from WAITING to IN_CONSULTATION and loads historical medical records.",
    output: "One click loads history & opens the doctor workspace",
    flow: "RECORDS LOADED",
    Mockup: QueueMockup,
  },
  {
    badge: "STEP 03 — CONSULTATION",
    title: "Spacious Prescription & Medicine Search",
    description:
      "Doctor inspects past visit history, checks salt-composition medicine alternatives, inputs spacious dosage fields (500mg, 1-0-1), and attaches optional lab test fees.",
    output: "Saving compiles the branded PDF instantly",
    flow: "PDF COMPILED",
    Mockup: PrescriptionMockup,
  },
  {
    badge: "STEP 04 — AUTOMATED DISPATCH",
    title: "Zero-Egress PDF Generation & Meta Cloud API Delivery",
    description:
      "Saving the checkup compiles a branded PDF, streams it directly to Cloudflare R2 storage, and dispatches a native downloadable PDF attachment to the patient's WhatsApp chat in under 2 seconds.",
    output: "Net fee & lab revenue hit the day's ledger",
    flow: "REPORTS SYNCED",
    Mockup: DispatchMockup,
  },
  {
    badge: "STEP 05 — FINANCIALS",
    title: "Net Earnings & Practice Insights",
    description:
      "Automatically audit daily net earnings, total discounts provided to patients, and secondary lab test revenues in real time.",
    output: "Your practice, quantified in real time",
    flow: null,
    Mockup: FinancialsMockup,
  },
];

const MILESTONES = [
  {
    tag: "DAY 1",
    title: "Account & PMDC Setup",
    items: [
      "Create your clinic account",
      "Configure clinic profile & doctor details",
      "Verify PMDC registration number",
      "Complete bank transfer setup",
    ],
    highlight: false,
  },
  {
    tag: "DAY 2",
    title: "Staff & Queue Alignment",
    items: [
      "Receptionist walk-in booking training",
      "Upfront billing & discount handling",
      "Queue management & token drill",
    ],
    highlight: false,
  },
  {
    tag: "WEEK 1+",
    title: "Fully Paperless Operations",
    items: [
      "100% digital prescriptions",
      "Instant WhatsApp dispatches",
      "Automated follow-up scheduling",
      "Net revenue & discount auditing",
    ],
    highlight: true,
  },
];

/* ------------------------------------------------------------------ */
/*  One alternating row of the assembly line                          */
/* ------------------------------------------------------------------ */

function StepRow({ step, index }) {
  const even = index % 2 === 0;
  const [textRef, textIn] = useRevealOnScroll();
  const [mockRef, mockIn] = useRevealOnScroll();
  const Mockup = step.Mockup;

  return (
    <div className="relative lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-24 xl:gap-x-28">
      {/* spine node */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-10 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
      >
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[var(--color-bg)] bg-[var(--color-card)] shadow-[var(--shadow-float)]">
          <span className="absolute inset-1 rounded-full bg-[var(--color-primary)]/10" />
          <span className="relative font-mono text-base font-extrabold text-[var(--color-primary)]">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* copy column */}
      <div
        ref={textRef}
        className={`pl-[4.5rem] sm:pl-[5.25rem] lg:pl-0 ${
          even ? "lg:col-start-1" : "lg:col-start-2"
        } hiw-reveal ${even ? "hiw-from-left" : "hiw-from-right"} ${
          textIn ? "hiw-in" : ""
        }`}
      >
        <span className="inline-flex items-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1.5 font-mono text-[9px] font-bold tracking-[0.22em] text-[var(--color-primary)]">
          {step.badge}
        </span>
        <h3 className="mt-4 font-heading text-2xl font-bold leading-snug text-[var(--color-text-primary)] sm:text-[1.75rem]">
          {step.title}
        </h3>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {step.description}
        </p>
        <p className="mt-4 flex items-start gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          <ArrowRight
            className="mt-[1px] h-3 w-3 shrink-0 text-[var(--color-primary)]"
            aria-hidden="true"
          />
          {step.output}
        </p>
      </div>

      {/* mockup column */}
      <div
        ref={mockRef}
        className={`mt-6 pl-[4.5rem] sm:pl-[5.25rem] lg:mt-0 lg:pl-0 ${
          even ? "lg:col-start-2" : "lg:col-start-1"
        } hiw-reveal ${even ? "hiw-from-right" : "hiw-from-left"} ${
          mockIn ? "hiw-in" : ""
        }`}
        style={{ "--hiw-delay": "120ms" }}
      >
        <Mockup />
      </div>

      {/* inter-stage flow chip (desktop) */}
      {step.flow && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 lg:flex"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 px-3 py-1.5 font-mono text-[8px] font-bold tracking-[0.2em] text-[var(--color-text-muted)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
            <Activity className="h-3 w-3 text-[var(--color-primary)]" />
            {step.flow}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Closing CTA                                                       */
/* ------------------------------------------------------------------ */

const CTA_TRUST_ITEMS = ["14-Day Free Access", "No Credit Card Needed"];

function ClosingCta() {
  const navigate = useNavigate();
  const [sectionRef, isVisible] = useRevealOnScroll();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Enter your work email to start the free trial.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    // Hand the captured address to the signup flow so the doctor never types
    // it twice.
    navigate("/signup", { state: { email: trimmed } });
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="closing-cta-heading"
      className="mt-16 sm:mt-24"
    >
      <div
        className={`hiw-cta-reveal ${isVisible ? "is-in" : ""}`}
      >
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 text-white shadow-2xl sm:p-12">
          {/* ambient glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent"
          />
          <div aria-hidden="true" className="hiw-grid-center absolute inset-0" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* copy */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-teal-400/25 bg-teal-400/10 py-2 pl-3.5 pr-4 backdrop-blur-sm">
                <PulseDot className="bg-emerald-400" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-teal-200">
                  Go Live This Week
                </span>
              </span>
              <h2
                id="closing-cta-heading"
                className="mt-6 max-w-2xl font-heading text-3xl font-bold leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-5xl"
              >
                Ready to experience a friction-free clinic workflow?
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Set up your account in under 5 minutes and run your next clinic
                day with total operational clarity.
              </p>
            </div>

            {/* action group */}
            <div className="lg:col-span-5">
              <form onSubmit={handleSubmit} noValidate className="w-full">
                <label htmlFor="how-it-works-email" className="sr-only">
                  Work email address
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="how-it-works-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="doctor@clinic.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={error ? "how-it-works-email-error" : undefined}
                    className="h-14 w-full flex-1 rounded-full border border-slate-700 bg-slate-800/80 px-5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/25"
                  />
                  <button
                    type="submit"
                    className="group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-teal-500 px-7 text-sm font-bold text-slate-950 shadow-[0_18px_40px_-16px_rgba(45,212,191,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300 active:translate-y-0"
                  >
                    Start Free Trial
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <p
                  id="how-it-works-email-error"
                  role="alert"
                  aria-live="polite"
                  className={`mt-3 min-h-[1.25rem] px-1 text-xs font-semibold text-rose-300 transition-opacity duration-200 ${
                    error ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {error || "\u00A0"}
                </p>

                <ul className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                  {CTA_TRUST_ITEMS.map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-400/15 text-teal-300"
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function HowItWorksPage() {
  const scrollToPipeline = () =>
    document
      .getElementById("pipeline")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl"
      />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <section
            aria-labelledby="hero-heading"
            className="relative mt-6 sm:mt-10"
          >
            <Reveal>
              <div
                className={`relative overflow-hidden ${GLASS} px-6 py-14 text-center shadow-[var(--shadow-soft)] sm:px-12 sm:py-20`}
              >
                <div aria-hidden="true" className="hiw-grid absolute inset-0" />
                <div className="relative mx-auto max-w-4xl">
                  <Eyebrow>The Clinic Operational Pipeline</Eyebrow>

                  <h1
                    id="hero-heading"
                    className="mt-7 font-heading text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]"
                  >
                    From patient check-in to{" "}
                    <span className="text-[var(--color-primary)]">
                      WhatsApp dispatch
                    </span>{" "}
                    in 5 seamless steps.
                  </h1>

                  <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
                    See how MedAlerto collapses patient arrival, upfront
                    billing, digital consultations, and document delivery into
                    a unified assembly line.
                  </p>

                  <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={scrollToPipeline}
                      className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-7 text-sm font-bold text-[var(--color-on-primary)] shadow-[0_10px_28px_-10px_rgba(var(--color-primary-rgb),0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] sm:w-auto"
                    >
                      Launch Interactive Workflow
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </button>
                    <Link
                      to="/pricing"
                      className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[var(--color-border-strong)]/70 bg-[var(--color-card)]/60 px-7 text-sm font-bold text-[var(--color-text-primary)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] sm:w-auto"
                    >
                      View Pricing
                    </Link>
                  </div>

                  {/* mini stage strip */}
                  <div className="mt-11 flex flex-wrap items-center justify-center gap-2">
                    {STAGE_CHIPS.map((stage, i) => {
                      const Icon = stage.icon;
                      return (
                        <span key={stage.label} className="flex items-center gap-2">
                          {i > 0 && (
                            <ArrowRight
                              className="h-3 w-3 text-[var(--color-text-muted)]/50"
                              aria-hidden="true"
                            />
                          )}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)]/80 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] backdrop-blur-sm">
                            <Icon className="h-3 w-3 text-[var(--color-primary)]" />
                            {stage.label}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ── PIPELINE ─────────────────────────────────────────────────── */}
          <section id="pipeline" aria-labelledby="pipeline-heading" className="mt-20 scroll-mt-28 sm:mt-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow dot="bg-[var(--color-primary)]">Interactive Workflow</Eyebrow>
              <h2
                id="pipeline-heading"
                className="mt-6 font-heading text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl"
              >
                One assembly line, five operational stages.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
                Every hand-off below is automatic. Click cards, flip toggles,
                and advance the queue — the same controls your front desk and
                doctor use every day.
              </p>
            </Reveal>

            <div className="relative mt-14 sm:mt-16">
              {/* spine */}
              <div
                aria-hidden="true"
                className="absolute bottom-6 left-7 top-6 w-px -translate-x-1/2 bg-[var(--color-border-strong)]/50 lg:left-1/2"
              >
                <div className="hiw-flow absolute inset-0" />
              </div>

              <div className="space-y-14 lg:space-y-24">
                {STEPS.map((step, index) => (
                  <StepRow key={step.badge} step={step} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* ── ONBOARDING ROADMAP ───────────────────────────────────────── */}
          <section
            aria-labelledby="onboarding-heading"
            className={`mt-20 ${GLASS} p-6 shadow-[var(--shadow-soft)] sm:mt-28 sm:p-10`}
          >
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>Onboarding Roadmap</Eyebrow>
              <h2
                id="onboarding-heading"
                className="mt-6 font-heading text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl"
              >
                What day 1 to production looks like
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
                A predictable ramp — you are paperless in a week, not a
                quarter.
              </p>
            </Reveal>

            <div className="relative mt-10 grid gap-5 lg:grid-cols-3 lg:gap-7">
              {/* progressive connector */}
              <div
                aria-hidden="true"
                className="absolute left-[16.666%] right-[16.666%] top-8 hidden h-px bg-gradient-to-r from-[var(--color-primary)]/0 via-[var(--color-primary)]/50 to-[var(--color-primary)]/0 lg:block"
              />
              {MILESTONES.map((milestone, i) => (
                <Reveal key={milestone.tag} delay={i * 140}>
                  <article
                    className={`relative h-full rounded-3xl border p-6 backdrop-blur-sm sm:p-7 ${
                      milestone.highlight
                        ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/[0.06] shadow-[var(--shadow-float)]"
                        : "border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full border px-3 py-1 font-mono text-[9px] font-bold tracking-[0.22em] ${
                          milestone.highlight
                            ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "border-[var(--color-border)]/80 bg-[var(--color-card)]/70 text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {milestone.tag}
                      </span>
                      <span
                        aria-hidden="true"
                        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[var(--color-card)] bg-[var(--color-primary)] font-mono text-sm font-extrabold text-[var(--color-on-primary)] shadow-[var(--shadow-float)]"
                      >
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-bold leading-snug">
                      {milestone.title}
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {milestone.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-sm leading-snug text-[var(--color-text-secondary)]"
                        >
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {milestone.highlight && (
                      <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[9px] font-bold tracking-[0.18em] text-emerald-600">
                        <PulseDot className="bg-emerald-500" />
                        FULLY AUTONOMOUS
                      </p>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── CLOSING CTA ──────────────────────────────────────────────── */}
          <ClosingCta />
        </div>
      </main>

      <Footer />

      <style>{`
        /* Scroll-reveal (CSS-only entrance, direction-aware) */
        .hiw-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition:
            opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--hiw-delay, 0ms);
          will-change: opacity, transform;
        }
        .hiw-from-left { transform: translateX(-34px); }
        .hiw-from-right { transform: translateX(34px); }
        .hiw-in { opacity: 1; transform: none; }

        /* Animated flow along the assembly-line spine */
        .hiw-flow {
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(var(--color-primary-rgb), 0.55) 45%,
            rgba(var(--color-primary-rgb), 0.55) 55%,
            transparent
          );
          background-size: 100% 140px;
          background-repeat: repeat-y;
          animation: hiwFlow 3s linear infinite;
        }
        @keyframes hiwFlow {
          from { background-position: 0 -140px; }
          to { background-position: 0 140px; }
        }

        /* Faint engineered grid */
        .hiw-grid {
          background-image:
            linear-gradient(to right, rgb(100 116 139 / 0.09) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(100 116 139 / 0.09) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: radial-gradient(ellipse at 50% 0%, #000 12%, transparent 72%);
          mask-image: radial-gradient(ellipse at 50% 0%, #000 12%, transparent 72%);
        }
        .hiw-grid-center {
          background-image:
            linear-gradient(to right, rgb(148 163 184 / 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(148 163 184 / 0.07) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: radial-gradient(ellipse at center, #000 15%, transparent 72%);
          mask-image: radial-gradient(ellipse at center, #000 15%, transparent 72%);
        }

        /* Closing CTA reveal + ping */
        .hiw-cta-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition:
            opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hiw-cta-reveal.is-in { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .hiw-reveal,
          .hiw-cta-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .hiw-flow { animation: none; }
        }
      `}</style>
    </div>
  );
}
