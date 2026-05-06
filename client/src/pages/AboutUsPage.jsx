import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const painPoints = [
  "Patient details scattered across paper files and chat threads",
  "Manual reminder calling that consumes staff time daily",
  "Unreadable or missing prescription history during follow-ups",
  "No simple way to track clinic workload and operational bottlenecks",
];

const principles = [
  {
    title: "Practical over complex",
    description: "If a workflow slows down consultation speed, we redesign it.",
  },
  {
    title: "Doctor-first clarity",
    description: "Every screen should help the doctor decide and act quickly.",
  },
  {
    title: "Team-ready operations",
    description: "Clinic staff can execute tasks without breaking data quality.",
  },
  {
    title: "Responsible data handling",
    description: "Patient information is treated as critical clinical responsibility.",
  },
];

const serviceHighlights = [
  "Structured patient management",
  "Reliable appointment and follow-up workflow",
  "Clear digital prescription handoff",
  "Operational insight for better clinic decisions",
];

export default function AboutUsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Our mission</p>
            <h1 className="mt-4 max-w-4xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">
              Make daily clinic operations more reliable, more transparent, and easier to manage.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              MedAlerto is built for independent doctors, specialists, and small clinics that need strong operational systems without enterprise complexity.
            </p>
          </section>

          <section className="mt-12 grid gap-5 lg:grid-cols-12">
            {/* Fix mismatched card heights in the same row by stretching both lead cards to the full grid height. */}
            <article className="h-full rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-7 lg:col-span-7">
              <h2 className="font-heading text-3xl font-semibold">What is broken in small-clinic operations</h2>
              <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
                Most small clinics are still forced to run core workflow across disconnected tools. That creates delays, avoidable mistakes, and operational stress for both doctors and staff.
              </p>
              <ul className="mt-5 space-y-3">
                {painPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="h-full rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-7 lg:col-span-5">
              <h2 className="font-heading text-3xl font-semibold">Why MedAlerto exists</h2>
              <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
                We created MedAlerto so doctors can spend more time on care and less time on repetitive admin. The product is focused on the workflows that directly affect consultation quality and clinic consistency.
              </p>
              <div className="mt-5 space-y-2">
                {serviceHighlights.map((item) => (
                  <p key={item} className="rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/50 px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)]">
                    {item}
                  </p>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
            <h2 className="font-heading text-3xl font-semibold">How we build</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {principles.map((item) => (
                <article key={item.title} className="h-full rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45 p-4">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-primary)] p-8 text-[var(--color-on-primary)] shadow-[0_12px_34px_-16px_rgba(93,112,82,0.5)] sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-on-primary)]/80">Vision</p>
            <h2 className="mt-3 max-w-4xl font-heading text-3xl font-semibold leading-tight sm:text-4xl">A future where every independent clinic runs with structured systems, dependable communication, and better patient continuity.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--color-on-primary)]/85">
              We are not building for giant hospital bureaucracy. We are building practical software for real outpatient clinics that need speed, control, and trust in daily operations.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
