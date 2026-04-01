import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. Scope of this policy",
    content:
      "This Privacy Policy explains how MedAlerto collects, uses, stores, and protects information when doctors and clinic teams use the platform. It applies to account data, operational clinic data, and patient-related data entered by authorized users.",
  },
  {
    title: "2. Information we collect",
    content:
      "We collect account and profile information (such as doctor name, clinic details, email, and phone), operational records (appointments, prescriptions, patient encounter notes), and technical information required for system security and service reliability.",
  },
  {
    title: "3. How we use information",
    content:
      "Information is used to operate core platform features, generate and deliver prescription documents, provide appointment communication, improve product performance, and support account and service troubleshooting.",
  },
  {
    title: "4. Data sharing and disclosure",
    content:
      "MedAlerto does not sell clinical or patient data. Information may only be shared with service providers strictly required for platform operation (for example communication and hosting infrastructure) under confidentiality and security obligations.",
  },
  {
    title: "5. Security safeguards",
    content:
      "We apply practical technical and organizational safeguards designed to prevent unauthorized access, misuse, and accidental loss of data. Access to production systems is restricted and monitored according to role-based responsibilities.",
  },
  {
    title: "6. Data retention",
    content:
      "We retain account and operational data for as long as required to provide services, comply with legal obligations, resolve disputes, and enforce platform agreements. Retention duration may vary based on account status and applicable law.",
  },
  {
    title: "7. Your rights and controls",
    content:
      "Authorized account holders may request access, correction, or deletion of certain account data subject to operational, legal, and compliance requirements. Requests can be submitted through support channels listed on the Contact page.",
  },
  {
    title: "8. International and third-party services",
    content:
      "Some supporting infrastructure may process data in multiple regions based on hosting and communication providers. We select providers that support secure handling and contractual confidentiality expectations.",
  },
  {
    title: "9. Policy updates",
    content:
      "We may update this Privacy Policy to reflect product changes, legal requirements, or security practices. Material updates will be published on this page with an updated effective date.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Legal</p>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Protecting clinical and patient information is a core responsibility of MedAlerto. This policy describes how information is handled across the platform.
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
            <p className="mt-2">For privacy inquiries, contact: privacy@medalerto.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
