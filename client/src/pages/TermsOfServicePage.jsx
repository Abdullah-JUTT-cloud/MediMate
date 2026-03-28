import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. Acceptance of terms",
    content:
      "By creating an account or using MediMate, you agree to these Terms of Service and all applicable policies referenced within the platform.",
  },
  {
    title: "2. Service description",
    content:
      "MediMate provides software tools for clinic operations, including prescription management, appointment workflows, patient record organization, and communication support features.",
  },
  {
    title: "3. Clinical responsibility",
    content:
      "All medical decisions, diagnosis, treatment, and prescription content remain solely the responsibility of licensed medical professionals using the platform.",
  },
  {
    title: "4. Account security and access",
    content:
      "You are responsible for maintaining the confidentiality of account credentials and for activities performed under your account. You must notify us promptly in case of unauthorized access.",
  },
  {
    title: "5. Acceptable use",
    content:
      "You agree not to misuse the platform, attempt unauthorized access, interfere with security controls, upload malicious content, or use the service for unlawful activity.",
  },
  {
    title: "6. Billing and subscription",
    content:
      "Paid plans are billed according to the active subscription cycle. Unless otherwise stated, fees are non-refundable for completed billing periods. Pricing and plan terms may be updated with prior notice.",
  },
  {
    title: "7. Data and confidentiality",
    content:
      "MediMate applies reasonable safeguards to protect account and operational data. Data handling practices are further described in the Privacy Policy.",
  },
  {
    title: "8. Availability and updates",
    content:
      "We continuously improve the service and may modify, add, or remove features to maintain platform reliability, performance, and security.",
  },
  {
    title: "9. Limitation of liability",
    content:
      "To the maximum extent permitted by law, MediMate is provided on an as-available basis, and we are not liable for indirect, incidental, or consequential damages arising from service use.",
  },
  {
    title: "10. Termination",
    content:
      "We may suspend or terminate access in cases of policy violations, unlawful activity, or security risks. You may discontinue use according to your subscription terms.",
  },
  {
    title: "11. Changes to these terms",
    content:
      "We may revise these Terms of Service as legal, operational, or product requirements evolve. Updated terms become effective upon publication unless otherwise stated.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Legal</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Terms of Service</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            These terms define the responsibilities, usage rules, and service boundaries for all MediMate accounts.
          </p>

          <div className="mt-12 space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-2xl border bg-[var(--color-card)] p-6 sm:p-8">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 border-t pt-4 text-sm text-[var(--color-text-secondary)]">
            <p>Effective date: March 28, 2026</p>
            <p className="mt-2">For legal and policy questions, contact: support@medalerto.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
