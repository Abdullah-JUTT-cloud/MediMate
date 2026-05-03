import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    title: "Create your clinic account",
    description:
      "Sign up, add your clinic profile, and set your consultation preferences. Most doctors complete this in under 10 minutes.",
    detail: "No technical setup required.",
  },
  {
    title: "Add patients and existing records",
    description:
      "Start with today's appointments or import records gradually. You can switch without pausing clinic operations.",
    detail: "Adopt in phases, not all at once.",
  },
  {
    title: "Run consultations digitally",
    description:
      "Document notes, generate prescriptions, and save each visit in one workflow while you consult.",
    detail: "Less post-consultation paperwork.",
  },
  {
    title: "Send prescriptions and reminders",
    description:
      "Share prescriptions instantly and automate follow-up reminders so communication does not depend on manual calls.",
    detail: "Fewer missed follow-ups.",
  },
  {
    title: "Track clinic performance",
    description:
      "Use simple reports to monitor appointments, patient activity, and operational load across the week.",
    detail: "Improve scheduling with real numbers.",
  },
];

const onboardingBlocks = [
  {
    title: "Day 1",
    text: "Account setup, profile completion, and first live prescription flow.",
  },
  {
    title: "Week 1",
    text: "Daily use for appointments, records, and follow-ups with staff alignment.",
  },
  {
    title: "Week 2 onward",
    text: "Optimization through reminders, reporting, and tighter front-desk workflow.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">How it works</p>
            <h1 className="mt-4 max-w-4xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">From signup to daily clinic use in a few practical steps.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              MedAlerto is designed for busy doctors. You can set it up quickly, start with live patient visits, and improve operations week by week.
            </p>
            <button className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-7 text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.3)]">
              Start Free Trial
            </button>
          </section>

          <section className="mt-16 relative">
            <div className="relative z-10 flex flex-col">
              {steps.map((step, index) => (
                <div key={step.title} className="flex flex-col">
                  <article className="relative flex gap-4 sm:gap-8 group z-10">
                    {/* Node marker */}
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[6px] border-[var(--color-bg)] bg-[var(--color-primary)] text-lg font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] transition-transform group-hover:scale-110 group-hover:shadow-[var(--shadow-float)] sm:h-16 sm:w-16 sm:text-xl">
                      {index + 1}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 rounded-[2rem] border border-[var(--color-border)]/70 bg-[var(--color-card)] p-6 shadow-[var(--shadow-soft)] transition-all group-hover:-translate-y-1 group-hover:border-[var(--color-primary)]/30 group-hover:shadow-[var(--shadow-float)] sm:p-8">
                      <h2 className="font-heading text-xl font-semibold text-[var(--color-text-primary)] sm:text-2xl">{step.title}</h2>
                      <p className="mt-3 leading-relaxed text-[var(--color-text-secondary)]">{step.description}</p>
                      <div className="mt-5">
                        <span className="inline-flex items-center rounded-full border border-[var(--color-secondary)]/40 bg-[var(--color-secondary)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--color-secondary)] transition-colors group-hover:border-[var(--color-secondary)]/60">
                          {step.detail}
                        </span>
                      </div>
                    </div>
                  </article>
                  
                  {/* Wavy Connector between cards */}
                  {index < steps.length - 1 && (
                    <div className="relative h-16 sm:h-24 w-full z-0 -my-2 opacity-70">
                      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-[var(--color-primary)] overflow-visible">
                        {index % 2 === 0 ? (
                          <path d="M 150 0 C 400 50, 850 50, 850 100" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="12 16" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                        ) : (
                          <path d="M 850 0 C 600 50, 150 50, 150 100" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="12 16" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                        )}
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">What onboarding looks like</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {onboardingBlocks.map((item) => (
                <article key={item.title} className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-primary)] p-8 text-[var(--color-on-primary)] shadow-[0_12px_34px_-16px_rgba(93,112,82,0.5)] sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h2 className="font-heading text-3xl font-semibold leading-tight">Ready to move from manual workflow to a cleaner system?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-on-primary)]/85">Start now and run your next clinic day with structured records, reminders, and faster handoff.</p>
            </div>
            <button className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-on-primary)] px-6 text-sm font-bold text-[var(--color-primary)] sm:mt-0">
              Create Your Account
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
