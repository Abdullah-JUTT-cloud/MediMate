import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const features = [
  {
    title: "Prescription workflow built for speed",
    details: [
      "Create complete prescriptions with dosage instructions and follow-up notes in under a minute.",
      "Generate standardized, clinic-branded PDF prescriptions for every consultation.",
      "Deliver prescriptions instantly over WhatsApp to reduce callbacks and lost documents.",
    ],
  },
  {
    title: "Longitudinal patient records",
    details: [
      "View visit timelines, prior prescriptions, and key notes before the consultation starts.",
      "Track treatment progression over time for better continuity of care.",
      "Keep patient data centralized so staff do not depend on paper files or chat history.",
    ],
  },
  {
    title: "Medicine alternative guidance",
    details: [
      "Get salt-composition alternatives when preferred brands are unavailable.",
      "Respond to pharmacy availability issues quickly without restarting the prescription process.",
      "Maintain treatment intent while improving medicine accessibility for patients.",
    ],
  },
  {
    title: "Appointment and queue control",
    details: [
      "Book consultations and follow-ups with real-time slot visibility.",
      "Send confirmations and reminders automatically to reduce no-show rates.",
      "Handle emergency schedule changes and notify affected patients in one action.",
    ],
  },
  {
    title: "Operational visibility for clinic owners",
    details: [
      "Monitor appointment volume, patient activity, and clinic utilization trends.",
      "Track earnings and performance metrics from a single dashboard.",
      "Use structured insights to improve staffing, scheduling, and daily throughput.",
    ],
  },
];

const outcomes = [
  "Faster consultations with less repetitive admin work",
  "Higher prescription delivery success through direct WhatsApp communication",
  "Improved patient trust with legible, consistent, and retrievable records",
  "More predictable clinic operations through reminders and schedule controls",
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Product capabilities</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Everything your clinic needs to run smoothly</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            MedAlerto combines consultation workflows, patient communication, and clinic operations into one focused platform.
            Each feature is designed to reduce administrative effort while improving care delivery consistency.
          </p>

          <div className="mt-12 grid gap-5">
            {features.map((feature) => (
              <section key={feature.title} className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
                <h2 className="font-heading text-2xl font-semibold">{feature.title}</h2>
                <ul className="mt-4 space-y-3 text-[var(--color-text-secondary)]">
                  {feature.details.map((item) => (
                    <li key={item} className="flex items-start gap-3 leading-relaxed">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Operational outcomes</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {outcomes.map((outcome) => (
                <div key={outcome} className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45 p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {outcome}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Who this is for</h2>
            <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
              Independent practitioners, specialist clinics, and growing multi-doctor practices that need a reliable operating system
              for prescriptions, appointments, and patient records without adopting heavy enterprise software.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
