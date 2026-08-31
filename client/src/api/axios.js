import axios from "axios";
import useAuthStore from "../store/authStore";
import usePatientAccountStore from "../store/patientAccountStore";

// Same-origin by default: in local dev the Vite proxy forwards /api and
// /socket.io to the backend (see vite.config.js), and in production the API is
// either co-located behind the same origin or set explicitly via VITE_API_URL.
// Falling back to a hard-coded "localhost:PORT" broke every API call in the
// deployed app (and locally too, since the server listens on 3000).
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").trim().replace(/\/+$/, "");

export function getApiBaseUrl() {
    return API_BASE_URL;
}

export function getRealtimeBaseUrl() {
    const apiBaseUrl = getApiBaseUrl();
    if (/^https?:\/\//i.test(apiBaseUrl)) {
        return apiBaseUrl.replace(/\/api\/?$/, "");
    }
    // Relative base URL → realtime socket connects to the same origin.
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
    }
    return "";
}

const axiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
});

/**
 * Patient booking module endpoints that may legitimately return 401
 * (wrong credentials / unverified account) WITHOUT meaning the session
 * expired. Those must not clear a valid stored session.
 */
const PATIENT_AUTH_FLOW_PATHS = [
    "/patient-account/login",
    "/patient-account/register",
    "/patient-account/verify-email",
    "/patient-account/resend-otp",
];

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            const { doctor, logout } = useAuthStore.getState();
            if (doctor) {
                logout();
            }

            // Patient JWT expired/invalid on a protected patient-account
            // call: clear the local session so route guards redirect to
            // /book/login instead of showing a half-authenticated UI or
            // looping between booking pages.
            const url = String(error.config?.url || "");
            const isPatientAccountCall = url.includes("/patient-account/");
            const isAuthFlowCall = PATIENT_AUTH_FLOW_PATHS.some((path) => url.includes(path));
            if (isPatientAccountCall && !isAuthFlowCall) {
                usePatientAccountStore.getState().clearSession();
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
