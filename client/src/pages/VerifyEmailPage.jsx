import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo.svg";

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
  }, []);

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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0f1923 0%, #0d2137 50%, #0a1628 100%)" }}
    >
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10B8A9, transparent)", filter: "blur(60px)" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10B8A9, transparent)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(16,184,169,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,184,169,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }} />
      </div>

      {/* Navbar */}
      <nav
        className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(16,184,169,0.1)" }}
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="MedAlerto" className="h-8 w-auto brightness-0 invert" />
        </div>
        <button
          onClick={() => navigate("/login")}
          className="text-sm font-medium transition-colors hover:text-teal-400"
          style={{ color: "#94a3b8" }}
        >
          Back to <span style={{ color: "#10B8A9" }}>Login</span>
        </button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl"
              style={{ background: "rgba(16,184,169,0.1)", border: "1px solid rgba(16,184,169,0.25)" }}
            >
              📧
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Check Your Email</h1>
            <p className="text-sm sm:text-base mb-1" style={{ color: "#94a3b8" }}>
              We sent a 6-digit OTP to
            </p>
            <p className="text-sm sm:text-base font-semibold" style={{ color: "#10B8A9" }}>
              {email}
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl sm:rounded-3xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(16,184,169,0.15)",
              backdropFilter: "blur(12px)"
            }}
          >
            <p className="text-xs sm:text-sm text-center mb-6" style={{ color: "#64748b" }}>
              Enter the 6-digit code below. The code expires in 30 minutes.
            </p>

            {/* OTP Inputs */}
            <div
              className="flex items-center justify-center gap-2 sm:gap-3 mb-8"
              onPaste={handlePaste}
            >
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
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl outline-none transition-all duration-200"
                  style={{
                    background: digit ? "rgba(16,184,169,0.1)" : "rgba(255,255,255,0.05)",
                    border: digit ? "1.5px solid #10B8A9" : "1.5px solid rgba(255,255,255,0.1)",
                    color: "white",
                    boxShadow: digit ? "0 0 12px rgba(16,184,169,0.2)" : "none",
                  }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || otp.join("").length < 6}
              className="w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #10B8A9, #0d9488)",
                boxShadow: "0 4px 15px rgba(16,184,169,0.3)"
              }}
            >
              {isLoading ? "Verifying..." : "Verify Email ✓"}
            </button>

            {/* Resend */}
            <div className="text-center mt-5">
              <p className="text-xs sm:text-sm" style={{ color: "#64748b" }}>
                Didn't receive the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold transition-colors hover:text-teal-300 disabled:opacity-50"
                  style={{ color: "#10B8A9" }}
                >
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              </p>
            </div>
          </div>

          {/* Note */}
          <p className="text-center text-xs mt-6" style={{ color: "#475569" }}>
            Wrong email?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="transition-colors hover:text-teal-300"
              style={{ color: "#10B8A9" }}
            >
              Go back and register again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}