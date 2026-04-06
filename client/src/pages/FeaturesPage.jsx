import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const featureGroups = [
  {
    title: "Consultation & Prescription",
    items: [
      "Digital prescriptions with clear dosage and instructions",
      "Clinic-branded PDF generation for every prescription",
      "Instant prescription sharing via WhatsApp",
      "Salt-composition medicine alternatives",
      "Follow-up note capture during consultation",
      "Structured consultation notes for continuity",
    ],
  },
  {
    title: "Patients & Medical Records",
    items: [
      "Centralized patient profiles",
      "Visit timeline and prescription history",
      "Search patients by key details",
      "Allergy and treatment context visibility",
      "Doctor-side and patient-side chat context retention",
      "Safer record retrieval without paper dependency",
    ],
  },
  {
    title: "Appointments & Follow-ups",
    items: [
      "Appointment booking and rescheduling",
      "Follow-up scheduling in the same workflow",
      "Automatic reminder messaging",
      "Emergency appointment handling",
      "Calendar visibility for daily load planning",
      "Reduced no-shows through automated communication",
    ],
  },
  {
    title: "Communication & Patient Chat",
    items: [
      "Real-time doctor-patient chat",
      "Attachment support for documents and images",
      "Voice message support in chats",
      "Secure message history",
      "Patient-side login and guided access",
      "Conversation continuity for follow-up care",
    ],
  },
  {
    title: "Clinic Operations & Insights",
    items: [
      "Dashboard for appointments, patients, and activity",
      "Operational insights and reporting",
      "Revenue and billing visibility",
      "Notifications for key workflow updates",
      "Issue ticket and support center workflow",
      "Support chat with status tracking",
    ],
  },
  {
    title: "Admin, Security & Control",
    items: [
      "Admin verification and account management",
      "Role-aware access handling",
      "Secure authentication and session controls",
      "File upload safeguards for attachments",
      "Data handling controls and policy-ready structure",
      "Scalable setup for independent and small-clinic teams",
    ],
  },
];

const outcomes = [
  "Less manual admin work every day",
  "Fewer prescription and follow-up errors",
  "Stronger continuity between patient visits",
  "Faster front-desk and doctor coordination",
  "Higher communication reliability with patients",
  "Better operational visibility for clinic growth",
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Features</p>
            <h1 className="mt-4 max-w-4xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">All core workflows your clinic needs in one system.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              MedAlerto is built for independent doctors, specialists, and small clinics. It combines prescription workflow, records,
              appointments, chat, reporting, and support operations without enterprise complexity.
            </p>
          </section>

          <section className="mt-8 rounded-4xl border border-[var(--color-secondary)]/45 bg-[var(--color-secondary)]/10 p-6 shadow-[0_10px_34px_-16px_rgba(193,140,93,0.35)] sm:p-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary)]">Important Feature</p>
            <h2 className="mt-3 font-heading text-2xl font-semibold">Emergency Cancel Button (Bulk Appointment Cancel)</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              In emergencies, doctors can cancel a selected range of appointments in one action. MedAlerto then sends updates to affected patients quickly, reducing front-desk pressure and communication delays.
            </p>
          </section>

          <section className="mt-12 grid gap-5 lg:grid-cols-2">
            {featureGroups.map((group) => (
              <article key={group.title} className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-7">
                <h2 className="font-heading text-2xl font-semibold">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Operational impact</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {outcomes.map((item) => (
                <div key={item} className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45 p-4 text-sm font-semibold text-[var(--color-text-primary)]">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
