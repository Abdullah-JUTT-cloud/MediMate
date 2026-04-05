import { useState } from "react";
import { Cpu, Fingerprint, Mail, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import { cyberCardStyle, cyberInputStyle, cyberpunkTheme } from "../styles/cyberpunkTheme";
import "../styles/cyberpunk.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();
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
      toast.success("Admin login successful");
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cyber-shell min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-md cyber-chamfer border p-6" style={{ ...cyberCardStyle, boxShadow: cyberpunkTheme.shadows.neonSm }}>
        <div className="pointer-events-none absolute right-3 top-3 opacity-70" style={{ color: cyberpunkTheme.colors.accent }}>
          <Cpu size={18} />
        </div>

        <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">Restricted Node</p>
        <h1 className="cyber-heading cyber-glitch mt-2 text-3xl font-black text-[var(--color-text-primary)]">Admin Login</h1>
        <p className="cyber-text text-sm mt-1 text-[var(--color-text-secondary)]">Use your environment admin credentials.</p>

        <div className="mt-5 space-y-3">
          <label className="relative block">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: cyberpunkTheme.colors.accent }} />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="> admin@email.com"
              className="cyber-text w-full cyber-chamfer-sm pl-8 pr-3 py-2.5 border text-sm outline-none focus:ring-2"
              style={{ ...cyberInputStyle, boxShadow: cyberpunkTheme.shadows.neonSm, borderColor: cyberpunkTheme.colors.border }}
            />
          </label>
          <label className="relative block">
            <Fingerprint size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: cyberpunkTheme.colors.accentSecondary }} />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="> Password"
              className="cyber-text w-full cyber-chamfer-sm pl-8 pr-3 py-2.5 border text-sm outline-none focus:ring-2"
              style={{ ...cyberInputStyle, boxShadow: cyberpunkTheme.shadows.neonSm, borderColor: cyberpunkTheme.colors.border }}
            />
          </label>
          <button
            onClick={submit}
            disabled={isLoading}
            className="cyber-heading w-full cyber-chamfer-sm px-4 py-2.5 text-sm font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{ background: cyberpunkTheme.colors.accent, color: cyberpunkTheme.colors.background, boxShadow: cyberpunkTheme.shadows.neon }}
          >
            <Shield size={14} />
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
