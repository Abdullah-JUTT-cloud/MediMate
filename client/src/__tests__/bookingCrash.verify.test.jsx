/**
 * Runtime verification — Task 3: Booking flow crash + Error Boundary routing.
 *
 *  1. Selecting a time slot and submitting a booking on the patient doctor
 *     detail page MUST NOT crash ("Cannot access 'fee' before initialization"
 *     was thrown on every slot click before the fix).
 *  2. The global Error Boundary's "Return to dashboard" button must route
 *     /book/* crashes to the PATIENT portal (/book/dashboard) and everything
 *     else to the doctor portal (/dashboard).
 *
 * Run with: npx vitest run
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "../api/axios";
import DoctorDetailPage from "../booking/DoctorDetailPage";
import DoctorProfilePage from "../pages/booking/DoctorProfilePage";
import ErrorBoundary from "../components/ErrorBoundary";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("../store/patientAccountStore", () => ({
  __esModule: true,
  default: () => ({ _id: "p1", name: "Abdullah Jutt", email: "a@b.com" }),
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

afterEach(cleanup);

describe("booking flow crash (DoctorDetailPage)", () => {
  it("selecting a slot and submitting a booking does not throw", async () => {
    // Guard: this test must fail loudly if the component throws during render
    // (previously `ReferenceError: Cannot access 'fee' before initialization`
    // fired the moment a slot was selected).
    const originalError = console.error;
    const errors = [];
    console.error = (...args) => errors.push(args);

    try {
      render(
        <MemoryRouter initialEntries={["/book/doctors/doc-abdullah"]}>
          <Routes>
            <Route path="/book/doctors/:id" element={<DoctorDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await screen.findByText(/Book Appointment/);

      // Click an operating day (labeled "Open"), then an available slot.
      const openDay = screen.getAllByRole("button").find((b) => b.textContent?.includes("Open"));
      expect(openDay).toBeTruthy();
      fireEvent.click(openDay);

      const availableSlot = screen.getAllByRole("button").find((b) => b.textContent?.includes("Available"));
      expect(availableSlot).toBeTruthy();
      fireEvent.click(availableSlot);

      // The submit CTA must become enabled and must not throw on click.
      const submit = screen.getAllByRole("button").find((b) => b.textContent?.includes("Request Appointment Slot"));
      expect(submit).toBeTruthy();
      expect(submit.disabled).toBe(false);
      fireEvent.click(submit);

      // No uncaught render errors, and the dashboard redirect happened.
      const renderErrors = errors.filter((e) => String(e[0]).includes("ReferenceError"));
      expect(renderErrors).toEqual([]);
      expect(screen.queryByText(/Something went wrong/)).toBeNull();
    } finally {
      console.error = originalError;
    }
  });
});

describe("live booking page — defensive slot handling (DoctorProfilePage)", () => {
  const doctor = {
    _id: "doc1",
    title: "Dr.",
    fullName: "Ayesha Khan",
    specialization: "Cardiologist",
    yearsOfExperience: 8,
    primaryDegree: "MBBS",
    avgRating: 4.2,
    reviewCount: 12,
    slotDuration: 20,
    onlineBookingFee: 0,
    advanceBookingFee: 0,
    profilePicUrl: "",
    clinics: [
      {
        _id: "c1",
        name: "City Care Clinic",
        address: "Main Boulevard",
        sessions: [{ day: "Monday", startTime: "09:00", endTime: "12:00" }],
      },
    ],
    hospitals: [],
  };

  function renderLivePage() {
    return render(
      <MemoryRouter initialEntries={["/book/doctors/doc1"]}>
        <Routes>
          <Route path="/book/doctors/:id" element={<DoctorProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/slots")) return Promise.resolve({ data: { slots: [] } });
      if (url.includes("/reviews")) return Promise.resolve({ data: { reviews: [] } });
      return Promise.resolve({ data: { doctor } });
    });
  });

  it("does not crash when the slots API returns a non-array payload", async () => {
    // Regression: a non-array `slots` value used to reach `slots.find(...)`
    // and throw `TypeError: slots.find is not a function` as soon as the
    // patient interacted with the time-slot grid.
    axios.get.mockImplementation((url) => {
      if (url.includes("/slots")) {
        return Promise.resolve({ data: { slots: { "09:00": { isFull: false } } } });
      }
      if (url.includes("/reviews")) return Promise.resolve({ data: { reviews: [] } });
      return Promise.resolve({ data: { doctor } });
    });

    renderLivePage();
    await screen.findByText(/Book Appointment/);

    const slotBtn = await screen.findByRole("button", { name: /09:00 AM/ });
    fireEvent.click(slotBtn); // must not throw

    // Booking CTA becomes enabled and submits cleanly.
    const submit = screen.getByRole("button", { name: /Request Appointment Slot/ });
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(screen.queryByText(/Something went wrong/)).toBeNull();
  });
});

describe("ErrorBoundary dashboard routing", () => {
  function Boom() {
    throw new Error("boom");
  }

  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn(); // React logs caught boundary errors to console
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('routes "Return to dashboard" to /book/dashboard when path contains /book', () => {
    window.history.pushState({}, "", "/book/doctors/doc-1");
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Return to dashboard/i });
    expect(link.getAttribute("href")).toBe("/book/dashboard");
  });

  it('keeps the default /dashboard destination for non-/book paths', () => {
    window.history.pushState({}, "", "/queue");
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Return to dashboard/i });
    expect(link.getAttribute("href")).toBe("/dashboard");
  });
});
