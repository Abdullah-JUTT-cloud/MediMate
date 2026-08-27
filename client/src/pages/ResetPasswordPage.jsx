import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useThemedLogo from "../hooks/useThemedLogo";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const logo = useThemedLogo();
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
      { score: 1, label: "Weak", color: "var(--color-danger)" },
      { score: 2, label: "Fair", color: "var(--color-warning)" },
      { score: 3, label: "Good", color: "var(--color-success)" },
      { score: 4, label: "Strong", color: "var(--color-success)" },
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
    if (!form.password) {
      toast.error("Password is required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

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
    <div className="min-h-[100dvh] bg-[var(--color-bg-gradient)] text-[var(--color-text-primary)]">
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
            <span className="font-heading text-lg font-bold tracking-tight text-[var(--color-text-primary)]">MedAlerto</span>
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)] sm:text-sm"
          >
            Back to <span className="text-[var(--color-primary)]">Login</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-73px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="w-full max-w-md rounded-xl border bg-[var(--color-card)] p-6 shadow-sm sm:p-8">
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
            <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">
              Set New Password
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] sm:text-base">
              Create a strong new password for your account
            </p>
          </header>

          <div className="rounded-xl border bg-[var(--color-bg)] p-4 sm:p-6">
  <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
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
                          style={{
                            background:
                              strength.score >= level
                                ? strength.color
                                : "var(--color-border)",
                          }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-xs" style={{ color: strength.color }}>
                        {strength.label} password
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
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
                  <p
                    className="mt-1 text-xs"
                    style={{
                      color:
                        form.password === form.confirmPassword
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                    }}
                  >
                    {form.password === form.confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
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
