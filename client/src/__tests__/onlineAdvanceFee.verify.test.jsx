/**
 * Runtime verification for the online-advance fee rule:
 *
 *   "Rs 500 was already paid online → the doctor enters the FULL price (2000)
 *    → the system records 2000 → the desk collects the 1500 difference."
 *
 * The advance must never be subtracted from the bill (that was the bug: a
 * 2,000 consultation landed in Revenue Lab as 1,500 and the 500 online advance
 * was never logged anywhere), and it must never be re-stated as a discount.
 *
 * Run with:  npx vitest run src/__tests__/onlineAdvanceFee.verify.test.jsx
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  computeConsultationFee,
  buildFeeFieldHint,
  buildCollectNowNote,
  formatPkr,
  resolveQueueFee,
} from "../utils/consultationFee";

const onlineBooking = {
  _id: "appt1",
  date: "2026-09-10T00:00:00.000Z",
  slot: "09:00 AM",
  type: "Consultation",
  status: "Pending",
  awaitingOnlineApproval: true,
  consultationFee: 500, // advance seeded by the booking flow
  advanceAmountPaid: 500, // verified proof amount
  patientAccount: { _id: "acc1", name: "Ahmed Khan", phone: "03001234567" },
};

const deferredAppointment = {
  _id: "appt1",
  date: "2026-09-10T00:00:00.000Z",
  slot: "09:00 AM",
  type: "Consultation",
  status: "Confirmed",
  queueStatus: "IN_CONSULTATION",
  payAtConsultation: true,
  advanceAmountPaid: 500,
  balanceDue: 1500,
  standardFee: 0,
  discountAmount: 0,
  netAmount: 0,
  consultationFee: 0,
  paymentStatus: "PENDING",
  patient: { _id: "p1", name: "Ahmed Khan", age: 34, gender: "Male", phone: "03001234567" },
};

const requestLog = [];

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(async (url) => {
      requestLog.push(`GET ${url}`);
      if (url.startsWith("/appointments/online-pending")) {
        return { data: { appointments: [onlineBooking], rejectedAppointments: [] } };
      }
      return { data: {} };
    }),
    patch: vi.fn(async (url, body) => {
      requestLog.push(`PATCH ${url} ${JSON.stringify(body)}`);
      return { data: { message: "Online booking approved and confirmed" } };
    }),
    post: vi.fn(async (url, body) => {
      requestLog.push(`POST ${url} ${JSON.stringify(body)}`);
      return { data: { message: "ok" } };
    }),
  },
}));

beforeEach(() => {
  requestLog.length = 0;
  cleanup();
});

describe("fee math (shared client formula)", () => {
  it("treats the entered price as the bill and the advance as a part of it", () => {
    const fee = computeConsultationFee({ standardFee: 2000, discountAmount: 0, advanceAmountPaid: 500 });
    expect(fee.netAmount).toBe(2000);
    expect(fee.balanceDue).toBe(1500);
    expect(fee.advanceAmountPaid).toBe(500);
    expect(fee.discountAmount).toBe(0);
  });

  it("applies the discount before the advance split", () => {
    const fee = computeConsultationFee({ standardFee: "2000", discountAmount: "200", advanceAmountPaid: 500 });
    expect(fee.netAmount).toBe(1800);
    expect(fee.balanceDue).toBe(1300);
  });

  it("keeps a walk-in (no advance) bill and cash-due identical", () => {
    const fee = computeConsultationFee({ standardFee: 1000, discountAmount: 200 });
    expect(fee.netAmount).toBe(800);
    expect(fee.balanceDue).toBe(800);
  });

  it("never reports negative cash due when the advance covers the fee", () => {
    const fee = computeConsultationFee({ standardFee: 400, advanceAmountPaid: 500 });
    expect(fee.netAmount).toBe(400);
    expect(fee.balanceDue).toBe(0);
  });

  it("tolerates empty/partial input while the doctor is typing", () => {
    expect(computeConsultationFee({ standardFee: "", advanceAmountPaid: 500 }).netAmount).toBe(0);
    expect(computeConsultationFee({ standardFee: "abc", advanceAmountPaid: -10 }).balanceDue).toBe(0);
  });

  it("words the field hint around the FULL price, not the balance", () => {
    expect(buildFeeFieldHint(500)).toContain("Rs. 500 is already paid by the patient online");
    expect(buildFeeFieldHint(500)).toMatch(/Enter the FULL price/i);
    expect(buildFeeFieldHint(0)).not.toMatch(/already paid/i);
  });

  it("states the cash to collect and the number the system records", () => {
    const note = buildCollectNowNote({ standardFee: 2000, discountAmount: 0, advanceAmountPaid: 500 });
    expect(note.tone).toBe("due");
    expect(note.text).toContain("Collect Rs. 1,500 more from the patient");
    expect(note.text).toContain("adds the full Rs. 2,000");
    expect(formatPkr(1500)).toBe("Rs. 1,500");
  });

  it("says nothing more is due when the advance covers the fee", () => {
    const note = buildCollectNowNote({ standardFee: 500, advanceAmountPaid: 500 });
    expect(note.tone).toBe("covered");
    expect(note.text).toMatch(/Nothing more to collect/i);
  });
});

describe("Online Approvals page — fee charged at the approvals page", () => {
  it("tells the doctor to enter the full price and shows the collect-now line", async () => {
    const user = userEvent.setup();
    const { default: OnlineBookingsPage } = await import("../pages/OnlineBookingsPage");
    render(<OnlineBookingsPage />);

    await user.click(await screen.findByRole("button", { name: /Approve & Set Fee/i }));

    const modal = await screen.findByRole("heading", { name: /Approve Online Booking/i });
    const dialog = modal.closest("div.fixed") || document.body;

    // The advance is called out explicitly, and the field takes the full price.
    expect(within(dialog).getByText(/Rs\. 500 is already paid by the patient online/i)).toBeTruthy();
    expect(within(dialog).getByText("Paid Online By Patient:", { exact: false })).toBeTruthy();

    const priceInput = within(dialog).getByPlaceholderText(/complete fee/i);
    expect(priceInput.getAttribute("type")).toBe("number");

    // Live breakdown appears once the full price is typed.
    await user.type(priceInput, "2000");
    expect(await within(dialog).findByText(/Collect Rs\. 1,500 more from the patient at this visit/i)).toBeTruthy();

    await user.click(within(dialog).getByRole("button", { name: /Confirm Approval/i }));

    await waitFor(() => {
      const patch = requestLog.find((entry) => entry.startsWith("PATCH /appointments/appt1/approve-online"));
      expect(patch).toBeTruthy();
      // The full price is what gets sent — never the 1,500 remainder.
      expect(patch).toContain('"checkupPrice":2000');
      expect(patch).not.toContain('"checkupPrice":1500');
    });
  });

  it("requires an explicit price instead of silently approving at Rs 0", async () => {
    const user = userEvent.setup();
    const { default: OnlineBookingsPage } = await import("../pages/OnlineBookingsPage");
    render(<OnlineBookingsPage />);

    await user.click(await screen.findByRole("button", { name: /Approve & Set Fee/i }));
    const modal = await screen.findByRole("heading", { name: /Approve Online Booking/i });
    const dialog = modal.closest("div.fixed") || document.body;

    await user.click(within(dialog).getByRole("button", { name: /Confirm Approval/i }));

    await waitFor(() => expect(requestLog.some((e) => e.startsWith("PATCH"))).toBe(false));
  });
});

describe("Consultation Workspace — price taken at consultation time", () => {
  const openWorkspace = async () => {
    const { default: Workspace } = await import("../pages/ConsultationWorkspaceRedesigned");
    render(
      <Workspace
        isOpen
        onClose={() => {}}
        appointment={deferredAppointment}
        history={[]}
        onCheckupComplete={() => {}}
      />,
    );

    const feeInput = await screen.findByLabelText(/Full Consultation Price/i);
    return { feeInput, Workspace };
  };

  it("labels the field with the advance context and the full-price instruction", async () => {
    await openWorkspace();
    expect(screen.getByText(/Rs\. 500 is already paid by the patient online while booking/i)).toBeTruthy();
  });

  it("shows the total that will be recorded and the cash to collect now", async () => {
    const user = userEvent.setup();
    const { feeInput } = await openWorkspace();

    await user.type(feeInput, "2000");

    expect(await screen.findByText("Total added to the system")).toBeTruthy();
    expect(screen.getByText("Rs. 2,000")).toBeTruthy();
    expect(screen.getByText("Already paid online by patient")).toBeTruthy();
    expect(screen.getByText("− Rs. 500")).toBeTruthy();
    expect(screen.getByText("Collect now at the desk")).toBeTruthy();
    expect(screen.getByText("Rs. 1,500")).toBeTruthy();
  });

  it("posts the FULL fee (advance included) when the consultation is saved", async () => {
    const user = userEvent.setup();
    const { feeInput } = await openWorkspace();

    await user.type(feeInput, "2000");
    await user.type(screen.getByPlaceholderText(/Acute Viral Bronchitis/i), "Dental caries");
    await user.type(screen.getByPlaceholderText(/Augmentin/i), "Panadol");
    await user.type(screen.getByPlaceholderText(/500mg, 1 tablet/i), "500mg");
    await user.type(screen.getByPlaceholderText(/1-0-1, 2x Daily/i), "1-0-1");
    await user.type(screen.getByPlaceholderText(/5 Days, 1 Week/i), "3 Days");

    await user.click(screen.getByRole("button", { name: /WhatsApp Prescription/i }));

    await waitFor(() => {
      expect(requestLog.some((entry) => entry.startsWith("POST /checkups/complete"))).toBe(true);
    });
    const post = requestLog.find((entry) => entry.startsWith("POST /checkups/complete"));
    const payload = JSON.parse(post.replace("POST /checkups/complete ", ""));

    // The ledger gets the full price; the advance travels with it as a split.
    expect(payload.payment.amount).toBe(2000);
    expect(payload.payment.netAmount).toBe(2000);
    expect(payload.payment.standardFee).toBe(2000);
    expect(payload.payment.discountAmount).toBe(0);
    expect(payload.payment.advanceAmountPaid).toBe(500);
  });
});

// ─── Doctor Queue fee badge ───────────────────────────────────────────────────
describe("resolveQueueFee — the badge the doctor scans all day", () => {
  it("keeps the full price as the headline and the advance as the collect line", () => {
    const fee = resolveQueueFee({
      billed: 2000,
      advanceAmountPaid: 500,
      balanceDue: 1500,
      payAtConsultation: true,
    });

    expect(fee.label).toBe("Pending Rs. 2,000");
    expect(fee.collectNow).toBe(1500);
    expect(fee.hint).toBe("Rs. 500 paid online — collect Rs. 1,500 at this visit.");
    expect(fee.tone).toBe("amber");
  });

  it("falls back to its own subtraction when balanceDue is missing (cached rows)", () => {
    const fee = resolveQueueFee({ billed: 2000, advanceAmountPaid: 500 });
    expect(fee.collectNow).toBe(1500);
  });

  it("says 'fully covered' when the advance already paid for the visit", () => {
    const fee = resolveQueueFee({ billed: 500, advanceAmountPaid: 500, balanceDue: 0 });
    expect(fee.isCovered).toBe(true);
    expect(fee.collectNow).toBe(0);
    expect(fee.hint).toContain("fully covered");
    expect(fee.tone).toBe("emerald");
  });

  it("does not show a fake 'Pending Rs. 0' for a deferred visit priced later", () => {
    const fee = resolveQueueFee({ billed: 0, advanceAmountPaid: 500, payAtConsultation: true });
    expect(fee.isUnpriced).toBe(true);
    expect(fee.label).toBe("Price at consultation");
    expect(fee.hint).toContain("the FULL price is entered at the consultation");
    expect(fee.collectNow).toBe(0);
    expect(fee.tone).toBe("slate");
  });

  it("treats an unapproved online booking as a placeholder advance, not a settled bill", () => {
    // Before approval the stored fee is only the advance the patient paid, so
    // the badge must not read "Billed Rs. 500 / fully covered".
    const fee = resolveQueueFee({
      billed: 500,
      advanceAmountPaid: 500,
      balanceDue: 0,
      awaitingApproval: true,
    });
    expect(fee.label).toBe("Advance Rs. 500 · price pending");
    expect(fee.collectNow).toBe(0);
    expect(fee.isCovered).toBe(false);
    expect(fee.hint).toContain("sets the FULL price when approving");
    expect(fee.tone).toBe("amber");
  });

  it("shows 'Billed' once the visit is settled", () => {
    const fee = resolveQueueFee({
      billed: 2000,
      advanceAmountPaid: 500,
      balanceDue: 1500,
      isSettled: true,
    });
    expect(fee.label).toBe("Billed Rs. 2,000");
    expect(fee.tone).toBe("emerald");
  });

  it("leaves a walk-in (no advance) row exactly as amber-pending as before", () => {
    const fee = resolveQueueFee({ billed: 2000 });
    expect(fee.label).toBe("Pending Rs. 2,000");
    expect(fee.tone).toBe("amber");
    expect(fee.hint).toBe("");
    expect(fee.isCovered).toBe(false);
  });

  it("never claims a covered/pending fee for a booking with no price and no advance", () => {
    const fee = resolveQueueFee({ billed: 0, payAtConsultation: true });
    expect(fee.isUnpriced).toBe(true);
    expect(fee.hint).toBe("");
    expect(fee.tone).toBe("slate");
  });
});
