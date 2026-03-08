import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";
import logo from "../assets/logo.svg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setDoctor } = useAuthStore();

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
      const res = await axiosInstance.post("/auth/login", form);
      const { fullName, email, specialization, clinicName } = res.data;
      setDoctor({ fullName, email, specialization, clinicName });
      toast.success(`Welcome back, ${fullName}!`);
      navigate("/dashboard");
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      // If not verified, redirect to verify page
      if (error.response?.status === 403) {
        toast.error("Please verify your email first");
        navigate("/verify-email", { state: { email: form.email } });
        return;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(135deg, #0f1923 0%, #0d2137 50%, #0a1628 100%)",
      }}
    >
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #10B8A9, transparent)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #10B8A9, transparent)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(16,184,169,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,184,169,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(16,184,169,0.1)" }}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="MediMate"
            className="h-8 w-auto brightness-0 invert"
          />
        </div>
        <button
          onClick={() => navigate("/signup")}
          className="text-sm font-medium transition-colors hover:text-teal-400"
          style={{ color: "#94a3b8" }}
        >
          New here? <span style={{ color: "#10B8A9" }}>Create Account</span>
        </button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl"
              style={{
                background: "rgba(16,184,169,0.1)",
                border: "1px solid rgba(16,184,169,0.25)",
              }}
            >
              🏥
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base" style={{ color: "#94a3b8" }}>
              Sign in to your MediMate dashboard
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl sm:rounded-3xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(16,184,169,0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label
                  className="block text-xs sm:text-sm font-medium mb-1.5"
                  style={{ color: "#94a3b8" }}
                >
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="doctor@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                  onFocus={(e) => (e.target.style.border = "1px solid #10B8A9")}
                  onBlur={(e) =>
                    (e.target.style.border = "1px solid rgba(255,255,255,0.1)")
                  }
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-xs sm:text-sm font-medium"
                    style={{ color: "#94a3b8" }}
                  >
                    Password
                  </label>
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs transition-colors hover:text-teal-300"
                    style={{ color: "#10B8A9" }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                    onFocus={(e) =>
                      (e.target.style.border = "1px solid #10B8A9")
                    }
                    onBlur={(e) =>
                      (e.target.style.border =
                        "1px solid rgba(255,255,255,0.1)")
                    }
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors hover:text-teal-400"
                    style={{ color: "#64748b" }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full mt-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #10B8A9, #0d9488)",
                boxShadow: "0 4px 15px rgba(16,184,169,0.3)",
              }}
            >
              {isLoading ? "Signing In..." : "Sign In →"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <span className="text-xs" style={{ color: "#475569" }}>
                or
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>

            {/* Create account */}
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: "rgba(16,184,169,0.05)",
                border: "1px solid rgba(16,184,169,0.2)",
                color: "#10B8A9",
              }}
            >
              Create New Account
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-6" style={{ color: "#475569" }}>
            By signing in you agree to our{" "}
            <a
              href="#"
              className="hover:text-teal-400 transition-colors"
              style={{ color: "#10B8A9" }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="hover:text-teal-400 transition-colors"
              style={{ color: "#10B8A9" }}
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
