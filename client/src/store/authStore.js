import {create} from "zustand";

const useAuthStore = create((set) => ({
  doctor: null,
  isAuthenticated: false,
  isLoading: false,

  setDoctor: (doctor) => set({ 
    doctor, 
    isAuthenticated: true 
  }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: () => set({ 
    doctor: null, 
    isAuthenticated: false 
  }),
}))

export default useAuthStore;