import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo-compact.webp";
import doc from "../assets/doc-hero.webp";

const features = [
  {
    icon: "📋",
    title: "Digital Prescriptions",
    description:
      "Create and send prescriptions instantly as PDFs via WhatsApp. No more lost or damaged paper prescriptions.",
  },
  {
    icon: "💊",
    title: "Medicine Alternatives",
    description:
      "Find alternative medicines by the same salt composition when your prescribed brand is unavailable.",
  },
  {
    icon: "📅",
    title: "Smart Appointments",
    description:
      "Schedule follow-ups with automatic WhatsApp confirmations. Reduce no-shows with intelligent reminders.",
  },
  {
    icon: "🏥",
    title: "Patient History",
    description:
      "Access complete patient records and visit history instantly. Make informed decisions every time.",
  },
  {
    icon: "🚨",
    title: "Emergency Management",
    description:
      "Cancel a range of appointments with one click in emergencies. Patients are notified automatically.",
  },
  {
    icon: "📊",
    title: "Practice Insights",
    description:
      "Track monthly earnings, patient activity, and clinic performance without any extra effort.",
  },
];

const stats = [
  { value: "10x", label: "Faster Prescriptions" },
  { value: "Zero", label: "Lost Prescriptions" },
  { value: "100%", label: "WhatsApp Delivery" },
  { value: "24/7", label: "Patient Records Access" },
];

const footerLinks = {
  Product: ["Features", "How it Works", "Pricing"],
  Company: ["About Us"],
  Support: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"],
  Integrations: ["WhatsApp", "PDF Export", "Drug Database", "SMS Alerts"],
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBaseClass = scrolled
    ? "border-b bg-[var(--color-card)]/95 shadow-sm backdrop-blur"
    : "border-b border-transparent bg-[var(--color-card)]/80";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <nav className={`fixed left-0 right-0 top-0 z-50 transition ${navBaseClass}`}>
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-8 lg:px-10 xl:px-14">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MedAlerto Logo" className="h-8 w-auto" />
            <p className="text-sm font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-base">MedAlerto</p>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">Features</a>
            <a href="#stats" className="text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">Why MedAlerto</a>
            <a href="#contact" className="text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">Contact</a>
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Create Account
            </button>
          </div>

          <button
            type="button"
            className="rounded-xl border p-2 text-[var(--color-text-primary)] md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <div className="space-y-1">
              <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t bg-[var(--color-card)] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm font-semibold text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#stats" className="text-sm font-semibold text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>Why MedAlerto</a>
              <a href="#contact" className="text-sm font-semibold text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>Contact</a>
              <button
                onClick={() => {
                  navigate("/login");
                  setMenuOpen(false);
                }}
                className="rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate("/signup");
                  setMenuOpen(false);
                }}
                className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden border-b pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/8 via-transparent to-[var(--color-primary)]/5" />
        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-8">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)]">
              Built for modern clinics
            </div>

            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Doctor workflow,
              <span className="block text-[var(--color-primary)]">without the friction.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              MedAlerto helps you manage prescriptions, appointments, and patient history in one clean interface so you can focus on better care.
            </p>

            <div className="flex flex-wrap gap-6">
              {[["500+", "Doctors"], ["50k+", "Patients"], ["99%", "Satisfaction"]].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-[var(--color-primary)]">{value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/signup")}
                className="w-full rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
              >
                Create Your Free Account
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:w-auto"
              >
                Sign In to Dashboard
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-xl border bg-[var(--color-card)] p-4 shadow-sm sm:p-6">
              <div className="overflow-hidden rounded-xl border">
                <img src={doc} alt="Doctor using MedAlerto dashboard" className="h-100 w-full object-cover sm:h-96 md:h-[620px]" />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-[var(--color-bg)] p-3">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Active doctors</p>
                  <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">5000+ using now</p>
                </div>
                <div className="rounded-xl border bg-[var(--color-bg)] p-3">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Prescription delivery</p>
                  <p className="mt-2 text-sm font-bold text-[var(--color-success)]">WhatsApp enabled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="border-b bg-[var(--color-card)] py-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="rounded-xl border bg-[var(--color-bg)] p-4 text-center">
              <p className="text-3xl font-extrabold text-[var(--color-primary)]">{value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-8 sm:py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">What we provide</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Built for daily clinical operations</h2>
            <p className="mt-4 text-base text-[var(--color-text-secondary)]">
              Every core workflow from prescription creation to patient follow-ups is designed to reduce manual effort.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon, title, description }) => (
              <article key={title} className="rounded-xl border bg-[var(--color-card)] p-6 shadow-sm">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-xl">
                  {icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-card)] py-8 sm:py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border bg-[var(--color-bg)] p-8 text-center sm:p-8">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to modernize your clinic?</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[var(--color-text-secondary)]">
              Join doctors using MedAlerto to save time, reduce mistakes, and keep every patient record in one place.
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="mt-6 rounded-xl bg-[var(--color-primary)] px-8 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Create Your Free Account
            </button>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t bg-[var(--color-card)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <img src={logo} alt="MedAlerto Logo" className="h-8 w-auto" />
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Trusted clinic management for doctors who value reliable and clear patient communication.
              </p>
            </div>

            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{category}</h4>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border bg-[var(--color-bg)] p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-bold">Stay updated with MedAlerto</h4>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Get product updates and release notes in your inbox.</p>
              </div>
              <div className="flex w-full gap-3 sm:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border bg-[var(--color-card)] px-4 py-2 text-sm outline-none focus:border-[var(--color-primary)] sm:w-64"
                />
                <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white">Subscribe</button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-[var(--color-text-secondary)] sm:flex-row sm:px-6 lg:px-8">
            <p>© 2026 MedAlerto. All rights reserved. Built for doctors who care.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <a key={item} href="#" className="transition hover:text-[var(--color-primary)]">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}