import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const faqItems = [
  { category: "Pricing & Billing", question: "Is there a setup fee?", answer: "No. There is no setup or activation fee." },
  { category: "Pricing & Billing", question: "Can I cancel anytime?", answer: "Yes. You can cancel according to your billing cycle." },
  { category: "Pricing & Billing", question: "Do you offer monthly and annual billing?", answer: "Yes. You can choose monthly or annual billing from the pricing page." },
  { category: "Pricing & Billing", question: "Does annual billing include savings?", answer: "Yes. Annual billing offers a lower effective monthly cost than monthly billing." },
  { category: "Pricing & Billing", question: "Are there hidden charges?", answer: "No. Plan pricing is transparent before subscription." },
  { category: "Pricing & Billing", question: "Can I switch from monthly to annual later?", answer: "Yes. You can change your billing cycle as needed." },
  { category: "Pricing & Billing", question: "Will I lose data if I change plan or billing cycle?", answer: "No. Your core account data stays intact." },

  { category: "Onboarding", question: "How long does setup take?", answer: "Most clinics complete basic setup in under 30 minutes." },
  { category: "Onboarding", question: "Do you help migrate from paper workflow?", answer: "Yes. We guide clinics to shift in phases without disruption." },
  { category: "Onboarding", question: "Can we start with only new patients first?", answer: "Yes. Many clinics begin with active/new visits and add older records gradually." },
  { category: "Onboarding", question: "Do you provide training for assistants and reception staff?", answer: "Yes. We provide practical onboarding guidance for clinic teams." },
  { category: "Onboarding", question: "Do I need technical staff to launch MedAlerto?", answer: "No. The platform is built for non-technical clinic teams." },

  { category: "Prescriptions", question: "Can I generate digital prescriptions in PDF format?", answer: "Yes. Every prescription can be generated as a clean PDF." },
  { category: "Prescriptions", question: "Can prescriptions be sent through WhatsApp?", answer: "Yes. Prescriptions can be delivered directly via WhatsApp." },
  { category: "Prescriptions", question: "Can I add dosage and timing instructions?", answer: "Yes. Prescription fields support complete medication instructions." },
  { category: "Prescriptions", question: "Can I include follow-up notes in prescription workflow?", answer: "Yes. Follow-up and care notes can be documented during consultation." },
  { category: "Prescriptions", question: "Does MedAlerto support medicine alternatives?", answer: "Yes. You can find alternatives by salt composition." },
  { category: "Prescriptions", question: "Can patients receive prescriptions without installing an app?", answer: "Yes. They can receive PDF prescriptions directly on WhatsApp." },

  { category: "Appointments", question: "Can I book and reschedule appointments?", answer: "Yes. Appointment creation and rescheduling are built in." },
  { category: "Appointments", question: "Are follow-up reminders automated?", answer: "Yes. Reminder flows can run automatically." },
  { category: "Appointments", question: "Can the receptionist manage appointment flow?", answer: "Yes. Team members can handle scheduling workflows." },
  { category: "Appointments", question: "Can emergency appointment changes be handled quickly?", answer: "Yes. Schedule changes can be applied and communicated fast." },
  { category: "Appointments", question: "Does MedAlerto include an emergency bulk-cancel button?", answer: "Yes. Doctors can cancel a selected range of appointments in one action during emergencies." },
  { category: "Appointments", question: "Does MedAlerto help reduce no-shows?", answer: "Yes. Automated reminders improve patient attendance consistency." },

  { category: "Patient Records", question: "Can I keep complete patient history in one place?", answer: "Yes. Patient profiles include visit timeline and prior details." },
  { category: "Patient Records", question: "Can I quickly search patient records?", answer: "Yes. Records can be retrieved using key patient details." },
  { category: "Patient Records", question: "Does MedAlerto support longitudinal visit tracking?", answer: "Yes. Visit-by-visit continuity is built into patient history." },
  { category: "Patient Records", question: "Can we gradually migrate old records?", answer: "Yes. Record migration can be done in manageable phases." },
  { category: "Patient Records", question: "Can consultation notes be standardized?", answer: "Yes. Structured note entry helps maintain consistent records." },

  { category: "Chat & Communication", question: "Does MedAlerto include doctor-patient chat?", answer: "Yes. Real-time chat is available in the system." },
  { category: "Chat & Communication", question: "Can patients send attachments in chat?", answer: "Yes. File and image attachments are supported." },
  { category: "Chat & Communication", question: "Are voice notes supported in chat?", answer: "Yes. Voice message support is built into chat workflow." },
  { category: "Chat & Communication", question: "Can chat be used for follow-up communication?", answer: "Yes. Chat history supports continuity after consultation." },
  { category: "Chat & Communication", question: "Is patient-side chat access available?", answer: "Yes. Patients can access chat through their login flow." },

  { category: "Security & Access", question: "Is clinic data secure on MedAlerto?", answer: "Yes. We use secure authentication and controlled access practices." },
  { category: "Security & Access", question: "Who can access clinic records?", answer: "Access is restricted to authorized account users and roles." },
  { category: "Security & Access", question: "Do you use role-based controls?", answer: "Yes. Workflow access can be controlled by user role." },
  { category: "Security & Access", question: "Are legal policy pages available?", answer: "Yes. Privacy, Terms, and Cookie policies are available on the site." },
  { category: "Security & Access", question: "Can I request privacy-related help?", answer: "Yes. Privacy inquiries can be sent to privacy support channels." },

  { category: "Operations & Support", question: "Does MedAlerto include dashboard insights?", answer: "Yes. Operational dashboards track key clinic activity." },
  { category: "Operations & Support", question: "Can I monitor clinic performance trends?", answer: "Yes. Reports and insights help monitor workflow outcomes." },
  { category: "Operations & Support", question: "Is there an issue ticket system?", answer: "Yes. The support center includes issue tickets and chat updates." },
  { category: "Operations & Support", question: "Do you provide support during clinic hours?", answer: "Yes. Support is available during business hours for active clinics." },
  { category: "Operations & Support", question: "Can support help with day-to-day workflow questions?", answer: "Yes. Support covers both technical and operational usage guidance." },
  { category: "Operations & Support", question: "How can I contact support quickly?", answer: "You can use email, in-platform support flow, or WhatsApp support channels." },
];

const categories = ["All", ...Array.from(new Set(faqItems.map((item) => item.category)))];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return faqItems;
    return faqItems.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">FAQ</p>
            <h1 className="mt-4 max-w-4xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">Frequently asked questions</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Answers to common questions about pricing, onboarding, prescriptions, records, chat, and support.
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--color-secondary)]">{faqItems.length}+ questions currently available</p>
          </section>

          <section className="mt-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setOpenFaqIndex(null);
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  activeCategory === category
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "border border-[var(--color-border)]/80 bg-[var(--color-card)]/80 text-[var(--color-text-secondary)]"
                }`}
              >
                {category}
              </button>
            ))}
          </section>

          <section className="mt-6 rounded-4xl border border-[var(--color-border)]/70 bg-[#111c14] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="space-y-3">
              {filteredItems.map((item, index) => (
                <article key={`${item.category}-${item.question}`} className="overflow-hidden rounded-3xl border border-[#2e4737] bg-[#132118]">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((prev) => (prev === index ? null : index))}
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
                  >
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8eb49a]">{item.category}</p>
                      <h3 className="text-base font-bold text-[#f2f5ef]">{item.question}</h3>
                    </div>
                    <span className="text-2xl font-semibold leading-none text-[#d8e6db]">{openFaqIndex === index ? "-" : "+"}</span>
                  </button>
                  {openFaqIndex === index ? (
                    <div id={`faq-answer-${index}`}>
                      <p className="px-4 pb-4 text-sm leading-relaxed text-[#b8c9bc] sm:px-5">{item.answer}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
