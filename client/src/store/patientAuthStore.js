import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const usePatientAuthStore = create(
  persist(
    (set) => ({
      patient: null,
      setPatient: (patient) => set({ patient }),
      logout: () => set({ patient: null }),
    }),
    {
      name: "medimate-patient-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default usePatientAuthStore;