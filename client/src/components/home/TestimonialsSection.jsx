import { Star, BadgeCheck, Quote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";

/* ───────────────────────────────────────────────────────────────────────────
   Impact-pill tone map.

   Tailwind scans source files for *literal* class strings, so every variant is
   written out in full here rather than composed at runtime.
   ─────────────────────────────────────────────────────────────────────────── */
const IMPACT_TONES = {
  emerald: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hook: "impact-pill-emerald",
  },
  teal: {
    pill: "bg-teal-50 text-teal-700 border-teal-200",
    hook: "impact-pill-teal",
  },
  blue: {
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    hook: "impact-pill-blue",
  },
};

/* Verified practitioner proof — each card pairs a clinical narrative with a
   single quantified operational outcome. */
const PRACTITIONER_TESTIMONIALS = [
  {
    id: "hina-a",
    name: "Dr. Hina A.",
    specialty: "Dermatology Clinic, Lahore",
    initials: "HA",
    avatar: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    quote:
      "Reminders and prescription delivery now run themselves, so my front desk stopped calling every patient after every visit. The same two receptionists handle a full outpatient day without chasing anyone.",
    impact: { label: "-65% Front-Desk Follow-Up Calls", tone: "emerald" },
  },
  {
    id: "faraz-k",
    name: "Dr. Faraz K.",
    specialty: "General Practice, Karachi",
    initials: "FK",
    avatar: "linear-gradient(135deg, #0ea5a4 0%, #115e59 100%)",
    quote:
      "Every prescription lands on the patient's WhatsApp before they leave the building. No reprinted slips, no lost paper, and no late-evening calls asking what the dosage was supposed to be.",
    impact: { label: "100% WhatsApp Prescription Delivery Rate", tone: "teal" },
  },
  {
    id: "sana-m",
    name: "Dr. Sana M.",
    specialty: "Internal Medicine, Islamabad",
    initials: "SM",
    avatar: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)",
    quote:
      "Full history, past prescriptions, and previous vitals load the moment I open a consultation. What used to mean digging through a file cabinet mid-appointment is now a single click.",
    impact: { label: "10x Faster Patient Record Retrieval", tone: "blue" },
  },
];

function StarRating() {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label="Rated 5 out of 5"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-amber-400 text-amber-400"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Practitioner testimonials — verified clinical impact.
 *
 * Three-column responsive grid of outcome-led proof cards. Each card carries a
 * verified identity block, a 5-star rating, the practitioner narrative, and one
 * quantified operational metric so the section reads as evidence rather than
 * sentiment.
 */
export default function TestimonialsSection() {
  const navigate = useNavigate();
  const [sectionRef, isVisible] = useRevealOnScroll();

  return (
    <section
      ref={sectionRef}
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden border-t border-[var(--color-border)]/60 bg-[var(--color-bg)] py-24 sm:py-28"
    >
      {/* Ambient wash — decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-[var(--color-primary)]/8 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[var(--color-secondary)]/8 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div
            className={`mm-reveal max-w-3xl ${isVisible ? "is-in" : ""}`}
            style={{ "--reveal-delay": "0ms" }}
          >
            {/* Eyebrow badge */}
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 py-2 pl-3.5 pr-4 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="mm-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-secondary)]">
                Verified Clinical Impact
              </span>
            </div>

            <h2
              id="testimonials-heading"
              className="text-3xl font-heading font-extrabold leading-[1.08] tracking-tight text-balance text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl"
            >
              Validated by practitioners managing high-volume outpatient
              clinics.
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              See how leading doctors cut front-desk overhead and eliminate
              missing records.
            </p>
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className={`mm-reveal inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-secondary)] bg-[var(--color-card)] px-5 text-sm font-bold text-[var(--color-secondary)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-secondary)]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)] ${
              isVisible ? "is-in" : ""
            }`}
            style={{ "--reveal-delay": "90ms" }}
          >
            View Pricing
          </button>
        </div>

        {/* ── Testimonial grid ───────────────────────────────────────────── */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRACTITIONER_TESTIMONIALS.map((item, idx) => {
            const tone = IMPACT_TONES[item.impact.tone];

            return (
              <div
                key={item.id}
                className={`mm-reveal h-full ${isVisible ? "is-in" : ""} ${
                  idx === 2 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
                style={{ "--reveal-delay": `${140 + idx * 110}ms` }}
              >
                <article className="group relative flex h-full flex-col bg-[var(--color-card)] border border-[var(--color-border)]/80 rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-float)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30">
                  {/* Watermark quote glyph */}
                  <Quote
                    aria-hidden="true"
                    className="pointer-events-none absolute right-6 top-6 h-9 w-9 text-[var(--color-primary)]/10 transition-colors duration-300 group-hover:text-[var(--color-primary)]/20"
                  />

                  {/* Header row: identity + PMDC verification */}
                  <header className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-full text-sm font-extrabold tracking-wide text-white ring-2 ring-[var(--color-primary)]/45 ring-offset-2 ring-offset-[var(--color-card)]"
                      style={{ background: item.avatar }}
                    >
                      {item.initials}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">
                          {item.name}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                          <BadgeCheck
                            className="h-3 w-3"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                          PMDC Verified
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        {item.specialty}
                      </p>
                    </div>
                  </header>

                  {/* Rating bar */}
                  <div className="mt-5">
                    <StarRating />
                  </div>

                  {/* Quote body */}
                  <blockquote className="mt-4 flex-1 font-body text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>

                  {/* Quantified impact */}
                  <div className="mt-6 border-t border-[var(--color-border)]/70 pt-5">
                    <p
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ${tone.pill} ${tone.hook}`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-current"
                      />
                      {item.impact.label}
                    </p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        /* Scroll-in reveal (staggered via --reveal-delay) */
        .mm-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--reveal-delay, 0ms);
          will-change: opacity, transform;
        }
        .mm-reveal.is-in {
          opacity: 1;
          transform: none;
        }

        .mm-ping {
          animation: mmPing 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes mmPing {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }

        /* Dark theme: the impact pills keep their hue but invert into tinted
           chips so they never glare against the dark card surface. */
        [data-theme="dark"] .impact-pill-emerald {
          background-color: rgb(16 185 129 / 0.14);
          border-color: rgb(16 185 129 / 0.32);
          color: rgb(110 231 183);
        }
        [data-theme="dark"] .impact-pill-teal {
          background-color: rgb(20 184 166 / 0.14);
          border-color: rgb(20 184 166 / 0.32);
          color: rgb(94 234 212);
        }
        [data-theme="dark"] .impact-pill-blue {
          background-color: rgb(59 130 246 / 0.14);
          border-color: rgb(59 130 246 / 0.32);
          color: rgb(147 197 253);
        }

        @media (prefers-reduced-motion: reduce) {
          .mm-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .mm-ping { animation: none; }
        }
      `}</style>
    </section>
  );
}
