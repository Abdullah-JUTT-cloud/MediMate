import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import logo from "../assets/logo.svg";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultWorkingHours = DAYS.map((day) => ({
  day,
  isWorking: false,
  timeRanges: [],
}));

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 - Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  // Step 2 - Professional Info
  const [professionalInfo, setProfessionalInfo] = useState({
    specialization: "",
    clinicName: "",
    clinicAddress: "",
    licenseNumber: "",
  });

  // Step 3 - Working Hours
  const [workingHours, setWorkingHours] = useState(defaultWorkingHours);

  // ─── Handlers ───────────────────────────────────────────

  const handlePersonalChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleProfessionalChange = (e) => {
    setProfessionalInfo({ ...professionalInfo, [e.target.name]: e.target.value });
  };

  const toggleDay = (index) => {
    const updated = [...workingHours];
    updated[index].isWorking = !updated[index].isWorking;
    if (!updated[index].isWorking) updated[index].timeRanges = [];
    setWorkingHours(updated);
  };

  const addTimeRange = (dayIndex) => {
    const updated = [...workingHours];
    updated[dayIndex].timeRanges.push({ startTime: "", endTime: "" });
    setWorkingHours(updated);
  };

  const removeTimeRange = (dayIndex, rangeIndex) => {
    const updated = [...workingHours];
    updated[dayIndex].timeRanges.splice(rangeIndex, 1);
    setWorkingHours(updated);
  };

  const updateTimeRange = (dayIndex, rangeIndex, field, value) => {
    const updated = [...workingHours];
    updated[dayIndex].timeRanges[rangeIndex][field] = value;
    setWorkingHours(updated);
  };

  // ─── Validations ─────────────────────────────────────────

 const validateStep1 = () => {
  const { fullName, email, phoneNumber, password, confirmPassword } = personalInfo;
  if (!fullName.trim()) { toast.error("Full name is required"); return false; }
  if (!email.trim()) { toast.error("Email is required"); return false; }
  if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Enter a valid email"); return false; }
  if (!phoneNumber.trim()) { toast.error("Phone number is required"); return false; }
  if (!password) { toast.error("Password is required"); return false; }
  if (password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
  if (password !== confirmPassword) { toast.error("Passwords do not match"); return false; }
  return true;
};

  const validateStep2 = () => {
    const { specialization, clinicName, clinicAddress, licenseNumber } = professionalInfo;
    if (!specialization.trim()) { toast.error("Specialization is required"); return false; }
    if (!clinicName.trim()) { toast.error("Clinic name is required"); return false; }
    if (!clinicAddress.trim()) { toast.error("Clinic address is required"); return false; }
    if (!licenseNumber.trim()) { toast.error("License number is required"); return false; }
    return true;
  };

  const validateStep3 = () => {
    const workingDays = workingHours.filter((d) => d.isWorking);
    if (workingDays.length === 0) { toast.error("Please set at least one working day"); return false; }
    for (const day of workingDays) {
      if (day.timeRanges.length === 0) { toast.error(`Please add time ranges for ${day.day}`); return false; }
      for (const range of day.timeRanges) {
        if (!range.startTime || !range.endTime) { toast.error(`Please complete time ranges for ${day.day}`); return false; }
        if (range.startTime >= range.endTime) { toast.error(`Start time must be before end time for ${day.day}`); return false; }
      }
    }
    return true;
  };

  // ─── Step Navigation ─────────────────────────────────────

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  // ─── Submit ──────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        ...personalInfo,
        ...professionalInfo,
        workingHours,
      });
      toast.success("Account created! Please verify your email.");
      navigate("/verify-email", { state: { email: personalInfo.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── UI Helpers ──────────────────────────────────────────

  const steps = [
    { number: 1, label: "Personal Info" },
    { number: 2, label: "Professional Info" },
    { number: 3, label: "Working Hours" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0f1923 0%, #0d2137 50%, #0a1628 100%)" }}>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10B8A9, transparent)", filter: "blur(60px)" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10B8A9, transparent)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(rgba(16,184,169,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,184,169,0.3) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(16,184,169,0.1)" }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="MediMate" className="h-8 w-auto brightness-0 invert" />
        </div>
        <button onClick={() => navigate("/login")} className="text-sm font-medium transition-colors hover:text-teal-400" style={{ color: "#94a3b8" }}>
          Already have an account? <span style={{ color: "#10B8A9" }}>Login</span>
        </button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Create Your Account</h1>
            <p className="text-sm sm:text-base" style={{ color: "#94a3b8" }}>Join MediMate and modernize your clinic today</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            {/* Step circles */}
            <div className="flex items-center justify-center mb-3">
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300"
                      style={{
                        background: step >= s.number ? "linear-gradient(135deg, #10B8A9, #0d9488)" : "rgba(255,255,255,0.05)",
                        border: step >= s.number ? "none" : "1.5px solid rgba(255,255,255,0.1)",
                        color: step >= s.number ? "white" : "#64748b",
                        boxShadow: step === s.number ? "0 0 20px rgba(16,184,169,0.4)" : "none",
                      }}
                    >
                      {step > s.number ? "✓" : s.number}
                    </div>
                    <span className="text-xs mt-1.5 font-medium hidden sm:block" style={{ color: step >= s.number ? "#10B8A9" : "#64748b" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-16 sm:w-24 h-0.5 mx-1 sm:mx-2 mb-4 sm:mb-5 transition-all duration-500" style={{ background: step > s.number ? "#10B8A9" : "rgba(255,255,255,0.1)" }} />
                  )}
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%`, background: "linear-gradient(90deg, #10B8A9, #34d8cd)" }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,184,169,0.15)", backdropFilter: "blur(12px)" }}>

            {/* ── STEP 1 - Personal Info ── */}
            {step === 1 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Personal Information</h2>
                <p className="text-xs sm:text-sm mb-6" style={{ color: "#64748b" }}>Tell us about yourself</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Full Name</label>
                    <input
                      name="fullName"
                      value={personalInfo.fullName}
                      onChange={handlePersonalChange}
                      placeholder="Dr. Ahmed Khan"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Email Address</label>
                    <input
                      name="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={handlePersonalChange}
                      placeholder="doctor@example.com"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Phone Number</label>
                    <input
                      name="phoneNumber"
                      value={personalInfo.phoneNumber}
                      onChange={handlePersonalChange}
                      placeholder="03001234567"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Password</label>
                      <input
                        name="password"
                        type="password"
                        value={personalInfo.password}
                        onChange={handlePersonalChange}
                        placeholder="Min 8 characters"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                        onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                        onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Confirm Password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        value={personalInfo.confirmPassword}
                        onChange={handlePersonalChange}
                        placeholder="Repeat password"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                        onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                        onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2 - Professional Info ── */}
            {step === 2 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Professional Information</h2>
                <p className="text-xs sm:text-sm mb-6" style={{ color: "#64748b" }}>Tell us about your practice</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Specialization</label>
                    <input
                      name="specialization"
                      value={professionalInfo.specialization}
                      onChange={handleProfessionalChange}
                      placeholder="e.g. Cardiologist, General Physician"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Clinic Name</label>
                    <input
                      name="clinicName"
                      value={professionalInfo.clinicName}
                      onChange={handleProfessionalChange}
                      placeholder="Ahmed Medical Clinic"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Clinic Address</label>
                    <input
                      name="clinicAddress"
                      value={professionalInfo.clinicAddress}
                      onChange={handleProfessionalChange}
                      placeholder="123 Main Street, Lahore, Pakistan"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>License Number</label>
                    <input
                      name="licenseNumber"
                      value={professionalInfo.licenseNumber}
                      onChange={handleProfessionalChange}
                      placeholder="LIC123456"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      onFocus={e => e.target.style.border = "1px solid #10B8A9"}
                      onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3 - Working Hours ── */}
            {step === 3 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Working Hours</h2>
                <p className="text-xs sm:text-sm mb-6" style={{ color: "#64748b" }}>Set your clinic's working schedule</p>

                <div className="space-y-3">
                  {workingHours.map((dayObj, dayIndex) => (
                    <div
                      key={dayObj.day}
                      className="rounded-xl p-4 transition-all duration-300"
                      style={{
                        background: dayObj.isWorking ? "rgba(16,184,169,0.05)" : "rgba(255,255,255,0.02)",
                        border: dayObj.isWorking ? "1px solid rgba(16,184,169,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Day header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold" style={{ color: dayObj.isWorking ? "#10B8A9" : "#64748b" }}>
                          {dayObj.day}
                        </span>
                        {/* Toggle */}
                        <button
                          onClick={() => toggleDay(dayIndex)}
                          className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none"
                          style={{ background: dayObj.isWorking ? "#10B8A9" : "rgba(255,255,255,0.1)" }}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
                            style={{ transform: dayObj.isWorking ? "translateX(20px)" : "translateX(0)" }}
                          />
                        </button>
                      </div>

                      {/* Time ranges */}
                      {dayObj.isWorking && (
                        <div className="space-y-2">
                          {dayObj.timeRanges.map((range, rangeIndex) => (
                            <div key={rangeIndex} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={range.startTime}
                                onChange={(e) => updateTimeRange(dayIndex, rangeIndex, "startTime", e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm outline-none"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                              />
                              <span className="text-xs" style={{ color: "#64748b" }}>to</span>
                              <input
                                type="time"
                                value={range.endTime}
                                onChange={(e) => updateTimeRange(dayIndex, rangeIndex, "endTime", e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm outline-none"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                              />
                              <button
                                onClick={() => removeTimeRange(dayIndex, rangeIndex)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-red-500"
                                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addTimeRange(dayIndex)}
                            className="text-xs font-medium flex items-center gap-1 mt-1 transition-colors hover:text-teal-300"
                            style={{ color: "#10B8A9" }}
                          >
                            + Add Time Range
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  ← Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.3)" }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.3)" }}
                >
                  {isLoading ? "Creating Account..." : "Create Account 🎉"}
                </button>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-6" style={{ color: "#475569" }}>
            By creating an account you agree to our{" "}
            <a href="#" className="hover:text-teal-400 transition-colors" style={{ color: "#10B8A9" }}>Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="hover:text-teal-400 transition-colors" style={{ color: "#10B8A9" }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}