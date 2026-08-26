import axios from "axios";
import useAuthStore from "../store/authStore";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim().replace(/\/$/, "");

export function getApiBaseUrl() {
    return API_BASE_URL;
}

export function getRealtimeBaseUrl() {
    const apiBaseUrl = getApiBaseUrl();
    return apiBaseUrl.replace(/\/api$/, "");
}

const axiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            const { doctor, logout } = useAuthStore.getState();
            if (doctor) {
                logout();
            }
        }

        if (error?.response?.status === 402) {
            const { doctor, setDoctor } = useAuthStore.getState();
            const { subscriptionStatus, subscriptionExpiresAt } = error.response.data || {};
            if (doctor && subscriptionStatus) {
                setDoctor({
                    ...doctor,
                    subscriptionStatus,
                    subscriptionExpiresAt,
                });
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
