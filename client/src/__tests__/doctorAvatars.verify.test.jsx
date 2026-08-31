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

describe("live doctor directory (src/booking/DoctorsPage) — real API data", () => {
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

  it("renders doctors fetched from GET /public/doctors (no hardcoded list)", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DoctorsPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Server data is rendered; the old hardcoded fixtures are gone.
    await waitFor(() => expect(screen.getByText(/Ayesha Khan/)).toBeTruthy());
    expect(screen.getByText(/Sara Malik/)).toBeTruthy();
    expect(screen.queryByText(/Muhammad Abdullah/)).toBeNull();

    // The API is the single source of truth for the directory.
    expect(axios.get).toHaveBeenCalled();
    expect(String(axios.get.mock.calls[0][0])).toContain("/public/doctors");

    // Real fields are mapped onto the cards: fee, practice location, rating.
    const ayeshaCard = screen
      .getByText((t) => t.includes("Ayesha Khan"))
      .closest(".group");
    expect(ayeshaCard.textContent).toContain("Cardiologist");
    expect(ayeshaCard.textContent).toContain("City Care Clinic");
    expect(ayeshaCard.textContent).toContain("Rs 1,000");
    expect(ayeshaCard.textContent).toContain("4.5");
  });

  it("renders the uploaded profile picture and falls back to initials only when empty", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DoctorsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Ayesha Khan/)).toBeTruthy());

    // Doctor WITH an uploaded picture → <img src=...> wins over initials.
    const ayeshaCard = screen
      .getByText((t) => t.includes("Ayesha Khan"))
      .closest(".group");
    const img = within(ayeshaCard).getByRole("img");
    expect(img.getAttribute("src")).toBe("https://cdn.medalerto.example/ayesha.jpg");

    // Doctor WITHOUT a picture (empty string) → initials, no broken <img>.
    const saraCard = screen.getByText((t) => t.includes("Sara Malik")).closest(".group");
    expect(saraCard).toBeTruthy();
    expect(within(saraCard).queryByRole("img")).toBeNull();
    expect(within(saraCard).getByText("SM")).toBeTruthy();
  });

  it("shows an error state when the directory API fails", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DoctorsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Couldn't load the doctor directory/)).toBeTruthy()
    );
  });
});
