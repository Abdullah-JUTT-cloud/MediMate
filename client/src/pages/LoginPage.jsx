import { useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  LockKeyhole,
  Mail,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
        profileVerificationStatus,
        profileVerificationReviewedAt,
        profileVerificationReviewedBy,
        profileVerificationNotes,
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
        profileVerificationStatus,
        profileVerificationReviewedAt,
        profileVerificationReviewedBy,
        profileVerificationNotes,
      });
      toast.success(`Welcome back, ${fullName}!`);
      navigate("/dashboard");
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
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

  const featureCards = [
    {
      icon: ShieldCheck,
      title: "Protected access",
      description:
        "Sign in with secure role-based access designed for clinic workflows.",
    },
    {
      icon: CalendarCheck2,
      title: "Daily operations",
      description:
        "Jump back into appointments, records, and prescription work fast.",
    },
    {
      icon: MessageSquareMore,
      title: "Connected care",
      description: "Keep chat, follow-ups, and patient context in one place.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-96 w-96 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-24 h-[30rem] w-[30rem] rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(196,221,228,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(196,221,228,0.45)_1px,transparent_1px)] bg-size-[52px_52px] opacity-[0.18] mask-[radial-gradient(circle_at_center,black_45%,transparent_100%)]"
      />

      <nav className="sticky top-4 z-10 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card)]/92 px-4 py-4 shadow-[var(--shadow-soft)] backdrop-blur-md sm:px-5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
              <img
                src={logo}
                alt="MedAlerto"
                className="h-full w-full object-contain p-1"
              />
            </span>
            <span>
              <span className="block font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-text-primary)]">
                MedAlerto
              </span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
                organic clinic tools
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="rounded-full border border-[var(--color-secondary)] bg-[var(--color-card)] px-5 py-2.5 font-body text-sm font-bold text-[var(--color-secondary)]"
          >
            Create Account
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)]/70 bg-[var(--color-card)]/72 p-8 shadow-[var(--shadow-float)] backdrop-blur-md sm:p-10 lg:p-12">
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[var(--color-primary)]/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[var(--color-secondary)]/10 blur-3xl"
            />

            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  Medical workspace login
                </div>

                <h1 className="mt-6 max-w-xl text-4xl font-heading font-semibold leading-[0.96] text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
                  A calmer place to return to your clinic work.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
                  Sign in to access prescriptions, appointments, patient
                  history, and secure communication from one focused dashboard.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {featureCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className="rounded-3xl border border-[var(--color-border)]/70 bg-[var(--color-card)] px-4 py-4 shadow-[var(--shadow-soft)]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-bg-soft)] text-[var(--color-primary)]">
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {card.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-medium text-[var(--color-text-secondary)]">
                <span className="rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card)] px-4 py-2">
                  HIPAA-aware access
                </span>
                <span className="rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card)] px-4 py-2">
                  Doctor-first workflow
                </span>
                <span className="rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card)] px-4 py-2">
                  Fast dashboard entry
                </span>
              </div>
            </div>
          </div>

          <section className="relative mx-auto w-full max-w-xl rounded-[2.5rem] border border-[var(--color-border)]/70 bg-[var(--color-card)]/96 p-6 shadow-[var(--shadow-float)] backdrop-blur-md sm:p-8 lg:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-6 top-8 h-24 w-24 rounded-full bg-[var(--color-secondary)]/10 blur-2xl"
            />

            <div className="mb-8 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
                <img
                  src={logo}
                  alt="MedAlerto"
                  className="h-full w-full object-contain p-1"
                />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
                  Doctor sign in
                </p>
                <h2 className="mt-1 text-2xl font-heading font-semibold text-[var(--color-text-primary)] sm:text-3xl">
                  Welcome back
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
                  <Mail className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="doctor@example.com"
                  className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)]/50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
                    <LockKeyhole className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                    Password
                  </label>
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs font-semibold text-[var(--color-secondary)]"
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
                    className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)]/50 px-4 py-3 pr-20 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-8 font-body text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  "Signing In..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[var(--color-border)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-secondary)]">
                  or
                </span>
                <div className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              <button
                onClick={() => navigate("/signup")}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[var(--color-secondary)] bg-[var(--color-card)] px-8 font-body text-sm font-bold text-[var(--color-secondary)]"
              >
                Create New Account
              </button>

              <p className="pt-2 text-center text-xs leading-relaxed text-[var(--color-text-secondary)]">
                By signing in you agree to our{" "}
                <Link
                  to="/terms-of-service"
                  className="font-semibold text-[var(--color-secondary)]"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  className="font-semibold text-[var(--color-secondary)]"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
