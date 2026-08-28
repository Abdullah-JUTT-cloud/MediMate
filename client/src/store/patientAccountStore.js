import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "../api/axios";

const API = "/patient-account";

const usePatientAccountStore = create(
  persist(
    (set, get) => ({
      patient: null,
      isLoading: false,

      setPatient: (patient) => set({ patient }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        try {
          await axios.post(`${API}/logout`, {});
        } catch (_) {
          // ignore
        }
        set({ patient: null });
      },

      /**
       * Checks the current session against the server. Sets patient on success,
       * clears it on 401. Used on app mount for route guarding.
       */
      checkSession: async () => {
        try {
          set({ isLoading: true });
          const { data } = await axios.get(`${API}/me`);
          set({ patient: data.patient });
        } catch {
          set({ patient: null });
        } finally {
          set({ isLoading: false });
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
