import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const painPoints = [
  "Patient details scattered across loose paper files and WhatsApp chats.",
  "Manual reminder calling consuming front-desk hours daily.",
  "Unreadable or missing prescription history during follow-ups.",
  "Zero real-time visibility into net revenue, discounts, and daily clinic load.",
];

const solutions = [
  "Structured Patient History",
  "Automated WhatsApp Queue Reminders",
  "Zero-Egress Prescription PDFs",
  "Real-Time Revenue Audit",
];

const principles = [
  {
    title: "Practical Over Complex",
    description: "If a feature slows down consultation speed by even 5 seconds, we redesign it until it's instant.",
  },
  {
    title: "Doctor-First Clarity",
    description: "Every screen is engineered to help the practitioner make quick clinical decisions without distraction.",
  },
  {
    title: "Team-Ready Operations",
    description: "Receptionists, assistants, and doctors work from a unified live queue without administrative overlap.",
  },
  {
    title: "Responsible Data Handling",
    description: "Patient information is treated as a critical clinical responsibility backed by encrypted cloud storage.",
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="border-b border-slate-200 pb-12 dark:border-slate-800 sm:pb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.2em] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-emerald-600 ring-2 ring-emerald-200 dark:bg-emerald-400 dark:ring-emerald-900" />
              OUR MISSION
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Make daily clinic operations more reliable, transparent, and effortless.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">
              MedAlerto is built specifically for independent doctors, specialists, and outpatient clinics. We build high-speed operational systems without enterprise complexity.
            </p>
          </section>

          <section aria-labelledby="matrix-heading" className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <h2 id="matrix-heading" className="sr-only">The problem and the solution</h2>
            <article className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20 sm:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-rose-900 dark:text-rose-300"><span aria-hidden="true">⚠</span> What is Broken in Small-Clinic Operations</h3>
              <ul className="space-y-4">
                {painPoints.map((item) => <li key={item} className="flex items-start gap-3 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200"><span aria-hidden="true" className="mt-0.5 text-base text-rose-700 dark:text-rose-300">❌</span><span>{item}</span></li>)}
              </ul>
            </article>

            <article className="rounded-3xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm dark:border-teal-900/60 dark:bg-teal-950/20 sm:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-teal-900 dark:text-teal-300"><span aria-hidden="true">✦</span> Why MedAlerto Exists</h3>
              <div className="space-y-2.5">
                {solutions.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border border-teal-300 bg-white p-3.5 text-sm font-bold text-slate-900 shadow-xs dark:border-teal-800 dark:bg-slate-900 dark:text-white"><span aria-hidden="true" className="text-teal-700 dark:text-teal-300">✓</span>{item}</div>)}
              </div>
            </article>
          </section>

          <section className="my-8" aria-labelledby="principles-heading">
            <div className="mb-4 flex items-end justify-between gap-4"><div><p className="font-mono text-xs font-bold tracking-[0.18em] text-teal-700 dark:text-teal-300">HOW WE BUILD</p><h2 id="principles-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Operational principles</h2></div></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {principles.map((item, index) => <article key={item.title} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="mb-4 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">0{index + 1}</div><h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3><p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">{item.description}</p></article>)}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 text-white shadow-2xl sm:p-12">
            <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="relative"><p className="inline-flex rounded-full border border-teal-400/50 bg-teal-400/10 px-3 py-1 font-mono text-[11px] font-bold tracking-[0.18em] text-teal-200">THE FUTURE OF OUTPATIENT CARE</p><h2 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">A future where every independent clinic runs with structured systems, dependable communication, and total financial visibility.</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-200">We are not building bloated enterprise hospital software. We build clean, reliable tools for real doctors managing real clinics every day.</p></div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
