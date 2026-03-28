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
    answer: "Yes. Clinic teams can use MediMate for appointment handling and patient coordination based on your configured workflow.",
  },
  {
    question: "Do patients need an app to receive prescriptions?",
    answer: "No. Patients receive prescriptions as PDF files directly on WhatsApp, so no separate app installation is required.",
  },
  {
    question: "Is my data secure on MediMate?",
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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Pricing</p>
          <h1 className="mt-4 text-center text-4xl font-extrabold sm:text-5xl">Simple pricing for growing clinics</h1>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg leading-relaxed text-[var(--color-text-secondary)]">
            One transparent plan with the core capabilities required to run modern clinical operations without paying for unnecessary complexity.
          </p>

          <section className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-[var(--color-card)] p-8 shadow-sm md:p-12">
            <h2 className="text-center text-2xl font-bold">MediMate Professional</h2>
            <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">Designed for independent doctors and clinic teams</p>

            <div className="mb-6 mt-6 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold">Rs.</span>
              <span className="text-6xl font-extrabold">4,999</span>
              <span className="text-[var(--color-text-secondary)] text-lg">PKR/month</span>
            </div>

            <div className="mb-8 text-left">
              <h3 className="border-b pb-2 text-lg font-bold">Included in your subscription</h3>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="mt-3 flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <span className="text-xl text-[var(--color-success)]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 text-left md:grid-cols-2">
              <div className="rounded-xl border bg-[var(--color-bg)] p-4">
                <h3 className="text-base font-bold">Best suited for</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Single-doctor clinics, specialist practices, and teams that need consistent prescription and appointment workflows.
                </p>
              </div>
              <div className="rounded-xl border bg-[var(--color-bg)] p-4">
                <h3 className="text-base font-bold">Business impact</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Reduces manual admin time, improves patient communication quality, and supports more predictable clinic operations.
                </p>
              </div>
            </div>

            <button className="mt-10 w-full rounded-xl bg-[var(--color-primary)] py-4 text-lg font-bold text-white transition hover:opacity-90">
              Start Subscription
            </button>
          </section>

          <section className="mt-12 rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Frequently asked questions</h2>
            <div className="mt-5 grid gap-4">
              {faqs.map((item, index) => (
                <article key={item.question} className="overflow-hidden rounded-xl border bg-[var(--color-bg)]">
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
