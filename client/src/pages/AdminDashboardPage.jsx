import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, LifeBuoy, LogOut, Search, Send, ShieldCheck, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import VerifiedBadge from "../components/VerifiedBadge";
import { cyberCardStyle, cyberInputStyle, cyberpunkTheme } from "../styles/cyberpunkTheme";
import "../styles/cyberpunk.css";

const VERIFY_STATUS_OPTIONS = ["Pending", "In Review", "Needs Changes", "Verified"];
const ISSUE_STATUS_OPTIONS = ["In Progress", "Resolved", "Closed"];

const isDoctorVerified = (status) => ["Verified", "Approved"].includes(status);
const normalizeStatusLabel = (status) => (status === "Approved" ? "Verified" : status || "Pending");

function StatusPill({ value }) {
  const status = normalizeStatusLabel(value);
  const tone = {
    Pending: { color: cyberpunkTheme.colors.accentTertiary, bg: "rgba(0,212,255,0.12)", border: "rgba(0,212,255,0.35)" },
    "In Review": { color: cyberpunkTheme.colors.accent, bg: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.35)" },
    "Needs Changes": { color: cyberpunkTheme.colors.accentSecondary, bg: "rgba(255,0,255,0.12)", border: "rgba(255,0,255,0.35)" },
    Verified: { color: cyberpunkTheme.colors.accent, bg: "rgba(0,255,136,0.15)", border: "rgba(0,255,136,0.4)" },
    Open: { color: cyberpunkTheme.colors.accentTertiary, bg: "rgba(0,212,255,0.12)", border: "rgba(0,212,255,0.35)" },
    "In Progress": { color: cyberpunkTheme.colors.accent, bg: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.35)" },
    Resolved: { color: cyberpunkTheme.colors.accent, bg: "rgba(0,255,136,0.15)", border: "rgba(0,255,136,0.4)" },
    Reopened: { color: cyberpunkTheme.colors.accentSecondary, bg: "rgba(255,0,255,0.12)", border: "rgba(255,0,255,0.35)" },
    Closed: { color: "var(--color-text-secondary)", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.3)" },
  };
  const state = tone[status] || tone.Pending;

  return (
    <span className="cyber-label inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ color: state.color, background: state.bg, borderColor: state.border }}>
      {status}
    </span>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div className="cyber-chamfer-sm border p-3" style={{ background: cyberpunkTheme.colors.muted, borderColor: cyberpunkTheme.colors.border }}>
      <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">{label}</p>
      <p className="cyber-text mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{value || "-"}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("doctors");
  const [admin, setAdmin] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [doctors, setDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorStatusFilter, setDoctorStatusFilter] = useState("Pending");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("Pending");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [doctorIssueHistory, setDoctorIssueHistory] = useState([]);
  const [doctorActiveIssues, setDoctorActiveIssues] = useState([]);

  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState("active");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReply, setAdminReply] = useState("");

  const checkAdmin = async () => {
    setIsCheckingAuth(true);
    try {
      const res = await axiosInstance.get("/admin/me");
      setAdmin(res.data?.admin || null);
    } catch {
      navigate("/admin/login", { replace: true });
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (doctorStatusFilter) params.set("status", doctorStatusFilter);
      if (doctorSearch.trim()) params.set("search", doctorSearch.trim());
      const res = await axiosInstance.get(`/admin/doctors?${params.toString()}`);
      const list = Array.isArray(res.data?.doctors) ? res.data.doctors : [];
      setDoctors(list);
      if (!selectedDoctorId && list.length > 0) setSelectedDoctorId(list[0]._id);
      if (selectedDoctorId && !list.some((d) => d._id === selectedDoctorId)) {
        setSelectedDoctorId(list[0]?._id || "");
      }
    } catch {
      toast.error("Failed to load doctors");
    }
  };

  const loadDoctorDetail = async () => {
    if (!selectedDoctorId) {
      setSelectedDoctor(null);
      setDoctorIssueHistory([]);
      setDoctorActiveIssues([]);
      return;
    }

    try {
      const [doctorRes, historyRes, activeRes] = await Promise.all([
        axiosInstance.get(`/admin/doctors/${selectedDoctorId}`),
        axiosInstance.get(`/issues/admin?doctorId=${selectedDoctorId}&history=true&limit=20`),
        axiosInstance.get(`/issues/admin?doctorId=${selectedDoctorId}&history=false&limit=20`),
      ]);

      const d = doctorRes.data?.doctor;
      setSelectedDoctor(d || null);
      setVerificationStatus(normalizeStatusLabel(d?.profileVerificationStatus));
      setVerificationNotes(d?.profileVerificationNotes || "");
      setDoctorIssueHistory(Array.isArray(historyRes.data?.tickets) ? historyRes.data.tickets : []);
      setDoctorActiveIssues(Array.isArray(activeRes.data?.tickets) ? activeRes.data.tickets : []);
    } catch {
      setSelectedDoctor(null);
      setDoctorIssueHistory([]);
      setDoctorActiveIssues([]);
    }
  };

  const updateVerification = async () => {
    if (!selectedDoctor?._id) return;
    try {
      await axiosInstance.patch(`/admin/doctors/${selectedDoctor._id}/verification-status`, {
        status: verificationStatus,
        notes: verificationNotes,
      });
      toast.success("Verification updated");
      await Promise.all([loadDoctors(), loadDoctorDetail()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update verification");
    }
  };

  const loadTickets = async () => {
    try {
      const history = ticketFilter === "history" ? "true" : "false";
      const res = await axiosInstance.get(`/issues/admin?history=${history}&limit=50`);
      const list = Array.isArray(res.data?.tickets) ? res.data.tickets : [];
      setTickets(list);
      if (!selectedTicketId && list.length > 0) setSelectedTicketId(list[0]._id);
      if (selectedTicketId && !list.some((t) => t._id === selectedTicketId)) {
        setSelectedTicketId(list[0]?._id || "");
      }
    } catch {
      toast.error("Failed to load support tickets");
    }
  };

  const loadTicketDetail = async () => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }
    try {
      const res = await axiosInstance.get(`/issues/admin/${selectedTicketId}`);
      setSelectedTicket(res.data?.ticket || null);
    } catch {
      setSelectedTicket(null);
    }
  };

  const sendAdminReply = async () => {
    if (!selectedTicket?._id || !adminReply.trim()) return;
    try {
      await axiosInstance.post(`/issues/admin/${selectedTicket._id}/messages`, { text: adminReply.trim() });
      setAdminReply("");
      await Promise.all([loadTickets(), loadTicketDetail()]);
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const setTicketStatus = async (status) => {
    if (!selectedTicket?._id) return;
    try {
      await axiosInstance.patch(`/issues/admin/${selectedTicket._id}/status`, { status });
      toast.success(`Issue marked ${status}`);
      await Promise.all([loadTickets(), loadTicketDetail()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update issue");
    }
  };

  const openDoctorIssues = (doctorId) => {
    setActiveSection("issues");
    setTicketFilter("active");
    const firstTicket = tickets.find((item) => item.doctor?._id === doctorId);
    if (firstTicket) {
      setSelectedTicketId(firstTicket._id);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/admin/logout");
    } finally {
      navigate("/admin/login", { replace: true });
    }
  };

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!admin) return;
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, doctorStatusFilter]);

  useEffect(() => {
    if (!admin) return;
    loadDoctorDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorId]);

  useEffect(() => {
    if (!admin) return;
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, ticketFilter]);

  useEffect(() => {
    if (!admin) return;
    loadTicketDetail();
    const id = setInterval(loadTicketDetail, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId, admin]);

  const doctorName = useMemo(() => selectedDoctor?.fullName || "Doctor", [selectedDoctor?.fullName]);

  if (isCheckingAuth) {
    return <div className="cyber-shell min-h-screen" />;
  }

  if (!admin) return null;

  return (
    <div className="cyber-shell min-h-screen p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <aside className="cyber-chamfer border p-4 h-fit" style={{ ...cyberCardStyle, boxShadow: cyberpunkTheme.shadows.neonSm }}>
          <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">Admin Panel</p>
          <h1 className="cyber-heading cyber-glitch text-lg font-black mt-2 text-[var(--color-text-primary)]">{admin.name || "Admin"}</h1>
          <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)]">{admin.email}</p>

          <div className="mt-5 space-y-2">
            <button
              onClick={() => setActiveSection("doctors")}
              className="cyber-chamfer-sm w-full px-3 py-2 text-left text-sm font-semibold border inline-flex items-center gap-2"
              style={activeSection === "doctors"
                ? { borderColor: "rgba(0,255,136,0.4)", background: "rgba(0,255,136,0.12)", color: cyberpunkTheme.colors.accent }
                : { borderColor: "transparent", color: "var(--color-text-secondary)", background: "transparent" }}
            >
              <UserCog size={15} />
              Doctors
            </button>
            <button
              onClick={() => setActiveSection("issues")}
              className="cyber-chamfer-sm w-full px-3 py-2 text-left text-sm font-semibold border inline-flex items-center gap-2"
              style={activeSection === "issues"
                ? { borderColor: "rgba(255,0,255,0.4)", background: "rgba(255,0,255,0.12)", color: cyberpunkTheme.colors.accentSecondary }
                : { borderColor: "transparent", color: "var(--color-text-secondary)", background: "transparent" }}
            >
              <LifeBuoy size={15} />
              Issues
            </button>
          </div>

          <button onClick={logout} className="cyber-chamfer-sm mt-8 w-full px-3 py-2 text-sm font-semibold border inline-flex items-center justify-center gap-2" style={{ borderColor: "rgba(255,51,102,0.5)", color: cyberpunkTheme.colors.destructive }}>
            <LogOut size={14} />
            Logout
          </button>
        </aside>

        <main className="space-y-5">
          {activeSection === "doctors" && (
            <>
              <section className="cyber-chamfer border p-4" style={cyberCardStyle}>
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div>
                    <h2 className="cyber-heading text-lg font-bold text-[var(--color-text-primary)]">Doctor Directory</h2>
                    <p className="cyber-text text-xs text-[var(--color-text-secondary)] mt-0.5">Review doctor profiles, verification state, and issue history in one place.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <input
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="Search doctor"
                      className="cyber-text w-full md:w-64 cyber-chamfer-sm pl-9 pr-3 py-2 border text-sm"
                      style={cyberInputStyle}
                    />
                    <button onClick={loadDoctors} className="cyber-chamfer-sm px-3 py-2 text-sm font-semibold border inline-flex items-center gap-1.5" style={{ borderColor: "var(--color-border)", color: cyberpunkTheme.colors.accent }}>
                      <Search size={13} />
                      Search
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <select
                    value={doctorStatusFilter}
                    onChange={(e) => setDoctorStatusFilter(e.target.value)}
                    className="cyber-text w-full md:w-64 cyber-chamfer-sm px-3 py-2 border text-sm"
                    style={cyberInputStyle}
                  >
                    <option value="">All Statuses</option>
                    {VERIFY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {doctors.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => setSelectedDoctorId(d._id)}
                      className="cyber-chamfer-sm p-3 border text-left"
                      style={selectedDoctorId === d._id
                        ? { borderColor: "rgba(0,255,136,0.45)", background: "rgba(0,255,136,0.1)" }
                        : { borderColor: "var(--color-border)", background: "var(--color-card)" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="cyber-text text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">{d.fullName}</p>
                        <VerifiedBadge isVerified={isDoctorVerified(d.profileVerificationStatus)} compact />
                      </div>
                      <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">{d.specialization || "Specialist"}</p>
                      <div className="mt-2"><StatusPill value={d.profileVerificationStatus} /></div>
                    </button>
                  ))}
                  {doctors.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]">No doctors found.</p>}
                </div>
              </section>

              <section className="cyber-chamfer border p-4" style={cyberCardStyle}>
                {!selectedDoctor ? (
                  <p className="cyber-text text-sm text-[var(--color-text-secondary)]">Select a doctor to view full profile details.</p>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="cyber-heading text-xl font-extrabold text-[var(--color-text-primary)]">{doctorName}</h3>
                          <VerifiedBadge isVerified={isDoctorVerified(selectedDoctor.profileVerificationStatus)} />
                        </div>
                        <p className="cyber-text text-sm text-[var(--color-text-secondary)] mt-1">{selectedDoctor.email}</p>
                        <p className="cyber-text text-sm text-[var(--color-text-secondary)]">{selectedDoctor.specialization || "Specialist"}</p>
                      </div>
                      <button
                        onClick={() => openDoctorIssues(selectedDoctor._id)}
                        className="cyber-chamfer-sm px-3 py-2 text-xs font-semibold border inline-flex items-center gap-1.5"
                        style={{ borderColor: "rgba(0,212,255,0.4)", color: cyberpunkTheme.colors.accentTertiary }}
                      >
                        <AlertTriangle size={12} />
                        Open Doctor Issues
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      <ProfileStat label="PMDC Number" value={selectedDoctor.pmdcNumber} />
                      <ProfileStat label="License Status" value={selectedDoctor.licenseStatus} />
                      <ProfileStat label="Phone" value={selectedDoctor.phone} />
                      <ProfileStat label="Experience" value={selectedDoctor.yearsOfExperience ? `${selectedDoctor.yearsOfExperience} years` : "-"} />
                    </div>

                    <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="cyber-chamfer-sm border p-3 space-y-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-soft)" }}>
                        <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">Verification Workflow</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill value={selectedDoctor.profileVerificationStatus} />
                          <span className="cyber-text text-xs text-[var(--color-text-secondary)]">
                            Reviewed by {selectedDoctor.profileVerificationReviewedBy || "-"}
                          </span>
                        </div>
                        <select
                          value={verificationStatus}
                          onChange={(e) => setVerificationStatus(e.target.value)}
                          className="cyber-text w-full cyber-chamfer-sm px-3 py-2.5 border text-sm"
                          style={cyberInputStyle}
                        >
                          {VERIFY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Review notes"
                          rows={3}
                          className="cyber-text w-full cyber-chamfer-sm px-3 py-2.5 border text-sm resize-none"
                          style={cyberInputStyle}
                        />
                        <button onClick={updateVerification} className="cyber-chamfer-sm cyber-heading px-4 py-2.5 text-xs font-semibold" style={{ color: cyberpunkTheme.colors.background, background: cyberpunkTheme.colors.accent, boxShadow: cyberpunkTheme.shadows.neon }}>
                          <ShieldCheck size={12} className="inline mr-1" />
                          Update Verification
                        </button>
                      </div>

                      <div className="cyber-chamfer-sm border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-soft)" }}>
                        <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">Doctor Issue History</p>
                        <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {doctorIssueHistory.length === 0 ? (
                            <p className="cyber-text text-sm text-[var(--color-text-secondary)]">No resolved/closed issues for this doctor.</p>
                          ) : (
                            doctorIssueHistory.map((item) => (
                              <div key={item._id} className="cyber-chamfer-sm border p-2.5" style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="cyber-text text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{item.title}</p>
                                  <StatusPill value={item.status} />
                                </div>
                                <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)]">{item.category}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 cyber-chamfer-sm border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-soft)" }}>
                      <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">Active Issues</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {doctorActiveIssues.length === 0 ? (
                          <p className="cyber-text text-sm text-[var(--color-text-secondary)]">No active issues for this doctor.</p>
                        ) : (
                          doctorActiveIssues.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => {
                                setActiveSection("issues");
                                setSelectedTicketId(item._id);
                              }}
                              className="cyber-chamfer-sm border px-2.5 py-1.5 text-left"
                              style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                            >
                              <p className="cyber-text text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">{item.title}</p>
                              <p className="cyber-text text-[11px] text-[var(--color-text-secondary)]">{normalizeStatusLabel(item.status)}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          )}

          {activeSection === "issues" && (
            <section className="cyber-chamfer border p-4" style={cyberCardStyle}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="cyber-heading text-lg font-bold text-[var(--color-text-primary)]">Issue Inbox</h2>
                  <p className="cyber-text text-xs text-[var(--color-text-secondary)] mt-0.5">Track all issue conversations and keep actions auditable.</p>
                </div>
                <div className="flex gap-2 rounded-full border p-1" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-soft)" }}>
                  <button
                    onClick={() => setTicketFilter("active")}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={ticketFilter === "active" ? { background: "rgba(0,255,136,0.14)", color: cyberpunkTheme.colors.accent } : { color: "var(--color-text-secondary)" }}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setTicketFilter("history")}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={ticketFilter === "history" ? { background: "rgba(255,0,255,0.14)", color: cyberpunkTheme.colors.accentSecondary } : { color: "var(--color-text-secondary)" }}
                  >
                    History
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-4 space-y-2 max-h-[430px] overflow-y-auto pr-1">
                  {tickets.length === 0 ? (
                    <p className="cyber-text text-sm text-[var(--color-text-secondary)]">No issues available.</p>
                  ) : (
                    tickets.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => setSelectedTicketId(t._id)}
                        className="w-full cyber-chamfer-sm p-3 border text-left"
                        style={selectedTicketId === t._id
                          ? { borderColor: "rgba(255,0,255,0.42)", background: "rgba(255,0,255,0.1)" }
                          : { borderColor: "var(--color-border)", background: "var(--color-card)" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="cyber-text text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{t.title}</p>
                          <StatusPill value={t.status} />
                        </div>
                        <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">{t.doctor?.fullName || "Doctor"}</p>
                      </button>
                    ))
                  )}
                </div>

                <div className="xl:col-span-8 cyber-chamfer-sm border p-3 flex flex-col min-h-[430px]" style={{ borderColor: "var(--color-border)", background: cyberpunkTheme.colors.background }}>
                  {!selectedTicket ? (
                    <p className="cyber-text m-auto text-sm text-[var(--color-text-secondary)]">Select a ticket to open chat.</p>
                  ) : (
                    <>
                      <div className="border-b pb-3 flex flex-wrap items-center justify-between gap-2" style={{ borderColor: "var(--color-border)" }}>
                        <div>
                          <h3 className="cyber-heading text-base font-bold text-[var(--color-text-primary)]">{selectedTicket.title}</h3>
                          <p className="cyber-text text-xs text-[var(--color-text-secondary)] inline-flex items-center gap-1">
                            <Building2 size={12} />
                            {selectedTicket.doctor?.fullName || "Doctor"} • {selectedTicket.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill value={selectedTicket.status} />
                          {ISSUE_STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              onClick={() => setTicketStatus(status)}
                              className="cyber-chamfer-sm px-2.5 py-1.5 text-xs font-semibold border"
                              style={{ borderColor: "var(--color-border)", color: cyberpunkTheme.colors.accentTertiary }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto py-3 space-y-2">
                        {(selectedTicket.messages || []).map((m) => (
                          <div key={m._id || `${m.senderRole}-${m.createdAt}`} className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[80%] cyber-chamfer-sm px-3 py-2 border" style={m.senderRole === "admin" ? { background: "rgba(0,255,136,0.12)", borderColor: "rgba(0,255,136,0.35)" } : { background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                              <p className="cyber-text text-[11px] font-semibold mb-0.5 text-[var(--color-text-secondary)]">{m.senderName}</p>
                              <p className="cyber-text text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t flex gap-2" style={{ borderColor: "var(--color-border)" }}>
                        <input
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          placeholder="Reply to doctor..."
                          className="cyber-text flex-1 cyber-chamfer-sm px-3 py-2.5 border text-sm"
                          style={cyberInputStyle}
                        />
                        <button onClick={sendAdminReply} className="cyber-chamfer-sm px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: cyberpunkTheme.colors.background, background: cyberpunkTheme.colors.accent, boxShadow: cyberpunkTheme.shadows.neon }}>
                          <Send size={14} />
                          Send
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
