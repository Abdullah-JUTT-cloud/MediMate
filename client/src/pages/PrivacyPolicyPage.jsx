import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
  {
    title: "1. Scope and Applicability",
    content: [
      {
        type: "text",
        value:
          "This Privacy Policy applies to all users of MedAlerto, including independent doctors, specialists, clinic staff, and authorized personnel who access the platform.",
      },
      {
        type: "text",
        value:
          "MedAlerto acts as a data processor on behalf of healthcare providers (data controllers), who are responsible for ensuring lawful collection and use of patient data in accordance with applicable regulations.",
      },
    ],
  },
  {
    title: "2. Information We Collect",
    content: [
      {
        type: "text",
        value: "We collect and process the following categories of information:",
      },
      {
        type: "subsection",
        title: "a. Account and Identity Information",
        bullets: [
          "Full name",
          "Clinic or hospital name",
          "Email address",
          "Phone number",
          "Professional credentials (including license verification data)",
        ],
      },
      {
        type: "subsection",
        title: "b. Patient and Clinical Data",
        bullets: [
          "Patient demographics (name, age, gender, contact details)",
          "Medical history and visit records",
          "Diagnoses, prescriptions, and treatment notes",
          "Lab test records and clinical observations",
        ],
      },
      {
        type: "subsection",
        title: "c. Appointment and Operational Data",
        bullets: [
          "Appointment schedules and statuses",
          "Consultation history",
          "Billing records and payment status",
        ],
      },
      {
        type: "subsection",
        title: "d. Support and Notification Data",
        bullets: [
          "Support ticket requests and support center correspondence",
          "Automated appointment reminder and prescription delivery logs",
        ],
      },
      {
        type: "subsection",
        title: "e. Technical and Usage Data",
        bullets: [
          "Device information (browser, OS, IP address)",
          "Log files and system activity",
          "Error reports and performance metrics",
        ],
      },
      {
        type: "subsection",
        title: "f. Payment and Billing Metadata",
        bullets: [
          "Transaction references",
          "Payment status",
          "(Note: MedAlerto does not store full payment card details. Payments are processed by third-party providers.)",
        ],
      },
    ],
  },
  {
    title: "3. How We Use Information",
    content: [
      {
        type: "text",
        value: "We use collected data strictly for operational and service-related purposes:",
      },
      {
        type: "bullets",
        value: [
          "To provide and maintain clinic management features",
          "To generate prescriptions and medical documents",
          "To enable appointment scheduling and reminders",
          "To facilitate support ticket communication and notifications",
          "To process billing and track payments",
          "To improve system performance, reliability, and usability",
          "To detect, prevent, and respond to security threats",
          "To comply with legal and regulatory requirements",
        ],
      },
      {
        type: "text",
        value: "We do not use patient or clinical data for advertising or profiling.",
      },
    ],
  },
  {
    title: "4. Data Ownership and Control",
    content: [
      {
        type: "bullets",
        value: [
          "Healthcare providers retain ownership and control over patient data entered into MedAlerto.",
          "MedAlerto processes data only on behalf of the provider and according to their instructions.",
          "Patients interact with the system through access granted by their healthcare provider.",
        ],
      },
    ],
  },
  {
    title: "5. Data Sharing and Disclosure",
    content: [
      {
        type: "text",
        value: "MedAlerto does not sell, rent, or trade personal or medical data.",
      },
      {
        type: "text",
        value: "We may share limited data with:",
      },
      {
        type: "subsection",
        title: "a. Service Providers",
        value: "Trusted third parties that support:",
        bullets: [
          "Cloud hosting",
          "Messaging (e.g., WhatsApp reminders)",
          "Payment processing",
          "Analytics and system monitoring",
        ],
        footer: "All such providers are bound by strict confidentiality and data protection agreements.",
      },
      {
        type: "subsection",
        title: "b. Legal Requirements",
        value: "We may disclose data if required to:",
        bullets: [
          "Comply with applicable laws or regulations",
          "Respond to lawful requests from authorities",
          "Protect rights, safety, and security of users or the public",
        ],
      },
    ],
  },
  {
    title: "6. Data Security",
    content: [
      {
        type: "text",
        value: "We implement industry-standard safeguards to protect data, including:",
      },
      {
        type: "bullets",
        value: [
          "Encryption of data in transit (HTTPS/TLS)",
          "Secure cloud infrastructure with restricted access",
          "Role-based access control for clinic staff",
          "Authentication and session protection mechanisms",
          "Continuous monitoring for vulnerabilities and threats",
        ],
      },
      {
        type: "text",
        value: "Despite strong safeguards, no system can guarantee absolute security. Users are responsible for maintaining the confidentiality of their login credentials.",
      },
    ],
  },
  {
    title: "7. Data Retention",
    content: [
      {
        type: "text",
        value: "We retain data only as long as necessary to:",
      },
      {
        type: "bullets",
        value: [
          "Provide the MedAlerto service",
          "Maintain medical and operational records",
          "Comply with legal, regulatory, and tax obligations",
          "Resolve disputes and enforce agreements",
        ],
      },
      {
        type: "text",
        value: "Healthcare providers may request deletion or export of their data, subject to legal constraints.",
      },
    ],
  },
  {
    title: "8. User Rights and Data Requests",
    content: [
      {
        type: "text",
        value: "Authorized users (clinic owners or administrators) may:",
      },
      {
        type: "bullets",
        value: [
          "Access their stored data",
          "Request corrections or updates",
          "Export data in a structured format",
          "Request deletion of eligible data",
        ],
      },
      {
        type: "text",
        value: "Requests can be submitted via the contact information provided below. Certain requests may be limited by legal or operational requirements.",
      },
    ],
  },
  {
    title: "9. International Data Processing",
    content: [
      {
        type: "text",
        value: "MedAlerto may use infrastructure providers that operate in multiple geographic regions. Data may be processed or stored outside the user’s country.",
      },
      {
        type: "text",
        value: "We ensure that all providers meet acceptable security and data protection standards.",
      },
    ],
  },
  {
    title: "10. Third-Party Services",
    content: [
      {
        type: "text",
        value: "MedAlerto may integrate with third-party services such as:",
      },
      {
        type: "bullets",
        value: [
          "Messaging platforms (e.g., WhatsApp)",
          "Payment gateways",
        ],
      },
      {
        type: "text",
        value: "Use of such services is subject to their respective privacy policies. MedAlerto is not responsible for how third parties handle data once shared with them under user-initiated actions.",
      },
    ],
  },
  {
    title: "11. Children’s Data",
    content: [
      {
        type: "text",
        value: "MedAlerto is not intended for direct use by minors. Any data related to minors is entered and managed solely by authorized healthcare providers.",
      },
    ],
  },
  {
    title: "12. Policy Updates",
    content: [
      {
        type: "text",
        value: "We may update this Privacy Policy from time to time to reflect:",
      },
      {
        type: "bullets",
        value: [
          "Changes in product functionality",
          "Legal or regulatory requirements",
          "Security practices",
        ],
      },
      {
        type: "text",
        value: "The updated version will always include the latest effective date. Continued use of the platform indicates acceptance of the updated policy.",
      },
    ],
  },
  {
    title: "13. Contact Information",
    content: [
      {
        type: "text",
        value: "For privacy-related inquiries or requests:",
      },
      {
        type: "text",
        value: "Email: privacy@medalerto.com",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Background Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl"
      />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-7 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-10 transition-all duration-300 hover:shadow-[0_20px_50px_-15px_rgba(93,112,82,0.18)]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Legal Compliance
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
              MedAlerto Privacy Policy
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
              Protecting clinical and patient information is fundamental to how MedAlerto is designed, built, and operated. This Privacy Policy explains how we collect, use, disclose, and safeguard information when healthcare professionals use the MedAlerto platform.
            </p>
          </section>

          <div className="mt-10 space-y-6">
            {sections.map((section, idx) => (
              <section
                key={idx}
                className="rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] sm:p-8 transition-all duration-300 hover:border-[var(--color-primary)]/30"
              >
                <h2 className="font-heading text-2xl font-semibold text-[var(--color-text-primary)]">
                  {section.title}
                </h2>
                <div className="mt-6 space-y-4">
                  {section.content.map((item, i) => {
                    if (item.type === "text") {
                      return (
                        <p key={i} className="leading-relaxed text-[var(--color-text-secondary)]">
                          {item.value}
                        </p>
                      );
                    }
                    if (item.type === "bullets") {
                      return (
                        <ul key={i} className="space-y-3">
                          {item.value.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (item.type === "subsection") {
                      return (
                        <div key={i} className="mt-6 rounded-2xl bg-[var(--color-bg-soft)]/40 p-5 border border-[var(--color-border)]/40">
                          <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-3">
                            {item.title}
                          </h3>
                          {item.value && (
                            <p className="mb-3 text-[var(--color-text-secondary)]">
                              {item.value}
                            </p>
                          )}
                          {item.bullets && (
                            <ul className="space-y-2">
                              {item.bullets.map((bullet, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {item.footer && (
                            <p className="mt-3 text-xs italic text-[var(--color-text-secondary)]/80">
                              {item.footer}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-primary)]/5 p-8 text-center sm:text-left transition-all duration-300 hover:bg-[var(--color-primary)]/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-[var(--color-primary)] uppercase tracking-wider">Statement of Trust</p>
                <p className="mt-2 text-[var(--color-text-secondary)]">
                  Your trust is our priority. We are committed to transparency in our data practices.
                </p>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Effective Date</p>
                <p className="text-sm text-[var(--color-text-secondary)]">April 7, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
