import Checkup from "../models/checkup.model.js";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";

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

        const doctorId = req.doctorId;

        // Use aggregation for earnings calculations
        const earningsData = await Checkup.aggregate([
            { $match: { doctor: doctorId } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $toDouble: "$payment.amount" } },
                    todayEarnings: {
                        $sum: {
                            $cond: [{ $gte: ["$createdAt", todayStart] }, { $toDouble: "$payment.amount" }, 0]
                        }
                    },
                    weekEarnings: {
                        $sum: {
                            $cond: [{ $gte: ["$createdAt", weekStart] }, { $toDouble: "$payment.amount" }, 0]
                        }
                    },
                    monthEarnings: {
                        $sum: {
                            $cond: [{ $gte: ["$createdAt", monthStart] }, { $toDouble: "$payment.amount" }, 0]
                        }
                    },
                    yearEarnings: {
                        $sum: {
                            $cond: [{ $gte: ["$createdAt", yearStart] }, { $toDouble: "$payment.amount" }, 0]
                        }
                    }
                }
            }
        ]);

        const earnings = earningsData[0] || { totalEarnings: 0, todayEarnings: 0, weekEarnings: 0, monthEarnings: 0, yearEarnings: 0 };

        // Monthly earnings chart
        const monthlyData = await Checkup.aggregate([
            { $match: { doctor: doctorId, createdAt: { $gte: yearStart } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    earnings: { $sum: { $toDouble: "$payment.amount" } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyEarningsArray = Array(12).fill(0).map((_, i) => {
            const found = monthlyData.find(m => m._id === i + 1);
            return { month: MONTH_NAMES[i], earnings: found ? found.earnings : 0 };
        });

        // Top diseases
        const topDiseasesData = await Checkup.aggregate([
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
        ]);

        const top5DiseasesArray = topDiseasesData.map(d => ({ disease: d._id, count: d.count }));

        // Counts via countDocuments (efficient)
        const totalPatients = await Patient.countDocuments({ doctor: doctorId });
        const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
        const totalCheckups = await Checkup.countDocuments({ doctor: doctorId });
        const totalPrescriptions = await Checkup.countDocuments({ doctor: doctorId, "prescription.pdfUrl": { $exists: true, $ne: "" } });

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