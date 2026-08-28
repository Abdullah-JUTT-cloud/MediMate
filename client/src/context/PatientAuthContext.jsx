import { createContext, useEffect, useMemo, useState } from "react";
import usePatientAccountStore from "../store/patientAccountStore";

/**
 * Global Patient Auth Context for the /book/* booking module.
 *
 * Responsibilities:
 *  1. Loads the patient JWT / session from localStorage into the shared
 *     zustand store on first mount (persist key "medalerto-patient-auth"),
 *     and migrates legacy "patientToken" / "patient_account" keys so
 *     returning patients are not silently logged out.
 *  2. Verifies the session against the server (GET /patient-account/me) so
 *     the auth state is consistent before any guarded route renders.
 *  3. Exposes { patient, isAuthenticated, isSessionReady, refreshSession,
 *     logout } to every /book/* route and header component.
 *
 * This provider is independent of the doctor auth store (useAuthStore) and
 * the legacy patient-chat store (usePatientAuthStore).
 */
const PatientAuthContext = createContext({
  patient: null,
  isAuthenticated: false,
  isSessionReady: false,
  refreshSession: () => {},
  logout: () => {},
});

/**
 * One-time legacy localStorage migration. Older builds stored the patient
 * JWT under "patientToken" and the account profile under "patient_account".
 * The current store persists under "medalerto-patient-auth" and authenticates
 * with a cookie, so legacy keys are merged into the store (best-effort) and
 * removed to avoid stale/conflicting state.
 */
function migrateLegacySession() {
  try {
    const legacyToken = localStorage.getItem("patientToken");
    const legacyAccountRaw = localStorage.getItem("patient_account");

    const store = usePatientAccountStore.getState();
    const hasPersistedSession = Boolean(store.patient?._id);

    if (!legacyToken && !legacyAccountRaw) return;
    if (hasPersistedSession) {
      // Current session already present — just clean the legacy keys.
      if (legacyToken) localStorage.removeItem("patientToken");
      if (legacyAccountRaw) localStorage.removeItem("patient_account");
      return;
    }

    if (legacyAccountRaw) {
      try {
        const account = JSON.parse(legacyAccountRaw);
        if (account && (account._id || account.email)) {
          // Surface the account so the UI can show a signed-in shell while
          // checkSession confirms (or clears) it against the server.
          store.setPatient({
            _id: account._id || null,
            name: account.name || account.email || "Patient",
            email: account.email || null,
            phone: account.phone || null,
            gender: account.gender || null,
            isVerified: Boolean(account.isVerified),
            legacy: true,
          });
        }
      } catch {
        // Corrupt legacy JSON — drop it.
      }
    }

    if (legacyToken) localStorage.removeItem("patientToken");
    if (legacyAccountRaw) localStorage.removeItem("patient_account");
  } catch {
    // localStorage unavailable — nothing to migrate.
  }
}

export function PatientAuthProvider({ children }) {
  const patient = usePatientAccountStore((state) => state.patient);
  const checkSession = usePatientAccountStore((state) => state.checkSession);
  const logout = usePatientAccountStore((state) => state.logout);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    migrateLegacySession();
    checkSession().finally(() => {
      if (!cancelled) setIsSessionReady(true);
    });

    return () => {
      cancelled = true;
    };
    // Runs once on mount — checkSession is internally de-duplicated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      patient,
      isAuthenticated: Boolean(patient?._id || patient?.email),
      isSessionReady,
      refreshSession: () => checkSession(true),
      logout,
    }),
    [patient, isSessionReady, checkSession, logout]
  );

  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
}

export default PatientAuthContext;
