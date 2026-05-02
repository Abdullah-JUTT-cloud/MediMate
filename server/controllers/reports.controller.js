import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import XLSX from "xlsx";
import Checkup from "../models/checkup.model.js";

const parseDateRange = (query) => {
  const now = new Date();
  const fallbackStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const startDate = query.startDate ? new Date(query.startDate) : fallbackStart;
  const endDate = query.endDate ? new Date(query.endDate) : fallbackEnd;

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Invalid startDate or endDate" };
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (startDate > endDate) {
    return { error: "startDate cannot be after endDate" };
  }

  return { startDate, endDate };
};

const buildFinancialData = async (doctorId, startDate, endDate) => {
  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

  const [summary, billingRows] = await Promise.all([
    Checkup.aggregate([
      {
        $match: {
          doctor: doctorObjectId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $toDouble: "$payment.amount" } },
          paidRevenue: {
            $sum: {
              $cond: ["$payment.isPaid", { $toDouble: "$payment.amount" }, 0],
            },
          },
          unpaidRevenue: {
            $sum: {
              $cond: ["$payment.isPaid", 0, { $toDouble: "$payment.amount" }],
            },
          },
          checkups: { $sum: 1 },
          uniquePatients: { $addToSet: "$patient" },
        },
      },
    ]),
    Checkup.find({ doctor: doctorObjectId, createdAt: { $gte: startDate, $lte: endDate } })
      .populate("patient", "name")
      .sort({ createdAt: -1 })
      .select("patient payment createdAt prescription diseases notes visitedFacility"),
  ]);

  const stats = summary[0] || {
    totalRevenue: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
    checkups: 0,
    uniquePatients: [],
  };

  const patientCount = Array.isArray(stats.uniquePatients) ? stats.uniquePatients.length : 0;
  const avgEarningPerPatient = patientCount > 0 ? Number(stats.totalRevenue || 0) / patientCount : 0;

  return {
    range: { startDate, endDate },
    summary: {
      totalRevenue: Number(stats.totalRevenue || 0),
      paidRevenue: Number(stats.paidRevenue || 0),
      unpaidRevenue: Number(stats.unpaidRevenue || 0),
      patientCount,
      checkupCount: Number(stats.checkups || 0),
      avgEarningPerPatient,
    },
    billingLog: billingRows.map((row) => ({
      patientName: row.patient?.name || "Unknown",
      fee: Number(row.payment?.amount || 0),
      status: row.payment?.isPaid ? "Paid" : "Unpaid",
      method: row.payment?.method || "Cash",
      date: row.createdAt,
      diagnosis: row.prescription?.diagnosis || "",
      diseases: Array.isArray(row.diseases) ? row.diseases : [],
      notes: row.notes || "",
      visitLocation: row.visitedFacility?.locationName || "",
      visitLocationType: row.visitedFacility?.locationType || "",
    })),
  };
};

const generatePdfBuffer = (report) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 42 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const titleColor = "#0f766e";
      const textColor = "#1f2937";

      const formatDate = (d) =>
        new Date(d).toLocaleDateString("en-PK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

      doc.font("Helvetica-Bold").fontSize(20).fillColor(titleColor).text("Revenue Lab Financial Report");
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(10).fillColor("#64748b").text(
        `Range: ${formatDate(report.range.startDate)} - ${formatDate(report.range.endDate)}`
      );

      doc.moveDown(1);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(textColor).text("Summary");
      doc.moveDown(0.4);

      const summaryRows = [
        ["Total Revenue", `PKR ${Math.round(report.summary.totalRevenue).toLocaleString()}`],
        ["Patient Count", String(report.summary.patientCount)],
        ["Average Earning / Patient", `PKR ${Math.round(report.summary.avgEarningPerPatient).toLocaleString()}`],
        ["Paid Revenue", `PKR ${Math.round(report.summary.paidRevenue).toLocaleString()}`],
        ["Unpaid Revenue", `PKR ${Math.round(report.summary.unpaidRevenue).toLocaleString()}`],
      ];

      summaryRows.forEach(([k, v]) => {
        doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor).text(`${k}: `, { continued: true });
        doc.font("Helvetica").fontSize(10).fillColor(textColor).text(v);
      });

      doc.moveDown(1);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(textColor).text("Billing Log (Latest 20)");
      doc.moveDown(0.4);

      const tableRows = report.billingLog.slice(0, 20);
      const startX = 42;
      let y = doc.y;

      const col = {
        patient: 180,
        date: 95,
        fee: 100,
        status: 78,
      };

      doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
      doc.text("Patient", startX, y, { width: col.patient });
      doc.text("Date", startX + col.patient, y, { width: col.date });
      doc.text("Fee", startX + col.patient + col.date, y, { width: col.fee });
      doc.text("Status", startX + col.patient + col.date + col.fee, y, { width: col.status });
      y += 18;

      doc.font("Helvetica").fontSize(9).fillColor("#374151");
      tableRows.forEach((row) => {
        if (y > 760) {
          doc.addPage();
          y = 50;
        }
        doc.text(row.patientName, startX, y, { width: col.patient });
        doc.text(formatDate(row.date), startX + col.patient, y, { width: col.date });
        doc.text(`PKR ${Math.round(row.fee).toLocaleString()}`, startX + col.patient + col.date, y, { width: col.fee });
        doc.text(row.status, startX + col.patient + col.date + col.fee, y, { width: col.status });
        y += 16;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

const generateXlsxBuffer = (report) => {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: "From", Value: new Date(report.range.startDate).toLocaleDateString("en-PK") },
    { Metric: "To", Value: new Date(report.range.endDate).toLocaleDateString("en-PK") },
    { Metric: "Total Revenue", Value: report.summary.totalRevenue },
    { Metric: "Patient Count", Value: report.summary.patientCount },
    { Metric: "Average Earning Per Patient", Value: report.summary.avgEarningPerPatient },
    { Metric: "Paid Revenue", Value: report.summary.paidRevenue },
    { Metric: "Unpaid Revenue", Value: report.summary.unpaidRevenue },
    { Metric: "Checkup Count", Value: report.summary.checkupCount },
  ]);

  const billingSheet = XLSX.utils.json_to_sheet(
    report.billingLog.map((r) => ({
      Date: new Date(r.date).toLocaleDateString("en-PK"),
      Patient: r.patientName,
      Fee: r.fee,
      Status: r.status,
      Method: r.method,
    }))
  );

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, billingSheet, "BillingLog");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

const generateRevenueDetailsPdfBuffer = (report) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 36 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const usableWidth = pageWidth - 72;
      const titleColor = "#0f766e";
      const headingColor = "#111827";
      const textColor = "#1f2937";
      const mutedColor = "#64748b";

      const fmtDate = (d) =>
        new Date(d).toLocaleDateString("en-PK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      const fmtDateTime = (d) =>
        new Date(d).toLocaleString("en-PK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      const fmtMoney = (n) => `PKR ${Math.round(Number(n || 0)).toLocaleString()}`;
      const cleanText = (value, fallback = "N/A") => {
        const text = String(value || "").trim();
        return text || fallback;
      };

      const drawSectionCard = (x, y, w, h) => {
        doc
          .roundedRect(x, y, w, h, 10)
          .fillAndStroke("#f8fafc", "#dbe4ec");
      };

      doc.font("Helvetica-Bold").fontSize(20).fillColor(titleColor).text("Revenue Details Report");
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(10).fillColor(mutedColor).text(
        `Range: ${fmtDate(report.range.startDate)} - ${fmtDate(report.range.endDate)}`
      );

      const summaryTop = doc.y + 10;
      const summaryHeight = 92;
      drawSectionCard(36, summaryTop, usableWidth, summaryHeight);

      doc.font("Helvetica-Bold").fontSize(11).fillColor(headingColor).text("Summary", 48, summaryTop + 10);
      doc.font("Helvetica").fontSize(10).fillColor(textColor);
      const summaryLines = [
        `Total Revenue: ${fmtMoney(report.summary.totalRevenue)}`,
        `Paid Revenue: ${fmtMoney(report.summary.paidRevenue)}`,
        `Unpaid Revenue: ${fmtMoney(report.summary.unpaidRevenue)}`,
        `Total Patients: ${report.summary.patientCount}`,
        `Checkups: ${report.summary.checkupCount}`,
        `Average Earning / Patient: ${fmtMoney(report.summary.avgEarningPerPatient)}`,
      ];
      summaryLines.forEach((line, i) => {
        const colX = i < 3 ? 48 : 300;
        const rowY = summaryTop + 30 + (i % 3) * 16;
        doc.text(line, colX, rowY, { width: 240 });
      });

      let y = summaryTop + summaryHeight + 16;
      doc.font("Helvetica-Bold").fontSize(12).fillColor(headingColor).text("Payment Details");
      y = doc.y + 8;

      report.billingLog.forEach((row, index) => {
        const diseasesText = row.diseases?.length ? row.diseases.join(", ") : "N/A";
        const locationText = row.visitLocation
          ? `${row.visitLocationType || "Location"} - ${row.visitLocation}`
          : "N/A";

        const cardHeight = 128;
        if (y + cardHeight > doc.page.height - 40) {
          doc.addPage();
          y = 40;
          doc.font("Helvetica-Bold").fontSize(12).fillColor(headingColor).text("Payment Details (continued)", 36, y);
          y = doc.y + 8;
        }

        drawSectionCard(36, y, usableWidth, cardHeight);

        doc.font("Helvetica-Bold").fontSize(10).fillColor(headingColor).text(
          `#${index + 1} ${cleanText(row.patientName)}`,
          48,
          y + 10,
          { width: 300 }
        );
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(row.status === "Paid" ? "#166534" : "#b45309")
          .text(`${cleanText(row.status)}`, 460, y + 10, { width: 100, align: "right" });

        doc.font("Helvetica").fontSize(9).fillColor(textColor);
        doc.text(`Date & Time: ${fmtDateTime(row.date)}`, 48, y + 30, { width: 250 });
        doc.text(`Fee: ${fmtMoney(row.fee)}`, 300, y + 30, { width: 180 });
        doc.text(`Method: ${cleanText(row.method)}`, 48, y + 46, { width: 250 });
        doc.text(`Visit: ${cleanText(locationText)}`, 300, y + 46, { width: 250 });
        doc.text(`Diagnosis: ${cleanText(row.diagnosis)}`, 48, y + 62, { width: 500 });
        doc.text(`Diseases: ${cleanText(diseasesText)}`, 48, y + 78, { width: 500 });
        doc.text(`Notes: ${cleanText(row.notes)}`, 48, y + 94, { width: 500 });

        y += cardHeight + 10;
      });

      if (report.billingLog.length === 0) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(mutedColor)
          .text("No payment records found for selected date range.", 36, y + 6);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

export const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, error } = parseDateRange(req.query);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const report = await buildFinancialData(req.doctorId, startDate, endDate);
    const format = String(req.query.format || "json").toLowerCase();

    if (format === "pdf") {
      const pdfBuffer = await generatePdfBuffer(report);
      const filename = `financial-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      return res.status(200).send(pdfBuffer);
    }

    if (format === "xlsx") {
      const xlsxBuffer = generateXlsxBuffer(report);
      const filename = `financial-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      return res.status(200).send(xlsxBuffer);
    }

    return res.status(200).json(report);
  } catch (error) {
    console.error("financial report error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRevenueDetailsReport = async (req, res) => {
  try {
    const { startDate, endDate, error } = parseDateRange(req.query);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const report = await buildFinancialData(req.doctorId, startDate, endDate);
    const pdfBuffer = await generateRevenueDetailsPdfBuffer(report);
    const filename = `revenue-details-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("revenue details report error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const buildTaxSummaryData = async (doctorId, year) => {
  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const rows = await Checkup.aggregate([
    {
      $match: {
        doctor: doctorObjectId,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          method: "$payment.method",
          isPaid: "$payment.isPaid",
        },
        total: { $sum: { $toDouble: "$payment.amount" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.month": 1, "_id.method": 1 } },
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthWise = monthNames.map((name, idx) => {
    const monthNum = idx + 1;
    const monthRows = rows.filter((r) => r._id.month === monthNum);
    return {
      month: name,
      total: monthRows.reduce((sum, r) => sum + Number(r.total || 0), 0),
      paidTotal: monthRows
        .filter((r) => r._id.isPaid)
        .reduce((sum, r) => sum + Number(r.total || 0), 0),
      unpaidTotal: monthRows
        .filter((r) => !r._id.isPaid)
        .reduce((sum, r) => sum + Number(r.total || 0), 0),
      methods: monthRows.map((r) => ({
        method: r._id.method || "Cash",
        isPaid: Boolean(r._id.isPaid),
        total: Number(r.total || 0),
        count: Number(r.count || 0),
      })),
    };
  });

  const grandTotal = monthWise.reduce((sum, m) => sum + m.total, 0);
  const paidGrandTotal = monthWise.reduce((sum, m) => sum + m.paidTotal, 0);
  const unpaidGrandTotal = monthWise.reduce((sum, m) => sum + m.unpaidTotal, 0);

  return {
    year,
    totals: {
      grandTotal,
      paidGrandTotal,
      unpaidGrandTotal,
    },
    monthWise,
  };
};

const generateTaxSummaryPdf = (summary) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.font("Helvetica-Bold").fontSize(18).fillColor("#0f766e").text(`Tax Summary Report - ${summary.year}`);
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(10).fillColor("#334155").text(
        `Grand Total: PKR ${Math.round(summary.totals.grandTotal).toLocaleString()} | Paid: PKR ${Math.round(summary.totals.paidGrandTotal).toLocaleString()} | Unpaid: PKR ${Math.round(summary.totals.unpaidGrandTotal).toLocaleString()}`
      );
      doc.moveDown(0.8);

      let y = doc.y;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
      doc.text("Month", 40, y, { width: 70 });
      doc.text("Total", 110, y, { width: 110 });
      doc.text("Paid", 220, y, { width: 110 });
      doc.text("Unpaid", 330, y, { width: 110 });
      y += 18;

      doc.font("Helvetica").fontSize(9).fillColor("#1f2937");
      summary.monthWise.forEach((m) => {
        if (y > 770) {
          doc.addPage();
          y = 50;
        }
        doc.text(m.month, 40, y, { width: 70 });
        doc.text(`PKR ${Math.round(m.total).toLocaleString()}`, 110, y, { width: 110 });
        doc.text(`PKR ${Math.round(m.paidTotal).toLocaleString()}`, 220, y, { width: 110 });
        doc.text(`PKR ${Math.round(m.unpaidTotal).toLocaleString()}`, 330, y, { width: 110 });
        y += 16;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

const generateTaxSummaryXlsx = (summary) => {
  const wb = XLSX.utils.book_new();

  const monthRows = summary.monthWise.map((m) => ({
    Month: m.month,
    Total: m.total,
    Paid: m.paidTotal,
    Unpaid: m.unpaidTotal,
  }));

  const methodRows = summary.monthWise.flatMap((m) =>
    m.methods.map((x) => ({
      Month: m.month,
      Method: x.method,
      Status: x.isPaid ? "Paid" : "Unpaid",
      Total: x.total,
      Count: x.count,
    }))
  );

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthRows), "MonthlyTotals");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(methodRows), "ByMethod");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const getTaxSummaryReport = async (req, res) => {
  try {
    const parsedYear = Number(req.query.year || new Date().getFullYear());
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 3000) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const summary = await buildTaxSummaryData(req.doctorId, parsedYear);
    const format = String(req.query.format || "json").toLowerCase();

    if (format === "pdf") {
      const pdfBuffer = await generateTaxSummaryPdf(summary);
      const filename = `tax-summary-${parsedYear}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      return res.status(200).send(pdfBuffer);
    }

    if (format === "xlsx") {
      const xlsxBuffer = generateTaxSummaryXlsx(summary);
      const filename = `tax-summary-${parsedYear}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      return res.status(200).send(xlsxBuffer);
    }

    return res.status(200).json(summary);
  } catch (error) {
    console.error("tax summary report error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
