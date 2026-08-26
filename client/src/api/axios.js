import axios from "axios";
import useAuthStore from "../store/authStore";

export function getApiBaseUrl() {
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    if (envBaseUrl) {
        return envBaseUrl.replace(/\/$/, "");
    }

    // Use local API in development and same-origin API in production by default.
    return import.meta.env.DEV ? "http://localhost:3000/api" : "/api";
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
