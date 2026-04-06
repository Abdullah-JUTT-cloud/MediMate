import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const channels = [
  {
    title: "General inquiries",
    description: "Product questions, demos, and onboarding requests.",
    contactLabel: "hello@medalerto.com",
    contactHref: "mailto:hello@medalerto.com",
    meta: "Response target: within 1 business day",
  },
  {
    title: "Support and technical help",
    description: "Account, usage, billing, and operational issues.",
    contactLabel: "support@medalerto.com",
    contactHref: "mailto:support@medalerto.com",
    meta: "Response target: same business day",
  },
  {
    title: "Phone",
    description: "For urgent clinic-side operational concerns during business hours.",
    contactLabel: "+92 319 5490028",
    contactHref: "tel:+923195490028",
    meta: "Mon-Fri, 9:00 AM - 6:00 PM (PKT)",
  },
  {
    title: "WhatsApp",
    description: "Quick setup and usage guidance from the support team.",
    contactLabel: "Open WhatsApp",
    contactHref: "https://wa.me/923195490028?text=Hello%20MedAlerto%20team%2C%20I%20need%20help%20with%20...",
    meta: "Fast responses in business hours",
  },
];

const notes = [
  "Include clinic name and registered email in your message",
  "Share screenshots for faster troubleshooting",
  "Mention urgency if your consultation workflow is blocked",
];

export default function ContactUsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Contact</p>
            <h1 className="mt-4 max-w-4xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">Talk to the MedAlerto team.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              If you need product guidance, support, or policy clarification, we respond with direct and practical help.
            </p>
          </section>

          <section className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {channels.map((channel) => (
              <article key={channel.title} className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-7">
                <h2 className="font-heading text-2xl font-semibold">{channel.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{channel.description}</p>
                <a
                  href={channel.contactHref}
                  target={channel.contactHref.startsWith("https") ? "_blank" : undefined}
                  rel={channel.contactHref.startsWith("https") ? "noopener noreferrer" : undefined}
                  className="mt-5 inline-flex rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15"
                >
                  {channel.contactLabel}
                </a>
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">{channel.meta}</p>
              </article>
            ))}
          </section>

          <section className="mt-12 grid gap-5 lg:grid-cols-12">
            <article className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8 lg:col-span-7">
              <h2 className="font-heading text-2xl font-semibold">Before you reach out</h2>
              <ul className="mt-4 space-y-3">
                {notes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-primary)] p-6 text-[var(--color-on-primary)] shadow-[0_12px_34px_-16px_rgba(93,112,82,0.5)] sm:p-8 lg:col-span-5">
              <h2 className="font-heading text-2xl font-semibold">Business hours</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-on-primary)]/85">Monday to Friday: 9:00 AM - 6:00 PM (PKT)</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-on-primary)]/85">Saturday: 10:00 AM - 3:00 PM (PKT)</p>
              <p className="mt-5 text-sm leading-relaxed text-[var(--color-on-primary)]/85">We prioritize clinic-impacting issues first and keep communication transparent until resolved.</p>
            </article>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
