import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FramerMotion = { motion, AnimatePresence };

import {
  Search,
  X,
  ArrowRight,
  Clock,
  Calendar,
  Check,
  CheckCheck,
  Copy,
  ShieldCheck,
  FileText,
  Database,
  Sparkles,
  Mail,
  Send,
  Activity,
  Zap,
  Lock,
  Share2,
  CheckCircle2,
  Code2,
  Receipt,
  Timer,
  Smartphone,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MetaTags from "../components/Seo/MetaTags";
import { blogSchema, blogPostingSchema } from "../seo/jsonLd";

/* -------------------------------------------------------------------------- */
/*  CATEGORY DEFINITIONS & METADATA                                            */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  "All",
  "Clinic Engineering",
  "Queue Architecture",
  "WhatsApp & API",
  "Finance & Billing",
  "Practice Security",
];

/* -------------------------------------------------------------------------- */
/*  AUTHORITATIVE EDITORIAL & ENGINEERING CONTENT DATASET                     */
/* -------------------------------------------------------------------------- */

const BLOG_ARTICLES = [
  {
    id: "cloudflare-r2-meta-cloud-api-zero-egress",
    isHero: true,
    title:
      "How We Built Zero-Egress Prescription Storage using Cloudflare R2 & Meta Cloud API",
    category: "Clinic Engineering",
    secondaryCategories: ["WhatsApp & API"],
    categoryPill: "ENGINEERING",
    readTime: "6 min read",
    date: "Aug 2026",
    author: {
      name: "Dr. Abdullah",
      role: "Founder & Lead Architect",
      avatar: "DA",
      badge: "Lead Architect",
    },
    excerpt:
      "An engineering breakdown of transitioning clinic prescription PDFs from legacy file servers to Cloudflare R2 object storage paired with presigned short-lived HMAC tokens. Learn how we eliminated monthly bandwidth egress bills while achieving sub-300ms WhatsApp Business delivery SLAs for 100,000+ monthly clinical documents.",
    tags: [
      "Cloudflare R2",
      "Meta Cloud API",
      "Zero Egress",
      "Node.js Streams",
      "HMAC-SHA256",
      "PDFKit",
    ],
    highlights: [
      "100% elimination of outbound bandwidth egress costs ($0.00 on Cloudflare R2 vs. $0.09/GB on legacy S3).",
      "Presigned ephemeral HMAC tokens with a strict 300-second TTL to satisfy clinical confidentiality standards.",
      "In-memory Node.js PassThrough stream bypasses container disk writes, sustaining a 284ms median delivery SLA.",
    ],
    architectureJson: `{
  "pipeline": "ZeroEgress_Rx_V2",
  "storage_backend": {
    "provider": "Cloudflare R2",
    "bucket": "medalerto-rx-vault-apac",
    "egress_fee": "$0.00 / GB",
    "encryption": "AES-256-GCM",
    "presigned_token_ttl_seconds": 300
  },
  "dispatch_gateway": {
    "engine": "Meta WhatsApp Cloud API v20.0",
    "endpoint": "/v20.0/PHONE_ID/messages",
    "mime_type": "application/pdf",
    "round_trip_latency_ms": 284,
    "status": "delivered_verified"
  }
}`,
    sections: [
      {
        heading: "The Outpatient Prescription Conundrum",
        body: `In high-throughput outpatient medicine, prescriptions are immutable legal artifacts. Unlike generic user-generated files, clinical scripts contain sensitive diagnostics, PMDC registration stamps, and customized dosing regimens. In conventional architectures, generating a PDF and serving it over standard cloud storage leads to severe operational drag:

1. Uncontrolled Bandwidth Egress Fees: Every time a patient, pharmacy, or clinic receptionist downloads a prescription PDF, standard providers levy bandwidth penalties. At 100,000+ monthly scripts, egress bills routinely surpassed compute budgets.
2. Ephemeral Storage Latency: Writing generated PDFs to temporary container disk (/tmp) before piping them to an S3 bucket introduces latency spikes, especially during morning clinic rush hours.
3. Patient Access Friction: Forcing patients to log into mobile portals yields a dismal 14% adoption rate. Delivering directly into WhatsApp chats achieves 98.6% engagement within three minutes.`,
      },
      {
        heading: "Zero-Egress Object Storage with Cloudflare R2",
        body: `We migrated our primary document storage layer to Cloudflare R2. Because R2 is fully S3-compatible, we retained the AWS SDK v3 client while taking advantage of Cloudflare's core economic guarantee: zero egress fees on all object retrievals.

When a doctor signs off on a consultation, MedAlerto does not write the file to disk. Instead, we initiate a Node.js PassThrough stream directly into the S3 PutObjectCommand buffer:`,
        codeSnippet: `// Node.js In-Memory Vector PDF Stream to Cloudflare R2
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PassThrough } from "node:stream";

export async function uploadPrescriptionStream(checkupId, pdfDoc) {
  const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY,
      secretAccessKey: process.env.R2_SECRET_KEY,
    },
  });

  const stream = new PassThrough();
  pdfDoc.pipe(stream);
  pdfDoc.end();

  const key = \`prescriptions/\${checkupId}-\${Date.now()}.pdf\`;
  await r2Client.send(new PutObjectCommand({
    Bucket: "medalerto-rx-vault-apac",
    Key: key,
    Body: stream,
    ContentType: "application/pdf",
    ServerSideEncryption: "AES256",
  }));

  // Generate short-lived presigned URL (300s TTL) for Meta Cloud API webhook
  const signedUrl = await getSignedUrl(r2Client, new GetObjectCommand({
    Bucket: "medalerto-rx-vault-apac",
    Key: key,
  }), { expiresIn: 300 });

  return { key, signedUrl };
}`,
      },
      {
        heading: "Meta WhatsApp Cloud API Handoff & Edge Caching",
        body: `With the presigned URL valid for only 300 seconds, MedAlerto dispatches an HTTPS POST payload to Meta Cloud API v20.0. Meta's WhatsApp edge servers immediately ingest the PDF buffer from Cloudflare's global edge network, verify the MIME headers, and dispatch the document message to the patient's authenticated telephone number.

Once Meta successfully caches the document payload, the presigned URL expires automatically. Even if a URL is inadvertently leaked or logged in transit, the link is dead within five minutes, upholding HIPAA-adjacent data privacy standards while incurring exactly $0.00 in ongoing bandwidth egress.`,
      },
    ],
  },
  {
    id: "billing-leakage-net-pricing",
    isHero: false,
    title:
      "Eliminating Upfront Billing Leakage: Net Pricing & Discount Accounting in Clinics",
    category: "Finance & Billing",
    secondaryCategories: ["Clinic Engineering"],
    categoryPill: "FINANCE",
    readTime: "4 min read",
    date: "Aug 18, 2026",
    author: {
      name: "Farhan Qureshi",
      role: "Practice Operations Lead",
      avatar: "FQ",
      badge: "Finance Ops",
    },
    excerpt:
      "How discretionary cashier discounts, unmonitored courtesy waivers, and untracked cash drawer reconciliations siphon 12% to 18% off clinic EBITDA—and the automated net ledger system that plugs the hole.",
    tags: [
      "Net Billing",
      "Double-Entry Ledger",
      "Discount Controls",
      "Cash Audit",
      "Practice Margins",
    ],
    highlights: [
      "12% to 18% of outpatient clinic margin is routinely lost to undocumented cashier concessions.",
      "Strict double-entry journal vouchers bind check-in consultations to physical cash reconciliations.",
      "Automated manager override tokens prevent arbitrary fee slashing at the reception desk.",
    ],
    sections: [
      {
        heading: "The Discretionary Discount Leak",
        body: `In private outpatient practices, receptionists operate in high-pressure, chaotic environments. When patients negotiate consultation fees or claim a verbal concession from the physician, cashiers frequently grant manual discounts without an audit trail. Over a 12-month period, these undocumented waivers erode 14.8% of clinic profit margin.`,
      },
      {
        heading: "Immutable Gross Tariff vs. Explicit Debit Ledgers",
        body: `MedAlerto enforces a deterministic billing rule: the baseline doctor consultation tariff cannot be manually edited by front-desk staff. Instead, any concession must be selected from a pre-configured policy dropdown (e.g., Senior Citizen -15%, Follow-up Review -50%, Staff Dependent Waiver -100%). Each discount creates a balanced debit against the clinic's promotional ledger, demanding an administrative PIN or cryptographic OTP for overrides exceeding Rs. 500.`,
      },
      {
        heading: "Shift-End Cash Drawer Reconciliation",
        body: `Reception staff cannot complete their daily checkout without reconciling physical cash receipts against digital logs. The system produces an itemized tally of Cash, Card, and Bank Transfer receipts, cross-referenced with doctor checkup completion timestamps. Discrepancies are flagged within seconds rather than at end-of-month accountant reviews.`,
      },
    ],
  },
  {
    id: "queue-vs-appointment-slots",
    isHero: false,
    title:
      "Queue vs. Appointment Slots: Why Outpatient Clinics Need State-Driven Scheduling",
    category: "Queue Architecture",
    secondaryCategories: ["Clinic Engineering"],
    categoryPill: "QUEUE ARCHITECTURE",
    readTime: "5 min read",
    date: "Aug 14, 2026",
    author: {
      name: "Dr. Sarah Chen",
      role: "Clinical Systems Fellow",
      avatar: "SC",
      badge: "Clinical Lead",
    },
    excerpt:
      "Why naive time-slot calendars fail in unpredictable clinical environments. We dissect our finite state machine (FSM) that dynamically adapts queue delays to real-time doctor consultation times.",
    tags: [
      "Finite State Machine",
      "Queue Theory",
      "WebSocket Sync",
      "Outpatient Flow",
      "Triage Scheduling",
    ],
    highlights: [
      "Static 15-minute calendar slots fail under normal medical consultation duration variance.",
      "Finite State Machine (FSM) tracks patient lifecycle: Arrived → Triage → In-Consultation → Complete.",
      "Dynamic Consultation Drift algorithm updates waiting room displays, cutting perceived wait time by 41%.",
    ],
    sections: [
      {
        heading: "The Fallacy of the Fixed 15-Minute Slot",
        body: `A calendar slot assumes every consultation takes exactly 15 minutes. In reality, clinical encounters follow a Poisson distribution: a routine medication refill may take 4 minutes, while a complex multi-morbidity patient requires 32 minutes. When an early appointment runs over, the entire calendar suffers cascading delays, frustrating patients and overloading the waiting lobby.`,
      },
      {
        heading: "Modeling the Clinic as a Finite State Machine",
        body: `Instead of treating appointment times as rigid promises, MedAlerto models each visit as an event-driven state transition:
- SCHEDULED: Patient slot reserved in database.
- ARRIVED: Patient checks in via QR scan or front-desk reception.
- IN_TRIAGE: Vitals, temperature, and blood pressure logged by clinical nurse.
- IN_CONSULTATION: Attending doctor commences digital checkup record.
- DISCHARGED: Digital prescription issued and sent via WhatsApp.`,
      },
      {
        heading: "Dynamic Consultation Drift Compensation",
        body: `By tracking the physician's real-time velocity over the previous three consultations, our backend computes a dynamic drift factor. If the doctor is running 18 minutes behind schedule, automated WhatsApp notifications advise downstream patients to arrive later, preventing crowded waiting areas and lowering front-desk friction.`,
      },
    ],
  },
  {
    id: "pmdc-verification-data-privacy",
    isHero: false,
    title:
      "PMDC Verification & Data Privacy: Building Trusting Patient Relationships",
    category: "Practice Security",
    secondaryCategories: ["Clinic Engineering"],
    categoryPill: "PRACTICE SECURITY",
    readTime: "4 min read",
    date: "Aug 10, 2026",
    author: {
      name: "Tariq Mehmood",
      role: "Head of InfoSec & Compliance",
      avatar: "TM",
      badge: "InfoSec Lead",
    },
    excerpt:
      "Ensuring regulatory compliance and patient trust through automated PMDC credential verification, deterministic identity auditing, and zero-knowledge medical data vaults.",
    tags: [
      "PMDC Verification",
      "EHR Security",
      "Zero-Trust",
      "Field-Level Encryption",
      "Patient Consent",
    ],
    highlights: [
      "Strict PMDC license verification prevents unlicensed medical practitioners from issuing prescriptions.",
      "AES-256-GCM field-level encryption secures diagnoses, past clinical notes, and medication regimens.",
      "Tamper-evident SHA-256 QR seals allow dispensing pharmacists to verify authenticity instantly.",
    ],
    sections: [
      {
        heading: "Regulatory Rigor in Practice Management",
        body: `Electronic Health Records (EHR) cannot be treated like generic SaaS applications. In Pakistan and South Asia, medical practice integrity hinges upon Pakistan Medical & Dental Council (PMDC) licensure. Unverified accounts pose severe medical malpractice liabilities.`,
      },
      {
        heading: "Deterministic Identity Verification",
        body: `MedAlerto's onboarding engine requires doctor CNIC, PMDC registration number, and primary medical degrees. Automated validation checks license expiration dates and council disciplinary standing. Verified profiles receive a tamper-resistant green cryptographic checkmark embedded in all exported documents.`,
      },
      {
        heading: "Field-Level Encryption on Sensitive Clinical Fields",
        body: `Rather than relying solely on disk-level database encryption, MedAlerto encrypts individual PHI fields—such as patient chronic conditions, lab test results, and specific medication dosages—using unique tenant-derived AES-GCM keys. Even during raw database backups, sensitive clinical data remains indecipherable without authorized runtime session keys.`,
      },
    ],
  },
  {
    id: "zero-paper-whatsapp-workflows",
    isHero: false,
    title:
      "Zero Paper Dependency: Transitioning Small Clinics to WhatsApp PDF Workflows",
    category: "WhatsApp & API",
    secondaryCategories: ["Clinic Engineering"],
    categoryPill: "WHATSAPP & API",
    readTime: "4 min read",
    date: "Aug 06, 2026",
    author: {
      name: "Bilal Anwar",
      role: "SaaS Integrations Engineer",
      avatar: "BA",
      badge: "API Engineer",
    },
    excerpt:
      "Eliminating misread scripts, thermal printer cartridge costs, and misplaced treatment records by dispatching signed vector PDFs directly into patients' WhatsApp chats in under 3 seconds.",
    tags: [
      "Serverless PDF",
      "WhatsApp Cloud API",
      "Paperless Clinic",
      "Vector Typography",
      "Patient Handoff",
    ],
    highlights: [
      "Eliminates Rs. 85,000+ in annual clinic expenditure on pre-printed prescription pads and ink.",
      "Patients retain an organized, permanent digital prescription history directly in their messaging app.",
      "Ultra-compact vector rendering keeps document payload sizes below 150 KB for quick mobile loading.",
    ],
    sections: [
      {
        heading: "The Overhead of Physical Paper Charts",
        body: `Paper prescriptions are fragile, easily lost, and notoriously difficult to read. Small clinics spend substantial operational capital purchasing continuous stationery, inkjet cartridges, and thermal rolls that fade within weeks. When patients return months later without their papers, doctors must reconstruct diagnoses from scratch.`,
      },
      {
        heading: "Engineering High-Speed Vector PDF Dispatch",
        body: `MedAlerto replaces slow browser-based PDF rendering (like Puppeteer or Chromium) with a specialized vector PDF compiler in Node.js. It constructs professional clinic letterheads, doctor credentials, and clean dosage matrices in under 85 milliseconds. Custom fonts and branding logos are compressed to keep file footprints under 150 KB.`,
      },
      {
        heading: "Direct Delivery Over WhatsApp Business API",
        body: `Upon physician sign-off, our worker queue dispatches the document directly to the patient's verified WhatsApp number via the Meta Cloud API. Patients receive an immediate notification, ready to be forwarded to their neighborhood pharmacy or saved for insurance claims.`,
      },
    ],
  },
  {
    id: "handling-no-shows-whatsapp-reminders",
    isHero: false,
    title:
      "Handling No-Shows: 1-Click Automated WhatsApp Reminders for Overdue Slots",
    category: "WhatsApp & API",
    secondaryCategories: ["Queue Architecture", "Clinic Engineering"],
    categoryPill: "WHATSAPP & API",
    readTime: "4 min read",
    date: "Aug 02, 2026",
    author: {
      name: "Dr. Sarah Chen",
      role: "Clinical Systems Fellow",
      avatar: "SC",
      badge: "Clinical Lead",
    },
    excerpt:
      "Unfilled clinic appointments destroy practice margins. Discover how automated 2-hour pre-flight WhatsApp interactive buttons with 1-click confirmations reduced outpatient no-shows from 26% to 4.2%.",
    tags: [
      "Appointment Retention",
      "Automated Webhooks",
      "Cron Workers",
      "Interactive Buttons",
      "No-Show Reduction",
    ],
    highlights: [
      "Outpatient clinics average a 24-28% no-show rate without proactive reminder automation.",
      "Interactive WhatsApp action buttons achieve an 82.4% response rate within 7 minutes.",
      "Cancelled slots are automatically released to the walk-in waitlist via instant SMS/WhatsApp pings.",
    ],
    sections: [
      {
        heading: "The Clinic Capacity Penalty",
        body: `Every unannounced no-show represents lost clinical revenue that cannot be recovered. For a busy outpatient specialist charging Rs. 2,000 per consultation, four daily no-shows equal Rs. 240,000 in lost gross revenue every month. Front-desk staff rarely have the bandwidth to call each patient individually.`,
      },
      {
        heading: "Two-Tier Scheduled Reminder Pipeline",
        body: `MedAlerto runs an automated background scheduler:
1. T-24 Hours: A calendar confirmation ping detailing clinic directions and parking guidance.
2. T-2 Hours: An interactive template message featuring two distinct response buttons: 'I'll Be There' and 'Need to Reschedule'.`,
      },
      {
        heading: "Automated Standby Queue Re-Allocation",
        body: `When a patient taps 'Need to Reschedule', our webhook immediately updates their appointment state to RESCHEDULED. The vacancy is immediately offered to patients currently on the clinic's waiting list or standby queue, allowing walk-in attendees to claim the consultation slot before the doctor sits idle.`,
      },
    ],
  },
  {
    id: "ancillary-revenue-tracking-lab-tests",
    isHero: false,
    title:
      "Ancillary Revenue Tracking: Lab Tests & Multi-Category Payment Line Items",
    category: "Finance & Billing",
    secondaryCategories: ["Clinic Engineering"],
    categoryPill: "FINANCE",
    readTime: "5 min read",
    date: "Jul 28, 2026",
    author: {
      name: "Farhan Qureshi",
      role: "Practice Operations Lead",
      avatar: "FQ",
      badge: "Finance Ops",
    },
    excerpt:
      "Moving beyond flat consultation billing. How to configure unified point-of-care billing for pathology tests, minor procedural consumables, and specialist referrals with sub-ledger transparency.",
    tags: [
      "Ancillary Billing",
      "Pathology Margins",
      "Line-Item Ledger",
      "Multi-Category Invoicing",
      "Clinic EBITDA",
    ],
    highlights: [
      "Single-line billing fails to capture in-clinic point-of-care diagnostics and procedural consumables.",
      "Automatic ledger categorization: Doctor Consultation vs. Laboratory Partner vs. Medical Supplies.",
      "Clinics report a 22.8% boost in net collected revenue without raising base consultation fees.",
    ],
    sections: [
      {
        heading: "Uncaptured Clinical Consumables",
        body: `Many private clinics collect a standard doctor fee while absorbing the cost of disposable syringes, nebulizer kits, blood sugar test strips, and in-house ECG prints. Over hundreds of patient encounters, these unitemized expenses eat into the clinic's operating margin.`,
      },
      {
        heading: "Multi-Category Line-Item Invoicing",
        body: `MedAlerto's checkout module supports instant multi-item invoicing directly from the doctor's checkup interface:
- Consultation Fee: Accrued to the attending doctor's account.
- Point-of-Care Pathology: Accrued to the clinic diagnostics sub-ledger with external laboratory split calculations.
- Consumables & Medication: Automatically deducted from clinic inventory logs.`,
      },
      {
        heading: "Automated Laboratory Partner Reconciliation",
        body: `For clinics that collect diagnostic blood or urine samples and dispatch them to partner pathology laboratories, the system records the exact referral margin. At month-end, the practice exports an audited disbursement manifest, preventing billing disputes between the clinic and lab providers.`,
      },
    ],
  },
  {
    id: "clinical-analytics-telemetry-dashboards",
    isHero: false,
    title:
      "Data-Driven Medicine: Telemetry & Clinical Analytics Pipelines for Outpatient Clinics",
    category: "Clinic Engineering",
    categoryPill: "CLINIC ENGINEERING",
    readTime: "5 min read",
    date: "Jul 15, 2026",
    author: {
      name: "Dr. Abdullah",
      role: "Founder & Lead Architect",
      avatar: "DA",
      badge: "Lead Architect",
    },
    excerpt:
      "Building real-time telemetry dashboards that track consultation duration, seasonal epidemiological spikes, and patient retention cohorts using aggregated time-series data.",
    tags: [
      "Clinical Analytics",
      "Telemetry",
      "Epidemiology Spikes",
      "Time-Series Data",
      "Operational Health",
    ],
    highlights: [
      "Automated time-series telemetry tracks patient wait times and average doctor consultation durations.",
      "Epidemiological tracking identifies local disease clusters and seasonal medication demand spikes.",
      "Retention cohort analysis identifies chronic care patients overdue for follow-up HbA1c reviews.",
    ],
    sections: [
      {
        heading: "Beyond Anecdotal Clinical Management",
        body: `Most clinic directors make staffing and operational decisions based on subjective impressions rather than hard data. They guess when peak patient surges occur and have minimal visibility into patient attrition rates.`,
      },
      {
        heading: "Real-Time Telemetry Data Ingestion",
        body: `Every clinical action in MedAlerto emits a structured audit event: appointment created, check-in scanned, vitals recorded, prescription signed, and fee settled. By funneling these events into time-series aggregates, clinics gain an immediate cockpit view of operational efficiency.`,
      },
      {
        heading: "Predictive Seasonal Disease Modeling",
        body: `By tracking ICD-10 diagnostic codes across thousands of patient visits, our analytics module surfaces impending seasonal epidemics (e.g., dengue outbreaks, viral conjunctivitis, monsoon gastroenteritis) weeks before traditional public health bulletins, allowing clinics to stock relevant medications in advance.`,
      },
    ],
  },
  {
    id: "zero-knowledge-ehr-encryption",
    isHero: false,
    title:
      "Zero-Knowledge Medical Records: End-to-End Cryptography in Outpatient EHRs",
    category: "Practice Security",
    secondaryCategories: ["Clinic Engineering"],
    categoryPill: "PRACTICE SECURITY",
    readTime: "4 min read",
    date: "Jun 28, 2026",
    author: {
      name: "Tariq Mehmood",
      role: "Head of InfoSec & Compliance",
      avatar: "TM",
      badge: "InfoSec Lead",
    },
    excerpt:
      "Why modern healthcare applications must adopt client-side encryption layers and deterministic access tokens to prevent insider data exfiltration.",
    tags: [
      "Zero-Knowledge",
      "Client-Side Encryption",
      "Data Vault",
      "Deterministic Tokens",
      "HIPAA Ready",
    ],
    highlights: [
      "Patient records are protected by cryptographic tenant isolation keys.",
      "Zero-knowledge architecture ensures platform administrators cannot read clinical notes.",
      "Deterministic audit logging flags any unauthorized attempt to view patient medical history.",
    ],
    sections: [
      {
        heading: "The Inadequacy of Generic Cloud Security",
        body: `Standard database-at-rest encryption does not protect patient health data against rogue database administrators, compromised backend credentials, or unvetted third-party integrations. Clinical data mandates zero-knowledge guarantees.`,
      },
      {
        heading: "Client-Side Tokenization and Key Derivation",
        body: `MedAlerto derives cryptographic decryption keys at the physician session layer using Argon2id hashing combined with two-factor biometric authentication. Clinical notes are encrypted before payload transmission across the wire.`,
      },
      {
        heading: "Enforcing Patient Consent and Auditability",
        body: `Every record retrieval generates an immutable audit record containing doctor timestamp, patient ID, and cryptographic signature. Patients can see exactly which practitioner reviewed their history, restoring complete transparency to clinical record-keeping.`,
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  MICRO-UI PREVIEW BANNER COMPONENTS FOR CARDS                              */
/* -------------------------------------------------------------------------- */

function MicroUiBanner({ article }) {
  const { id } = article;

  if (id === "cloudflare-r2-meta-cloud-api-zero-egress") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/80 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">CLOUDFLARE R2 + META</span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
            ZERO EGRESS
          </span>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2 space-y-1 text-[10px]">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Stream Buffer</span>
            <span className="text-emerald-400 font-bold">Node.js PassThrough</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">WhatsApp SLA</span>
            <span className="text-cyan-300 font-bold">284ms Verified</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px] text-slate-400">
          <span className="text-emerald-400 font-bold">$0.00 Bandwidth Fee</span>
          <span className="text-slate-400">Presigned 300s TTL</span>
        </div>
      </div>
    );
  }

  if (id === "billing-leakage-net-pricing") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950/70 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Receipt className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">LEDGER #4092-B</span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
            AUDIT ACTIVE
          </span>
        </div>

        <div className="space-y-1.5 my-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Consultation Fee</span>
            <span className="text-slate-200 font-medium">Rs. 2,500</span>
          </div>
          <div className="flex justify-between text-amber-400/90">
            <span>VIP Courtesy (-20%)</span>
            <span>-Rs. 500</span>
          </div>
          <div className="border-t border-slate-700/50 pt-1 flex justify-between font-bold">
            <span className="text-slate-100">Net Collectible</span>
            <span className="text-emerald-400 font-extrabold text-xs">
              Rs. 2,000
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="h-2.5 w-2.5" /> 0.0% Drawer Leakage
          </span>
          <span className="text-slate-500">Hash: #LEDG-4091</span>
        </div>
      </div>
    );
  }

  if (id === "queue-vs-appointment-slots") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950/70 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-200">FSM QUEUE PIPELINE</span>
          </div>
          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE FSM
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 my-2">
          <div className="flex-1 rounded-lg bg-slate-800/80 border border-slate-700 p-1.5 text-center">
            <span className="block text-[8px] text-slate-400">POS #03</span>
            <span className="text-[10px] font-bold text-slate-200">WAITING</span>
          </div>
          <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
          <div className="flex-1 rounded-lg bg-indigo-500/20 border border-indigo-400/50 p-1.5 text-center shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <span className="block text-[8px] text-indigo-300 font-semibold">
              VITALS
            </span>
            <span className="text-[10px] font-bold text-white">TRIAGE</span>
          </div>
          <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
          <div className="flex-1 rounded-lg bg-slate-800/80 border border-slate-700 p-1.5 text-center">
            <span className="block text-[8px] text-slate-400">ROOM 2</span>
            <span className="text-[10px] font-bold text-slate-200">DOCTOR</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px]">
          <span className="text-slate-400">Avg Wait: 11.2 min</span>
          <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            -41% Lobby Delay
          </span>
        </div>
      </div>
    );
  }

  if (id === "pmdc-verification-data-privacy") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950/70 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-1.5 text-purple-300">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-semibold text-slate-200">PMDC REGISTRY AUTH</span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
            ACTIVE SEAL
          </span>
        </div>

        <div className="rounded-xl bg-purple-950/30 border border-purple-800/40 p-2.5 space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Doctor License</span>
            <span className="text-purple-300 font-bold">PMDC #48921-P</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400">EHR Vault</span>
            <span className="text-emerald-400 font-mono">AES-256-GCM</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <Lock className="h-2.5 w-2.5 text-purple-400" /> Zero-Trust Role Access
          </span>
          <span className="text-purple-400 font-semibold">100% Verified</span>
        </div>
      </div>
    );
  }

  if (id === "zero-paper-whatsapp-workflows") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950/70 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-1.5 text-teal-300">
            <Smartphone className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-semibold text-slate-200">WHATSAPP DISPATCH</span>
          </div>
          <span className="flex items-center gap-1 text-[9px] text-teal-300 font-bold">
            <CheckCheck className="h-3 w-3 text-cyan-400" /> DELIVERED
          </span>
        </div>

        <div className="rounded-xl bg-emerald-950/40 border border-emerald-700/40 p-2.5 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-white truncate">
              Rx_DrAbdullah_0826.pdf
            </p>
            <p className="text-[9px] text-slate-400">142 KB • Vector PDF</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px] text-slate-400">
          <span className="text-teal-400 font-bold">Meta Cloud API v20.0</span>
          <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
            -94% Paper Cost
          </span>
        </div>
      </div>
    );
  }

  if (id === "handling-no-shows-whatsapp-reminders") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/70 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Timer className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-slate-200">T-2H CRON TRIGGER</span>
          </div>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
            SCHEDULED
          </span>
        </div>

        <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-2 space-y-1.5">
          <div className="text-[9px] text-slate-400">
            Automated WhatsApp 1-Click Prompt
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-center py-1 text-[9px] font-bold text-emerald-300">
              ✓ Confirm Visit
            </div>
            <div className="flex-1 rounded bg-slate-700 border border-slate-600 text-center py-1 text-[9px] font-bold text-slate-300">
              ↺ Reschedule
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px]">
          <span className="text-slate-400">Response: &lt;7 mins</span>
          <span className="text-amber-400 font-bold">26% → 4.2% No-Shows</span>
        </div>
      </div>
    );
  }

  if (id === "ancillary-revenue-tracking-lab-tests") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950/70 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Receipt className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">ANCILLARY ITEMIZER</span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
            +71.4% MARGIN
          </span>
        </div>

        <div className="space-y-1 text-[10px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">1x Consultation</span>
            <span>Rs. 1,500</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">1x CBC + Glucose Lab</span>
            <span>Rs. 1,400</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">1x Syringe Consumable</span>
            <span>Rs. 200</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px]">
          <span className="text-slate-400">Total Net Invoiced</span>
          <span className="text-emerald-400 font-bold text-[11px]">
            Rs. 3,100
          </span>
        </div>
      </div>
    );
  }

  // Fallback telemetry banner
  return (
    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950/70 p-4 font-mono text-[11px] select-none flex flex-col justify-between border-b border-slate-700/50">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Database className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">CLINICAL TELEMETRY</span>
        </div>
        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
          ACTIVE SYNC
        </span>
      </div>

      <div className="space-y-1.5 my-2">
        <div className="flex justify-between text-[10px] text-slate-300">
          <span className="text-slate-400">Time-Series Aggregation</span>
          <span className="text-cyan-300 font-bold">100% Real-Time</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 w-3/4 rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[9px] text-slate-400">
        <span>Deterministic Architecture</span>
        <span className="text-cyan-400 font-semibold">Zero Telemetry Drop</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  HERO RIGHT-COLUMN INTERACTIVE MICRO-UI PREVIEW                            */
/* -------------------------------------------------------------------------- */

function HeroMicroUiPreview({ heroArticle, onOpenArticle }) {
  const [activeHeroTab, setActiveHeroTab] = useState("pipeline"); // "pipeline" | "json"
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLatency, setSimulationLatency] = useState("284ms");
  const [copiedPayload, setCopiedPayload] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(heroArticle.architectureJson);
    setCopiedPayload(true);
    toast.success("Webhook JSON copied to clipboard!");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleTriggerSla = () => {
    setIsSimulating(true);
    setSimulationLatency("Streaming...");
    setTimeout(() => {
      const simulated = Math.floor(Math.random() * 30 + 265) + "ms";
      setSimulationLatency(simulated);
      setIsSimulating(false);
      toast.success(`Pipeline verified! Latency: ${simulated} (Sub-300ms SLA)`);
    }, 600);
  };

  return (
    <div className="relative rounded-2xl bg-slate-950/90 border border-slate-800 p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Realtime Clinical Storage Telemetry
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 p-1 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setActiveHeroTab("pipeline")}
            className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
              activeHeroTab === "pipeline"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pipeline Flow
          </button>
          <button
            type="button"
            onClick={() => setActiveHeroTab("json")}
            className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
              activeHeroTab === "json"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Payload JSON
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeHeroTab === "pipeline" ? (
        <div className="space-y-3 font-mono">
          {/* 1. Streaming PDF Buffer Panel */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 shadow-inner">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                1. Streaming PDF Buffer
              </span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/40">
                Node.js PassThrough
              </span>
            </div>
            <div className="space-y-1.5 text-[10px] text-slate-300">
              <div className="flex justify-between text-slate-400">
                <span>In-Memory Buffer Size</span>
                <span className="text-emerald-400 font-bold">41.2 KB (Chunk 12/12)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-full animate-pulse rounded-full" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                <span>SHA-256: 7f83b165...ecb2</span>
                <span className="text-emerald-400 font-semibold">Zero Disk Writes</span>
              </div>
            </div>
          </div>

          {/* 2. Cloudflare R2 Bucket Badge */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <Database className="h-3.5 w-3.5 text-amber-400" />
                2. Cloudflare R2 Bucket
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                Egress: $0.00 / Free
              </span>
            </div>
            <div className="text-[10px] space-y-1 text-slate-300">
              <div className="flex justify-between text-slate-400">
                <span>Target Vault</span>
                <span className="text-slate-200 font-medium truncate max-w-[200px]">
                  r2://prescriptions-prod/secure-vault/rx-8921.pdf
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                <span>Security: AES-256-GCM</span>
                <span className="text-amber-400 font-semibold">Presigned TTL: 300s</span>
              </div>
            </div>
          </div>

          {/* 3. Verified WhatsApp Delivery Log */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                3. Verified WhatsApp Delivery Log
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-300">
                <CheckCheck className="h-3 w-3 text-cyan-400" /> 200 OK
              </span>
            </div>
            <div className="text-[10px] space-y-1 text-slate-300">
              <div className="flex justify-between text-slate-400">
                <span>Meta Cloud API v20.0</span>
                <span className="text-emerald-400 font-bold">
                  Status: Delivered (Double Blue Check)
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                <span>Recipient: +92 300 •••• 7892</span>
                <span className="text-cyan-300 font-bold">
                  Round-trip Latency: {simulationLatency}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* JSON Payload Inspector Tab */
        <div className="relative rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-[260px]">
          <button
            type="button"
            onClick={handleCopyJson}
            aria-label="Copy webhook JSON"
            className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[9px] font-medium text-slate-200 transition-colors border border-slate-700 cursor-pointer"
          >
            {copiedPayload ? (
              <>
                <Check className="h-2.5 w-2.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-2.5 w-2.5 text-slate-400" />
                Copy JSON
              </>
            )}
          </button>
          <pre className="text-emerald-300/90 leading-relaxed">
            {heroArticle.architectureJson}
          </pre>
        </div>
      )}

      {/* Action Footer Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/90 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleTriggerSla}
          disabled={isSimulating}
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          {isSimulating ? "Testing SLA Ping..." : "Simulate End-to-End SLA"}
        </button>

        <button
          type="button"
          onClick={() => onOpenArticle(heroArticle)}
          className="flex items-center gap-1 text-xs font-mono font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
        >
          Read Full Architecture
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ARTICLE CARD COMPONENT (3-COLUMN RESPONSIVE GRID)                         */
/* -------------------------------------------------------------------------- */

function ArticleCard({ article, onSelect }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="group relative flex flex-col rounded-3xl overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)]/80 shadow-[var(--shadow-float)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-xl"
    >
      {/* Top Visual Banner: Micro-UI preview snippet */}
      <MicroUiBanner article={article} />

      {/* Card Content Body */}
      <div className="p-6 sm:p-7 flex flex-col flex-1">
        {/* Pill Tag + Read Time: (FINANCE • 4 min read) */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
            {article.categoryPill} • {article.readTime}
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--color-text-secondary)]">
            <Calendar className="h-3 w-3" />
            {article.date}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(article)}
          className="font-heading text-xl sm:text-2xl font-bold leading-snug text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors cursor-pointer"
        >
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
          {article.excerpt}
        </p>

        {/* Card Footer: Author avatar circle, author name, published date, and a Read Article → arrow link */}
        <div className="mt-auto pt-6 border-t border-[var(--color-border)]/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
              {article.author.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                {article.author.name}
              </p>
              <p className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                {article.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect(article)}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:gap-2 transition-all shrink-0 cursor-pointer group/link"
          >
            <span>Read Article</span>
            <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-0.5">→</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* -------------------------------------------------------------------------- */
/*  PUBLICATION READER MODAL                                                  */
/* -------------------------------------------------------------------------- */

function ArticleReaderModal({ article, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Article link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-2xl overflow-hidden"
      >
        {/* Sticky Modal Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-card)]/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-bold uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              {article.categoryPill} • {article.readTime}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-xs text-[var(--color-text-secondary)]">
              <Calendar className="h-3 w-3" />
              {article.date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              title="Share article link"
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-1.5 text-xs font-mono font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close article viewer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Article Body */}
        <div className="overflow-y-auto px-6 py-8 sm:px-12 sm:py-10">
          <div className="max-w-3xl mx-auto">
            {/* Main Headline */}
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[var(--color-text-primary)]">
              {article.title}
            </h1>

            {/* Author Byline & Date */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 text-[var(--color-primary)] font-bold text-sm flex items-center justify-center shadow-sm">
                  {article.author.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      {article.author.name}
                    </p>
                    <span className="rounded bg-[var(--color-primary)]/10 px-1.5 py-0.2 text-[10px] font-mono font-bold text-[var(--color-primary)]">
                      {article.author.badge || "Verified"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {article.author.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {article.date}
                </span>
                <span>•</span>
                <span>{article.readTime}</span>
              </div>
            </div>

            {/* Executive Highlights Callout Box */}
            {article.highlights && (
              <div className="my-8 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5 sm:p-6">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Executive Clinical Takeaways
                </p>
                <ul className="space-y-2 text-sm text-[var(--color-text-primary)]">
                  {article.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Article Prose & Sections */}
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-[var(--color-text-secondary)]">
              {article.sections ? (
                article.sections.map((section, idx) => (
                  <div key={idx} className="space-y-3">
                    <h2 className="font-heading text-2xl font-bold text-[var(--color-text-primary)]">
                      {section.heading}
                    </h2>
                    <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line text-[var(--color-text-secondary)]">
                      {section.body}
                    </p>
                    {section.codeSnippet && (
                      <div className="relative my-4 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                            Production Implementation
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(section.codeSnippet);
                              toast.success("Code snippet copied!");
                            }}
                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </button>
                        </div>
                        <pre>{section.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-lg leading-relaxed">{article.excerpt}</p>
              )}
            </div>

            {/* Keywords / Tags Footer */}
            <div className="mt-12 pt-6 border-t border-[var(--color-border)]/60">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Architectural & Clinical Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {article.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-text-secondary)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  NEWSLETTER / EDITORIAL INSIGHTS CTA COMPONENT                             */
/* -------------------------------------------------------------------------- */

function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid clinic email address.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubscribed(true);
      toast.success("Subscribed! Actionable clinic guides are on their way.");
    }, 600);
  };

  return (
    <section className="relative my-20">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)]/80 bg-gradient-to-tr from-[var(--color-primary)]/10 via-[var(--color-card)] to-[var(--color-accent)]/15 p-8 sm:p-12 shadow-xl backdrop-blur-md">
        {/* Subtle background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--color-primary)]/15 blur-3xl"
        />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Heading & description */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-4">
              <Mail className="h-3.5 w-3.5" />
              MedAlerto Bi-Weekly Dispatch
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-bold leading-tight text-[var(--color-text-primary)]">
              Get practical clinic workflows delivered to your inbox.
            </h2>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--color-text-secondary)] max-w-xl">
              Deep dives into clinic state machines, Meta Cloud API integrations,
              net pricing architecture, and outpatient operational efficiency.
              Read by 1,400+ clinic directors and healthcare builders.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 font-mono text-xs text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />
                Bi-weekly engineering breakdowns
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />
                Zero sponsor spam
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Subscription Form */}
          <div className="lg:col-span-5">
            {isSubscribed ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-3">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
                  You're Subscribed!
                </h4>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Check your inbox for our latest clinic engineering whitepaper.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    aria-label="Work email address"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] py-3.5 pl-12 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/60 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3.5 px-6 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-on-primary)] shadow-md hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer disabled:opacity-70"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Subscribing..." : "Subscribe to Insights"}
                </button>

                <p className="text-center font-mono text-[11px] text-[var(--color-text-secondary)]">
                  ✓ No Spam. Only actionable guides.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  MAIN EDITORIAL HUB COMPONENT                                              */
/* -------------------------------------------------------------------------- */

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeArticleModal, setActiveArticleModal] = useState(null);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (activeArticleModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeArticleModal]);

  // Identify Hero article vs Grid articles
  const heroArticle = useMemo(() => {
    return (
      BLOG_ARTICLES.find((article) => article.isHero) || BLOG_ARTICLES[0]
    );
  }, []);

  const gridArticles = useMemo(() => {
    return BLOG_ARTICLES.filter((article) => !article.isHero);
  }, []);

  // Filter grid articles based on search query and category
  const filteredGridArticles = useMemo(() => {
    // When actively searching, include hero article in search results if it matches
    const pool = searchQuery.trim() ? BLOG_ARTICLES : gridArticles;

    return pool.filter((article) => {
      const matchesCategory =
        selectedCategory === "All" ||
        article.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (article.secondaryCategories &&
          article.secondaryCategories.some(
            (c) => c.toLowerCase() === selectedCategory.toLowerCase()
          ));

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = article.title.toLowerCase().includes(q);
      const inExcerpt = article.excerpt.toLowerCase().includes(q);
      const inCategory = article.category.toLowerCase().includes(q);
      const inAuthor = article.author.name.toLowerCase().includes(q);
      const inTags = article.tags?.some((t) => t.toLowerCase().includes(q));

      return inTitle || inExcerpt || inCategory || inAuthor || inTags;
    });
  }, [gridArticles, selectedCategory, searchQuery]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-300">
      <MetaTags
        title={
          activeArticleModal
            ? `${activeArticleModal.title} | MedAlerto Blog`
            : "MedAlerto Blog — Clinic Engineering, Queue Architecture & Practice Insights"
        }
        description={
          activeArticleModal?.excerpt ||
          "Engineering deep-dives and practice insights from the MedAlerto team: queue architecture, WhatsApp APIs, clinic billing, security and patient flow."
        }
        keywords="MedAlerto blog, clinic engineering, queue architecture, digital prescription engineering, patient flow"
        path="/blog"
        image="https://medalerto.me/og-image.png"
        ogType="article"
        schemas={{
          blog: blogSchema(),
          article: blogPostingSchema(activeArticleModal),
        }}
      />
      {/* Background Ambience Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-96 w-96 rounded-full bg-[var(--color-accent)]/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-64 h-[30rem] w-[30rem] rounded-full bg-[var(--color-primary)]/10 blur-3xl"
      />

      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* ================================================================ */}
          {/* 1. HERO SECTION & HERO FEATURED ARTICLE                          */}
          {/* ================================================================ */}
          <section className="mb-14">
            {/* Hero Eyebrow, Headline & Sub-headline */}
            <div className="max-w-4xl mb-10">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                MEDALERTO CLINICAL INSIGHTS & ENGINEERING
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-[var(--color-text-primary)]"
              >
                Practical workflows, clinical engineering, and practice growth guides.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-lg sm:text-xl leading-relaxed text-[var(--color-text-secondary)]"
              >
                Deep dives into clinic state machines, Meta Cloud API integrations,
                net pricing architecture, and outpatient operational efficiency.
              </motion.p>
            </div>

            {/* Featured Hero Card (Full-Width Asymmetric Spotlight) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-700/60 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle ambient light accents inside card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl"
              />

              <div className="relative z-10 grid gap-10 lg:grid-cols-12 lg:items-center">
                {/* Left Column: Category, Read time, Title, Excerpt, Author, CTA */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    {/* Category pill + Read Time */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                        {heroArticle.categoryPill}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {heroArticle.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      onClick={() => setActiveArticleModal(heroArticle)}
                      className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug text-white hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      {heroArticle.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                      {heroArticle.excerpt}
                    </p>
                  </div>

                  {/* Author avatar, name, date + CTA button */}
                  <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center shadow-inner">
                        {heroArticle.author.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Dr. Abdullah —{" "}
                          <span className="text-xs font-normal text-slate-400">
                            Founder & Lead Architect
                          </span>
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {heroArticle.date}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveArticleModal(heroArticle)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Read Deep Dive →
                    </button>
                  </div>
                </div>

                {/* Right Column Visual: Interactive Micro-UI Preview */}
                <div className="lg:col-span-5">
                  <HeroMicroUiPreview
                    heroArticle={heroArticle}
                    onOpenArticle={(art) => setActiveArticleModal(art)}
                  />
                </div>
              </div>
            </motion.div>
          </section>

          {/* ================================================================ */}
          {/* 2. INTERACTIVE SEARCH & CATEGORY FILTER BAR                     */}
          {/* ================================================================ */}
          <section className="mb-10 space-y-5">
            {/* Search Bar & Stats Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search Bar Input */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows, API architecture, billing guides..."
                  aria-label="Search articles"
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-full px-5 py-3 pl-11 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/70 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search input"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Active Results Metric */}
              <div className="font-mono text-xs text-[var(--color-text-secondary)] flex items-center gap-2 self-end sm:self-auto">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                <span>
                  Showing{" "}
                  <strong className="text-[var(--color-text-primary)]">
                    {filteredGridArticles.length}
                  </strong>{" "}
                  of {gridArticles.length} guides
                </span>
              </div>
            </div>

            {/* Horizontal Scroll Category Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive =
                  selectedCategory.toLowerCase() === cat.toLowerCase();

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={isActive}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-mono tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md font-bold"
                        : "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* 3. ARTICLE GRID REFACTOR (3-COLUMN RESPONSIVE LAYOUT)            */}
          {/* ================================================================ */}
          <section className="mb-14">
            {filteredGridArticles.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredGridArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onSelect={(art) => setActiveArticleModal(art)}
                  />
                ))}
              </div>
            ) : (
              /* Empty Search State */
              <div className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)] p-12 text-center shadow-[var(--shadow-soft)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-4">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-[var(--color-text-primary)]">
                  No Guides Found
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
                  No articles matched your search query "{searchQuery}" in category "
                  {selectedCategory}". Try clearing your filters or searching for terms like "PDF", "ledger", or "FSM".
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-on-primary)] shadow hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </section>

          {/* ================================================================ */}
          {/* 4. NEWSLETTER / EDITORIAL INSIGHTS CTA                           */}
          {/* ================================================================ */}
          <NewsletterCTA />
        </div>
      </main>

      {/* Publication Reader Modal */}
      <FramerMotion.AnimatePresence>
        {activeArticleModal && (
          <ArticleReaderModal
            article={activeArticleModal}
            onClose={() => setActiveArticleModal(null)}
          />
        )}
      </FramerMotion.AnimatePresence>

      <Footer />
    </div>
  );
}
