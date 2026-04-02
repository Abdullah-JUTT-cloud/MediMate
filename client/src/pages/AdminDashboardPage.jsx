import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import VerifiedBadge from "../components/VerifiedBadge";

const VERIFY_STATUS_OPTIONS = ["Pending", "In Review", "Needs Changes", "Verified"];
const ISSUE_STATUS_OPTIONS = ["In Progress", "Resolved", "Closed"];

const isDoctorVerified = (status) => ["Verified", "Approved"].includes(status);
const normalizeStatusLabel = (status) => (status === "Approved" ? "Verified" : status || "Pending");

function StatusPill({ value }) {
  const status = normalizeStatusLabel(value);
  const tone = {
    Pending: "text-amber-300 bg-amber-500/10 border-amber-400/30",
    "In Review": "text-cyan-300 bg-cyan-500/10 border-cyan-400/30",
    "Needs Changes": "text-orange-300 bg-orange-500/10 border-orange-400/30",
    Verified: "text-emerald-300 bg-emerald-500/10 border-emerald-400/30",
    Open: "text-amber-300 bg-amber-500/10 border-amber-400/30",
    "In Progress": "text-blue-300 bg-blue-500/10 border-blue-400/30",
    Resolved: "text-emerald-300 bg-emerald-500/10 border-emerald-400/30",
    Reopened: "text-orange-300 bg-orange-500/10 border-orange-400/30",
    Closed: "text-zinc-300 bg-zinc-500/10 border-zinc-400/30",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone[status] || tone.Pending}`}>
      {status}
    </span>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{value || "-"}</p>
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
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 h-fit">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Admin Panel</p>
          <h1 className="text-lg font-black mt-2 text-[var(--color-text-primary)]">{admin.name || "Admin"}</h1>
          <p className="text-xs mt-1 text-[var(--color-text-secondary)]">{admin.email}</p>

          <div className="mt-5 space-y-2">
            <button
              onClick={() => setActiveSection("doctors")}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold border ${activeSection === "doctors" ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/12 text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"}`}
            >
              Doctors
            </button>
            <button
              onClick={() => setActiveSection("issues")}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold border ${activeSection === "issues" ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/12 text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"}`}
            >
              Issues
            </button>
          </div>

          <button onClick={logout} className="mt-8 w-full rounded-xl px-3 py-2 text-sm font-semibold border border-red-500/30 text-red-400">
            Logout
          </button>
        </aside>

        <main className="space-y-5">
          {activeSection === "doctors" && (
            <>
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Doctor Directory</h2>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Review doctor profiles, verification state, and issue history in one place.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <input
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="Search doctor"
                      className="w-full md:w-64 rounded-xl px-3 py-2 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm"
                    />
                    <button onClick={loadDoctors} className="rounded-xl px-3 py-2 text-sm font-semibold border border-[var(--color-border)]">
                      Search
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <select
                    value={doctorStatusFilter}
                    onChange={(e) => setDoctorStatusFilter(e.target.value)}
                    className="w-full md:w-64 rounded-xl px-3 py-2 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm"
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
                      className={`rounded-xl p-3 border text-left ${selectedDoctorId === d._id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)]"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">{d.fullName}</p>
                        <VerifiedBadge isVerified={isDoctorVerified(d.profileVerificationStatus)} compact />
                      </div>
                      <p className="text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">{d.specialization || "Specialist"}</p>
                      <div className="mt-2"><StatusPill value={d.profileVerificationStatus} /></div>
                    </button>
                  ))}
                  {doctors.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]">No doctors found.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                {!selectedDoctor ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">Select a doctor to view full profile details.</p>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-[var(--color-text-primary)]">{doctorName}</h3>
                          <VerifiedBadge isVerified={isDoctorVerified(selectedDoctor.profileVerificationStatus)} />
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{selectedDoctor.email}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">{selectedDoctor.specialization || "Specialist"}</p>
                      </div>
                      <button
                        onClick={() => openDoctorIssues(selectedDoctor._id)}
                        className="rounded-xl px-3 py-2 text-xs font-semibold border border-[var(--color-primary)]/30 text-[var(--color-primary)]"
                      >
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
                      <div className="rounded-xl border border-[var(--color-border)] p-3 space-y-3">
                        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">Verification Workflow</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill value={selectedDoctor.profileVerificationStatus} />
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            Reviewed by {selectedDoctor.profileVerificationReviewedBy || "-"}
                          </span>
                        </div>
                        <select
                          value={verificationStatus}
                          onChange={(e) => setVerificationStatus(e.target.value)}
                          className="w-full rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm"
                        >
                          {VERIFY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Review notes"
                          rows={3}
                          className="w-full rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm resize-none"
                        />
                        <button onClick={updateVerification} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)]">
                          Update Verification
                        </button>
                      </div>

                      <div className="rounded-xl border border-[var(--color-border)] p-3">
                        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">Doctor Issue History</p>
                        <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {doctorIssueHistory.length === 0 ? (
                            <p className="text-sm text-[var(--color-text-secondary)]">No resolved/closed issues for this doctor.</p>
                          ) : (
                            doctorIssueHistory.map((item) => (
                              <div key={item._id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{item.title}</p>
                                  <StatusPill value={item.status} />
                                </div>
                                <p className="text-xs mt-1 text-[var(--color-text-secondary)]">{item.category}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--color-border)] p-3">
                      <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">Active Issues</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {doctorActiveIssues.length === 0 ? (
                          <p className="text-sm text-[var(--color-text-secondary)]">No active issues for this doctor.</p>
                        ) : (
                          doctorActiveIssues.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => {
                                setActiveSection("issues");
                                setSelectedTicketId(item._id);
                              }}
                              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-left"
                            >
                              <p className="text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">{item.title}</p>
                              <p className="text-[11px] text-[var(--color-text-secondary)]">{normalizeStatusLabel(item.status)}</p>
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
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Issue Inbox</h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Track all issue conversations and keep actions auditable.</p>
                </div>
                <div className="flex gap-2 rounded-xl border border-[var(--color-border)] p-1 bg-[var(--color-bg)]/40">
                  <button
                    onClick={() => setTicketFilter("active")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${ticketFilter === "active" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setTicketFilter("history")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${ticketFilter === "history" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"}`}
                  >
                    History
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-4 space-y-2 max-h-[430px] overflow-y-auto pr-1">
                  {tickets.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">No issues available.</p>
                  ) : (
                    tickets.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => setSelectedTicketId(t._id)}
                        className={`w-full rounded-xl p-3 border text-left ${selectedTicketId === t._id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)]"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{t.title}</p>
                          <StatusPill value={t.status} />
                        </div>
                        <p className="text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">{t.doctor?.fullName || "Doctor"}</p>
                      </button>
                    ))
                  )}
                </div>

                <div className="xl:col-span-8 rounded-xl border border-[var(--color-border)] p-3 flex flex-col min-h-[430px]">
                  {!selectedTicket ? (
                    <p className="m-auto text-sm text-[var(--color-text-secondary)]">Select a ticket to open chat.</p>
                  ) : (
                    <>
                      <div className="border-b border-[var(--color-border)] pb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-[var(--color-text-primary)]">{selectedTicket.title}</h3>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {selectedTicket.doctor?.fullName || "Doctor"} • {selectedTicket.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill value={selectedTicket.status} />
                          {ISSUE_STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              onClick={() => setTicketStatus(status)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-[var(--color-border)]"
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto py-3 space-y-2">
                        {(selectedTicket.messages || []).map((m) => (
                          <div key={m._id || `${m.senderRole}-${m.createdAt}`} className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-3 py-2 border ${m.senderRole === "admin" ? "bg-[var(--color-primary)]/15 border-[var(--color-primary)]/30" : "bg-[var(--color-bg)] border-[var(--color-border)]"}`}>
                              <p className="text-[11px] font-semibold mb-0.5 text-[var(--color-text-secondary)]">{m.senderName}</p>
                              <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-[var(--color-border)] flex gap-2">
                        <input
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          placeholder="Reply to doctor..."
                          className="flex-1 rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm"
                        />
                        <button onClick={sendAdminReply} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)]">
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
