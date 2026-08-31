import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import usePatientAccountStore from "../../store/patientAccountStore";
import { BrandLogoMark } from "../BrandLogo";
import { X, LogIn, UserPlus, ShieldCheck } from "lucide-react";

/**
 * Patient Login / Signup modal for the public booking portal.
 *
 * Opened from the "My Appointments" header button (and any other entry
 * point) when the patient is NOT authenticated — replacing the old
 * behaviour of redirecting to a dead /patient/appointments route.
 *
 *  - Sign In:     POST /patient-account/login  → stores the patient, then
 *                 navigates to /book/dashboard (or `from` when provided).
 *  - Create One:  POST /patient-account/register → routes to the OTP
 *                 verification page (/book/verify-email) with the email.
 */
export default function PatientAuthModal({ open, onClose, from = "/book/dashboard" }) {
  const navigate = useNavigate();
  const setPatient = usePatientAccountStore((s) => s.setPatient);

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });

  // Reset transient state each time the modal opens.
  useEffect(() => {
    if (open) {
      setMode("login");
      setLoading(false);
      setLoginForm({ email: "", password: "" });
      setRegisterForm({ name: "", email: "", phone: "", password: "" });
    }
  }, [open]);

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/patient-account/login", loginForm);
      setPatient(data.patient);
      toast.success("Welcome back!");
      onClose();
      navigate(from || "/book/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    const { name, email, phone, password } = registerForm;
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      toast.error("Password needs 8+ characters with an uppercase letter, a number, and a special character");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/patient-account/register", { name, email, phone, password });
      toast.success("Account created — check your email for the OTP");
      onClose();
      navigate("/book/verify-email", { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const tabClass = (active) =>
    `flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
      active
        ? "bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Backdrop click closes */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Patient sign in"
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {/* Unified inline-SVG brand mark — replaces the "M" placeholder tile. */}
            <BrandLogoMark size={40} alt="" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Patient Account</h2>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                Book & track your appointments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl mb-5">
            <button type="button" className={tabClass(mode === "login")} onClick={() => setMode("login")}>
              <span className="inline-flex items-center gap-1.5">
                <LogIn size={13} /> Sign In
              </span>
            </button>
            <button type="button" className={tabClass(mode === "register")} onClick={() => setMode("register")}>
              <span className="inline-flex items-center gap-1.5">
                <UserPlus size={13} /> Create One
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ahmed@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm py-3 transition-colors"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Ahmed Khan"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="ahmed@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="0300 1234567"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, phone: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm py-3 transition-colors"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center leading-relaxed">
                You&apos;ll verify your email with a one-time code before signing in.
              </p>
            </form>
          )}

          <p className="mt-5 text-[11px] text-slate-400 dark:text-zinc-600 text-center flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Your data is safe and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
