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
  "Patient-doctor chat coming soon",
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
    answer:
      "Yes. You can cancel a range of appointments in one action during emergencies.",
  },
  {
    question: "Is this suitable for single-doctor clinics?",
    answer:
      "Yes. MedAlerto is built specifically for independent doctors and small clinics.",
  },
  {
    question: "Do you provide migration help from paper workflow?",
    answer:
      "Yes. We provide practical onboarding help so your team can shift without disruption.",
  },
  {
    question: "What happens to my existing patient records?",
    answer:
      "You can move records in phases. Most clinics start with active patients first.",
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
    answer:
      "Yes. We use secure authentication, access controls, and responsible data handling.",
  },
  {
    question: "Can I get onboarding help after subscribing?",
    answer:
      "Yes. Onboarding help is included to ensure quick and correct setup.",
  },
  {
    question: "Do you offer support during clinic hours?",
    answer:
      "Yes. Support is available during business hours for technical and operational issues.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

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

  const visibleFeatures = showAllFeatures
    ? PLAN_FEATURES
    : PLAN_FEATURES.slice(0, 8);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl"
      />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="text-center">
            <p className="mb-2 text-sm font-medium text-[var(--color-primary)]">
              Simple pricing. No surprises.
            </p>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]/70">
              Pricing
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
              One complete plan. Simple billing.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Everything needed to run prescriptions, records, appointments,
              reminders, billing, and support workflows.
            </p>
          </section>

          <section className="relative mx-auto mt-16 max-w-3xl rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-8 shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] md:p-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
              Most Popular
            </div>

            <div className="mx-auto mb-8 flex max-w-fit items-center rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/60 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                aria-pressed={billingCycle === "monthly"}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 ${billingCycle === "monthly" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                aria-pressed={billingCycle === "annual"}
                className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 ${billingCycle === "annual" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
              >
                <span>Annual</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${billingCycle === "annual" ? "bg-white/20 text-white" : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"}`}
                >
                  Save 20%
                </span>
              </button>
            </div>

            <h2 className="text-center font-heading text-2xl font-semibold">
              MedAlerto Professional
            </h2>
            <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
              Built for independent doctors, specialists, and small clinics
            </p>

            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                  {pricing.price}
                </span>
                <span className="text-xl font-medium text-[var(--color-text-secondary)]/70">
                  {pricing.period}
                </span>
              </div>
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
                {pricing.helper}
              </p>
            </div>

            <div className="mt-10 rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/45 p-6 md:p-8">
              <h3 className="text-base font-bold">Included features</h3>
              <ul id="pricing-features-list" className="mt-6 space-y-4">
                {visibleFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"
                  >
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span>
                      {item.includes("prescriptions") ||
                      item.includes("WhatsApp") ||
                      item.includes("emergency") ? (
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {item}
                        </span>
                      ) : (
                        item
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                aria-expanded={showAllFeatures}
                aria-controls="pricing-features-list"
                className="mt-6 text-sm font-bold text-[var(--color-primary)] transition hover:opacity-80 active:scale-[0.99]"
              >
                {showAllFeatures ? "View fewer features" : "View all features"}
              </button>
            </div>

            <div className="mt-10">
              <button className="group relative w-full rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-4 text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(var(--color-primary-rgb),0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-5px_rgba(var(--color-primary-rgb),0.4)]">
                Get Started Now →
              </button>
              <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
                No setup fees • Cancel anytime
              </p>
            </div>
          </section>

          <p className="mt-8 text-center text-sm font-medium text-[var(--color-text-secondary)]">
            Trusted by doctors for faster workflows
          </p>

          <section className="mt-20 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[var(--color-border)]/50 pb-8">
              <div>
                <h2 className="font-heading text-3xl font-semibold">
                  Frequently asked questions
                </h2>
                <p className="mt-2 text-[var(--color-text-secondary)]">
                  Everything you need to know about MedAlerto
                </p>
              </div>
              <Link
                to="/faq"
                className="inline-flex rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/15"
              >
                View 40+ FAQs
              </Link>
            </div>

            <div className="mt-8 grid gap-4">
              {faqs.map((item, index) => (
                <article
                  key={item.question}
                  className={`overflow-hidden rounded-3xl border transition-all duration-300 ${openFaqIndex === index ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5" : "border-[var(--color-border)]/80 bg-[var(--color-bg-soft)]/30 hover:bg-[var(--color-bg-soft)]/60"}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaqIndex((prev) => (prev === index ? null : index))
                    }
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <h3 className="text-base font-bold">{item.question}</h3>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/50 transition-transform duration-300 ${openFaqIndex === index ? "rotate-45 border-[var(--color-primary)]/40" : ""}`}
                    >
                      <span className="text-xl font-medium text-[var(--color-text-primary)]">
                        +
                      </span>
                    </div>
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    className={`grid transition-all duration-300 ease-in-out ${openFaqIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
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
