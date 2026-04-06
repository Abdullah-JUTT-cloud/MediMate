import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. What cookies are",
    text: "Cookies are small browser files that store limited information to improve sign-in reliability, user experience, and platform security.",
  },
  {
    title: "2. How MedAlerto uses cookies",
    bullets: [
      "Keep users signed in securely",
      "Remember essential interface preferences",
      "Protect account sessions",
      "Measure performance and reliability",
    ],
  },
  {
    title: "3. Cookie types",
    bullets: [
      "Essential cookies for authentication and secure access",
      "Preference cookies for UI settings",
      "Performance cookies for product stability and diagnostics",
    ],
  },
  {
    title: "4. Third-party cookies",
    text: "Some integrated providers may place cookies required for infrastructure, communication, or analytics operations. We only use providers needed for service delivery.",
  },
  {
    title: "5. Managing cookies",
    text: "You can manage cookies from your browser settings. Blocking essential cookies may limit login, session security, and core product functionality.",
  },
  {
    title: "6. Retention",
    text: "Cookie identifiers are retained only for periods required by security, service continuity, and legal obligations.",
  },
  {
    title: "7. Updates",
    text: "This policy may be updated when product behavior, regulations, or service providers change.",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Legal</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Cookie Policy</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              This page explains how MedAlerto uses cookies and what control you have over cookie behavior.
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
            <p className="mt-2">Cookie policy contact: support@medalerto.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
