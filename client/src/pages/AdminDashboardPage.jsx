/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  FileText,
  LifeBuoy,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserCog,
  X,
  XCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

const navItems = [
  { key: "doctors", label: "Doctor Directory", path: "/admin/doctors", icon: UserCog },
  { key: "subscriptions", label: "Subscriptions", path: "/admin/subscriptions", icon: ShieldCheck },
  { key: "tickets", label: "Support Tickets", path: "/admin/tickets", icon: LifeBuoy },
];

const doctorStatusOptions = ["", "Pending", "In Review", "Needs Changes", "Verified"];
const subscriptionStatusOptions = ["TRIAL", "ACTIVE", "MONTHLY", "YEARLY", "PENDING_VERIFICATION", "BLOCKED", "INACTIVE"];
const ticketStatusOptions = ["In Progress", "Resolved", "Closed"];

const sectionFromPath = (pathname) => {
  if (pathname.includes("/subscriptions")) return "subscriptions";
  if (pathname.includes("/tickets")) return "tickets";
  return "doctors";
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

const normalizeDoctorStatus = (doctor) =>
  doctor?.verificationStatus === "APPROVED" || ["Verified", "Approved"].includes(doctor?.profileVerificationStatus)
    ? "Approved"
    : doctor?.verificationStatus === "REJECTED" || doctor?.profileVerificationStatus === "Needs Changes"
      ? "Rejected"
      : "Pending";

const badgeClass = (status) => {
  const value = String(status || "").toLowerCase();
  if (["approved", "active", "verified", "resolved"].some((token) => value.includes(token))) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["rejected", "inactive", "closed", "needs changes"].some((token) => value.includes(token))) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
};

function StatusBadge({ status }) {
  return (
    <span className={cx("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", badgeClass(status))}>
      {status || "Pending"}
    </span>
  );
}

function EmptyState({ title, detail }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function Avatar({ doctor, size = "md" }) {
  const name = doctor?.fullName || doctor?.doctorName || "Doctor";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const src = doctor?.profilePicUrl || doctor?.profilePicture || doctor?.doctorId?.profilePicUrl || doctor?.doctorId?.profilePicture;
  const dimensions = size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";

  if (src) {
    return <img src={src} alt={name} className={cx(dimensions, "rounded-full border border-slate-200 object-cover")} />;
  }

  return (
    <div className={cx(dimensions, "flex shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-700 ring-1 ring-teal-100")}>
      {initials || "DR"}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = sectionFromPath(location.pathname);

  const [admin, setAdmin] = useState(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorStatusFilter, setDoctorStatusFilter] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState("active");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketFiles, setTicketFiles] = useState([]);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const selectedTicketMessages = useMemo(
    () => (Array.isArray(selectedTicket?.messages) ? selectedTicket.messages : []),
    [selectedTicket],
  );

  const pendingProofCount = paymentProofs.filter((proof) => proof.status === "PENDING").length;
  const openTicketCount = tickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status)).length;

  const checkAdmin = async () => {
    try {
      const res = await axiosInstance.get("/admin/me");
      setAdmin(res.data?.admin || null);
    } catch {
      navigate("/admin/login", { replace: true });
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  const loadDoctors = async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (doctorSearch.trim()) params.set("search", doctorSearch.trim());
    if (doctorStatusFilter) params.set("status", doctorStatusFilter);

    try {
      const res = await axiosInstance.get(`/admin/doctors?${params.toString()}`);
      setDoctors(Array.isArray(res.data?.doctors) ? res.data.doctors : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load doctors");
    }
  };

  const loadDoctorDetail = async (doctorId) => {
    if (!doctorId) return;
    try {
      const res = await axiosInstance.get(`/admin/doctors/${doctorId}`);
      setSelectedDoctor(res.data?.doctor || null);
      setDoctorNotes(res.data?.doctor?.profileVerificationNotes || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load doctor profile");
    }
  };

  const updateDoctorVerification = async (doctorId, action) => {
    const isReject = action === "REJECTED";
    const reason = isReject
      ? window.prompt("Enter rejection reason for this doctor:", doctorNotes || "Credentials require correction.")
      : doctorNotes;
    if (isReject && reason === null) return;

    try {
      await axiosInstance.patch(`/admin/doctors/${doctorId}/verification-status`, {
        status: action,
        notes: String(reason || "").trim(),
      });
      toast.success(isReject ? "Doctor rejected" : "Doctor approved");
      await Promise.all([loadDoctors(), loadDoctorDetail(doctorId)]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update doctor verification");
    }
  };

  const updateDoctorSubscription = async (doctorId, status) => {
    try {
      await axiosInstance.patch(`/admin/doctors/${doctorId}/subscription-status`, { status });
      toast.success(`Subscription set to ${status}`);
      await Promise.all([loadDoctors(), loadDoctorDetail(doctorId)]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update subscription");
    }
  };

  const loadPaymentProofs = async () => {
    try {
      const res = await axiosInstance.get("/subscriptions/proofs");
      setPaymentProofs(Array.isArray(res.data?.proofs) ? res.data.proofs : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load subscription proofs");
    }
  };

  const approveSubscriptionProof = async (proofId) => {
    try {
      await axiosInstance.patch(`/subscriptions/proofs/${proofId}/approve`);
      toast.success("Payment approved and subscription activated");
      loadPaymentProofs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve payment");
    }
  };

  const rejectSubscriptionProof = async (proofId) => {
    const reason = window.prompt("Enter rejection reason:", "Payment details did not match the transfer receipt.");
    if (reason === null) return;

    try {
      await axiosInstance.patch(`/subscriptions/proofs/${proofId}/reject`, { reason });
      toast.success("Payment rejected");
      loadPaymentProofs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject payment");
    }
  };

  const loadTickets = async () => {
    const history = ticketFilter === "history" ? "true" : "false";
    try {
      const res = await axiosInstance.get(`/issues/admin?history=${history}&limit=100`);
      setTickets(Array.isArray(res.data?.tickets) ? res.data.tickets : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load support tickets");
    }
  };

  const loadTicketDetail = async (ticketId) => {
    if (!ticketId) return;
    try {
      const res = await axiosInstance.get(`/issues/admin/${ticketId}`);
      setSelectedTicket(res.data?.ticket || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load support ticket");
    }
  };

  const updateTicketStatus = async (status) => {
    if (!selectedTicket?._id) return;
    try {
      await axiosInstance.patch(`/issues/admin/${selectedTicket._id}/status`, { status });
      toast.success(`Ticket marked ${status}`);
      await Promise.all([loadTickets(), loadTicketDetail(selectedTicket._id)]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update ticket");
    }
  };

  const sendTicketReply = async () => {
    if (!selectedTicket?._id || (!ticketReply.trim() && ticketFiles.length === 0)) return;
    const formData = new FormData();
    if (ticketReply.trim()) formData.append("text", ticketReply.trim());
    ticketFiles.forEach((file) => formData.append("attachments", file));

    setIsSendingReply(true);
    try {
      await axiosInstance.post(`/issues/admin/${selectedTicket._id}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTicketReply("");
      setTicketFiles([]);
      await Promise.all([loadTickets(), loadTicketDetail(selectedTicket._id)]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSendingReply(false);
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
  }, []);

  useEffect(() => {
    if (admin && activeSection === "doctors") loadDoctors();
  }, [admin, activeSection, doctorStatusFilter]);

  useEffect(() => {
    if (admin && activeSection === "subscriptions") loadPaymentProofs();
  }, [admin, activeSection]);

  useEffect(() => {
    if (admin && activeSection === "tickets") loadTickets();
  }, [admin, activeSection, ticketFilter]);

  useEffect(() => {
    if (selectedDoctorId) loadDoctorDetail(selectedDoctorId);
  }, [selectedDoctorId]);

  useEffect(() => {
    if (selectedTicketId) loadTicketDetail(selectedTicketId);
  }, [selectedTicketId]);

  if (isCheckingAdmin || !admin) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-slate-900 px-5 py-6 text-white">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">MedAlerto Admin</p>
            <h1 className="mt-2 text-xl font-bold">{admin.name || "Admin"}</h1>
            <p className="mt-1 truncate text-sm text-slate-300">{admin.email}</p>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition",
                    active ? "bg-slate-800 text-white ring-1 ring-teal-500/30" : "text-slate-300 hover:bg-slate-800/70 hover:text-white",
                  )}
                >
                  <span className={cx("h-2 w-2 rounded-full", active ? "bg-teal-500" : "bg-transparent")} />
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">Medical-grade operations console</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {navItems.find((item) => item.key === activeSection)?.label}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
                <p className="text-xs text-slate-500">Pending proofs</p>
                <p className="text-lg font-bold text-slate-950">{pendingProofCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
                <p className="text-xs text-slate-500">Open tickets</p>
                <p className="text-lg font-bold text-slate-950">{openTicketCount}</p>
              </div>
            </div>
          </header>

          {activeSection === "doctors" && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1 md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={doctorSearch}
                      onChange={(event) => setDoctorSearch(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && loadDoctors()}
                      placeholder="Search name, email, PMDC"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-teal-500/20 focus:border-teal-500 focus:ring-4"
                    />
                  </div>
                  <button onClick={loadDoctors} className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
                <select
                  value={doctorStatusFilter}
                  onChange={(event) => setDoctorStatusFilter(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-teal-500/20 focus:border-teal-500 focus:ring-4"
                >
                  {doctorStatusOptions.map((status) => (
                    <option key={status || "all"} value={status}>
                      {status || "All verification statuses"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="hidden grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
                  <span>Doctor</span>
                  <span>PMDC</span>
                  <span>Contact</span>
                  <span>Verification</span>
                  <span>Subscription</span>
                </div>
                {doctors.length === 0 ? (
                  <EmptyState title="No doctors found" detail="Try another search or status filter." />
                ) : (
                  doctors.map((doctor) => (
                    <button
                      key={doctor._id}
                      type="button"
                      onClick={() => setSelectedDoctorId(doctor._id)}
                      className="grid w-full gap-3 border-t border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50 lg:grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr] lg:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar doctor={doctor} />
                        <div>
                          <p className="font-semibold text-slate-950">{doctor.fullName}</p>
                          <p className="text-sm text-slate-500">{doctor.specialization || "Specialist"}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{doctor.pmdcNumber || "-"}</p>
                      <div className="text-sm text-slate-600">
                        <p>{doctor.email}</p>
                        <p>{doctor.phone || "-"}</p>
                      </div>
                      <StatusBadge status={normalizeDoctorStatus(doctor)} />
                      <StatusBadge status={doctor.subscriptionStatus || "INACTIVE"} />
                    </button>
                  ))
                )}
              </div>
            </section>
          )}

          {activeSection === "subscriptions" && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Subscriptions Approval Hub</h3>
                  <p className="text-sm text-slate-500">Review bank transfer proofs from pricing and billing support tickets.</p>
                </div>
                <button onClick={loadPaymentProofs} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {paymentProofs.length === 0 ? (
                  <EmptyState title="No payment proofs" detail="Submitted bank transfer receipts will appear here." />
                ) : (
                  paymentProofs.map((proof) => {
                    const doctor = proof.doctorId || {};
                    return (
                      <article key={proof._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setPreviewReceipt(proof)} className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              <img src={proof.screenshotUrl} alt="Payment receipt" className="h-full w-full object-cover" />
                            </button>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-slate-950">{proof.doctorName || doctor.fullName || "Doctor"}</p>
                                <StatusBadge status={proof.status} />
                              </div>
                              <p className="text-sm text-slate-600">{proof.doctorEmail || doctor.email || "-"}</p>
                              <p className="text-sm text-slate-600">{proof.doctorPhone || doctor.phone || "-"}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                Rs. {Number(proof.amount || 0).toLocaleString()} · {proof.billingCycle || "monthly"} · {proof.createdAt ? new Date(proof.createdAt).toLocaleString() : "-"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setPreviewReceipt(proof)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                              Preview Receipt
                            </button>
                            <button onClick={() => approveSubscriptionProof(proof._id)} disabled={proof.status === "APPROVED"} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50">
                              <CheckCircle2 className="h-4 w-4" />
                              Approve Payment
                            </button>
                            <button onClick={() => rejectSubscriptionProof(proof._id)} disabled={proof.status === "REJECTED"} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">
                              <XCircle className="h-4 w-4" />
                              Reject Payment
                            </button>
                          </div>
                        </div>
                        {proof.rejectionReason ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{proof.rejectionReason}</p> : null}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeSection === "tickets" && (
            <section className="grid min-h-[calc(100vh-11rem)] gap-5 xl:grid-cols-[380px_1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">Support Tickets</h3>
                    <p className="text-sm text-slate-500">Doctor support and billing conversations.</p>
                  </div>
                  <button onClick={loadTickets} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Refresh tickets">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  {["active", "history"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTicketFilter(filter)}
                      className={cx("rounded-lg px-3 py-2 text-sm font-semibold capitalize", ticketFilter === filter ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {tickets.length === 0 ? (
                    <EmptyState title="No tickets" detail="Support requests will appear here." />
                  ) : (
                    tickets.map((ticket) => (
                      <button
                        key={ticket._id}
                        type="button"
                        onClick={() => setSelectedTicketId(ticket._id)}
                        className={cx("w-full rounded-xl border p-3 text-left transition", selectedTicketId === ticket._id ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white hover:bg-slate-50")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-950">{ticket.title}</p>
                            <p className="text-sm text-slate-500">{ticket.doctor?.fullName || "Doctor"}</p>
                          </div>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-teal-700">{ticket.category}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
                {!selectedTicket ? (
                  <EmptyState title="Select a ticket" detail="Open a support conversation to review messages and attachments." />
                ) : (
                  <>
                    <div className="border-b border-slate-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-950">{selectedTicket.title}</h3>
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <MessageSquare className="h-4 w-4" />
                            {selectedTicket.doctor?.fullName || "Doctor"} · {selectedTicket.category}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={selectedTicket.status} />
                          {ticketStatusOptions.map((status) => (
                            <button key={status} onClick={() => updateTicketStatus(status)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[360px] flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                      {selectedTicketMessages.map((message) => {
                        const fromAdmin = message.senderRole === "admin";
                        return (
                          <div key={message._id || message.createdAt} className={cx("flex", fromAdmin ? "justify-end" : "justify-start")}>
                            <div className={cx("max-w-[82%] rounded-xl border px-4 py-3 shadow-sm", fromAdmin ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white")}>
                              <p className="text-xs font-semibold text-slate-500">{message.senderName || (fromAdmin ? "Admin" : "Doctor")}</p>
                              {message.text ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{message.text}</p> : null}
                              {(message.attachments || []).length > 0 ? (
                                <div className="mt-3 grid gap-2">
                                  {message.attachments.map((attachment) => (
                                    attachment.mimeType?.startsWith("image/") ? (
                                      <button key={attachment.url} type="button" onClick={() => setPreviewReceipt({ screenshotUrl: attachment.url, doctorName: attachment.name })} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <img src={attachment.url} alt={attachment.name} className="max-h-56 w-full object-cover" />
                                      </button>
                                    ) : (
                                      <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-teal-700">
                                        <FileText className="h-4 w-4" />
                                        {attachment.name || "Attachment"}
                                      </a>
                                    )
                                  ))}
                                </div>
                              ) : null}
                              <p className="mt-2 text-right text-[11px] text-slate-400">{message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-200 p-4">
                      {ticketFiles.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {ticketFiles.map((file, index) => (
                            <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {file.name}
                              <button type="button" onClick={() => setTicketFiles((prev) => prev.filter((_, i) => i !== index))} className="text-slate-400 hover:text-rose-600">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="file"
                          multiple
                          accept=".png,.jpg,.jpeg,.webp,.pdf"
                          onChange={(event) => setTicketFiles(Array.from(event.target.files || []))}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                        />
                        <textarea
                          value={ticketReply}
                          onChange={(event) => setTicketReply(event.target.value)}
                          placeholder="Reply to doctor..."
                          rows={1}
                          className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-500/20 focus:border-teal-500 focus:ring-4"
                        />
                        <button onClick={sendTicketReply} disabled={isSendingReply} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                          <Send className="h-4 w-4" />
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {selectedDoctor ? (
        <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={() => setSelectedDoctor(null)}>
          <aside className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <Avatar doctor={selectedDoctor} size="lg" />
                <div>
                  <h3 className="text-xl font-bold text-slate-950">{selectedDoctor.fullName}</h3>
                  <p className="text-sm text-slate-500">{selectedDoctor.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={normalizeDoctorStatus(selectedDoctor)} />
                    <StatusBadge status={selectedDoctor.subscriptionStatus || "INACTIVE"} />
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Close doctor drawer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="PMDC Registration" value={selectedDoctor.pmdcNumber} />
              <Field label="License Status" value={selectedDoctor.licenseStatus} />
              <Field label="Phone" value={selectedDoctor.phone} />
              <Field label="Specialization" value={selectedDoctor.specialization} />
              <Field label="Experience" value={selectedDoctor.yearsOfExperience ? `${selectedDoctor.yearsOfExperience} years` : "-"} />
              <Field label="Subscription Expires" value={selectedDoctor.subscriptionExpiresAt ? new Date(selectedDoctor.subscriptionExpiresAt).toLocaleDateString() : "-"} />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">Uploaded Credentials</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedDoctor.pmdcCertificate ? (
                  <a href={selectedDoctor.pmdcCertificate} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-teal-700">
                    <FileText className="h-4 w-4" />
                    PMDC Certificate
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">No credential files uploaded.</p>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-950">Subscription access</p>
              <p className="mt-1 text-xs text-slate-500">
                Trial and active accounts can use the full site. Blocked, inactive, and pending verification accounts can only use Support.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {subscriptionStatusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateDoctorSubscription(selectedDoctor._id, status)}
                    disabled={selectedDoctor.subscriptionStatus === status}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <label className="text-sm font-bold text-slate-950" htmlFor="doctor-notes">Review notes</label>
              <textarea
                id="doctor-notes"
                value={doctorNotes}
                onChange={(event) => setDoctorNotes(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-500/20 focus:border-teal-500 focus:ring-4"
                placeholder="Add notes or rejection reason..."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => updateDoctorVerification(selectedDoctor._id, "APPROVED")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <BadgeCheck className="h-4 w-4" />
                  Approve Doctor
                </button>
                <button onClick={() => updateDoctorVerification(selectedDoctor._id, "REJECTED")} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                  <XCircle className="h-4 w-4" />
                  Reject Doctor
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {previewReceipt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setPreviewReceipt(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-950">{previewReceipt.doctorName || "Receipt preview"}</p>
                <p className="text-xs text-slate-500">{previewReceipt.createdAt ? new Date(previewReceipt.createdAt).toLocaleString() : ""}</p>
              </div>
              <button onClick={() => setPreviewReceipt(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Close receipt preview">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-slate-100 p-4">
              <img src={previewReceipt.screenshotUrl} alt="Payment receipt preview" className="mx-auto max-h-[75vh] rounded-xl object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
