import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. Scope",
    text: "This policy explains how MedAlerto collects, uses, stores, and protects information when independent doctors, specialists, and small clinic teams use the platform.",
  },
  {
    title: "2. Information we collect",
    bullets: [
      "Account details such as name, clinic name, email, and phone number",
      "Operational data such as appointments, prescriptions, and consultation notes",
      "Technical and security logs needed to keep the service stable and secure",
      "Billing metadata from payment processing partners",
    ],
  },
  {
    title: "3. How we use information",
    bullets: [
      "Provide core clinic workflow features",
      "Generate and deliver prescription documents",
      "Send communication and reminder workflows",
      "Improve reliability, performance, and support response",
      "Meet legal and compliance obligations",
    ],
  },
  {
    title: "4. Data sharing",
    text: "MedAlerto does not sell personal or clinical data. We only share data with service providers required to operate the platform under contractual confidentiality and security obligations.",
  },
  {
    title: "5. Security safeguards",
    text: "We apply encryption in transit, controlled infrastructure access, and role-based operational practices to reduce unauthorized access risk.",
  },
  {
    title: "6. Data retention",
    text: "Data is retained for as long as needed to provide service, maintain records, meet legal obligations, and resolve disputes, subject to applicable laws.",
  },
  {
    title: "7. Your rights",
    text: "Authorized account owners may request access, correction, export, or deletion of eligible account data, subject to legal and operational constraints.",
  },
  {
    title: "8. International processing",
    text: "Some infrastructure providers may process data in multiple regions. We select providers that support responsible data handling and security controls.",
  },
  {
    title: "9. Policy updates",
    text: "We may update this policy when product behavior, legal requirements, or security practices change. The latest effective date is always shown on this page.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Legal</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Privacy Policy</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Protecting clinic and patient information is core to how MedAlerto operates.
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
            <p className="mt-2">Privacy contact: privacy@medalerto.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
