import { Navigate } from "react-router-dom";
import usePatientAccountStore from "../store/patientAccountStore";

/**
 * Route guard for patient-account protected pages.
 * Redirects unauthenticated patients to /book/login.
 *
 * NOTE: This is completely independent of PatientProtectedRoute (legacy chat).
 */
export default function PatientAccountProtectedRoute({ children }) {
  const patient = usePatientAccountStore((state) => state.patient);
  if (!patient) {
    return <Navigate to="/book/login" replace />;
  }
  return children;
}
