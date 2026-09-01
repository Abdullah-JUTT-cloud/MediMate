import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import useThemedLogo from "../../hooks/useThemedLogo";

const PASSWORD_RULES = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "uppercase", label: "At least 1 uppercase letter" },
  { key: "number", label: "At least 1 number" },
  { key: "special", label: "At least 1 special character" },
];

const evaluatePassword = (password = "") => {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6"];

  return {
    checks,
    score,
    percent: (score / PASSWORD_RULES.length) * 100,
    label: labels[score],
    color: colors[score],
    isValid: score === PASSWORD_RULES.length,
  };
};

export default function PatientRegisterPage() {
  const navigate = useNavigate();
  const logo = useThemedLogo();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!form.password) {
      toast.error("Password is required");
      return;
    }
    const passwordState = evaluatePassword(form.password);
    if (!passwordState.isValid) {
      toast.error("Password must include uppercase, number, special character, and be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/patient-account/register", form);
      toast.success("Account created — check your email for the OTP");
      navigate("/book/verify-email", { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const passwordState = evaluatePassword(form.password);

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[var(--color-bg-gradient)] font-body text-[var(--color-text-primary)] selection:bg-[var(--color-primary)]/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)]/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary)]/20 blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-[var(--color-primary)]/10 blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />

        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
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
          onClick={() => navigate("/book/login")}
          className="px-5 py-2 rounded-full glass-card border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm font-semibold"
        >
          Sign In
        </button>
      </nav>

      <main className="relative z-10 w-full max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Hero Content */}
        <div className="space-y-10 animate-fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Sparkles className="h-4 w-4" />
              Join MedAlerto
            </div>

            <h1 className="text-5xl md:text-7xl font-heading font-extrabold leading-[1.1] text-[var(--color-text-primary)] animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Start your <span className="text-[var(--color-primary)]">healthcare</span> journey.
            </h1>

            <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Create your free account to book appointments with verified doctors, track your health records, and receive timely reminders.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="space-y-3 group">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Verified Doctors</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">Every doctor on our platform is verified and credential-checked.</p>
            </div>
            <div className="space-y-3 group">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-soft)] flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Instant Notifications</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">Get email and SMS reminders for upcoming appointments.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-xl">
                  <img src={`https://i.pravatar.cc/100?img=${i+30}`} alt="User" />
                </div>
              ))}
              <div className="h-10 w-10 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold shadow-xl text-[var(--color-on-primary)]">
                +5k
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium italic">
              Trusted by 5,000+ patients across Pakistan.
            </p>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />

          <div className="relative glass-card p-8 md:p-10 rounded-[2.5rem] border-[var(--color-border)] shadow-[var(--shadow-float)] overflow-hidden group">
            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,var(--color-primary)_180deg,transparent_360deg)] opacity-5 animate-spin" style={{ animationDuration: '20s' }} />

            <div className="relative space-y-6">
              <div className="text-center">
                <div className="mx-auto w-[50px] sm:w-[60px] lg:w-[85px] aspect-square glass-card rounded-2xl flex items-center justify-center border-[var(--color-border)] bg-[var(--color-bg-soft)] mb-2 shadow-sm">
                  <img src={logo} alt="MedAlerto" className="h-2/3 w-auto object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]" />
                </div>
                <span className="block font-heading text-base font-bold tracking-[0.2em] text-[var(--color-text-primary)] uppercase mb-1">
                  PATIENT PORTAL
                </span>
                <div className="h-px w-16 mx-auto bg-[var(--color-border)] mb-4 opacity-60" />

                <div className="space-y-1">
                  <h2 className="text-3xl font-heading font-bold text-[var(--color-text-primary)]">Create Account</h2>
                  <p className="text-[var(--color-text-secondary)] text-sm">Book appointments with verified doctors</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                    <User className="h-3.5 w-3.5" />
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ahmed Ali"
                    className="w-full glass-input rounded-2xl px-5 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                  />
                </div>

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
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="03001234567"
                    className="w-full glass-input rounded-2xl px-5 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
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

                {/* Password Strength */}
                {form.password && (
                  <div className="mx-auto w-full rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-bg-soft)]/50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em]">
                      <span className="text-[var(--color-text-secondary)]">Password strength</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          color: passwordState.color,
                          backgroundColor: `${passwordState.color}22`,
                        }}
                      >
                        {passwordState.label}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${passwordState.percent}%`,
                          backgroundColor: passwordState.color,
                          boxShadow: passwordState.percent > 0 ? `0 0 10px ${passwordState.color}66` : "none",
                        }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = passwordState.checks[rule.key];
                        return (
                          <p
                            key={rule.key}
                            className="text-[11px] font-medium text-center"
                            style={{
                              color: passed ? "var(--color-primary)" : "var(--color-text-secondary)",
                            }}
                          >
                            {passed ? "✓" : "•"} {rule.label}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-[var(--color-on-primary)] font-bold rounded-2xl shadow-[var(--shadow-soft)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-[var(--color-on-primary)]/30 border-t-[var(--color-on-primary)] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  <span>256-bit encryption · HIPAA compliant</span>
                </div>
              </div>
            </div>
          </div>

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
