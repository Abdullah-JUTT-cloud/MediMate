import { useContext } from "react";
import PatientAuthContext from "./PatientAuthContext";

/**
 * Access the global patient auth context (see PatientAuthContext.jsx).
 * Exposed from its own file to keep the provider module component-only
 * (react-refresh/only-export-components).
 */
export function usePatientAuth() {
  return useContext(PatientAuthContext);
}

export default usePatientAuth;
