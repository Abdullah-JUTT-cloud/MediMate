import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo.svg";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const resetToken = location.state?.resetToken || "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength
  const getStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { score: 0, label: "", color: "" },
      { score: 1, label: "Weak", color: "#ef4444" },
      { score: 2, label: "Fair", color: "#f59e0b" },
      { score: 3, label: "Good", color: "#10B8A9" },
      { score: 4, label: "Strong", color: "#22c55e" },
    ];
    return levels[score];
  };

  const strength = getStrength(form.password);

  useEffect(() => {
    if (!email || !resetToken) {
      toast.error("Invalid reset link. Please start again.");
      navigate("/forgot-password");
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.password) { toast.error("Password is required"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }

    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/reset-password", {
        email,
        resetToken,
        newPassword: form.password,
      });
      toast.success("Password reset successfully!");
      navigate("/login");
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
          <img src={logo} alt="MediMate" className="h-8 w-auto brightness-0 invert" />
        </div>
        <button onClick={() => navigate("/login")} className="text-sm font-medium hover:text-teal-400 transition-colors" style={{ color: "#94a3b8" }}>
          Back to <span style={{ color: "#10B8A9" }}>Login</span>
        </button>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl" style={{ background: "rgba(16,184,169,0.1)", border: "1px solid rgba(16,184,169,0.25)" }}>
              🛡️
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Set New Password</h1>
            <p className="text-sm sm:text-base" style={{ color: "#94a3b8" }}>
              Create a strong new password for your account
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,184,169,0.15)", backdropFilter: "blur(12px)" }}>
            <div className="space-y-4">

              {/* New Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                    onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors hover:text-teal-400" style={{ color: "#64748b" }}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Password strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: strength.score >= level ? strength.color : "rgba(255,255,255,0.1)" }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-xs" style={{ color: strength.color }}>{strength.label} password</p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: form.confirmPassword
                        ? form.password === form.confirmPassword
                          ? "1px solid #22c55e"
                          : "1px solid #ef4444"
                        : "1px solid rgba(255,255,255,0.1)",
                      color: "white"
                    }}
                    onFocus={e => { if (!form.confirmPassword) e.target.style.border = "1px solid #10B8A9"; }}
                    onBlur={e => { if (!form.confirmPassword) e.target.style.border = "1px solid rgba(255,255,255,0.1)"; }}
                  />
                  <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors hover:text-teal-400" style={{ color: "#64748b" }}>
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
                {form.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: form.password === form.confirmPassword ? "#22c55e" : "#ef4444" }}>
                    {form.password === form.confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full mt-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.3)" }}
            >
              {isLoading ? "Resetting..." : "Reset Password ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}