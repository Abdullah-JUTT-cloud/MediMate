import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./components/ProtectedRoute";
import PatientProtectedRoute from "./components/PatientProtectedRoute";
import ThemeToggle from "./components/ThemeToggle";
import ScrollToTop from "./components/ScrollToTop";
import useTheme from "./hooks/useTheme";
import { RouteSkeleton } from "./components/RouteSkeleton";
import ErrorBoundary from "./components/ErrorBoundary";
import useAuthStore from "./store/authStore";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PatientLoginPage = lazy(() => import("./pages/PatientLoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const VerifyResetOtpPage = lazy(() => import("./pages/VerifyResetOtpPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PatientChatPage = lazy(() => import("./pages/PatientChatPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const DoctorQueuePage = lazy(() => import("./pages/DoctorQueuePage"));

// Informational Pages
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));
const ContactUsPage = lazy(() => import("./pages/ContactUsPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));

function NotFoundRoute() {
  const doctor = useAuthStore((state) => state.doctor);
  return <Navigate to={doctor ? "/dashboard" : "/"} replace />;
}

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        {/* Global toast banner: fixed, centred, high z-index, sits below sticky
            headers (offset by safe-area + header height) so it never covers the
            patient/queue header. Short auto-dismiss keeps it from lingering. */}
        <Toaster
          position="top-center"
          containerStyle={{
            top: "calc(env(safe-area-inset-top, 0px) + 6rem)",
            zIndex: 9999,
          }}
          toastOptions={{
            duration: 2600,
            style: {
              maxWidth: "min(28rem, calc(100vw - 1.5rem))",
              width: "100%",
              fontSize: "0.8125rem",
              fontWeight: 600,
              borderRadius: "0.75rem",
              background: "var(--color-surface, #ffffff)",
              color: "var(--color-text-primary, #1e293b)",
              border: "1px solid var(--color-border, #e2e8f0)",
              boxShadow: "0 18px 40px -16px rgba(0, 0, 0, 0.35)",
              padding: "0.75rem 1rem",
            },
            success: {
              iconTheme: { primary: "#0d9488", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
            },
          }}
        />
        <ErrorBoundary>
          <Suspense fallback={<RouteSkeleton />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/patient-login" element={<PatientLoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/contact" element={<ContactUsPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/queue"
                element={
                  <ProtectedRoute>
                    <DoctorQueuePage standalone />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient-chat"
                element={
                  <PatientProtectedRoute>
                    <PatientChatPage />
                  </PatientProtectedRoute>
                }
              />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/*" element={<AdminDashboardPage />} />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundRoute />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
}

export default App;
