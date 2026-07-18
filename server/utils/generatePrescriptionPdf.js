import PDFDocument from "pdfkit";

export const generatePrescriptionPdf = (doctor, patient, checkup) => {
  return new Promise((resolve, reject) => {
    try {
      const prescription = checkup.prescription;
      const date = new Date(checkup.createdAt).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const doc = new PDFDocument({ size: "A4", margins: { top: 50, left: 50, right: 50, bottom: 20 }, autoFirstPage: false });
      doc.addPage();
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Palette ──────────────────────────────────
      const teal = "#10B8A9";
      const darkTeal = "#0d9488";
      const gray = "#64748b";
      const lightGray = "#94a3b8";
      const dark = "#1e293b";
      const white = "#ffffff";
      const lightBg = "#f8fafc";
      const tealBg = "#f0fdf9";
      const border = "#e2e8f0";
      const softBorder = "#cbd5e1";

      // ── Layout constants ─────────────────────────
      const PAGE_W = 595.28;
      const LEFT = 50;
      const RIGHT = 545;
      const W = RIGHT - LEFT; // 495 usable width

      // Page height for overflow checks
      const PAGE_H = 841.89;
      const BOTTOM_LIMIT = PAGE_H - 40;

      // ── Helpers ──────────────────────────────────
      // Section heading with a small teal accent tab and a subtle underline.
      // Returns the Y position where the section body should start.
      const sectionHeader = (label, y) => {
        // accent tab
        doc.roundedRect(LEFT, y + 1, 3, 11, 1.5).fillColor(teal).fill();
        doc
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .fillColor(darkTeal)
          .text(label, LEFT + 10, y, { characterSpacing: 0.5, lineBreak: false });
        // underline
        doc
          .moveTo(LEFT, y + 18)
          .lineTo(RIGHT, y + 18)
          .lineWidth(0.5)
          .strokeColor(border)
          .stroke();
        return y + 26;
      };

      // ══════════════════════════════════════════
      // TOP ACCENT STRIP
      // ══════════════════════════════════════════
      doc.rect(0, 0, PAGE_W, 6).fillColor(teal).fill();

      // ══════════════════════════════════════════
      // HEADER SECTION
      // ══════════════════════════════════════════

      const headerTop = 46;

      // Left: Doctor info
      doc
        .fontSize(23)
        .font("Helvetica-Bold")
        .fillColor(teal)
        .text(`${doctor.title || "Dr."} ${doctor.fullName}`, LEFT, headerTop, {
          width: 300,
          lineBreak: false,
        });

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor(gray)
        .text(doctor.specialization || "", LEFT, headerTop + 30, { width: 300, lineBreak: false });

      const degrees = [doctor.primaryDegree, ...(doctor.additionalDegrees || [])]
        .filter(Boolean)
        .join(", ");

      doc
        .fontSize(9)
        .fillColor(lightGray)
        .text(degrees, LEFT, headerTop + 48, { width: 300, lineBreak: false });
      doc
        .fontSize(9)
        .fillColor(lightGray)
        .text(`PMDC Reg. No: ${doctor.pmdcNumber || "N/A"}`, LEFT, headerTop + 62, {
          width: 300,
          lineBreak: false,
        });

      // Right: MedAlerto branding + date
      doc
        .fontSize(17)
        .font("Helvetica-Bold")
        .fillColor(teal)
        .text("MedAlerto", 345, headerTop, { width: 200, align: "right", lineBreak: false });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(gray)
        .text(date, 345, headerTop + 24, { width: 200, align: "right", lineBreak: false });

      // Get all facilities (clinics + hospitals)
      const clinics = (doctor.clinics || []).map((c) => ({
        name: c.name,
        address: c.address,
      }));
      const hospitals = (doctor.hospitals || []).map((h) => ({
        name: h.name,
        address: h.address,
      }));
      const visitedFacility = checkup.visitedFacility;

      let facilitiesY = headerTop + 40;

      // Display clinic names
      if (clinics.length > 0) {
        clinics.forEach((clinic) => {
          const isVisitedClinic =
            visitedFacility &&
            visitedFacility.locationType === "Clinic" &&
            visitedFacility.locationName === clinic.name;
          doc
            .fontSize(8)
            .font(isVisitedClinic ? "Helvetica-Bold" : "Helvetica")
            .fillColor(isVisitedClinic ? teal : lightGray)
            .text(`Clinic: ${clinic.name}`, 345, facilitiesY, {
              width: 200,
              align: "right",
              lineBreak: false,
            });
          facilitiesY += 12;
        });
      }

      // Display hospital names
      if (hospitals.length > 0) {
        hospitals.forEach((hospital) => {
          const isVisitedHospital =
            visitedFacility &&
            visitedFacility.locationType === "Hospital" &&
            visitedFacility.locationName === hospital.name;
          doc
            .fontSize(8)
            .font(isVisitedHospital ? "Helvetica-Bold" : "Helvetica")
            .fillColor(isVisitedHospital ? teal : lightGray)
            .text(`Hospital: ${hospital.name}`, 345, facilitiesY, {
              width: 200,
              align: "right",
              lineBreak: false,
            });
          facilitiesY += 12;
        });
      }

      // Highlight patient visited facility
      if (visitedFacility) {
        facilitiesY += 3;
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(teal)
          .text(
            `Visited ${visitedFacility.locationType.toLowerCase()}: ${visitedFacility.locationName}`,
            345,
            facilitiesY,
            {
              width: 200,
              align: "right",
              lineBreak: false,
            },
          );
      }

      // ── Teal divider line
      const dividerY = 138;
      doc
        .moveTo(LEFT, dividerY)
        .lineTo(RIGHT, dividerY)
        .lineWidth(2)
        .strokeColor(teal)
        .stroke();

      // ══════════════════════════════════════════
      // PATIENT INFO BOX
      // ══════════════════════════════════════════

      const patientBoxY = dividerY + 22;
      const patientBoxH = 64;

      doc
        .roundedRect(LEFT, patientBoxY, W, patientBoxH, 8)
        .fillColor(tealBg)
        .fill();
      doc
        .roundedRect(LEFT, patientBoxY, W, patientBoxH, 8)
        .lineWidth(0.75)
        .strokeColor(teal)
        .stroke();

      // Column start positions (evenly spread with left padding)
      const pad = 18;
      const col1 = LEFT + pad;
      const col2 = LEFT + 150;
      const col3 = LEFT + 290;
      const col4 = LEFT + 385;

      // Labels
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(darkTeal);
      doc.text("PATIENT NAME", col1, patientBoxY + 14, { characterSpacing: 0.3, lineBreak: false });
      doc.text("AGE / GENDER", col2, patientBoxY + 14, { characterSpacing: 0.3, lineBreak: false });
      doc.text("BLOOD GROUP", col3, patientBoxY + 14, { characterSpacing: 0.3, lineBreak: false });
      doc.text("CONTACT", col4, patientBoxY + 14, { characterSpacing: 0.3, lineBreak: false });

      // Values
      doc.fontSize(11).font("Helvetica-Bold").fillColor(dark);
      doc.text(patient.name, col1, patientBoxY + 32, { width: 120, lineBreak: false });
      doc.font("Helvetica").fontSize(11).fillColor(dark);
      doc.text(`${patient.age} yrs / ${patient.gender}`, col2, patientBoxY + 32, {
        width: 130,
        lineBreak: false,
      });
      doc.text(patient.bloodGroup || "Unknown", col3, patientBoxY + 32, {
        width: 90,
        lineBreak: false,
      });
      doc.text(patient.phone, col4, patientBoxY + 32, { width: 155, lineBreak: false });

      // ══════════════════════════════════════════
      // DIAGNOSIS
      // ══════════════════════════════════════════

      let currentY = patientBoxY + patientBoxH + 26;

      currentY = sectionHeader("DIAGNOSIS", currentY);

      doc
        .fontSize(12.5)
        .font("Helvetica-Bold")
        .fillColor(dark)
        .text(prescription?.diagnosis || "N/A", LEFT, currentY, { width: W, lineBreak: false });

      currentY =
        currentY +
        doc
          .fontSize(12.5)
          .heightOfString(prescription?.diagnosis || "N/A", { width: W }) +
        18;

      // ══════════════════════════════════════════
      // MEDICINES TABLE
      // ══════════════════════════════════════════

      currentY = sectionHeader("PRESCRIBED MEDICINES", currentY);

      const tableY = currentY;
      const rowH = 32;
      const headerH = 28;

      // Column positions and widths
      const tcols = {
        num: { x: LEFT, w: 30 },
        name: { x: LEFT + 30, w: 130 },
        dose: { x: LEFT + 160, w: 75 },
        freq: { x: LEFT + 235, w: 100 },
        dur: { x: LEFT + 335, w: 65 },
        instr: { x: LEFT + 400, w: 95 },
      };

      // Header background (rounded top)
      doc
        .roundedRect(LEFT, tableY, W, headerH, 6)
        .fillColor(teal)
        .fill();
      // square off bottom corners of header so rows sit flush
      doc.rect(LEFT, tableY + headerH - 8, W, 8).fillColor(teal).fill();

      // Header text
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(white);
      const headTextY = tableY + 10;
      doc.text("#", tcols.num.x + 10, headTextY, { lineBreak: false });
      doc.text("MEDICINE", tcols.name.x + 4, headTextY, { lineBreak: false });
      doc.text("DOSAGE", tcols.dose.x + 4, headTextY, { lineBreak: false });
      doc.text("FREQUENCY", tcols.freq.x + 4, headTextY, { lineBreak: false });
      doc.text("DURATION", tcols.dur.x + 4, headTextY, { lineBreak: false });
      doc.text("INSTRUCTIONS", tcols.instr.x + 4, headTextY, { lineBreak: false });

      const medicines = prescription?.medicines || [];
      medicines.forEach((med, i) => {
        const rowY = tableY + headerH + i * rowH;
        const bg = i % 2 === 0 ? white : lightBg;
        doc.rect(LEFT, rowY, W, rowH).fillColor(bg).fill();

        const cellY = rowY + 11;

        doc
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .fillColor(teal)
          .text(String(i + 1), tcols.num.x + 10, cellY, { lineBreak: false });

        doc
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .fillColor(dark)
          .text(med.name, tcols.name.x + 4, cellY, {
            width: tcols.name.w - 8,
            lineBreak: false,
          });

        doc.fontSize(9.5).font("Helvetica").fillColor(gray);
        doc.text(med.dosage, tcols.dose.x + 4, cellY, {
          width: tcols.dose.w - 8,
          lineBreak: false,
        });
        doc.text(med.frequency, tcols.freq.x + 4, cellY, {
          width: tcols.freq.w - 8,
          lineBreak: false,
        });
        doc.text(med.duration, tcols.dur.x + 4, cellY, {
          width: tcols.dur.w - 8,
          lineBreak: false,
        });
        doc.text(med.instructions || "—", tcols.instr.x + 4, cellY, {
          width: tcols.instr.w - 8,
          lineBreak: false,
        });

        // Row bottom border
        doc
          .moveTo(LEFT, rowY + rowH)
          .lineTo(RIGHT, rowY + rowH)
          .lineWidth(0.4)
          .strokeColor(border)
          .stroke();
      });

      // Table outer border
      const tableFullH = headerH + medicines.length * rowH;
      doc
        .roundedRect(LEFT, tableY, W, tableFullH, 6)
        .lineWidth(0.75)
        .strokeColor(softBorder)
        .stroke();

      currentY = tableY + tableFullH + 28;

      // ══════════════════════════════════════════
      // LAB TESTS
      // ══════════════════════════════════════════

      const labTests = (prescription?.labTests || [])
        .map((test) => String(test || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);

      if (labTests.length) {
        currentY = sectionHeader("LAB TESTS", currentY);

        labTests.forEach((testName, i) => {
          const label = `${i + 1}.`;
          const textHeight = doc
            .font("Helvetica")
            .fontSize(10)
            .heightOfString(testName, { width: W - 46 });
          const rowHeight = Math.max(28, textHeight + 16);

          doc
            .roundedRect(LEFT, currentY, W, rowHeight, 5)
            .fillColor(i % 2 === 0 ? lightBg : "#f1f5f9")
            .fill();

          doc
            .roundedRect(LEFT, currentY, W, rowHeight, 5)
            .lineWidth(0.4)
            .strokeColor(border)
            .stroke();

          doc
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .fillColor(teal)
            .text(label, LEFT + 12, currentY + 9, { width: 18, lineBreak: false });

          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor(dark)
            .text(testName, LEFT + 32, currentY + 9, {
              width: W - 46,
              lineGap: 1.5,
              lineBreak: false,
            });

          currentY += rowHeight + 4;
        });

        currentY += 10;
      }

      // ══════════════════════════════════════════
      // PATIENT ADVICE
      // ══════════════════════════════════════════

      const patientAdvice = String(prescription?.patientAdvice || "")
        .replace(/\s+/g, " ")
        .trim();

      if (patientAdvice) {
        currentY = sectionHeader("PATIENT ADVICE", currentY);

        const adviceHeight = Math.max(
          48,
          doc.font("Helvetica").fontSize(10.5).heightOfString(patientAdvice, {
            width: W - 32,
            lineGap: 3,
          }) + 24,
        );

        doc
          .roundedRect(LEFT, currentY, W, adviceHeight, 8)
          .fillColor(tealBg)
          .fill();
        doc
          .roundedRect(LEFT, currentY, W, adviceHeight, 8)
          .lineWidth(0.75)
          .strokeColor(teal)
          .stroke();

        doc
          .fontSize(10.5)
          .font("Helvetica")
          .fillColor(dark)
          .text(patientAdvice, LEFT + 16, currentY + 12, {
            width: W - 32,
            lineGap: 3,
            lineBreak: false,
          });

        currentY += adviceHeight + 16;
      }

      // ══════════════════════════════════════════
      // NEXT APPOINTMENT
      // ══════════════════════════════════════════

      const hasNext = !!prescription?.nextAppointment;

      if (hasNext) {
        const boxH = 52;
        doc
          .roundedRect(LEFT, currentY, W, boxH, 8)
          .fillColor(tealBg)
          .fill();
        doc
          .roundedRect(LEFT, currentY, W, boxH, 8)
          .lineWidth(0.75)
          .strokeColor(teal)
          .stroke();
        // accent bar on left of box
        doc.roundedRect(LEFT, currentY, 4, boxH, 2).fillColor(teal).fill();

        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor(darkTeal)
          .text("NEXT APPOINTMENT", LEFT + 18, currentY + 12, {
            characterSpacing: 0.3,
            lineBreak: false,
          });
        const nextDate = new Date(
          prescription.nextAppointment,
        ).toLocaleDateString("en-PK", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor(dark)
          .text(nextDate, LEFT + 18, currentY + 28, { lineBreak: false });
        currentY += boxH + 16;
      }

      // ══════════════════════════════════════════
      // SIGNATURE
      // ══════════════════════════════════════════

      const sigY = currentY + 20;
      const sigX = 350;

      doc
        .moveTo(sigX, sigY)
        .lineTo(RIGHT, sigY)
        .lineWidth(1)
        .strokeColor(dark)
        .stroke();

      doc
        .fontSize(10.5)
        .font("Helvetica-Bold")
        .fillColor(dark)
        .text(`${doctor.title || "Dr."} ${doctor.fullName}`, sigX, sigY + 9, {
          width: 195,
          align: "center",
          lineBreak: false,
        });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(gray)
        .text(doctor.specialization || "", sigX, sigY + 25, {
          width: 195,
          align: "center",
          lineBreak: false,
        });

      doc
        .fontSize(8)
        .fillColor(lightGray)
        .text(`PMDC: ${doctor.pmdcNumber || "N/A"}`, sigX, sigY + 38, {
          width: 195,
          align: "center",
          lineBreak: false,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
