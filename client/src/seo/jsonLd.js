/**
 * MedAlerto — JSON-LD structured-data builders.
 *
 * Each factory returns a plain object that `MetaTags.jsx` serialises into
 * <script type="application/ld+json">. Kept dependency-free so the same
 * builders can be reused by the server-side sitemap/schema routes.
 */
import { SITE } from "./seoConfig.js";

export const SITE_URL = SITE.url.replace(/\/$/, "");

function abs(path) {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "MedAlerto",
    alternateName: "MedAlert",
    url: `${SITE_URL}/`,
    logo: abs("/og-image.png"),
    image: abs("/og-image.png"),
    email: SITE.email,
    telephone: SITE.phone,
    description: SITE.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      contactType: "customer support",
      email: SITE.supportEmail,
      areaServed: "PK",
      availableLanguage: ["en", "ur"],
    },
    sameAs: [
      "https://www.facebook.com/medalerto",
      "https://www.instagram.com/medalerto",
      "https://www.linkedin.com/company/medalerto",
      "https://twitter.com/medalerto",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: "MedAlerto",
    alternateName: "MedAlert",
    description: "Premier clinic workflow and doctor discovery platform for Pakistan.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/book/doctors?name={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: "MedAlerto",
    alternateName: "MedAlert",
    url: `${SITE_URL}/`,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PKR",
      description: "Free clinic workflow trial with monthly and annual clinic subscriptions.",
    },
    featureList: [
      "Digital prescriptions",
      "Patient queue management",
      "Live patient tracking",
      "Verified doctor discovery",
      "Online appointment booking",
      "WhatsApp delivery and reminders",
    ],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function faqSchema(items) {
  const valid = (items || []).filter((i) => i?.question && i?.answer);
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbSchema(items) {
  const valid = (items || []).filter((i) => i?.name && i?.path);
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: valid.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact MedAlerto",
    url: abs("/contact"),
    about: { "@id": `${SITE_URL}/#organization` },
    mainEntity: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      email: SITE.supportEmail,
      contactType: "customer support",
      areaServed: "PK",
    },
  };
}

export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About MedAlerto",
    url: abs("/about-us"),
    about: { "@id": `${SITE_URL}/#organization` },
  };
}

export function blogSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/#blog`,
    name: "MedAlerto Blog",
    url: abs("/blog"),
    description: "Engineering deep-dives and practice insights from the MedAlerto team.",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function blogPostingSchema(article) {
  if (!article?.title) return null;
  const url = abs(`/blog?article=${encodeURIComponent(article.id || article.title)}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt || SITE.description,
    datePublished: normalizeDate(article.date) || undefined,
    dateModified: normalizeDate(article.date) || undefined,
    author: {
      "@type": "Person",
      name: article.author?.name || "MedAlerto Editorial Team",
      jobTitle: article.author?.role || "Editor",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: abs("/og-image.png"),
    keywords: (article.tags || []).join(", "),
    articleSection: article.category || "Clinic Engineering",
    wordCount: estimateWordCount(article),
  };
}

/**
 * Physician rich-snippet schema for a public doctor profile.
 * `doctor` is the public API shape (see PUBLIC_DOCTOR_FIELDS).
 */
export function physicianSchema(doctor, id) {
  if (!doctor?.fullName) return null;
  const clinic = (doctor.clinics || [])[0] || (doctor.hospitals || [])[0] || null;
  const url = abs(`/book/doctors/${id || ""}`);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": url,
    name: doctor.fullName,
    alternateName: doctor.title ? `${doctor.title} ${doctor.fullName}` : doctor.fullName,
    url,
    image: doctor.profilePicUrl || abs("/og-image.png"),
    description: `${doctor.title || "Dr."} ${doctor.fullName} — ${doctor.specialization || "physician"} in Pakistan. Book online with MedAlerto.`,
    medicalSpecialty: mappingMedicalSpecialty(doctor.specialization),
    knowsAbout: doctor.specialization,
    isAcceptingNewPatients: true,
    telephone: doctor.phone || SITE.phone,
    email: doctor.email || SITE.supportEmail,
  };

  if (doctor.yearsOfExperience) {
    schema.yearsOfExperience = doctor.yearsOfExperience;
  }
  if (doctor.primaryDegree) {
    schema.memberOf = {
      "@type": "MedicalOrganization",
      name: `${doctor.primaryDegree}${doctor.university ? `, ${doctor.university}` : ""}`,
    };
  }
  if (clinic) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: clinic.address || undefined,
      addressLocality: undefined,
      addressCountry: "PK",
    };
    schema.location = {
      "@type": "Place",
      name: clinic.name || undefined,
      address: schema.address,
    };
    if (Array.isArray(clinic.sessions) && clinic.sessions.length) {
      schema.openingHoursSpecification = clinic.sessions.map((s) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: toSchemaDay(s.day),
        opens: s.startTime || undefined,
        closes: s.endTime || undefined,
      }));
    }
  }
  if (typeof doctor.avgRating === "number" && doctor.avgRating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: doctor.avgRating,
      reviewCount: doctor.reviewCount || 1,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return schema;
}

function mappingMedicalSpecialty(value = "") {
  const map = {
    cardiologist: "Cardiovascular",
    cardiology: "Cardiovascular",
    dermatologist: "Dermatologic",
    dermatology: "Dermatologic",
    pediatrician: "Pediatric",
    pediatrics: "Pediatric",
    gynecologist: "Gynecologic",
    gynecology: "Gynecologic",
    neurologist: "Neurologic",
    neurology: "Neurologic",
    psychiatrist: "Psychiatric",
    psychiatry: "Psychiatric",
    orthopedic: "Orthopedic",
    orthopedics: "Orthopedic",
    ophthalmologist: "Ophthalmologic",
    ophthalmology: "Ophthalmologic",
    ent: "Otolaryngologic",
    urologist: "Urologic",
    urology: "Urologic",
    oncologist: "Oncologic",
    oncology: "Oncologic",
    endocrinologist: "Endocrine",
    endocrinology: "Endocrine",
  };
  const key = String(value).toLowerCase();
  return map[key] || "Medical";
}

function toSchemaDay(day = "") {
  const d = String(day).toLowerCase();
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function normalizeDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function estimateWordCount(article) {
  const bodies = (article.sections || []).map((s) => s.body || "");
  const text = bodies.join(" ").trim();
  return text ? Math.max(50, Math.round(text.split(/\s+/).length)) : 600;
}
