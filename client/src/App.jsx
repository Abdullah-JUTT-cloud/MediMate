import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppToaster from "./components/Toast";
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
        {/* Global toast system: theme-aware (light/dark), high-contrast,
            fixed top-centre at z-[9999], offset below sticky headers
            (safe-area + header height). All variant styling lives in
            components/Toast.jsx. */}
        <AppToaster />
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
