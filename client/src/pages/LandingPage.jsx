import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

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

          <div className="relative mx-auto w-full max-w-[480px]">
            <div className="pointer-events-none absolute -inset-6 rounded-[2.2rem] bg-gradient-to-br from-slate-900 via-sky-900 to-teal-700 opacity-95" />

            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/35 shadow-[0_35px_90px_-40px_rgba(13,148,136,0.8)]">
              <img
                src={doc}
                alt="Doctor using MedAlerto dashboard"
                className="h-[540px] w-full object-cover object-center sm:h-[560px]"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />

              <div className="absolute left-4 top-4 rounded-xl border border-cyan-400/45 bg-slate-900/75 px-3 py-2 backdrop-blur-sm sm:left-5 sm:top-5">
                <p className="text-xs font-semibold text-cyan-200">✓ 5000+ Doctors Currently Using</p>
              </div>

              <div className="absolute bottom-4 right-4 rounded-xl border border-slate-300/20 bg-slate-900/75 px-3 py-2 backdrop-blur-sm sm:bottom-5 sm:right-5">
                <p className="text-xs font-semibold text-slate-100">📋 Prescription Sent via WhatsApp</p>
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

      <Footer />
    </div>
  );
}