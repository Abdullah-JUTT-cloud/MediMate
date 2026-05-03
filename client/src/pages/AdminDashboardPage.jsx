/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  Building2,
  LifeBuoy,
  LogOut,
  Mic,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import MessageStatusTicks from "../components/MessageStatusTicks";
import VerifiedBadge from "../components/VerifiedBadge";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";
import { getRealtimeSocketForRole } from "../realtime/socket";
import {
  cyberCardStyle,
  cyberInputStyle,
  cyberpunkTheme,
} from "../styles/cyberpunkTheme";
import "../styles/cyberpunk.css";

const VERIFY_STATUS_OPTIONS = [
  "Pending",
  "In Review",
  "Needs Changes",
  "Verified",
];
const ISSUE_STATUS_OPTIONS = ["In Progress", "Resolved", "Closed"];
const ADMIN_ISSUE_SEEN_STORAGE_KEY = "admin-issue-seen-map-v1";
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

const isDoctorVerified = (status) => ["Verified", "Approved"].includes(status);
const normalizeStatusLabel = (status) =>
  status === "Approved" ? "Verified" : status || "Pending";

function StatusPill({ value }) {
  const status = normalizeStatusLabel(value);
  const tone = {
    Pending: {
      color: cyberpunkTheme.colors.accentTertiary,
      bg: "rgba(0,212,255,0.12)",
      border: "rgba(0,212,255,0.35)",
    },
    "In Review": {
      color: cyberpunkTheme.colors.accent,
      bg: "rgba(0,255,136,0.12)",
      border: "rgba(0,255,136,0.35)",
    },
    "Needs Changes": {
      color: cyberpunkTheme.colors.accentSecondary,
      bg: "rgba(255,0,255,0.12)",
      border: "rgba(255,0,255,0.35)",
    },
    Verified: {
      color: cyberpunkTheme.colors.accent,
      bg: "rgba(0,255,136,0.15)",
      border: "rgba(0,255,136,0.4)",
    },
    Open: {
      color: cyberpunkTheme.colors.accentTertiary,
      bg: "rgba(0,212,255,0.12)",
      border: "rgba(0,212,255,0.35)",
    },
    "In Progress": {
      color: cyberpunkTheme.colors.accent,
      bg: "rgba(0,255,136,0.12)",
      border: "rgba(0,255,136,0.35)",
    },
    Resolved: {
      color: cyberpunkTheme.colors.accent,
      bg: "rgba(0,255,136,0.15)",
      border: "rgba(0,255,136,0.4)",
    },
    Reopened: {
      color: cyberpunkTheme.colors.accentSecondary,
      bg: "rgba(255,0,255,0.12)",
      border: "rgba(255,0,255,0.35)",
    },
    Closed: {
      color: "var(--color-text-secondary)",
      bg: "rgba(107,114,128,0.1)",
      border: "rgba(107,114,128,0.3)",
    },
  };
  const state = tone[status] || tone.Pending;

  return (
    <span
      className="cyber-label inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
      style={{
        color: state.color,
        background: state.bg,
        borderColor: state.border,
      }}
    >
      {status}
    </span>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div
      className="cyber-chamfer-sm border p-3"
      style={{
        background: cyberpunkTheme.colors.muted,
        borderColor: cyberpunkTheme.colors.border,
      }}
    >
      <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className="cyber-text mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
        {value || "-"}
      </p>
    </div>
  );
}

const cyberSentVoiceTheme = {
  surface: "rgba(0,255,136,0.12)",
  border: "rgba(0,255,136,0.32)",
  accent: cyberpunkTheme.colors.accent,
  accentSoft: "rgba(0,255,136,0.12)",
  text: "var(--color-text-primary)",
  muted: "var(--color-text-secondary)",
};

const cyberReceivedVoiceTheme = {
  surface: "rgba(10,18,20,0.92)",
  border: "rgba(0,212,255,0.22)",
  accent: cyberpunkTheme.colors.accentTertiary,
  accentSoft: "rgba(0,212,255,0.1)",
  text: "var(--color-text-primary)",
  muted: "var(--color-text-secondary)",
};

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
  const [seenIncomingAtByIssue, setSeenIncomingAtByIssue] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(ADMIN_ISSUE_SEEN_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [attachments, setAttachments] = useState([]);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const sendAfterRecordingRef = useRef(false);
  const seenMessageIdsByIssueRef = useRef(new Map());

  const patchIssueMessageStatuses = ({
    ticketId,
    messageIds = [],
    status,
    deliveredAt,
    seenAt,
  }) => {
    const normalizedTicketId = String(ticketId || "");
    if (!normalizedTicketId) return;

    const idSet = new Set((messageIds || []).map(String));
    if (idSet.size === 0) return;

    const applyPatch = (list = []) => {
      let changed = false;
      const next = list.map((message) => {
        const messageId = String(message?._id || "");
        if (!messageId || !idSet.has(messageId)) {
          return message;
        }

        changed = true;
        return {
          ...message,
          status: status || message.status,
          deliveredAt: deliveredAt || message.deliveredAt,
          seenAt: seenAt || message.seenAt,
        };
      });

      return changed ? next : list;
    };

    setSelectedTicket((prev) => {
      if (!prev || String(prev._id) !== normalizedTicketId) return prev;
      const nextMessages = applyPatch(prev.messages || []);
      if (nextMessages === (prev.messages || [])) return prev;
      return { ...prev, messages: nextMessages };
    });

    setTickets((prev) =>
      prev.map((ticket) => {
        if (String(ticket?._id) !== normalizedTicketId) return ticket;
        const nextMessages = applyPatch(ticket.messages || []);
        if (nextMessages === (ticket.messages || [])) return ticket;
        return { ...ticket, messages: nextMessages };
      }),
    );
  };

  const emitVisibleSeenMessages = () => {
    const ticketId = String(selectedTicketId || "");
    const container = messagesContainerRef.current;
    if (!ticketId || !container || !selectedTicket) return;

    const ticketSeenSet =
      seenMessageIdsByIssueRef.current.get(ticketId) || new Set();
    const rect = container.getBoundingClientRect();
    const visibleMessageIds = [];

    for (const element of container.querySelectorAll(
      "[data-message-id][data-sender-role='doctor']",
    )) {
      const messageId = String(element.getAttribute("data-message-id") || "");
      if (!messageId || ticketSeenSet.has(messageId)) continue;
      const top = element.getBoundingClientRect().top;
      const bottom = element.getBoundingClientRect().bottom;
      const isVisible = bottom > rect.top + 12 && top < rect.bottom - 12;
      if (!isVisible) continue;

      const message = (selectedTicket.messages || []).find(
        (item) => String(item?._id || "") === messageId,
      );
      if (!message || message.status === "seen") continue;

      visibleMessageIds.push(messageId);
      ticketSeenSet.add(messageId);
    }

    if (visibleMessageIds.length === 0) return;

    seenMessageIdsByIssueRef.current.set(ticketId, ticketSeenSet);
    const socket = getRealtimeSocketForRole("admin");
    socket.emit("issue-message_seen", {
      ticketId,
      messageIds: visibleMessageIds,
    });
  };

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
      const res = await axiosInstance.get(
        `/admin/doctors?${params.toString()}`,
      );
      const list = Array.isArray(res.data?.doctors) ? res.data.doctors : [];
      setDoctors(list);
      if (!selectedDoctorId && list.length > 0)
        setSelectedDoctorId(list[0]._id);
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
        axiosInstance.get(
          `/issues/admin?doctorId=${selectedDoctorId}&history=true&limit=20`,
        ),
        axiosInstance.get(
          `/issues/admin?doctorId=${selectedDoctorId}&history=false&limit=20`,
        ),
      ]);

      const d = doctorRes.data?.doctor;
      setSelectedDoctor(d || null);
      setVerificationStatus(normalizeStatusLabel(d?.profileVerificationStatus));
      setVerificationNotes(d?.profileVerificationNotes || "");
      setDoctorIssueHistory(
        Array.isArray(historyRes.data?.tickets) ? historyRes.data.tickets : [],
      );
      setDoctorActiveIssues(
        Array.isArray(activeRes.data?.tickets) ? activeRes.data.tickets : [],
      );
    } catch {
      setSelectedDoctor(null);
      setDoctorIssueHistory([]);
      setDoctorActiveIssues([]);
    }
  };

  const updateVerification = async () => {
    if (!selectedDoctor?._id) return;
    try {
      await axiosInstance.patch(
        `/admin/doctors/${selectedDoctor._id}/verification-status`,
        {
          status: verificationStatus,
          notes: verificationNotes,
        },
      );
      toast.success("Verification updated");
      await Promise.all([loadDoctors(), loadDoctorDetail()]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update verification",
      );
    }
  };

  const loadTickets = async () => {
    try {
      const history = ticketFilter === "history" ? "true" : "false";
      const res = await axiosInstance.get(
        `/issues/admin?history=${history}&limit=50`,
      );
      const list = Array.isArray(res.data?.tickets) ? res.data.tickets : [];
      setTickets(list);
      if (!selectedTicketId && list.length > 0)
        setSelectedTicketId(list[0]._id);
      if (selectedTicketId && !list.some((t) => t._id === selectedTicketId)) {
        setSelectedTicketId(list[0]?._id || "");
      }
    } catch {
      toast.error("Failed to load support tickets");
    }
  };

  const loadTicketDetail = async (ticketId = selectedTicketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }
    try {
      const res = await axiosInstance.get(`/issues/admin/${ticketId}`);
      setSelectedTicket(res.data?.ticket || null);
    } catch {
      setSelectedTicket(null);
    }
  };

  const ticketMatchesFilter = (ticket, filter) => {
    const status = String(ticket?.status || "");
    return filter === "history"
      ? ["Resolved", "Closed"].includes(status)
      : !["Resolved", "Closed"].includes(status);
  };

  const upsertVisibleAdminTicket = (ticket, filter) => {
    if (!ticket?._id) return;

    setTickets((prev) => {
      const shouldInclude = ticketMatchesFilter(ticket, filter);
      const next = prev.filter(
        (item) => String(item._id) !== String(ticket._id),
      );
      return shouldInclude ? [ticket, ...next] : next;
    });
  };

  const syncSelectedDoctorIssues = (ticket) => {
    const ticketDoctorId = String(ticket?.doctor?._id || ticket?.doctor || "");
    if (!ticketDoctorId || ticketDoctorId !== String(selectedDoctorId || ""))
      return;

    const isHistoryTicket = ["Resolved", "Closed"].includes(
      String(ticket?.status || ""),
    );

    setDoctorActiveIssues((prev) => {
      const next = prev.filter(
        (item) => String(item._id) !== String(ticket._id),
      );
      return isHistoryTicket ? next : [ticket, ...next];
    });

    setDoctorIssueHistory((prev) => {
      const next = prev.filter(
        (item) => String(item._id) !== String(ticket._id),
      );
      return isHistoryTicket ? [ticket, ...next] : next;
    });
  };

  const sendAdminReply = async () => {
    if (!selectedTicket?._id) return;

    const textToSend = String(adminReply || "").trim();
    const outgoingFiles = voiceDraft?.file
      ? [...attachments, voiceDraft.file]
      : attachments;
    if (!textToSend && outgoingFiles.length === 0) return;

    setIsSendingReply(true);

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
      senderRole: "admin",
      senderName: admin?.name || "Admin",
      text: textToSend,
      attachments: optimisticAttachments,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setAdminReply("");
    setAttachments([]);
    if (voiceDraft?.previewUrl) {
      URL.revokeObjectURL(voiceDraft.previewUrl);
    }
    setVoiceDraft(null);

    try {
      const formData = new FormData();
      if (textToSend) {
        formData.append("text", textToSend);
      }
      outgoingFiles.forEach((file) => formData.append("attachments", file));

      await axiosInstance.post(
        `/issues/admin/${selectedTicket._id}/messages`,
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
      toast.error(error.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleReplyKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (isRecording) {
        stopVoiceRecording({ sendAfter: true });
        return;
      }
      sendAdminReply();
    }
  };

  useEffect(() => {
    if (!voiceDraft?.file || !sendAfterRecordingRef.current) return;
    sendAfterRecordingRef.current = false;
    sendAdminReply();
  }, [voiceDraft]);

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

  useEffect(
    () => () => {
      if (voiceDraft?.previewUrl) {
        URL.revokeObjectURL(voiceDraft.previewUrl);
      }
    },
    [voiceDraft],
  );

  useEffect(() => {
    scrollMessagesToBottom();
    const timeoutId = window.setTimeout(scrollMessagesToBottom, 120);
    return () => window.clearTimeout(timeoutId);
  }, [selectedTicket?.messages, optimisticMessages]);

  useEffect(() => {
    requestAnimationFrame(scrollMessagesToBottom);
  }, [selectedTicketId]);

  useEffect(() => {
    updateJumpToLatestVisibility();
  }, [selectedTicket?.messages, optimisticMessages, selectedTicketId]);

  useEffect(() => {
    setOptimisticMessages([]);
    setAdminReply("");
    setAttachments([]);
    if (voiceDraft?.previewUrl) {
      URL.revokeObjectURL(voiceDraft.previewUrl);
    }
    setVoiceDraft(null);
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    stopRecordingTimer();
    sendAfterRecordingRef.current = false;
    if (selectedTicketId) {
      seenMessageIdsByIssueRef.current.set(String(selectedTicketId), new Set());
    }
  }, [selectedTicketId]);

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

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

  const issueMessages = [
    ...(selectedTicket?.messages || []),
    ...optimisticMessages,
  ];

  const getIssueById = (issueId) =>
    tickets.find((ticket) => String(ticket?._id) === String(issueId));

  const getIssueLastMessage = (issue) => {
    const list = Array.isArray(issue?.messages) ? issue.messages : [];
    return list[list.length - 1] || null;
  };

  const getIssueLastMessageTime = (issue) => {
    const lastMessage = getIssueLastMessage(issue);
    const source =
      lastMessage?.createdAt ||
      issue?.lastMessageAt ||
      issue?.updatedAt ||
      issue?.createdAt;
    const ts = new Date(source).getTime();
    return Number.isFinite(ts) ? ts : 0;
  };

  const getIssueIncomingTailTime = (issue) => {
    const lastMessage = getIssueLastMessage(issue);
    const senderRole = String(lastMessage?.senderRole || "").toLowerCase();
    if (senderRole !== "doctor") return 0;
    return getIssueLastMessageTime(issue);
  };

  const markIssueAsSeenLocally = (issueId, issueOverride) => {
    if (!issueId) return;
    const issue = issueOverride || getIssueById(issueId);
    const incomingTailTime = getIssueIncomingTailTime(issue);
    if (!incomingTailTime) return;

    setSeenIncomingAtByIssue((prev) => {
      const current = Number(prev?.[issueId] || 0);
      if (current >= incomingTailTime) return prev;
      return { ...prev, [issueId]: incomingTailTime };
    });
  };

  const hasIssueNewUpdate = (issue) => {
    const incomingTailTime = getIssueIncomingTailTime(issue);
    if (!incomingTailTime) return false;
    const seenAt = Number(seenIncomingAtByIssue?.[issue?._id] || 0);
    return seenAt < incomingTailTime;
  };

  const handleSelectIssueTicket = (issueId, issueOverride) => {
    if (selectedTicketId && String(selectedTicketId) !== String(issueId)) {
      markIssueAsSeenLocally(
        selectedTicketId,
        selectedTicket || getIssueById(selectedTicketId),
      );
    }

    setSelectedTicketId(issueId);
    markIssueAsSeenLocally(issueId, issueOverride);
  };

  useEffect(() => {
    if (!selectedTicketId || !selectedTicket) return;
    if (String(selectedTicket?._id) !== String(selectedTicketId)) return;
    markIssueAsSeenLocally(selectedTicketId, selectedTicket);
    emitVisibleSeenMessages();
  }, [selectedTicketId, selectedTicket]);

  useEffect(() => {
    emitVisibleSeenMessages();
  }, [selectedTicket?.messages, optimisticMessages]);

  const sortedIssueTickets = [...tickets].sort((a, b) => {
    const aTime = getIssueLastMessageTime(a);
    const bTime = getIssueLastMessageTime(b);
    if (aTime !== bTime) return bTime - aTime;
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });

  const issueNewChats = sortedIssueTickets.filter((item) =>
    hasIssueNewUpdate(item),
  );
  const issueOtherChats = sortedIssueTickets.filter(
    (item) => !hasIssueNewUpdate(item),
  );

  const setTicketStatus = async (status) => {
    if (!selectedTicket?._id) return;
    try {
      await axiosInstance.patch(`/issues/admin/${selectedTicket._id}/status`, {
        status,
      });
      toast.success(`Issue marked ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update issue");
    }
  };

  const openDoctorIssues = (doctorId) => {
    setActiveSection("issues");
    setTicketFilter("active");
    const firstTicket = tickets.find((item) => item.doctor?._id === doctorId);
    if (firstTicket) {
      handleSelectIssueTicket(firstTicket._id, firstTicket);
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
    if (!admin) return;
    loadDoctors();
  }, [admin, doctorStatusFilter]);

  useEffect(() => {
    if (!admin) return;
    loadDoctorDetail();
  }, [selectedDoctorId]);

  useEffect(() => {
    if (!admin) return;
    loadTickets();
  }, [admin, ticketFilter]);

  useEffect(() => {
    if (!admin) return;
    loadTicketDetail(selectedTicketId);
  }, [selectedTicketId, admin]);

  useEffect(() => {
    if (!admin) return undefined;

    const socket = getRealtimeSocketForRole("admin");

    const handleTicketUpdate = ({ ticket } = {}) => {
      if (!ticket) return;
      upsertVisibleAdminTicket(ticket, ticketFilter);
      syncSelectedDoctorIssues(ticket);
    };

    const handleTicketDetailUpdate = ({ ticketId, ticket } = {}) => {
      if (!ticket) return;
      upsertVisibleAdminTicket(ticket, ticketFilter);
      syncSelectedDoctorIssues(ticket);
      if (String(ticketId || "") === String(selectedTicketId || "")) {
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
        deliveredAt,
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
        seenAt,
        deliveredAt,
      });
    };

    const handleReconnectSync = () => {
      loadTickets();
      if (selectedTicketId) {
        loadTicketDetail(selectedTicketId);
      }
      if (selectedDoctorId) {
        loadDoctorDetail();
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
  }, [admin, ticketFilter, selectedTicketId, selectedDoctorId]);

  useEffect(() => {
    if (!admin || !selectedTicketId) return undefined;
    const socket = getRealtimeSocketForRole("admin");
    const joinIssueRoom = () => {
      socket.emit("issue-ticket:join", { ticketId: selectedTicketId });
    };
    socket.connect();
    joinIssueRoom();
    socket.on("connect", joinIssueRoom);

    return () => {
      socket.emit("issue-ticket:leave", { ticketId: selectedTicketId });
      socket.off("connect", joinIssueRoom);
    };
  }, [admin, selectedTicketId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      ADMIN_ISSUE_SEEN_STORAGE_KEY,
      JSON.stringify(seenIncomingAtByIssue),
    );
  }, [seenIncomingAtByIssue]);

  const doctorName = useMemo(
    () => selectedDoctor?.fullName || "Doctor",
    [selectedDoctor?.fullName],
  );

  if (isCheckingAuth) {
    return <div className="cyber-shell min-h-screen" />;
  }

  if (!admin) return null;

  return (
    <div className="cyber-shell min-h-screen p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <aside
          className="cyber-chamfer border p-4 h-fit"
          style={{
            ...cyberCardStyle,
            boxShadow: cyberpunkTheme.shadows.neonSm,
          }}
        >
          <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">
            Admin Panel
          </p>
          <h1 className="cyber-heading cyber-glitch text-lg font-black mt-2 text-[var(--color-text-primary)]">
            {admin.name || "Admin"}
          </h1>
          <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)]">
            {admin.email}
          </p>

          <div className="mt-5 space-y-2">
            <button
              onClick={() => setActiveSection("doctors")}
              className="cyber-chamfer-sm w-full px-3 py-2 text-left text-sm font-semibold border inline-flex items-center gap-2"
              style={
                activeSection === "doctors"
                  ? {
                      borderColor: "rgba(0,255,136,0.4)",
                      background: "rgba(0,255,136,0.12)",
                      color: cyberpunkTheme.colors.accent,
                    }
                  : {
                      borderColor: "transparent",
                      color: "var(--color-text-secondary)",
                      background: "transparent",
                    }
              }
            >
              <UserCog size={15} />
              Doctors
            </button>
            <button
              onClick={() => setActiveSection("issues")}
              className="cyber-chamfer-sm w-full px-3 py-2 text-left text-sm font-semibold border inline-flex items-center gap-2"
              style={
                activeSection === "issues"
                  ? {
                      borderColor: "rgba(255,0,255,0.4)",
                      background: "rgba(255,0,255,0.12)",
                      color: cyberpunkTheme.colors.accentSecondary,
                    }
                  : {
                      borderColor: "transparent",
                      color: "var(--color-text-secondary)",
                      background: "transparent",
                    }
              }
            >
              <LifeBuoy size={15} />
              Issues
            </button>
          </div>

          <button
            onClick={logout}
            className="cyber-chamfer-sm mt-8 w-full px-3 py-2 text-sm font-semibold border inline-flex items-center justify-center gap-2"
            style={{
              borderColor: "rgba(255,51,102,0.5)",
              color: cyberpunkTheme.colors.destructive,
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </aside>

        <main className="space-y-5">
          {activeSection === "doctors" && (
            <>
              <section
                className="cyber-chamfer border p-4"
                style={cyberCardStyle}
              >
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div>
                    <h2 className="cyber-heading text-lg font-bold text-[var(--color-text-primary)]">
                      Doctor Directory
                    </h2>
                    <p className="cyber-text text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Review doctor profiles, verification state, and issue
                      history in one place.
                    </p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <input
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="Search doctor"
                      className="cyber-text w-full md:w-64 cyber-chamfer-sm pl-9 pr-3 py-2 border text-sm"
                      style={cyberInputStyle}
                    />
                    <button
                      onClick={loadDoctors}
                      className="cyber-chamfer-sm px-3 py-2 text-sm font-semibold border inline-flex items-center gap-1.5"
                      style={{
                        borderColor: "var(--color-border)",
                        color: cyberpunkTheme.colors.accent,
                      }}
                    >
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
                    {VERIFY_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {doctors.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => setSelectedDoctorId(d._id)}
                      className="cyber-chamfer-sm p-3 border text-left"
                      style={
                        selectedDoctorId === d._id
                          ? {
                              borderColor: "rgba(0,255,136,0.45)",
                              background: "rgba(0,255,136,0.1)",
                            }
                          : {
                              borderColor: "var(--color-border)",
                              background: "var(--color-card)",
                            }
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="cyber-text text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">
                          {d.fullName}
                        </p>
                        <VerifiedBadge
                          isVerified={isDoctorVerified(
                            d.profileVerificationStatus,
                          )}
                          compact
                        />
                      </div>
                      <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">
                        {d.specialization || "Specialist"}
                      </p>
                      <div className="mt-2">
                        <StatusPill value={d.profileVerificationStatus} />
                      </div>
                    </button>
                  ))}
                  {doctors.length === 0 && (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      No doctors found.
                    </p>
                  )}
                </div>
              </section>

              <section
                className="cyber-chamfer border p-4"
                style={cyberCardStyle}
              >
                {!selectedDoctor ? (
                  <p className="cyber-text text-sm text-[var(--color-text-secondary)]">
                    Select a doctor to view full profile details.
                  </p>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="cyber-heading text-xl font-extrabold text-[var(--color-text-primary)]">
                            {doctorName}
                          </h3>
                          <VerifiedBadge
                            isVerified={isDoctorVerified(
                              selectedDoctor.profileVerificationStatus,
                            )}
                          />
                        </div>
                        <p className="cyber-text text-sm text-[var(--color-text-secondary)] mt-1">
                          {selectedDoctor.email}
                        </p>
                        <p className="cyber-text text-sm text-[var(--color-text-secondary)]">
                          {selectedDoctor.specialization || "Specialist"}
                        </p>
                      </div>
                      <button
                        onClick={() => openDoctorIssues(selectedDoctor._id)}
                        className="cyber-chamfer-sm px-3 py-2 text-xs font-semibold border inline-flex items-center gap-1.5"
                        style={{
                          borderColor: "rgba(0,212,255,0.4)",
                          color: cyberpunkTheme.colors.accentTertiary,
                        }}
                      >
                        <AlertTriangle size={12} />
                        Open Doctor Issues
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      <ProfileStat
                        label="PMDC Number"
                        value={selectedDoctor.pmdcNumber}
                      />
                      <ProfileStat
                        label="License Status"
                        value={selectedDoctor.licenseStatus}
                      />
                      <ProfileStat label="Phone" value={selectedDoctor.phone} />
                      <ProfileStat
                        label="Experience"
                        value={
                          selectedDoctor.yearsOfExperience
                            ? `${selectedDoctor.yearsOfExperience} years`
                            : "-"
                        }
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div
                        className="cyber-chamfer-sm border p-3 space-y-3"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-bg-soft)",
                        }}
                      >
                        <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">
                          Verification Workflow
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill
                            value={selectedDoctor.profileVerificationStatus}
                          />
                          <span className="cyber-text text-xs text-[var(--color-text-secondary)]">
                            Reviewed by{" "}
                            {selectedDoctor.profileVerificationReviewedBy ||
                              "-"}
                          </span>
                        </div>
                        <select
                          value={verificationStatus}
                          onChange={(e) =>
                            setVerificationStatus(e.target.value)
                          }
                          className="cyber-text w-full cyber-chamfer-sm px-3 py-2.5 border text-sm"
                          style={cyberInputStyle}
                        >
                          {VERIFY_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Review notes"
                          rows={3}
                          className="cyber-text w-full cyber-chamfer-sm px-3 py-2.5 border text-sm resize-none"
                          style={cyberInputStyle}
                        />
                        <button
                          onClick={updateVerification}
                          className="cyber-chamfer-sm cyber-heading px-4 py-2.5 text-xs font-semibold"
                          style={{
                            color: cyberpunkTheme.colors.background,
                            background: cyberpunkTheme.colors.accent,
                            boxShadow: cyberpunkTheme.shadows.neon,
                          }}
                        >
                          <ShieldCheck size={12} className="inline mr-1" />
                          Update Verification
                        </button>
                      </div>

                      <div
                        className="cyber-chamfer-sm border p-3"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-bg-soft)",
                        }}
                      >
                        <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">
                          Doctor Issue History
                        </p>
                        <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {doctorIssueHistory.length === 0 ? (
                            <p className="cyber-text text-sm text-[var(--color-text-secondary)]">
                              No resolved/closed issues for this doctor.
                            </p>
                          ) : (
                            doctorIssueHistory.map((item) => (
                              <div
                                key={item._id}
                                className="cyber-chamfer-sm border p-2.5"
                                style={{
                                  borderColor: "var(--color-border)",
                                  background: "var(--color-card)",
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="cyber-text text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">
                                    {item.title}
                                  </p>
                                  <StatusPill value={item.status} />
                                </div>
                                <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)]">
                                  {item.category}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="mt-4 cyber-chamfer-sm border p-3"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-bg-soft)",
                      }}
                    >
                      <p className="cyber-label text-[10px] text-[var(--color-text-secondary)]">
                        Active Issues
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {doctorActiveIssues.length === 0 ? (
                          <p className="cyber-text text-sm text-[var(--color-text-secondary)]">
                            No active issues for this doctor.
                          </p>
                        ) : (
                          doctorActiveIssues.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => {
                                setActiveSection("issues");
                                handleSelectIssueTicket(item._id, item);
                              }}
                              className="cyber-chamfer-sm border px-2.5 py-1.5 text-left"
                              style={{
                                borderColor: "var(--color-border)",
                                background: "var(--color-card)",
                              }}
                            >
                              <p className="cyber-text text-xs font-semibold text-[var(--color-text-primary)] line-clamp-1">
                                {item.title}
                              </p>
                              <p className="cyber-text text-[11px] text-[var(--color-text-secondary)]">
                                {normalizeStatusLabel(item.status)}
                              </p>
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
            <section
              className="cyber-chamfer border p-4 h-[calc(100vh-8rem)] overflow-hidden flex flex-col"
              style={cyberCardStyle}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="cyber-heading text-lg font-bold text-[var(--color-text-primary)]">
                    Issue Inbox
                  </h2>
                  <p className="cyber-text text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Track all issue conversations and keep actions auditable.
                  </p>
                </div>
                <div
                  className="flex gap-2 rounded-full border p-1"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg-soft)",
                  }}
                >
                  <button
                    onClick={() => setTicketFilter("active")}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={
                      ticketFilter === "active"
                        ? {
                            background: "rgba(0,255,136,0.14)",
                            color: cyberpunkTheme.colors.accent,
                          }
                        : { color: "var(--color-text-secondary)" }
                    }
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setTicketFilter("history")}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={
                      ticketFilter === "history"
                        ? {
                            background: "rgba(255,0,255,0.14)",
                            color: cyberpunkTheme.colors.accentSecondary,
                          }
                        : { color: "var(--color-text-secondary)" }
                    }
                  >
                    History
                  </button>
                </div>
              </div>

              <div className="mt-4 min-h-0 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-4 min-h-0 overflow-y-auto pr-1 space-y-3">
                  {tickets.length === 0 ? (
                    <p className="cyber-text text-sm text-[var(--color-text-secondary)]">
                      No issues available.
                    </p>
                  ) : (
                    <>
                      {issueNewChats.length > 0 ? (
                        <div>
                          <p
                            className="cyber-label mb-2 text-[10px] uppercase tracking-[0.24em]"
                            style={{
                              color: cyberpunkTheme.colors.accentSecondary,
                            }}
                          >
                            New chats
                          </p>
                          <div className="space-y-2">
                            {issueNewChats.map((t) => (
                              <button
                                key={t._id}
                                onClick={() =>
                                  handleSelectIssueTicket(t._id, t)
                                }
                                className="w-full cyber-chamfer-sm p-3 border text-left"
                                style={
                                  selectedTicketId === t._id
                                    ? {
                                        borderColor: "rgba(255,0,255,0.45)",
                                        background: "rgba(255,0,255,0.14)",
                                      }
                                    : {
                                        borderColor: "rgba(255,0,255,0.32)",
                                        background: "rgba(255,0,255,0.08)",
                                      }
                                }
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="cyber-text text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">
                                    {t.title}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="cyber-label rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                                      style={{
                                        background: "rgba(255,0,255,0.16)",
                                        color:
                                          cyberpunkTheme.colors.accentSecondary,
                                      }}
                                    >
                                      New update
                                    </span>
                                    <StatusPill value={t.status} />
                                  </div>
                                </div>
                                <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">
                                  {t.doctor?.fullName || "Doctor"}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {issueOtherChats.length > 0 ? (
                        <div>
                          <p className="cyber-label mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
                            All chats
                          </p>
                          <div className="space-y-2">
                            {issueOtherChats.map((t) => (
                              <button
                                key={t._id}
                                onClick={() =>
                                  handleSelectIssueTicket(t._id, t)
                                }
                                className="w-full cyber-chamfer-sm p-3 border text-left"
                                style={
                                  selectedTicketId === t._id
                                    ? {
                                        borderColor: "rgba(255,0,255,0.42)",
                                        background: "rgba(255,0,255,0.1)",
                                      }
                                    : {
                                        borderColor: "var(--color-border)",
                                        background: "var(--color-card)",
                                      }
                                }
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="cyber-text text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">
                                    {t.title}
                                  </p>
                                  <StatusPill value={t.status} />
                                </div>
                                <p className="cyber-text text-xs mt-1 text-[var(--color-text-secondary)] line-clamp-1">
                                  {t.doctor?.fullName || "Doctor"}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div
                  className="xl:col-span-8 cyber-chamfer-sm border p-3 flex h-full min-h-0 flex-col overflow-hidden"
                  style={{
                    borderColor: "var(--color-border)",
                    background: cyberpunkTheme.colors.background,
                  }}
                >
                  {!selectedTicket ? (
                    <p className="cyber-text m-auto text-sm text-[var(--color-text-secondary)]">
                      Select a ticket to open chat.
                    </p>
                  ) : (
                    <>
                      <div
                        className="border-b pb-3 flex flex-wrap items-center justify-between gap-2"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <div>
                          <h3 className="cyber-heading text-base font-bold text-[var(--color-text-primary)]">
                            {selectedTicket.title}
                          </h3>
                          <p className="cyber-text text-xs text-[var(--color-text-secondary)] inline-flex items-center gap-1">
                            <Building2 size={12} />
                            {selectedTicket.doctor?.fullName || "Doctor"} •{" "}
                            {selectedTicket.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill value={selectedTicket.status} />
                          {ISSUE_STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              onClick={() => setTicketStatus(status)}
                              className="cyber-chamfer-sm px-2.5 py-1.5 text-xs font-semibold border"
                              style={{
                                borderColor: "var(--color-border)",
                                color: cyberpunkTheme.colors.accentTertiary,
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative min-h-0 flex-1">
                        <div
                          ref={messagesContainerRef}
                          onScroll={() => {
                            updateJumpToLatestVisibility();
                            emitVisibleSeenMessages();
                          }}
                          className="h-full overflow-y-auto py-3 space-y-2"
                        >
                          {issueMessages.map((m) => (
                            <div
                              key={m._id || `${m.senderRole}-${m.createdAt}`}
                              data-message-id={m._id || ""}
                              data-sender-role={m.senderRole || ""}
                              className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className="max-w-[80%] cyber-chamfer-sm px-3 py-2 border"
                                style={
                                  m.senderRole === "admin"
                                    ? {
                                        background: "rgba(0,255,136,0.12)",
                                        borderColor: "rgba(0,255,136,0.35)",
                                      }
                                    : {
                                        background: "var(--color-card)",
                                        borderColor: "var(--color-border)",
                                      }
                                }
                              >
                                <p className="cyber-text text-[11px] font-semibold mb-0.5 text-[var(--color-text-secondary)]">
                                  {m.senderName}
                                </p>
                                {m.text ? (
                                  <p className="cyber-text text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                                    {m.text}
                                  </p>
                                ) : null}
                                {(m.attachments || []).length > 0 ? (
                                  <div className="mt-2 space-y-2">
                                    {m.attachments.map((attachment) =>
                                      isImageAttachment(attachment) ? (
                                        <button
                                          key={attachment.url}
                                          type="button"
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
                                            m.senderRole === "admin"
                                              ? "Admin voice"
                                              : "Doctor voice"
                                          }
                                          theme={
                                            m.senderRole === "admin"
                                              ? cyberSentVoiceTheme
                                              : cyberReceivedVoiceTheme
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
                                <div className="cyber-text mt-1 flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-text-secondary)]">
                                  <span>
                                    {m.createdAt
                                      ? new Date(
                                          m.createdAt,
                                        ).toLocaleTimeString("en-PK", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </span>
                                  {m.senderRole === "admin" ? (
                                    <MessageStatusTicks
                                      status={m.status || "sent"}
                                    />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {showJumpToLatest ? (
                          <button
                            type="button"
                            onClick={scrollMessagesToBottom}
                            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur"
                            style={{
                              borderColor: "rgba(0,255,136,0.45)",
                              background: "rgba(10,18,20,0.88)",
                              color: cyberpunkTheme.colors.accent,
                            }}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                            New messages
                          </button>
                        ) : null}
                      </div>

                      <div
                        className="pt-2 border-t"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        {isRecording ? (
                          <div
                            className="mb-3 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full"
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
                                {formatRecordingTime(recordingTime)}
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
                              theme={cyberReceivedVoiceTheme}
                              action={
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (voiceDraft?.previewUrl) {
                                      URL.revokeObjectURL(
                                        voiceDraft.previewUrl,
                                      );
                                    }
                                    setVoiceDraft(null);
                                  }}
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
                                    src={imagePreviewUrls.get(
                                      getAttachmentKey(file),
                                    )}
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

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full bg-[var(--color-primary)]/10 p-2.5 text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 sm:p-3"
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
                            value={adminReply}
                            onChange={(e) => setAdminReply(e.target.value)}
                            onKeyDown={handleReplyKeyDown}
                            placeholder="Reply to doctor..."
                            rows={1}
                            className="cyber-text max-h-32 min-h-[44px] flex-1 resize-none cyber-chamfer-sm px-3 py-2.5 border text-sm"
                            style={cyberInputStyle}
                          />

                          {isRecording ||
                          adminReply.trim() ||
                          attachments.length > 0 ||
                          voiceDraft?.file ? (
                            <button
                              onClick={() => {
                                if (isRecording) {
                                  stopVoiceRecording({ sendAfter: true });
                                  return;
                                }
                                sendAdminReply();
                              }}
                              disabled={isSendingReply}
                              className="cyber-chamfer-sm px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                              style={{
                                color: cyberpunkTheme.colors.background,
                                background: cyberpunkTheme.colors.accent,
                                boxShadow: cyberpunkTheme.shadows.neon,
                              }}
                            >
                              <Send size={14} />
                              Send
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={
                                isRecording
                                  ? stopVoiceRecording
                                  : startVoiceRecording
                              }
                              className="rounded-full p-2.5 transition sm:p-3"
                              style={{
                                background: isRecording
                                  ? "rgba(239,68,68,0.1)"
                                  : "transparent",
                                color: isRecording
                                  ? "rgb(239,68,68)"
                                  : "var(--color-primary)",
                              }}
                            >
                              <Mic className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
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
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
