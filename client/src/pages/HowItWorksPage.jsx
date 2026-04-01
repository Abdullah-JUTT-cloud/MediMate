import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    title: "Set up your clinic profile",
    description:
      "Configure your doctor profile, prescription format, and clinic communication preferences so every document is standardized from day one.",
  },
  {
    title: "Register or retrieve patient records",
    description:
      "Search existing patients by contact details or add a new patient in seconds with a consistent record structure for future visits.",
  },
  {
    title: "Document consultation and treatment",
    description:
      "Create digital prescriptions, record key findings, and attach follow-up notes within the consultation workflow.",
  },
  {
    title: "Deliver instantly to the patient",
    description:
      "Generate PDF prescriptions and send them on WhatsApp directly from the platform to improve handoff reliability.",
  },
  {
    title: "Schedule follow-up and automate reminders",
    description:
      "Book the next visit before the patient leaves and let MedAlerto handle confirmations and reminder messages automatically.",
  },
  {
    title: "Review performance and improve operations",
    description:
      "Use appointment and earning insights to identify bottlenecks, optimize clinic schedules, and improve overall service quality.",
  },
];

const implementation = [
  {
    title: "Day 1: onboarding",
    text: "Initial account setup, branding preferences, and core clinic workflow configuration.",
  },
  {
    title: "Week 1: adoption",
    text: "Daily usage for prescriptions, appointments, and patient history with support for process alignment.",
  },
  {
    title: "Week 2 onward: optimization",
    text: "Use insights and reminders to reduce no-shows, increase operational predictability, and standardize communication.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Workflow overview</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">A complete clinic workflow in one system</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            From first consultation to follow-up reminders, MedAlerto keeps every step connected so doctors can spend less time on admin and more time on care.
          </p>

          <div className="mt-12 space-y-6">
            {steps.map((step, index) => (
              <section key={step.title} className="flex flex-col gap-5 rounded-2xl border bg-[var(--color-card)] p-6 sm:flex-row sm:items-start sm:gap-7 sm:p-8">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-lg font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{step.title}</h2>
                  <p className="mt-3 leading-relaxed text-[var(--color-text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Implementation timeline</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {implementation.map((item) => (
                <article key={item.title} className="rounded-xl border bg-[var(--color-bg)] p-4">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Built for real clinic conditions</h2>
            <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
              MedAlerto is designed for fast-paced outpatient settings where consistency, speed, and communication quality directly
              affect patient satisfaction and daily clinic outcomes.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
