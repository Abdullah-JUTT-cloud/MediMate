import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo-compact.webp";

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
  }, [email, navigate, resetToken]);

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
              🛡️
            </div>
          </div>

          <header className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">Set New Password</h1>
            <p className="text-sm text-[var(--color-text-secondary)] sm:text-base">
              Create a strong new password for your account
            </p>
          </header>

          <div className="rounded-xl border bg-[var(--color-bg)] p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border bg-[var(--color-card)] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--color-primary)]"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {form.password && (
                  <div className="mt-2">
                    <div className="mb-1 flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: strength.score >= level ? strength.color : "var(--color-border)" }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-xs" style={{ color: strength.color }}>{strength.label} password</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border bg-[var(--color-card)] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--color-primary)]"
                    style={{
                      borderColor: form.confirmPassword
                        ? form.password === form.confirmPassword
                          ? "var(--color-success)"
                          : "var(--color-danger)"
                        : "var(--color-border)",
                    }}
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>

                {form.confirmPassword && (
                  <p className="mt-1 text-xs" style={{ color: form.password === form.confirmPassword ? "var(--color-success)" : "var(--color-danger)" }}>
                    {form.password === form.confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}