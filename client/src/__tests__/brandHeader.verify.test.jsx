/**
 * Runtime verification — Header fixes across the public booking surfaces.
 *
 *  1. AVATAR CRASH FIX: no header may render <img src="/assets/avatar.png">
 *     (an asset that does not exist → broken-image icon next to the user's
 *     name). Logged-in headers must fall back to clean initials ("AJ") or a
 *     safe <UserAvatar /> that recovers from image load errors.
 *  2. SINGLE BRAND LOGO: every header renders EXACTLY ONE logo <img> —
 *     never two icons side by side (the old black+white double-<img> with
 *     CSS-hiding is banned; the theme swap switches the src instead):
 *       - `/` homepage navbar:      black.png in light, white.png in dark
 *       - ALL /book/* portal pages: fullblue.png (doctors directory and
 *         patient dashboard included)
 *  3. HOMEPAGE CTAs: the marketing navbar shows Login → /login and
 *     Create Account → /signup links and NO profile pill / avatar.
 *
 * Run with: npx vitest run
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import BrandLogo, { BrandLogoMark } from "../components/BrandLogo";
import UserAvatar from "../components/UserAvatar";
import DoctorSearchPage from "../pages/booking/DoctorSearchPage";
import PatientDashboardPage from "../pages/booking/PatientDashboardPage";
import blackLogo from "../assets/black.png";
import whiteLogo from "../assets/white.png";
import fullBlueLogo from "../assets/fullblue.png";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

vi.mock("../context/usePatientAuth", () => ({
  __esModule: true,
  default: () => ({
    isAuthenticated: true,
    patient: { _id: "p1", name: "Abdullah Jutt", email: "a@b.com" },
  }),
}));

beforeAll(() => {
  // jsdom does not implement matchMedia (used by the shared useTheme hook).
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterAll(() => {
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-theme");
});

/* ─────────────────────── single-logo assertion helpers ─────────────────── */

function allLogoImages(root = document) {
  return Array.from(root.querySelectorAll("img[data-medalerto-logo]"));
}

/** Exactly ONE logo <img> may exist, and it must point at `expectedSrc`. */
function expectSingleLogo(expectedSrc) {
  const imgs = allLogoImages();
  expect(imgs).toHaveLength(1);
  expect(imgs[0].getAttribute("src")).toBe(expectedSrc);
}

/* ────────────────────────────── UserAvatar ────────────────────────────── */

describe("UserAvatar — safe fallbacks", () => {
  it("renders clean initials instead of an <img> when src is missing or blank", () => {
    const { rerender } = render(<UserAvatar name="Abdullah Jutt" />);
    expect(screen.getByText("AJ")).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();

    rerender(<UserAvatar src="   " name="Abdullah Jutt" />);
    expect(screen.getByText("AJ")).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });

  it("shows the photo when a valid src loads, then recovers to initials on error", () => {
    render(<UserAvatar src="https://cdn.example.com/a.png" name="Abdullah Jutt" />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    expect(screen.queryByText("AJ")).toBeNull();

    // Simulate the browser failing to load the photo (404 / CORS / corrupt).
    fireEvent.error(img);
    expect(screen.getByText("AJ")).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });
});

/* ────────────────────────────── BrandLogo ─────────────────────────────── */

describe("BrandLogo — one official image asset, never duplicates", () => {
  it("renders ONLY black.png for the light marketing variant (no second logo)", () => {
    document.documentElement.setAttribute("data-theme", "light");
    render(
      <MemoryRouter>
        <BrandLogo variant="home" subtitle="rooted clinic tools" />
      </MemoryRouter>
    );

    expectSingleLogo(blackLogo);
    expect(allLogoImages().some((img) => img.dataset.medalertoLogo === "white")).toBe(false);
    expect(document.querySelector("svg")).toBeNull();
    expect(screen.getAllByText(/MedAlerto/i).length).toBeGreaterThan(0);
  });

  it("swaps the SAME single <img> to white.png when dark theme is active", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    render(
      <MemoryRouter>
        <BrandLogo variant="home" subtitle="rooted clinic tools" />
      </MemoryRouter>
    );

    expectSingleLogo(whiteLogo);
    expect(allLogoImages().some((img) => img.dataset.medalertoLogo === "black")).toBe(false);
  });

  it("BrandLogoMark exposes an accessible image label", () => {
    render(<BrandLogoMark size={32} />);
    expect(screen.getByRole("img", { name: /MedAlerto logo/i })).toBeTruthy();
    expectSingleLogo(blackLogo);
  });

  it("renders fullblue.png for the patient portal variant", () => {
    render(<BrandLogo variant="patient" markSize={34} subtitle="PATIENT PORTAL" />);
    expectSingleLogo(fullBlueLogo);
    expect(screen.getAllByText(/Patient Portal/i).length).toBeGreaterThan(0);
  });

  it("renders fullblue.png for the doctors variant (all /book/* routes)", () => {
    render(<BrandLogo variant="doctors" markSize={34} subtitle="VERIFIED DOCTORS" />);
    expectSingleLogo(fullBlueLogo);
    expect(screen.getAllByText(/Verified Doctors/i).length).toBeGreaterThan(0);
  });
});

/* ─────────────────────────── Homepage navbar (`/`) ─────────────────────── */

describe("Navbar — homepage header CTAs", () => {
  it("shows Login → /login and Create Account → /signup links with no profile pill or avatar", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar />
      </MemoryRouter>
    );

    const login = screen.getByText("Login").closest("a");
    expect(login).toBeTruthy();
    expect(login.getAttribute("href")).toBe("/login");

    const signup = screen.getByText("Create Account").closest("a");
    expect(signup).toBeTruthy();
    expect(signup.getAttribute("href")).toBe("/signup");

    // Exactly ONE black logo asset; no white twin beside it, no profile UI.
    expectSingleLogo(blackLogo);
    expect(screen.queryByText(/Abdullah/i)).toBeNull();
  });

  it("still renders exactly ONE logo when dark theme is active", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar />
      </MemoryRouter>
    );

    expectSingleLogo(whiteLogo);
  });
});

/* ─────────────────────── Doctor directory (`/book/doctors`) ────────────── */

describe("DoctorSearchPage header — avatar crash fix + single fullblue logo", () => {
  it("uses ONE fullblue.png logo and never renders the broken avatar.png", async () => {
    axios.get.mockResolvedValue({
      data: { doctors: [], pagination: { total: 0, pages: 1, page: 1 } },
    });

    render(
      <MemoryRouter initialEntries={["/book/doctors"]}>
        <Routes>
          <Route path="/book/doctors" element={<DoctorSearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    expectSingleLogo(fullBlueLogo);
    expect(screen.getAllByText(/Verified Doctors/i).length).toBeGreaterThan(0);

    // The crash source is gone: no /assets/avatar.png, and the logged-in
    // patient gets clean initials ("AJ") next to their name.
    expect(document.querySelector('img[src="/assets/avatar.png"]')).toBeNull();
    expect(await screen.findByText("AJ")).toBeTruthy();
    expect(screen.getByText("Abdullah Jutt")).toBeTruthy();
  });
});

/* ───────────────────── Patient dashboard (`/book/dashboard`) ───────────── */

describe("PatientDashboardPage header — single fullblue logo + safe patient pill", () => {
  it("uses fullblue.png and keeps the Patient Portal subtitle", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/patient-account/me")) {
        return Promise.resolve({
          data: { patient: { _id: "p1", name: "Abdullah Jutt", email: "a@b.com" } },
        });
      }
      return Promise.resolve({ data: { bookings: [] } });
    });

    render(
      <MemoryRouter initialEntries={["/book/dashboard"]}>
        <Routes>
          <Route path="/book/dashboard" element={<PatientDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findAllByText(/Patient Portal/i)).toBeTruthy();
    expectSingleLogo(fullBlueLogo);
    expect(screen.queryByText(/^MediMate$/)).toBeNull();

    // No broken avatar images; initials bubble instead.
    expect(document.querySelector('img[src="/assets/avatar.png"]')).toBeNull();
    await waitFor(() => expect(screen.getByText("AJ")).toBeTruthy());
  });
});
