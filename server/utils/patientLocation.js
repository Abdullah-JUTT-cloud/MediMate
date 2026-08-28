/**
 * Facility ("location") helpers shared by the Patient model, the patient
 * controller and (conceptually) the client-side selector.
 *
 * A Patient stores its facilities in the `locations` array because that array is
 * what slot generation, appointment booking, checkups and prescriptions read
 * from. The Edit Profile form, however, exposes a single-select LOCATION
 * dropdown, so every write of a single `location` value is funnelled through
 * `resolveLocationSelection()` which:
 *
 *   1. accepts the composite `"<Type>:<id>"` value produced by the dropdown
 *      (or a bare id / facility name / `{ locationType, locationId, locationName }`
 *      object, or `null | "" | "unassigned"` for "no facility"),
 *   2. resolves it against the clinics/hospitals the doctor has configured and
 *      rewrites it into the canonical stored shape,
 *   3. falls back to the caller-supplied values when the facility is no longer
 *      present in the doctor's settings (stale but valid historical data),
 *   4. throws when the value cannot be understood at all.
 */

export const LOCATION_TYPES = ["Clinic", "Hospital"];

/** Raised when a posted `location` cannot be resolved — surfaces as HTTP 400. */
export class LocationSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "LocationSelectionError";
  }
}

/** Values that mean "this patient has no facility assigned yet". */
const UNASSIGNED_VALUES = new Set([
  "",
  "unassigned",
  "none",
  "null",
  "undefined",
  "—",
  "-",
]);

const asText = (value) => (value === null || value === undefined ? "" : String(value).trim());

/**
 * Flattens a doctor profile into the same shape patients store, so the two can
 * be compared. Mirrors `buildDoctorLocations()` on the client.
 */
export const buildFacilityList = (doctor) => [
  ...(Array.isArray(doctor?.clinics) ? doctor.clinics : []).map((clinic, index) => ({
    locationType: "Clinic",
    locationId: asText(clinic?._id) || `clinic_${index}`,
    locationName: asText(clinic?.name),
  })),
  ...(Array.isArray(doctor?.hospitals) ? doctor.hospitals : []).map((hospital, index) => ({
    locationType: "Hospital",
    locationId: asText(hospital?._id) || `hospital_${index}`,
    locationName: asText(hospital?.name),
  })),
];

/** Composite `<option>` value used by the LOCATION dropdown, e.g. `Clinic:65f…`. */
export const toLocationValue = (location) =>
  location?.locationId ? `${location.locationType}:${location.locationId}` : "";

/**
 * Inverse of `toLocationValue()`. A bare value (no "<Type>:" prefix) is treated
 * as a facility id *or* name so both resolve.
 */
export const parseLocationValue = (value) => {
  const raw = asText(value);
  if (!raw) return null;
  const separator = raw.indexOf(":");
  if (separator === -1) return { locationType: "", locationId: raw, locationName: raw };
  return {
    locationType: asText(raw.slice(0, separator)),
    locationId: asText(raw.slice(separator + 1)),
    locationName: "",
  };
};

const matchFacility = (facilities, { locationType, locationId, locationName }) => {
  const type = asText(locationType);
  const id = asText(locationId);
  const name = asText(locationName).toLowerCase();

  return (
    facilities.find((facility) => {
      if (type && asText(facility.locationType).toLowerCase() !== type.toLowerCase()) return false;
      if (id && asText(facility.locationId) === id) return true;
      if (!name) return false;
      return asText(facility.locationName).toLowerCase() === name;
    }) || null
  );
};

const normaliseType = (value) => {
  const type = asText(value).toLowerCase();
  if (type === "clinic") return "Clinic";
  if (type === "hospital") return "Hospital";
  return "";
};

/**
 * Turns whatever the client sent into either `null` (unassigned) or a canonical
 * `{ locationType, locationId, locationName }` object.
 *
 * @param {string|object|null} input  Raw `location` value from the request body.
 * @param {object} [doctor]           Doctor doc (needs `clinics` + `hospitals`).
 * @throws {Error} when the value is present but cannot be resolved.
 */
export const resolveLocationSelection = (input, doctor) => {
  const facilities = buildFacilityList(doctor);

  if (input === null || input === undefined) return null;

  let candidate = null;

  if (typeof input === "string") {
    if (UNASSIGNED_VALUES.has(input.trim().toLowerCase())) return null;
    candidate = parseLocationValue(input);
  } else if (typeof input === "object" && !Array.isArray(input)) {
    candidate = {
      locationType: asText(input.locationType ?? input.type),
      locationId: asText(input.locationId ?? input.id ?? input.value),
      locationName: asText(input.locationName ?? input.name),
    };
    if (!candidate.locationType && !candidate.locationId && !candidate.locationName) return null;
  } else {
    throw new LocationSelectionError("Invalid location value");
  }

  const matched = matchFacility(facilities, candidate);
  if (matched) {
    return {
      locationType: matched.locationType,
      locationId: matched.locationId,
      locationName: matched.locationName,
    };
  }

  // Not one of the doctor's current facilities. A fully described facility (type
  // + name) is preserved as-is so a historical assignment is never silently
  // wiped; anything less (e.g. a bare id) is rejected rather than stored with a
  // meaningless display name.
  const locationType = normaliseType(candidate.locationType);
  const locationName = candidate.locationName;
  if (locationType && locationName) {
    return {
      locationType,
      locationId:
        candidate.locationId || `${locationType.toLowerCase()}_${locationName.toLowerCase()}`,
      locationName,
    };
  }

  if (!locationType && !candidate.locationId && !candidate.locationName) return null;

  throw new LocationSelectionError(
    locationType
      ? "Selected location needs a name — it is no longer configured on your profile"
      : "Selected location is not configured on your profile",
  );
};

/**
 * Converts a resolved selection into the array the schema persists.
 * Returns `[]` for "unassigned".
 */
export const toLocationArray = (input, doctor) => {
  const resolved = resolveLocationSelection(input, doctor);
  return resolved ? [resolved] : [];
};
