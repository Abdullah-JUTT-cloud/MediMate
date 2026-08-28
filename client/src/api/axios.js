import axios from "axios";
import useAuthStore from "../store/authStore";
import usePatientAccountStore from "../store/patientAccountStore";

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
