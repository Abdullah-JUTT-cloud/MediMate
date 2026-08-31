/**
 * Runtime verification — Task 1: "Leave Feedback" wiring.
 *
 *  1. Mock preview dashboard (/book/dashboard): the Leave Feedback button on a
 *     completed booking opens a review modal; submitting marks the booking as
 *     reviewed and swaps the button for a disabled "Review Submitted" label.
 *  2. Live Patient Dashboard (pages/booking/PatientDashboardPage.jsx): the
 *     button opens a modal pre-filled with the appointment, POSTs to
 *     /patient-account/reviews through the authenticated session, and flips to
 *     the "Review Submitted" state. Already-reviewed appointments show the
 *     disabled label instead of the button.
 *
 * Run with: npx vitest run
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "../api/axios";
import DashboardPage from "../booking/DashboardPage";
import PatientDashboardPage from "../pages/booking/PatientDashboardPage";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const liveAppointment = {
  _id: "ap1",
  status: "Completed",
  reviewed: false,
  date: "2026-08-22",
  slot: "02:00 PM",
  type: "Consultation",
  consultationFee: 500,
  doctor: {
    _id: "doc-fatima",
    title: "Dr.",
    fullName: "Fatima Noor",
    specialization: "Dermatologist",
    profilePicUrl: "",
  },
};

describe("mock preview dashboard — Leave Feedback", () => {
  afterEach(cleanup);

  it("opens the review modal and flips the button to Review Submitted", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Go to the Completed tab and open the review modal.
    const completedTab = screen.getByRole("button", { name: /Completed/ });
    fireEvent.click(completedTab);

    const leaveFeedback = screen.getByRole("button", { name: /Leave Feedback/ });
    expect(leaveFeedback).toBeTruthy();
    fireEvent.click(leaveFeedback);

    const dialog = screen.getByRole("dialog", { name: /Rate your visit/ });
    expect(within(dialog).getByText((content) => content.includes("Fatima Noor"))).toBeTruthy();

    // Pick a rating and submit.
    fireEvent.click(within(dialog).getByRole("button", { name: /5 stars/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Submit Review/ }));

    // Button is now disabled with the "Review Submitted" label.
    const submitted = await screen.findByRole("button", { name: /Review Submitted/ });
    expect(submitted.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /Leave Feedback/ })).toBeNull();
  });
});

describe("live patient dashboard — Leave Feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === "/patient-account/me") {
        return Promise.resolve({ data: { patient: { _id: "p1", name: "Abdullah Jutt" } } });
      }
      if (url === "/patient-account/appointments") {
        return Promise.resolve({ data: { appointments: [liveAppointment], pagination: { total: 1 } } });
      }
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { message: "Thank you for your review!" } });
  });

  afterEach(cleanup);

  it("opens a pre-filled modal and POSTs to /patient-account/reviews", async () => {
    render(
      <MemoryRouter>
        <PatientDashboardPage />
      </MemoryRouter>
    );

    const leaveFeedback = await screen.findByRole("button", { name: /Leave Feedback/ });
    fireEvent.click(leaveFeedback);

    const dialog = screen.getByRole("dialog", { name: /Rate your visit/ });
    expect(within(dialog).getByText(/Dr\. Fatima Noor/)).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: /5 stars/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Submit Review/ }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/patient-account/reviews",
        expect.objectContaining({
          appointmentId: "ap1",
          doctorId: "doc-fatima",
          rating: 5,
        })
      );
    });

    // Local state flips to the disabled "Review Submitted" label.
    const submitted = await screen.findByRole("button", { name: /Review Submitted/ });
    expect(submitted.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /Leave Feedback/ })).toBeNull();
  });

  it("shows only the disabled Review Submitted label when already reviewed", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/patient-account/me") {
        return Promise.resolve({ data: { patient: { _id: "p1", name: "Abdullah Jutt" } } });
      }
      if (url === "/patient-account/appointments") {
        return Promise.resolve({
          data: { appointments: [{ ...liveAppointment, reviewed: true }], pagination: { total: 1 } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <PatientDashboardPage />
      </MemoryRouter>
    );

    const submitted = await screen.findByRole("button", { name: /Review Submitted/ });
    expect(submitted.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /Leave Feedback/ })).toBeNull();
  });
});
