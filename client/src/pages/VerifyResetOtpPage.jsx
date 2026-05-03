import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo-compact.webp";

export default function VerifyResetOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please start again.");
      navigate("/forgot-password");
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

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

  const handleSubmit = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/auth/verify-reset-otp", {
        email,
        otp: otpValue,
      });
      toast.success("OTP verified successfully!");
      navigate("/reset-password", {
        state: { email, resetToken: response.data?.resetToken },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg-gradient)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-24 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />

      <nav className="sticky top-4 z-10 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card)]/90 px-4 py-4 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] backdrop-blur-md sm:px-5">
            <span className="font-heading text-lg font-bold tracking-tight text-[var(--color-text-primary)]">MedAlerto</span>
          <button
            onClick={() => navigate("/forgot-password")}
            className="rounded-full border border-[var(--color-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-secondary)] transition duration-300 hover:scale-105 hover:bg-[var(--color-secondary)]/10 sm:text-sm"
          >
            Back to Forgot Password
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="w-full max-w-xl rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.18)] backdrop-blur-md sm:p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-[50px] sm:w-[60px] lg:w-[85px] aspect-square glass-card rounded-2xl flex items-center justify-center border-[var(--color-border)] mb-2 bg-[var(--color-bg-soft)] shadow-sm">
              <img src={logo} alt="MedAlerto" className="h-2/3 w-auto object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]" />
            </div>
            <span className="block font-heading text-base font-bold tracking-[0.2em] text-[var(--color-text-primary)] uppercase mb-1">
              MEDALERTO
            </span>
            <div className="h-px w-16 mx-auto bg-[var(--color-border)] mb-2 opacity-60" />
          </div>

          <header className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-heading font-semibold sm:text-3xl">Verify reset OTP</h1>
            <p className="mb-1 text-sm text-[var(--color-text-secondary)] sm:text-base">Enter the 6-digit OTP sent to</p>
            <p className="break-all text-sm font-semibold text-[var(--color-primary)] sm:text-base">{email}</p>
          </header>

          <div className="rounded-3xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/45 p-4 sm:p-6">
            <p className="mb-6 text-center text-xs text-[var(--color-text-secondary)] sm:text-sm">
              This code verifies your password reset request.
            </p>

            <div className="mb-8 flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="h-12 w-10 rounded-full border text-center text-lg font-bold outline-none transition duration-300 focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20 sm:h-14 sm:w-12 sm:text-xl"
                  style={{
                    background: digit ? "rgba(var(--color-primary-rgb), 0.1)" : "var(--color-card)",
                    borderColor: digit ? "var(--color-primary)" : "var(--color-border)",
                    color: "var(--color-text-primary)",
                    boxShadow: digit ? "0 4px 16px -2px rgba(var(--color-primary-rgb), 0.2)" : "none",
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || otp.join("").length < 6}
              className="w-full rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-3 text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)] disabled:cursor-not-allowed disabled:opacity-40 sm:py-4 sm:text-base"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="mt-5 text-center">
              <p className="text-xs text-[var(--color-text-secondary)] sm:text-sm">
                Didn&apos;t receive it?{" "}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-[var(--color-secondary)] transition hover:opacity-80 disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
            Changed your mind?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-semibold text-[var(--color-secondary)] transition hover:opacity-80"
            >
              Back to Login
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}
