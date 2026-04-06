import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. Agreement",
    text: "By creating an account or using MedAlerto, you agree to these Terms and associated policies.",
  },
  {
    title: "2. Service scope",
    text: "MedAlerto provides software for small-clinic operations, including appointments, records, prescriptions, reminders, and related workflows.",
  },
  {
    title: "3. Clinical responsibility",
    text: "All diagnosis, treatment, and prescription decisions remain solely the responsibility of licensed medical professionals using the platform.",
  },
  {
    title: "4. Account and access",
    bullets: [
      "You are responsible for account credentials and user-level access",
      "You must provide accurate account information",
      "You must notify us promptly if unauthorized access is suspected",
    ],
  },
  {
    title: "5. Acceptable use",
    bullets: [
      "No unlawful use of the platform",
      "No attempts to bypass security controls",
      "No malicious uploads or abuse of system resources",
      "No unauthorized access to other users' data",
    ],
  },
  {
    title: "6. Billing and subscriptions",
    text: "Paid plans are billed by active cycle. Unless stated otherwise, fees are non-refundable for completed billing periods. Plan prices and limits may change with notice.",
  },
  {
    title: "7. Data and confidentiality",
    text: "Clinic and patient data handling follows our Privacy Policy and operational security practices.",
  },
  {
    title: "8. Availability",
    text: "We aim for reliable service but cannot guarantee uninterrupted availability. Scheduled maintenance and occasional disruptions may occur.",
  },
  {
    title: "9. Limitation of liability",
    text: "To the maximum extent allowed by law, MedAlerto is not liable for indirect, incidental, or consequential damages from platform use.",
  },
  {
    title: "10. Suspension and termination",
    text: "We may suspend or terminate accounts for policy violations, legal risks, security threats, or non-payment.",
  },
  {
    title: "11. Changes",
    text: "We may update these Terms as product and legal requirements evolve. Updated terms become effective on publication unless otherwise stated.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Legal</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Terms of Service</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              These terms define service boundaries, account responsibilities, and usage rules for all MedAlerto users.
            </p>
          </section>

          <div className="mt-10 space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
                <h2 className="font-heading text-2xl font-semibold">{section.title}</h2>
                {section.text ? <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">{section.text}</p> : null}
                {section.bullets ? (
                  <ul className="mt-4 space-y-3">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/55 p-5 text-sm text-[var(--color-text-secondary)]">
            <p>Effective date: April 7, 2026</p>
            <p className="mt-2">Legal contact: legal@medalerto.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
