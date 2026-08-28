import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";

/**
 * Slot availability service.
 *
 * Aggregates active appointments for one calendar day (already converted to a
 * clinic-local [startOfDay, endOfDay] instant range by the controller) and
 * returns, per time slot:
 *   - standardCount:    active non-emergency bookings
 *   - emergencyCount:   active emergency-override bookings
 *   - totalCount:       standardCount + emergencyCount
 *   - isFull:           true when standardCount >= MAX_STANDARD_APPOINTMENTS_PER_SLOT
 *
 * Emergency bookings do NOT count toward the standard capacity: emergency
 * slots stay bookable (and the UI highlights them red) until the clinic
 * decides otherwise.
 */

export const MAX_STANDARD_APPOINTMENTS_PER_SLOT = 3;

const INACTIVE_STATUSES = ["Cancelled", "No-show", "Completed"];

/**
 * Aggregates slot occupancy for a doctor on one clinic-local day.
 *
 * @param {object} params
 * @param {string} params.doctorId    Doctor ObjectId (from the JWT).
 * @param {{startOfDay: Date, endOfDay: Date}} params.dayRange
 * @returns {Promise<Array<{time: string, standardCount: number, emergencyCount: number, totalCount: number, isFull: boolean}>>}
 */
export const getSlotAvailability = async ({ doctorId, dayRange }) => {
  if (!doctorId || !dayRange?.startOfDay || !dayRange?.endOfDay) {
    return [];
  }

  const result = await Appointment.aggregate([
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(String(doctorId)),
        date: { $gte: dayRange.startOfDay, $lte: dayRange.endOfDay },
        status: { $nin: INACTIVE_STATUSES },
        // Exclude pending online bookings — they are not confirmed yet and
        // must not consume standard capacity until the receptionist approves.
        awaitingOnlineApproval: { $ne: true },
      },
    },
    /**
     * Normalize slot strings to canonical 24h "HH:MM" format.
     *
     * Legacy patient-portal bookings stored slots as "09:00 AM" / "09:00 PM"
     * while the doctor portal always writes "09:00" (24h). Without this step
     * the two formats group as different slots, causing wrong counts on both
     * portals. This $addFields pipeline converts any 12h AM/PM string to 24h
     * in-memory before grouping — no DB migration required.
     *
     * Strategy: if the slot string ends in " AM" or " PM", parse and convert;
     * otherwise pass through unchanged (already 24h).
     */
    {
      $addFields: {
        slotNormalized: {
          $let: {
            vars: {
              raw: { $ifNull: ["$slot", ""] },
              // 1 = PM, 0 = AM, -1 = already 24h (no AM/PM suffix)
              isPM: {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ["$slot", ""] }, regex: / PM$/i } },
                  true,
                  false,
                ],
              },
              isAM: {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ["$slot", ""] }, regex: / AM$/i } },
                  true,
                  false,
                ],
              },
            },
            in: {
              $cond: [
                // Has AM/PM suffix — needs conversion
                { $or: ["$$isPM", "$$isAM"] },
                {
                  $let: {
                    vars: {
                      // Strip " AM" or " PM" suffix: take chars before the last space
                      timePart: {
                        $substr: [
                          "$$raw",
                          0,
                          { $subtract: [{ $strLenCP: "$$raw" }, 3] },
                        ],
                      },
                    },
                    in: {
                      $let: {
                        vars: {
                          // Extract hour as integer (handles both "09:00" and "9:00")
                          colonIdx: { $indexOfCP: ["$$timePart", ":"] },
                          hourStr: {
                            $substr: [
                              "$$timePart",
                              0,
                              { $indexOfCP: ["$$timePart", ":"] },
                            ],
                          },
                          minStr: {
                            $substr: [
                              "$$timePart",
                              { $add: [{ $indexOfCP: ["$$timePart", ":"] }, 1] },
                              10,
                            ],
                          },
                        },
                        in: {
                          $let: {
                            vars: {
                              h: { $toInt: "$$hourStr" },
                            },
                            in: {
                              // Convert to 24h: PM adds 12 (except 12 PM stays 12), AM 12 → 0
                              $let: {
                                vars: {
                                  h24: {
                                    $switch: {
                                      branches: [
                                        // 12 AM → 00
                                        {
                                          case: { $and: ["$$isAM", { $eq: ["$$h", 12] }] },
                                          then: 0,
                                        },
                                        // 12 PM → 12
                                        {
                                          case: { $and: ["$$isPM", { $eq: ["$$h", 12] }] },
                                          then: 12,
                                        },
                                        // 1-11 PM → add 12
                                        { case: "$$isPM", then: { $add: ["$$h", 12] } },
                                      ],
                                      default: "$$h", // AM: keep as-is
                                    },
                                  },
                                },
                                in: {
                                  $concat: [
                                    {
                                      $cond: [
                                        { $lt: ["$$h24", 10] },
                                        { $concat: ["0", { $toString: "$$h24" }] },
                                        { $toString: "$$h24" },
                                      ],
                                    },
                                    ":",
                                    "$$minStr",
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                // Already 24h — pass through
                "$$raw",
              ],
            },
          },
        },
      },
    },
    // 1) Count bookings per (normalizedSlot, emergency flag) pair.
    {
      $group: {
        _id: {
          time: "$slotNormalized",
          isEmergency: { $ifNull: ["$isEmergency", false] },
        },
        count: { $sum: 1 },
      },
    },
    // 2) Fold the emergency flag into separate counters per slot time.
    {
      $group: {
        _id: "$_id.time",
        standardCount: {
          $sum: {
            $cond: [{ $eq: ["$_id.isEmergency", false] }, "$count", 0],
          },
        },
        emergencyCount: {
          $sum: {
            $cond: [{ $eq: ["$_id.isEmergency", true] }, "$count", 0],
          },
        },
      },
    },
    // 3) Shape the response and compute standard-capacity fullness.
    {
      $project: {
        _id: 0,
        time: "$_id",
        standardCount: 1,
        emergencyCount: 1,
        totalCount: { $add: ["$standardCount", "$emergencyCount"] },
        isFull: { $gte: ["$standardCount", MAX_STANDARD_APPOINTMENTS_PER_SLOT] },
      },
    },
    { $sort: { time: 1 } },
  ]);

  return Array.isArray(result) ? result : [];
};
