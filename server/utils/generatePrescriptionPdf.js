import PDFDocument from "pdfkit";

export const generatePrescriptionPdf = (doctor, patient, checkup) => {
  return new Promise((resolve, reject) => {
    try {
      const prescription = checkup.prescription;
      const date = new Date(checkup.createdAt).toLocaleDateString("en-PK", {
        day: "numeric", month: "long", year: "numeric",
      });

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const teal = "#10B8A9";
      const darkTeal = "#0d9488";
      const gray = "#64748b";
      const lightGray = "#94a3b8";
      const dark = "#1e293b";
      const white = "#ffffff";
      const lightBg = "#f8fafc";
      const tealBg = "#f0fdf9";
      const W = 495; // usable width

      // ══════════════════════════════════════════
      // HEADER SECTION
      // ══════════════════════════════════════════

      // Left: Doctor info
      doc.fontSize(22).font("Helvetica-Bold").fillColor(teal)
        .text(`${doctor.title || "Dr."} ${doctor.fullName}`, 50, 50, { width: 280 });

      doc.fontSize(11).font("Helvetica").fillColor(gray)
        .text(doctor.specialization || "", 50, 78, { width: 280 });

      const degrees = [
        doctor.primaryDegree,
        ...(doctor.additionalDegrees || [])
      ].filter(Boolean).join(", ");

      doc.fontSize(9).fillColor(lightGray).text(degrees, 50, 94, { width: 280 });
      doc.fontSize(9).fillColor(lightGray)
        .text(`PMDC Reg. No: ${doctor.pmdcNumber || "N/A"}`, 50, 108, { width: 280 });

      // Right: MediMate branding + date + clinic
      doc.fontSize(16).font("Helvetica-Bold").fillColor(teal)
        .text("MediMate", 330, 50, { width: 215, align: "right" });

      doc.fontSize(9).font("Helvetica").fillColor(gray)
        .text(date, 330, 72, { width: 215, align: "right" });

      if (doctor.clinics?.length) {
        doc.fontSize(9).fillColor(lightGray)
          .text(doctor.clinics[0].name, 330, 86, { width: 215, align: "right" });
        doc.fontSize(8).fillColor(lightGray)
          .text(doctor.clinics[0].address, 330, 100, { width: 215, align: "right" });
      } else if (doctor.hospitals?.length) {
        doc.fontSize(9).fillColor(lightGray)
          .text(doctor.hospitals[0].name, 330, 86, { width: 215, align: "right" });
        doc.fontSize(8).fillColor(lightGray)
          .text(doctor.hospitals[0].address, 330, 100, { width: 215, align: "right" });
      }

      // ── Teal divider line
      doc.moveTo(50, 130).lineTo(545, 130).lineWidth(2).strokeColor(teal).stroke();

      // ══════════════════════════════════════════
      // PATIENT INFO BOX
      // ══════════════════════════════════════════

      const patientBoxY = 145;
      const patientBoxH = 52;

      // Box background
      doc.rect(50, patientBoxY, W, patientBoxH)
        .fillColor(tealBg).fill();
      doc.rect(50, patientBoxY, W, patientBoxH)
        .lineWidth(0.5).strokeColor(teal).stroke();

      // Column widths
      const col1 = 50, col2 = 185, col3 = 320, col4 = 420;

      // Labels
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(teal);
      doc.text("PATIENT NAME", col1 + 10, patientBoxY + 8);
      doc.text("AGE / GENDER", col2, patientBoxY + 8);
      doc.text("BLOOD GROUP", col3, patientBoxY + 8);
      doc.text("CONTACT", col4, patientBoxY + 8);

      // Values
      doc.fontSize(10).font("Helvetica-Bold").fillColor(dark);
      doc.text(patient.name, col1 + 10, patientBoxY + 23);
      doc.font("Helvetica").fontSize(10).fillColor(dark);
      doc.text(`${patient.age} yrs / ${patient.gender}`, col2, patientBoxY + 23);
      doc.text(patient.bloodGroup || "Unknown", col3, patientBoxY + 23);
      doc.text(patient.phone, col4, patientBoxY + 23);

      // ══════════════════════════════════════════
      // DIAGNOSIS
      // ══════════════════════════════════════════

      const diagY = patientBoxY + patientBoxH + 20;

      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(teal)
        .text("DIAGNOSIS", 50, diagY);

      doc.moveTo(50, diagY + 12).lineTo(545, diagY + 12)
        .lineWidth(0.3).strokeColor("#e2e8f0").stroke();

      doc.fontSize(12).font("Helvetica-Bold").fillColor(dark)
        .text(prescription?.diagnosis || "N/A", 50, diagY + 18);

      // ══════════════════════════════════════════
      // MEDICINES TABLE
      // ══════════════════════════════════════════

      const tableStartY = diagY + 50;

      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(teal)
        .text("PRESCRIBED MEDICINES", 50, tableStartY);

      doc.moveTo(50, tableStartY + 12).lineTo(545, tableStartY + 12)
        .lineWidth(0.3).strokeColor("#e2e8f0").stroke();

      const tableY = tableStartY + 18;
      const rowH = 26;
      const headerH = 24;

      // Column positions and widths
      const tcols = {
        num:   { x: 50,  w: 25 },
        name:  { x: 75,  w: 130 },
        dose:  { x: 205, w: 75 },
        freq:  { x: 280, w: 105 },
        dur:   { x: 385, w: 70 },
        instr: { x: 455, w: 90 },
      };

      // Header background
      doc.rect(50, tableY, W, headerH).fillColor(teal).fill();

      // Header text
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(white);
      doc.text("#",            tcols.num.x + 6,  tableY + 8);
      doc.text("Medicine",     tcols.name.x + 4, tableY + 8);
      doc.text("Dosage",       tcols.dose.x + 4, tableY + 8);
      doc.text("Frequency",    tcols.freq.x + 4, tableY + 8);
      doc.text("Duration",     tcols.dur.x + 4,  tableY + 8);
      doc.text("Instructions", tcols.instr.x + 4, tableY + 8);

      const medicines = prescription?.medicines || [];
      medicines.forEach((med, i) => {
        const rowY = tableY + headerH + i * rowH;
        const bg = i % 2 === 0 ? white : lightBg;
        doc.rect(50, rowY, W, rowH).fillColor(bg).fill();

        doc.fontSize(9).font("Helvetica-Bold").fillColor(teal)
          .text(String(i + 1), tcols.num.x + 8, rowY + 9);

        doc.font("Helvetica-Bold").fillColor(dark)
          .text(med.name, tcols.name.x + 4, rowY + 9, { width: tcols.name.w - 8 });

        doc.font("Helvetica").fillColor(gray);
        doc.text(med.dosage,      tcols.dose.x + 4,  rowY + 9, { width: tcols.dose.w - 8 });
        doc.text(med.frequency,   tcols.freq.x + 4,  rowY + 9, { width: tcols.freq.w - 8 });
        doc.text(med.duration,    tcols.dur.x + 4,   rowY + 9, { width: tcols.dur.w - 8 });
        doc.text(med.instructions || "—", tcols.instr.x + 4, rowY + 9, { width: tcols.instr.w - 8 });

        // Row bottom border
        doc.moveTo(50, rowY + rowH).lineTo(545, rowY + rowH)
          .lineWidth(0.3).strokeColor("#e2e8f0").stroke();
      });

      // Table outer border
      const tableFullH = headerH + medicines.length * rowH;
      doc.rect(50, tableY, W, tableFullH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

      let currentY = tableY + tableFullH + 25;

      // ══════════════════════════════════════════
      // LAB TESTS
      // ══════════════════════════════════════════

      if (prescription?.labTests?.length) {
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(teal)
          .text("LAB TESTS", 50, currentY);
        doc.moveTo(50, currentY + 12).lineTo(545, currentY + 12)
          .lineWidth(0.3).strokeColor("#e2e8f0").stroke();
        currentY += 20;

        prescription.labTests.forEach((t, i) => {
          doc.rect(50, currentY, W, 22).fillColor(i % 2 === 0 ? white : lightBg).fill();
          doc.fontSize(9).font("Helvetica").fillColor(dark)
            .text(`🧪  ${t}`, 60, currentY + 7);
          currentY += 22;
        });
        currentY += 15;
      }

      // ══════════════════════════════════════════
      // NEXT APPOINTMENT + NOTES (side by side)
      // ══════════════════════════════════════════

      const hasNext = !!prescription?.nextAppointment;
      const hasNotes = !!checkup.notes;

      if (hasNext || hasNotes) {
        const boxH = 55;

        if (hasNext && hasNotes) {
          // Left box: next appointment
          doc.rect(50, currentY, 235, boxH).fillColor(tealBg)
            .lineWidth(0.5).strokeColor(teal).fillAndStroke();
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(teal)
            .text("NEXT APPOINTMENT", 62, currentY + 10);
          const nextDate = new Date(prescription.nextAppointment).toLocaleDateString("en-PK", {
            day: "numeric", month: "long", year: "numeric",
          });
          doc.fontSize(11).font("Helvetica-Bold").fillColor(dark)
            .text(nextDate, 62, currentY + 26);

          // Right box: notes
          doc.rect(310, currentY, 235, boxH).fillColor(lightBg)
            .lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke();
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(gray)
            .text("NOTES", 322, currentY + 10);
          doc.fontSize(9).font("Helvetica").fillColor(dark)
            .text(checkup.notes, 322, currentY + 26, { width: 210 });

        } else if (hasNext) {
          doc.rect(50, currentY, W, boxH).fillColor(tealBg)
            .lineWidth(0.5).strokeColor(teal).fillAndStroke();
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(teal)
            .text("NEXT APPOINTMENT", 62, currentY + 10);
          const nextDate = new Date(prescription.nextAppointment).toLocaleDateString("en-PK", {
            day: "numeric", month: "long", year: "numeric",
          });
          doc.fontSize(11).font("Helvetica-Bold").fillColor(dark)
            .text(nextDate, 62, currentY + 26);
        } else if (hasNotes) {
          doc.rect(50, currentY, W, boxH).fillColor(lightBg)
            .lineWidth(0.5).strokeColor("#e2e8f0").fillAndStroke();
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(gray)
            .text("NOTES", 62, currentY + 10);
          doc.fontSize(9).font("Helvetica").fillColor(dark)
            .text(checkup.notes, 62, currentY + 26, { width: W - 24 });
        }

        currentY += boxH + 25;
      }

      // ══════════════════════════════════════════
      // SIGNATURE
      // ══════════════════════════════════════════

      const sigY = currentY + 30;
      const sigX = 350;

      doc.moveTo(sigX, sigY).lineTo(545, sigY)
        .lineWidth(1).strokeColor(dark).stroke();

      doc.fontSize(10).font("Helvetica-Bold").fillColor(dark)
        .text(`${doctor.title || "Dr."} ${doctor.fullName}`, sigX, sigY + 7, { width: 195, align: "center" });

      doc.fontSize(9).font("Helvetica").fillColor(gray)
        .text(doctor.specialization || "", sigX, sigY + 22, { width: 195, align: "center" });

      doc.fontSize(8).fillColor(lightGray)
        .text(`PMDC: ${doctor.pmdcNumber || "N/A"}`, sigX, sigY + 36, { width: 195, align: "center" });

      // ══════════════════════════════════════════
      // FOOTER
      // ══════════════════════════════════════════

      // doc.moveTo(50, 800).lineTo(545, 800)
      //   .lineWidth(0.5).strokeColor("#e2e8f0").stroke();

      // doc.fontSize(7.5).font("Helvetica").fillColor(lightGray)
      //   .text("Generated by MediMate — Smart Clinic Management System", 50, 808, { width: 300 });

      // doc.fontSize(7.5).fillColor(lightGray)
      //   .text("This prescription is valid for 30 days from the date of issue.", 50, 808, { width: W, align: "right" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};