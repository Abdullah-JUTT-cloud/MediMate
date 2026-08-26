import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";

const TRUST_ITEMS = [
  "14-Day Free Access",
  "No Credit Card Required",
  "5-Minute Setup",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Closing CTA — high-converting registration banner.
 *
 * A dark gradient container with ambient teal glows, an integrated email
 * capture that hands the address off to the signup flow, and a micro-trust bar
 * that removes the last objections before the click.
 */
export default function CtaSection() {
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
      className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg)] py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`cta-reveal ${isVisible ? "is-in" : ""}`}
          style={{ "--reveal-delay": "0ms" }}
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl sm:rounded-4xl p-8 sm:p-14 relative overflow-hidden border border-slate-700/50 shadow-2xl">
            {/* ── Ambient radial glows (decorative) ───────────────────────── */}
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
              className="pointer-events-none absolute right-1/3 top-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
            />
            {/* Hairline sheen along the top edge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent"
            />
            {/* Faint grid texture for the premium SaaS finish */}
            <div aria-hidden="true" className="cta-grid absolute inset-0" />

            <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
              {/* ── Copy column ─────────────────────────────────────────── */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-400/25 bg-teal-400/10 py-2 pl-3.5 pr-4 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="cta-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-teal-200">
                    Ready to upgrade your clinic?
                  </span>
                </div>

                <h2
                  id="closing-cta-heading"
                  className="mt-6 max-w-2xl text-3xl font-heading font-extrabold leading-[1.06] tracking-tight text-balance text-white sm:text-4xl lg:text-5xl"
                >
                  Run your clinic with engineered precision today.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  Join hundreds of doctors using MedAlerto to eliminate
                  paperwork, streamline consultations, and automate patient
                  communication.
                </p>
              </div>

              {/* ── Action column ───────────────────────────────────────── */}
              <div className="lg:col-span-5">
                <form onSubmit={handleSubmit} noValidate className="w-full">
                  <label htmlFor="cta-email" className="sr-only">
                    Work email address
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="cta-email"
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
                      aria-describedby={error ? "cta-email-error" : undefined}
                      className="h-14 w-full flex-1 rounded-full border border-slate-700 bg-slate-800/80 px-5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/25"
                    />

                    <button
                      type="submit"
                      className="group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-teal-500 px-7 font-body text-sm font-bold text-slate-950 shadow-[0_18px_40px_-16px_rgba(45,212,191,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300 active:translate-y-0"
                    >
                      Start Free Trial
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  {/* Live-announced validation feedback */}
                  <p
                    id="cta-email-error"
                    role="alert"
                    aria-live="polite"
                    className={`mt-3 min-h-[1.25rem] px-1 text-xs font-semibold text-rose-300 transition-opacity duration-200 ${
                      error ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {error || "\u00A0"}
                  </p>

                  {/* ── Micro-trust guarantee bar ───────────────────────── */}
                  <ul className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                    {TRUST_ITEMS.map((item) => (
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
      </div>

      <style>{`
        .cta-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition:
            opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--reveal-delay, 0ms);
          will-change: opacity, transform;
        }
        .cta-reveal.is-in {
          opacity: 1;
          transform: none;
        }

        .cta-ping {
          animation: ctaPing 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ctaPing {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }

        /* Subtle engineered grid, faded out toward the edges */
        .cta-grid {
          background-image:
            linear-gradient(to right, rgb(148 163 184 / 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(148 163 184 / 0.07) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: radial-gradient(ellipse at center, #000 15%, transparent 72%);
          mask-image: radial-gradient(ellipse at center, #000 15%, transparent 72%);
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .cta-ping { animation: none; }
        }
      `}</style>
    </section>
  );
}
