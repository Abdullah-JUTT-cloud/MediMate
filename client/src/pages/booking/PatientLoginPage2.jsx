import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import usePatientAccountStore from "../../store/patientAccountStore";

export default function PatientLoginPage2() {
  const navigate = useNavigate();
  const location = useLocation();
  const setPatient = usePatientAccountStore((s) => s.setPatient);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/patient-account/login", form);
      setPatient(data.patient);
      toast.success("Welcome back!");
      // Return to the page the patient was coming from (e.g. a doctor
      // profile that required sign-in); default to the dashboard.
      const from = location.state?.from;
      navigate(from && from.startsWith("/book/") ? from : "/book/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-indigo-100 dark:border-zinc-700">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Patient Login</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">Sign in to book or manage appointments</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link to="/book/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/book/doctors" className="text-zinc-400 hover:text-indigo-500 text-xs">
            Browse doctors without logging in →
          </Link>
        </p>
      </div>
    </div>
  );
}
