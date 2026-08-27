/**
 * Runtime verification for the Emergency Appointment Booking feature:
 *  - Emergency Case toggle (red when ON) in BOTH booking surfaces
 *  - Full slots locked when OFF, selectable (red hover) when ON
 *  - Red +N emergency badges + "Slot HH:MM - N/3 Booked (+N Emergency)" tooltip
 *  - POST /appointments carries isEmergency so the backend bypasses capacity
 *
 * Run with: npx vitest run --environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { requestLog } = vi.hoisted(() => ({ requestLog: [] }));

const patientFixture = {
  _id: "p1",
  name: "Ahmed Raza",
  age: 21,
  gender: "Male",
  phone: "03001234567",
  bloodGroup: "AB+",
  locations: [
    { locationType: "Clinic", locationId: "c1", locationName: "City Care Clinic" },
  ],
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

const slotPayload = [
  { time: "17:00", standardCount: 1, emergencyCount: 0, totalCount: 1, isFull: false },
  { time: "17:30", standardCount: 3, emergencyCount: 1, totalCount: 4, isFull: true },
  { time: "18:00", standardCount: 0, emergencyCount: 0, totalCount: 0, isFull: false },
];

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(async (url) => {
      requestLog.push(`GET ${url}`);
      if (url.startsWith("/slots?")) {
        return { data: { maxPerSlot: 3, slots: slotPayload } };
      }
      if (url.startsWith("/appointments?")) {
        return { data: { appointments: [] } };
      }
      if (url.startsWith("/patients/")) {
        return { data: { patient: patientFixture } };
      }
      if (url.startsWith("/patients?")) {
        return { data: { patients: [patientFixture] } };
      }
      throw new Error(`Unexpected GET ${url}`);
    }),
    post: vi.fn(async (url, body) => {
      requestLog.push(`POST ${url} ${JSON.stringify(body)}`);
      return { data: { appointment: { _id: "a1", ...body } } };
    }),
    put: vi.fn(async () => ({ data: {} })),
    delete: vi.fn(async () => ({ data: { message: "ok" } })),
  },
  getApiBaseUrl: () => "/api",
}));

vi.mock("../store/authStore", () => ({
  default: () => ({ doctor: doctorFixture }),
}));

import PatientsPage from "../pages/PatientsPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import SlotPicker from "../components/patients/SlotPicker";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-08-26T12:00:00.000Z"));
  requestLog.length = 0;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const openPatientModal = async () => {
  const user = userEvent.setup();
  render(<PatientsPage />);
  await user.click((await screen.findAllByText("📅 Book Slot"))[0]);
  await screen.findByRole("dialog", { name: /Book appointment for Ahmed Raza/i });
  return user;
};

describe("shared SlotPicker grid", () => {
  const slots = [{ time: "17:30", locationName: "City Care Clinic" }];
  const availability = {
    "17:30": { standardCount: 3, emergencyCount: 1, totalCount: 4, isFull: true },
  };

  it("defaults Emergency OFF, locks full slots and renders the red +N badge + tooltip", () => {
    render(
      <SlotPicker
        slots={slots}
        availability={availability}
        selectedSlot=""
        onSelectSlot={() => {}}
        isEmergency={false}
        onEmergencyChange={() => {}}
      />,
    );

    const toggle = screen.getByRole("switch", { name: /Emergency Case/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    const fullSlot = screen.getByRole("button", { name: /Slot 17:30/i });
    expect(fullSlot.disabled).toBe(true);
    expect(fullSlot.className).toContain("cursor-not-allowed");
    expect(fullSlot.className).toContain("bg-slate-100");

    expect(fullSlot.title).toBe("Slot 17:30 - 3/3 Booked (+1 Emergency)");
    expect(screen.getByText("+1")).toBeTruthy();
    expect(fullSlot.className).toContain("border-red-400");

    expect(toggle.className).toContain("bg-slate-300");
    expect(toggle.className).not.toContain("bg-red-600");
  });

  it("enables full slots with a red switch + red hover state when Emergency is ON", () => {
    let emergency = false;
    const { rerender } = render(
      <SlotPicker
        slots={slots}
        availability={availability}
        selectedSlot=""
        onSelectSlot={() => {}}
        isEmergency={emergency}
        onEmergencyChange={(value) => {
          emergency = value;
          rerender(
            <SlotPicker
              slots={slots}
              availability={availability}
              selectedSlot=""
              onSelectSlot={() => {}}
              isEmergency={emergency}
              onEmergencyChange={() => {}}
            />,
          );
        }}
      />,
    );

    const toggle = screen.getByRole("switch", { name: /Emergency Case/i });
    fireEvent.click(toggle);
    expect(emergency).toBe(true);

    const activeToggle = screen.getByRole("switch", { name: /Emergency Case/i });
    expect(activeToggle.getAttribute("aria-checked")).toBe("true");
    expect(activeToggle.className).toContain("bg-red-600");
    expect(activeToggle.className).toContain("ring-red-500");

    const fullSlot = screen.getByRole("button", { name: /Slot 17:30/i });
    expect(fullSlot.disabled).toBe(false);
    expect(fullSlot.className).toContain("border-red-500");
    expect(fullSlot.className).toContain("hover:bg-red-50");
  });
});

describe("Patient booking modal (BookAppointmentModal)", () => {
  it("shows the Emergency toggle, locks full slots and posts isEmergency when overridden", async () => {
    const user = await openPatientModal();

    const toggle = await screen.findByRole("switch", { name: /Emergency Case/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    const fullSlot = await screen.findByRole("button", { name: /Slot 17:30/i });
    expect(fullSlot.disabled).toBe(true);
    // Red emergency badge from the aggregated slot data.
    expect(await screen.findByText("+1")).toBeTruthy();

    // Allow the full slot via Emergency Mode.
    await user.click(toggle);
    expect(screen.getByRole("switch", { name: /Emergency Case/i }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: /Slot 17:30/i }).disabled).toBe(false);

    await user.click(screen.getByRole("button", { name: /Slot 17:30/i }));
    await user.type(screen.getByLabelText("Fee (Rs.)"), "4000");
    await user.type(screen.getByLabelText("Discount (Rs.)"), "0");
    await user.click(screen.getByRole("button", { name: "Confirm Booking" }));

    await waitFor(() => {
      expect(requestLog.some((entry) => entry.startsWith("POST /appointments"))).toBe(true);
    });
    const post = requestLog.find((entry) => entry.startsWith("POST /appointments"));
    expect(post).toContain('"isEmergency":true');
    expect(post).toContain('"slot":"17:30"');
  });

  it("requests aggregated availability from /api/slots", async () => {
    await openPatientModal();
    await waitFor(() => {
      expect(requestLog.some((entry) => entry.startsWith("GET /slots?"))).toBe(true);
    });
  });
});

describe("Appointments booking form (AppointmentsPage)", () => {
  it("shares the same slot grid + Emergency toggle and posts the override", async () => {
    const user = userEvent.setup();
    const { container } = render(<AppointmentsPage initialPatient={patientFixture} />);

    // Pre-selected patient hydrates the booking form (assumes a date first).
    const dateInput = container.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: "2026-08-26" } });

    // Slots card appears once patient + date are set; it hosts the shared
    // SlotPicker incl. the Emergency Case toggle.
    const toggle = await screen.findByRole("switch", { name: /Emergency Case/i });
    const fullSlot = await screen.findByRole("button", { name: /Slot 17:30/i });
    expect(fullSlot.disabled).toBe(true);

    fireEvent.click(toggle);
    expect(screen.getByRole("switch", { name: /Emergency Case/i }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: /Slot 17:30/i }).disabled).toBe(false);

    await user.click(screen.getByRole("button", { name: /Slot 17:30/i }));
    await user.click(screen.getByRole("button", { name: "Emergency" }));

    // Fill billing amount + confirm booking.
    const amountInput = screen.getAllByPlaceholderText("2000")[0];
    fireEvent.change(amountInput, { target: { value: "4000" } });
    await user.click(screen.getByRole("button", { name: /Book Appointment/i }));

    await waitFor(() => {
      expect(requestLog.some((entry) => entry.startsWith("POST /appointments"))).toBe(true);
    });
    const post = requestLog.find((entry) => entry.startsWith("POST /appointments"));
    expect(post).toContain('"isEmergency":true');
  });
});
