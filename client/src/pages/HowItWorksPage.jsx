import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    title: "Set up your clinic profile",
    description:
      "Configure your doctor profile, prescription format, and clinic communication preferences so every document is standardized from day one.",
  },
  {
    title: "Register or retrieve patient records",
    description:
      "Search existing patients by contact details or add a new patient in seconds with a consistent record structure for future visits.",
  },
  {
    title: "Document consultation and treatment",
    description:
      "Create digital prescriptions, record key findings, and attach follow-up notes within the consultation workflow.",
  },
  {
    title: "Deliver instantly to the patient",
    description:
      "Generate PDF prescriptions and send them on WhatsApp directly from the platform to improve handoff reliability.",
  },
  {
    title: "Schedule follow-up and automate reminders",
    description:
      "Book the next visit before the patient leaves and let MedAlerto handle confirmations and reminder messages automatically.",
  },
  {
    title: "Review performance and improve operations",
    description:
      "Use appointment and earning insights to identify bottlenecks, optimize clinic schedules, and improve overall service quality.",
  },
];

const implementation = [
  {
    title: "Day 1: onboarding",
    text: "Initial account setup, branding preferences, and core clinic workflow configuration.",
  },
  {
    title: "Week 1: adoption",
    text: "Daily usage for prescriptions, appointments, and patient history with support for process alignment.",
  },
  {
    title: "Week 2 onward: optimization",
    text: "Use insights and reminders to reduce no-shows, increase operational predictability, and standardize communication.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDFCF8] text-[#2C2C24]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[#E6DCCD]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[#5D7052]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5D7052]">Workflow overview</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">A complete clinic workflow in one system</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#78786C]">
            From first consultation to follow-up reminders, MedAlerto keeps every step connected so doctors can spend less time on admin and more time on care.
          </p>

          <div className="mt-12 space-y-6">
            {steps.map((step, index) => (
              <section key={step.title} className="flex flex-col gap-5 rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:flex-row sm:items-start sm:gap-7 sm:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#5D7052] bg-[#5D7052] text-lg font-bold text-[#F3F4F1]">
                  {index + 1}
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-semibold">{step.title}</h2>
                  <p className="mt-3 leading-relaxed text-[#78786C]">
                    {step.description}
                  </p>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Implementation timeline</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {implementation.map((item) => (
                <article key={item.title} className="rounded-3xl border border-[#DED8CF]/80 bg-[#F0EBE5]/45 p-4">
                  <h3 className="text-base font-bold text-[#2C2C24]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#78786C]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Built for real clinic conditions</h2>
            <p className="mt-4 leading-relaxed text-[#78786C]">
              MedAlerto is designed for fast-paced outpatient settings where consistency, speed, and communication quality directly
              affect patient satisfaction and daily clinic outcomes.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
