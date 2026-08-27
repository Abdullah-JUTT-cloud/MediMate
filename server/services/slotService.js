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
      },
    },
    // 1) Count bookings per (slot, emergency flag) pair.
    {
      $group: {
        _id: {
          time: "$slot",
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
