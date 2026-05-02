import { lazy, Suspense, useEffect, useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import ProtectedRoute from "./components/ProtectedRoute"
import PatientProtectedRoute from "./components/PatientProtectedRoute"
import ThemeToggle from "./components/ThemeToggle"
import ScrollToTop from "./components/ScrollToTop"
import StartupLifelineOverlay from "./components/StartupLifelineOverlay"
import useTheme from "./hooks/useTheme"

const LandingPage = lazy(() => import("./pages/LandingPage"))
const SignupPage = lazy(() => import("./pages/SignupPage"))
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const PatientLoginPage = lazy(() => import("./pages/PatientLoginPage"))
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"))
const VerifyResetOtpPage = lazy(() => import("./pages/VerifyResetOtpPage"))
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const PatientChatPage = lazy(() => import("./pages/PatientChatPage"))
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"))
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"))
const PaymentPage = lazy(() => import("./pages/PaymentPage"))

// Informational Pages
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"))
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"))
const PricingPage = lazy(() => import("./pages/PricingPage"))
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"))
const ContactUsPage = lazy(() => import("./pages/ContactUsPage"))
const FAQPage = lazy(() => import("./pages/FAQPage"))
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"))
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"))
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"))

function App() {
  const { theme, toggleTheme } = useTheme()
  const [startupDone, setStartupDone] = useState(false)

  useEffect(() => {
    const startupTimer = window.setTimeout(() => setStartupDone(true), 1700)
    return () => window.clearTimeout(startupTimer)
  }, [])

  return (
    <>
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
              path="/patient-chat"
              element={
                <PatientProtectedRoute>
                  <PatientChatPage />
                </PatientProtectedRoute>
              }
            />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <StartupLifelineOverlay done={startupDone} />
    </>
  )
}

export default App
