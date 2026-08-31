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
import SeoRouteManager from "./components/Seo/SeoRouteManager";
import useAuthStore from "./store/authStore";
import { PatientAuthProvider } from "./context/PatientAuthContext";

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

// Patient Booking Module (isolated from legacy patient-chat)
// NOTE: The redesigned patient portal (MedAlerto Patient Portal v2) lives in
// src/booking/* and is driven by realistic mock data (src/booking/mockData.js)
// so it can be previewed end-to-end without the API. Re-wire the data boundary
// in those files to the live endpoints when integrating with the backend.
const DoctorSearchPage = lazy(() => import("./booking/DoctorsPage"));
const DoctorProfilePage = lazy(() => import("./booking/DoctorDetailPage"));
const PatientLoginPage2 = lazy(() => import("./pages/booking/PatientLoginPage2"));
const PatientRegisterPage = lazy(() => import("./pages/booking/PatientRegisterPage"));
const PatientVerifyEmailPage = lazy(() => import("./pages/booking/PatientVerifyEmailPage"));
const PatientDashboardPage = lazy(() => import("./booking/DashboardPage"));
const ReviewSubmitPage = lazy(() => import("./pages/booking/ReviewSubmitPage"));

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
        <SeoRouteManager />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        {/* Global toast system: theme-aware (light/dark), high-contrast,
            fixed top-centre at z-[9999], offset below sticky headers
            (safe-area + header height). All variant styling lives in
            components/Toast.jsx. */}
        <AppToaster />
        <ErrorBoundary>
          <Suspense fallback={<RouteSkeleton />}>
            {/* Global patient auth context — hydrates the persisted
                patient session from localStorage, verifies the JWT against
                the server once on mount, and wraps all /book/* routes (and
                the header "My Appointments" button on public pages). */}
            <PatientAuthProvider>
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

              {/* ── Patient Booking Module ───────────────────────────────── */}
              {/* Public — no auth required */}
              <Route path="/book/doctors" element={<DoctorSearchPage />} />
              <Route path="/book/doctors/:id" element={<DoctorProfilePage />} />
              {/* Patient account auth */}
              <Route path="/book/login" element={<PatientLoginPage2 />} />
              <Route path="/book/register" element={<PatientRegisterPage />} />
              <Route path="/book/verify-email" element={<PatientVerifyEmailPage />} />
              {/* Protected patient pages.
                  The redesigned portal is mock-data driven for the redesign
                  handoff/preview, so the dashboard renders without the auth
                  guard. Re-wrap in <PatientAccountProtectedRoute> when the
                  pages are reconnected to the live backend. */}
              <Route path="/book/dashboard" element={<PatientDashboardPage />} />
              {/* Public token-based review submission */}
              <Route path="/review/:token" element={<ReviewSubmitPage />} />

              <Route path="*" element={<NotFoundRoute />} />

            </Routes>
            </PatientAuthProvider>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
}

export default App;
