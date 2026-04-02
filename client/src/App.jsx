import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import ProtectedRoute from "./components/ProtectedRoute"
import ThemeToggle from "./components/ThemeToggle"
import ScrollToTop from "./components/ScrollToTop"
import useTheme from "./hooks/useTheme"

const LandingPage = lazy(() => import("./pages/LandingPage"))
const SignupPage = lazy(() => import("./pages/SignupPage"))
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"))
const VerifyResetOtpPage = lazy(() => import("./pages/VerifyResetOtpPage"))
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"))
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"))

// Informational Pages
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"))
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"))
const PricingPage = lazy(() => import("./pages/PricingPage"))
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"))
const ContactUsPage = lazy(() => import("./pages/ContactUsPage"))
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"))
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"))
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"))

function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <Toaster position="top-right" />
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)]" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
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
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App