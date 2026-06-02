export const validatePrescription = (prescription) => {
  const errors = [];

  if (!prescription) return errors;

  if (!prescription.diagnosis?.trim()) {
    errors.push("Diagnosis is required");
  }
  if (prescription.diagnosis?.length > 1000) {
    errors.push("Diagnosis exceeds 1000 characters");
  }

  if (!Array.isArray(prescription.medicines)) {
    errors.push("Medicines must be an array");
  }

  const seenMedicines = new Set();
  prescription.medicines?.forEach((med, i) => {
    if (!med.name?.trim()) errors.push(`Medicine ${i + 1}: name required`);
    if (!med.dosage?.trim()) errors.push(`Medicine ${i + 1}: dosage required`);
    if (!med.frequency?.trim()) errors.push(`Medicine ${i + 1}: frequency required`);
    if (!med.duration?.trim()) errors.push(`Medicine ${i + 1}: duration required`);

    if (seenMedicines.has(med.name?.toLowerCase())) {
      errors.push(`Duplicate medicine: ${med.name}`);
    }
    seenMedicines.add(med.name?.toLowerCase());
  });

  if (prescription.nextAppointment) {
    const nextDate = new Date(prescription.nextAppointment);
    if (nextDate < new Date()) {
      errors.push("Next appointment cannot be in the past");
    }
  }

  return errors;
};
