import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const principles = [
  {
    title: "Clinical-first design",
    description: "Every feature is designed around real consultation flow, not generic enterprise dashboards.",
  },
  {
    title: "Reliable communication",
    description: "Patient instructions must arrive clearly and on time, especially after the consultation ends.",
  },
  {
    title: "Operational simplicity",
    description: "Doctors and clinic staff should be able to adopt the system quickly without heavy training.",
  },
  {
    title: "Data responsibility",
    description: "Clinical and patient records are handled with strict confidentiality and practical safeguards.",
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Company</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Building dependable software for modern clinics</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            MedAlerto was created to help doctors and clinic teams replace fragmented manual processes with a reliable digital workflow
            for prescriptions, appointments, and patient communication.
          </p>

          <div className="mt-12 space-y-6">
            <section className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Why MedAlerto exists</h2>
              <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
                Many clinical tools are built for large institutions and do not match the pace or needs of independent practices.
                We focus on the core workflows that matter most in outpatient care: fast documentation, clear patient handoff, and predictable scheduling.
              </p>
            </section>

            <section className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Who we serve</h2>
              <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
                MedAlerto is built for independent doctors, specialists, and clinic operators who need a practical platform that improves
                service quality without introducing heavy administrative overhead.
              </p>
            </section>

            <section className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Our mission</h2>
              <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
                To help clinics deliver better patient experiences through clearer records, faster operations, and more reliable communication.
              </p>
            </section>

            <section className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Our operating principles</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {principles.map((item) => (
                  <article key={item.title} className="rounded-xl border bg-[var(--color-bg)] p-4">
                    <h3 className="text-base font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Looking ahead</h2>
              <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
                We continue to improve MedAlerto with direct input from doctors and clinic staff, ensuring every release solves a real operational problem and preserves a fast, easy-to-use experience.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
