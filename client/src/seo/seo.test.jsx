import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import SeoRouteManager from "../components/Seo/SeoRouteManager";
import MetaTags from "../components/Seo/MetaTags";
import { applyHeadMeta } from "./head";
import { SITE, canonicalUrl, clampTitle } from "./seoConfig";
import { organizationSchema, websiteSchema, faqSchema, physicianSchema } from "./jsonLd";

function resetHead() {
  document.title = SITE.title;
  document.head
    .querySelectorAll("[data-seo-managed]")
    .forEach((el) => el.remove());
  document.head
    .querySelectorAll("script[data-seo-jsonld]")
    .forEach((el) => el.remove());
}

function getMeta(attr, key) {
  return document.head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content") || "";
}

beforeEach(resetHead);

describe("seoConfig", () => {
  it("builds absolute canonical URLs", () => {
    expect(canonicalUrl("/")).toBe("https://medalerto.me/");
    expect(canonicalUrl("features")).toBe("https://medalerto.me/features");
  });

  it("clamps long titles without breaking words", () => {
    const long = "A very long title that definitely exceeds the display budget of search engines";
    const clamped = clampTitle(long);
    expect(clamped.length).toBeLessThanOrEqual(61);
    expect(clamped.endsWith("…")).toBe(true);
  });
});

describe("jsonLd builders", () => {
  it("produces valid schema.org objects", () => {
    const org = organizationSchema();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("MedAlerto");
    expect(org.url).toBe("https://medalerto.me/");

    const site = websiteSchema();
    expect(site["@type"]).toBe("WebSite");
    expect(site.potentialAction["@type"]).toBe("SearchAction");
  });

  it("builds FAQ schema from question pairs", () => {
    const schema = faqSchema([
      { question: "Is there a setup fee?", answer: "No." },
      { question: "Can I cancel?", answer: "Yes." },
    ]);
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0].name).toBe("Is there a setup fee?");
  });

  it("builds Physician schema with rating and hours", () => {
    const schema = physicianSchema(
      {
        fullName: "Dr. Ayesha Khan",
        title: "Dr.",
        specialization: "Cardiologist",
        yearsOfExperience: 10,
        avgRating: 4.7,
        reviewCount: 32,
        clinics: [
          {
            name: "Heart Care Clinic",
            address: "Main Boulevard, Lahore",
            sessions: [{ day: "Monday", startTime: "10:00", endTime: "14:00" }],
          },
        ],
      },
      "abc123",
    );
    expect(schema["@type"]).toBe("Physician");
    expect(schema.aggregateRating.ratingValue).toBe(4.7);
    expect(schema.aggregateRating.reviewCount).toBe(32);
    expect(schema.openingHoursSpecification[0].dayOfWeek).toBe("Monday");
    expect(schema.url).toBe("https://medalerto.me/book/doctors/abc123");
  });
});

describe("MetaTags", () => {
  it("hydrates title, canonical and OG tags for a route", () => {
    render(
      <MetaTags title="Features — MedAlerto" description="Feature description" path="/features" />,
    );
    expect(document.title).toBe("Features — MedAlerto");
    expect(getMeta("property", "og:title")).toBe("Features — MedAlerto");
    expect(getMeta("name", "description")).toBe("Feature description");
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://medalerto.me/features");
  });

  it("applies noindex for internal pages", () => {
    render(<MetaTags title="Dashboard" path="/dashboard" noindex />);
    expect(getMeta("name", "robots")).toContain("noindex");
  });

  it("injects JSON-LD schemas", () => {
    render(
      <MetaTags
        title="FAQ"
        path="/faq"
        schemas={{ faq: faqSchema([{ question: "Q", answer: "A" }]) }}
      />,
    );
    const script = document.head.querySelector('script[data-seo-jsonld="faq"]');
    expect(script).toBeTruthy();
    expect(JSON.parse(script.textContent)["@type"]).toBe("FAQPage");
  });
});

describe("SeoRouteManager", () => {
  function renderApp(initialPath = "/") {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <SeoRouteManager />
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/features" element={<div>Features</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
        <Link to="/features">go features</Link>
        <Link to="/dashboard">go dashboard</Link>
      </MemoryRouter>,
    );
  }

  it("sets route metadata on initial load", () => {
    renderApp("/");
    expect(document.title).toBe(SITE.title);
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://medalerto.me/");
  });

  it("updates head on SPA navigation", async () => {
    renderApp("/");
    const user = userEvent.setup();
    await user.click(screen.getByText("go features"));
    await waitFor(() => expect(document.title).toBe("Clinic Software Features — Digital Prescriptions & Queue Management | MedAlerto"));
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://medalerto.me/features");
  });

  it("noindexes protected routes", async () => {
    renderApp("/");
    const user = userEvent.setup();
    await user.click(screen.getByText("go dashboard"));
    await waitFor(() => expect(getMeta("name", "robots")).toContain("noindex"));
  });
});
