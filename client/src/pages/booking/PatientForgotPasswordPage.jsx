import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import useThemedLogo from "../../hooks/useThemedLogo";
import EmailSpamNotice from "../../components/EmailSpamNotice";

export default function PatientForgotPasswordPage() {
  const navigate = useNavigate();
  const logo = useThemedLogo();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/patient-account/forgot-password", { email });
      toast.success("OTP sent to your email!");
      navigate("/book/verify-reset-otp", { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-bg-gradient)] text-[var(--color-text-primary)]">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)]/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary)]/20 blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-[var(--color-primary)]/10 blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <nav className="sticky top-4 z-10 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card)]/90 px-4 py-4 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logo} alt="MedAlerto" className="h-full w-full object-contain" />
          </div>
          <button
            onClick={() => navigate("/book/login")}
            className="rounded-full border border-[var(--color-secondary)] px-4 py-2 text-xs font-bold text-[var(--color-secondary)] transition duration-300 hover:scale-105 hover:bg-[var(--color-secondary)]/10 sm:text-sm"
          >
            Back to Login
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-96px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="w-full max-w-xl rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.18)] backdrop-blur-md sm:p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-[50px] sm:w-[60px] lg:w-[85px] aspect-square glass-card rounded-2xl flex items-center justify-center border-[var(--color-border)] mb-2 bg-[var(--color-bg-soft)] shadow-sm">
              <img src={logo} alt="MedAlerto" className="h-2/3 w-auto object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]" />
            </div>
            <span className="block font-heading text-base font-bold tracking-[0.2em] text-[var(--color-text-primary)] uppercase mb-1">
              PATIENT PORTAL
            </span>
            <div className="h-px w-16 mx-auto bg-[var(--color-border)] mb-2 opacity-60" />
          </div>

          <header className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-heading font-semibold sm:text-3xl">
              Forgot Password?
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] sm:text-base">
              No worries. Enter your email and we&apos;ll send you a reset OTP.
            </p>
          </header>

          <EmailSpamNotice />

          <div className="rounded-3xl border border-[var(--color-border)]/70 bg-[var(--color-bg-soft)]/45 p-4 sm:p-6">
            <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="ahmed@example.com"
              className="w-full rounded-full border border-[var(--color-border)]/90 bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition duration-300 placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20"
            />

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-6 w-full rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-3 text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)] disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
            >
              {isLoading ? "Sending OTP..." : "Send Reset OTP"}
            </button>

            <button
              onClick={() => navigate("/book/login")}
              className="mt-3 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-card)] py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition duration-300 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
            >
              Back to Login
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
