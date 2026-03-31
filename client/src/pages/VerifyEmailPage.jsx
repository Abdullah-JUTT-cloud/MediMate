import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo-compact.webp";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please register first.");
      navigate("/signup");
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  // ─── OTP Input Handler ───────────────────────────────────

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  // ─── Submit ──────────────────────────────────────────────

  const handleSubmit = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/verify-email", {
        email,
        otp: otpValue,
      });
      toast.success("Email verified successfully!");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend OTP ──────────────────────────────────────────

  const handleResend = async () => {
    setResending(true);
    try {
      await axiosInstance.post("/auth/resend-otp", { email });
      toast.success("New OTP sent to your email!");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/8 via-transparent to-[var(--color-primary)]/5" />
      </div>

      <nav className="relative z-10 border-b bg-[var(--color-card)]/90 backdrop-blur">
        <div className="relative flex w-full items-center justify-between px-4 py-4 sm:px-8 lg:px-10 xl:px-14">
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-cyan-400 to-emerald-400 bg-clip-text text-xl font-black tracking-[0.34em] text-transparent lg:text-2xl">
              MEDALERTO
            </span>
          </div>
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
              📧
            </div>
          </div>

          <header className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">Check Your Email</h1>
            <p className="mb-1 text-sm text-[var(--color-text-secondary)] sm:text-base">
              We sent a 6-digit OTP to
            </p>
            <p className="text-sm font-semibold text-[var(--color-primary)] sm:text-base break-all">
              {email}
            </p>
          </header>

          <div className="rounded-xl border bg-[var(--color-bg)] p-4 sm:p-6">
            <p className="mb-6 text-center text-xs text-[var(--color-text-secondary)] sm:text-sm">
              Enter the 6-digit code below. The code expires in 30 minutes.
            </p>

            <div className="mb-8 flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-12 w-10 rounded-xl border text-center text-lg font-bold outline-none transition focus:border-[var(--color-primary)] sm:h-14 sm:w-12 sm:text-xl"
                  style={{
                    background: digit ? "rgba(37,99,235,0.1)" : "var(--color-card)",
                    borderColor: digit ? "var(--color-primary)" : "var(--color-border)",
                    color: "var(--color-text-primary)",
                    boxShadow: digit ? "0 0 12px rgba(37,99,235,0.18)" : "none",
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || otp.join("").length < 6}
              className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:py-4 sm:text-base"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>

            <div className="mt-5 text-center">
              <p className="text-xs text-[var(--color-text-secondary)] sm:text-sm">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-[var(--color-primary)] transition hover:opacity-90 disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
            Wrong email?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="font-semibold text-[var(--color-primary)] transition hover:opacity-90"
            >
              Go back and register again
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}