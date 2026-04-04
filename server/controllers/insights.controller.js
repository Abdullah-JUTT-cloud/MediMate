import Checkup from "../models/checkup.model.js";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import mongoose from "mongoose";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const buildNormalizedDiseasesExpr = () => ({
  $let: {
    vars: {
      cleaned: {
        $filter: {
          input: {
            $map: {
              input: { $ifNull: ["$diseases", []] },
              as: "d",
              in: { $trim: { input: { $ifNull: ["$$d", ""] } } },
            },
          },
          as: "d",
          cond: { $ne: ["$$d", ""] },
        },
      },
      diagnosis: {
        $trim: { input: { $ifNull: ["$prescription.diagnosis", ""] } },
      },
    },
    in: {
      $cond: [
        { $gt: [{ $size: "$$cleaned" }, 0] },
        "$$cleaned",
        {
          $cond: [{ $ne: ["$$diagnosis", ""] }, ["$$diagnosis"], []],
        },
      ],
    },
  },
});

export const getInsights = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(todayStart);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const ninetyDaysAgo = new Date(todayStart);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oneTwentyDaysAgo = new Date(todayStart);
    oneTwentyDaysAgo.setDate(oneTwentyDaysAgo.getDate() - 120);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const followUpWeekEnd = new Date(todayStart);
    followUpWeekEnd.setDate(followUpWeekEnd.getDate() + 6);
    followUpWeekEnd.setHours(23, 59, 59, 999);

    const doctorId = new mongoose.Types.ObjectId(req.doctorId);

    const [
      topDiseasesData,
      topMedicinesData,
      diseaseMoMRaw,
      totalPatients,
      totalAppointments,
      totalCheckups,
      totalPrescriptions,
      dueFollowUpsThisWeek,
      overdueFollowUps,
      patientVisitRecency,
      recentAppointments,
      recentCheckups,
    ] = await Promise.all([
      Checkup.aggregate([
        { $match: { doctor: doctorId } },
        { $set: { normalizedDiseases: buildNormalizedDiseasesExpr() } },
        {
          $unwind: {
            path: "$normalizedDiseases",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$normalizedDiseases",
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $ne: "" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Checkup.aggregate([
        { $match: { doctor: doctorId } },
        { $unwind: { path: "$prescription.medicines", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: {
              $trim: {
                input: { $ifNull: ["$prescription.medicines.name", ""] },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $ne: "" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Checkup.aggregate([
        {
          $match: {
            doctor: doctorId,
            createdAt: { $gte: previousMonthStart, $lte: now },
          },
        },
        { $set: { normalizedDiseases: buildNormalizedDiseasesExpr() } },
        {
          $unwind: {
            path: "$normalizedDiseases",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            disease: "$normalizedDiseases",
            period: {
              $cond: [{ $gte: ["$createdAt", currentMonthStart] }, "current", "previous"],
            },
          },
        },
        { $match: { disease: { $ne: "" } } },
        {
          $group: {
            _id: { disease: "$disease", period: "$period" },
            count: { $sum: 1 },
          },
        },
      ]),
      Patient.countDocuments({ doctor: doctorId }),
      Appointment.countDocuments({ doctor: doctorId }),
      Checkup.countDocuments({ doctor: doctorId }),
      Checkup.countDocuments({
        doctor: doctorId,
        "prescription.pdfUrl": { $exists: true, $ne: "" },
      }),
      Checkup.countDocuments({
        doctor: doctorId,
        "prescription.nextAppointment": { $gte: todayStart, $lte: followUpWeekEnd },
      }),
      Checkup.countDocuments({
        doctor: doctorId,
        "prescription.nextAppointment": { $lt: todayStart },
      }),
      Checkup.aggregate([
        { $match: { doctor: doctorId } },
        {
          $group: {
            _id: "$patient",
            firstVisit: { $min: "$createdAt" },
            lastVisit: { $max: "$createdAt" },
            visitCount: { $sum: 1 },
          },
        },
      ]),
      Appointment.find({
        doctor: doctorId,
        date: { $gte: sixMonthsAgo, $lte: now },
      })
        .select("date status cancellationReason slot type")
        .lean(),
      Checkup.find({
        doctor: doctorId,
        createdAt: { $gte: oneTwentyDaysAgo, $lte: now },
      })
        .select("patient createdAt diseases prescription.diagnosis")
        .lean(),
    ]);

    const percent = (a, b) => {
      const numA = Number(a || 0);
      const numB = Number(b || 0);
      if (!numB) return numA > 0 ? 100 : 0;
      return (numA / numB) * 100;
    };
    const changePct = (current, previous) => {
      const cur = Number(current || 0);
      const prev = Number(previous || 0);
      if (!prev) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };
    const normalizeStatus = (status) =>
      String(status || "Pending").trim().toLowerCase();
    const parseHourFromSlot = (slot, date) => {
      const text = String(slot || "").trim();
      const match = text.match(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)/i);
      if (match) {
        let h = Number(match[1]);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return h;
      }
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return Number(
          new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            hour12: false,
            timeZone: APP_TIMEZONE,
          }).format(date),
        );
      }
      return null;
    };
    const getMonthKey = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    const top5DiseasesArray = topDiseasesData.map((d) => ({
      disease: d._id,
      count: Number(d.count || 0),
    }));
    const topMedicinesArray = topMedicinesData.map((m) => ({
      medicine: m._id,
      count: Number(m.count || 0),
    }));
    const extractDiseasesFromCheckup = (checkup) => {
      const diseases = Array.isArray(checkup?.diseases) ? checkup.diseases : [];
      const cleaned = diseases
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      if (cleaned.length > 0) return cleaned;
      const diagnosis = String(checkup?.prescription?.diagnosis || "").trim();
      return diagnosis ? [diagnosis] : [];
    };

    const diseaseMoMMap = new Map();
    diseaseMoMRaw.forEach((row) => {
      const disease = row?._id?.disease;
      const period = row?._id?.period;
      if (!disease) return;
      const item = diseaseMoMMap.get(disease) || {
        disease,
        current: 0,
        previous: 0,
      };
      if (period === "current") item.current = Number(row.count || 0);
      if (period === "previous") item.previous = Number(row.count || 0);
      diseaseMoMMap.set(disease, item);
    });

    const topDiagnosesMoM = Array.from(diseaseMoMMap.values())
      .sort((a, b) => b.current - a.current || b.previous - a.previous)
      .slice(0, 5)
      .map((x) => {
        const delta = x.current - x.previous;
        const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
        return {
          disease: x.disease,
          currentCount: x.current,
          previousCount: x.previous,
          delta,
          changePct: changePct(x.current, x.previous),
          trend,
        };
      });

    const new30 = patientVisitRecency.filter(
      (x) => x.firstVisit >= thirtyDaysAgo,
    ).length;
    const active30 = patientVisitRecency.filter(
      (x) => x.lastVisit >= thirtyDaysAgo,
    ).length;
    const new90 = patientVisitRecency.filter(
      (x) => x.firstVisit >= ninetyDaysAgo,
    ).length;
    const active90 = patientVisitRecency.filter(
      (x) => x.lastVisit >= ninetyDaysAgo,
    ).length;

    const dormant = { d30_60: 0, d60_90: 0, d90Plus: 0 };
    patientVisitRecency.forEach((x) => {
      const daysSinceLastVisit = Math.floor(
        (todayStart - new Date(x.lastVisit)) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastVisit >= 30 && daysSinceLastVisit < 60) dormant.d30_60 += 1;
      else if (daysSinceLastVisit >= 60 && daysSinceLastVisit < 90) dormant.d60_90 += 1;
      else if (daysSinceLastVisit >= 90) dormant.d90Plus += 1;
    });
    const neverVisited = Math.max(totalPatients - patientVisitRecency.length, 0);

    const perPatientDates = new Map();
    const repeatComplaintMap = new Map();
    recentCheckups.forEach((checkup) => {
      const patientId = String(checkup.patient);
      const createdAt = new Date(checkup.createdAt);
      if (!perPatientDates.has(patientId)) perPatientDates.set(patientId, []);
      perPatientDates.get(patientId).push(createdAt);

      if (createdAt >= ninetyDaysAgo) {
        const patientDiseases = repeatComplaintMap.get(patientId) || new Map();
        extractDiseasesFromCheckup(checkup).forEach((diseaseRaw) => {
          const disease = String(diseaseRaw || "").trim();
          if (!disease) return;
          patientDiseases.set(disease, (patientDiseases.get(disease) || 0) + 1);
        });
        repeatComplaintMap.set(patientId, patientDiseases);
      }
    });

    const currentIntervals = [];
    const previousIntervals = [];
    perPatientDates.forEach((dates) => {
      dates.sort((a, b) => a - b);
      for (let i = 1; i < dates.length; i += 1) {
        const currentVisit = dates[i];
        const prevVisit = dates[i - 1];
        const daysGap = (currentVisit - prevVisit) / (1000 * 60 * 60 * 24);
        if (currentVisit >= thirtyDaysAgo) currentIntervals.push(daysGap);
        else if (currentVisit >= sixtyDaysAgo) previousIntervals.push(daysGap);
      }
    });
    const avg = (arr) =>
      arr.length ? arr.reduce((sum, n) => sum + n, 0) / arr.length : 0;
    const currentRevisitAvg = avg(currentIntervals);
    const previousRevisitAvg = avg(previousIntervals);

    let repeatComplaintPatients = 0;
    repeatComplaintMap.forEach((diseaseFreq) => {
      const hasRepeat = Array.from(diseaseFreq.values()).some((count) => count >= 2);
      if (hasRepeat) repeatComplaintPatients += 1;
    });

    const weekdayLoad = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const hourlyLoad = {};
    const cancellationMix = {};

    let totalAppointments30d = 0;
    let noShowCount30d = 0;
    let completedCount30d = 0;

    recentAppointments.forEach((apt) => {
      const aptDate = new Date(apt.date);
      const status = normalizeStatus(apt.status);
      if (aptDate >= thirtyDaysAgo) {
        totalAppointments30d += 1;
        if (status === "no-show") noShowCount30d += 1;
        if (status === "completed") completedCount30d += 1;
        if (status === "cancelled" || status === "no-show") {
          const reason =
            status === "no-show"
              ? "No-show"
              : String(apt.cancellationReason || "Unspecified");
          cancellationMix[reason] = (cancellationMix[reason] || 0) + 1;
        }
      }

      if (aptDate >= ninetyDaysAgo && status !== "cancelled" && status !== "no-show") {
        const weekday = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          timeZone: APP_TIMEZONE,
        }).format(aptDate);
        if (weekdayLoad[weekday] !== undefined) weekdayLoad[weekday] += 1;
        const hour = parseHourFromSlot(apt.slot, aptDate);
        if (hour !== null) {
          const key = `${String(hour).padStart(2, "0")}:00`;
          hourlyLoad[key] = (hourlyLoad[key] || 0) + 1;
        }
      }
    });

    const peakWeekday = Object.entries(weekdayLoad).reduce(
      (best, row) => (row[1] > best.count ? { day: row[0], count: row[1] } : best),
      { day: "N/A", count: 0 },
    );
    const peakHour = Object.entries(hourlyLoad).reduce(
      (best, row) => (row[1] > best.count ? { hour: row[0], count: row[1] } : best),
      { hour: "N/A", count: 0 },
    );

    const preventiveBuckets = [];
    const monthCursor = new Date(sixMonthsAgo);
    while (monthCursor <= now) {
      const key = getMonthKey(monthCursor);
      preventiveBuckets.push({
        key,
        month: MONTH_NAMES[monthCursor.getMonth()],
        total: 0,
        completed: 0,
      });
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
    const preventiveMap = new Map(preventiveBuckets.map((x) => [x.key, x]));
    recentAppointments.forEach((apt) => {
      const typeText = String(apt.type || "").toLowerCase();
      if (!typeText.includes("check")) return;
      const date = new Date(apt.date);
      const bucket = preventiveMap.get(getMonthKey(date));
      if (!bucket) return;
      bucket.total += 1;
      if (normalizeStatus(apt.status) === "completed") bucket.completed += 1;
    });
    const preventiveTrend = preventiveBuckets.map((bucket) => ({
      month: bucket.month,
      total: bucket.total,
      completed: bucket.completed,
      completionRate: percent(bucket.completed, bucket.total),
    }));

    res.status(200).json({
      counts: {
        patients: totalPatients,
        appointments: totalAppointments,
        checkups: totalCheckups,
        prescriptions: totalPrescriptions,
      },
      topDiseases: top5DiseasesArray,
      topMedicines: topMedicinesArray,
      clinicalQuality: {
        topDiagnosesMoM,
        followUpDueThisWeek: dueFollowUpsThisWeek,
        overdueFollowUps,
        repeatComplaintPatients,
      },
      patientFlow: {
        newVsReturning: {
          days30: { new: new30, returning: Math.max(active30 - new30, 0), active: active30 },
          days90: { new: new90, returning: Math.max(active90 - new90, 0), active: active90 },
        },
        revisitIntervalTrend: {
          currentAvgDays: currentRevisitAvg,
          previousAvgDays: previousRevisitAvg,
          changePct: changePct(currentRevisitAvg, previousRevisitAvg),
        },
        dormantBuckets: { ...dormant, neverVisited },
      },
      operationsReliability: {
        noShowRate30d: percent(noShowCount30d, totalAppointments30d),
        cancellationMix: Object.entries(cancellationMix)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count),
        peakLoad: {
          byWeekday: PK_WEEKDAYS.map((day) => ({ day, count: weekdayLoad[day] || 0 })),
          byHour: Object.entries(hourlyLoad)
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour.localeCompare(b.hour)),
          bestWeekday: peakWeekday,
          bestHour: peakHour,
        },
        onTimeCompletionRate30d: percent(completedCount30d, totalAppointments30d),
      },
      careContinuity: {
        prescriptionCoverageRatio: percent(totalPrescriptions, totalCheckups),
        preventiveCheckupCompletionTrend: preventiveTrend,
        highRiskWatchlist: topDiagnosesMoM,
      },
    });
  } catch (error) {
    console.error("Insights error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const PK_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const APP_TIMEZONE = "Asia/Karachi";

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfWeek = (d) => {
  const x = startOfDay(d);
  const mondayOffset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - mondayOffset);
  return x;
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

const endOfMonth = (d) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

export const getRevenueLab = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = startOfWeek(now);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const monthStart = startOfMonth(now);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(monthStart.getTime() - 1);
    const monthEnd = endOfMonth(now);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const nonReturningCutoff = new Date(now);
    nonReturningCutoff.setDate(nonReturningCutoff.getDate() - 90);

    const requestedStart = req.query?.startDate
      ? new Date(req.query.startDate)
      : null;
    const requestedEnd = req.query?.endDate
      ? new Date(req.query.endDate)
      : null;
    const hasValidRange =
      requestedStart instanceof Date &&
      !Number.isNaN(requestedStart.getTime()) &&
      requestedEnd instanceof Date &&
      !Number.isNaN(requestedEnd.getTime()) &&
      requestedStart <= requestedEnd;
    const peakRangeStart = hasValidRange
      ? startOfDay(requestedStart)
      : monthStart;
    const peakRangeEnd = hasValidRange
      ? new Date(
          requestedEnd.getFullYear(),
          requestedEnd.getMonth(),
          requestedEnd.getDate(),
          23,
          59,
          59,
          999,
        )
      : monthEnd;

    const doctorId = new mongoose.Types.ObjectId(req.doctorId);

    const [
      earningsBuckets,
      monthlyData,
      peakCheckupsRaw,
      peakAppointmentsRaw,
      missedAppointmentsAgg,
      avgFeeThisMonthRaw,
      avgFeeYearRaw,
      patientVisitRecency,
      recentBillingRows,
    ] = await Promise.all([
      Checkup.aggregate([
        {
          $match: {
            doctor: doctorId,
            createdAt: { $gte: prevMonthStart },
            "payment.isPaid": true,
          },
        },
        {
          $group: {
            _id: null,
            today: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", todayStart] },
                  { $toDouble: "$payment.amount" },
                  0,
                ],
              },
            },
            yesterday: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$createdAt", yesterdayStart] },
                      { $lt: ["$createdAt", todayStart] },
                    ],
                  },
                  { $toDouble: "$payment.amount" },
                  0,
                ],
              },
            },
            thisWeek: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", weekStart] },
                  { $toDouble: "$payment.amount" },
                  0,
                ],
              },
            },
            lastWeek: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$createdAt", prevWeekStart] },
                      { $lt: ["$createdAt", weekStart] },
                    ],
                  },
                  { $toDouble: "$payment.amount" },
                  0,
                ],
              },
            },
            thisMonth: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", monthStart] },
                  { $toDouble: "$payment.amount" },
                  0,
                ],
              },
            },
            lastMonth: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$createdAt", prevMonthStart] },
                      { $lte: ["$createdAt", prevMonthEnd] },
                    ],
                  },
                  { $toDouble: "$payment.amount" },
                  0,
                ],
              },
            },
            thisYear: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", yearStart] },
                  { $toDouble: "$payment.amount" },
                  0,
                ],
              },
            },
          },
        },
      ]),
      Checkup.aggregate([
        {
          $match: {
            doctor: doctorId,
            createdAt: { $gte: yearStart },
            "payment.isPaid": true,
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            earnings: { $sum: { $toDouble: "$payment.amount" } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Checkup.aggregate([
        {
          $match: {
            doctor: doctorId,
            createdAt: { $gte: peakRangeStart, $lte: peakRangeEnd },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: { date: "$createdAt", timezone: APP_TIMEZONE } },
            checkups: { $sum: 1 },
          },
        },
      ]),
      Appointment.aggregate([
        {
          $match: {
            doctor: doctorId,
            date: { $gte: peakRangeStart, $lte: peakRangeEnd },
          },
        },
        {
          $addFields: {
            normalizedStatus: {
              $toLower: {
                $trim: { input: { $ifNull: ["$status", "Pending"] } },
              },
            },
          },
        },
        {
          $match: {
            normalizedStatus: { $nin: ["cancelled", "no-show"] },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: { date: "$date", timezone: APP_TIMEZONE } },
            appointments: { $sum: 1 },
          },
        },
      ]),
      Appointment.aggregate([
        {
          $match: {
            doctor: doctorId,
            status: { $in: ["Cancelled", "No-show"] },
            date: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: "$cancellationReason",
            count: { $sum: 1 },
          },
        },
      ]),
      Checkup.aggregate([
        {
          $match: {
            doctor: doctorId,
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            avg: { $avg: { $toDouble: "$payment.amount" } },
          },
        },
      ]),
      Checkup.aggregate([
        { $match: { doctor: doctorId, createdAt: { $gte: yearStart } } },
        {
          $group: {
            _id: null,
            avg: { $avg: { $toDouble: "$payment.amount" } },
          },
        },
      ]),
      Checkup.aggregate([
        { $match: { doctor: doctorId } },
        {
          $group: {
            _id: "$patient",
            lastVisit: { $max: "$createdAt" },
            visitCount: { $sum: 1 },
          },
        },
      ]),
      Checkup.find({ doctor: doctorId })
        .populate("patient", "name")
        .sort({ createdAt: -1 })
        .limit(12)
        .select("payment createdAt patient"),
    ]);

    const buckets = earningsBuckets[0] || {};
    const thisYear = Number(buckets.thisYear || 0);
    const currentMonthNumber = now.getMonth() + 1;
    const projectedYearlyRevenue =
      currentMonthNumber > 0 ? (thisYear / currentMonthNumber) * 12 : 0;

    const pct = (current, previous) => {
      const cur = Number(current || 0);
      const prev = Number(previous || 0);
      if (prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };

    const monthlyEarningsArray = Array(12)
      .fill(0)
      .map((_, i) => {
        const found = monthlyData.find((m) => m._id === i + 1);
        return {
          month: MONTH_NAMES[i],
          earnings: found ? Number(found.earnings || 0) : 0,
        };
      });

    const peakByDay = PK_WEEKDAYS.map((day, idx) => {
      const checkupsRaw = peakCheckupsRaw.find((r) => r._id === idx + 1);
      const appointmentsRaw = peakAppointmentsRaw.find(
        (r) => r._id === idx + 1,
      );
      return {
        day,
        checkups: Number(checkupsRaw?.checkups || 0),
        appointments: Number(appointmentsRaw?.appointments || 0),
      };
    });
    const peakDay = peakByDay.reduce(
      (best, curr) => (curr.appointments > best.appointments ? curr : best),
      { day: "N/A", appointments: 0, checkups: 0 },
    );

    const avgFeeThisMonth = Number(avgFeeThisMonthRaw[0]?.avg || 0);
    const avgFeeYear = Number(avgFeeYearRaw[0]?.avg || 0);
    const estimatedAvgFee = avgFeeThisMonth || avgFeeYear || 0;
    const reasonMap = {
      Doctor: { count: 0, revenue: 0 },
      Patient: { count: 0, revenue: 0 },
      Emergency: { count: 0, revenue: 0 },
      "No-show": { count: 0, revenue: 0 },
      Other: { count: 0, revenue: 0 },
    };

    let missedAppointments = 0;
    let missedAppointmentsRevenue = 0;

    missedAppointmentsAgg.forEach((r) => {
      const reason = r._id || "Other";
      const count = Number(r.count || 0);

      missedAppointments += count;
      const effectiveLoss = count * estimatedAvgFee;
      missedAppointmentsRevenue += effectiveLoss;

      const key = reasonMap[reason] ? reason : "Other";
      reasonMap[key].count += count;
      reasonMap[key].revenue += effectiveLoss;
    });

    const nonReturningPatients = patientVisitRecency.filter(
      (p) => p.visitCount > 0 && p.lastVisit < nonReturningCutoff,
    ).length;
    const nonReturningRevenue = nonReturningPatients * estimatedAvgFee;

    const billingLog = recentBillingRows.map((row) => ({
      id: row._id,
      patientName: row.patient?.name || "Unknown",
      fee: Number(row.payment?.amount || 0),
      isPaid: Boolean(row.payment?.isPaid),
      status: row.payment?.isPaid ? "Paid" : "Unpaid",
      method: row.payment?.method || "Cash",
      date: row.createdAt,
    }));

    res.status(200).json({
      revenue: {
        daily: Number(buckets.today || 0),
        weekly: Number(buckets.thisWeek || 0),
        monthly: Number(buckets.thisMonth || 0),
        yearly: thisYear,
        projectedYearly: projectedYearlyRevenue,
        monthlySeries: monthlyEarningsArray,
        trends: {
          dailyPct: pct(buckets.today, buckets.yesterday),
          weeklyPct: pct(buckets.thisWeek, buckets.lastWeek),
          monthlyPct: pct(buckets.thisMonth, buckets.lastMonth),
        },
      },
      peakDays: {
        series: peakByDay,
        best: peakDay,
      },
      missedRevenue: {
        estimatedAvgFee,
        missedAppointments,
        missedAppointmentsRevenue,
        byReason: reasonMap,
        nonReturningPatients,
        nonReturningRevenue,
        totalPotentialLoss: missedAppointmentsRevenue + nonReturningRevenue,
      },
      billingLog,
      generatedAt: now,
    });
  } catch (error) {
    console.error("Revenue lab insights error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
