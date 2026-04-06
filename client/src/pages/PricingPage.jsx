import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PLAN_FEATURES = [
  "Digital prescriptions with branded PDF",
  "WhatsApp prescription delivery",
  "Patient management and visit history",
  "Appointment scheduling and rescheduling",
  "Emergency bulk-cancel button for appointments",
  "Automated follow-up reminders",
  "Medicine alternatives by composition",
  "Real-time patient chat with attachments",
  "Voice note support in chat",
  "Operational dashboard and reports",
  "Support center with issue tracking",
  "Admin controls and verification workflow",
  "Priority onboarding and clinic-hour support",
];

const faqs = [
  {
    question: "Is there a setup fee?",
    answer: "No. There is no setup or activation fee.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. You can cancel according to your billing cycle.",
  },
  {
    question: "Do you have an emergency cancel button for appointments?",
    answer: "Yes. You can cancel a range of appointments in one action during emergencies.",
  },
  {
    question: "Is this suitable for single-doctor clinics?",
    answer: "Yes. MedAlerto is built specifically for independent doctors and small clinics.",
  },
  {
    question: "Do you provide migration help from paper workflow?",
    answer: "Yes. We provide practical onboarding help so your team can shift without disruption.",
  },
  {
    question: "What happens to my existing patient records?",
    answer: "You can move records in phases. Most clinics start with active patients first.",
  },
  {
    question: "Can my assistant or receptionist use the system?",
    answer: "Yes. Team usage is supported with role-aware workflow controls.",
  },
  {
    question: "Do patients need an app to receive prescriptions?",
    answer: "No. Prescriptions are shared directly as PDF through WhatsApp.",
  },
  {
    question: "Is my data secure on MedAlerto?",
    answer: "Yes. We use secure authentication, access controls, and responsible data handling.",
  },
  {
    question: "Can I get onboarding help after subscribing?",
    answer: "Yes. Onboarding help is included to ensure quick and correct setup.",
  },
  {
    question: "Do you offer support during clinic hours?",
    answer: "Yes. Support is available during business hours for technical and operational issues.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const pricing = useMemo(() => {
    if (billingCycle === "annual") {
      return {
        price: "Rs. 49,999",
        period: "/year",
        helper: "Save over 2 months compared to monthly billing",
      };
    }

    return {
      price: "Rs. 4,999",
      period: "/month",
      helper: "One complete plan for independent doctors and small clinics",
    };
  }, [billingCycle]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Pricing</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">One complete plan. Simple billing.</h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Everything needed to run prescriptions, records, appointments, reminders, and patient chat.
            </p>
          </section>

          <section className="mx-auto mt-12 max-w-3xl rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-8 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.18)] md:p-10">
            <div className="mx-auto mb-6 inline-flex rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/60 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${billingCycle === "monthly" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-text-secondary)]"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${billingCycle === "annual" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-text-secondary)]"}`}
              >
                Annual
              </button>
            </div>

            <h2 className="text-center font-heading text-2xl font-semibold">MedAlerto Professional</h2>
            <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">Built for independent doctors, specialists, and small clinics</p>

            <div className="mt-6 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold leading-none">{pricing.price}</span>
              <span className="text-lg text-[var(--color-text-secondary)]">{pricing.period}</span>
            </div>
            <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">{pricing.helper}</p>

            <div className="mt-8 rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45 p-5">
              <h3 className="text-base font-bold">Included features</h3>
              <ul className="mt-4 space-y-3">
                {PLAN_FEATURES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="mt-8 w-full rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.3)]">
              Start Subscription
            </button>
          </section>

          <section className="mt-12 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-semibold">Frequently asked questions</h2>
              <Link
                to="/faq"
                className="inline-flex rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15"
              >
                View 40+ FAQs
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {faqs.map((item, index) => (
                <article key={item.question} className="overflow-hidden rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((prev) => (prev === index ? null : index))}
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
                  >
                    <h3 className="text-base font-bold">{item.question}</h3>
                    <span className="text-2xl font-semibold leading-none text-[var(--color-text-primary)]">{openFaqIndex === index ? "-" : "+"}</span>
                  </button>
                  {openFaqIndex === index ? (
                    <div id={`faq-answer-${index}`}>
                      <p className="px-4 pb-4 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:px-5">{item.answer}</p>
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
