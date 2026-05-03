import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  MessageSquare, 
  User, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Heart,
  Activity,
  Calendar
} from "lucide-react";
import axiosInstance from "../api/axios";
import usePatientAuthStore from "../store/patientAuthStore";
import logo from "../assets/logo-compact.webp";

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const { setPatient } = usePatientAuthStore();
  const [form, setForm] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Username and password are required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/patient-auth/login", form);
      setPatient(res.data?.patient || null);
      toast.success("Welcome back! Entering your portal...");
      navigate("/patient-chat");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--color-bg-gradient)] font-body text-[var(--color-text-primary)] selection:bg-[var(--color-primary)]/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-teal-900/20 blur-[100px] animate-float" />
        
        {/* Subtle Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-10 w-10 glass-card rounded-xl flex items-center justify-center p-1.5 border-emerald-500/20">
            <img src={logo} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-[var(--color-text-primary)]">MedAlerto</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-[var(--color-border)]/50 text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
          <ShieldCheck className="h-3 w-3" />
          Secure Patient Portal
        </div>
      </nav>

      <main className="relative z-10 w-full max-w-lg px-6 pt-20 animate-fade-in">
        <div className="glass-card px-8 md:px-10 pt-6 md:pt-8 pb-10 rounded-[2.5rem] border-[var(--color-border)] shadow-2xl overflow-hidden group relative">
          {/* Subtle glow effect */}
          <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.03)_180deg,transparent_360deg)] animate-spin" style={{ animationDuration: '30s' }} />

          <div className="relative space-y-6">
            <div className="text-center">
              <div className="mx-auto w-[50px] sm:w-[60px] lg:w-[85px] aspect-square glass-card rounded-2xl flex items-center justify-center border-[var(--color-border)] bg-[var(--color-bg-soft)] animate-slide-up mb-2 shadow-sm">
                <img src={logo} alt="MedAlerto" className="h-2/3 w-auto object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]" />
              </div>
              <span className="block font-heading text-base font-bold tracking-[0.2em] text-[var(--color-text-primary)] uppercase animate-slide-up mb-1" style={{ animationDelay: '0.05s' }}>
                MEDALERTO
              </span>
              <div className="h-px w-16 mx-auto bg-[var(--color-border)] mb-2 opacity-60 animate-slide-up" style={{ animationDelay: '0.08s' }} />
              <div className="space-y-1">
                <h1 className="text-3xl font-heading font-extrabold text-[var(--color-text-primary)] animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  Patient Sign In
                </h1>
                <p className="text-[var(--color-text-secondary)] text-sm max-w-[280px] mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  Access your care plan and chat directly with your clinical team.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                  <User className="h-3.5 w-3.5" />
                  Username
                </label>
                <input
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Enter your username"
                  className="w-full glass-input rounded-2xl px-5 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                  <Lock className="h-3.5 w-3.5" />
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Enter secure password"
                  className="w-full glass-input rounded-2xl px-5 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-[var(--color-on-primary)] font-bold rounded-2xl shadow-[var(--shadow-soft)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group animate-slide-up" style={{ animationDelay: '0.5s' }}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-[var(--color-on-primary)]/30 border-t-[var(--color-on-primary)] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Patient Portal</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <Activity className="h-3 w-3" />
                Vitals Tracking
              </div>
              <div className="h-1 w-1 rounded-full bg-[var(--color-border)] self-center" />
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <Calendar className="h-3 w-3" />
                Care Planning
              </div>
              <div className="h-1 w-1 rounded-full bg-[var(--color-border)] self-center" />
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <MessageSquare className="h-3 w-3" />
                Direct Chat
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] animate-fade-in" style={{ animationDelay: '0.8s' }}>
          By signing in you agree to our 
          <Link to="/terms-of-service" className="mx-1 text-[var(--color-primary)] hover:underline transition-colors underline-offset-4">Terms</Link>
          & 
          <Link to="/privacy-policy" className="mx-1 text-[var(--color-primary)] hover:underline transition-colors underline-offset-4">Privacy</Link>
        </p>
      </main>
    </div>
  );
}
