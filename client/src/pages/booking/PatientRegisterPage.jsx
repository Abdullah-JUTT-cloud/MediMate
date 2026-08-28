import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import usePatientAccountStore from "../../store/patientAccountStore";

export default function PatientRegisterPage() {
  const navigate = useNavigate();
  const setPatient = usePatientAccountStore((s) => s.setPatient);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/patient-account/register", form);
      toast.success("Account created — check your email for the OTP");
      navigate("/book/verify-email", { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-indigo-100 dark:border-zinc-700">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Create Account</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">Book appointments with verified doctors</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handle}
              required
              placeholder="Ahmed Ali"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              required
              placeholder="ahmed@example.com"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handle}
              required
              placeholder="03001234567"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              required
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link to="/book/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
