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
  Stethoscope,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import usePatientAccountStore from "../../store/patientAccountStore";
import useThemedLogo from "../../hooks/useThemedLogo";

export default function PatientLoginPage2() {
  const navigate = useNavigate();
  const location = useLocation();
  const setPatient = usePatientAccountStore((s) => s.setPatient);
  const logo = useThemedLogo();

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
      const { data } = await axios.post("/patient-account/login", form);
      setPatient(data.patient);
      toast.success("Welcome back!");
      const from = location.state?.from;
      navigate(from && from.startsWith("/book/") ? from : "/book/dashboard");
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
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
      title: "Secure Access",
      description: "Your health data is protected with enterprise-grade security.",
      color: "text-[var(--color-primary)]",
    },
    {
      icon: CalendarCheck2,
      title: "Easy Booking",
      description: "Book appointments with verified doctors in seconds.",
      color: "text-[var(--color-primary)]",
    },
    {
      icon: MessageSquareMore,
      title: "Stay Connected",
      description: "Track appointments, receive reminders, and manage your health.",
      color: "text-[var(--color-primary)]",
    },
  ];

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[var(--color-bg-gradient)] font-body text-[var(--color-text-primary)] selection:bg-[var(--color-primary)]/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)]/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary)]/20 blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-[var(--color-primary)]/10 blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />

        {/* Subtle Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-10 w-10 glass-card rounded-xl flex items-center justify-center p-1.5 border-[var(--color-primary)]/20">
            <img src={logo} alt="MedAlerto" className="h-full w-full object-contain" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-[var(--color-text-primary)]">MedAlerto</span>
        </div>
        <button
          onClick={() => navigate("/book/register")}
          className="px-5 py-2 rounded-full glass-card border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm font-semibold"
        >
          Create Account
        </button>
      </nav>

      <main className="relative z-10 w-full max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Hero Content */}
        <div className="space-y-10 animate-fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Sparkles className="h-4 w-4" />
              Patient Portal
            </div>

            <h1 className="text-5xl md:text-7xl font-heading font-extrabold leading-[1.1] text-[var(--color-text-primary)] animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Your health, <span className="text-[var(--color-primary)]">simplified.</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Access your appointments, connect with verified doctors, and take control of your healthcare journey — all in one place.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {featureCards.map((card, i) => (
              <div key={i} className="space-y-3 group">
                <div className={`h-10 w-10 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-[var(--color-text-primary)]">{card.title}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 pt-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-xl">
                  <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                </div>
              ))}
              <div className="h-10 w-10 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold shadow-xl text-[var(--color-on-primary)]">
                +5k
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium italic animate-slide-up" style={{ animationDelay: '0.5s' }}>
              Trusted by 5,000+ patients across Pakistan.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {/* Decorative Elements around form */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />

          <div className="relative glass-card p-8 md:p-12 rounded-[2.5rem] border-[var(--color-border)] shadow-[var(--shadow-float)] overflow-hidden group">
            {/* Subtle light streak */}
            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,var(--color-primary)_180deg,transparent_360deg)] opacity-5 animate-spin" style={{ animationDuration: '20s' }} />

            <div className="relative space-y-8">
              <div className="text-center">
                <div className="mx-auto w-[50px] sm:w-[60px] lg:w-[85px] aspect-square glass-card rounded-2xl flex items-center justify-center border-[var(--color-border)] bg-[var(--color-bg-soft)] mb-2 shadow-sm">
                  <img src={logo} alt="MedAlerto" className="h-2/3 w-auto object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]" />
                </div>
                <span className="block font-heading text-base font-bold tracking-[0.2em] text-[var(--color-text-primary)] uppercase mb-1">
                  PATIENT PORTAL
                </span>
                <div className="h-px w-16 mx-auto bg-[var(--color-border)] mb-4 opacity-60" />

                <div className="space-y-1">
                  <h2 className="text-3xl font-heading font-bold text-[var(--color-text-primary)]">Welcome Back</h2>
                  <p className="text-[var(--color-text-secondary)] text-sm">Sign in to book or manage appointments</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="ahmed@example.com"
                    className="w-full glass-input rounded-2xl px-5 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2">
                      <LockKeyhole className="h-3.5 w-3.5" />
                      Password
                    </label>
                    <button
                      onClick={() => navigate("/book/forgot-password")}
                      className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••"
                      className="w-full glass-input rounded-2xl px-5 py-4 pr-16 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-[var(--color-bg-soft)] rounded-xl transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-[var(--color-on-primary)] font-bold rounded-2xl shadow-[var(--shadow-soft)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-[var(--color-on-primary)]/30 border-t-[var(--color-on-primary)] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Secure Login</span>
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => navigate("/book/register")}
                    className="w-full h-14 glass-card border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 text-[var(--color-text-primary)] font-bold rounded-2xl transition-all"
                  >
                    Create Patient Account
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Stethoscope className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                    <span>
                      <button
                        onClick={() => navigate("/book/doctors")}
                        className="text-[var(--color-primary)] font-semibold hover:underline"
                      >
                        Browse doctors
                      </button>{" "}
                      without logging in
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            <Link to="/terms-of-service" className="hover:text-[var(--color-primary)] transition-colors">Terms</Link>
            <div className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
            <Link to="/privacy-policy" className="hover:text-[var(--color-primary)] transition-colors">Privacy</Link>
            <div className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
            <Link to="/contact" className="hover:text-[var(--color-primary)] transition-colors">Support</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
