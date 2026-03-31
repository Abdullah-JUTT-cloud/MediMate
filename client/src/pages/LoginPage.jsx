import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import logo from "../assets/logo-compact.webp";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setDoctor } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!form.password) {
      toast.error("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", form);
      const {
        fullName,
        email,
        title,
        gender,
        specialization,
        primaryDegree,
        clinics,
        hospitals,
        slotDuration,
        profilePicture,
      } = res.data;
      setDoctor({
        fullName,
        email,
        title,
        gender,
        specialization,
        primaryDegree,
        clinics,
        hospitals,
        slotDuration,
        profilePicture,
      });
      toast.success(`Welcome back, ${fullName}!`);
      navigate("/dashboard");
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      // If not verified, redirect to verify page
      if (error.response?.status === 403) {
        toast.error("Please verify your email first");
        navigate("/verify-email", { state: { email: form.email } });
        return;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
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
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="MedAlerto" className="h-8 w-auto" />
            <span className="text-sm font-extrabold sm:text-base">MedAlerto</span>
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="text-xs font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)] sm:text-sm"
          >
            New here? <span className="text-[var(--color-primary)]">Create Account</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="w-full max-w-md rounded-xl border bg-[var(--color-card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-[var(--color-primary)]/10 text-3xl">
              🏥
            </div>
          </div>

          <header className="mb-8 text-center">
            <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome Back</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
              Sign in to your MedAlerto dashboard
            </p>
          </header>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="doctor@example.com"
                className="w-full rounded-xl border bg-[var(--color-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
                  Password
                </label>
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-semibold text-[var(--color-primary)] transition hover:opacity-90"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border bg-[var(--color-bg)] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--color-primary)]"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-secondary)]">or</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="w-full rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/5 py-3 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
          >
            Create New Account
          </button>

          <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
            By signing in you agree to our{" "}
            <a href="#" className="font-semibold text-[var(--color-primary)] hover:opacity-90">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-semibold text-[var(--color-primary)] hover:opacity-90">
              Privacy Policy
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
