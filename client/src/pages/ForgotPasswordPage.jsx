import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo-compact.webp";

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
    <div className="relative min-h-screen overflow-hidden bg-[#FDFCF8] text-[#2C2C24]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[#E6DCCD]/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-24 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[#5D7052]/10 blur-3xl" />

      <nav className="sticky top-4 z-10 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-[#DED8CF]/70 bg-[#FEFEFA]/90 px-4 py-4 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)] backdrop-blur-md sm:px-5">
          <button className="flex items-center gap-3" onClick={() => navigate("/")}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DED8CF]/80 bg-[#5D7052] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
              <img src={logo} alt="MedAlerto" className="h-7 w-auto rounded-full" />
            </span>
            <span className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#2C2C24]">MedAlerto</span>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="rounded-full border border-[#C18C5D] px-4 py-2 text-xs font-bold text-[#C18C5D] transition duration-300 hover:scale-105 hover:bg-[#C18C5D]/10 sm:text-sm"
          >
            Back to Login
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="w-full max-w-xl rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA]/95 p-6 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.18)] backdrop-blur-md sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#DED8CF]/80 bg-[#5D7052]/10 text-3xl shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] sm:h-20 sm:w-20 sm:text-4xl">
              🔐
            </div>
          </div>

          <header className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-heading font-semibold sm:text-3xl">Forgot Password?</h1>
            <p className="text-sm text-[#78786C] sm:text-base">
              No worries. Enter your email and we&apos;ll send you a reset OTP.
            </p>
          </header>

          <div className="rounded-3xl border border-[#DED8CF]/70 bg-[#F0EBE5]/45 p-4 sm:p-6">
            <label className="mb-2 block text-xs font-semibold text-[#78786C] sm:text-sm">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="doctor@example.com"
              className="w-full rounded-full border border-[#DED8CF]/90 bg-[#FEFEFA] px-4 py-3 text-sm text-[#2C2C24] outline-none transition duration-300 placeholder:text-[#78786C] focus:border-[#5D7052] focus-visible:ring-2 focus-visible:ring-[#5D7052]/20"
            />

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-6 w-full rounded-full border border-[#5D7052] bg-[#5D7052] py-3 text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)] disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
            >
              {isLoading ? "Sending OTP..." : "Send Reset OTP"}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-full border border-[#DED8CF] bg-[#FEFEFA] py-3 text-sm font-semibold text-[#78786C] transition duration-300 hover:border-[#C18C5D] hover:text-[#C18C5D]"
            >
              Back to Login
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}