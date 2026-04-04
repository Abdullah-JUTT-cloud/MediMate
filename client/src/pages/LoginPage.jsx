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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDFCF8] text-[#2C2C24]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-8 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[#E6DCCD]/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-24 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[#5D7052]/12 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(222,216,207,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(222,216,207,0.45)_1px,transparent_1px)] bg-size-[52px_52px] opacity-[0.18] mask-[radial-gradient(circle_at_center,black_45%,transparent_100%)]" />

      <nav className="sticky top-4 z-10 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-[#DED8CF]/70 bg-[#FEFEFA]/90 px-4 py-4 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] backdrop-blur-md sm:px-5">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DED8CF]/80 bg-[#5D7052] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
              <img src={logo} alt="MedAlerto" className="h-7 w-auto rounded-full" />
            </span>
            <span>
              <span className="block font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#2C2C24]">MedAlerto</span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#78786C]">
                organic clinic tools
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="rounded-full border border-[#C18C5D] px-5 py-2.5 font-body text-sm font-bold text-[#C18C5D] transition duration-300 hover:scale-105 hover:bg-[#C18C5D]/10 active:scale-95"
          >
            Create Account
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#78786C]">Welcome back</p>
            <h1 className="mt-5 max-w-xl text-5xl font-heading font-semibold leading-[0.95] text-[#2C2C24] sm:text-6xl lg:text-7xl">
              Sign in with a gentler, calmer workflow.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#78786C] sm:text-lg">
              Use your MedAlerto account to access prescriptions, appointments, and patient history from a quiet, tactile interface.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 text-sm text-[#78786C]">
              <div className="rounded-full border border-[#DED8CF]/70 bg-[#FEFEFA]/90 px-4 py-2 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)]">Secure access</div>
              <div className="rounded-full border border-[#DED8CF]/70 bg-[#FEFEFA]/90 px-4 py-2 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)]">Soft paper texture</div>
              <div className="rounded-full border border-[#DED8CF]/70 bg-[#FEFEFA]/90 px-4 py-2 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)]">Moss + clay palette</div>
            </div>
          </div>

          <section className="relative mx-auto w-full max-w-xl rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.18)] backdrop-blur-md sm:p-8">
            <div aria-hidden="true" className="absolute -top-8 right-8 h-20 w-20 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[#E6DCCD]/80 blur-2xl" />

            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#DED8CF]/80 bg-[#5D7052]/10 text-3xl shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
                🍃
              </div>
            </div>

            <header className="mb-8 text-center">
              <h2 className="text-2xl font-heading font-semibold text-[#2C2C24] sm:text-3xl">Welcome back</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#78786C] sm:text-base">
                Sign in to your MedAlerto dashboard
              </p>
            </header>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#78786C] sm:text-sm">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="doctor@example.com"
                  className="w-full rounded-full border border-[#DED8CF] bg-white/70 px-4 py-3 text-sm text-[#2C2C24] outline-none transition duration-300 placeholder:text-[#78786C] focus:border-[#5D7052] focus-visible:ring-2 focus-visible:ring-[#5D7052]/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#78786C] sm:text-sm">Password</label>
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs font-semibold text-[#C18C5D] transition hover:opacity-80"
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
                    className="w-full rounded-full border border-[#DED8CF] bg-white/70 px-4 py-3 pr-20 text-sm text-[#2C2C24] outline-none transition duration-300 placeholder:text-[#78786C] focus:border-[#5D7052] focus-visible:ring-2 focus-visible:ring-[#5D7052]/20"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#DED8CF] bg-[#FEFEFA] px-3 py-1 text-xs font-semibold text-[#78786C] transition duration-300 hover:scale-105 hover:border-[#5D7052] hover:text-[#5D7052]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#5D7052] bg-[#5D7052] px-8 font-body text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#DED8CF]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#78786C]">or</span>
                <div className="h-px flex-1 bg-[#DED8CF]" />
              </div>

              <button
                onClick={() => navigate("/signup")}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#C18C5D] bg-transparent px-8 font-body text-sm font-bold text-[#C18C5D] transition duration-300 hover:scale-105 hover:bg-[#C18C5D]/10 active:scale-95"
              >
                Create New Account
              </button>

              <p className="pt-2 text-center text-xs leading-relaxed text-[#78786C]">
                By signing in you agree to our{" "}
                <a href="#" className="font-semibold text-[#C18C5D] hover:opacity-80">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-semibold text-[#C18C5D] hover:opacity-80">
                  Privacy Policy
                </a>
              </p>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
