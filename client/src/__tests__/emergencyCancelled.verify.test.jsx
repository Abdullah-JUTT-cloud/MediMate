/**
 * Runtime verification for the refactored Emergency Cancelled Appointments
 * control panel.
 *
 * Run with:  npx vitest run --environment jsdom
 * (needs vitest, jsdom, @testing-library/react)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, within, fireEvent } from "@testing-library/react";

// vi.mock factories are hoisted above the imports, so every shared mutable
// object they close over has to be created inside vi.hoisted().
const { toastMock, requestLog, mockState } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
  requestLog: [],
  mockState: { appointments: [], cancelResponse: { cancelledAppointments: [] } },
}));

vi.mock("react-hot-toast", () => ({
  default: toastMock,
}));

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(async (url) => {
      requestLog.push(`GET ${url}`);
      if (url.startsWith("/appointments?")) {
        return { data: { appointments: mockState.appointments } };
      }
      throw new Error(`Unexpected GET ${url}`);
    }),
    post: vi.fn(async (url, body) => {
      requestLog.push(`POST ${url} ${JSON.stringify(body)}`);
      if (url === "/appointments/emergency-cancel") {
        return { data: mockState.cancelResponse };
      }
      throw new Error(`Unexpected POST ${url}`);
    }),
  },
  getApiBaseUrl: () => "/api",
}));

import EmergencyCancelledPage from "../pages/EmergencyCancelledPage";

const reachableAppointment = {
  _id: "apt-1",
  date: "2026-08-27T00:00:00.000Z",
  slot: "10:00",
  type: "Consultation",
  status: "Cancelled",
  cancellationReason: "Emergency",
  emergencyCancelled: true,
  reminderSent: true,
  cancelledAt: "2026-08-26T09:15:00.000Z",
  patient: { _id: "p1", name: "Ahmed Raza", phone: "03001234567" },
};

const unreachableAppointment = {
  _id: "apt-2",
  date: "2026-08-27T00:00:00.000Z",
  slot: "11:30",
  type: "Follow-up",
  status: "Cancelled",
  cancellationReason: "Emergency",
  emergencyCancelled: true,
  reminderSent: false,
  cancelledAt: "2026-08-26T09:15:00.000Z",
  patient: { _id: "p2", name: "Fatima Noor", phone: "" },
};

const nonEmergencyAppointment = {
  _id: "apt-3",
  date: "2026-08-27T00:00:00.000Z",
  slot: "12:00",
  type: "Check-up",
  status: "Cancelled",
  cancellationReason: "Patient",
  emergencyCancelled: false,
  reminderSent: true,
  patient: { _id: "p3", name: "Bilal Khan", phone: "03019998877" },
};

/** The desktop/tablet directory (the mobile card list duplicates every row). */
const getDirectory = async () => await screen.findByRole("table");

const getRowFor = (table, patientName) =>
  within(table).getByText(patientName).closest("tr");

/** The counter splits "2" and "active reschedules" across nodes, so read textContent. */
const waitForCounter = async (expected) => {
  await waitFor(() => {
    const badge = screen.getByText(/active reschedules|Checking records/);
    expect(badge.textContent.replace(/\s+/g, " ").trim()).toBe(expected);
  });
};

const fillRange = () => {
  fireEvent.change(screen.getByLabelText("Start Date"), { target: { value: "2026-08-27" } });
  fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "09:00" } });
  fireEvent.change(screen.getByLabelText("End Date"), { target: { value: "2026-08-27" } });
  fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "13:00" } });
};

beforeEach(() => {
  requestLog.length = 0;
  toastMock.success.mockClear();
  toastMock.error.mockClear();
  mockState.appointments = [reachableAppointment, unreachableAppointment, nonEmergencyAppointment];
  mockState.cancelResponse = { cancelledAppointments: [] };
});

afterEach(() => {
  cleanup();
});

describe("emergency cancelled control panel — header & counter", () => {
  it("loads only emergency cancellations and shows the rose counter badge", async () => {
    render(<EmergencyCancelledPage />);
    const table = await getDirectory();

    await waitForCounter("2 active reschedules");

    expect(requestLog).toContain("GET /appointments?status=Cancelled&limit=500");
    expect(
      screen.getByRole("heading", { name: "Emergency Cancelled Appointments" }),
    ).toBeTruthy();
    expect(within(table).getByText("Ahmed Raza")).toBeTruthy();
    expect(within(table).getByText("Fatima Noor")).toBeTruthy();
    // Patient-cancelled record without emergencyCancelled stays out of the panel.
    expect(screen.queryByText("Bilal Khan")).toBeNull();
  });

  it("falls back to the neutral badge and clean empty state with no records", async () => {
    mockState.appointments = [];
    render(<EmergencyCancelledPage />);

    await waitForCounter("0 active reschedules");
    expect(
      screen.getByRole("heading", { name: "No emergency cancellations on record" }),
    ).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("cancelled appointments directory table", () => {
  it("renders every directory column with high-contrast patient detail", async () => {
    render(<EmergencyCancelledPage />);
    const table = await getDirectory();

    [
      "Patient",
      "Original Slot",
      "Cancelled On",
      "Reason",
      "WhatsApp Alert Status",
      "Action",
    ].forEach((column) => {
      expect(within(table).getByRole("columnheader", { name: column })).toBeTruthy();
    });

    expect(within(table).getByText("03001234567")).toBeTruthy();
    expect(within(table).getAllByText("—")).toHaveLength(1); // missing contact renders an em dash, not a repeated warning
    expect(within(table).getByText("No WhatsApp number")).toBeTruthy();
    expect(within(table).getAllByText("Emergency")).toHaveLength(2);
  });

  it("keeps the mobile card list in sync with the table", async () => {
    render(<EmergencyCancelledPage />);
    await getDirectory();

    // Once in the table, once in the sm:hidden card list.
    expect(screen.getAllByText("Ahmed Raza")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Reschedule Slot/i })).toHaveLength(4);
  });

  it("derives WhatsApp alert status from the record instead of guessing", async () => {
    render(<EmergencyCancelledPage />);
    const table = await getDirectory();

    expect(within(getRowFor(table, "Ahmed Raza")).getByText("Alert sent")).toBeTruthy();
    expect(within(getRowFor(table, "Fatima Noor")).getByText("No WhatsApp number")).toBeTruthy();
  });

  it("hands the appointment to onReschedule from the action column", async () => {
    const onReschedule = vi.fn();
    render(<EmergencyCancelledPage onReschedule={onReschedule} />);
    const table = await getDirectory();

    fireEvent.click(
      within(getRowFor(table, "Ahmed Raza")).getByRole("button", { name: /Reschedule Slot/i }),
    );

    expect(onReschedule).toHaveBeenCalledTimes(1);
    expect(onReschedule.mock.calls[0][0]._id).toBe("apt-1");
  });
});

describe("bulk emergency cancellation control", () => {
  it("blocks the destructive action until the whole range is set", async () => {
    render(<EmergencyCancelledPage />);
    await getDirectory();

    fireEvent.click(screen.getByRole("button", { name: /Cancel All Appointments in Range/i }));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Select start/end date and time"),
    );
    expect(requestLog.filter((entry) => entry.startsWith("POST"))).toHaveLength(0);
  });

  it("rejects a range that ends before it starts", async () => {
    render(<EmergencyCancelledPage />);
    await getDirectory();

    fireEvent.change(screen.getByLabelText("Start Date"), { target: { value: "2026-08-28" } });
    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText("End Date"), { target: { value: "2026-08-27" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "13:00" } });

    fireEvent.click(screen.getByRole("button", { name: /Cancel All Appointments in Range/i }));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Start date/time must be before end date/time"),
    );
    expect(requestLog.filter((entry) => entry.startsWith("POST"))).toHaveLength(0);
  });

  it("requires explicit confirmation, then posts the range and lists the result", async () => {
    mockState.cancelResponse = {
      cancelledAppointments: [
        {
          ...reachableAppointment,
          _id: "apt-9",
          patient: { _id: "p9", name: "Sana Tariq", phone: "03005554433" },
        },
      ],
    };
    render(<EmergencyCancelledPage />);
    await getDirectory();

    fillRange();
    fireEvent.click(screen.getByRole("button", { name: /Cancel All Appointments in Range/i }));

    await screen.findByRole("dialog");
    expect(
      screen.getByText(/Cancel all appointments from 2026-08-27 09:00 to 2026-08-27 13:00/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Yes, Cancel All" }));

    await screen.findAllByText("Sana Tariq");
    const table = screen.getByRole("table");
    expect(within(table).getByText("Sana Tariq")).toBeTruthy();
    expect(requestLog).toContain(
      'POST /appointments/emergency-cancel {"startDate":"2026-08-27","startTime":"09:00","endDate":"2026-08-27","endTime":"13:00"}',
    );
    expect(toastMock.success).toHaveBeenCalledWith("1 appointments cancelled");
    expect(within(table).getAllByText("Emergency")).toHaveLength(3);
    await waitForCounter("3 active reschedules");
    // Inputs are cleared after a successful bulk cancel.
    expect(screen.getByLabelText("Start Date").value).toBe("");
  });

  it("aborts without posting when the doctor keeps the appointments", async () => {
    render(<EmergencyCancelledPage />);
    await getDirectory();

    fillRange();
    fireEvent.click(screen.getByRole("button", { name: /Cancel All Appointments in Range/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep Appointments" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(requestLog.filter((entry) => entry.startsWith("POST"))).toHaveLength(0);
  });

  it("clears every input from the secondary control", async () => {
    render(<EmergencyCancelledPage />);
    await getDirectory();

    fillRange();
    expect(screen.getByLabelText("End Time").value).toBe("13:00");

    fireEvent.click(screen.getByRole("button", { name: "Clear Inputs" }));

    expect(screen.getByLabelText("Start Date").value).toBe("");
    expect(screen.getByLabelText("Start Time").value).toBe("");
    expect(screen.getByLabelText("End Date").value).toBe("");
    expect(screen.getByLabelText("End Time").value).toBe("");
  });
});
