import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "../api/axios";

const API = "/patient-account";

const usePatientAccountStore = create(
  persist(
    (set, get) => ({
      patient: null,
      isLoading: false,
      // Guards against duplicate /patient-account/me round-trips (React
      // StrictMode double-mount, multiple components refreshing at once).
      sessionChecking: false,

      setPatient: (patient) => set({ patient }),
      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Local-only session clear (no server round-trip). Used by the axios
       * 401 interceptor and by PatientAuthContext so an expired patient JWT
       * never leaves a stale "signed in" state in the UI.
       */
      clearSession: () => set({ patient: null }),

      logout: async () => {
        try {
          await axios.post(`${API}/logout`, {});
        } catch {
          // ignore — the local session is cleared regardless
        }
        set({ patient: null });
      },

      /**
       * Checks the current session against the server. Sets patient on
       * success, clears it on 401. Used on app mount for route guarding and
       * to keep the session alive across Home → Doctor List → Doctor
       * Profile → Patient Dashboard navigation.
       *
       * @param {boolean} [force=false] run even if a check is in flight.
       */
      checkSession: async (force = false) => {
        if (!force && get().sessionChecking) return;
        set({ sessionChecking: true });
        try {
          set({ isLoading: true });
          const { data } = await axios.get(`${API}/me`);
          set({ patient: data.patient });
        } catch {
          set({ patient: null });
        } finally {
          set({ sessionChecking: false, isLoading: false });
        }
      },
    }),
    {
      name: "medalerto-patient-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ patient: state.patient }),
    }
  )
);

export const useIsPatientAuthenticated = () =>
  usePatientAccountStore((state) => state.patient !== null);

export default usePatientAccountStore;
