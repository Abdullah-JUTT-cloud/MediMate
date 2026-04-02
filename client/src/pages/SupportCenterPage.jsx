import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

const CATEGORIES = [
  "General Feedback",
  "Technical Issue",
  "Billing/Subscription",
  "Verification/Profile",
  "Other",
];

const statusTone = {
  Open: "text-amber-300 border-amber-400/35 bg-amber-500/10",
  "In Progress": "text-blue-300 border-blue-400/35 bg-blue-500/10",
  Resolved: "text-emerald-300 border-emerald-400/35 bg-emerald-500/10",
  Reopened: "text-orange-300 border-orange-400/35 bg-orange-500/10",
  Closed: "text-zinc-300 border-zinc-400/35 bg-zinc-500/10",
};

function StatusChip({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${statusTone[status] || statusTone.Open}`}>
      {status}
    </span>
  );
}

export default function SupportCenterPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [newIssue, setNewIssue] = useState({
    category: CATEGORIES[0],
    title: "",
    description: "",
  });

  const loadTickets = async (history) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/issues/doctor?history=${history ? "true" : "false"}&limit=50`);
      const list = Array.isArray(res.data?.tickets) ? res.data.tickets : [];
      setTickets(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0]._id);
      }
      if (selectedId && !list.some((t) => t._id === selectedId)) {
        setSelectedId(list[0]?._id || "");
      }
    } catch {
      toast.error("Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets(activeTab === "history");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTicket(null);
      return;
    }

    let timer;

    const loadTicket = async () => {
      try {
        const res = await axiosInstance.get(`/issues/doctor/${selectedId}`);
        setSelectedTicket(res.data?.ticket || null);
      } catch {
        setSelectedTicket(null);
      }
    };

    loadTicket();
    timer = setInterval(loadTicket, 5000);

    return () => clearInterval(timer);
  }, [selectedId]);

  const handleCreateIssue = async () => {
    if (!newIssue.title.trim() || !newIssue.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setIsCreating(true);
    try {
      await axiosInstance.post("/issues/doctor", {
        category: newIssue.category,
        title: newIssue.title.trim(),
        description: newIssue.description.trim(),
      });
      toast.success("Issue created");
      setNewIssue({ category: CATEGORIES[0], title: "", description: "" });
      await loadTickets(false);
      setActiveTab("active");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create issue");
    } finally {
      setIsCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket?._id || !messageText.trim()) return;

    try {
      await axiosInstance.post(`/issues/doctor/${selectedTicket._id}/messages`, { text: messageText.trim() });
      setMessageText("");
      const res = await axiosInstance.get(`/issues/doctor/${selectedTicket._id}`);
      setSelectedTicket(res.data?.ticket || null);
      await loadTickets(activeTab === "history");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const canReopen = useMemo(() => selectedTicket?.status === "Resolved", [selectedTicket?.status]);

  const reopenIssue = async () => {
    if (!selectedTicket?._id) return;
    try {
      await axiosInstance.patch(`/issues/doctor/${selectedTicket._id}/status`, { status: "Reopened" });
      toast.success("Issue reopened");
      setActiveTab("active");
      await loadTickets(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reopen issue");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <section className="xl:col-span-4 rounded-2xl border p-4 bg-[var(--color-card)] border-[var(--color-border)]">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Feedback / Problems</h2>
        <p className="text-xs mt-1 text-[var(--color-text-secondary)]">Create a ticket to chat with admin support.</p>

        <div className="mt-4 space-y-3">
          <select
            value={newIssue.category}
            onChange={(e) => setNewIssue((p) => ({ ...p, category: e.target.value }))}
            className="w-full rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={newIssue.title}
            onChange={(e) => setNewIssue((p) => ({ ...p, title: e.target.value }))}
            placeholder="Issue title"
            className="w-full rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm"
          />
          <textarea
            value={newIssue.description}
            onChange={(e) => setNewIssue((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe your feedback/problem"
            rows={4}
            className="w-full rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm resize-none"
          />
          <button
            onClick={handleCreateIssue}
            disabled={isCreating}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] disabled:opacity-60"
          >
            {isCreating ? "Creating..." : "Create Issue"}
          </button>
        </div>

        <div className="mt-6 flex gap-2 rounded-xl p-1 border border-[var(--color-border)] bg-[var(--color-bg)]/40">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${activeTab === "active" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"}`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${activeTab === "history" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"}`}
          >
            History
          </button>
        </div>

        <div className="mt-3 space-y-2 max-h-[330px] overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Loading issues...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No issues found.</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t._id}
                onClick={() => setSelectedId(t._id)}
                className={`w-full text-left rounded-xl p-3 border ${selectedId === t._id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{t.title}</p>
                  <StatusChip status={t.status} />
                </div>
                <p className="text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">{t.category}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="xl:col-span-8 rounded-2xl border bg-[var(--color-card)] border-[var(--color-border)] p-4 flex flex-col min-h-[500px]">
        {!selectedTicket ? (
          <div className="m-auto text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">Select an issue to open the chat.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">{selectedTicket.title}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{selectedTicket.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={selectedTicket.status} />
                {canReopen && (
                  <button
                    onClick={reopenIssue}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-[var(--color-primary)]/35 text-[var(--color-primary)]"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {(selectedTicket.messages || []).map((m) => (
                <div key={m._id || `${m.senderRole}-${m.createdAt}`} className={`flex ${m.senderRole === "doctor" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 border ${m.senderRole === "doctor" ? "bg-[var(--color-primary)]/15 border-[var(--color-primary)]/30" : "bg-[var(--color-bg)] border-[var(--color-border)]"}`}>
                    <p className="text-[11px] font-semibold mb-0.5 text-[var(--color-text-secondary)]">{m.senderName}</p>
                    <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--color-border)] flex gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write message..."
                className="flex-1 rounded-xl px-3 py-2.5 border bg-[var(--color-bg)] border-[var(--color-border)] text-sm"
              />
              <button
                onClick={sendMessage}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)]"
              >
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
