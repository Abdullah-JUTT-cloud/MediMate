import {
  ChevronRight,
  Database,
  FileDown,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const quickLinks = [
  { label: "1. Scope", href: "#scope" },
  { label: "2. Data Collected", href: "#data-collected" },
  { label: "3. How We Use Data", href: "#how-we-use-data" },
  { label: "4. WhatsApp & Meta API", href: "#whatsapp-meta-api" },
  { label: "5. Data Sharing", href: "#data-sharing" },
  { label: "6. Security & R2 Storage", href: "#security-r2-storage" },
  { label: "7. Contact", href: "#contact" },
];

const sections = [
  {
    id: "scope",
    number: "1",
    title: "Scope and Applicability",
    content: [
      {
        type: "text",
        value:
          "This Privacy Policy applies to all users of MedAlerto, including independent doctors, specialists, clinic staff, and authorized personnel who access the platform.",
      },
      {
        type: "callout",
        icon: ShieldCheck,
        title: "MedAlerto is a Data Processor",
        value:
          "MedAlerto acts as a Data Processor operating under the documented instructions of healthcare providers, who act as Data Controllers. Providers are responsible for establishing the lawful basis for collecting and using patient data.",
      },
    ],
  },
  {
    id: "data-collected",
    number: "2",
    title: "Data Collected",
    content: [
      {
        type: "text",
        value: "We collect and process the following categories of information:",
      },
      {
        type: "subsection",
        title: "Account Information",
        bullets: [
          "Full name, clinic or hospital name, and email address",
          "Phone number and account authentication details",
          "Professional credentials, including license verification data",
        ],
      },
      {
        type: "subsection",
        title: "Patient Data",
        bullets: [
          "Patient demographics, including name, age, gender, and contact details",
          "Medical history, visit records, diagnoses, and treatment notes",
          "Prescriptions, lab test records, and clinical observations",
        ],
      },
      {
        type: "subsection",
        title: "Appointment and Operational Data",
        bullets: [
          "Appointment schedules, statuses, and consultation history",
          "Billing records, payment status, and transaction references",
        ],
      },
      {
        type: "subsection",
        title: "WhatsApp Data",
        bullets: [
          "Patient phone numbers used to address requested WhatsApp deliveries",
          "Prescription PDFs and delivery status records processed for automated delivery",
          "Appointment reminder and prescription delivery logs",
        ],
      },
      {
        type: "subsection",
        title: "Support and Technical Data",
        bullets: [
          "Support requests, correspondence, error reports, and system activity logs",
          "Device information such as browser, operating system, IP address, and performance metrics",
        ],
      },
    ],
  },
  {
    id: "how-we-use-data",
    number: "3",
    title: "How We Use Data",
    content: [
      {
        type: "text",
        value: "We use collected data strictly for operational, clinical-workflow, and service-related purposes:",
      },
      {
        type: "bullets",
        value: [
          "Provide and maintain clinic management features",
          "Generate prescriptions and other medical documents",
          "Enable appointment scheduling, reminders, and patient communications",
          "Process WhatsApp deliveries requested by healthcare providers",
          "Facilitate support ticket communication and notifications",
          "Process billing and track payments without storing full payment card details",
          "Improve system performance, reliability, accessibility, and usability",
          "Detect, prevent, and respond to security threats",
          "Comply with legal, regulatory, and contractual requirements",
        ],
      },
      {
        type: "text",
        value:
          "We do not sell patient or clinical data, use it for advertising, or create advertising profiles from it. Data is not used for unrelated marketing or behavioral targeting.",
      },
    ],
  },
  {
    id: "whatsapp-meta-api",
    number: "4",
    title: "WhatsApp and Meta Cloud API",
    content: [
      {
        type: "callout",
        icon: MessageCircle,
        title: "Purpose-limited WhatsApp processing",
        value:
          "Patient phone numbers and prescription PDFs are processed via the Meta Cloud API solely for automated delivery of appointment reminders and prescriptions requested by or on behalf of healthcare providers.",
      },
      {
        type: "text",
        value:
          "MedAlerto does not sell WhatsApp messaging data to any third party. We do not use WhatsApp phone numbers, message content, or prescription documents for advertising, ad profiling, audience building, or unrelated marketing.",
      },
      {
        type: "bullets",
        value: [
          "Messages are sent only as part of a healthcare provider's configured or requested workflow.",
          "The information shared is limited to what is necessary for the intended reminder or prescription delivery.",
          "Meta processes the information as the messaging infrastructure provider under its own applicable terms and policies.",
          "Providers remain responsible for patient notices, permissions, and instructions governing each communication.",
        ],
      },
    ],
  },
  {
    id: "data-sharing",
    number: "5",
    title: "Data Sharing and Disclosure",
    content: [
      {
        type: "text",
        value:
          "MedAlerto does not sell, rent, trade, or otherwise monetize personal, clinical, or WhatsApp messaging data. We disclose only the minimum information needed to operate the service, fulfill a provider's instructions, or meet a legal obligation.",
      },
      {
        type: "subsection",
        title: "Service Providers",
        value: "Trusted providers that support the platform may process limited data for:",
        bullets: [
          "Encrypted cloud hosting and object storage",
          "Meta Cloud API and WhatsApp Business messaging delivery",
          "Payment processing and transaction reconciliation",
          "Security, error monitoring, and system reliability",
        ],
        footer:
          "Our service providers are required to protect information, maintain confidentiality, and process it only for the services they provide to MedAlerto.",
      },
      {
        type: "subsection",
        title: "Legal Requirements and Safety",
        value: "We may disclose data when reasonably necessary to:",
        bullets: [
          "Comply with applicable laws, regulations, court orders, or lawful requests",
          "Protect the rights, safety, and security of users, patients, MedAlerto, or the public",
          "Investigate fraud, abuse, security incidents, or violations of our agreements",
        ],
      },
    ],
  },
  {
    id: "security-r2-storage",
    number: "6",
    title: "Security and Cloudflare R2 Storage",
    content: [
      {
        type: "text",
        value:
          "We maintain administrative, technical, and organizational safeguards designed to protect information against unauthorized access, alteration, disclosure, or destruction.",
      },
      {
        type: "bullets",
        value: [
          "Encryption of data in transit using HTTPS/TLS",
          "Restricted access and role-based permissions for clinic staff",
          "Authentication, session protection, and least-privilege operational access",
          "Monitoring for vulnerabilities, suspicious activity, and security threats",
        ],
      },
      {
        type: "subsection",
        icon: Database,
        title: "Encrypted Cloudflare R2 Storage",
        value:
          "Medical documents, including prescription PDFs, are stored in Cloudflare R2 using zero-egress, encrypted object storage. This supports our document workflows while helping us retrieve and deliver files without unnecessary data movement or egress exposure.",
        bullets: [
          "Documents are available only to authorized application workflows and permitted clinic users.",
          "Document access is controlled through application authorization and protected delivery paths.",
          "Storage and transfer safeguards are reviewed as part of our ongoing security operations.",
        ],
      },
      {
        type: "text",
        value:
          "No system can guarantee absolute security. Users must maintain the confidentiality of their login credentials and promptly report suspected unauthorized access.",
      },
    ],
  },
  {
    id: "retention-erasure",
    number: "7",
    title: "Data Retention, Export, and Erasure",
    content: [
      {
        type: "text",
        value:
          "We retain information only for as long as it is needed to provide MedAlerto, maintain medical and operational records, resolve disputes, enforce agreements, and satisfy legal, regulatory, or tax obligations.",
      },
      {
        type: "callout",
        icon: FileDown,
        title: "Doctor-controlled export and deletion",
        value:
          "Doctors and authorized clinic administrators can export patient history and billing records or request that those records be permanently deleted. Upon a verified request, eligible records are permanently deleted from MedAlerto's active systems, subject to records we must retain by law or for a documented security and legal purpose.",
      },
      {
        type: "bullets",
        value: [
          "Export requests are verified against the requesting provider or clinic administrator before fulfillment.",
          "Deletion requests are reviewed for legal, clinical-record, tax, fraud-prevention, and dispute-hold requirements.",
          "When deletion is approved, we remove the eligible records from active production systems and follow our backup-retirement procedures.",
          "Providers may also request correction or update of inaccurate data under their control.",
        ],
      },
      {
        type: "text",
        value:
          "Patients should direct requests concerning records managed by a clinic to that healthcare provider. MedAlerto will assist the provider with processor-level data requests.",
      },
    ],
  },
  {
    id: "ownership-control",
    number: "8",
    title: "Data Ownership and Control",
    content: [
      {
        type: "bullets",
        value: [
          "Healthcare providers retain ownership and control over patient data entered into MedAlerto.",
          "MedAlerto processes patient and clinical data only on behalf of the provider and according to the provider's instructions.",
          "Patients interact with the system through access granted or managed by their healthcare provider.",
          "Providers are responsible for determining appropriate access, lawful use, and notices to patients.",
        ],
      },
    ],
  },
  {
    id: "international-processing",
    number: "9",
    title: "International Data Processing",
    content: [
      {
        type: "text",
        value:
          "MedAlerto may use infrastructure and service providers that operate in multiple geographic regions. Information may therefore be processed or stored outside the country where a user or patient is located.",
      },
      {
        type: "text",
        value:
          "Where required, we use appropriate contractual, technical, and organizational safeguards for international transfers and require providers to meet applicable security and data protection standards.",
      },
    ],
  },
  {
    id: "third-party-services",
    number: "10",
    title: "Third-Party Services",
    content: [
      {
        type: "text",
        value:
          "MedAlerto may integrate with third-party services such as Meta Cloud API, WhatsApp Business messaging, payment gateways, cloud infrastructure, and monitoring tools. Each provider receives only the information needed for its role.",
      },
      {
        type: "text",
        value:
          "Third-party services operate under their own privacy notices and terms. MedAlerto remains responsible for its instructions and contractual controls, while the third party is responsible for its own processing once it receives data under the applicable service relationship.",
      },
    ],
  },
  {
    id: "children-data",
    number: "11",
    title: "Children's Data",
    content: [
      {
        type: "text",
        value:
          "MedAlerto is not intended for direct use by minors. Information relating to minors is entered, accessed, and managed solely by authorized healthcare providers acting in the course of care and in accordance with applicable law.",
      },
    ],
  },
  {
    id: "policy-updates",
    number: "12",
    title: "Policy Updates",
    content: [
      {
        type: "text",
        value: "We may update this Privacy Policy to reflect:",
      },
      {
        type: "bullets",
        value: [
          "Changes in product functionality, infrastructure, or integrations",
          "Legal, regulatory, or contractual requirements",
          "Updates to our security, retention, or data-handling practices",
        ],
      },
      {
        type: "text",
        value:
          "The updated version will always include the latest effective date. We will provide additional notice when required. Continued use of the platform after an update indicates acceptance of the updated policy to the extent permitted by law.",
      },
    ],
  },
  {
    id: "contact",
    number: "13",
    title: "Contact Information",
    content: [
      {
        type: "text",
        value:
          "For privacy-related inquiries, provider data requests, Meta Business verification questions, or assistance with export and erasure requests, contact our privacy support channel:",
      },
      {
        type: "contact",
        value: "privacy@medalerto.com",
      },
      {
        type: "text",
        value:
          "Please include your name, clinic, request type, and enough detail for us to verify and route the request. Do not email unnecessary medical records or sensitive patient information.",
      },
    ],
  },
];

function BulletList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-2" />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SubsectionCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl mb-4 shadow-xs">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300">
            <Icon aria-hidden="true" className="h-4 w-4" />
          </span>
        ) : null}
        <div className={Icon ? "min-w-0" : "w-full"}>
          <h3 className="text-sm font-bold text-teal-800 dark:text-teal-300 mb-2 block">{item.title}</h3>
          {item.value ? (
            <p className="mb-3 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
              {item.value}
            </p>
          ) : null}
          {item.bullets ? <BulletList items={item.bullets} /> : null}
          {item.footer ? (
            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              {item.footer}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionContent({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        if (item.type === "text") {
          return (
            <p key={`${item.type}-${index}`} className="text-sm sm:text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200 mb-4">
              {item.value}
            </p>
          );
        }

        if (item.type === "bullets") {
          return <BulletList key={`${item.type}-${index}`} items={item.value} />;
        }

        if (item.type === "subsection") {
          return <SubsectionCard key={`${item.type}-${index}`} item={item} />;
        }

        if (item.type === "callout") {
          const Icon = item.icon;
          return (
            <div key={`${item.type}-${index}`} className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 dark:border-teal-800 dark:bg-teal-950/40">
              <div className="flex items-start gap-3">
                <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" />
                <div>
                  <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">{item.value}</p>
                </div>
              </div>
            </div>
          );
        }

        if (item.type === "contact") {
          return (
            <a
              key={`${item.type}-${index}`}
              href={`mailto:${item.value}`}
              className="group inline-flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-900 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-teal-400 dark:hover:bg-teal-950/50 dark:hover:text-teal-200 dark:focus:ring-offset-slate-900"
            >
              <Mail aria-hidden="true" className="h-4 w-4 text-teal-700 dark:text-teal-300" />
              <span>Email: {item.value}</span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          );
        }

        return null;
      })}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main className="px-4 pb-24 pt-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-8 xl:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-28 xl:self-start">
              <nav aria-label="Privacy policy sections" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                  <LockKeyhole aria-hidden="true" className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  <span>On this page</span>
                </div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-1.5 xl:overflow-visible">
                  {quickLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="inline-flex shrink-0 items-center rounded-lg px-2 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-slate-300 dark:hover:bg-teal-950/50 dark:hover:text-teal-200"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </nav>
            </aside>

            <article className="privacy-policy-frame w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm max-w-4xl mx-auto">
              <header className="border-b border-slate-200 pb-8 dark:border-slate-800">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span aria-hidden="true" className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>Legal Compliance &amp; Data Protection</span>
                </div>
                <h1 className="mt-5 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                  MedAlerto Privacy Policy
                </h1>
                <p className="mt-4 max-w-3xl text-sm sm:text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                  Protecting clinical and patient data is central to how MedAlerto is architected and operated.
                </p>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-1.5 rounded-full inline-block mt-3">
                  Effective Date: April 7, 2026
                </span>
              </header>

              <div>
                {sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-32 border-b border-slate-200 pb-8 last:border-b-0 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 mt-8 flex items-center gap-2">
                      <span className="text-sm font-extrabold text-teal-700 dark:text-teal-300">
                        {section.number}.
                      </span>
                      {section.title}
                    </h2>
                    <SectionContent items={section.content} />
                  </section>
                ))}
              </div>

              <div className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-6 rounded-2xl flex items-center justify-between text-teal-900 dark:text-teal-200 text-sm font-bold mt-10 gap-4 max-sm:flex-col max-sm:items-start">
                <div className="flex items-start gap-3">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p>Statement of Trust</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-teal-800 dark:text-teal-300">
                      Your trust is our priority. We are committed to transparent, purpose-limited data practices.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em]">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  <span>Provider controlled</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
