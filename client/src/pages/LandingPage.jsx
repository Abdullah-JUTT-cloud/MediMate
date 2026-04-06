import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import doc from "../assets/doc-hero.webp";

const features = [
  {
    number: "01",
    title: "Digital Prescriptions",
    description:
      "Create and send prescriptions instantly as PDFs via WhatsApp. No more lost or damaged paper prescriptions.",
    tag: "Core workflow",
    impact: "Faster handoff",
  },
  {
    number: "02",
    title: "Medicine Alternatives",
    description:
      "Find alternative medicines by the same salt composition when your prescribed brand is unavailable.",
    tag: "Clinical continuity",
    impact: "Fewer treatment delays",
  },
  {
    number: "03",
    title: "Smart Appointments",
    description:
      "Schedule follow-ups with automatic WhatsApp confirmations. Reduce no-shows with intelligent reminders.",
    tag: "Daily operations",
    impact: "Better attendance",
  },
  {
    number: "04",
    title: "Patient History",
    description:
      "Access complete patient records and visit history instantly. Make informed decisions every time.",
    tag: "Record quality",
    impact: "Safer decisions",
  },
  {
    number: "05",
    title: "Emergency Management",
    description:
      "Cancel a range of appointments with one click in emergencies. Patients are notified automatically.",
    tag: "Important feature",
    impact: "Rapid patient updates",
  },
  {
    number: "06",
    title: "Practice Insights",
    description:
      "Track monthly earnings, patient activity, and clinic performance without any extra effort.",
    tag: "Growth visibility",
    impact: "Clearer planning",
  },
  {
    number: "07",
    title: "Patient Chat",
    description:
      "Keep patient communication in one thread with attachments and voice notes for post-visit clarity.",
    tag: "Communication",
    impact: "Fewer follow-up misunderstandings",
  },
  {
    number: "08",
    title: "Support Center",
    description:
      "Raise issues, track status, and continue conversations with support directly from your dashboard.",
    tag: "Reliability",
    impact: "Faster resolution time",
  },
  {
    number: "09",
    title: "Secure Access Control",
    description:
      "Use role-aware access and structured account controls to keep clinic and patient data protected.",
    tag: "Security",
    impact: "Stronger data confidence",
  },
];

const stats = [
  { value: "10x", label: "Faster prescriptions" },
  { value: "Zero", label: "Lost prescriptions" },
  { value: "100%", label: "WhatsApp delivery" },
  { value: "24/7", label: "Patient records access" },
];

const trustSignals = [
  "Independent doctors",
  "Specialist clinics",
  "Role-based access",
  "Patient chat support",
  "Emergency bulk cancel",
  "Audit-friendly records",
  "Clinic-hour support",
];

const flowSteps = [
  {
    step: "01",
    title: "Morning setup",
    text: "Open the day with a clear appointment queue and active follow-up list.",
  },
  {
    step: "02",
    title: "Consultation workflow",
    text: "Capture notes, generate prescriptions, and send patient-ready instructions instantly.",
  },
  {
    step: "03",
    title: "Patient communication",
    text: "Use built-in chat and reminders to keep post-visit communication organized.",
  },
  {
    step: "04",
    title: "Operational control",
    text: "Track outcomes, monitor load, and handle emergency schedule changes in one place.",
  },
];

const testimonials = [
  {
    quote:
      "We reduced front-desk follow-up calls significantly because reminders and prescription delivery are now consistent.",
    author: "Dr. Hina A.",
    role: "Dermatology Clinic, Lahore",
    metric: "-42% manual follow-up calls",
  },
  {
    quote:
      "The emergency bulk cancel button saved us during an unplanned closure. Patients were informed quickly without chaos.",
    author: "Dr. Faraz K.",
    role: "General Practice, Karachi",
    metric: "120+ appointments updated in minutes",
  },
  {
    quote:
      "We finally have one reliable view of patient history, prescriptions, and chat. Decision-making is much faster now.",
    author: "Dr. Sana M.",
    role: "Internal Medicine, Islamabad",
    metric: "10x faster record retrieval",
  },
  {
    quote:
      "Our reception team now handles scheduling changes without confusion, and patients get updates immediately.",
    author: "Dr. Kamran T.",
    role: "Family Clinic, Faisalabad",
    metric: "-35% front-desk call volume",
  },
  {
    quote:
      "Prescription turnaround is much faster now. We complete visits without asking patients to wait for paperwork.",
    author: "Dr. Ayesha R.",
    role: "General Practice, Multan",
    metric: "3x faster prescription handoff",
  },
  {
    quote:
      "The reminders improved follow-up attendance in just a few weeks and reduced missed continuity visits.",
    author: "Dr. Bilal N.",
    role: "Cardiac Clinic, Rawalpindi",
    metric: "+28% follow-up attendance",
  },
  {
    quote:
      "Patient chat helped us reduce unclear post-visit instructions and avoid repeat clarification calls.",
    author: "Dr. Mahnoor S.",
    role: "Pediatrics, Lahore",
    metric: "-31% post-visit clarification calls",
  },
  {
    quote:
      "We no longer depend on scattered notes. Every visit detail is available when the patient returns.",
    author: "Dr. Waqas H.",
    role: "Orthopedic Practice, Karachi",
    metric: "Consistent records across visits",
  },
  {
    quote:
      "The dashboard makes daily load obvious. We plan staff shifts better and avoid peak-hour bottlenecks.",
    author: "Dr. Nadia F.",
    role: "Multi-Doctor Clinic, Islamabad",
    metric: "Smoother daily throughput",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-page min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden bg-[var(--color-bg)] pt-28 sm:pt-32">
          <div
            aria-hidden="true"
            className="absolute -left-24 top-8 h-80 w-80 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[var(--color-primary)]/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 top-16 h-96 w-96 rounded-[58%_42%_56%_44%/44%_58%_42%_56%] bg-[var(--color-secondary)]/18 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-6 top-10 h-px bg-[var(--color-border)]/50"
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 pb-20 sm:px-6 lg:px-8 xl:pb-28">
            <div className="col-span-12 flex flex-col justify-between xl:col-span-6">
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-[var(--color-secondary)]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--color-text-secondary)] sm:text-[10px] sm:tracking-[0.35em]">Organic workflow system</p>
              </div>

              <h1
                className="mt-8 max-w-[12ch] text-[2.45rem] font-heading font-semibold leading-[0.95] tracking-[-0.03em] text-balance sm:max-w-3xl sm:text-6xl sm:tracking-normal lg:text-7xl xl:text-8xl"
              >
                <span className="block">Doctor workflow,</span>
                <span className="block">softened with</span>
                <span className="block">
                  <span className="italic text-[var(--color-secondary)]">quiet care</span>.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[0.94rem] leading-relaxed text-[var(--color-text-secondary)] sm:mt-8 sm:text-lg">
                MedAlerto brings prescriptions, appointments, patient records, and follow-ups into one calm interface so clinics can move with less friction and more confidence.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-6 font-body text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(93,112,82,0.3)] active:translate-y-0 active:shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] sm:w-auto sm:px-8 motion-reduce:transition-none"
                >
                  <span className="absolute inset-0 bg-[var(--color-secondary)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10">Create Your Free Account</span>
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[var(--color-secondary)] bg-[var(--color-card)]/65 px-6 font-body text-sm font-bold text-[var(--color-secondary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 hover:shadow-[0_10px_28px_-14px_rgba(193,140,93,0.3)] active:translate-y-0 sm:w-auto sm:px-8 motion-reduce:transition-none"
                >
                  Sign In to Dashboard
                </button>
              </div>

              <div className="mt-9 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(({ value, label }) => (
                  <div key={label} className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-card)] px-4 py-4 text-left shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(193,140,93,0.2)]">
                    <p className="font-heading text-3xl leading-none text-[var(--color-primary)] sm:text-4xl">
                      {value}
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-secondary)]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 xl:col-span-5 xl:col-start-8">
              <div className="group relative mx-auto w-full max-w-2xl">
                <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[var(--color-accent)] blur-2xl xl:block" aria-hidden="true" />
                <div className="absolute -bottom-8 right-8 h-28 w-28 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/15 blur-2xl" aria-hidden="true" />

                <div className="relative overflow-hidden rounded-[60%_40%_30%_70%/60%_30%_70%_40%] border-4 border-white/85 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.18)]">
                  <img
                    src={doc}
                    alt="Doctor portrait used to represent MedAlerto"
                    className="aspect-4/5 w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(253,252,248,0.35),transparent_48%)]" />
                </div>
                <div className="absolute left-4 top-10 -translate-y-1/2 rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)]/92 px-3 py-2 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] backdrop-blur-md sm:left-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-primary)] sm:text-[10px] sm:tracking-[0.25em]">Trusted by 5,000+ doctors</p>
                </div>

                <div className="absolute bottom-8 right-8 translate-y-1/2 rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/95 px-3 py-2 shadow-[0_4px_20px_-2px_rgba(193,140,93,0.14)] backdrop-blur-md sm:right-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-text-primary)] sm:text-[10px] sm:tracking-[0.25em]">Prescription sent via WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg-soft)]/35 py-24 sm:py-28 xl:py-32">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 xl:col-span-6 xl:col-start-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">What the platform handles</p>
                <h2
                  className="mt-6 max-w-3xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl lg:text-6xl"
                >
                  Every critical workflow, <span className="italic text-[var(--color-secondary)]">shaped</span> with gentle clarity.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:leading-[0.8] first-letter:font-heading first-letter:font-semibold first-letter:text-[var(--color-primary)]">
                  MedAlerto reduces the manual noise around prescriptions, scheduling, and patient tracking. The result is a calmer workflow that still moves fast when the clinic needs it.
                </p>
                <div className="mt-6 inline-flex rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)] px-4 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-primary)]">{features.length} operational capabilities</span>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {features.map(({ number, title, description, tag, impact }, index) => (
                <article
                  key={title}
                  className={`group rounded-[2.25rem] border border-[var(--color-border)]/60 bg-[var(--color-card)] p-8 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(93,112,82,0.2)] motion-reduce:transition-none ${index === 0 ? "xl:col-span-2" : ""}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-muted)]">{number}</p>
                    <span className="mt-1 h-px w-12 bg-[var(--color-border)] transition duration-300 group-hover:bg-[var(--color-secondary)]" />
                  </div>
                  <p className="mt-6 inline-flex rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                    {tag}
                  </p>
                  <h3 className="mt-10 text-2xl font-heading font-semibold leading-tight text-[var(--color-text-primary)]">
                    {title}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
                  <div className="mt-6 border-t border-[var(--color-border)]/70 pt-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
                      Outcome: {impact}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg)] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-5 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-secondary)]">Built for real clinic conditions</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {trustSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--color-text-secondary)]"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg-soft)]/35 py-24 sm:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 xl:col-span-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">How clinics use it daily</p>
                <h2 className="mt-6 max-w-xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl">
                  A calmer day from <span className="italic text-[var(--color-secondary)]">first patient</span> to close.
                </h2>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)]">
                  MedAlerto is designed to match real outpatient pace: fast consultations, reliable communication, and stronger operational control when unexpected situations appear.
                </p>
              </div>
              <div className="col-span-12 xl:col-span-7">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {flowSteps.map((item) => (
                    <article key={item.step} className="rounded-3xl border border-[var(--color-border)]/70 bg-[var(--color-card)] p-5 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)]">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-primary)]">{item.step}</p>
                      <h3 className="mt-3 text-xl font-heading font-semibold">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg)] py-24 sm:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">Clinic feedback</p>
                <h2 className="mt-4 max-w-2xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl">
                  Trusted by doctors who run high-pressure days.
                </h2>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-secondary)] bg-[var(--color-card)] px-5 text-sm font-bold text-[var(--color-secondary)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-secondary)]/10"
              >
                View Pricing
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {testimonials.map((item) => (
                <article key={item.author} className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)]">
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">“{item.quote}”</p>
                  <div className="mt-5 border-t border-[var(--color-border)]/80 pt-4">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{item.author}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{item.role}</p>
                    <p className="mt-3 inline-flex rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                      {item.metric}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-[var(--color-border)]/60 bg-[var(--color-primary)] py-24 text-[var(--color-on-primary)] sm:py-28 xl:py-32">
          <div
            aria-hidden="true"
            className="absolute -left-16 top-8 h-72 w-72 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/18 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-80 w-80 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-secondary)]/18 blur-3xl"
          />
          <div className="relative mx-auto grid w-full max-w-7xl grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
            <div className="col-span-12 xl:col-span-7 xl:col-start-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-accent)]">Closing note</p>
              <h2
                className="mt-6 max-w-4xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl lg:text-6xl"
              >
                Ready to modernize the clinic with a softer kind of structure?
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-on-primary)]/80">
                Join doctors using MedAlerto to save time, reduce mistakes, and keep every patient record in one place.
              </p>
            </div>

            <div className="col-span-12 flex items-end xl:col-span-3 xl:col-start-10">
              <button
                onClick={() => navigate("/signup")}
                className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-[var(--color-on-primary)]/40 bg-[var(--color-on-primary)] px-8 font-body text-sm font-bold text-[var(--color-primary)] shadow-[0_4px_20px_-2px_rgba(243,244,241,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-bg-soft)] hover:shadow-[0_10px_28px_-14px_rgba(243,244,241,0.24)] active:translate-y-0 motion-reduce:transition-none"
              >
                <span className="absolute inset-0 bg-[var(--color-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10">Create Your Free Account</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
