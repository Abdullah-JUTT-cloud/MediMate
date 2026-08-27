import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import { MAX_APPOINTMENTS_PER_SLOT } from "./patientTokens";

/**
 * Slot availability data layer shared by the Patient booking modal and the
 * Appointments booking form.
 *
 * Primary source: GET /api/slots?date=YYYY-MM-DD — the server aggregates
 * standardCount / emergencyCount / isFull per slot time.
 * Fallback: derive the same shape from GET /appointments so the UI keeps
 * working against older backends (and in unit tests that only mock
 * /appointments).
 */

const BLOCKED_STATUSES = ["Cancelled", "No-show", "Completed"];

/**
 * Builds a { time: { standardCount, emergencyCount, totalCount, isFull } }
 * map from raw appointment records (fallback path).
 */
export const buildSlotStats = (appointments = [], maxPerSlot = MAX_APPOINTMENTS_PER_SLOT) => {
  const stats = {};
  for (const appointment of appointments || []) {
    const time = appointment?.slot;
    if (!time) continue;
    const entry = stats[time] || {
      standardCount: 0,
      emergencyCount: 0,
      totalCount: 0,
      isFull: false,
    };
    if (appointment.isEmergency) {
      entry.emergencyCount += 1;
    } else {
      entry.standardCount += 1;
    }
    entry.totalCount = entry.standardCount + entry.emergencyCount;
    entry.isFull = entry.standardCount >= maxPerSlot;
    stats[time] = entry;
  }
  return stats;
};

/**
 * Normalises a server slot-aggregation record into the shared stats shape.
 */
const normalizeSlotStats = (slot, maxPerSlot) => {
  const time = slot?.time ?? slot?.slot;
  if (!time) return null;
  const standardCount = Number(slot.standardCount) || 0;
  const emergencyCount = Number(slot.emergencyCount) || 0;
  return {
    time,
    standardCount,
    emergencyCount,
    totalCount: standardCount + emergencyCount,
    isFull: Boolean(slot.isFull) || standardCount >= maxPerSlot,
  };
};

/**
 * Fetches per-slot capacity data for a date (clinic-local day on the server).
 * Falls back to /appointments when /slots is unavailable.
 */
export const fetchSlotAvailability = async (date) => {
  const params = new URLSearchParams({ date });

  try {
    const res = await axiosInstance.get(`/slots?${params.toString()}`);
    const maxPerSlot = Number(res.data?.maxPerSlot) || MAX_APPOINTMENTS_PER_SLOT;
    const stats = {};
    for (const slot of res.data?.slots || []) {
      const normalized = normalizeSlotStats(slot, maxPerSlot);
      if (normalized) stats[normalized.time] = normalized;
    }
    return stats;
  } catch {
    // Fallback for older servers / test harnesses.
    const fallbackParams = new URLSearchParams({ date, limit: "500" });
    const res = await axiosInstance.get(`/appointments?${fallbackParams.toString()}`);
    const active = (res.data?.appointments || []).filter(
      (appointment) => !BLOCKED_STATUSES.includes(appointment.status),
    );
    return buildSlotStats(active);
  }
};

/**
 * React hook: live slot occupancy for a calendar date.
 * Returns { availability, isLoading }.
 */
export const useSlotAvailability = (date, { enabled = true } = {}) => {
  const [availability, setAvailability] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!date || !enabled) {
      setAvailability({});
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const stats = await fetchSlotAvailability(date);
        if (!cancelled) setAvailability(stats);
      } catch {
        if (!cancelled) setAvailability({});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [date, enabled]);

  return { availability, isLoading };
};
