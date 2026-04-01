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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Product capabilities</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Everything your clinic needs to run smoothly</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            MedAlerto combines consultation workflows, patient communication, and clinic operations into one focused platform.
            Each feature is designed to reduce administrative effort while improving care delivery consistency.
          </p>

          <div className="mt-12 grid gap-5">
            {features.map((feature) => (
              <section key={feature.title} className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
                <h2 className="text-2xl font-bold">{feature.title}</h2>
                <ul className="mt-4 space-y-3 text-[var(--color-text-secondary)]">
                  {feature.details.map((item) => (
                    <li key={item} className="flex items-start gap-3 leading-relaxed">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Operational outcomes</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {outcomes.map((outcome) => (
                <div key={outcome} className="rounded-xl border bg-[var(--color-bg)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {outcome}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Who this is for</h2>
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
