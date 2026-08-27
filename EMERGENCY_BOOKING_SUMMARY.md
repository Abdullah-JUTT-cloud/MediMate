# Emergency Appointment Booking — Implementation Summary

Emergency slot booking with capacity overrides, a red "Emergency Case" toggle,
and red indicator badges, shared by **both** booking surfaces (Patient page
book-slot modal and Appointments page booking form).

Verification: `npx vitest run --environment jsdom` → **27/27 tests pass**
(3 files, incl. new `emergencyBooking.verify.test.jsx`), `npm run lint` clean,
`npm run build` succeeds.

---

## Modified / Added Files

| # | File | Change |
|---|------|--------|
| 1 | `server/models/appointment.model.js` | Added `isEmergency` field + slot aggregation index |
| 2 | `server/services/slotService.js` | **NEW** — per-slot aggregation (`standardCount`, `emergencyCount`, `totalCount`, `isFull`) |
| 3 | `server/controllers/appointment.controller.js` | New `GET /api/slots` handler; capacity override in `createAppointment` (and `updateAppointment`) |
| 4 | `server/routes/slot.routes.js` | **NEW** — `GET /api/slots?date=YYYY-MM-DD` (auth-protected) |
| 5 | `server/server.js` | Mounts `/api/slots` |
| 6 | `client/src/components/patients/SlotPicker.jsx` | **NEW** — shared Emergency toggle + slot grid + red badges (used by both surfaces) |
| 7 | `client/src/components/patients/slotAvailability.js` | **NEW** — shared `/api/slots` fetch + fallback + `useSlotAvailability` hook |
| 8 | `client/src/components/patients/BookAppointmentModal.jsx` | Patient page modal now uses `SlotPicker`, sends `isEmergency` |
| 9 | `client/src/pages/AppointmentsPage.jsx` | Appointments `BookAppointmentForm` now uses `SlotPicker`, sends `isEmergency` |
| 10 | `client/src/__tests__/emergencyBooking.verify.test.jsx` | **NEW** — feature verification tests |

> Note: the requested `models/Appointment.js` / `controllers/appointmentController.js`
> are named `appointment.model.js` / `appointment.controller.js` in this repo, and
> `AppointmentForm.jsx` is the `BookAppointmentForm` embedded in `AppointmentsPage.jsx`.
> Those are the files changed above.

---

## Task 1 — Backend Schema & Capacity Validation Override

### Schema (`server/models/appointment.model.js`)

```js
// Emergency override flag: emergency bookings bypass the 3-per-slot
// standard capacity check and are counted separately in slot aggregation.
isEmergency: {
    type: Boolean,
    default: false,
},
```

```js
// Slot availability aggregation index: groups active bookings per time slot
// and separates standard vs emergency counts (GET /api/slots).
appointmentSchema.index({ doctor: 1, date: 1, slot: 1, isEmergency: 1, status: 1 });
```

### Slot aggregation service (`server/services/slotService.js`)

```js
export const getSlotAvailability = async ({ doctorId, dayRange }) => {
  const result = await Appointment.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(String(doctorId)),
                date: { $gte: dayRange.startOfDay, $lte: dayRange.endOfDay },
                status: { $nin: INACTIVE_STATUSES } } },
    { $group: { _id: { time: "$slot", isEmergency: { $ifNull: ["$isEmergency", false] } },
                count: { $sum: 1 } } },
    { $group: { _id: "$_id.time",
                standardCount: { $sum: { $cond: [{ $eq: ["$_id.isEmergency", false] }, "$count", 0] } },
                emergencyCount: { $sum: { $cond: [{ $eq: ["$_id.isEmergency", true] }, "$count", 0] } } } },
    { $project: { _id: 0, time: "$_id", standardCount: 1, emergencyCount: 1,
                  totalCount: { $add: ["$standardCount", "$emergencyCount"] },
                  isFull: { $gte: ["$standardCount", MAX_STANDARD_APPOINTMENTS_PER_SLOT] } } },
    { $sort: { time: 1 } },
  ]);
  return Array.isArray(result) ? result : [];
};
```

### Aggregation API (`server/controllers/appointment.controller.js` + `server/routes/slot.routes.js`)

`GET /api/slots?date=YYYY-MM-DD` → `{ date, maxPerSlot: 3, slots: [{ time, standardCount, emergencyCount, totalCount, isFull }] }`

### Creation validation (`createAppointment`)

```js
const isEmergency = req.body.isEmergency === true || req.body.isEmergency === "true";

// Capacity check uses STANDARD (non-emergency) bookings only.
const standardCount = await Appointment.countDocuments({
  doctor: req.doctorId, date, slot,
  status: { $nin: INACTIVE_STATUSES },
  isEmergency: { $ne: true },
});

if (!isEmergency && standardCount >= MAX_APPOINTMENTS_PER_SLOT) {
  return res.status(400).json({
    message: "Slot capacity reached. Enable Emergency Mode to override",
  });
}
// ... isEmergency persisted on the Appointment document.
```

If `isEmergency === true` the capacity check is skipped entirely (unlimited
bookings). `updateAppointment` uses the same rule when re-checking slot moves.

---

## Task 2 — Emergency Toggle & Responsive UI (both surfaces)

Shared `SlotPicker.jsx` renders **one** Emergency toggle + slot grid that both
`BookAppointmentModal` and `AppointmentsPage` mount.

### Toggle (default OFF → red when ON)

```jsx
<button
  type="button" role="switch" aria-checked={isEmergency}
  aria-label="Emergency Case" onClick={() => onChange(!isEmergency)}
  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ${
      isEmergency
        ? "bg-red-600 ring-red-500 focus:ring-red-500/50"
        : "bg-slate-300 dark:bg-slate-600 focus:ring-teal-500/40"
    }`}>
  <span className="pointer-events-none ... bg-white shadow ..."
        style={{ transform: isEmergency ? "translateX(20px)" : "translateX(0px)" }} />
</button>
```

### Slot card selection logic

```
isEmergency === false:
  isFull → disabled + cursor-not-allowed opacity-50 bg-slate-100
  otherwise → teal hover / teal selected

isEmergency === true:
  ALL slots enabled; cards use border-red-500 hover:bg-red-50 (red theme),
  selected card = bg-red-600 text-white
```

```jsx
const isDisabled = !isEmergency && isFull;
...
disabled={isDisabled}
onClick={() => onSelectSlot(entry.time)}
className={`relative rounded-xl border px-2 py-2.5 text-sm font-bold transition-colors ${cardClasses}`}
```

---

## Task 3 — Red Emergency Badges & Slot Styling

When `slot.emergencyCount > 0`:

1. **Border/background:** `border-red-400 bg-red-50/40 text-red-700` (+ dark variants; full slots keep red border too).
2. **Badge (top-right, absolute):**

```jsx
{hasEmergency && (
  <span className="absolute -top-2 -right-2 z-10 flex h-5 min-w-[20px] items-center justify-center
                   rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white
                   shadow-sm ring-2 ring-white dark:ring-slate-900">
    +{emergencyCount}
  </span>
)}
```

3. **Tooltip:**

```jsx
const tooltip = `Slot ${entry.time} - ${standardCount}/${maxPerSlot} Booked${
  hasEmergency ? ` (+${emergencyCount} Emergency)` : ""
}`;
// e.g. Slot 23:00 - 3/3 Booked (+1 Emergency)
<button ... title={tooltip}>
```

A small red `+N Emergency` label also renders under the slot time.

### Shared data layer (`slotAvailability.js`)

Both surfaces fetch the **same** data from `GET /api/slots?date=…` via
`useSlotAvailability(date)` and fall back to deriving counts from
`GET /appointments` for older servers.

---

## Run

```bash
# client: tests, lint, build
cd client && npx vitest run --environment jsdom && npm run lint && npm run build

# server (start with MongoDB + env vars from server/.env.example)
cd server && npm start
```
