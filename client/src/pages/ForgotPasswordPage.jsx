import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo.svg";

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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0f1923 0%, #0d2137 50%, #0a1628 100%)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10B8A9, transparent)", filter: "blur(60px)" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10B8A9, transparent)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(rgba(16,184,169,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,184,169,0.3) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      <nav className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(16,184,169,0.1)" }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="MedAlerto" className="h-8 w-auto brightness-0 invert" />
        </div>
        <button onClick={() => navigate("/login")} className="text-sm font-medium hover:text-teal-400 transition-colors" style={{ color: "#94a3b8" }}>
          Back to <span style={{ color: "#10B8A9" }}>Login</span>
        </button>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl" style={{ background: "rgba(16,184,169,0.1)", border: "1px solid rgba(16,184,169,0.25)" }}>
              🔐
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Forgot Password?</h1>
            <p className="text-sm sm:text-base" style={{ color: "#94a3b8" }}>
              No worries. Enter your email and we'll send you a reset OTP.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,184,169,0.15)", backdropFilter: "blur(12px)" }}>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="doctor@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full mt-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.3)" }}
            >
              {isLoading ? "Sending OTP..." : "Send Reset OTP →"}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full mt-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}