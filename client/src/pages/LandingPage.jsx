import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import doc from "../assets/doc-hero.webp";
import useThemedLogo from "../hooks/useThemedLogo";

const features = [
  {
    number: "01",
    title: "Digital Prescriptions",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    ),
    description:
      "Create and send prescriptions instantly as PDFs via WhatsApp. No more lost or damaged paper prescriptions.",
    tag: "Core workflow",
    impact: "Faster handoff",
  },
  {
    number: "02",
    title: "Medicine Alternatives",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    ),
    description:
      "Find alternative medicines by the same salt composition when your prescribed brand is unavailable.",
    tag: "Clinical continuity",
    impact: "Fewer treatment delays",
  },
  {
    number: "03",
    title: "Smart Appointments",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    ),
    description:
      "Schedule follow-ups with automatic WhatsApp confirmations. Reduce no-shows with intelligent reminders.",
    tag: "Daily operations",
    impact: "Better attendance",
  },
  {
    number: "04",
    title: "Patient History",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    description:
      "Access complete patient records and visit history instantly. Make informed decisions every time.",
    tag: "Record quality",
    impact: "Safer decisions",
  },
  {
    number: "05",
    title: "Emergency Management",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.195L14.25 2.25l-2.25 7.5h5.25l-4.507 4.83"
      />
    ),
    description:
      "Cancel a range of appointments with one click in emergencies. Patients are notified automatically.",
    tag: "Important feature",
    impact: "Rapid patient updates",
  },
  {
    number: "06",
    title: "Practice Insights",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    ),
    description:
      "Track monthly earnings, patient activity, and clinic performance without any extra effort.",
    tag: "Growth visibility",
    impact: "Clearer planning",
  },
];

const audioGuideBarHeights = [35, 70, 50, 85];

const trustSignals = [
  "Independent doctors",
  "Specialist clinics",
  "Role-based access",
  "Patient chat support",
  "Emergency bulk cancel",
  "Audit-friendly records",
  "Clinic-hour support",
];

const flowSteps = [
  {
    step: "01",
    title: "Morning setup",
    text: "Open the day with a clear appointment queue and active follow-up list.",
  },
  {
    step: "02",
    title: "Consultation workflow",
    text: "Capture notes, generate prescriptions, and send patient-ready instructions instantly.",
  },
  {
    step: "03",
    title: "Patient communication",
    text: "Use built-in chat and reminders to keep post-visit communication organized.",
  },
  {
    step: "04",
    title: "Operational control",
    text: "Track outcomes, monitor load, and handle emergency schedule changes in one place.",
  },
];

const testimonials = [
  {
    quote:
      "We reduced front-desk follow-up calls significantly because reminders and prescription delivery are now consistent.",
    author: "Dr. Hina A.",
    role: "Dermatology Clinic, Lahore",
    metric: "-42% manual follow-up calls",
  },
  {
    quote:
      "The emergency bulk cancel button saved us during an unplanned closure. Patients were informed quickly without chaos.",
    author: "Dr. Faraz K.",
    role: "General Practice, Karachi",
    metric: "120+ appointments updated in minutes",
  },
  {
    quote:
      "We finally have one reliable view of patient history, prescriptions, and chat. Decision-making is much faster now.",
    author: "Dr. Sana M.",
    role: "Internal Medicine, Islamabad",
    metric: "10x faster record retrieval",
  },
  {
    quote:
      "Our reception team now handles scheduling changes without confusion, and patients get updates immediately.",
    author: "Dr. Kamran T.",
    role: "Family Clinic, Faisalabad",
    metric: "-35% front-desk call volume",
  },
  {
    quote:
      "Prescription turnaround is much faster now. We complete visits without asking patients to wait for paperwork.",
    author: "Dr. Ayesha R.",
    role: "General Practice, Multan",
    metric: "3x faster prescription handoff",
  },
  {
    quote:
      "The reminders improved follow-up attendance in just a few weeks and reduced missed continuity visits.",
    author: "Dr. Bilal N.",
    role: "Cardiac Clinic, Rawalpindi",
    metric: "+28% follow-up attendance",
  },
  {
    quote:
      "Patient chat helped us reduce unclear post-visit instructions and avoid repeat clarification calls.",
    author: "Dr. Mahnoor S.",
    role: "Pediatrics, Lahore",
    metric: "-31% post-visit clarification calls",
  },
  {
    quote:
      "We no longer depend on scattered notes. Every visit detail is available when the patient returns.",
    author: "Dr. Waqas H.",
    role: "Orthopedic Practice, Karachi",
    metric: "Consistent records across visits",
  },
  {
    quote:
      "The dashboard makes daily load obvious. We plan staff shifts better and avoid peak-hour bottlenecks.",
    author: "Dr. Nadia F.",
    role: "Multi-Doctor Clinic, Islamabad",
    metric: "Smoother daily throughput",
  },
];

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
          // Fallback if autoplay is blocked
          console.log("Autoplay blocked, user interaction required");
        });
      }
    }
  }, []);

  return (
    <div className="landing-page min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden bg-[var(--color-bg)] pt-28 sm:pt-32">
          <div
            aria-hidden="true"
            className="absolute -left-24 top-8 h-80 w-80 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[var(--color-primary)]/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 top-16 h-96 w-96 rounded-[58%_42%_56%_44%/44%_58%_42%_56%] bg-[var(--color-secondary)]/18 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-6 top-10 h-px bg-[var(--color-border)]/50"
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 pb-16 sm:px-6 lg:px-8 xl:pb-24">
            <div className="col-span-12 flex flex-col justify-center xl:col-span-6">
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-[var(--color-secondary)]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)] sm:text-[10px]">
                  Premium Clinic Workflow
                </p>
              </div>

              <h1 className="mt-8 max-w-[15ch] text-[2.75rem] font-heading font-extrabold leading-[0.9] tracking-[-0.04em] text-balance sm:max-w-3xl sm:text-6xl sm:tracking-tight lg:text-7xl xl:text-[5.5rem]">
                <span className="block">Clinic workflow,</span>
                <span className="block text-[var(--color-primary)]">
                  mastered with
                </span>
                <span className="block italic text-[var(--color-secondary)]">
                  quiet precision.
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
                MedAlerto unifies prescriptions, scheduling, and patient history
                into a single, intuitive interface designed for the modern
                practice.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate("/signup")}
                  className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] px-10 font-body text-sm font-bold text-[var(--color-on-primary)] shadow-[0_20px_40px_-10px_rgba(26,155,140,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_rgba(26,155,140,0.4)]"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-0" />
                </button>
                <button
                  onClick={() => navigate("/features")}
                  className="see-platform-button inline-flex h-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/50 px-10 font-body text-sm font-bold backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
                >
                  See Platform
                </button>
              </div>

              {/* Fix the hero stat strip wrapping awkwardly on narrower widths by allowing the metrics to flow cleanly. */}
              <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-[var(--color-border)]/50 pt-10">
                <div>
                  <p className="text-2xl font-bold text-[var(--color-primary)]">
                    5,000+
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]/60">
                    Active Doctors
                  </p>
                </div>
                <div className="h-8 w-px bg-[var(--color-border)]/50" />
                <div>
                  <p className="text-2xl font-bold text-[var(--color-primary)]">
                    1M+
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]/60">
                    Patients Served
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-5 xl:col-start-8 relative">
              <div className="group relative mx-auto w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-[2.5rem] border-8 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]">
                  <img
                    src={doc}
                    alt="Doctor"
                    className="aspect-4/5 w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
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
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 xl:col-span-6 xl:col-start-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">
                  What the platform handles
                </p>
                <h2 className="mt-6 max-w-3xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl lg:text-6xl">
                  Every critical workflow,{" "}
                  <span className="italic text-[var(--color-secondary)]">
                    shaped
                  </span>{" "}
                  with gentle clarity.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:leading-[0.8] first-letter:font-heading first-letter:font-semibold first-letter:text-[var(--color-primary)]">
                  MedAlerto reduces the manual noise around prescriptions,
                  scheduling, and patient tracking. The result is a calmer
                  workflow that still moves fast when the clinic needs it.
                </p>
                <div className="mt-6 inline-flex rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)] px-4 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-primary)]">
                    {features.length} operational capabilities
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {features.map(
                ({ number, title, description, tag, impact, icon }, index) => (
                  <article
                    key={title}
                    className={`group relative flex flex-col h-full rounded-[2.25rem] border border-[var(--color-border)]/60 bg-[var(--color-card)] p-8 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl motion-reduce:transition-none ${index === 0 ? "xl:col-span-2" : index === 5 ? "xl:col-span-3" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          {icon}
                        </svg>
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-muted)]">
                        {number}
                      </p>
                    </div>
                    <p className="mt-8 inline-flex self-start rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                      {tag}
                    </p>
                    <h3 className="mt-8 text-2xl font-heading font-semibold leading-tight text-[var(--color-text-primary)]">
                      {title}
                    </h3>
                    <p className="mt-4 flex-1 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {description}
                    </p>
                    <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)]/70 pt-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)] font-bold">
                        Impact: {impact}
                      </p>
                      <span className="text-xl text-[var(--color-primary)] font-bold transition-transform duration-300 group-hover:translate-x-1.5">
                        ›
                      </span>
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg)] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-5 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-secondary)]">
                Built for real clinic conditions
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {trustSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--color-text-secondary)]"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg-soft)]/35 py-24 sm:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 xl:col-span-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">
                  How clinics use it daily
                </p>
                <h2 className="mt-6 max-w-xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl">
                  A calmer day from{" "}
                  <span className="italic text-[var(--color-secondary)]">
                    first patient
                  </span>{" "}
                  to close.
                </h2>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)]">
                  MedAlerto is designed to match real outpatient pace: fast
                  consultations, reliable communication, and stronger
                  operational control when unexpected situations appear.
                </p>
              </div>
              <div className="col-span-12 xl:col-span-7">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {flowSteps.map((item) => (
                    <article
                      key={item.step}
                      className="rounded-3xl border border-[var(--color-border)]/70 bg-[var(--color-card)] p-5 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)]"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)]">
                        {item.step}
                      </p>
                      <h3 className="mt-3 text-xl font-heading font-semibold">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {item.text}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg)] py-24 sm:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">
                  Clinic feedback
                </p>
                <h2 className="mt-4 max-w-2xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl">
                  Trusted by doctors who run high-pressure days.
                </h2>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-secondary)] bg-[var(--color-card)] px-5 text-sm font-bold text-[var(--color-secondary)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-secondary)]/10"
              >
                View Pricing
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {testimonials.slice(0, 3).map((item, idx) => (
                <article
                  key={item.author}
                  className="group rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-sm font-bold select-none"
                      style={{
                        background: [
                          "linear-gradient(135deg, #6B8F71, #4a7c59)",
                          "linear-gradient(135deg, #5b7fa6, #3d6b99)",
                          "linear-gradient(135deg, #a67c5b, #8a5c3a)",
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
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        {item.author}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                        {item.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm italic leading-relaxed text-[var(--color-text-secondary)]">
                    “{item.quote}”
                  </p>
                  <div className="mt-5 border-t border-[var(--color-border)]/80 pt-4">
                    <p className="inline-flex rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                      {item.metric}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-[var(--color-border)]/60 bg-[var(--color-primary)] py-24 text-[var(--color-on-primary)] sm:py-28 xl:py-32">
          <div
            aria-hidden="true"
            className="absolute -left-16 top-8 h-72 w-72 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/18 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-80 w-80 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-secondary)]/18 blur-3xl"
          />
          <div className="relative mx-auto grid w-full max-w-7xl grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
            <div className="col-span-12 xl:col-span-7 xl:col-start-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-accent)]">
                Closing note
              </p>
              <h2 className="mt-6 max-w-4xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl lg:text-6xl">
                Ready to modernize the clinic with a softer kind of structure?
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-on-primary)]/80">
                Join doctors using MedAlerto to save time, reduce mistakes, and
                keep every patient record in one place.
              </p>
            </div>

            <div className="col-span-12 flex items-end xl:col-span-3 xl:col-start-10">
              <button
                onClick={() => navigate("/signup")}
                className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-[var(--color-on-primary)]/40 bg-[var(--color-on-primary)] px-8 font-body text-sm font-bold text-[var(--color-primary)] shadow-[0_4px_20px_-2px_rgba(243,244,241,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-bg-soft)] hover:shadow-[0_10px_28px_-14px_rgba(243,244,241,0.24)] active:translate-y-0 motion-reduce:transition-none"
              >
                <span className="absolute inset-0 bg-[var(--color-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10">Create Your Free Account</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
