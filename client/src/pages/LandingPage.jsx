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
  },
  {
    number: "02",
    title: "Medicine Alternatives",
    description:
      "Find alternative medicines by the same salt composition when your prescribed brand is unavailable.",
  },
  {
    number: "03",
    title: "Smart Appointments",
    description:
      "Schedule follow-ups with automatic WhatsApp confirmations. Reduce no-shows with intelligent reminders.",
  },
  {
    number: "04",
    title: "Patient History",
    description:
      "Access complete patient records and visit history instantly. Make informed decisions every time.",
  },
  {
    number: "05",
    title: "Emergency Management",
    description:
      "Cancel a range of appointments with one click in emergencies. Patients are notified automatically.",
  },
  {
    number: "06",
    title: "Practice Insights",
    description:
      "Track monthly earnings, patient activity, and clinic performance without any extra effort.",
  },
];

const stats = [
  { value: "10x", label: "Faster prescriptions" },
  { value: "Zero", label: "Lost prescriptions" },
  { value: "100%", label: "WhatsApp delivery" },
  { value: "24/7", label: "Patient records access" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-page min-h-screen bg-[#FDFCF8] text-[#2C2C24]">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden bg-[#FDFCF8] pt-28 sm:pt-32">
          <div
            aria-hidden="true"
            className="absolute -left-24 top-8 h-80 w-80 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[#5D7052]/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 top-16 h-96 w-96 rounded-[58%_42%_56%_44%/44%_58%_42%_56%] bg-[#C18C5D]/18 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-6 top-10 h-px bg-[#DED8CF]/50"
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 pb-20 sm:px-6 lg:px-8 xl:pb-28">
            <div className="col-span-12 flex flex-col justify-between xl:col-span-6">
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-[#C18C5D]" />
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#78786C] sm:text-[10px] sm:tracking-[0.35em]">Organic workflow system</p>
              </div>

              <h1
                className="mt-8 max-w-[12ch] text-[2.45rem] font-heading font-semibold leading-[0.95] tracking-[-0.03em] text-balance sm:max-w-3xl sm:text-6xl sm:tracking-normal lg:text-7xl xl:text-8xl"
              >
                <span className="block">Doctor workflow,</span>
                <span className="block">softened with</span>
                <span className="block">
                  <span className="italic text-[#C18C5D]">quiet care</span>.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[0.94rem] leading-relaxed text-[#78786C] sm:mt-8 sm:text-lg">
                MedAlerto brings prescriptions, appointments, patient records, and follow-ups into one calm interface so clinics can move with less friction and more confidence.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-[#5D7052] bg-[#5D7052] px-6 font-body text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(93,112,82,0.3)] active:translate-y-0 active:shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] sm:w-auto sm:px-8 motion-reduce:transition-none"
                >
                  <span className="absolute inset-0 bg-[#C18C5D] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10">Create Your Free Account</span>
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#C18C5D] bg-white/65 px-6 font-body text-sm font-bold text-[#C18C5D] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B67746] hover:bg-[#C18C5D]/10 hover:shadow-[0_10px_28px_-14px_rgba(193,140,93,0.3)] active:translate-y-0 sm:w-auto sm:px-8 motion-reduce:transition-none"
                >
                  Sign In to Dashboard
                </button>
              </div>

              <div className="mt-9 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(({ value, label }) => (
                  <div key={label} className="rounded-3xl border border-[#DED8CF]/60 bg-[#FEFEFA] px-4 py-4 text-left shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(193,140,93,0.2)]">
                    <p className="font-heading text-3xl leading-none text-[#5D7052] sm:text-4xl">
                      {value}
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[#78786C]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 xl:col-span-5 xl:col-start-8">
              <div className="group relative mx-auto w-full max-w-2xl">
                <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[#E6DCCD] blur-2xl xl:block" aria-hidden="true" />
                <div className="absolute -bottom-8 right-8 h-28 w-28 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[#5D7052]/15 blur-2xl" aria-hidden="true" />

                <div className="relative overflow-hidden rounded-[60%_40%_30%_70%/60%_30%_70%_40%] border-4 border-white/85 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.18)] transition-[border-radius,transform,box-shadow] duration-1200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rounded-[2.75rem] group-hover:-rotate-[0.5deg] group-hover:shadow-[0_16px_50px_-12px_rgba(93,112,82,0.22)] motion-reduce:transition-none">
                  <img
                    src={doc}
                    alt="Doctor portrait used to represent MedAlerto"
                    className="aspect-4/5 w-full object-cover object-center transition duration-1200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.005] motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(253,252,248,0.35),transparent_48%)]" />

                  <div className="absolute left-3 top-3 rounded-full border border-[#DED8CF]/80 bg-[#FEFEFA]/92 px-3 py-2 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] backdrop-blur-md sm:left-4 sm:top-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#5D7052] sm:text-[10px] sm:tracking-[0.25em]">Trusted by 5,000+ doctors</p>
                  </div>

                    <div className="absolute bottom-3 right-3 rounded-full border border-[#DED8CF]/80 bg-[#F0EBE5]/95 px-3 py-2 shadow-[0_4px_20px_-2px_rgba(193,140,93,0.14)] backdrop-blur-md sm:bottom-4 sm:right-4">
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#4A4A40] sm:text-[10px] sm:tracking-[0.25em]">Prescription sent via WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-[#DED8CF]/60 bg-[#F0EBE5]/35 py-24 sm:py-28 xl:py-32">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 xl:col-span-6 xl:col-start-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#78786C]">What the platform handles</p>
                <h2
                  className="mt-6 max-w-3xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl lg:text-6xl"
                >
                  Every critical workflow, <span className="italic text-[#C18C5D]">shaped</span> with gentle clarity.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#78786C] first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:leading-[0.8] first-letter:font-heading first-letter:font-semibold first-letter:text-[#5D7052]">
                  MedAlerto reduces the manual noise around prescriptions, scheduling, and patient tracking. The result is a calmer workflow that still moves fast when the clinic needs it.
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {features.map(({ number, title, description }, index) => (
                <article
                  key={title}
                  className={`group rounded-[2.25rem] border border-[#DED8CF]/60 bg-[#FEFEFA] p-8 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(93,112,82,0.2)] motion-reduce:transition-none ${index === 0 ? "xl:col-span-2" : ""}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#94A3B8]">{number}</p>
                    <span className="mt-1 h-px w-12 bg-[#DED8CF] transition duration-300 group-hover:bg-[#C18C5D]" />
                  </div>
                  <h3 className="mt-10 text-2xl font-heading font-semibold leading-tight text-[#2C2C24]">
                    {title}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-[#78786C]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-[#DED8CF]/60 bg-[#5D7052] py-24 text-[#F3F4F1] sm:py-28 xl:py-32">
          <div
            aria-hidden="true"
            className="absolute -left-16 top-8 h-72 w-72 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[#E6DCCD]/18 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-80 w-80 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[#C18C5D]/18 blur-3xl"
          />
          <div className="relative mx-auto grid w-full max-w-7xl grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
            <div className="col-span-12 xl:col-span-7 xl:col-start-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#E6DCCD]">Closing note</p>
              <h2
                className="mt-6 max-w-4xl text-4xl font-heading font-semibold leading-[0.95] sm:text-5xl lg:text-6xl"
              >
                Ready to modernize the clinic with a softer kind of structure?
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#F3F4F1]/80">
                Join doctors using MedAlerto to save time, reduce mistakes, and keep every patient record in one place.
              </p>
            </div>

            <div className="col-span-12 flex items-end xl:col-span-3 xl:col-start-10">
              <button
                onClick={() => navigate("/signup")}
                className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-[#F3F4F1]/40 bg-[#F3F4F1] px-8 font-body text-sm font-bold text-[#5D7052] shadow-[0_4px_20px_-2px_rgba(243,244,241,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F0EBE5] hover:shadow-[0_10px_28px_-14px_rgba(243,244,241,0.24)] active:translate-y-0 motion-reduce:transition-none"
              >
                <span className="absolute inset-0 bg-[#E6DCCD] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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