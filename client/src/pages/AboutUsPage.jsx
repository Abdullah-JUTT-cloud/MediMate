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
    <div className="relative min-h-screen overflow-hidden bg-[#FDFCF8] text-[#2C2C24]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[#E6DCCD]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[#5D7052]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5D7052]">Company</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Building dependable software for modern clinics</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#78786C]">
            MedAlerto was created to help doctors and clinic teams replace fragmented manual processes with a reliable digital workflow
            for prescriptions, appointments, and patient communication.
          </p>

          <div className="mt-12 space-y-6">
            <section className="rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold">Why MedAlerto exists</h2>
              <p className="mt-4 leading-relaxed text-[#78786C]">
                Many clinical tools are built for large institutions and do not match the pace or needs of independent practices.
                We focus on the core workflows that matter most in outpatient care: fast documentation, clear patient handoff, and predictable scheduling.
              </p>
            </section>

            <section className="rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold">Who we serve</h2>
              <p className="mt-4 leading-relaxed text-[#78786C]">
                MedAlerto is built for independent doctors, specialists, and clinic operators who need a practical platform that improves
                service quality without introducing heavy administrative overhead.
              </p>
            </section>

            <section className="rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold">Our mission</h2>
              <p className="mt-4 leading-relaxed text-[#78786C]">
                To help clinics deliver better patient experiences through clearer records, faster operations, and more reliable communication.
              </p>
            </section>

            <section className="rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.16)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold">Our operating principles</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {principles.map((item) => (
                  <article key={item.title} className="rounded-3xl border border-[#DED8CF]/80 bg-[#F0EBE5]/45 p-4">
                    <h3 className="text-base font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#78786C]">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold">Looking ahead</h2>
              <p className="mt-4 leading-relaxed text-[#78786C]">
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
