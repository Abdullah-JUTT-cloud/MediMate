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
    <div className="relative min-h-screen overflow-hidden bg-[#FDFCF8] text-[#2C2C24]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[#E6DCCD]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[#5D7052]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5D7052]">Legal</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Cookie Policy</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#78786C]">
            This Cookie Policy explains what cookies are, how MedAlerto uses them, and what controls you have over cookie behavior while using our website and clinic platform.
          </p>

          <div className="mt-12 space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
                <h2 className="font-heading text-2xl font-semibold">{section.title}</h2>
                <p className="mt-4 leading-relaxed text-[#78786C]">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 border-t border-[#DED8CF]/80 pt-4 text-sm text-[#78786C]">
            <p>Effective date: April 1, 2026</p>
            <p className="mt-2">Cookie support contact: support@medalerto.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
