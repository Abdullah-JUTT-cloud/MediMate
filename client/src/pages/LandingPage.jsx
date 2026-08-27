import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CtaSection from "../components/home/CtaSection";
import doc from "../assets/doc-hero.webp";
import useThemedLogo from "../hooks/useThemedLogo";

const audioGuideBarHeights = [35, 70, 50, 85];

export default function LandingPage() {
  const navigate = useNavigate();
  const logoCompact = useThemedLogo();
  const videoRef = useRef(null);
  const [activeView, setActiveView] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-cycle views
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveView((prev) => (prev + 1) % 4);
    }, 8000); // 8 seconds per view to allow narration to finish naturally
    return () => clearInterval(timer);
  }, [isPaused]);

  // AI Voiceover Guide
  useEffect(() => {
    if (isMuted) return;

    // Cancel any ongoing speech immediately when switching views
    window.speechSynthesis.cancel();

    if (isPaused) return;

    const narrations = [
      "Welcome to MedAlerto. Our central dashboard provides a high-fidelity overview of your clinic's operational health, tracking vital metrics and patient flow in real-time.",
      "The comprehensive Patient Directory ensures your clinical records are organized and accessible, featuring rapid search capabilities and detailed patient history management.",
      "Our Clinical Calendar is engineered for precision scheduling, allowing your team to visualize complex surgical windows and daily appointments with zero friction.",
      "Smart Prescriptions streamline the medication lifecycle, enhancing patient safety through automated dosage tracking and treatment compliance monitoring.",
    ];

    // Add a small delay for a smoother transition between voiceovers
    const speechTimeout = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(narrations[activeView]);
      utterance.rate = 0.88;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(
        (v) =>
          v.name.includes("Google US English") ||
          v.name.includes("Samantha") ||
          v.name.includes("Premium") ||
          v.name.includes("Natural"),
      );
      if (premiumVoice) utterance.voice = premiumVoice;

      window.speechSynthesis.speak(utterance);
    }, 500);

    return () => {
      clearTimeout(speechTimeout);
      window.speechSynthesis.cancel();
    };
  }, [activeView, isMuted, isPaused]);

  useEffect(() => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay is intentionally ignored when browser policy blocks it.
        });
      }
    }
  }, []);

  return (
    <div className="landing-page min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main>
        {/* ───────────────────────────────────────────────────────────────
            HERO
            Left: proof-first copy stack (badge → headline → CTAs →
            social proof → metrics). Right: portrait card with floating
            glass product chips that narrate the workflow. All decorative
            layers are aria-hidden and every animation is disabled for
            prefers-reduced-motion (scoped guard at the end of section).
           ─────────────────────────────────────────────────────────────── */}
        <section className="hero-section relative isolate overflow-hidden bg-[var(--color-bg)] pt-28 sm:pt-32">
          {/* Ambient aurora wash */}
          <div
            aria-hidden="true"
            className="hero-aurora-a absolute -left-24 top-8 h-80 w-80 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[var(--color-primary)]/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="hero-aurora-b absolute -right-24 top-16 h-96 w-96 rounded-[58%_42%_56%_44%/44%_58%_42%_56%] bg-[var(--color-secondary)]/18 blur-3xl"
          />
          {/* Medical plus-grid motif, fading out radially */}
          <div aria-hidden="true" className="hero-grid-pattern absolute inset-y-0 right-0 w-full sm:w-3/5" />
          <div
            aria-hidden="true"
            className="absolute inset-x-6 top-10 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent"
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 pb-16 sm:px-6 lg:px-8 xl:pb-24">
            {/* ——— Copy column ——— */}
            <div className="col-span-12 flex flex-col justify-center xl:col-span-6">
              {/* Eyebrow badge */}
              <div className="hero-rise" style={{ "--d": "0ms" }}>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/70 py-2 pl-3.5 pr-4 shadow-[0_10px_30px_-16px_rgb(var(--color-primary-rgb)/0.55)] backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)]" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                  </span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-secondary)] sm:text-[10px]">
                    Premium Clinic Workflow
                  </span>
                </span>
              </div>

              <h1
                className="hero-rise mt-7 max-w-[15ch] text-[2.75rem] font-heading font-extrabold leading-[0.96] tracking-[-0.035em] text-balance sm:max-w-3xl sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
                style={{ "--d": "90ms" }}
              >
                <span className="block">Clinic workflow,</span>
                <span className="relative inline-block pb-2 text-[var(--color-primary)]">
                  mastered with
                  <svg
                    className="hero-underline absolute -bottom-0.5 left-0 h-[10px] w-full"
                    viewBox="0 0 220 14"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 11C60 5 150 3 216 7"
                      stroke="#f59e0b"
                      strokeOpacity="0.9"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="block italic text-[var(--color-secondary)]">
                  quiet precision.
                </span>
              </h1>

              <p
                className="hero-rise mt-6 max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-secondary)] sm:text-lg"
                style={{ "--d": "180ms" }}
              >
                MedAlerto unifies prescriptions, scheduling, and patient history
                into a single, intuitive interface designed for the modern
                practice.
              </p>

              {/* CTAs */}
              <div
                className="hero-rise mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"
                style={{ "--d": "270ms" }}
              >
                <button
                  onClick={() => navigate("/signup")}
                  className="hero-cta-primary group relative inline-flex h-14 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-9 font-body text-sm font-bold text-[var(--color-on-primary)] transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <svg
                    className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                  <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-0" />
                </button>
                <button
                  onClick={() => navigate("/features")}
                  className="see-platform-button group inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/60 px-7 font-body text-sm font-bold backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">
                    <svg
                      className="ml-0.5 h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5.14v14l11-7-11-7Z" />
                    </svg>
                  </span>
                  See Platform
                </button>
              </div>

              {/* Social proof */}
              <div
                className="hero-rise mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
                style={{ "--d": "360ms" }}
              >
                <div className="flex -space-x-2.5">
                  {[
                    { initials: "HA", bg: "#0d9488" },
                    { initials: "FK", bg: "#0f766e" },
                    { initials: "SM", bg: "#14b8a6" },
                  ].map((a) => (
                    <span
                      key={a.initials}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-extrabold text-white ring-2 ring-[var(--color-bg)]"
                      style={{ background: a.bg }}
                    >
                      {a.initials}
                    </span>
                  ))}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[10px] font-extrabold text-[var(--color-text-secondary)] ring-2 ring-[var(--color-bg)]">
                    +2k
                  </span>
                </div>
                <div>
                  <div
                    className="flex items-center gap-0.5 text-amber-400"
                    role="img"
                    aria-label="Rated 4.9 out of 5"
                  >
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                    4.9/5 from 2,300+ doctors
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div
                className="hero-rise mt-10 flex flex-wrap items-center gap-8 border-t border-[var(--color-border)]/50 pt-8"
                style={{ "--d": "450ms" }}
              >
                <div>
                  <p className="text-[1.7rem] font-heading font-extrabold leading-none text-[var(--color-primary)]">
                    5,000+
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]/60">
                    Active Doctors
                  </p>
                </div>
                <div className="h-9 w-px bg-gradient-to-b from-transparent via-[var(--color-border)] to-transparent" />
                <div>
                  <p className="text-[1.7rem] font-heading font-extrabold leading-none text-[var(--color-primary)]">
                    1M+
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]/60">
                    Patients Served
                  </p>
                </div>
              </div>
            </div>

            {/* ——— Portrait column ——— */}
            <div className="col-span-12 mt-14 xl:col-span-5 xl:col-start-8 xl:mt-0">
              <div className="relative mx-auto w-full max-w-2xl">
                {/* Halo + rotating ring */}
                <div
                  aria-hidden="true"
                  className="hero-glow absolute inset-6 rounded-[3rem] bg-[var(--color-primary)]/20 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="hero-ring pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[115%] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full"
                />

                <div
                  className="hero-rise relative mx-auto w-full max-w-md"
                  style={{ "--d": "200ms" }}
                >
                  {/* Gradient-ring portrait card */}
                  <div className="hero-portrait relative overflow-hidden rounded-[2.5rem] p-[6px]">
                    <div className="relative overflow-hidden rounded-[2.35rem]">
                      <img
                        src={doc}
                        alt="Smiling doctor in scrubs with a stethoscope"
                        className="aspect-4/5 w-full object-cover object-center"
                        loading="eager"
                        decoding="async"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#06251f]/70 via-transparent to-transparent"
                      />
                      {/* Practitioner caption */}
                      <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-white/20 bg-black/35 px-4 py-2.5 backdrop-blur-md">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-extrabold text-white">
                          AR
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold leading-none text-white">
                            Dr. Ayesha R.
                          </p>
                          <p className="mt-1.5 truncate text-[10px] font-semibold text-white/70">
                            General Practice · Multan
                          </p>
                        </div>
                        <span
                          className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300"
                          title="Verified practitioner"
                        >
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating chip — prescription story */}
                  <div className="hero-float hero-float-a absolute -left-3 top-12 sm:-left-12">
                    <div className="hero-chip flex items-center gap-3 rounded-2xl px-4 py-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))",
                        }}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m22 2-7 20-4-9-9-4Z" />
                          <path d="M22 2 11 13" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold leading-none text-[var(--color-text-primary)]">
                          Prescription sent
                        </p>
                        <p className="mt-1.5 text-[10px] font-bold text-[var(--color-text-secondary)]">
                          via WhatsApp · just now
                        </p>
                      </div>
                      <span className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Floating chip — scheduling story */}
                  <div className="hero-float hero-float-b absolute -right-3 bottom-16 sm:-right-10">
                    <div className="hero-chip flex items-center gap-3 rounded-2xl px-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold leading-none text-[var(--color-text-primary)]">
                          Next appointment
                        </p>
                        <p className="mt-1.5 text-[10px] font-bold text-[var(--color-text-secondary)]">
                          Today · 4:30 PM
                        </p>
                      </div>
                      <span className="ml-1 shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-500">
                        Confirmed
                      </span>
                    </div>
                  </div>

                  {/* Floating chip — growth signal (hidden on small screens) */}
                  <div className="hero-float hero-float-c absolute -top-5 right-8 hidden sm:-right-4 sm:block">
                    <div className="hero-chip flex items-center gap-2.5 rounded-full py-2 pl-3.5 pr-4">
                      <span className="flex h-4 items-end gap-[3px]">
                        <span className="h-1.5 w-1 rounded-full bg-[var(--color-primary)]/40" />
                        <span className="h-3 w-1 rounded-full bg-[var(--color-primary)]/70" />
                        <span className="h-4 w-1 rounded-full bg-[var(--color-primary)]" />
                      </span>
                      <span className="text-xs font-extrabold text-[var(--color-text-primary)]">
                        +28%
                      </span>
                      <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">
                        follow-ups
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            /* Entrance choreography */
            .hero-rise {
              opacity: 0;
              transform: translateY(22px);
              animation: heroRise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
              animation-delay: var(--d, 0ms);
            }
            @keyframes heroRise {
              to { opacity: 1; transform: translateY(0); }
            }

            /* Badge pulse */
            .hero-ping {
              animation: heroPing 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            @keyframes heroPing {
              0% { transform: scale(1); opacity: 0.7; }
              75%, 100% { transform: scale(2.6); opacity: 0; }
            }

            /* Hand-drawn underline draws itself in */
            .hero-underline path {
              stroke-dasharray: 240;
              stroke-dashoffset: 240;
              animation: heroDraw 1s ease 1.1s forwards;
            }
            @keyframes heroDraw {
              to { stroke-dashoffset: 0; }
            }

            /* Aurora drift */
            .hero-aurora-a { animation: heroDrift 14s ease-in-out infinite; }
            .hero-aurora-b { animation: heroDrift 19s ease-in-out infinite reverse; }
            @keyframes heroDrift {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50% { transform: translate(28px, -20px) scale(1.07); }
            }

            /* Plus-grid motif (radial fade, theme-aware tint) */
            .hero-grid-pattern {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Cpath d='M14 10v8M10 14h8' stroke='%230d9488' stroke-opacity='0.16' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
              background-size: 28px 28px;
              -webkit-mask-image: radial-gradient(ellipse 65% 55% at 68% 32%, black, transparent 72%);
              mask-image: radial-gradient(ellipse 65% 55% at 68% 32%, black, transparent 72%);
            }

            /* Portrait halo + dashed orbit ring */
            .hero-glow { animation: heroGlow 9s ease-in-out infinite; }
            @keyframes heroGlow {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 0.85; transform: scale(1.05); }
            }
            .hero-ring {
              border: 1.5px dashed rgb(var(--color-primary-rgb) / 0.35);
              animation: heroSpin 48s linear infinite;
            }
            /* v4 note: centering comes from the CSS translate property
               (via -translate-x/y-1/2), so keyframes only rotate. */
            @keyframes heroSpin {
              to { transform: rotate(360deg); }
            }

            /* Gradient ring frame for the portrait */
            .hero-portrait {
              background: conic-gradient(
                from 220deg,
                rgb(var(--color-primary-rgb) / 0.85),
                rgb(var(--color-primary-rgb) / 0.08) 30%,
                rgb(251 191 36 / 0.55) 62%,
                rgb(var(--color-primary-rgb) / 0.85)
              );
              box-shadow: 0 44px 88px -28px rgb(15 23 42 / 0.4);
            }

            /* Floating glass chips */
            .hero-chip {
              background: var(--color-card);
              background: color-mix(in srgb, var(--color-card) 84%, transparent);
              border: 1px solid var(--color-border);
              border-color: color-mix(in srgb, var(--color-border) 80%, transparent);
              box-shadow: 0 24px 48px -20px rgb(15 23 42 / 0.28);
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
            }
            .hero-float { animation: heroBob 7s ease-in-out infinite; }
            .hero-float-b { animation-duration: 8.5s; animation-delay: -2.5s; }
            .hero-float-c { animation-duration: 6.5s; animation-delay: -4s; }
            @keyframes heroBob {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }

            /* Primary CTA glow (theme-aware via --color-primary-rgb) */
            .hero-cta-primary {
              box-shadow: 0 20px 40px -12px rgb(var(--color-primary-rgb) / 0.4);
            }
            .hero-cta-primary:hover {
              box-shadow: 0 28px 56px -16px rgb(var(--color-primary-rgb) / 0.5);
            }

            /* Accessibility: honour reduced-motion preference */
            @media (prefers-reduced-motion: reduce) {
              .hero-rise { animation: none; opacity: 1; transform: none; }
              .hero-ping,
              .hero-float,
              .hero-aurora-a,
              .hero-aurora-b,
              .hero-glow,
              .hero-ring { animation: none; }
              .hero-underline path { animation: none; stroke-dashoffset: 0; }
            }
          `}</style>
        </section>

        {/* Trusted By Marquee */}
        <section
          className="border-y border-[var(--color-border)]/40 bg-white/30 backdrop-blur-sm py-10 overflow-hidden"
          role="region"
          aria-label="Trusted by clinics and healthcare professionals"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-8 px-4">
            Trusted by clinics and healthcare professionals
          </p>
          <div className="relative">
            {/* Left fade */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-white/80 to-transparent" />
            {/* Right fade */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-white/80 to-transparent" />
            <div className="marquee-viewport">
              {/* Primary track – announced by assistive tech */}
              <ul className="marquee-track" role="list">
                {[
                  { initials: "HC", name: "HealthCore" },
                  { initials: "CP", name: "CarePoint" },
                  { initials: "ML", name: "MedLink" },
                  { initials: "VT", name: "Vitalis" },
                  { initials: "SR", name: "Serenity Rx" },
                  { initials: "NX", name: "NexClinic" },
                  { initials: "PM", name: "PulseMedia" },
                  { initials: "OC", name: "OpenChart" },
                ].map((item) => (
                  <li key={item.name} className="marquee-item">
                    <span className="marquee-avatar">{item.initials}</span>
                    <span className="marquee-label">{item.name}</span>
                  </li>
                ))}
              </ul>
              {/* Duplicate track for seamless loop – hidden from assistive tech */}
              <ul className="marquee-track" role="list" aria-hidden="true">
                {[
                  { initials: "HC", name: "HealthCore" },
                  { initials: "CP", name: "CarePoint" },
                  { initials: "ML", name: "MedLink" },
                  { initials: "VT", name: "Vitalis" },
                  { initials: "SR", name: "Serenity Rx" },
                  { initials: "NX", name: "NexClinic" },
                  { initials: "PM", name: "PulseMedia" },
                  { initials: "OC", name: "OpenChart" },
                ].map((item) => (
                  <li key={item.name} className="marquee-item">
                    <span className="marquee-avatar">{item.initials}</span>
                    <span className="marquee-label">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <style>{`
            @keyframes marquee-scroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-100%); }
            }
            .marquee-viewport {
              display: flex;
              overflow: hidden;
            }
            .marquee-viewport:hover .marquee-track {
              animation-play-state: paused;
            }
            .marquee-track {
              display: flex;
              flex-shrink: 0;
              list-style: none;
              margin: 0;
              padding: 0;
              animation: marquee-scroll 40s linear infinite;
              will-change: transform;
            }
            .marquee-item {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 0 40px;
              white-space: nowrap;
              opacity: 0.55;
            }
            .marquee-avatar {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: var(--color-primary);
              color: #fff;
              font-size: 0.688rem;
              font-weight: 700;
              letter-spacing: 0.03em;
              flex-shrink: 0;
            }
            .marquee-label {
              font-family: var(--font-heading, inherit);
              font-size: 0.9rem;
              font-weight: 650;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--color-text-primary);
              filter: grayscale(1);
            }
            @media (prefers-reduced-motion: reduce) {
              .marquee-track {
                animation: none;
              }
              .marquee-viewport {
                flex-wrap: wrap;
                justify-content: center;
                gap: 8px;
              }
            }
          `}</style>
        </section>
        {/* Dashboard Preview Section */}
        <section className="py-24 bg-[var(--color-bg)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-8">
              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              Live Platform Preview
            </div>
            <h2 className="text-4xl font-heading font-semibold mb-16">
              The operational heart of your clinic.
            </h2>

            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-[var(--color-primary)]/10 via-transparent to-[var(--color-secondary)]/10 blur-2xl" />
              <div
                role="button"
                tabIndex={0}
                aria-label={isPaused ? "Play demo preview" : "Pause demo preview"}
                onClick={() => setIsPaused(!isPaused)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsPaused(!isPaused);
                  }
                }}
                className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl overflow-hidden aspect-[16/10] flex flex-col cursor-pointer transition-transform hover:scale-[1.005] active:scale-[0.995]"
              >
                <div className="h-12 w-full bg-[var(--color-card-elevated)] border-b border-[var(--color-border)]/60 flex items-center justify-between px-6">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                    <div className="h-3 w-3 rounded-full bg-green-400/80" />
                  </div>
                  <a
                    href="https://medalerto.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-7 min-w-52 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    https://medalerto.com
                  </a>

                  <div className="h-8 w-8 rounded-full bg-[var(--color-bg-soft)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                    <img
                      src={logoCompact}
                      alt="MedAlerto"
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                </div>
                <div className="flex-1 flex overflow-hidden bg-[var(--color-bg-soft)]">
                  {/* Internal Sidebar */}
                  <div className="w-16 bg-[var(--color-card-elevated)] border-r border-[var(--color-border)]/60 p-4 flex flex-col gap-8">
                    {[
                      {
                        icon: (
                          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        ),
                        id: 0,
                      },
                      {
                        icon: (
                          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        ),
                        id: 1,
                      },
                      {
                        icon: (
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        ),
                        id: 2,
                      },
                      {
                        icon: (
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        ),
                        id: 3,
                      },
                    ].map((item, i) => (
                      <svg
                        key={i}
                        className={`h-6 w-6 transition-all duration-500 ${activeView === item.id ? "text-[var(--color-primary)] scale-110" : "text-[var(--color-text-secondary)]/70"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {item.icon}
                      </svg>
                    ))}
                  </div>

                  {/* Internal Main Content */}
                  <div className="flex-1 flex flex-col p-8 overflow-hidden relative">
                    <div
                      className={`transition-all duration-700 absolute inset-0 p-8 flex flex-col ${activeView === 0 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6">
                          <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">
                            Daily Overview
                          </h3>
                          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Live Sync
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-6 mb-10">
                        {[
                          { label: "Appointments", value: "24", change: "+3" },
                          { label: "Patients", value: "1,284", change: "+12" },
                          {
                            label: "Earnings",
                            value: "$4,820",
                            change: "+$210",
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="bg-[var(--color-card)] rounded-[2rem] p-6 border border-[var(--color-border)]/40 shadow-sm"
                          >
                            <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-2">
                              {stat.label}
                            </p>
                            <div className="flex items-baseline gap-3">
                              <span className="text-3xl font-black text-[var(--color-text-primary)]">
                                {stat.value}
                              </span>
                              <span className="text-xs text-green-600 font-bold">
                                {stat.change}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Table */}
                      <div className="flex-1 bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)]/40 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 border-b border-[var(--color-border)]/30 pb-4">
                          <span className="text-xs font-black text-[var(--color-text-primary)] uppercase tracking-widest">
                            Recent Patients
                          </span>
                          <span className="text-xs font-bold text-[var(--color-primary)]">
                            Full Directory
                          </span>
                        </div>
                        <div className="space-y-5">
                          {[
                            {
                              name: "Sarah Jenkins",
                              time: "09:30 AM",
                              status: "In Clinic",
                              color: "bg-green-100 text-green-700",
                              img: "https://i.pravatar.cc/150?u=sarah",
                            },
                            {
                              name: "Michael Ross",
                              time: "10:15 AM",
                              status: "Scheduled",
                              color: "bg-blue-100 text-blue-700",
                              img: "https://i.pravatar.cc/150?u=michael",
                            },
                            {
                              name: "Emma Wilson",
                              time: "11:00 AM",
                              status: "Follow up",
                              color: "bg-purple-100 text-purple-700",
                              img: "https://i.pravatar.cc/150?u=emma",
                            },
                          ].map((patient) => (
                            <div
                              key={patient.name}
                              className="flex items-center justify-between py-3 border-b border-[var(--color-border)]/30 last:border-0"
                            >
                              <div className="flex items-center gap-5">
                                <img
                                  src={patient.img}
                                  alt={patient.name}
                                  className="h-12 w-12 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                                    {patient.name}
                                  </p>
                                  <p className="text-xs text-[var(--color-text-secondary)]">
                                    {patient.time}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${patient.color}`}
                              >
                                {patient.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`transition-all duration-700 absolute inset-0 p-8 flex flex-col ${activeView === 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}
                    >
                      <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)] mb-10">
                        Patient Directory
                      </h3>
                      <div className="flex-1 bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)]/40 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-8">
                          <div className="h-12 w-64 bg-[var(--color-bg-soft)] rounded-xl border border-[var(--color-border)] px-4 flex items-center text-sm text-[var(--color-text-secondary)]">
                            Search patients...
                          </div>
                          <div className="h-12 w-32 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-xs text-white font-bold tracking-wide">
                            Add Patient
                          </div>
                        </div>
                        <div className="space-y-6">
                          {[
                            {
                              name: "Amna Khan",
                              id: "#P-9281",
                              phone: "+92 301 228811",
                              img: "https://i.pravatar.cc/150?u=amna",
                            },
                            {
                              name: "Zeeshan Ahmed",
                              id: "#P-8172",
                              phone: "+92 321 445522",
                              img: "https://i.pravatar.cc/150?u=zee",
                            },
                            {
                              name: "Fatima Noor",
                              id: "#P-7721",
                              phone: "+92 333 991100",
                              img: "https://i.pravatar.cc/150?u=fatima",
                            },
                          ].map((p, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-6 py-4 border-b border-[var(--color-border)]/30"
                            >
                              <img
                                src={p.img}
                                alt={p.name}
                                className="h-14 w-14 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <p className="text-base font-bold text-[var(--color-text-primary)]">
                                    {p.name}
                                  </p>
                                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
                                    {p.id}
                                  </span>
                                </div>
                                <div className="text-xs text-[var(--color-text-secondary)]">
                                  {p.phone}
                                </div>
                              </div>
                              <div className="h-10 w-24 bg-[var(--color-bg-soft)] rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest border border-[var(--color-border)]">
                                View File
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`transition-all duration-700 absolute inset-0 p-8 flex flex-col ${activeView === 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}
                    >
                      <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)] mb-10">
                        Clinical Calendar
                      </h3>
                      <div className="flex-1 bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)]/40 shadow-sm p-6 overflow-hidden">
                        <div className="grid grid-cols-7 gap-2 h-full">
                          {Array.from({ length: 21 }).map((_, i) => (
                            <div
                              key={i}
                              className="border border-[var(--color-border)]/40 relative p-2 min-h-[80px]"
                            >
                              <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                                {i + 1}
                              </span>
                              {i % 7 === 2 && (
                                <div className="absolute inset-x-2 top-8 h-4 bg-blue-100 rounded-md text-[10px] text-blue-700 px-2 flex items-center font-bold">
                                  Surgery
                                </div>
                              )}
                              {i % 7 === 4 && (
                                <div className="absolute inset-x-2 top-8 h-4 bg-green-100 rounded-md text-[10px] text-green-700 px-2 flex items-center font-bold">
                                  Review
                                </div>
                              )}
                              {i % 7 === 0 && i > 0 && (
                                <div className="absolute inset-x-2 top-8 h-4 bg-purple-100 rounded-md text-[10px] text-purple-700 px-2 flex items-center font-bold">
                                  Follow-up
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`transition-all duration-700 absolute inset-0 p-8 flex flex-col ${activeView === 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}
                    >
                      <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)] mb-10">
                        Smart Prescriptions
                      </h3>
                      <div className="flex-1 bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)]/40 shadow-sm p-8">
                        <div className="space-y-6">
                          {[
                            {
                              drug: "Amoxicillin",
                              dose: "500mg, 3x Daily",
                              patient: "Liam Smith",
                              date: "Oct 24",
                            },
                            {
                              drug: "Lisinopril",
                              dose: "10mg, 1x Daily",
                              patient: "Sarah Jenkins",
                              date: "Oct 23",
                            },
                            {
                              drug: "Metformin",
                              dose: "850mg, 2x Daily",
                              patient: "David Miller",
                              date: "Oct 23",
                            },
                          ].map((rx, i) => (
                            <div
                              key={i}
                              className="p-6 border border-[var(--color-border)] rounded-3xl bg-[var(--color-bg-soft)] flex justify-between items-center"
                            >
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                                    {rx.drug}
                                  </span>
                                  <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-card)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                                    {rx.dose}
                                  </span>
                                </div>
                                <div className="text-sm text-[var(--color-primary)] font-bold">
                                  Patient: {rx.patient}
                                </div>
                              </div>
                              <div className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter">
                                {rx.date}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Overlay Layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2B3E]/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[var(--color-primary)]/5 mix-blend-overlay pointer-events-none" />

                {/* Central Status Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`h-24 w-24 rounded-full bg-[#0D2B3E]/40 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all duration-500 shadow-2xl ${isPaused ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                  >
                    {isPaused ? (
                      <svg
                        className="h-10 w-10 drop-shadow-md"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg
                        className="h-10 w-10 drop-shadow-md"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Floating Status & Mute Indicator */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div
                    className="flex items-center gap-4 rounded-full bg-white/10 backdrop-blur-md px-5 py-2.5 border border-white/20 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-2 w-2 rounded-full bg-red-500 ${!isPaused && "animate-pulse"}`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap">
                        {isPaused ? "Demo Paused" : "Live Platform Demo"}
                      </span>
                    </div>

                    {!isMuted && !isPaused && (
                      <div className="flex items-center gap-0.5 h-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-0.5 bg-[var(--color-primary)] rounded-full animate-bounce`}
                            style={{
                              animationDelay: `${i * 0.1}s`,
                              height: `${audioGuideBarHeights[i - 1]}%`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="rounded-full bg-white/10 backdrop-blur-md p-3 border border-white/20 hover:bg-white/20 transition-all text-white group relative"
                    title={isMuted ? "Unmute Voiceover" : "Mute Voiceover"}
                  >
                    {isMuted && (
                      <span className="absolute -top-12 right-0 bg-[var(--color-primary)] text-white text-[10px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap animate-bounce shadow-lg pointer-events-none">
                        Enable Audio Guide
                        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-[var(--color-primary)] rotate-45" />
                      </span>
                    )}
                    {isMuted ? (
                      <svg
                        className="h-5 w-5 opacity-60 group-hover:opacity-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg-soft)]/35 py-24 sm:py-28 xl:py-32"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mb-16">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 py-2 pl-3.5 pr-4 shadow-sm backdrop-blur-md mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-secondary)]">
                  ENGINEERED CLINIC CAPABILITIES
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.08]">
                Built for rapid consultations, zero revenue leak, and instant patient delivery.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
                Replace manual paperwork and fragmented tools with a single queue-driven engine designed for actual clinic pace.
              </p>
            </div>

            {/* Bento Grid Container */}
            <div className="grid grid-cols-12 gap-6">

              {/* Card 1: Queue-Driven Patient State Machine (Col-Span 12 lg:Col-Span 8) */}
              <div className="col-span-12 lg:col-span-8 bg-[var(--color-card)] border border-[var(--color-border)]/80 rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-float)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
                      01 / Workflow State Engine
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                      Auto-Sorting Queue
                    </span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)] mb-3">
                    Live Queue & Auto-Consultation
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                    Today&apos;s appointments auto-sort by time. Selecting a card transitions patient state to In Consultation and mounts their historical records automatically.
                  </p>
                </div>

                {/* Micro-UI Mockup for Card 1 */}
                <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    <span>Today&apos;s Active Queue</span>
                    <span className="text-[var(--color-primary)]">Live Sync Active</span>
                  </div>
                  <div className="space-y-3">
                    {/* Waiting card */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-card)] text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[var(--color-text-secondary)]">7:00 PM</span>
                        <div>
                          <p className="font-bold text-[var(--color-text-primary)]">Sarah Jenkins <span className="text-[var(--color-text-secondary)] font-normal">· Follow-up</span></p>
                          <p className="text-[10px] text-[var(--color-text-secondary)]">Net Fee: Rs. 1,800</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                        WAITING
                      </span>
                    </div>

                    {/* In Consultation card (highlighted) */}
                    <div className="flex items-center justify-between p-3 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-card)] text-xs shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[var(--color-primary)]">7:15 PM</span>
                        <div>
                          <p className="font-bold text-[var(--color-text-primary)]">Ahmed Khan <span className="text-[var(--color-text-secondary)] font-normal">· New Consultation</span></p>
                          <p className="text-[10px] text-[var(--color-text-secondary)]">Net Fee: Rs. 2,000</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)] text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        IN_CONSULTATION
                      </span>
                    </div>

                    {/* Completed card */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-card)] text-xs opacity-75">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[var(--color-text-secondary)]">7:30 PM</span>
                        <div>
                          <p className="font-bold text-[var(--color-text-primary)]">Zainab Bibi <span className="text-[var(--color-text-secondary)] font-normal">· Checkup</span></p>
                          <p className="text-[10px] text-[var(--color-text-secondary)]">Net Fee: Rs. 1,500</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                        COMPLETED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Native WhatsApp PDF Dispatch (Col-Span 12 lg:Col-Span 4) */}
              <div className="col-span-12 lg:col-span-4 bg-[var(--color-card)] border border-[var(--color-border)]/80 rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-float)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
                      02 / Meta Cloud API
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      Verified ⚡
                    </span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)] mb-3">
                    Instant WhatsApp PDF Delivery
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                    No web links or third-party friction. Meta Cloud API streams downloadable PDF attachments directly inside the patient&apos;s chat.
                  </p>
                </div>

                {/* Micro-UI Mockup for Card 2 */}
                <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        Dr
                      </div>
                      <div className="flex-1 rounded-2xl rounded-tl-none bg-[var(--color-card)] border border-[var(--color-border)] p-3 text-xs shadow-sm">
                        <p className="font-bold text-[var(--color-text-primary)] mb-1">Prescription Dispatched</p>
                        {/* Attachment badge */}
                        <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                          <svg className="h-6 w-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate text-[11px]">Prescription_KDN.pdf</p>
                            <p className="text-[9px] text-[var(--color-text-secondary)]">142 KB · PDF Document</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-white dark:bg-black/40 px-2 py-1 rounded shadow-xs">
                            Download
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-end gap-1 text-[9px] text-[var(--color-text-secondary)]">
                          <span>7:16 PM</span>
                          <span className="text-blue-500 font-bold">✓✓ Delivered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Net Revenue & Discount Audit (Col-Span 12 sm:Col-Span 6 lg:Col-Span 4) */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[var(--color-card)] border border-[var(--color-border)]/80 rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-float)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
                      03 / Financial Accuracy
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      100% Audit Ready
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">
                    Net Pricing & Ancillary Billing
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                    Track original fees, custom discounts, and lab test additions in real time with 100% financial accuracy.
                  </p>
                </div>

                {/* Micro-UI Mockup for Card 3 */}
                <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 p-4 text-xs">
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between text-[var(--color-text-secondary)]">
                      <span>Consultation:</span>
                      <span className="font-bold text-[var(--color-text-primary)]">Rs. 2,000</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Discount (Custom):</span>
                      <span>-Rs. 200</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>+ Lab Test Fee:</span>
                      <span>+ Rs. 500</span>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-2 flex justify-between font-bold text-[var(--color-text-primary)] text-sm">
                      <span>Net Paid:</span>
                      <span className="text-[var(--color-primary)]">Rs. 2,300</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Zero-Egress Cloudflare R2 Vault (Col-Span 12 sm:Col-Span 6 lg:Col-Span 4) */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[var(--color-card)] border border-[var(--color-border)]/80 rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-float)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
                      04 / Object Storage
                    </span>
                    <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-full">
                      Zero Egress
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">
                    Encrypted R2 PDF Storage
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                    High-availability object storage for digital prescriptions with zero bandwidth egress costs.
                  </p>
                </div>

                {/* Micro-UI Mockup for Card 4 */}
                <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-orange-500/15 text-orange-600 flex items-center justify-center font-bold text-xs">
                        S3
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">Cloudflare R2 Vault</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-mono text-[10px] font-bold">
                      &lt; 150ms latency
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-[var(--color-text-secondary)] font-mono">
                    <div className="flex justify-between">
                      <span>Encryption:</span>
                      <span className="text-[var(--color-text-primary)]">AES-256 Bit</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bandwidth Cost:</span>
                      <span className="text-emerald-600 font-bold">$0.00 / GB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: 1-Click Overdue Patient Alerts (Col-Span 12 sm:Col-Span 12 lg:Col-Span 4) */}
              <div className="col-span-12 sm:col-span-12 lg:col-span-4 bg-[var(--color-card)] border border-[var(--color-border)]/80 rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-float)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
                      05 / Retention & Alerts
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full">
                      1-Click Trigger
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">
                    No-Show & Late Arrival Management
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                    Trigger automated WhatsApp arrival reminders with a single click when a patient misses their slot time.
                  </p>
                </div>

                {/* Micro-UI Mockup for Card 5 */}
                <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 p-4">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)]">Slot 6:45 PM · Overdue</p>
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">18 mins past appointment time</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.textContent = "⚡ Late Alert Dispatched ✓";
                      e.currentTarget.classList.add("bg-emerald-600", "text-white");
                      e.currentTarget.classList.remove("bg-[var(--color-primary)]", "text-[var(--color-on-primary)]");
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-bold tracking-wide transition-all shadow-md hover:opacity-95 flex items-center justify-center gap-2"
                  >
                    <span>⚡ Send WhatsApp Late Alert</span>
                  </button>
                </div>
              </div>

              {/* Card 6: Unified Patient History & Analytics (Col-Span 12 Bottom Wide Card) */}
              <div className="col-span-12 bg-[var(--color-card)] border border-[var(--color-border)]/80 rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-float)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
                      06 / Unified Clinical & Business Intelligence
                    </span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-full">
                      Zero Context Switch
                    </span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-[var(--color-text-primary)] mb-3">
                    Complete Clinical & Practice Insights
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6 max-w-3xl">
                    Access historical medical checkups, past prescriptions, and monthly revenue trends without leaving the consultation view.
                  </p>
                </div>

                {/* Split Micro-Mockup for Card 6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left panel: Historical checkup timeline */}
                  <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 p-4">
                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      <span>Patient Checkup Timeline</span>
                      <span className="text-[var(--color-primary)]">Search History</span>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]/60">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[var(--color-text-primary)]">Aug 12 - Hypertension Followup</span>
                          <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">Prescription #4921</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] truncate">BP 130/85 mmHg · Continued Lisinopril 10mg</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]/60">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[var(--color-text-primary)]">Jul 04 - Routine Lab Panel</span>
                          <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">Report #3812</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] truncate">HbA1c 5.8% · Lipid profile within normal bounds</p>
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Monthly earnings trend bar chart */}
                  <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/60 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      <span>Monthly Revenue Trend</span>
                      <span className="text-emerald-600">+24.5% MoM</span>
                    </div>
                    <div className="flex items-end justify-between gap-4 h-28 pt-4 px-2">
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--color-text-secondary)]">Rs. 420k</span>
                        <div className="w-full bg-[var(--color-primary)]/30 rounded-t-lg h-16" />
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">June</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--color-text-secondary)]">Rs. 510k</span>
                        <div className="w-full bg-[var(--color-primary)]/60 rounded-t-lg h-20" />
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">July</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--color-text-secondary)]">Rs. 640k</span>
                        <div className="w-full bg-[var(--color-primary)] rounded-t-lg h-28 shadow-sm" />
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-primary)]">August</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Practitioner testimonials — verified clinical impact */}
        <TestimonialsSection />

        {/* Closing CTA — trial registration banner */}
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
