import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
      toast.success("Welcome to patient chat");
      navigate("/patient-chat");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10 text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg flex-col justify-center rounded-[2rem] border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.2)] sm:p-8">
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
            <img
              src={logo}
              alt="MedAlerto"
              className="h-full w-full object-contain p-1"
            />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-text-primary)]">
              MedAlerto
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
              Patient Portal
            </p>
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">
          Patient Portal
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          Sign in to chat with your doctor
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Use the username and temporary password sent on WhatsApp.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
              Username
            </label>
            <input
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              placeholder="patientname0001"
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="6-digit password"
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-bold text-[var(--color-on-primary)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
