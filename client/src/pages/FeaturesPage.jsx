import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ------------------------------------------------------------------ */
/*  Shared design primitives                                          */
/* ------------------------------------------------------------------ */

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/** Glassmorphic surface used across the page (design-system token driven). */
const GLASS =
  "border border-[var(--color-border)]/80 backdrop-blur-sm rounded-3xl bg-[var(--color-card)]/90";

/** Small monospace code/data pill. */
function DataPill({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/70 text-[var(--color-text-secondary)]",
    primary:
      "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Animated live-dot indicator. */
function LiveDot({ className = "bg-[var(--color-primary)]" }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${className}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${className}`} />
    </span>
  );
}

/** Miniature toggle switch (accessible button). */
function MicroToggle({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${
        on ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/** Inline heroicon-style SVG wrapper. */
function Icon({ d, className = "h-4 w-4", strokeWidth = 2 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ICONS = {
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  chat: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  shield:
    "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z",
  chart:
    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  rx: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  folder:
    "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  check: "M5 13l4 4L19 7",
  arrowRight: "M17 8l4 4m0 0l-4 4m4-4H3",
  warning:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  currency:
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  whatsApp:
    "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

/* ------------------------------------------------------------------ */
/*  Hero console — live queue + WhatsApp PDF dispatch micro-preview   */
/* ------------------------------------------------------------------ */

const QUEUE_DEMO_PATIENTS = [
  { name: "Ayesha Khan", token: "T-07", time: "6:45 PM", initials: "AK", fee: "Rs. 1,800" },
  { name: "Daniyal Rehman", token: "T-08", time: "7:00 PM", initials: "DR", fee: "Rs. 1,800" },
  { name: "Sana Tariq", token: "T-09", time: "7:15 PM", initials: "ST", fee: "Rs. 1,600" },
];

const QUEUE_TICKS = [
  ["IN_CONSULTATION", "WAITING", "WAITING"],
  ["COMPLETED", "IN_CONSULTATION", "WAITING"],
  ["COMPLETED", "COMPLETED", "IN_CONSULTATION"],
];

const STATUS_STYLE = {
  WAITING: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  IN_CONSULTATION:
    "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/40",
  COMPLETED:
    "bg-[var(--color-bg-soft)] text-[var(--color-text-muted)] border-[var(--color-border)]",
};

function StatusBadge({ status, fresh }) {
  return (
    <span
      key={fresh ? "fresh" : "stable"}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8.5px] font-bold tracking-wider ${STATUS_STYLE[status]} ${fresh ? "fx-flash" : ""}`}
    >
      {status === "IN_CONSULTATION" && <LiveDot className="bg-[var(--color-primary)] scale-75" />}
      {status.replace("_", " ")}
    </span>
  );
}

function HeroQueuePanel() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => (v + 1) % QUEUE_TICKS.length), 3600);
    return () => clearInterval(t);
  }, []);

  const statuses = QUEUE_TICKS[tick];
  const prevStatuses = QUEUE_TICKS[(tick + QUEUE_TICKS.length - 1) % QUEUE_TICKS.length];

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LiveDot />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-primary)]">
            Today's Active Queue
          </p>
        </div>
        <DataPill tone="primary">3 LIVE</DataPill>
      </div>

      {/* auto-advance progress bar */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]/60">
        <div className="fx-autoadvance h-full rounded-full bg-[var(--color-primary)]/70" />
      </div>

      <div className="flex flex-col gap-2">
        {QUEUE_DEMO_PATIENTS.map((p, i) => {
          const status = statuses[i];
          const fresh = status === "IN_CONSULTATION" && prevStatuses[i] !== "IN_CONSULTATION";
          return (
            <div
              key={p.token}
              className={`flex items-center justify-between gap-2 rounded-xl border bg-[var(--color-card)] p-2.5 transition-all duration-500 ${
                status === "IN_CONSULTATION"
                  ? "border-[var(--color-primary)]/40 shadow-[0_0_20px_-6px_rgba(var(--color-primary-rgb),0.45)]"
                  : "border-[var(--color-border)]/70"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white ${
                    status === "COMPLETED" ? "bg-[var(--color-border-strong)]" : "bg-[var(--color-primary)]"
                  }`}
                >
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[var(--color-text-primary)]">{p.name}</p>
                  <p className="font-mono text-[8.5px] text-[var(--color-text-muted)]">
                    {p.token} • {p.time} • {p.fee}
                  </p>
                </div>
              </div>
              <StatusBadge status={status} fresh={fresh} />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-border)]/60 pt-2.5">
        <Icon d={ICONS.bolt} className="h-3 w-3 text-[var(--color-primary)]" strokeWidth={2.5} />
        <p className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Socket.IO auto-advance • WAITING → IN_CONSULTATION
        </p>
      </div>
    </div>
  );
}

const DISPATCH_STEPS = [
  { label: "Rendering Rx PDF", detail: "clinic-branded layout" },
  { label: "Stored on Cloudflare R2", detail: "rx/2026-08/AK.pdf • 182 KB" },
  { label: "Meta Cloud API dispatch", detail: "v19.0 media message" },
  { label: "Delivered on WhatsApp", detail: "read-receipt confirmed" },
];

function HeroDispatchPanel() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 6), 1050);
    return () => clearInterval(t);
  }, []);

  const delivered = step >= 4;
  const elapsed = delivered ? "1.8s" : ["0.3s", "0.7s", "1.2s", "1.6s"][Math.min(step, 3)];

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon d={ICONS.whatsApp} className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.2} />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-primary)]">
            WhatsApp PDF Dispatch
          </p>
        </div>
        <DataPill tone={delivered ? "green" : "primary"}>{delivered ? "DELIVERED" : "IN FLIGHT"}</DataPill>
      </div>

      {/* File card */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-card)] p-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <Icon d={ICONS.doc} className="h-3.5 w-3.5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-bold text-[var(--color-text-primary)]">
              Rx_AyeshaKhan_0826.pdf
            </p>
            <p className="font-mono text-[8.5px] text-[var(--color-text-muted)]">182 KB • R2 signed URL</p>
          </div>
        </div>
        <span className="font-mono text-[10px] font-bold text-[var(--color-primary)]">{elapsed}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {DISPATCH_STEPS.map((s, i) => {
          const done = delivered || i < step;
          const active = !delivered && i === step;
          return (
            <div key={s.label} className="flex items-center gap-2.5">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  done
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500"
                    : active
                      ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-transparent text-transparent"
                }`}
              >
                {done ? (
                  <Icon d={ICONS.check} className="h-2.5 w-2.5" strokeWidth={3.5} />
                ) : active ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
                )}
              </span>
              <p
                className={`text-[10px] font-bold ${
                  done
                    ? "text-[var(--color-text-primary)]"
                    : active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)]"
                }`}
              >
                {s.label}
                <span className="ml-1.5 hidden font-mono text-[8.5px] font-semibold text-[var(--color-text-muted)] sm:inline">
                  {s.detail}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-1.5 border-t border-[var(--color-border)]/60 pt-2.5">
        <LiveDot className={delivered ? "bg-emerald-500" : "bg-[var(--color-primary)]"} />
        <p className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          {delivered ? "0% egress • R2 → patient in 1.8s" : "Streaming via Cloudflare R2…"}
        </p>
      </div>
    </div>
  );
}

function HeroConsole() {
  return (
    <div
      id="demo-queue"
      className="relative overflow-hidden rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/90 shadow-[var(--shadow-float)] backdrop-blur-sm"
    >
      {/* Console chrome */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <p className="font-mono text-[10px] font-bold tracking-wider text-[var(--color-text-secondary)]">
            medalerto.app/console — Tue 7:42 PM
          </p>
        </div>
        <DataPill tone="green">
          <LiveDot className="bg-emerald-500 scale-75" /> LIVE
        </DataPill>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <HeroQueuePanel />
        <HeroDispatchPanel />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero section                                                      */
/* ------------------------------------------------------------------ */

function HeroSection() {
  return (
    <section className={`${GLASS} relative overflow-hidden p-8 pb-10 shadow-[var(--shadow-soft)] sm:p-12 sm:pb-14`}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
      <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
            <LiveDot />
            Engineered Clinic Infrastructure
          </span>

          <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.08] text-[var(--color-text-primary)] sm:text-5xl xl:text-[3.4rem]">
            Every clinical workflow, orchestrated in a{" "}
            <span className="text-[var(--color-primary)]">single queue-driven system.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Built specifically for independent practitioners and outpatient clinics. Eliminates
            administrative friction across consultations, upfront billing, digital prescriptions,
            and WhatsApp patient dispatches.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => scrollToId("architecture")}
              className="group inline-flex items-center gap-2.5 rounded-full bg-[var(--color-primary)] px-7 py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-float)]"
            >
              Explore Interactive Workflows
              <Icon d={ICONS.arrowRight} className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => scrollToId("demo-queue")}
              className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-card)]/80 px-7 py-3.5 text-sm font-bold text-[var(--color-text-primary)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
            >
              <Icon d={ICONS.bolt} className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.5} />
              Launch Demo Queue
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-2 border-t border-[var(--color-border)]/60 pt-8">
            <DataPill tone="primary">Meta Cloud API v19.0</DataPill>
            <DataPill>Cloudflare R2 Storage</DataPill>
            <DataPill>Socket.IO Realtime Queue</DataPill>
            <DataPill>PMDC-Ready Audit Trails</DataPill>
          </div>
        </div>

        <HeroConsole />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Architecture module widgets (micro-previews)                      */
/* ------------------------------------------------------------------ */

function RxWidget() {
  const [pdfState, setPdfState] = useState("idle"); // idle | busy | done

  const generate = () => {
    if (pdfState === "busy") return;
    setPdfState("busy");
    setTimeout(() => setPdfState("done"), 900);
    setTimeout(() => setPdfState("idle"), 3400);
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/50 p-3.5">
      <div className="flex items-center justify-between border-b border-dashed border-[var(--color-border)]/70 pb-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Rx Editor — Paracetamol
        </p>
        <DataPill tone="primary">SPACIOUS LAYOUT</DataPill>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {["500mg", "1-0-1", "7 days", "After meals"].map((chip) => (
          <span
            key={chip}
            className="rounded-md border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 px-2 py-1 font-mono text-[10px] font-bold text-[var(--color-primary)]"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-2">
        <Icon d={ICONS.search} className="h-3 w-3 shrink-0 text-emerald-500" strokeWidth={2.5} />
        <p className="truncate font-mono text-[9.5px] font-bold text-[var(--color-text-primary)]">
          Paracetamol 500mg <span className="text-emerald-500">→ Salt Equivalent Found</span>
        </p>
      </div>

      <button
        type="button"
        onClick={generate}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold transition-all duration-300 ${
          pdfState === "done"
            ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
            : "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        }`}
      >
        <Icon d={pdfState === "done" ? ICONS.check : ICONS.doc} className="h-3.5 w-3.5" strokeWidth={2.5} />
        {pdfState === "done"
          ? "Stored: r2://rx/2026-08/Rx_1042.pdf"
          : pdfState === "busy"
            ? "Rendering PDF…"
            : "Generate Cloudflare R2 PDF"}
      </button>
    </div>
  );
}

function VaultWidget() {
  const visits = [
    { date: "Aug 12", label: "Follow-up", detail: "BP 128/84 • Rx issued" },
    { date: "Jul 02", label: "Lab review", detail: "HbA1c 5.9% • Lipid panel" },
    { date: "May 19", label: "Initial checkup", detail: "History captured" },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/50 p-3.5">
      <div className="flex items-center justify-between border-b border-dashed border-[var(--color-border)]/70 pb-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Patient Vault — A. Khan
        </p>
        <DataPill tone="primary">TIMELINE</DataPill>
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/8 px-2.5 py-2">
        <Icon d={ICONS.warning} className="h-3.5 w-3.5 shrink-0 text-rose-500" strokeWidth={2.5} />
        <p className="font-mono text-[9.5px] font-bold text-rose-500">⚠️ Penicillin Allergy</p>
        <span className="ml-auto font-mono text-[8px] font-bold uppercase tracking-wider text-rose-400">
          Rx Block Active
        </span>
      </div>

      <div className="mt-3 flex flex-col">
        {visits.map((v, i) => (
          <div key={v.date} className="relative flex gap-3 pb-2.5 last:pb-0">
            {i < visits.length - 1 && (
              <span className="absolute left-[5px] top-3.5 h-full w-px bg-[var(--color-border)]" />
            )}
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-card)]" />
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold text-[var(--color-text-primary)]">
                {v.label} <span className="ml-1 font-mono text-[8.5px] font-semibold text-[var(--color-text-muted)]">{v.date}</span>
              </p>
              <p className="truncate font-mono text-[9px] text-[var(--color-text-secondary)]">{v.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-[var(--color-border)]/80 bg-[var(--color-card)] px-2.5 py-2">
        <Icon d={ICONS.search} className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" strokeWidth={2.5} />
        <p className="font-mono text-[9.5px] font-semibold text-[var(--color-text-muted)]">
          diagnostics:<span className="ml-1 text-[var(--color-primary)]">"hba1c" → 2 matches</span>
        </p>
      </div>
    </div>
  );
}

function QueueEngineWidget() {
  const rows = [
    { time: "7:00 PM", name: "Daniyal R.", fee: "Rs. 1,800", cat: "CONSULTATION", status: "IN_CONSULTATION" },
    { time: "7:15 PM", name: "Sana T.", fee: "Rs. 1,600", cat: "CONSULTATION", status: "WAITING", next: true },
    { time: "7:30 PM", name: "Walk-in", fee: "Rs. 2,000", cat: "UPFRONT BILL", status: "WAITING" },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/50 p-3.5">
      <div className="flex items-center justify-between border-b border-dashed border-[var(--color-border)]/70 pb-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Evening Slot — Time Sorted
        </p>
        <DataPill tone="amber">AUTO-ADVANCE</DataPill>
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        {rows.map((r) => (
          <div
            key={r.time}
            className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
              r.status === "IN_CONSULTATION"
                ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/8"
                : "border-[var(--color-border)]/70 bg-[var(--color-card)]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-[9.5px] font-bold text-[var(--color-primary)]">{r.time}</span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] font-bold text-[var(--color-text-primary)]">{r.name}</p>
                <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {r.cat}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-md bg-[var(--color-bg-soft)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--color-text-primary)]">
                {r.fee}
              </span>
              {r.next ? (
                <span className="inline-flex items-center gap-1 font-mono text-[8px] font-bold text-amber-500">
                  <Icon d={ICONS.clock} className="h-2.5 w-2.5" strokeWidth={3} /> NEXT
                </span>
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    r.status === "IN_CONSULTATION" ? "bg-[var(--color-primary)] animate-pulse" : "bg-amber-400"
                  }`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--color-border)]/60 pt-2.5">
        <Icon d={ICONS.bolt} className="h-3 w-3 text-[var(--color-primary)]" strokeWidth={2.5} />
        <p className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Net fee locked at booking • status transitions broadcast live
        </p>
      </div>
    </div>
  );
}

function WhatsAppWidget() {
  const [reminder, setReminder] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/50 p-3.5">
      <div className="flex items-center justify-between border-b border-dashed border-[var(--color-border)]/70 pb-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Meta Cloud API — Outbound
        </p>
        <DataPill tone="green">v19.0</DataPill>
      </div>

      <div className="mt-2.5 rounded-xl rounded-tl-sm border border-emerald-500/25 bg-emerald-500/8 p-2.5">
        <p className="text-[10.5px] font-semibold leading-relaxed text-[var(--color-text-primary)]">
          Assalam-o-Alaikum Ayesha, your prescription is ready. Tap the file below to download. 
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-card)] px-2.5 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-500">
              <Icon d={ICONS.doc} className="h-3 w-3" strokeWidth={2.5} />
            </div>
            <p className="truncate font-mono text-[9px] font-bold text-[var(--color-text-primary)]">
              Rx_AyeshaKhan.pdf <span className="text-[var(--color-text-muted)]">• 182 KB</span>
            </p>
          </div>
          <span className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Download ↓
          </span>
        </div>
        <p className="mt-1.5 text-right font-mono text-[8px] font-semibold text-[var(--color-text-muted)]">
          7:42 PM ✓✓
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!reminder) setReminder(true);
        }}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition-all duration-300 ${
          reminder
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600"
            : "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
        }`}
      >
        <Icon d={reminder ? ICONS.check : ICONS.bolt} className="h-3.5 w-3.5" strokeWidth={2.5} />
        {reminder ? "Late reminder queued for 8:00 PM ✓" : "⚡ Send Late Reminder"}
      </button>
    </div>
  );
}

function FinanceWidget() {
  const [labAdded, setLabAdded] = useState(false);
  const labFee = 1200;
  const net = 1800 + (labAdded ? labFee : 0);

  return (
    <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/50 p-3.5">
      <div className="flex items-center justify-between border-b border-dashed border-[var(--color-border)]/70 pb-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Line-Item Calculator — T-08
        </p>
        <DataPill tone="primary">AUDIT-READY</DataPill>
      </div>

      <div className="mt-2.5 flex flex-col gap-1 font-mono text-[10.5px] font-bold">
        <div className="flex items-center justify-between text-[var(--color-text-primary)]">
          <span className="font-semibold text-[var(--color-text-secondary)]">Original fee</span>
          <span>Rs. 2,000</span>
        </div>
        <div className="flex items-center justify-between text-amber-500">
          <span className="font-semibold">Discount applied</span>
          <span>-Rs. 200</span>
        </div>
        {labAdded && (
          <div className="fx-flash flex items-center justify-between rounded-md bg-[var(--color-primary)]/8 px-1 text-[var(--color-primary)]">
            <span className="font-semibold">+ Lab Test (CBC)</span>
            <span>+Rs. {labFee.toLocaleString()}</span>
          </div>
        )}
        <div className="my-1.5 border-t border-dashed border-[var(--color-border-strong)]" />
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-primary)]/10 px-2 py-1.5 text-[var(--color-primary)]">
          <span className="text-[9.5px] uppercase tracking-wider">Net Revenue</span>
          <span className="text-[13px]">Rs. {net.toLocaleString()}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setLabAdded((v) => !v)}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition-all duration-300 ${
          labAdded
            ? "border-[var(--color-border-strong)] bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            : "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
        }`}
      >
        {labAdded ? "Remove Lab Test" : "+ Lab Test"}
        <span className="font-mono text-[8.5px] font-semibold opacity-70">(ancillary revenue)</span>
      </button>
    </div>
  );
}

function AdminWidget() {
  const [approved, setApproved] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg)]/50 p-3.5">
      <div className="flex items-center justify-between border-b border-dashed border-[var(--color-border)]/70 pb-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Subscription Hub — Review
        </p>
        <DataPill tone="primary">ADMIN</DataPill>
      </div>

      <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-card)] p-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white ring-2 ring-[var(--color-primary)]/25">
          UR
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-[var(--color-text-primary)]">Dr. Uzair Rehman</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <DataPill tone="green">
              <Icon d={ICONS.shield} className="h-2.5 w-2.5" strokeWidth={3} /> PMDC 48211-P VERIFIED
            </DataPill>
            <DataPill>PROFILE PHOTO ✓</DataPill>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-card)] px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[10.5px] font-bold text-[var(--color-text-primary)]">
            Bank transfer receipt <span className="font-mono text-[9px] text-[var(--color-text-muted)]">#TRX-90210</span>
          </p>
          <p className="font-mono text-[8.5px] font-semibold text-[var(--color-text-muted)]">
            {approved ? "Approved • subscription activated" : "Awaiting proof-of-payment approval"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`font-mono text-[8px] font-bold uppercase tracking-wider ${
              approved ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {approved ? "Approved" : "Pending"}
          </span>
          <MicroToggle on={approved} onToggle={() => setApproved((v) => !v)} label="Approve bank receipt" />
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--color-border)]/60 pt-2.5">
        <Icon d={ICONS.shield} className="h-3 w-3 text-[var(--color-primary)]" strokeWidth={2.5} />
        <p className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Role-aware access • session controls • signed uploads
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Architecture grid                                                 */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    id: "rx-engine",
    index: "01",
    icon: ICONS.rx,
    eyebrow: "Clinical Core",
    title: "Spacious Prescription & Medicine Alternatives",
    blurb:
      "A distraction-free Rx editor with structured dosage capture and instant salt-composition substitution.",
    widget: <RxWidget />,
    chips: ["Dosage templates", "Salt-equivalent lookup", "R2 PDF export", "WhatsApp handoff"],
  },
  {
    id: "vault",
    index: "02",
    icon: ICONS.folder,
    eyebrow: "Records Layer",
    title: "Unified Visit Timelines & Allergy Safeguards",
    blurb:
      "One longitudinal record per patient — visits, diagnostics, and hard allergy blocks enforced at prescribing time.",
    widget: <VaultWidget />,
    chips: ["Visit timeline", "Allergy Rx block", "Diagnostics lookup", "Paperless"],
  },
  {
    id: "queue",
    index: "03",
    icon: ICONS.calendar,
    eyebrow: "Scheduling Engine",
    title: "Chronological Queue & Walk-In Upfront Billing",
    blurb:
      "A strictly time-sorted queue where every token carries its net fee, billing category, and live status.",
    widget: <QueueEngineWidget />,
    chips: ["Time-sorted tokens", "Net fee tags", "Walk-in upfront billing", "Auto status transitions"],
  },
  {
    id: "comms",
    index: "04",
    icon: ICONS.chat,
    eyebrow: "Patient Comms",
    title: "Meta Cloud API & Overdue Reminders",
    blurb:
      "Native WhatsApp media messages with downloadable PDF prescriptions and one-click late-reminder firing.",
    widget: <WhatsAppWidget />,
    chips: ["PDF attachments", "Read receipts", "Late reminders", "Broadcast lists"],
  },
  {
    id: "finance",
    index: "05",
    icon: ICONS.currency,
    eyebrow: "Revenue Ops",
    title: "Net Pricing & Ancillary Revenue Audit",
    blurb:
      "Every rupee reconciled — original fee, discount, add-on services, and net revenue on a dual-category ledger.",
    widget: <FinanceWidget />,
    chips: ["Discount tracking", "Lab add-ons", "Net revenue", "Audit trails"],
  },
  {
    id: "admin",
    index: "06",
    icon: ICONS.shield,
    eyebrow: "Trust & Control",
    title: "PMDC Verification & Bank Transfer Approvals",
    blurb:
      "Admin-gated onboarding with regulator verification, profile completeness checks, and receipt approvals.",
    widget: <AdminWidget />,
    chips: ["PMDC status tags", "Avatar review", "Receipt approval", "Role-aware access"],
  },
];

function ArchitectureGrid() {
  return (
    <section id="architecture" className="scroll-mt-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
          Core Architecture
        </p>
        <h2 className="mt-4 font-heading text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
          Six production modules. One queue-driven spine.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
          Each module below ships with a live micro-preview of the exact interface your clinic runs
          every day — no marketing screenshots, just the operational surface.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m) => (
          <article
            key={m.id}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/90 p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:shadow-[0_24px_60px_-16px_rgba(var(--color-primary-rgb),0.25)]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--color-primary)]/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />

            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                <Icon d={m.icon} className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Module {m.index} • {m.eyebrow}
              </span>
            </div>

            <h3 className="mt-4 font-heading text-xl font-semibold leading-snug text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)]">
              {m.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{m.blurb}</p>

            <div className="mt-4">{m.widget}</div>

            <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
              {m.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/60 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]"
                >
                  {chip}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Emergency bulk-cancel spotlight                                    */
/* ------------------------------------------------------------------ */

function EmergencySpotlight() {
  const [reason, setReason] = useState(true);
  const [phase, setPhase] = useState("idle"); // idle | running | done

  const execute = () => {
    if (!reason || phase === "running") return;
    setPhase("running");
    setTimeout(() => setPhase("done"), 1600);
    setTimeout(() => setPhase("idle"), 6200);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-r from-slate-900 to-teal-950 p-8 text-white shadow-2xl sm:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              <Icon d={ICONS.warning} className="h-3 w-3" strokeWidth={2.5} />
              Emergency Control
            </span>
            <span className="rounded-full border border-slate-600/70 bg-white/5 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              Bulk Cancel
            </span>
          </div>

          <h2 className="mt-5 font-heading text-3xl font-semibold leading-tight sm:text-4xl">
            Emergency Bulk Schedule Cancellation
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300">
            An unplanned closure shouldn't mean an hour on the phone. Select a time range, tag the
            reason, and execute — MedAlerto cancels every token in the window and fires a bulk
            WhatsApp broadcast to each affected patient, automatically.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {["Range-scoped cancellation", "Reason-tagged audit log", "Bulk WhatsApp broadcast", "Refund/credit hooks"].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-600/60 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-200"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>

        {/* 3-step control flow mockup */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/60 p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Emergency Control Flow
            </p>
            <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-teal-300">
              <LiveDot className="bg-teal-300" /> Armed
            </span>
          </div>

          {/* Step 1 — range */}
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-700/70 bg-white/5 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/15 font-mono text-[11px] font-bold text-teal-300">
              1
            </span>
            <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-slate-200">Select Time Range</p>
              <div className="flex items-center gap-1.5 rounded-lg border border-teal-400/30 bg-teal-400/10 px-2.5 py-1.5 font-mono text-[10.5px] font-bold text-teal-200">
                <Icon d={ICONS.clock} className="h-3 w-3" strokeWidth={2.5} />
                5:00 PM <span className="text-slate-400">→</span> 9:00 PM
              </div>
            </div>
          </div>

          {/* Step 2 — reason toggle */}
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-700/70 bg-white/5 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/15 font-mono text-[11px] font-bold text-teal-300">
              2
            </span>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-slate-200">Toggle Reason</p>
                <p className="font-mono text-[9px] font-semibold text-slate-400">
                  {reason ? "UNPLANNED_EMERGENCY_CLOSURE" : "Select a reason to arm execution"}
                </p>
              </div>
              <MicroToggle on={reason} onToggle={() => setReason((v) => !v)} label="Emergency closure reason" />
            </div>
          </div>

          {/* Step 3 — execute */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-white/5 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/15 font-mono text-[11px] font-bold text-teal-300">
              3
            </span>
            <button
              type="button"
              onClick={execute}
              disabled={!reason || phase === "running"}
              className={`relative flex-1 overflow-hidden rounded-lg px-4 py-3 text-[11.5px] font-bold transition-all duration-300 ${
                phase === "done"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : reason
                    ? "bg-teal-500 text-slate-950 hover:bg-teal-400 active:scale-[0.99]"
                    : "cursor-not-allowed bg-slate-700/50 text-slate-400"
              }`}
            >
              {phase === "running" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                  Cancelling 14 appointments & firing broadcast…
                </span>
              ) : phase === "done" ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon d={ICONS.check} className="h-4 w-4" strokeWidth={3} />
                  Done — 14 slots cancelled, 14 patients notified on WhatsApp
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon d={ICONS.bolt} className="h-4 w-4" strokeWidth={2.5} />
                  ⚡ Execute Cancellation & Fire Bulk WhatsApp Broadcast
                </span>
              )}
            </button>
          </div>

          {phase === "done" && (
            <div className="fx-flash mt-3 flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
              <p className="font-mono text-[9.5px] font-bold text-emerald-300">
                broadcast_id: waba_bulk_0826 • 14/14 delivered
              </p>
              <span className="font-mono text-[9px] font-bold text-emerald-400">1.9s avg</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Operational impact metrics                                         */
/* ------------------------------------------------------------------ */

const METRICS = [
  {
    value: "< 2.0 Seconds",
    capability: "Average WhatsApp PDF Delivery Time",
    infra: "Meta Cloud API (v19.0)",
    icon: ICONS.bolt,
    accent: "text-teal-500",
    bar: "w-[92%]",
  },
  {
    value: "0% Egress Cost",
    capability: "Zero Bandwidth Overhead on PDF Storage",
    infra: "Cloudflare R2 Bucket",
    icon: ICONS.doc,
    accent: "text-emerald-500",
    bar: "w-full",
  },
  {
    value: "100% Accuracy",
    capability: "Net Revenue & Discount Audit Trails",
    infra: "Dual-Category Payment Engine",
    icon: ICONS.chart,
    accent: "text-indigo-500",
    bar: "w-full",
  },
  {
    value: "-65% Calls",
    capability: "Reduction in Front-Desk Follow-Up Inquiries",
    infra: "Automated Reminders & Queues",
    icon: ICONS.chat,
    accent: "text-amber-500",
    bar: "w-[65%]",
  },
];

function MetricsSection() {
  return (
    <section id="metrics" className="scroll-mt-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
          Operational Impact
        </p>
        <h2 className="mt-4 font-heading text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
          Performance you can put in a contract.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
          Quantified delivery, storage, and revenue guarantees — each metric traces back to the
          infrastructure that enforces it.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => (
          <div
            key={m.value}
            className={`${GLASS} group relative overflow-hidden p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-float)]`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                <Icon d={m.icon} className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <LiveDot />
            </div>

            <p className="mt-5 font-heading text-[1.9rem] font-semibold leading-none text-[var(--color-text-primary)]">
              {m.value}
            </p>
            <div className={`mt-3 h-1 rounded-full bg-[var(--color-border)]/70`}>
              <div className={`h-full rounded-full bg-[var(--color-primary)] ${m.bar}`} />
            </div>
            <p className="mt-3 text-[13px] font-semibold leading-snug text-[var(--color-text-secondary)]">
              {m.capability}
            </p>

            <div className="mt-4 border-t border-[var(--color-border)]/60 pt-3">
              <DataPill tone="primary">
                <Icon d={ICONS.shield} className="h-2.5 w-2.5" strokeWidth={3} />
                {m.infra}
              </DataPill>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Scoped keyframes for the micro-preview animations on this page. */}
      <style>{`
        @keyframes fxFlash {
          0% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.4); background-color: rgba(var(--color-primary-rgb), 0.16); }
          100% { box-shadow: 0 0 0 12px rgba(var(--color-primary-rgb), 0); }
        }
        .fx-flash { animation: fxFlash 1.3s ease-out; }
        @keyframes fxAutoAdvance {
          from { width: 0%; }
          to { width: 100%; }
        }
        .fx-autoadvance { animation: fxAutoAdvance 3.6s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fx-flash, .fx-autoadvance { animation: none; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-20">
          <HeroSection />
          <ArchitectureGrid />
          <EmergencySpotlight />
          <MetricsSection />

          {/* Closing band */}
          <section className={`${GLASS} flex flex-col items-center gap-6 p-10 text-center shadow-[var(--shadow-soft)] sm:p-14`}>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Deployment Ready
            </p>
            <h2 className="max-w-2xl font-heading text-3xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-4xl">
              Put your clinic on the queue-driven stack.
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)]">
              Onboarding is admin-assisted: PMDC verification, bank-transfer approval, and your
              first live queue — typically inside one working day.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-float)]"
              >
                Start Clinic Onboarding
                <Icon d={ICONS.arrowRight} className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-card)]/80 px-8 py-3.5 text-sm font-bold text-[var(--color-text-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
              >
                View Subscription Plans
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
