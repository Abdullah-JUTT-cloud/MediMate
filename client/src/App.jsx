import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import ProtectedRoute from "./components/ProtectedRoute"
import ThemeToggle from "./components/ThemeToggle"
import useTheme from "./hooks/useTheme"

const LandingPage = lazy(() => import("./pages/LandingPage"))
const SignupPage = lazy(() => import("./pages/SignupPage"))
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"))
const VerifyResetOtpPage = lazy(() => import("./pages/VerifyResetOtpPage"))
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))

function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <BrowserRouter>
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
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App