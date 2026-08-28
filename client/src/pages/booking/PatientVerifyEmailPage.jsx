import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";

export default function PatientVerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/patient-account/verify-email", { email, otp });
      toast.success("Email verified! Please log in.");
      navigate("/book/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await axios.post("/patient-account/resend-otp", { email });
      toast.success("New OTP sent — check your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-indigo-100 dark:border-zinc-700">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Verify your email</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
            We sent a 6-digit OTP to <strong>{email || "your email"}</strong>
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {!email && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">OTP Code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              placeholder="6-digit code"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white tracking-widest placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
          >
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={resend}
            disabled={resending}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend OTP"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link to="/book/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
