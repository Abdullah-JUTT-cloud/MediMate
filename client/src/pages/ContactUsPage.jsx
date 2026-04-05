import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const channels = [
  {
    title: "General and technical support",
    description: "Questions about account access, prescriptions, appointments, or daily product usage.",
    contactLabel: "support@medalerto.com",
    contactHref: "mailto:support@medalerto.com",
    meta: "Typical response: within 4 business hours",
  },
  {
    title: "WhatsApp assistance",
    description: "Fast help for onboarding, setup walkthroughs, and urgent workflow questions during clinic hours.",
    contactLabel: "Start WhatsApp chat",
    contactHref: "https://wa.me/923195490028?text=Hello%20MedAlerto%20Support%2C%20I%20need%20assistance%20with%20...",
    meta: "Typical response: same business day",
  },
  {
    title: "Privacy and data requests",
    description: "Questions related to personal data handling, retention requests, and account-level privacy concerns.",
    contactLabel: "privacy@medalerto.com",
    contactHref: "mailto:privacy@medalerto.com",
    meta: "Typical response: within 2 business days",
  },
];

export default function ContactUsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Support</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Get in touch with the MedAlerto team</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Whether you need onboarding guidance, product support, or policy clarification, our team is available to help your clinic operate without interruption.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {channels.map((channel) => (
              <section key={channel.title} className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)]">
                <h2 className="font-heading text-xl font-semibold">{channel.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{channel.description}</p>
                <a
                  href={channel.contactHref}
                  target={channel.contactHref.startsWith("https") ? "_blank" : undefined}
                  rel={channel.contactHref.startsWith("https") ? "noopener noreferrer" : undefined}
                  className="mt-5 inline-block text-base font-bold text-[var(--color-primary)] hover:underline"
                >
                  {channel.contactLabel}
                </a>
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">{channel.meta}</p>
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Before you contact us</h2>
            <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
              To help us resolve your request quickly, include your clinic name, registered phone number, and a short description of the issue.
              If possible, attach screenshots and the exact time the issue occurred.
            </p>
          </section>

          <p className="mt-8 text-sm text-[var(--color-text-secondary)]">
            Support hours: Monday to Saturday, 9:00 AM to 7:00 PM (PKT).
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
