import { useEffect, useMemo, useState } from "react";
import { CircleHelp, History, LifeBuoy, MessageCircle, RefreshCw, Send, Sparkles, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import { organicCardStyle, organicInputStyle, organicSectionStyle, organicTheme } from "../styles/organicTheme";

const CATEGORIES = [
  "General Feedback",
  "Technical Issue",
  "Billing/Subscription",
  "Verification/Profile",
  "Other",
];

const statusTone = {
  Open: { color: "#C18C5D", border: "rgba(193,140,93,0.35)", bg: "rgba(193,140,93,0.12)" },
  "In Progress": { color: "#5D7052", border: "rgba(93,112,82,0.35)", bg: "rgba(93,112,82,0.12)" },
  Resolved: { color: "#4E6245", border: "rgba(78,98,69,0.35)", bg: "rgba(93,112,82,0.16)" },
  Reopened: { color: "#A85448", border: "rgba(168,84,72,0.35)", bg: "rgba(168,84,72,0.12)" },
  Closed: { color: "#78786C", border: "rgba(120,120,108,0.3)", bg: "rgba(120,120,108,0.1)" },
};

function StatusChip({ status }) {
  const tone = statusTone[status] || statusTone.Open;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] border font-semibold"
      style={{
        color: tone.color,
        borderColor: tone.border,
        background: tone.bg,
      }}
    >
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
    <div className="relative grid grid-cols-1 xl:grid-cols-12 gap-5 overflow-hidden">
      <div
        className="pointer-events-none absolute -left-20 -top-14 h-60 w-60 blur-3xl"
        style={{ background: "rgba(93,112,82,0.18)", borderRadius: organicTheme.radii.blobA }}
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 blur-3xl"
        style={{ background: "rgba(193,140,93,0.2)", borderRadius: organicTheme.radii.blobB }}
      />

      <section className="xl:col-span-4 rounded-[2rem] border p-5" style={organicCardStyle}>
        <div className="flex items-center gap-3">
          <span
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(93,112,82,0.12)", color: organicTheme.colors.primary }}
          >
            <LifeBuoy size={22} />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-[#2C2C24]" style={{ fontFamily: "Fraunces" }}>
              Support Center
            </h2>
            <p className="text-xs mt-1 text-[#78786C]">Create a ticket to chat with admin support.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <select
            value={newIssue.category}
            onChange={(e) => setNewIssue((p) => ({ ...p, category: e.target.value }))}
            className="w-full rounded-full px-4 py-3 border text-sm outline-none focus:ring-2 focus:ring-[#5D7052]/30"
            style={organicInputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={newIssue.title}
            onChange={(e) => setNewIssue((p) => ({ ...p, title: e.target.value }))}
            placeholder="Issue title"
            className="w-full rounded-full px-4 py-3 border text-sm outline-none focus:ring-2 focus:ring-[#5D7052]/30"
            style={organicInputStyle}
          />
          <textarea
            value={newIssue.description}
            onChange={(e) => setNewIssue((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe your feedback/problem"
            rows={4}
            className="w-full rounded-3xl px-4 py-3 border text-sm resize-none outline-none focus:ring-2 focus:ring-[#5D7052]/30"
            style={organicInputStyle}
          />
          <button
            onClick={handleCreateIssue}
            disabled={isCreating}
            className="w-full rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2"
            style={{ background: organicTheme.colors.primary, boxShadow: organicTheme.shadows.button }}
          >
            <Ticket size={16} />
            {isCreating ? "Creating..." : "Create Issue"}
          </button>
        </div>

        <div className="mt-6 flex gap-2 rounded-full p-1 border" style={organicSectionStyle}>
          <button
            onClick={() => setActiveTab("active")}
            className="flex-1 rounded-full px-2 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            style={{
              background: activeTab === "active" ? "rgba(93,112,82,0.14)" : "transparent",
              color: activeTab === "active" ? organicTheme.colors.primary : organicTheme.colors.mutedForeground,
            }}
          >
            <Sparkles size={13} />
            Active
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className="flex-1 rounded-full px-2 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            style={{
              background: activeTab === "history" ? "rgba(93,112,82,0.14)" : "transparent",
              color: activeTab === "history" ? organicTheme.colors.primary : organicTheme.colors.mutedForeground,
            }}
          >
            <History size={13} />
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
                className="w-full text-left rounded-2xl p-3 border transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: selectedId === t._id ? "rgba(93,112,82,0.36)" : "rgba(222,216,207,0.9)",
                  background: selectedId === t._id ? "rgba(93,112,82,0.1)" : "rgba(240,235,229,0.18)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#2C2C24] line-clamp-1">{t.title}</p>
                  <StatusChip status={t.status} />
                </div>
                <p className="text-xs mt-1 text-[#78786C] line-clamp-1">{t.category}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="xl:col-span-8 rounded-[2rem] border p-4 flex flex-col min-h-[500px]" style={organicCardStyle}>
        {!selectedTicket ? (
          <div className="m-auto text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(93,112,82,0.12)", color: organicTheme.colors.primary }}>
              <CircleHelp size={24} />
            </div>
            <p className="text-sm text-[#78786C]">Select an issue to open the chat.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "rgba(222,216,207,0.9)" }}>
              <div>
                <h3 className="text-lg font-bold text-[#2C2C24]" style={{ fontFamily: "Fraunces" }}>{selectedTicket.title}</h3>
                <p className="text-xs text-[#78786C] mt-1 inline-flex items-center gap-1.5"><MessageCircle size={12} /> {selectedTicket.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={selectedTicket.status} />
                {canReopen && (
                  <button
                    onClick={reopenIssue}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold border inline-flex items-center gap-1"
                    style={{ borderColor: "rgba(93,112,82,0.35)", color: organicTheme.colors.primary }}
                  >
                    <RefreshCw size={12} />
                    Reopen
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {(selectedTicket.messages || []).map((m) => (
                <div key={m._id || `${m.senderRole}-${m.createdAt}`} className={`flex ${m.senderRole === "doctor" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[82%] rounded-[1.4rem] px-3 py-2 border"
                    style={
                      m.senderRole === "doctor"
                        ? { background: "rgba(93,112,82,0.14)", borderColor: "rgba(93,112,82,0.28)" }
                        : { background: "rgba(240,235,229,0.28)", borderColor: "rgba(222,216,207,0.9)" }
                    }
                  >
                    <p className="text-[11px] font-semibold mb-0.5 text-[#78786C]">{m.senderName}</p>
                    <p className="text-sm text-[#2C2C24] whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex gap-2" style={{ borderColor: "rgba(222,216,207,0.9)" }}>
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write message..."
                className="flex-1 rounded-full px-4 py-2.5 border text-sm outline-none focus:ring-2 focus:ring-[#5D7052]/30"
                style={organicInputStyle}
              />
              <button
                onClick={sendMessage}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                style={{ background: organicTheme.colors.primary, boxShadow: organicTheme.shadows.button }}
              >
                <Send size={14} />
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
