import { useState } from "react";
import { 
  ShieldAlert, 
  Mail, 
  Fingerprint, 
  ArrowRight, 
  ShieldCheck, 
  LayoutDashboard,
  Cpu,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useThemedLogo from "../hooks/useThemedLogo";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const logo = useThemedLogo();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    if (!form.email.trim() || !form.password) {
      toast.error("Email and password are required");
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post("/admin/login", form);
      toast.success("Identity verified. Accessing Command Center...");
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[var(--color-bg-gradient)] font-body text-[var(--color-text-primary)] selection:bg-[var(--color-primary)]/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-900/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-teal-900/20 blur-[120px] animate-float" />
        
        {/* Subtle Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 w-full max-w-lg px-6 animate-fade-in">
        <div className="glass-card px-8 md:px-10 pt-6 md:pt-8 pb-10 rounded-[2.5rem] border-[var(--color-border)] shadow-2xl overflow-hidden group relative">
          {/* Internal scanner effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)]/50 to-transparent animate-pulse" />
          
          <div className="relative space-y-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-[50px] sm:w-[60px] lg:w-[85px] aspect-square glass-card rounded-2xl flex items-center justify-center border-[var(--color-border)] bg-[var(--color-bg-soft)] shadow-sm">
                  <img src={logo} alt="MedAlerto" className="h-2/3 w-auto object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]" />
                </div>
                <div className="px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                  Restricted Node
                </div>
              </div>
              <div className="space-y-0">
                <span className="block font-heading text-base font-bold tracking-[0.2em] text-[var(--color-text-primary)] uppercase mb-1">
                  MEDALERTO
                </span>
                <div className="h-px w-16 bg-[var(--color-border)] mb-2 opacity-60" />
                <div className="space-y-1">
                  <h1 className="text-3xl font-heading font-extrabold text-[var(--color-text-primary)]">
                    Command Center
                  </h1>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    Authentication required for administrative access to the clinical infrastructure.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                  <Mail className="h-3.5 w-3.5" />
                  Admin Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="admin@medalerto.com"
                  className="w-full glass-input rounded-2xl px-5 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2 ml-1">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Access Key
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full glass-input rounded-2xl px-5 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <button
                onClick={submit}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-[var(--color-on-primary)] font-bold rounded-2xl shadow-[var(--shadow-soft)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group animate-slide-up" style={{ animationDelay: '0.4s' }}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-[var(--color-on-primary)]/30 border-t-[var(--color-on-primary)] rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    <span>Authorize Identity</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="p-4 rounded-2xl glass-card border-[var(--color-border)]/50 space-y-2 group hover:border-[var(--color-primary)]/30 transition-all cursor-default">
                <Cpu className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">System State</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  <span className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest">Optimal</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl glass-card border-[var(--color-border)]/50 space-y-2 group hover:border-[var(--color-primary)]/30 transition-all cursor-default">
                <Lock className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Security</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest">TLS 1.3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-3 w-3" />
            V4.2.1-PRO
          </div>
          <div className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <span>Restricted to Authorized Personnel Only</span>
        </div>
      </main>
    </div>
  );
}
