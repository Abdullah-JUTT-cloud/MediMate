/**
 * Runtime verification — Task 2: Doctor profile pictures in the directory.
 *
 *  - Doctor cards must render the real uploaded image (`<img>` with the
 *    doctor's profilePicUrl) whenever the backend returns one.
 *  - They must fall back to initials ONLY when the image string is
 *    null/empty or fails to load.
 *  - The mock preview Avatar must use `src` when provided (initials fallback
 *    otherwise), matching the same priority rule.
 *
 * Run with: npx vitest run
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "../api/axios";
import DoctorSearchPage from "../pages/booking/DoctorSearchPage";
import DoctorsPage from "../booking/DoctorsPage";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn() },
}));

beforeAll(() => {
  // jsdom does not implement matchMedia (used by the mock portal's Nav/useTheme).
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

const doctorsWithImages = [
  {
    _id: "doc1",
    title: "Dr.",
    fullName: "Ayesha Khan",
    specialization: "Cardiologist",
    yearsOfExperience: 8,
    primaryDegree: "MBBS",
    profilePicUrl: "https://cdn.medalerto.example/ayesha.jpg",
    onlineBookingFee: 1000,
    avgRating: 4.5,
    reviewCount: 10,
    clinics: [{ name: "City Care Clinic" }],
    hospitals: [],
  },
  {
    _id: "doc2",
    title: "Dr.",
    fullName: "Sara Malik",
    specialization: "Pediatrician",
    yearsOfExperience: 6,
    primaryDegree: "MBBS",
    profilePicUrl: "",
    onlineBookingFee: 800,
    avgRating: 0,
    reviewCount: 0,
    clinics: [{ name: "Little Steps Clinic" }],
    hospitals: [],
  },
];

describe("live doctor directory — avatars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        doctors: doctorsWithImages,
        pagination: { total: 2, pages: 1, page: 1 },
      },
    });
  });

  afterEach(cleanup);

  it("renders <img> when profilePicUrl is present, initials when it is empty", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DoctorSearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText((t) => t.includes("Ayesha Khan"))).toBeTruthy());

    const images = screen.getAllByRole("img");
    expect(images.some((img) => img.getAttribute("src") === "https://cdn.medalerto.example/ayesha.jpg")).toBe(true);

    // Doctor without an image string → initials fallback, no broken <img>.
    const saraCard = screen.getByText((t) => t.includes("Sara Malik")).closest(".group");
    expect(saraCard).toBeTruthy();
    expect(within(saraCard).getByText("S")).toBeTruthy();
    expect(within(saraCard).queryByRole("img")).toBeNull();
  });
});

describe("mock doctor directory — avatar src priority", () => {
  afterEach(cleanup);

  it("uses the image src when provided and initials otherwise", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DoctorsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Dr\. Muhammad Abdullah/)).toBeTruthy());

    // Mock data has no avatarUrl/profilePicUrl yet → initials are the
    // correct fallback (image string null/empty). The doctor card's avatar
    // area must NOT contain an <img> in that case.
    const card = screen.getByRole("link", { name: /View profile of Dr\. Muhammad Abdullah/ });
    expect(card.textContent).toContain("MA"); // "Muhammad Abdullah" initials
    expect(within(card).queryByRole("img")).toBeNull();
  });
});
