import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import useAuthStore from "../store/authStore";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SettingsPage() {
  const { doctor, setDoctor } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // ─── Profile State ───────────────────────────────────────
  const [profile, setProfile] = useState({
    fullName: "",
    phoneNumber: "",
    specialization: "",
    clinicName: "",
    clinicAddress: "",
    slotDuration: 20,
  });

  // ─── Working Hours State ─────────────────────────────────
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((day) => ({ day, isWorking: false, timeRanges: [] }))
  );

  // ─── Fetch Profile on Mount ──────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setIsFetching(true);
      try {
        const res = await axiosInstance.get("/doctor/profile");
        const d = res.data.doctor || res.data;
        setProfile({
          fullName: d.fullName || "",
          phoneNumber: d.phoneNumber || "",
          specialization: d.specialization || "",
          clinicName: d.clinicName || "",
          clinicAddress: d.clinicAddress || "",
          slotDuration: d.slotDuration || 20,
        });
        if (d.workingHours && d.workingHours.length > 0) {
          const merged = DAYS.map((day) => {
            const found = d.workingHours.find((w) => w.day === day);
            return found || { day, isWorking: false, timeRanges: [] };
          });
          setWorkingHours(merged);
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  // ─── Profile Handlers ────────────────────────────────────
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    if (!profile.fullName.trim()) { toast.error("Full name is required"); return; }
    if (!profile.specialization.trim()) { toast.error("Specialization is required"); return; }
    if (!profile.clinicName.trim()) { toast.error("Clinic name is required"); return; }

    setIsLoading(true);
    try {
      const res = await axiosInstance.put("/doctor/update-profile", profile);
      const updated = res.data.doctor || res.data;
      setDoctor({ ...doctor, ...updated });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Working Hours Handlers ──────────────────────────────
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

  const handleWorkingHoursSave = async () => {
    const workingDays = workingHours.filter((d) => d.isWorking);
    if (workingDays.length === 0) { toast.error("Please set at least one working day"); return; }
    for (const day of workingDays) {
      if (day.timeRanges.length === 0) { toast.error(`Add time ranges for ${day.day}`); return; }
      for (const range of day.timeRanges) {
        if (!range.startTime || !range.endTime) { toast.error(`Complete time ranges for ${day.day}`); return; }
        if (range.startTime >= range.endTime) { toast.error(`Start time must be before end time for ${day.day}`); return; }
      }
    }
    setIsLoading(true);
    try {
      await axiosInstance.put("/doctor/update-profile", { workingHours });
      toast.success("Working hours updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update working hours");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Shared input style ──────────────────────────────────
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
  };
  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const onFocus = (e) => (e.target.style.border = "1px solid #10B8A9");
  const onBlur = (e) => (e.target.style.border = "1px solid rgba(255,255,255,0.1)");

  if (isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: "#10B8A9", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#64748b" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1">Settings</h1>
        <p className="text-sm" style={{ color: "#64748b" }}>Manage your profile and clinic schedule</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 sm:mb-8 w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { key: "profile", label: "👤 Profile" },
          { key: "hours", label: "🕐 Working Hours" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
            style={{
              background: activeTab === tab.key ? "linear-gradient(135deg, #10B8A9, #0d9488)" : "transparent",
              color: activeTab === tab.key ? "white" : "#64748b",
              boxShadow: activeTab === tab.key ? "0 4px 15px rgba(16,184,169,0.3)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === "profile" && (
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Avatar section */}
          <div className="flex items-center gap-4 mb-8 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)" }}
            >
              {profile.fullName?.charAt(0) || "D"}
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-white">{profile.fullName || "Your Name"}</p>
              <p className="text-sm mb-2" style={{ color: "#10B8A9" }}>{profile.specialization || "Specialization"}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Profile photo coming soon (Cloudinary)</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Full Name</label>
              <input name="fullName" value={profile.fullName} onChange={handleProfileChange}
                placeholder="Dr. Ahmed Khan" className={inputClass} style={inputStyle}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Phone Number</label>
              <input name="phoneNumber" value={profile.phoneNumber} onChange={handleProfileChange}
                placeholder="03001234567" className={inputClass} style={inputStyle}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Specialization</label>
              <input name="specialization" value={profile.specialization} onChange={handleProfileChange}
                placeholder="e.g. Cardiologist" className={inputClass} style={inputStyle}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Clinic Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Clinic Name</label>
              <input name="clinicName" value={profile.clinicName} onChange={handleProfileChange}
                placeholder="Ahmed Medical Clinic" className={inputClass} style={inputStyle}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Clinic Address */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Clinic Address</label>
              <input name="clinicAddress" value={profile.clinicAddress} onChange={handleProfileChange}
                placeholder="123 Main Street, Lahore" className={inputClass} style={inputStyle}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Slot Duration */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                Appointment Slot Duration
              </label>
              <div className="flex gap-2 flex-wrap">
                {[10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setProfile({ ...profile, slotDuration: mins })}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                    style={{
                      background: profile.slotDuration === mins ? "linear-gradient(135deg, #10B8A9, #0d9488)" : "rgba(255,255,255,0.05)",
                      color: profile.slotDuration === mins ? "white" : "#64748b",
                      border: profile.slotDuration === mins ? "none" : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: profile.slotDuration === mins ? "0 4px 12px rgba(16,184,169,0.3)" : "none",
                    }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleProfileSave}
            disabled={isLoading}
            className="w-full mt-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.3)" }}
          >
            {isLoading ? "Saving..." : "Save Profile ✓"}
          </button>
        </div>
      )}

      {/* ── WORKING HOURS TAB ── */}
      {activeTab === "hours" && (
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>

          <p className="text-xs sm:text-sm mb-6" style={{ color: "#64748b" }}>
            Toggle working days and set your available time ranges. You can add multiple sessions per day (e.g. morning + evening).
          </p>

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
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-24" style={{ color: dayObj.isWorking ? "#10B8A9" : "#64748b" }}>
                      {dayObj.day}
                    </span>
                    {dayObj.isWorking && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,184,169,0.1)", color: "#10B8A9" }}>
                        {dayObj.timeRanges.length} session{dayObj.timeRanges.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleDay(dayIndex)}
                    className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none flex-shrink-0"
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
                  <div className="space-y-2 mt-3">
                    {dayObj.timeRanges.map((range, rangeIndex) => (
                      <div key={rangeIndex} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={range.startTime}
                          onChange={(e) => updateTimeRange(dayIndex, rangeIndex, "startTime", e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                        />
                        <span className="text-xs flex-shrink-0" style={{ color: "#64748b" }}>to</span>
                        <input
                          type="time"
                          value={range.endTime}
                          onChange={(e) => updateTimeRange(dayIndex, rangeIndex, "endTime", e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                        />
                        <button
                          onClick={() => removeTimeRange(dayIndex, rangeIndex)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-red-500 flex-shrink-0"
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

          {/* Save button */}
          <button
            onClick={handleWorkingHoursSave}
            disabled={isLoading}
            className="w-full mt-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #10B8A9, #0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.3)" }}
          >
            {isLoading ? "Saving..." : "Save Working Hours ✓"}
          </button>
        </div>
      )}
    </div>
  );
}