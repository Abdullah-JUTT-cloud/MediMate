import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      doctor: null,
      isLoading: false,

      setDoctor: (doctor) =>
        set({
          doctor,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          doctor: null,
        }),
    }),
    {
      name: "medimate-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        doctor: state.doctor,
        // isAuthenticated is intentionally NOT persisted (FE-3)
      }),
    }
  )
);

// Derive isAuthenticated from doctor — never persisted to localStorage
export const useIsAuthenticated = () => useAuthStore((state) => state.doctor !== null);

export default useAuthStore;