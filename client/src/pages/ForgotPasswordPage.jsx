import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo-compact.webp";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { toast.error("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Enter a valid email"); return; }

    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email!");
      navigate("/verify-reset-otp", { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/8 via-transparent to-[var(--color-primary)]/5" />
      </div>

      <nav className="relative z-10 border-b bg-[var(--color-card)]/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-8 lg:px-10 xl:px-14">
          <button className="flex items-center gap-3" onClick={() => navigate("/")}>
            <img src={logo} alt="MedAlerto" className="h-8 w-auto" />
            <span className="text-sm font-extrabold sm:text-base">MedAlerto</span>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)] sm:text-sm"
          >
            Back to <span className="text-[var(--color-primary)]">Login</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="w-full max-w-md rounded-xl border bg-[var(--color-card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-[var(--color-primary)]/10 text-3xl sm:h-20 sm:w-20 sm:text-4xl">
              🔐
            </div>
          </div>

          <header className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">Forgot Password?</h1>
            <p className="text-sm text-[var(--color-text-secondary)] sm:text-base">
              No worries. Enter your email and we'll send you a reset OTP.
            </p>
          </header>

          <div className="rounded-xl border bg-[var(--color-bg)] p-4 sm:p-6">
            <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="doctor@example.com"
              className="w-full rounded-xl border bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            />

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
            >
              {isLoading ? "Sending OTP..." : "Send Reset OTP"}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-xl border bg-[var(--color-card)] py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Back to Login
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}