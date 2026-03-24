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

        const checkups = await Checkup.find({ doctor: req.doctorId });
        const totalPatients = await Patient.countDocuments({ doctor: req.doctorId });
        const totalAppointments = await Appointment.countDocuments({ doctor: req.doctorId });

        let todayEarnings = 0;
        let thisWeekEarnings = 0;
        let thisMonthEarnings = 0;
        let thisYearEarnings = 0;
        let totalEarnings = 0;

        for (const checkup of checkups) {
            const amount = Number(checkup?.payment?.amount || 0);
            const createdAt = new Date(checkup.createdAt);

            totalEarnings += amount;
            if (createdAt >= todayStart) todayEarnings += amount;
            if (createdAt >= weekStart) thisWeekEarnings += amount;
            if (createdAt >= monthStart) thisMonthEarnings += amount;
            if (createdAt >= yearStart) thisYearEarnings += amount;
        }

        const monthly = Array(12).fill(0);
        for (const checkup of checkups) {
            const amount = Number(checkup?.payment?.amount || 0);
            const createdAt = new Date(checkup.createdAt);
            if (createdAt.getFullYear() === now.getFullYear()) {
                monthly[createdAt.getMonth()] += amount;
            }
        }
        const monthlyEarningsArray = monthly.map((amount, i) => ({
            month: MONTH_NAMES[i],
            earnings: amount,
        }));

        const totalCheckups = checkups.length;
        const totalPrescriptions = checkups.filter((c) => c.prescription?.pdfUrl).length;

        const allDiseases = checkups.flatMap((c) => c.diseases || []);
        const diseaseCounts = {};
        for (const disease of allDiseases) {
            const key = String(disease || "").trim();
            if (!key) continue;
            diseaseCounts[key] = (diseaseCounts[key] || 0) + 1;
        }
        const top5DiseasesArray = Object.entries(diseaseCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([disease, count]) => ({ disease, count }));

        res.status(200).json({
            earnings: {
                today: todayEarnings,
                thisWeek: thisWeekEarnings,
                thisMonth: thisMonthEarnings,
                thisYear: thisYearEarnings,
                total: totalEarnings,
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
        res.status(500).json({ message: "Internal server error" });
    }
};