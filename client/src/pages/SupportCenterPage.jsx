import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ChevronLeft, CircleHelp, History, LifeBuoy, MessageCircle, Mic, Plus, RefreshCw, Send, Sparkles, Ticket, X } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";
import { getRealtimeSocketForRole } from "../realtime/socket";
import { organicCardStyle, organicInputStyle, organicSectionStyle, organicTheme } from "../styles/organicTheme";

const SUPPORT_SEEN_STORAGE_KEY = "support-ticket-seen-map-v2";

const CATEGORIES = [
  "General Feedback",
  "Technical Issue",
  "Billing/Subscription",
  "Verification/Profile",
  "Other",
];

const SUPPORT_CHANNELS = [
  { title: "Email", value: "support@medalerto.com" },
  { title: "Chat", value: "In-platform issue chat" },
  { title: "Hours", value: "Mon-Sat, 9:00 AM - 7:00 PM" },
];

const HELP_TOPICS = [
  "Account access and login issues",
  "Prescription and attachment delivery",
  "Appointment and reminder behavior",
  "Billing and subscription changes",
];

const statusTone = {
  Open: { color: "var(--color-secondary)", border: "rgba(193,140,93,0.35)", bg: "rgba(193,140,93,0.12)" },
  "In Progress": { color: "var(--color-primary)", border: "rgba(93,112,82,0.35)", bg: "rgba(93,112,82,0.12)" },
  Resolved: { color: "var(--color-primary)", border: "rgba(78,98,69,0.35)", bg: "rgba(93,112,82,0.16)" },
  Reopened: { color: "var(--color-danger)", border: "rgba(168,84,72,0.35)", bg: "rgba(168,84,72,0.12)" },
  Closed: { color: "var(--color-text-secondary)", border: "rgba(120,120,108,0.3)", bg: "rgba(120,120,108,0.1)" },
};

const chatCanvasStyle = {
  backgroundColor: "color-mix(in srgb, var(--color-bg-soft) 78%, var(--color-card) 22%)",
  backgroundImage: "radial-gradient(circle at 12px 12px, color-mix(in srgb, var(--color-primary) 18%, transparent) 1.5px, transparent 0)",
  backgroundSize: "28px 28px",
};

const sentBubbleStyle = {
  background: "color-mix(in srgb, var(--color-primary) 24%, var(--color-card) 76%)",
  borderColor: "color-mix(in srgb, var(--color-primary) 42%, transparent)",
};

const receivedBubbleStyle = {
  background: "color-mix(in srgb, var(--color-card-elevated) 88%, var(--color-bg) 12%)",
  borderColor: "color-mix(in srgb, var(--color-border) 82%, transparent)",
};

const sentVoiceTheme = {
  surface: "color-mix(in srgb, var(--color-primary) 18%, var(--color-card) 82%)",
  border: "color-mix(in srgb, var(--color-primary) 34%, transparent)",
  accent: "var(--color-primary)",
};

const receivedVoiceTheme = {
  surface: "color-mix(in srgb, var(--color-card-elevated) 90%, var(--color-bg) 10%)",
  border: "color-mix(in srgb, var(--color-border) 80%, transparent)",
  accent: "var(--color-primary)",
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
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1280 : false));
  const [mobileScreen, setMobileScreen] = useState("list");
  const [seenIncomingAtByTicket, setSeenIncomingAtByTicket] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(SUPPORT_SEEN_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [newIssue, setNewIssue] = useState({
    category: CATEGORIES[0],
    title: "",
    description: "",
  });
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const discardRecordingRef = useRef(false);

  const scrollMessagesToBottom = () => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    setShowJumpToLatest(false);
  };

  const updateJumpToLatestVisibility = () => {
    const container = messagesContainerRef.current;
    if (!container) {
      setShowJumpToLatest(false);
      return;
    }
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 96);
  };

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

  const loadTicketDetail = async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }

    try {
      const res = await axiosInstance.get(`/issues/doctor/${ticketId}`);
      setSelectedTicket(res.data?.ticket || null);
    } catch {
      setSelectedTicket(null);
    }
  };

  const ticketMatchesTab = (ticket, tab) => {
    const status = String(ticket?.status || "");
    const isHistory = tab === "history";
    return isHistory ? ["Resolved", "Closed"].includes(status) : !["Resolved", "Closed"].includes(status);
  };

  const upsertVisibleTicket = (ticket, tab) => {
    if (!ticket?._id) return;

    setTickets((prev) => {
      const shouldInclude = ticketMatchesTab(ticket, tab);
      const next = prev.filter((item) => String(item._id) !== String(ticket._id));
      return shouldInclude ? [ticket, ...next] : next;
    });
  };

  useEffect(() => {
    loadTickets(activeTab === "history");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const socket = getRealtimeSocketForRole("doctor");

    const handleTicketUpdate = ({ ticket } = {}) => {
      if (!ticket) return;
      upsertVisibleTicket(ticket, activeTab);
    };

    const handleTicketDetailUpdate = ({ ticketId, ticket } = {}) => {
      if (!ticket) return;
      upsertVisibleTicket(ticket, activeTab);
      if (String(ticketId || "") === String(selectedId || "")) {
        setSelectedTicket(ticket);
        setOptimisticMessages([]);
      }
    };

    const handleReconnectSync = () => {
      loadTickets(activeTab === "history");
      if (selectedId) {
        loadTicketDetail(selectedId);
      }
    };

    const handleSocketError = (error) => {
      if (error?.message === "Unauthorized") {
        toast.error("Session expired. Please log in again.");
      }
    };

    socket.connect();
    socket.on("connect", handleReconnectSync);
    socket.on("issue-ticket:list-updated", handleTicketUpdate);
    socket.on("issue-ticket:detail-updated", handleTicketDetailUpdate);
    socket.on("connect_error", handleSocketError);

    return () => {
      socket.off("connect", handleReconnectSync);
      socket.off("issue-ticket:list-updated", handleTicketUpdate);
      socket.off("issue-ticket:detail-updated", handleTicketDetailUpdate);
      socket.off("connect_error", handleSocketError);
    };
  }, [activeTab, selectedId]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobileView(mobile);
      if (!mobile) {
        setMobileScreen("chat");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadTicketDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const socket = getRealtimeSocketForRole("doctor");
    const joinIssueRoom = () => {
      socket.emit("issue-ticket:join", { ticketId: selectedId });
    };
    socket.connect();
    joinIssueRoom();
    socket.on("connect", joinIssueRoom);

    return () => {
      socket.emit("issue-ticket:leave", { ticketId: selectedId });
      socket.off("connect", joinIssueRoom);
    };
  }, [selectedId]);

  useEffect(() => {
    scrollMessagesToBottom();
    const timeoutId = window.setTimeout(scrollMessagesToBottom, 120);
    return () => window.clearTimeout(timeoutId);
  }, [selectedTicket?.messages, optimisticMessages]);

  useEffect(() => {
    requestAnimationFrame(scrollMessagesToBottom);
  }, [selectedId]);

  useEffect(() => {
    updateJumpToLatestVisibility();
  }, [selectedTicket?.messages, optimisticMessages, selectedId]);

  useEffect(() => {
    setOptimisticMessages([]);
    setAttachments([]);
    setMessageText("");
    setVoiceDraft(null);
  }, [selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SUPPORT_SEEN_STORAGE_KEY, JSON.stringify(seenIncomingAtByTicket));
  }, [seenIncomingAtByTicket]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };

    if (previewImage) {
      window.addEventListener("keydown", onEscape);
    }

    return () => window.removeEventListener("keydown", onEscape);
  }, [previewImage]);

  useEffect(
    () => () => {
      if (voiceDraft?.previewUrl) {
        URL.revokeObjectURL(voiceDraft.previewUrl);
      }
    },
    [voiceDraft],
  );

  const handleCreateIssue = async () => {
    if (!newIssue.title.trim() || !newIssue.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setIsCreating(true);
    try {
      const res = await axiosInstance.post("/issues/doctor", {
        category: newIssue.category,
        title: newIssue.title.trim(),
        description: newIssue.description.trim(),
      });
      toast.success("Issue created");
      setNewIssue({ category: CATEGORIES[0], title: "", description: "" });
      setActiveTab("active");
      setSelectedId(res.data?.ticket?._id || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create issue");
    } finally {
      setIsCreating(false);
    }
  };

  const discardVoiceDraft = (showToast = true) => {
    if (voiceDraft?.previewUrl) {
      URL.revokeObjectURL(voiceDraft.previewUrl);
    }
    setVoiceDraft(null);
    if (showToast) {
      toast.info("Voice note discarded");
    }
  };

  const getTicketById = (ticketId) => tickets.find((ticket) => String(ticket?._id) === String(ticketId));

  const getTicketLastMessage = (ticket) => {
    const list = Array.isArray(ticket?.messages) ? ticket.messages : [];
    return list[list.length - 1] || null;
  };

  const getTicketLastMessageTime = (ticket) => {
    const lastMessage = getTicketLastMessage(ticket);
    const source = lastMessage?.createdAt || ticket?.lastMessageAt || ticket?.updatedAt || ticket?.createdAt;
    const ts = new Date(source).getTime();
    return Number.isFinite(ts) ? ts : 0;
  };

  const getLastIncomingTailTime = (ticket) => {
    const lastMessage = getTicketLastMessage(ticket);
    const senderRole = String(lastMessage?.senderRole || "").toLowerCase();
    if (senderRole !== "admin") return 0;
    return getTicketLastMessageTime(ticket);
  };

  const markTicketAsSeenLocally = (ticketId, ticketOverride) => {
    if (!ticketId) return;
    const ticket = ticketOverride || getTicketById(ticketId);
    const incomingTailTime = getLastIncomingTailTime(ticket);
    if (!incomingTailTime) return;

    setSeenIncomingAtByTicket((prev) => {
      const current = Number(prev?.[ticketId] || 0);
      if (current >= incomingTailTime) return prev;
      return { ...prev, [ticketId]: incomingTailTime };
    });
  };

  const hasNewUpdate = (ticket) => {
    const incomingTailTime = getLastIncomingTailTime(ticket);
    if (!incomingTailTime) return false;

    const seenAt = Number(seenIncomingAtByTicket?.[ticket?._id] || 0);
    return seenAt < incomingTailTime;
  };

  const handleSelectTicket = (ticketId, ticketOverride) => {
    if (selectedId && String(selectedId) !== String(ticketId)) {
      markTicketAsSeenLocally(selectedId, selectedTicket || getTicketById(selectedId));
    }

    setSelectedId(ticketId);
    markTicketAsSeenLocally(ticketId, ticketOverride);
    if (isMobileView) {
      setMobileScreen("chat");
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket?._id) return;

    const textToSend = String(messageText || "").trim();
    const outgoingFiles = voiceDraft?.file ? [...attachments, voiceDraft.file] : attachments;
    if (!textToSend && outgoingFiles.length === 0) return;

    setIsSending(true);

    const optimisticId = `temp-${Date.now()}`;
    const optimisticAttachments = outgoingFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      mimeType: file.type,
      size: file.size,
      isLocalPreview: true,
    }));

    const optimisticMessage = {
      _id: optimisticId,
      senderRole: "doctor",
      senderName: "You",
      text: textToSend,
      attachments: optimisticAttachments,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setMessageText("");
    setAttachments([]);
    discardVoiceDraft(false);

    try {
      const formData = new FormData();
      if (textToSend) {
        formData.append("text", textToSend);
      }
      outgoingFiles.forEach((file) => formData.append("attachments", file));

      await axiosInstance.post(`/issues/doctor/${selectedTicket._id}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch {
      optimisticAttachments.forEach((item) => URL.revokeObjectURL(item.url));
      setOptimisticMessages((prev) => prev.filter((item) => item._id !== optimisticId));
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const isImageFile = (file) => {
    const mimeType = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();
    return mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(name);
  };

  const isAudioAttachment = (attachment) => {
    const mimeType = String(attachment?.mimeType || "").toLowerCase();
    const name = String(attachment?.name || "").toLowerCase();
    return mimeType.startsWith("audio/") || /\.(webm|ogg|mp3|wav|m4a|aac)$/i.test(name);
  };

  const isImageAttachment = (attachment) => {
    const mimeType = String(attachment?.mimeType || "").toLowerCase();
    const name = String(attachment?.name || "").toLowerCase();
    const url = String(attachment?.url || "").toLowerCase();
    return mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(name) || /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);
  };

  const getAttachmentKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

  const imagePreviewUrls = useMemo(() => {
    const map = new Map();
    attachments.forEach((file) => {
      if (isImageFile(file)) {
        map.set(getAttachmentKey(file), URL.createObjectURL(file));
      }
    });
    return map;
  }, [attachments]);

  useEffect(
    () => () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    },
    [imagePreviewUrls],
  );

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startVoiceRecording = async () => {
    try {
      discardRecordingRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        const mimeType = recorder.mimeType || "audio/webm";
        if (discardRecordingRef.current) {
          audioChunksRef.current = [];
          stream.getTracks().forEach((track) => track.stop());
          setRecordingTime(0);
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          stream.getTracks().forEach((track) => track.stop());
          setRecordingTime(0);
          toast.error("Recorded audio is empty");
          return;
        }

        const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mpeg") ? "mp3" : mimeType.includes("wav") ? "wav" : "webm";
        const voiceFile = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);
        setVoiceDraft((prev) => {
          if (prev?.previewUrl) {
            URL.revokeObjectURL(prev.previewUrl);
          }
          return {
            file: voiceFile,
            previewUrl,
            duration: recordingTimeRef.current,
          };
        });
        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
        recordingTimeRef.current = 0;
        toast.success("Voice note ready");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      recordingTimerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);
    } catch {
      toast.error("Microphone access is required");
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    discardRecordingRef.current = false;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecording = () => {
    discardRecordingRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    audioChunksRef.current = [];
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    toast.info("Recording cancelled");
  };

  const messages = [...(selectedTicket?.messages || []), ...optimisticMessages];

  const sortedTickets = [...tickets].sort((a, b) => {
    const aTime = getTicketLastMessageTime(a);
    const bTime = getTicketLastMessageTime(b);
    if (aTime !== bTime) return bTime - aTime;
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });

  const newChats = sortedTickets.filter((ticket) => hasNewUpdate(ticket));
  const otherChats = sortedTickets.filter((ticket) => !hasNewUpdate(ticket));
  const showIssueListPane = !isMobileView || mobileScreen === "list";
  const showChatPane = !isMobileView || mobileScreen === "chat";

  useEffect(() => {
    if (!showChatPane) return;
    if (!selectedId || !selectedTicket) return;
    if (String(selectedTicket?._id) !== String(selectedId)) return;
    markTicketAsSeenLocally(selectedId, selectedTicket);
  }, [selectedId, selectedTicket, showChatPane]);

  const canReopen = useMemo(() => selectedTicket?.status === "Resolved", [selectedTicket?.status]);

  const reopenIssue = async () => {
    if (!selectedTicket?._id) return;
    try {
      await axiosInstance.patch(`/issues/doctor/${selectedTicket._id}/status`, { status: "Reopened" });
      toast.success("Issue reopened");
      setActiveTab("active");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reopen issue");
    }
  };

  return (
    <>
    <div className="relative grid grid-cols-1 xl:grid-cols-12 gap-5 overflow-hidden">
      <div
        className="pointer-events-none absolute -left-20 -top-14 h-60 w-60 blur-3xl"
        style={{ background: "rgba(93,112,82,0.18)", borderRadius: organicTheme.radii.blobA }}
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 blur-3xl"
        style={{ background: "rgba(193,140,93,0.2)", borderRadius: organicTheme.radii.blobB }}
      />

      {showIssueListPane ? (
      <section className="xl:col-span-4 h-[calc(100vh-9rem)] overflow-hidden rounded-[2rem] border p-5 flex flex-col" style={organicCardStyle}>
        <div className="flex items-center gap-3">
          <span
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(93,112,82,0.12)", color: organicTheme.colors.primary }}
          >
            <LifeBuoy size={22} />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Fraunces" }}>
              Support Center
            </h2>
            <p className="text-xs mt-1 text-[var(--color-text-secondary)]">Create a ticket to chat with admin support.</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border p-3" style={{ borderColor: "color-mix(in srgb, var(--color-border) 85%, transparent)", background: "color-mix(in srgb, var(--color-bg-soft) 52%, transparent)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">Need help fast</p>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {SUPPORT_CHANNELS.map((item) => (
              <div key={item.title} className="rounded-xl border px-3 py-2" style={{ borderColor: "color-mix(in srgb, var(--color-border) 80%, transparent)", background: "color-mix(in srgb, var(--color-card) 88%, transparent)" }}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{item.title}</p>
                <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {HELP_TOPICS.map((topic) => (
              <p key={topic} className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                <span>{topic}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <select
            value={newIssue.category}
            onChange={(e) => setNewIssue((p) => ({ ...p, category: e.target.value }))}
            className="w-full rounded-full px-4 py-3 border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
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
            className="w-full rounded-full px-4 py-3 border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            style={organicInputStyle}
          />
          <textarea
            value={newIssue.description}
            onChange={(e) => setNewIssue((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe your feedback/problem"
            rows={4}
            className="w-full rounded-3xl px-4 py-3 border text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
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

        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Loading issues...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No issues found.</p>
          ) : (
            <>
              {newChats.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">New chats</p>
                  <div className="space-y-2">
                    {newChats.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => handleSelectTicket(t._id, t)}
                        className="w-full text-left rounded-2xl p-3 border transition-all hover:-translate-y-0.5"
                        style={{
                          borderColor: selectedId === t._id ? "rgba(93,112,82,0.42)" : "rgba(93,112,82,0.3)",
                          background: selectedId === t._id ? "rgba(93,112,82,0.14)" : "rgba(93,112,82,0.08)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{t.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">New update</span>
                            <StatusChip status={t.status} />
                          </div>
                        </div>
                        <p className="text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">{t.category}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {otherChats.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">All chats</p>
                  <div className="space-y-2">
                    {otherChats.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => handleSelectTicket(t._id, t)}
                        className="w-full text-left rounded-2xl p-3 border transition-all hover:-translate-y-0.5"
                        style={{
                          borderColor: selectedId === t._id ? "rgba(93,112,82,0.36)" : "color-mix(in srgb, var(--color-border) 80%, transparent)",
                          background: selectedId === t._id ? "rgba(93,112,82,0.1)" : "color-mix(in srgb, var(--color-bg-soft) 28%, transparent)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{t.title}</p>
                          <StatusChip status={t.status} />
                        </div>
                        <p className="text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">{t.category}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
      ) : null}

      {showChatPane ? (
      <section className="xl:col-span-8 h-[calc(100vh-9rem)] overflow-hidden rounded-[2rem] border p-4 flex flex-col" style={organicCardStyle}>
        {!selectedTicket ? (
          <div className="m-auto text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(93,112,82,0.12)", color: organicTheme.colors.primary }}>
              <CircleHelp size={24} />
            </div>
            {isMobileView ? (
              <button
                type="button"
                onClick={() => setMobileScreen("list")}
                className="mx-auto mb-3 inline-flex items-center gap-1 rounded-full border border-[var(--color-border)]/80 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : null}
            <p className="text-sm text-[var(--color-text-secondary)]">Select an issue to open the chat.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "color-mix(in srgb, var(--color-border) 80%, transparent)" }}>
              <div>
                {isMobileView ? (
                  <button
                    type="button"
                    onClick={() => setMobileScreen("list")}
                    className="mb-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-border)]/80 px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : null}
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Fraunces" }}>{selectedTicket.title}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 inline-flex items-center gap-1.5"><MessageCircle size={12} /> {selectedTicket.category}</p>
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

            <div className="relative min-h-0 flex-1">
              <div ref={messagesContainerRef} onScroll={updateJumpToLatestVisibility} className="h-full overflow-y-auto py-3 space-y-2 rounded-2xl px-2" style={chatCanvasStyle}>
                {messages.map((m) => (
                  <div key={m._id || `${m.senderRole}-${m.createdAt}`} className={`flex ${m.senderRole === "doctor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[82%] rounded-[1.1rem] px-3 py-2 border"
                      style={m.senderRole === "doctor" ? sentBubbleStyle : receivedBubbleStyle}
                    >
                      <p className="text-[11px] font-semibold mb-0.5 text-[var(--color-text-secondary)]">{m.senderName}</p>
                      {m.text ? <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{m.text}</p> : null}
                      {(m.attachments || []).length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {m.attachments.map((attachment) => (
                            isImageAttachment(attachment) ? (
                              <button
                                type="button"
                                key={attachment.url}
                                onClick={() => setPreviewImage({ url: attachment.url, name: attachment.name })}
                                className="block overflow-hidden rounded-xl border border-[var(--color-border)]/80"
                              >
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  onLoad={scrollMessagesToBottom}
                                  className="max-h-64 w-full object-cover"
                                />
                              </button>
                            ) : isAudioAttachment(attachment) ? (
                              <VoiceMessagePlayer
                                key={attachment.url}
                                src={attachment.url}
                                title={attachment.name}
                                badge={m.senderRole === "doctor" ? "Sent voice" : "Admin voice"}
                                theme={m.senderRole === "doctor" ? sentVoiceTheme : receivedVoiceTheme}
                              />
                            ) : (
                              <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-[var(--color-border)]/80 px-3 py-2 text-xs text-[var(--color-primary)] hover:underline">
                                {attachment.name}
                              </a>
                            )
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-1 text-[10px] text-[var(--color-text-secondary)] text-right">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {showJumpToLatest ? (
                <button
                  type="button"
                  onClick={scrollMessagesToBottom}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur"
                  style={{ borderColor: "rgba(93,112,82,0.45)", background: "color-mix(in srgb, var(--color-card) 74%, var(--color-primary) 26%)", color: "var(--color-text-primary)" }}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  New messages
                </button>
              ) : null}
            </div>

            <div className="pt-2 border-t" style={{ borderColor: "color-mix(in srgb, var(--color-border) 80%, transparent)" }}>
              {isRecording ? (
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full" style={{ background: "color-mix(in srgb, var(--color-danger) 14%, transparent)", borderColor: "color-mix(in srgb, var(--color-danger) 34%, transparent)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-sm font-semibold text-[var(--color-danger)]">Recording... {formatTime(recordingTime)}</span>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <button type="button" onClick={cancelRecording} className="rounded-full p-2.5 transition" style={{ background: "color-mix(in srgb, var(--color-danger) 26%, transparent)", color: "var(--color-danger)" }} aria-label="Discard recording">
                      <X className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={stopVoiceRecording} className="rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white hover:bg-green-600">
                      Stop
                    </button>
                  </div>
                </div>
              ) : null}

              {voiceDraft ? (
                <div className="mb-3 rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/85 px-3 py-2.5">
                  <VoiceMessagePlayer
                    src={voiceDraft.previewUrl}
                    title={voiceDraft.file?.name || "Voice note"}
                    badge="Draft"
                    duration={voiceDraft.duration || 0}
                    theme={receivedVoiceTheme}
                    action={(
                      <button type="button" onClick={() => discardVoiceDraft(true)} className="rounded-full p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10" aria-label="Discard voice note">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  />
                </div>
              ) : null}

              {attachments.length > 0 ? (
                <div className="mb-3 space-y-2">
                  {attachments.map((file, idx) => (
                    isImageFile(file) ? (
                      <div key={idx} className="relative overflow-hidden rounded-2xl border border-[var(--color-border)]/80 p-2" style={{ background: "color-mix(in srgb, var(--color-card-elevated) 82%, var(--color-bg) 18%)" }}>
                        <img src={imagePreviewUrls.get(getAttachmentKey(file))} alt={file.name} className="h-28 w-28 rounded-xl object-cover" />
                        <p className="mt-1 w-28 truncate text-[11px] font-medium text-[var(--color-text-secondary)]">{file.name}</p>
                        <button type="button" onClick={() => removeAttachment(idx)} className="absolute right-2 top-2 rounded-full bg-black/65 p-1 text-white" aria-label="Remove image">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div key={idx} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs" style={{ borderColor: "color-mix(in srgb, var(--color-primary) 38%, transparent)", background: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}>
                        <span className="max-w-[220px] truncate font-medium text-[var(--color-primary)]">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment(idx)} className="font-bold text-[var(--color-primary)]">✕</button>
                      </div>
                    )
                  ))}
                </div>
              ) : null}

              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full bg-[var(--color-primary)]/10 p-2.5 text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 sm:p-3">
                  <Plus className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.gif,.pdf,.webm,.ogg,.mp3,.wav"
                  onChange={(e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])])}
                  className="hidden"
                />

                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleMessageKeyDown}
                  placeholder="Write message..."
                  className="flex-1 rounded-full px-4 py-2.5 border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  style={organicInputStyle}
                />
                {messageText.trim() || attachments.length > 0 || voiceDraft?.file ? (
                  <button onClick={sendMessage} disabled={isSending} className="rounded-full px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-60" style={{ background: organicTheme.colors.primary, boxShadow: organicTheme.shadows.button }}>
                    <Send size={14} />
                    Send
                  </button>
                ) : (
                  <button type="button" onClick={isRecording ? stopVoiceRecording : startVoiceRecording} className="rounded-full p-2.5 transition sm:p-3" style={{ background: isRecording ? "rgba(239,68,68,0.1)" : "transparent", color: isRecording ? "rgb(239,68,68)" : "var(--color-primary)" }}>
                    <Mic className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>
      ) : null}
    </div>

    {previewImage ? (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 p-4">
        <button type="button" onClick={() => setPreviewImage(null)} className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white" aria-label="Close image preview">
          <X className="h-6 w-6" />
        </button>
        <img src={previewImage.url} alt={previewImage.name} className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain" />
      </div>
    ) : null}
    </>
  );
}
