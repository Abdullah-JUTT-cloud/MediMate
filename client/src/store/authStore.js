import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      doctor: null,
      isAuthenticated: false,
      isLoading: false,

      setDoctor: (doctor) =>
        set({
          doctor,
          isAuthenticated: true,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          doctor: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "medimate-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        doctor: state.doctor,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;