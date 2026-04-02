import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-md rounded-2xl border bg-[var(--color-card)] border-[var(--color-border)] p-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Admin Login</h1>
        <p className="text-sm mt-1 text-[var(--color-text-secondary)]">Use your env admin credentials.</p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="admin@email.com"
            className="w-full rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)]"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Password"
            className="w-full rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)]"
          />
          <button
            onClick={submit}
            disabled={isLoading}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
