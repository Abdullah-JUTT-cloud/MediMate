/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ChevronLeft,
  CircleHelp,
  History,
  LifeBuoy,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import MessageStatusTicks from "../components/MessageStatusTicks";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";
import { getRealtimeSocketForRole } from "../realtime/socket";
import { organicTheme } from "../styles/organicTheme";
import { RowSkeleton, ChatHistorySkeleton } from "../components/SkeletonLoaders";

const SUPPORT_SEEN_STORAGE_KEY = "support-ticket-seen-map-v2";

const CATEGORIES = [
  "General Feedback",
  "Technical Issue",
  "Billing / Subscription Issue",
  "Verification/Profile",
  "Other",
];

const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

const normalizeAudioMimeType = (mimeType = "") =>
  String(mimeType).split(";")[0].trim().toLowerCase();
const getSupportedRecorderMimeType = () => {
  if (
    typeof window === "undefined" ||
    typeof window.MediaRecorder === "undefined"
  )
    return "audio/webm";
  return (
    RECORDER_MIME_CANDIDATES.find((type) =>
      window.MediaRecorder.isTypeSupported?.(type),
    ) || "audio/webm"
  );
};
const getAudioExtension = (mimeType = "") => {
  const normalized = normalizeAudioMimeType(mimeType);
  if (normalized.includes("ogg")) return "ogg";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("wav")) return "wav";
  if (normalized.includes("mp4") || normalized.includes("m4a")) return "m4a";
  if (normalized.includes("aac")) return "aac";
  return "webm";
};

const chatCanvasStyle = {
  backgroundColor:
    "color-mix(in srgb, var(--color-bg-soft) 78%, var(--color-card) 22%)",
  backgroundImage:
    "radial-gradient(circle at 12px 12px, color-mix(in srgb, var(--color-primary) 18%, transparent) 1.5px, transparent 0)",
  backgroundSize: "28px 28px",
};

const sentVoiceTheme = {
  surface:
    "color-mix(in srgb, var(--color-primary) 18%, var(--color-card) 82%)",
  border: "color-mix(in srgb, var(--color-primary) 34%, transparent)",
  accent: "var(--color-primary)",
};

const receivedVoiceTheme = {
  surface:
    "color-mix(in srgb, var(--color-card-elevated) 90%, var(--color-bg) 10%)",
  border: "color-mix(in srgb, var(--color-border) 80%, transparent)",
  accent: "var(--color-primary)",
};

function StatusChip({ status }) {
  const resolved = status === "Resolved" || status === "Closed";
  return (
    <span
      className={
        resolved
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[11px]"
          : "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 font-bold px-2.5 py-0.5 rounded-full text-[11px]"
      }
    >
      {status}
    </span>
  );
}

export default function SupportCenterPage() {
  const currentRole = "doctor";
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
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1280 : false,
  );
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
  const messageNodesRef = useRef(new Map());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const sendAfterRecordingRef = useRef(false);
  const seenMessageIdsByTicketRef = useRef(new Map());

  const scrollMessagesToBottom = () => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
    setShowJumpToLatest(false);
  };

  const updateJumpToLatestVisibility = () => {
    const container = messagesContainerRef.current;
    if (!container) {
      setShowJumpToLatest(false);
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 96);
  };

  const shouldShowTimestamp = (messages, index) => {
    const current = messages[index];
    if (!current?.createdAt) return true;
    if (index === messages.length - 1) return true;

    const next = messages[index + 1];
    if (!next?.createdAt) return true;
    if (String(next.senderRole || "") !== String(current.senderRole || ""))
      return true;

    const currentTime = new Date(current.createdAt).getTime();
    const nextTime = new Date(next.createdAt).getTime();
    if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime))
      return true;

    return nextTime - currentTime > 5 * 60 * 1000;
  };

  const patchTicketMessages = (ticketId, updater) => {
    const normalizedTicketId = String(ticketId || "");
    if (!normalizedTicketId) return;

    setSelectedTicket((prev) => {
      if (!prev || String(prev._id) !== normalizedTicketId) return prev;
      const currentMessages = Array.isArray(prev.messages) ? prev.messages : [];
      const nextMessages = updater(currentMessages);
      if (nextMessages === currentMessages) return prev;
      return { ...prev, messages: nextMessages };
    });

    setTickets((prev) =>
      prev.map((ticket) => {
        if (String(ticket?._id) !== normalizedTicketId) return ticket;
        const currentMessages = Array.isArray(ticket?.messages)
          ? ticket.messages
          : [];
        const nextMessages = updater(currentMessages);
        if (nextMessages === currentMessages) return ticket;
        return { ...ticket, messages: nextMessages };
      }),
    );
  };

  const patchIssueMessageStatuses = ({
    ticketId,
    messageIds = [],
    status,
    deliveredAt,
    seenAt,
  }) => {
    const normalizedIds = (messageIds || []).map(String).filter(Boolean);
    if (!ticketId || normalizedIds.length === 0) return;

    const idSet = new Set(normalizedIds);
    patchTicketMessages(ticketId, (messages) => {
      let changed = false;
      const next = messages.map((message) => {
        const messageId = String(message?._id || "");
        if (!messageId || !idSet.has(messageId)) return message;
        changed = true;
        return {
          ...message,
          status: status || message.status,
          deliveredAt: deliveredAt || message.deliveredAt,
          seenAt: seenAt || message.seenAt,
        };
      });
      return changed ? next : messages;
    });
  };

  const emitVisibleSeenMessages = () => {
    const ticketId = String(selectedId || "");
    const container = messagesContainerRef.current;
    if (!ticketId || !container || !selectedTicket?.messages?.length) return;

    const ticketSeenSet =
      seenMessageIdsByTicketRef.current.get(ticketId) || new Set();
    const containerRect = container.getBoundingClientRect();
    const visibleMessageIds = [];

    for (const message of selectedTicket.messages) {
      if (String(message.senderRole || "") === currentRole) continue;
      const messageId = String(message._id || "");
      if (!messageId || ticketSeenSet.has(messageId)) continue;
      const node = messageNodesRef.current.get(messageId);
      if (!node) continue;

      const rect = node.getBoundingClientRect();
      const visibleHeight =
        Math.min(rect.bottom, containerRect.bottom) -
        Math.max(rect.top, containerRect.top);
      if (visibleHeight <= 0) continue;

      const threshold = Math.min(rect.height, containerRect.height) * 0.45;
      if (visibleHeight >= threshold) {
        visibleMessageIds.push(messageId);
        ticketSeenSet.add(messageId);
      }
    }

    if (visibleMessageIds.length === 0) return;

    seenMessageIdsByTicketRef.current.set(ticketId, ticketSeenSet);
    patchIssueMessageStatuses({
      ticketId,
      messageIds: visibleMessageIds,
      status: "seen",
      seenAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    });

    const socket = getRealtimeSocketForRole(currentRole);
    socket.emit("issue-message_seen", {
      ticketId,
      messageIds: visibleMessageIds,
    });
  };

  const loadTickets = async (history) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(
        `/issues/doctor?history=${history ? "true" : "false"}&limit=50`,
      );
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
    return isHistory
      ? ["Resolved", "Closed"].includes(status)
      : !["Resolved", "Closed"].includes(status);
  };

  const upsertVisibleTicket = (ticket, tab) => {
    if (!ticket?._id) return;

    setTickets((prev) => {
      const shouldInclude = ticketMatchesTab(ticket, tab);
      const next = prev.filter(
        (item) => String(item._id) !== String(ticket._id),
      );
      return shouldInclude ? [ticket, ...next] : next;
    });
  };

  useEffect(() => {
    loadTickets(activeTab === "history");
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

    const handleIssueMessageDelivered = ({
      ticketId,
      messageIds = [],
      status,
      deliveredAt,
    } = {}) => {
      patchIssueMessageStatuses({
        ticketId,
        messageIds,
        status: status || "delivered",
        deliveredAt: deliveredAt || new Date().toISOString(),
      });
    };

    const handleIssueMessageSeen = ({
      ticketId,
      messageIds = [],
      status,
      seenAt,
      deliveredAt,
    } = {}) => {
      patchIssueMessageStatuses({
        ticketId,
        messageIds,
        status: status || "seen",
        seenAt: seenAt || new Date().toISOString(),
        deliveredAt: deliveredAt || new Date().toISOString(),
      });
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
    socket.on("issue-message_delivered", handleIssueMessageDelivered);
    socket.on("issue-message_seen", handleIssueMessageSeen);
    socket.on("connect_error", handleSocketError);

    return () => {
      socket.off("connect", handleReconnectSync);
      socket.off("issue-ticket:list-updated", handleTicketUpdate);
      socket.off("issue-ticket:detail-updated", handleTicketDetailUpdate);
      socket.off("issue-message_delivered", handleIssueMessageDelivered);
      socket.off("issue-message_seen", handleIssueMessageSeen);
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
    const timeoutId = window.setTimeout(() => {
      emitVisibleSeenMessages();
    }, 160);
    return () => window.clearTimeout(timeoutId);
  }, [selectedTicket?.messages, optimisticMessages, selectedId]);

  useEffect(() => {
    setOptimisticMessages([]);
    setAttachments([]);
    setMessageText("");
    setVoiceDraft(null);
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    stopRecordingTimer();
    sendAfterRecordingRef.current = false;
    if (selectedId) {
      seenMessageIdsByTicketRef.current.set(String(selectedId), new Set());
    }
  }, [selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SUPPORT_SEEN_STORAGE_KEY,
      JSON.stringify(seenIncomingAtByTicket),
    );
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

  const getTicketById = (ticketId) =>
    tickets.find((ticket) => String(ticket?._id) === String(ticketId));

  const getTicketLastMessage = (ticket) => {
    const list = Array.isArray(ticket?.messages) ? ticket.messages : [];
    return list[list.length - 1] || null;
  };

  const getTicketLastMessageTime = (ticket) => {
    const lastMessage = getTicketLastMessage(ticket);
    const source =
      lastMessage?.createdAt ||
      ticket?.lastMessageAt ||
      ticket?.updatedAt ||
      ticket?.createdAt;
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
      markTicketAsSeenLocally(
        selectedId,
        selectedTicket || getTicketById(selectedId),
      );
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
    const outgoingFiles = voiceDraft?.file
      ? [...attachments, voiceDraft.file]
      : attachments;
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

      await axiosInstance.post(
        `/issues/doctor/${selectedTicket._id}/messages`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
    } catch (error) {
      optimisticAttachments.forEach((item) => URL.revokeObjectURL(item.url));
      setOptimisticMessages((prev) =>
        prev.filter((item) => item._id !== optimisticId),
      );
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (isRecording) {
        stopVoiceRecording({ sendAfter: true });
        return;
      }
      sendMessage();
    }
  };

  useEffect(() => {
    if (!voiceDraft?.file || !sendAfterRecordingRef.current) return;
    sendAfterRecordingRef.current = false;
    sendMessage();
  }, [voiceDraft]);

  const startRecordingTimer = () => {
    if (recordingTimerRef.current) return;
    recordingTimerRef.current = setInterval(() => {
      recordingTimeRef.current += 1;
      setRecordingTime(recordingTimeRef.current);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (!recordingTimerRef.current) return;
    clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  };

  const isImageFile = (file) => {
    const mimeType = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();
    return (
      mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(name)
    );
  };

  const isAudioAttachment = (attachment) => {
    const mimeType = String(attachment?.mimeType || "").toLowerCase();
    const name = String(attachment?.name || "").toLowerCase();
    return (
      mimeType.startsWith("audio/") ||
      /\.(webm|ogg|mp3|wav|m4a|aac)$/i.test(name)
    );
  };

  const isImageAttachment = (attachment) => {
    const mimeType = String(attachment?.mimeType || "").toLowerCase();
    const name = String(attachment?.name || "").toLowerCase();
    const url = String(attachment?.url || "").toLowerCase();
    return (
      mimeType.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp|bmp)$/i.test(name) ||
      /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url)
    );
  };

  const getAttachmentKey = (file) =>
    `${file.name}-${file.size}-${file.lastModified}`;

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
      sendAfterRecordingRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = getSupportedRecorderMimeType();
      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: preferredMimeType });
      } catch {
        recorder = new MediaRecorder(stream);
      }
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopRecordingTimer();
        const mimeType =
          normalizeAudioMimeType(
            recorder.mimeType || preferredMimeType || "audio/webm",
          ) || "audio/webm";
        if (discardRecordingRef.current) {
          audioChunksRef.current = [];
          stream.getTracks().forEach((track) => track.stop());
          setRecordingTime(0);
          setIsRecording(false);
          setIsRecordingPaused(false);
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          stream.getTracks().forEach((track) => track.stop());
          setRecordingTime(0);
          setIsRecording(false);
          setIsRecordingPaused(false);
          toast.error("Recorded audio is empty");
          return;
        }

        const ext = getAudioExtension(mimeType);
        const voiceFile = new File([blob], `voice-note-${Date.now()}.${ext}`, {
          type: mimeType,
        });
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
        setIsRecording(false);
        setIsRecordingPaused(false);
        toast.success("Voice note ready");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      startRecordingTimer();
    } catch {
      toast.error("Microphone access is required");
    }
  };

  const stopVoiceRecording = ({ sendAfter = false } = {}) => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === "inactive"
    )
      return;
    discardRecordingRef.current = false;
    sendAfterRecordingRef.current = Boolean(sendAfter);
    mediaRecorderRef.current.stop();
    stopRecordingTimer();
  };

  const cancelRecording = () => {
    discardRecordingRef.current = true;
    sendAfterRecordingRef.current = false;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    audioChunksRef.current = [];
    stopRecordingTimer();
    toast.info("Recording cancelled");
  };

  const togglePauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    if (recorder.state === "paused") {
      recorder.resume();
      setIsRecordingPaused(false);
      startRecordingTimer();
      return;
    }

    if (recorder.state === "recording") {
      recorder.pause();
      setIsRecordingPaused(true);
      stopRecordingTimer();
    }
  };

  const isTicketLoading = Boolean(selectedId) && (!selectedTicket || String(selectedTicket._id) !== String(selectedId));
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

  const canReopen = useMemo(
    () => selectedTicket?.status === "Resolved",
    [selectedTicket?.status],
  );

  const reopenIssue = async () => {
    if (!selectedTicket?._id) return;
    try {
      await axiosInstance.patch(`/issues/doctor/${selectedTicket._id}/status`, {
        status: "Reopened",
      });
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
          style={{
            background: "rgba(93,112,82,0.18)",
            borderRadius: organicTheme.radii.blobA,
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 blur-3xl"
          style={{
            background: "rgba(193,140,93,0.2)",
            borderRadius: organicTheme.radii.blobB,
          }}
        />

        {showIssueListPane ? (
          <section className="xl:col-span-4 h-[calc(100dvh-9rem)] overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-12 w-12 rounded-2xl flex items-center justify-center bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                <LifeBuoy size={22} />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Support Center
                </h2>
                <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                  Create a ticket to chat with admin support.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
                Category
              </label>
              <select
                value={newIssue.category}
                onChange={(e) =>
                  setNewIssue((p) => ({ ...p, category: e.target.value }))
                }
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl p-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-full placeholder:text-slate-400 shadow-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
                Title
              </label>
              <input
                value={newIssue.title}
                onChange={(e) =>
                  setNewIssue((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Issue title"
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl p-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-full placeholder:text-slate-400 shadow-xs"
              />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
                Description
              </label>
              <textarea
                value={newIssue.description}
                onChange={(e) =>
                  setNewIssue((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Describe your feedback/problem"
                rows={4}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl p-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-full placeholder:text-slate-400 shadow-xs resize-none"
              />
              <button
                onClick={handleCreateIssue}
                disabled={isCreating}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm w-full disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <Ticket size={16} />
                {isCreating ? "Creating..." : "Create Issue"}
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setActiveTab("active")}
                aria-pressed={activeTab === "active"}
                className={
                  activeTab === "active"
                    ? "bg-teal-600 text-white font-bold shadow-xs px-4 py-1.5 rounded-full text-xs inline-flex items-center gap-1.5"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                }
              >
                <Sparkles size={13} />
                Active
              </button>
              <button
                onClick={() => setActiveTab("history")}
                aria-pressed={activeTab === "history"}
                className={
                  activeTab === "history"
                    ? "bg-teal-600 text-white font-bold shadow-xs px-4 py-1.5 rounded-full text-xs inline-flex items-center gap-1.5"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                }
              >
                <History size={13} />
                History
              </button>
            </div>

            <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <RowSkeleton key={i} hasAvatar={false} />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No issues found.
                </p>
              ) : (
                <>
                  {newChats.length > 0 ? (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                        New chats
                      </p>
                      <div className="space-y-2">
                        {newChats.map((t) => (
                          <button
                            key={t._id}
                            onClick={() => handleSelectTicket(t._id, t)}
                            className={
                              selectedId === t._id
                                ? "w-full text-left bg-teal-50/70 dark:bg-teal-950/40 border-2 border-teal-500 rounded-xl p-4 mb-2 shadow-xs cursor-pointer"
                                : "w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-2 hover:border-teal-400 cursor-pointer transition-colors"
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                {t.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                                  New update
                                </span>
                                <StatusChip status={t.status} />
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                              {t.category}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {otherChats.length > 0 ? (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
                        All chats
                      </p>
                      <div className="space-y-2">
                        {otherChats.map((t) => (
                          <button
                            key={t._id}
                            onClick={() => handleSelectTicket(t._id, t)}
                            className={
                              selectedId === t._id
                                ? "w-full text-left bg-teal-50/70 dark:bg-teal-950/40 border-2 border-teal-500 rounded-xl p-4 mb-2 shadow-xs cursor-pointer"
                                : "w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-2 hover:border-teal-400 cursor-pointer transition-colors"
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                {t.title}
                              </p>
                              <StatusChip status={t.status} />
                            </div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                              {t.category}
                            </p>
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
          <section className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]">
            {!selectedId ? (
              <div className="text-slate-500 dark:text-slate-400 font-bold text-base flex flex-col items-center justify-center h-full">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">
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
                <p>Select an issue to open the chat.</p>
              </div>
            ) : (
              <>
                {isTicketLoading && !selectedTicket ? (
                  <div
                    className="flex items-start justify-between gap-3 border-b pb-3 skeleton-pulse"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--color-border) 80%, transparent)",
                    }}
                  >
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
                      <div className="h-6 w-48 rounded bg-[var(--color-text-secondary)]/20 mb-2"></div>
                      <div className="h-4 w-32 rounded bg-[var(--color-text-secondary)]/15 mt-1"></div>
                    </div>
                    <div className="h-6 w-16 rounded-full bg-[var(--color-text-secondary)]/20"></div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
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
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedTicket?.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 inline-flex items-center gap-1.5">
                        <MessageCircle size={12} /> {selectedTicket?.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTicket && <StatusChip status={selectedTicket.status} />}
                      {canReopen && (
                        <button
                          onClick={reopenIssue}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl hover:border-teal-500 inline-flex items-center gap-1"
                        >
                          <RefreshCw size={12} />
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative min-h-0 flex-1">
                  <div
                    ref={messagesContainerRef}
                    onScroll={() => {
                      updateJumpToLatestVisibility();
                      emitVisibleSeenMessages();
                    }}
                    className="h-full overflow-y-auto py-3 space-y-2 rounded-2xl px-2"
                    style={chatCanvasStyle}
                  >
                    {isTicketLoading ? (
                      <ChatHistorySkeleton />
                    ) : (
                      messages.map((m, index) => (
                        <div
                          key={m._id || `${m.senderRole}-${m.createdAt}`}
                          ref={(node) => {
                            const messageId = String(m._id || "");
                            if (!messageId) return;
                            if (node) {
                              messageNodesRef.current.set(messageId, node);
                            } else {
                              messageNodesRef.current.delete(messageId);
                            }
                          }}
                          data-message-id={m._id || ""}
                          data-sender-role={m.senderRole || ""}
                          className={`flex ${m.senderRole === "doctor" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={
                              m.senderRole === "doctor"
                                ? "bg-teal-600 text-white rounded-2xl rounded-tr-none p-3.5 max-w-[75%] shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-3.5 max-w-[75%] shadow-xs"
                            }
                          >
                            <p
                              className={
                                m.senderRole === "doctor"
                                  ? "text-[11px] font-semibold mb-0.5 text-teal-100"
                                  : "text-[11px] font-semibold mb-0.5 text-slate-500 dark:text-slate-400"
                              }
                            >
                              {m.senderName}
                            </p>
                            {m.text ? (
                              <p
                                className={
                                  m.senderRole === "doctor"
                                    ? "text-sm font-medium leading-relaxed text-white whitespace-pre-wrap"
                                    : "text-sm font-medium leading-relaxed text-slate-900 dark:text-white whitespace-pre-wrap"
                                }
                              >
                                {m.text}
                              </p>
                            ) : null}
                            {(m.attachments || []).length > 0 ? (
                              <div className="mt-2 space-y-2">
                                {m.attachments.map((attachment) =>
                                  isImageAttachment(attachment) ? (
                                    <button
                                      type="button"
                                      key={attachment.url}
                                      onClick={() =>
                                        setPreviewImage({
                                          url: attachment.url,
                                          name: attachment.name,
                                        })
                                      }
                                      className="block overflow-hidden rounded-xl border border-[var(--color-border)]/80"
                                    >
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        loading="lazy"
                                        onLoad={scrollMessagesToBottom}
                                        className="max-h-64 w-full object-cover"
                                      />
                                    </button>
                                  ) : isAudioAttachment(attachment) ? (
                                    <VoiceMessagePlayer
                                      key={attachment.url}
                                      src={attachment.url}
                                      title={attachment.name}
                                      badge={
                                        m.senderRole === "doctor"
                                          ? "Sent voice"
                                          : "Admin voice"
                                      }
                                      theme={
                                        m.senderRole === "doctor"
                                          ? sentVoiceTheme
                                          : receivedVoiceTheme
                                      }
                                    />
                                  ) : (
                                    <a
                                      key={attachment.url}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block rounded-xl border border-[var(--color-border)]/80 px-3 py-2 text-xs text-[var(--color-primary)] hover:underline"
                                    >
                                      {attachment.name}
                                    </a>
                                  ),
                                )}
                              </div>
                            ) : null}
                            {shouldShowTimestamp(messages, index) ? (
                              <p
                                className={
                                  m.senderRole === "doctor"
                                    ? "text-[10px] text-teal-100 font-semibold mt-1 text-right block"
                                    : "text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block"
                                }
                              >
                                <span>
                                  {m.createdAt
                                    ? new Date(m.createdAt).toLocaleTimeString(
                                        "en-PK",
                                        { hour: "2-digit", minute: "2-digit" },
                                      )
                                    : ""}
                                </span>
                                {m.senderRole === currentRole ? (
                                  <MessageStatusTicks
                                    status={m.status || "sent"}
                                  />
                                ) : null}
                              </p>
                            ) : (
                              <p
                                className={
                                  m.senderRole === "doctor"
                                    ? "text-[10px] text-teal-100 font-semibold mt-1 text-right block"
                                    : "text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block"
                                }
                              >
                                {m.senderRole === currentRole ? (
                                  <MessageStatusTicks
                                    status={m.status || "sent"}
                                  />
                                ) : null}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {showJumpToLatest ? (
                    <button
                      type="button"
                      onClick={scrollMessagesToBottom}
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur"
                      style={{
                        borderColor: "rgba(93,112,82,0.45)",
                        background:
                          "color-mix(in srgb, var(--color-card) 74%, var(--color-primary) 26%)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      New messages
                    </button>
                  ) : null}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 p-3">
                  {isRecording ? (
                    <div
                      className="mb-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full"
                      style={{
                        background:
                          "color-mix(in srgb, var(--color-danger) 14%, transparent)",
                        borderColor:
                          "color-mix(in srgb, var(--color-danger) 34%, transparent)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-[var(--color-danger)]">
                          {isRecordingPaused ? "Paused" : "Recording..."}{" "}
                          {formatTime(recordingTime)}
                        </span>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="rounded-full p-2.5 transition"
                          style={{
                            background:
                              "color-mix(in srgb, var(--color-danger) 26%, transparent)",
                            color: "var(--color-danger)",
                          }}
                          aria-label="Discard recording"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={togglePauseRecording}
                          className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          {isRecordingPaused ? (
                            <span className="inline-flex items-center gap-1">
                              <Play className="h-3.5 w-3.5" />
                              Resume
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Pause className="h-3.5 w-3.5" />
                              Pause
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            stopVoiceRecording({ sendAfter: true })
                          }
                          className="rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white hover:bg-green-600"
                        >
                          Send
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
                        action={
                          <button
                            type="button"
                            onClick={() => discardVoiceDraft(true)}
                            className="rounded-full p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10"
                            aria-label="Discard voice note"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        }
                      />
                    </div>
                  ) : null}

                  {attachments.length > 0 ? (
                    <div className="mb-3 space-y-2">
                      {attachments.map((file, idx) =>
                        isImageFile(file) ? (
                          <div
                            key={idx}
                            className="relative overflow-hidden rounded-2xl border border-[var(--color-border)]/80 p-2"
                            style={{
                              background:
                                "color-mix(in srgb, var(--color-card-elevated) 82%, var(--color-bg) 18%)",
                            }}
                          >
                            <img
                              src={imagePreviewUrls.get(getAttachmentKey(file))}
                              alt={file.name}
                              className="h-28 w-28 rounded-xl object-cover"
                            />
                            <p className="mt-1 w-28 truncate text-[11px] font-medium text-[var(--color-text-secondary)]">
                              {file.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="absolute right-2 top-2 rounded-full bg-black/65 p-1 text-white"
                              aria-label="Remove image"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--color-primary) 38%, transparent)",
                              background:
                                "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                            }}
                          >
                            <span className="max-w-[220px] truncate font-medium text-[var(--color-primary)]">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="font-bold text-[var(--color-primary)]"
                            >
                              ✕
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.webm,.ogg,.mp3,.wav,.m4a,.aac"
                      onChange={(e) =>
                        setAttachments((prev) => [
                          ...prev,
                          ...Array.from(e.target.files || []),
                        ])
                      }
                      className="hidden"
                    />

                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleMessageKeyDown}
                      placeholder="Write message..."
                      rows={1}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:border-teal-500 focus:outline-none flex-1 placeholder:text-slate-400 max-h-32 min-h-[44px] resize-none"
                    />
                    {isRecording ||
                    messageText.trim() ||
                    attachments.length > 0 ||
                    voiceDraft?.file ? (
                      <button
                        onClick={() => {
                          if (isRecording) {
                            stopVoiceRecording({ sendAfter: true });
                            return;
                          }
                          sendMessage();
                        }}
                        disabled={isSending}
                        className="rounded-full px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                        style={{
                          background: organicTheme.colors.primary,
                          boxShadow: organicTheme.shadows.button,
                        }}
                      >
                        <Send size={14} />
                        Send
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          isRecording ? stopVoiceRecording : startVoiceRecording
                        }
                        className={
                          isRecording
                            ? "bg-rose-600 text-white animate-pulse p-2.5 rounded-xl shadow-md"
                            : "p-2.5 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                        }
                      >
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
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"
            aria-label="Close image preview"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewImage.url}
            alt={previewImage.name}
            className="max-h-[90dvh] max-w-[92vw] rounded-xl object-contain"
          />
        </div>
      ) : null}
    </>
  );
}
