import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Zap,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  FileText,
  TrendingUp,
  Lock,
  Cloud,
  BadgeCheck,
  Star,
  ChevronRight,
  Send,
  Receipt,
  Percent,
  FlaskConical,
  Bell,
  PhoneCall,
  Download,
  CheckCheck,
  XCircle,
  Check,
  ArrowUpRight,
  UserPlus,
  ClipboardList,
  CalendarCheck,
  Gauge,
  Server,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useThemedLogo from "../hooks/useThemedLogo";

/* ---------------------------------------------------------------------- */
/* Static content                                                          */
/* ---------------------------------------------------------------------- */

const TRUST_INDICATORS = [
  "No Credit Card Required",
  "5-Minute Setup",
  "Meta Cloud API Verified",
];

const AUTHORITY_METRICS = [
  {
    value: "< 2 Seconds",
    label: "Average WhatsApp PDF Delivery Time",
    icon: Zap,
  },
  {
    value: "100%",
    label: "Net Revenue & Discount Audit Accuracy",
    icon: Percent,
  },
  {
    value: "0%",
    label: "Storage Egress Fees (Cloudflare R2 Powered)",
    icon: Cloud,
  },
  {
    value: "50,000+",
    label: "Prescriptions Safely Dispatched",
    icon: FileText,
  },
];

const QUEUE_STAGES = [
  {
    key: "WAITING",
    color: "bg-slate-200 text-slate-600",
    dot: "bg-slate-400",
  },
  {
    key: "IN_CONSULTATION",
    color: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  {
    key: "COMPLETED",
    color: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Prescription Delivery Speed",
    traditional: "Manual handoff — 10 to 15 minutes",
    medalerto: "< 2 seconds via native WhatsApp dispatch",
  },
  {
    feature: "WhatsApp Integration",
    traditional: "None. Reception forwards photos manually",
    medalerto: "Meta Cloud API — automated PDF delivery",
  },
  {
    feature: "Patient Queueing",
    traditional: "Paper tokens, first-come chaos",
    medalerto: "Live queue state machine, zero front-desk guesswork",
  },
  {
    feature: "Discount & Fee Accounting",
    traditional: "Manual ledger entries, error-prone",
    medalerto: "100% automated net revenue audit trail",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Reception Arrival & Upfront Billing",
    text: "Registers the patient, logs the queue slot, and collects the consultation fee in a single reception action — no separate billing pass.",
    icon: UserPlus,
    chips: ["Slot #014 Assigned", "Fee Collected: Rs. 1,800", "Status: WAITING"],
  },
  {
    step: "02",
    title: "Chronological Consultation & Medical History",
    text: "The doctor opens the queue item, reviews a full chronological history drawer, and writes a spacious, structured prescription without leaving the flow.",
    icon: ClipboardList,
    chips: ["History: 6 Prior Visits", "Vitals Logged", "Status: IN_CONSULTATION"],
  },
  {
    step: "03",
    title: "Automated Dispatch & Follow-Up",
    text: "Generates the R2-hosted prescription PDF, fires the WhatsApp message instantly, and schedules the next follow-up date automatically.",
    icon: CalendarCheck,
    chips: ["PDF Sent 🟢", "R2 Object Stored", "Follow-up: +14 Days"],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Cut patient waiting times by 40% and eliminated paper prescriptions completely within our first week.",
    author: "Dr. Hina Anwar",
    role: "Dermatology Clinic, Lahore",
    metric: "-40% patient wait time",
  },
  {
    quote:
      "The discount engine alone paid for the subscription — we finally have a 100% accurate audit trail on every net fee.",
    author: "Dr. Faraz Khan",
    role: "General Practice, Karachi",
    metric: "100% billing audit accuracy",
  },
  {
    quote:
      "WhatsApp dispatch is instant. Patients receive their prescription before they've even left the consultation room.",
    author: "Dr. Sana Malik",
    role: "Internal Medicine, Islamabad",
    metric: "< 2s prescription delivery",
  },
];

/* ---------------------------------------------------------------------- */
/* Small reusable UI atoms                                                 */
/* ---------------------------------------------------------------------- */

function GlassCard({ className = "", children }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-teal-50 px-3.5 py-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-teal-700">
        {children}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Page                                                                     */
/* ---------------------------------------------------------------------- */

export default function LandingPage() {
  const navigate = useNavigate();
  const logoCompact = useThemedLogo();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleClosingSubmit = (event) => {
    event.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <div className="landing-page min-h-screen bg-white text-slate-900">
      <Navbar />

      <main>
        {/* ============================================================ */}
        {/* SECTION 2 — HIGH-IMPACT HERO                                   */}
        {/* ============================================================ */}
        <section className="relative isolate overflow-hidden bg-white pt-16 sm:pt-20">
          <div
            aria-hidden="true"
            className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-teal-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 top-24 h-[26rem] w-[26rem] rounded-full bg-slate-900/5 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-y-16 gap-x-8 px-4 pb-20 pt-14 sm:px-6 lg:px-8 xl:pt-20">
            <div className="col-span-12 flex flex-col justify-center xl:col-span-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-600/25 bg-teal-50 px-4 py-1.5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
                  ⚡ Engineered for Modern Clinics &amp; Independent Doctors
                </span>
              </div>

              <h1 className="mt-7 max-w-2xl text-[2.5rem] font-heading font-extrabold leading-[1.02] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[3.4rem]">
                The Queue-Driven Operational Engine for{" "}
                <span className="text-teal-600">High-Performance Clinics.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Collapse patient arrival, upfront billing, digital
                consultation, and instant WhatsApp prescription delivery into
                a unified assembly line.
              </p>

              <div className="mt-9 flex flex-col gap-3.5 sm:flex-row">
                <button
                  onClick={() => navigate("/signup")}
                  className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-7 font-body text-sm font-bold text-white shadow-[0_16px_32px_-12px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(15,23,42,0.6)]"
                >
                  <span className="relative z-10">Get Started Free</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <div className="absolute inset-0 -translate-x-full bg-teal-600/20 transition-transform duration-500 group-hover:translate-x-0" />
                </button>
                <button
                  onClick={() => navigate("/how-it-works")}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 font-body text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                >
                  <PlayCircle className="h-4 w-4 text-teal-600" />
                  Watch 2-Min Demo
                  <span aria-hidden="true">➔</span>
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {TRUST_INDICATORS.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Interactive UI Showcase */}
            <div className="col-span-12 xl:col-span-6">
              <div className="relative mx-auto w-full max-w-xl">
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-teal-500/15 via-transparent to-slate-900/10 blur-2xl"
                />

                {/* Floating browser frame */}
                <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                    </div>
                    <div className="rounded-md bg-white px-3 py-1 font-mono text-[10px] text-slate-400 border border-slate-100">
                      app.medalerto.com/queue
                    </div>
                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img src={logoCompact} alt="" className="h-3.5 w-3.5 object-contain" />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-heading text-sm font-bold text-slate-900">
                        Today&apos;s Doctor Queue
                      </p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-teal-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                        Live Sync
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        {
                          name: "Ayesha Raza",
                          slot: "#012",
                          status: "COMPLETED",
                        },
                        {
                          name: "Bilal Tariq",
                          slot: "#013",
                          status: "IN_CONSULTATION",
                        },
                        {
                          name: "Wajeeha Noor",
                          slot: "#014",
                          status: "WAITING",
                        },
                      ].map((row) => {
                        const stage = QUEUE_STAGES.find(
                          (s) => s.key === row.status,
                        );
                        return (
                          <div
                            key={row.slot}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition-all ${
                              row.status === "IN_CONSULTATION"
                                ? "border-teal-200 bg-teal-50/60"
                                : "border-slate-100 bg-slate-50/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-[10px] font-bold text-slate-400">
                                {row.slot}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {row.name}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide ${stage.color}`}
                            >
                              {row.status.replace("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5">
                      <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Prescription Drawer — Bilal Tariq
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                          Status: In Consultation
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
                          Net Fee: Rs. 1,800{" "}
                          <span className="text-teal-300">(Rs. 200 Discount)</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold text-teal-700">
                          WhatsApp PDF Sent 🟢
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating micro-badge */}
                <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md sm:block">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 text-teal-600">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Dispatch Time
                      </p>
                      <p className="text-sm font-black text-slate-900">1.4s avg</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3 — AUTHORITY METRIC & SOCIAL PROOF STRIP              */}
        {/* ============================================================ */}
        <section
          id="security"
          className="border-y border-slate-200 bg-slate-900 py-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {AUTHORITY_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-col items-start gap-2 border-l border-white/10 pl-5"
                >
                  <metric.icon className="h-5 w-5 text-teal-400" />
                  <p className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {metric.value}
                  </p>
                  <p className="max-w-[18ch] text-xs font-medium leading-snug text-slate-400">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4 — MODERN BENTO GRID FEATURE SHOWCASE                 */}
        {/* ============================================================ */}
        <section id="features" className="bg-slate-50/70 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionEyebrow>Platform Capabilities</SectionEyebrow>
              <h2 className="mt-5 text-4xl font-heading font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                Built like infrastructure,{" "}
                <span className="text-teal-600">not a form builder.</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Every module is engineered around a single operational goal:
                remove manual handoffs between reception, consultation, and
                billing.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-5 xl:grid-cols-4">
              {/* Card 1 — Live Queue State Machine (large) */}
              <div className="xl:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Core Engine
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-heading font-bold text-slate-900">
                  The Live Queue State Machine
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Patient cards transition through deterministic states in
                  real time — reception and doctor views stay perfectly
                  synchronized, with zero manual refresh.
                </p>

                <div className="mt-6 flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  {["WAITING", "IN_CONSULTATION", "COMPLETED"].map(
                    (stageKey, i) => {
                      const stage = QUEUE_STAGES.find((s) => s.key === stageKey);
                      return (
                        <div key={stageKey} className="flex items-center gap-2">
                          <div
                            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider ${stage.color}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${stage.dot} ${i === 1 ? "animate-pulse" : ""}`}
                            />
                            {stageKey.replace("_", " ")}
                          </div>
                          {i < 2 && (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Card 2 — WhatsApp Document Delivery */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-heading font-bold text-slate-900">
                  Native WhatsApp Document Delivery
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Meta Cloud API dispatches the signed prescription PDF
                  straight to the patient&apos;s chat — no manual export.
                </p>

                <div className="mt-6 rounded-2xl bg-[#e9edf0] p-3">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-3 shadow-sm">
                    <div className="flex items-center gap-2 rounded-lg bg-white/70 p-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-slate-800">
                          Prescription.pdf
                        </p>
                        <p className="text-[9px] text-slate-500">148 KB</p>
                      </div>
                      <Download className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    </div>
                    <p className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-slate-500">
                      09:41
                      <CheckCheck className="h-3 w-3 text-sky-500" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3 — Smart Discount & Ancillary Revenue Engine */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-heading font-bold text-slate-900">
                  Smart Discount &amp; Ancillary Revenue Engine
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Upfront &amp; ancillary billing captured line-by-line, with
                  automatic net-total reconciliation.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 font-mono text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Original Fee</span>
                    <span>Rs. 2,000</span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-rose-500">
                    <span>Discount</span>
                    <span>- Rs. 200</span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-slate-500">
                    <span className="flex items-center gap-1">
                      <FlaskConical className="h-3 w-3" /> Lab Test — CBC
                    </span>
                    <span>+ Rs. 500</span>
                  </div>
                  <div className="mt-2.5 flex justify-between border-t border-dashed border-slate-300 pt-2.5 font-bold text-slate-900">
                    <span>Net Total</span>
                    <span className="text-teal-600">Rs. 2,300</span>
                  </div>
                </div>
              </div>

              {/* Card 4 — Cloudflare R2 Zero-Egress Storage */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-heading font-bold text-slate-900">
                  Cloudflare R2 Zero-Egress Storage
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Encrypted prescription archives streamed instantly, with
                  zero storage egress fees at any scale.
                </p>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      AES-256 · Encrypted at Rest
                    </p>
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-teal-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                      R2 Streaming — 0ms Cold Start
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 5 — 1-Click Overdue Patient Alerts */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-heading font-bold text-slate-900">
                  1-Click Overdue Patient Alerts
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Flag lapsed follow-ups and dispatch a reminder in a single
                  tap — no spreadsheet chasing.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Zeeshan Ahmed
                      </p>
                      <p className="text-[10px] font-semibold text-rose-500">
                        Follow-up overdue · 4 days
                      </p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-teal-600">
                      <PhoneCall className="h-3 w-3" />
                      Send Late Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5 — 3-STEP CLINIC ASSEMBLY LINE                        */}
        {/* ============================================================ */}
        <section id="workflow" className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionEyebrow>The Assembly Line</SectionEyebrow>
              <h2 className="mt-5 text-4xl font-heading font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                The 3-Step Clinic Assembly Line.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                From arrival to follow-up, every step hands off cleanly into
                the next — no lost paperwork, no duplicate data entry.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {WORKFLOW_STEPS.map((item, index) => {
                const isActive = activeStep === index;
                return (
                  <button
                    key={item.step}
                    onClick={() => setActiveStep(index)}
                    className={`group relative flex flex-col items-start rounded-3xl border p-7 text-left transition-all duration-300 ${
                      isActive
                        ? "border-teal-600/40 bg-slate-900 shadow-2xl -translate-y-1"
                        : "border-slate-200/80 bg-white shadow-xl hover:-translate-y-1 hover:shadow-2xl"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`font-mono text-[10px] font-black uppercase tracking-[0.3em] ${
                          isActive ? "text-teal-400" : "text-slate-300"
                        }`}
                      >
                        Step {item.step}
                      </span>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-teal-600 text-white"
                            : "bg-teal-600/10 text-teal-600"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                    </div>

                    <h3
                      className={`mt-6 text-lg font-heading font-bold leading-snug ${
                        isActive ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`mt-3 text-sm leading-relaxed ${
                        isActive ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {item.text}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-1.5">
                      {item.chips.map((chip) => (
                        <span
                          key={chip}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            isActive
                              ? "bg-white/10 text-teal-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    {index < WORKFLOW_STEPS.length - 1 && (
                      <ArrowRight
                        className={`absolute -right-3.5 top-1/2 hidden h-7 w-7 -translate-y-1/2 rounded-full border bg-white p-1.5 shadow-md lg:block ${
                          isActive
                            ? "border-teal-600/40 text-teal-600"
                            : "border-slate-200 text-slate-300"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6 — ROI COMPARISON TABLE                               */}
        {/* ============================================================ */}
        <section className="bg-slate-50/70 py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionEyebrow>Return on Investment</SectionEyebrow>
              <h2 className="mt-5 text-4xl font-heading font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                Traditional Practice{" "}
                <span className="text-slate-300">vs.</span>{" "}
                <span className="text-teal-600">MedAlerto.</span>
              </h2>
            </div>

            <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl backdrop-blur-md">
              <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-900">
                <div className="p-5 sm:p-6">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Capability
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Legacy / Paper &amp; Fragmented Apps
                  </span>
                </div>
                <div className="border-l border-white/10 bg-teal-600/10 p-5 sm:p-6">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-teal-400">
                    MedAlerto
                  </span>
                </div>
              </div>

              {COMPARISON_ROWS.map((row, idx) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 ${
                    idx !== COMPARISON_ROWS.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center p-5 sm:p-6">
                    <span className="text-sm font-bold text-slate-900">
                      {row.feature}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-5 sm:p-6">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span className="text-sm text-slate-500">
                      {row.traditional}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 border-l border-slate-100 bg-teal-50/40 p-5 sm:p-6">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <span className="text-sm font-semibold text-slate-800">
                      {row.medalerto}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7 — VERIFIED PRACTITIONER TESTIMONIALS                 */}
        {/* ============================================================ */}
        <section className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <SectionEyebrow>Verified Practitioners</SectionEyebrow>
                <h2 className="mt-5 text-4xl font-heading font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                  Trusted by doctors who run high-pressure days.
                </h2>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-teal-600/40 hover:text-teal-600 hover:shadow-md"
              >
                View Pricing
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((item, idx) => (
                <article
                  key={item.author}
                  className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-700">
                    &ldquo;{item.quote}&rdquo;
                  </p>

                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{
                        background: [
                          "linear-gradient(135deg, #0f766e, #0d9488)",
                          "linear-gradient(135deg, #1e293b, #334155)",
                          "linear-gradient(135deg, #0891b2, #0e7490)",
                        ][idx % 3],
                      }}
                      aria-hidden="true"
                    >
                      {item.author
                        .split(" ")
                        .filter((n) => n.length > 0)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.author}
                        </p>
                        <BadgeCheck
                          className="h-3.5 w-3.5 shrink-0 text-teal-600"
                          aria-label="PMDC Verified"
                        />
                      </div>
                      <p className="truncate text-[11px] font-semibold text-slate-500">
                        {item.role}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-700">
                    <TrendingUp className="h-3 w-3" />
                    {item.metric}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 8 — HIGH-CONVERTING CLOSING CTA                        */}
        {/* ============================================================ */}
        <section className="bg-white px-4 pb-24 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-900 to-slate-900 px-8 py-16 shadow-2xl sm:px-14 sm:py-20">
            <div
              aria-hidden="true"
              className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-teal-500/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]"
            />

            <div className="relative mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <Server className="h-3.5 w-3.5 text-teal-300" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-teal-200">
                  Deploy in Under 5 Minutes
                </span>
              </div>

              <h2 className="mt-6 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to run your clinic with engineered precision?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Join the doctors who replaced paper chaos with a queue-driven,
                audit-accurate, WhatsApp-native operational engine.
              </p>

              {subscribed ? (
                <div className="mx-auto mt-8 inline-flex items-center gap-2.5 rounded-full border border-teal-400/30 bg-teal-400/10 px-5 py-3.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-300" />
                  <span className="text-sm font-bold text-teal-200">
                    You&apos;re in — check your inbox to finish setup.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={handleClosingSubmit}
                  className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourclinic.com"
                    aria-label="Email address"
                    className="h-14 w-full flex-1 rounded-xl border border-white/15 bg-white/10 px-4 font-body text-sm text-white placeholder:text-slate-400 backdrop-blur-md focus:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40"
                  />
                  <button
                    type="submit"
                    className="group relative inline-flex h-14 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-6 font-body text-sm font-bold text-slate-900 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span className="relative z-10">Get Started Free</span>
                    <Send className="relative z-10 h-4 w-4 text-teal-600" />
                  </button>
                </form>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {TRUST_INDICATORS.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
