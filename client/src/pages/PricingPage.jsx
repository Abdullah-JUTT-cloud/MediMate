import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const included = [
  "Unlimited digital prescriptions and PDF generation",
  "WhatsApp delivery for prescriptions and appointment communication",
  "Complete patient history and visit timeline access",
  "Follow-up scheduling with automated reminders",
  "Medicine alternative assistance by composition",
  "Clinic insights for appointments, activity, and earnings",
  "Priority support during onboarding and daily operations",
];

const faqs = [
  {
    question: "Is there a setup fee?",
    answer: "No. You only pay the monthly subscription. There are no hidden onboarding or activation charges.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. You can cancel your subscription based on your billing cycle without long-term lock-in.",
  },
  {
    question: "Is this suitable for single-doctor clinics?",
    answer: "Yes. The plan is designed for independent practitioners and small to mid-sized clinics.",
  },
  {
    question: "Do you provide migration help from paper workflow?",
    answer: "Yes. We provide guided onboarding support to help your clinic adopt digital prescriptions and scheduling quickly.",
  },
  {
    question: "What happens to my existing patient records?",
    answer: "You can start adding patients gradually. Most clinics begin with new visits first, then migrate historical records in phases.",
  },
  {
    question: "Can my assistant or receptionist use the system?",
    answer: "Yes. Clinic teams can use MedAlerto for appointment handling and patient coordination based on your configured workflow.",
  },
  {
    question: "Do patients need an app to receive prescriptions?",
    answer: "No. Patients receive prescriptions as PDF files directly on WhatsApp, so no separate app installation is required.",
  },
  {
    question: "Is my data secure on MedAlerto?",
    answer: "Yes. We use practical security controls and restricted access practices to protect clinic and patient information.",
  },
  {
    question: "Can I get onboarding help after subscribing?",
    answer: "Absolutely. Our team provides setup and usage guidance so your clinic can adopt the workflow quickly and confidently.",
  },
  {
    question: "Do you offer support during clinic hours?",
    answer: "Yes. We provide support through email and WhatsApp during business hours for operational and technical queries.",
  },
];

export default function PricingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Pricing</p>
          <h1 className="mt-4 text-center font-heading text-4xl font-semibold leading-tight sm:text-5xl">Simple pricing for growing clinics</h1>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg leading-relaxed text-[var(--color-text-secondary)]">
            One transparent plan with the core capabilities required to run modern clinical operations without paying for unnecessary complexity.
          </p>

          <section className="mx-auto mt-12 max-w-3xl rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-8 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.18)] md:p-12">
            <h2 className="text-center font-heading text-2xl font-semibold">MedAlerto Professional</h2>
            <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">Designed for independent doctors and clinic teams</p>

            <div className="mb-6 mt-6 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold">Rs.</span>
              <span className="text-6xl font-extrabold">4,999</span>
              <span className="text-lg text-[var(--color-text-secondary)]">PKR/month</span>
            </div>

            <div className="mb-8 text-left">
              <h3 className="border-b border-[var(--color-border)]/80 pb-2 text-lg font-bold">Included in your subscription</h3>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="mt-3 flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <span className="text-xl text-[var(--color-primary)]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 text-left md:grid-cols-2">
              <div className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45 p-4">
                <h3 className="text-base font-bold">Best suited for</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Single-doctor clinics, specialist practices, and teams that need consistent prescription and appointment workflows.
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45 p-4">
                <h3 className="text-base font-bold">Business impact</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Reduces manual admin time, improves patient communication quality, and supports more predictable clinic operations.
                </p>
              </div>
            </div>

            <button className="mt-10 w-full rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-4 text-lg font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)]">
              Start Subscription
            </button>
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Frequently asked questions</h2>
            <div className="mt-5 grid gap-4">
              {faqs.map((item, index) => (
                <article key={item.question} className="overflow-hidden rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
                  >
                    <h3 className="text-base font-bold">{item.question}</h3>
                    <span className="text-2xl font-semibold leading-none text-[var(--color-text-primary)]">
                      {openFaqIndex === index ? "-" : "+"}
                    </span>
                  </button>
                  {openFaqIndex === index && (
                    <div id={`faq-answer-${index}`}>
                      <p className="px-4 pb-4 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:px-5">
                        {item.answer}
                      </p>
                    </div>
                  )}
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
