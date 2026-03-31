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

export const getInsights = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(now);
        const mondayOffset = (weekStart.getDay() + 6) % 7;
        weekStart.setDate(weekStart.getDate() - mondayOffset);
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        // Cast to ObjectId — aggregation pipelines don't auto-cast like find/countDocuments
        const doctorId = new mongoose.Types.ObjectId(req.doctorId);

        // Use aggregation for earnings calculations
        const [earningsData, monthlyData, topDiseasesData, totalPatients, totalAppointments, totalCheckups, totalPrescriptions] =
          await Promise.all([
            Checkup.aggregate([
              { $match: { doctor: doctorId } },
              {
                $group: {
                  _id: null,
                  totalEarnings: {
                    $sum: {
                      $cond: ["$payment.isPaid", { $toDouble: "$payment.amount" }, 0],
                    },
                  },
                  todayEarnings: {
                    $sum: {
                      $cond: [
                        { $and: [{ $gte: ["$createdAt", todayStart] }, { $eq: ["$payment.isPaid", true] }] },
                        { $toDouble: "$payment.amount" },
                        0,
                      ]
                    }
                  },
                  weekEarnings: {
                    $sum: {
                      $cond: [
                        { $and: [{ $gte: ["$createdAt", weekStart] }, { $eq: ["$payment.isPaid", true] }] },
                        { $toDouble: "$payment.amount" },
                        0,
                      ]
                    }
                  },
                  monthEarnings: {
                    $sum: {
                      $cond: [
                        { $and: [{ $gte: ["$createdAt", monthStart] }, { $eq: ["$payment.isPaid", true] }] },
                        { $toDouble: "$payment.amount" },
                        0,
                      ]
                    }
                  },
                  yearEarnings: {
                    $sum: {
                      $cond: [
                        { $and: [{ $gte: ["$createdAt", yearStart] }, { $eq: ["$payment.isPaid", true] }] },
                        { $toDouble: "$payment.amount" },
                        0,
                      ]
                    }
                  }
                }
              }
            ]),
            Checkup.aggregate([
              { $match: { doctor: doctorId, createdAt: { $gte: yearStart }, "payment.isPaid": true } },
              {
                $group: {
                  _id: { $month: "$createdAt" },
                  earnings: { $sum: { $toDouble: "$payment.amount" } }
                }
              },
              { $sort: { _id: 1 } }
            ]),
            Checkup.aggregate([
              { $match: { doctor: doctorId } },
              { $unwind: { path: "$diseases", preserveNullAndEmptyArrays: true } },
              {
                $group: {
                  _id: { $trim: { input: { $ifNull: ["$diseases", ""] } } },
                  count: { $sum: 1 }
                }
              },
              { $match: { _id: { $ne: "" } } },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ]),
            Patient.countDocuments({ doctor: doctorId }),
            Appointment.countDocuments({ doctor: doctorId }),
            Checkup.countDocuments({ doctor: doctorId }),
            Checkup.countDocuments({ doctor: doctorId, "prescription.pdfUrl": { $exists: true, $ne: "" } }),
          ]);

        const earnings = earningsData[0] || { totalEarnings: 0, todayEarnings: 0, weekEarnings: 0, monthEarnings: 0, yearEarnings: 0 };
        const monthlyEarningsArray = Array(12).fill(0).map((_, i) => {
            const found = monthlyData.find(m => m._id === i + 1);
            return { month: MONTH_NAMES[i], earnings: found ? found.earnings : 0 };
        });
        const top5DiseasesArray = topDiseasesData.map(d => ({ disease: d._id, count: d.count }));

        res.status(200).json({
            earnings: {
                today: earnings.todayEarnings || 0,
                thisWeek: earnings.weekEarnings || 0,
                thisMonth: earnings.monthEarnings || 0,
                thisYear: earnings.yearEarnings || 0,
                total: earnings.totalEarnings || 0,
            },
            monthly: monthlyEarningsArray,
            counts: {
                patients: totalPatients,
                appointments: totalAppointments,
                checkups: totalCheckups,
                prescriptions: totalPrescriptions,
            },
            topDiseases: top5DiseasesArray,
        });
    } catch (error) {
        console.error("Insights error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

  const PK_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

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
          { $match: { doctor: doctorId, createdAt: { $gte: yearStart }, "payment.isPaid": true } },
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
              createdAt: { $gte: monthStart, $lte: monthEnd },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: "$createdAt" },
              checkups: { $sum: 1 },
            },
          },
        ]),
        Appointment.aggregate([
          {
            $match: {
              doctor: doctorId,
              date: { $gte: monthStart, $lte: monthEnd },
              status: { $in: ["Pending", "Confirmed", "Completed"] },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: "$date" },
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
          { $match: { doctor: doctorId, createdAt: { $gte: monthStart, $lte: monthEnd } } },
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
      const projectedYearlyRevenue = currentMonthNumber > 0 ? (thisYear / currentMonthNumber) * 12 : 0;

      const pct = (current, previous) => {
        const cur = Number(current || 0);
        const prev = Number(previous || 0);
        if (prev === 0) return cur > 0 ? 100 : 0;
        return ((cur - prev) / prev) * 100;
      };

      const monthlyEarningsArray = Array(12).fill(0).map((_, i) => {
        const found = monthlyData.find((m) => m._id === i + 1);
        return { month: MONTH_NAMES[i], earnings: found ? Number(found.earnings || 0) : 0 };
      });

      const peakByDay = PK_WEEKDAYS.map((day, idx) => {
        const checkupsRaw = peakCheckupsRaw.find((r) => r._id === idx + 1);
        const appointmentsRaw = peakAppointmentsRaw.find((r) => r._id === idx + 1);
        return {
          day,
          checkups: Number(checkupsRaw?.checkups || 0),
          appointments: Number(appointmentsRaw?.appointments || 0),
        };
      });
      const peakDay = peakByDay.reduce(
        (best, curr) => (curr.appointments > best.appointments ? curr : best),
        { day: "N/A", appointments: 0, checkups: 0 }
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

      const nonReturningPatients = patientVisitRecency.filter((p) => p.visitCount > 0 && p.lastVisit < nonReturningCutoff).length;
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