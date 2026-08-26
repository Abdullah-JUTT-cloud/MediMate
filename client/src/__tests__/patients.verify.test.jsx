/**
 * Runtime verification for the refactored Patients directory + detail views.
 *
 * Run with:  npx vitest run   (needs vitest, jsdom, @testing-library/react)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const patientFixture = {
  _id: "p1",
  name: "Ahmed Raza",
  age: 21,
  gender: "Male",
  phone: "03001234567",
  bloodGroup: "AB+",
  medicalHistory: ["Penicillin allergy"],
  createdAt: "2025-01-10T09:00:00.000Z",
  locations: [
    { locationType: "Clinic", locationId: "c1", locationName: "City Care Clinic" },
  ],
};

const checkupFixture = {
  _id: "chk1",
  createdAt: "2026-08-26T10:00:00.000Z",
  diseases: ["Hypertension"],
  notes: "BP trending down, keep monitoring.",
  visitedFacility: {
    locationType: "Clinic",
    locationName: "City Care Clinic",
    locationAddress: "Main Boulevard",
  },
  payment: { amount: 4000, discountAmount: 100, netAmount: 3900, isPaid: true },
  prescription: {
    diagnosis: "Hypertension Stage 2",
    nextAppointment: "2026-09-26T00:00:00.000Z",
    pdfUrl: "https://cdn.example.com/rx.pdf",
    patientAdvice: "Walk 30 minutes daily and avoid oily food.",
    medicines: [
      {
        name: "Amlodipine",
        dosage: "5mg",
        frequency: "Once a day",
        duration: "1 month",
        instructions: "Take after meal",
      },
    ],
    labTests: ["CBC", "Lipid Profile"],
  },
};

const doctorFixture = {
  slotDuration: 30,
  clinics: [
    {
      _id: "c1",
      name: "City Care Clinic",
      address: "Main Boulevard",
      sessions: [{ day: "Wednesday", startTime: "17:00", endTime: "19:00" }],
    },
  ],
  hospitals: [],
};

const requestLog = [];

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(async (url) => {
      requestLog.push(`GET ${url}`);
      if (url.startsWith("/patients/p1?") || url === "/patients/p1") {
        return { data: { patient: patientFixture } };
      }
      if (url.startsWith("/patients?")) {
        return {
          data: { patients: [patientFixture], pagination: { total: 1 } },
        };
      }
      if (url.startsWith("/checkups/")) {
        return { data: { checkups: [checkupFixture] } };
      }
      if (url.startsWith("/appointments?")) {
        return { data: { appointments: [] } };
      }
      throw new Error(`Unexpected GET ${url}`);
    }),
    post: vi.fn(async (url, body) => {
      requestLog.push(`POST ${url} ${JSON.stringify(body)}`);
      return { data: { appointment: { _id: "a1", ...body } } };
    }),
    put: vi.fn(async () => ({ data: { patient: patientFixture } })),
    delete: vi.fn(async () => ({ data: { message: "ok" } })),
  },
  getApiBaseUrl: () => "/api",
}));

vi.mock("../store/authStore", () => ({
  default: () => ({ doctor: doctorFixture }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import PatientsPage from "../pages/PatientsPage";
import AddPatientForm from "../components/patients/AddPatientForm";
import CheckupForm from "../components/patients/CheckupForm";
import PatientDetailPage from "../pages/PatientDetailPage";
import {
  buildSlotsForDate,
  formatLongDate,
  formatMoney,
  getInitials,
  pluralize,
} from "../components/patients/patientTokens";

beforeEach(() => {
  requestLog.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("patient formatting + slot helpers", () => {
  it("formats dates, money and counters the way the UI prints them", () => {
    expect(formatLongDate(checkupFixture.createdAt)).toBe("26 August 2026");
    expect(formatMoney(3900)).toBe("Rs. 3,900");
    expect(pluralize(1, "Total Registered Patient", "Total Registered Patients")).toBe(
      "1 Total Registered Patient",
    );
    expect(pluralize(12, "Total Registered Patient", "Total Registered Patients")).toBe(
      "12 Total Registered Patients",
    );
    expect(getInitials("Ahmed Raza")).toBe("AR");
  });

  it("derives bookable slots from the doctor's Wednesday session", () => {
    const slots = buildSlotsForDate({
      doctor: doctorFixture,
      patient: patientFixture,
      date: "2026-08-26", // a Wednesday
    });
    expect(slots.map((slot) => slot.time)).toEqual(["17:00", "17:30", "18:00", "18:30"]);
    expect(slots[0].locationName).toBe("City Care Clinic");

    const offDay = buildSlotsForDate({
      doctor: doctorFixture,
      patient: patientFixture,
      date: "2026-08-27", // a Thursday
    });
    expect(offDay).toEqual([]);
  });
});

describe("PatientsPage directory", () => {
  it("renders the header, counter, search bar and per-row actions", async () => {
    render(<PatientsPage />);

    expect(await screen.findByRole("heading", { name: "Patients" })).toHaveProperty(
      "className",
      "text-2xl font-bold text-slate-900 dark:text-white",
    );
    expect(await screen.findByText("1 Total Registered Patient")).toBeTruthy();
    expect(screen.getByRole("button", { name: "+ Register New Patient" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Search by patient name or phone…")).toBeTruthy();

    // Name renders twice on purpose: desktop table row + mobile stacked card.
    const nameCells = await screen.findAllByText("Ahmed Raza");
    expect(nameCells.length).toBe(2);
    expect(nameCells[0].className).toContain("text-base font-bold text-slate-900 dark:text-white");

    expect(screen.getAllByText("View Record").length).toBeGreaterThan(0);
    expect(screen.getAllByText("📅 Book Slot").length).toBeGreaterThan(0);
    expect(screen.getByText("03001234567")).toBeTruthy();
    expect(screen.getByText("21 yrs · Male")).toBeTruthy();
    expect(screen.getAllByText("City Care Clinic").length).toBeGreaterThan(0);
  });

  it("opens the booking modal with the upfront fee form from a row action", async () => {
    const user = userEvent.setup();
    render(<PatientsPage />);

    await user.click((await screen.findAllByText("📅 Book Slot"))[0]);

    expect(await screen.findByRole("dialog", { name: /Book appointment for Ahmed Raza/i })).toBeTruthy();
    expect(screen.getByLabelText("Fee (Rs.)")).toBeTruthy();
    expect(screen.getByLabelText("Discount (Rs.)")).toBeTruthy();
    expect(screen.getByLabelText("Payment Method")).toBeTruthy();
    // 26 Aug 2026 is a Wednesday, so the configured session must produce slots.
    expect(await screen.findByRole("button", { name: /17:00/ })).toBeTruthy();
  });

  it("filters the loaded rows client side and reports the visible count", async () => {
    const user = userEvent.setup();
    render(<PatientsPage />);

    await screen.findAllByText("Ahmed Raza");
    await user.selectOptions(screen.getByLabelText("Filter by gender"), "Female");

    expect(screen.queryAllByText("Ahmed Raza")).toEqual([]);
    expect(screen.getByText("No matching patients")).toBeTruthy();
    expect(screen.getByText(/showing 0/)).toBeTruthy();
  });
});

describe("PatientDetailPage profile + history", () => {
  it("renders the profile header, info grid and action group", async () => {
    render(
      <PatientDetailPage
        patient={patientFixture}
        onBack={() => {}}
        onNewCheckup={() => {}}
        onEditCheckup={() => {}}
        confirmAction={async () => false}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Ahmed Raza" })).toBeTruthy();
    expect(screen.getByText("21 yrs")).toBeTruthy();
    expect(screen.getAllByText("AB+").length).toBe(2);
    expect(screen.getByRole("button", { name: /Book Today's Appointment/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "✏️ Edit Profile" })).toBeTruthy();

    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("Blood Group")).toBeTruthy();
    expect(screen.getByText("Patient Since")).toBeTruthy();
    expect(screen.getByText("Allergies / Medical History")).toBeTruthy();
    expect(screen.getByText("10 January 2025")).toBeTruthy();
    expect(screen.getByText("Penicillin allergy")).toBeTruthy();
  });

  it("renders the visit card: date, latest badge, paid pill, PDF bar and blocks", async () => {
    render(
      <PatientDetailPage
        patient={patientFixture}
        onBack={() => {}}
        onNewCheckup={() => {}}
        onEditCheckup={() => {}}
        confirmAction={async () => false}
      />,
    );

    expect(await screen.findByText("26 August 2026")).toBeTruthy();
    expect(screen.getByText("Latest")).toBeTruthy();
    expect(screen.getByText("Rs. 3,900")).toBeTruthy();
    expect(screen.getByText("Paid")).toBeTruthy();
    expect(screen.getByText("Follow-up: 26 September 2026")).toBeTruthy();

    expect(screen.getByText("View / Download PDF →")).toBeTruthy();
    expect(screen.getByText("Medicines")).toBeTruthy();
    expect(screen.getByText("Amlodipine")).toBeTruthy();
    expect(screen.getByText("5mg · Once a day · 1 month")).toBeTruthy();
    expect(screen.getByText("Diseases / Diagnosis")).toBeTruthy();
    expect(screen.getByText("Hypertension")).toBeTruthy();
    expect(screen.getByText("Lab Tests")).toBeTruthy();
    expect(screen.getByText("CBC")).toBeTruthy();
    expect(screen.getByText("Patient Advice")).toBeTruthy();
    expect(
      screen.getByText("Walk 30 minutes daily and avoid oily food."),
    ).toBeTruthy();
    expect(screen.getByText("BP trending down, keep monitoring.")).toBeTruthy();

    expect(screen.getByRole("button", { name: "✏️ Edit Checkup" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "🗑️ Delete" })).toBeTruthy();
  });

  it("loads the record and history when only a patient id is supplied", async () => {
    render(
      <PatientDetailPage
        patientId="p1"
        onBack={() => {}}
        onNewCheckup={() => {}}
        onEditCheckup={() => {}}
        confirmAction={async () => false}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Ahmed Raza" })).toBeTruthy();
    expect(await screen.findByText("26 August 2026")).toBeTruthy();
    expect(requestLog).toContain("GET /patients/p1");
    expect(requestLog).toContain("GET /checkups/p1?limit=500");
  });
});

describe("booking + form flows", () => {
  it("posts the slot together with the upfront consultation fee", async () => {
    const user = userEvent.setup();
    render(<PatientsPage />);

    await user.click((await screen.findAllByText("📅 Book Slot"))[0]);
    await user.click(await screen.findByRole("button", { name: /17:30/ }));
    await user.type(screen.getByLabelText("Fee (Rs.)"), "4000");
    await user.type(screen.getByLabelText("Discount (Rs.)"), "100");

    expect(screen.getByText("Rs. 3,900")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm Booking" }));

    await waitFor(() => {
      expect(requestLog.some((entry) => entry.startsWith("POST /appointments"))).toBe(true);
    });
    const post = requestLog.find((entry) => entry.startsWith("POST /appointments"));
    expect(post).toContain('"slot":"17:30"');
    expect(post).toContain('"patientId":"p1"');
    expect(post).toContain('"amount":4000');
    expect(post).toContain('"discount":100');
    expect(post).toContain('"consultationFee":3900');
    expect(post).toContain('"paymentMethod":"Cash"');
  });

  it("renders the register-patient form with doctor locations", async () => {
    render(<AddPatientForm onBack={() => {}} onAdded={() => {}} />);

    expect(screen.getByRole("heading", { name: "Register New Patient" })).toBeTruthy();
    expect(screen.getByLabelText("Full Name *")).toBeTruthy();
    expect(screen.getByLabelText("Gender *")).toBeTruthy();
    expect(screen.getByRole("button", { name: /City Care Clinic/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Register Patient ✓" })).toBeTruthy();
  });

  it("renders the checkup form seeded from an existing checkup", async () => {
    render(
      <CheckupForm
        patient={patientFixture}
        existingCheckup={checkupFixture}
        onBack={() => {}}
        onSaved={() => {}}
      />,
    );

    expect(screen.getByText("Ahmed Raza")).toBeTruthy();
    expect(screen.getByText("Edit Checkup")).toBeTruthy();
    expect(screen.getByDisplayValue("Hypertension Stage 2")).toBeTruthy();
    expect(screen.getByDisplayValue("Amlodipine")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Regenerate Prescription PDF/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update Checkup ✓" })).toBeTruthy();
  });
});
