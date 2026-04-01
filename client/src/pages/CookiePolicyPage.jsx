import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. What are cookies",
    content:
      "Cookies are small text files stored in your browser that help websites remember settings, improve performance, and provide a smoother experience across visits.",
  },
  {
    title: "2. How MedAlerto uses cookies",
    content:
      "MedAlerto uses cookies and similar storage to keep doctors signed in, remember interface preferences such as theme, protect sessions, and improve reliability of dashboard and public pages.",
  },
  {
    title: "3. Types of cookies we use",
    content:
      "We use essential cookies (required for login and core navigation), preference cookies (for UI settings), and limited analytics/performance cookies to understand usage patterns and maintain stable product performance.",
  },
  {
    title: "4. Third-party cookies",
    content:
      "Some third-party services integrated with MedAlerto (such as communication or hosting providers) may set their own cookies according to their policies. We only use providers needed for platform operation.",
  },
  {
    title: "5. Managing your cookie preferences",
    content:
      "You can control cookies through your browser settings, including blocking or deleting stored cookies. Please note that disabling essential cookies may affect sign-in, security checks, and key platform features.",
  },
  {
    title: "6. Data and retention",
    content:
      "Cookie-related identifiers are retained only as long as needed for security, user experience, and service continuity, subject to legal and operational requirements.",
  },
  {
    title: "7. Updates to this policy",
    content:
      "We may update this Cookie Policy when product behavior, legal requirements, or service providers change. The latest version and effective date will always be published on this page.",
  },
  {
    title: "8. Contact",
    content:
      "If you have questions about cookie usage or browser controls, contact our support team through the Contact page or email support@medalerto.com.",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Legal</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Cookie Policy</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            This Cookie Policy explains what cookies are, how MedAlerto uses them, and what controls you have over cookie behavior while using our website and clinic platform.
          </p>

          <div className="mt-12 space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 border-t pt-4 text-sm text-[var(--color-text-secondary)]">
            <p>Effective date: April 1, 2026</p>
            <p className="mt-2">Cookie support contact: support@medalerto.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
