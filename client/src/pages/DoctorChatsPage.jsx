import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ChevronLeft, Mic, Plus, Send, X } from "lucide-react";
import axiosInstance from "../api/axios";
import MessageStatusTicks from "../components/MessageStatusTicks";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";
import { getRealtimeSocketForRole } from "../realtime/socket";

const CHAT_SEEN_STORAGE_KEY = "doctor-chat-seen-map-v1";

const formatShortDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-PK", { month: "short", day: "numeric" }) : "";
const formatMessageTime = (date) =>
  date ? new Date(date).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : "";

export default function DoctorChatsPage() {
  const currentRole = "doctor";
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1280 : false
  );
  const [seenIncomingAtByPatient, setSeenIncomingAtByPatient] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(CHAT_SEEN_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [mobileScreen, setMobileScreen] = useState("list");
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageNodesRef = useRef(new Map());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const selectedPatientIdRef = useRef("");
  const chatRequestSeqRef = useRef(0);
  const seenMessageIdsRef = useRef(new Set());

  const scrollMessagesToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
    setShowJumpToLatest(false);
  };

  const patchSelectedChatMessages = (updater) => {
    setSelectedChat((prev) => {
      if (!prev?.chat) return prev;
      const nextMessages = updater(Array.isArray(prev.chat.messages) ? prev.chat.messages : []);
      return {
        ...prev,
        chat: {
          ...prev.chat,
          messages: nextMessages,
        },
      };
    });
  };

  const markSelectedChatMessagesDeliveredLocally = (messageIds = []) => {
    const normalizedIds = messageIds.map(String).filter(Boolean);
    if (normalizedIds.length === 0) return;

    const now = new Date().toISOString();
    const idSet = new Set(normalizedIds);
    patchSelectedChatMessages((messages) => messages.map((message) => {
      if (!idSet.has(String(message._id || ""))) return message;
      if (message.senderRole === currentRole) return message;
      if (message.status === "seen") return message;
      return {
        ...message,
        status: "delivered",
        deliveredAt: message.deliveredAt || now,
      };
    }));
  };

  const markSelectedChatMessagesSeenLocally = (messageIds = []) => {
    const normalizedIds = messageIds.map(String).filter(Boolean);
    if (normalizedIds.length === 0) return;

    const now = new Date().toISOString();
    const idSet = new Set(normalizedIds);
    patchSelectedChatMessages((messages) => messages.map((message) => {
      if (!idSet.has(String(message._id || ""))) return message;
      if (message.senderRole === currentRole) return message;
      return {
        ...message,
        status: "seen",
        deliveredAt: message.deliveredAt || now,
        seenAt: now,
      };
    }));
    markPatientAsSeenLocally(selectedPatientIdRef.current);
  };

  const emitVisibleSeenMessages = () => {
    const container = messagesContainerRef.current;
    if (!container || !selectedChat?.chat?.messages?.length || !selectedPatientIdRef.current) return;

    const containerRect = container.getBoundingClientRect();
    const visibleIds = [];

    for (const message of selectedChat.chat.messages) {
      if (message.senderRole === currentRole) continue;
      const messageId = String(message._id || "");
      if (!messageId || seenMessageIdsRef.current.has(messageId)) continue;
      const node = messageNodesRef.current.get(messageId);
      if (!node) continue;

      const rect = node.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
      if (visibleHeight <= 0) continue;

      const threshold = Math.min(rect.height, containerRect.height) * 0.45;
      if (visibleHeight >= threshold) {
        visibleIds.push(messageId);
      }
    }

    if (visibleIds.length === 0) return;

    visibleIds.forEach((messageId) => seenMessageIdsRef.current.add(messageId));
    markSelectedChatMessagesSeenLocally(visibleIds);

    const socket = getRealtimeSocketForRole(currentRole);
    socket.emit("message_seen", { patientId: selectedPatientIdRef.current, messageIds: visibleIds });
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

  useEffect(() => {
    selectedPatientIdRef.current = selectedPatientId;
  }, [selectedPatientId]);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/patient-chats/doctor?limit=100");
      const list = Array.isArray(res.data?.patients) ? res.data.patients : [];
      setPatients(list);
      if (!isMobileView && !selectedPatientId && list.length > 0) {
        setSelectedPatientId(list[0]._id);
      }
    } catch {
      toast.error("Failed to load patient chats");
    } finally {
      setIsLoading(false);
    }
  };

  const loadChat = async (patientId) => {
    if (!patientId) return;
    const requestSeq = ++chatRequestSeqRef.current;
    try {
      const res = await axiosInstance.get(`/patient-chats/doctor/${patientId}`);
      const currentSelectedId = selectedPatientIdRef.current;
      const responsePatientId = String(res.data?.patient?._id || patientId);

      if (requestSeq !== chatRequestSeqRef.current) return;
      if (currentSelectedId !== String(patientId)) return;
      if (responsePatientId !== String(patientId)) return;

      setSelectedChat(res.data || null);
    } catch {
      if (requestSeq === chatRequestSeqRef.current && selectedPatientIdRef.current === String(patientId)) {
        setSelectedChat(null);
      }
    }
  };

  const upsertPatientEntry = (entry) => {
    if (!entry?._id) return;
    setPatients((prev) => {
      const existingIndex = prev.findIndex((item) => String(item._id) === String(entry._id));
      if (existingIndex === -1) {
        return [...prev, entry];
      }

      const next = [...prev];
      next[existingIndex] = { ...next[existingIndex], ...entry };
      return next;
    });
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    loadChat(selectedPatientId);
  }, [selectedPatientId]);

  useEffect(() => {
    const socket = getRealtimeSocketForRole("doctor");

    const handleListUpdated = ({ entry } = {}) => {
      if (!entry) return;
      upsertPatientEntry(entry);
    };

    const handleDetailUpdated = ({ patientId, payload } = {}) => {
      if (!payload || String(patientId || "") !== String(selectedPatientIdRef.current || "")) return;
      setSelectedChat(payload);
      setOptimisticMessages([]);
    };

    const handleMessageDelivered = ({ patientId, messageIds = [] } = {}) => {
      if (String(patientId || "") !== String(selectedPatientIdRef.current || "")) return;
      markSelectedChatMessagesDeliveredLocally(messageIds);
    };

    const handleMessageSeen = ({ patientId, messageIds = [] } = {}) => {
      if (String(patientId || "") !== String(selectedPatientIdRef.current || "")) return;
      markSelectedChatMessagesSeenLocally(messageIds);
    };

    const handleConnectError = (error) => {
      if (error?.message === "Unauthorized") {
        toast.error("Session expired. Please log in again.");
      }
    };

    const handleReconnectSync = () => {
      loadPatients();
      if (selectedPatientIdRef.current) {
        loadChat(selectedPatientIdRef.current);
      }
    };

    socket.connect();
    socket.on("connect", handleReconnectSync);
    socket.on("patient-chat:list-updated", handleListUpdated);
    socket.on("patient-chat:detail-updated", handleDetailUpdated);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("message_seen", handleMessageSeen);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleReconnectSync);
      socket.off("patient-chat:list-updated", handleListUpdated);
      socket.off("patient-chat:detail-updated", handleDetailUpdated);
      socket.off("message_delivered", handleMessageDelivered);
      socket.off("message_seen", handleMessageSeen);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return undefined;

    const socket = getRealtimeSocketForRole("doctor");
    const joinPatientThread = () => {
      socket.emit("patient-chat:join", { patientId: selectedPatientId });
    };
    socket.connect();
    joinPatientThread();
    socket.on("connect", joinPatientThread);

    return () => {
      socket.emit("patient-chat:leave", { patientId: selectedPatientId });
      socket.off("connect", joinPatientThread);
    };
  }, [selectedPatientId]);

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
    scrollMessagesToBottom();
    const timeoutId = window.setTimeout(scrollMessagesToBottom, 120);
    return () => window.clearTimeout(timeoutId);
  }, [selectedChat?.chat?.messages, optimisticMessages]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      emitVisibleSeenMessages();
    }, 160);
    return () => window.clearTimeout(timeoutId);
  }, [selectedChat?.chat?.messages, optimisticMessages, selectedPatientId]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(scrollMessagesToBottom);
    return () => window.cancelAnimationFrame(rafId);
  }, [selectedPatientId]);

  useEffect(() => {
    updateJumpToLatestVisibility();
  }, [selectedChat?.chat?.messages, optimisticMessages, selectedPatientId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };

    if (previewImage) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewImage]);

  useEffect(
    () => () => {
      if (voiceDraft?.previewUrl) {
        URL.revokeObjectURL(voiceDraft.previewUrl);
      }
    },
    [voiceDraft],
  );

  const discardVoiceDraft = (showToast = true) => {
    if (voiceDraft?.previewUrl) {
      URL.revokeObjectURL(voiceDraft.previewUrl);
    }
    setVoiceDraft(null);
    if (showToast) {
      toast.info("Voice note discarded");
    }
  };

  const handleSend = async () => {
    if (!selectedPatientId) return;
    if (!messageText.trim() && attachments.length === 0 && !voiceDraft?.file) {
      toast.error("Write a message or attach a file");
      return;
    }

    setIsSending(true);
    const textToSend = messageText.trim();
    const outgoingFiles = voiceDraft?.file ? [...attachments, voiceDraft.file] : attachments;
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
      senderName: selectedChat?.senderName || "Doctor",
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
      await axiosInstance.post(`/patient-chats/doctor/${selectedPatientId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      optimisticAttachments.forEach((attachment) => URL.revokeObjectURL(attachment.url));
      setOptimisticMessages((prev) => prev.filter((message) => message._id !== optimisticId));
      toast.error("Bad network, message not sent. Try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const isImageFile = (file) => {
    const mimeType = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();
    return mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(name);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHAT_SEEN_STORAGE_KEY, JSON.stringify(seenIncomingAtByPatient));
  }, [seenIncomingAtByPatient]);

  const getEntryByPatientId = (patientId) => patients.find((entry) => entry._id === patientId);

  const getEntryLastMessageTime = (entry) => {
    if (entry?.lastMessageAt) return new Date(entry.lastMessageAt).getTime();
    if (entry?.lastMessage?.createdAt) return new Date(entry.lastMessage.createdAt).getTime();
    if (entry?.updatedAt) return new Date(entry.updatedAt).getTime();
    return entry?.createdAt ? new Date(entry.createdAt).getTime() : 0;
  };

  const getLastIncomingTailTime = (entry) => {
    const lastSender = String(entry?.lastMessage?.senderRole || "").toLowerCase();
    if (lastSender !== "patient") return 0;
    return getEntryLastMessageTime(entry);
  };

  const markPatientAsSeenLocally = (patientId) => {
    if (!patientId) return;
    const entry = getEntryByPatientId(patientId);
    const lastIncomingTailTime = getLastIncomingTailTime(entry);
    if (!lastIncomingTailTime) return;

    setSeenIncomingAtByPatient((prev) => {
      const current = Number(prev?.[patientId] || 0);
      if (current >= lastIncomingTailTime) return prev;
      return { ...prev, [patientId]: lastIncomingTailTime };
    });
  };

  const getEffectiveUnreadCount = (entry) => {
    const baseUnread = Number(entry?.unreadIncomingCount || 0);
    if (baseUnread === 0) return 0;

    const patientId = String(entry?._id || "");
    const seenAt = Number(seenIncomingAtByPatient?.[patientId] || 0);
    const lastIncomingTailTime = getLastIncomingTailTime(entry);
    if (lastIncomingTailTime > 0 && seenAt >= lastIncomingTailTime) {
      return 0;
    }

    return baseUnread;
  };

  const openPatientChat = (patientId) => {
    if (selectedPatientId && selectedPatientId !== patientId) {
      markPatientAsSeenLocally(selectedPatientId);
      setSelectedChat(null);
      setOptimisticMessages([]);
    }
    setSelectedPatientId(patientId);
    if (isMobileView) {
      setMobileScreen("chat");
    }
  };

  const closeCurrentChat = async () => {
    const closingPatientId = selectedPatientId;
    markPatientAsSeenLocally(closingPatientId);
    chatRequestSeqRef.current += 1;
    setSelectedPatientId("");
    setSelectedChat(null);
    setOptimisticMessages([]);
    if (isMobileView) {
      setMobileScreen("list");
    }
  };

  const showPatientList = !isMobileView || mobileScreen === "list";
  const showChatPanel = !isMobileView || mobileScreen === "chat";

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

  const getAttachmentPreviewText = (entry) => {
    const text = String(entry?.lastMessage?.text || "").trim();
    if (text) {
      return text.slice(0, 42);
    }

    const attachments = Array.isArray(entry?.lastMessage?.attachments) ? entry.lastMessage.attachments : [];
    if (attachments.length === 0) {
      return "No messages yet";
    }

    if (attachments.some((item) => isAudioAttachment(item))) {
      return "Voice message";
    }
    if (attachments.some((item) => isImageAttachment(item))) {
      return "Photo";
    }
    return attachments.length > 1 ? `${attachments.length} attachments` : "Attachment";
  };

  const hasReplyPending = (entry) => {
    const unread = getEffectiveUnreadCount(entry);
    const lastSender = String(entry?.lastMessage?.senderRole || "").toLowerCase();
    return unread === 0 && lastSender === "patient";
  };

  const getVoiceAttachmentLabel = (attachment) => {
    const fileName = String(attachment?.name || "");
    return /^voice-note-\d+\.(webm|ogg|mp3|wav|m4a|aac)$/i.test(fileName) ? "Voice message" : fileName;
  };

  const selectedListPatient = patients.find((entry) => String(entry?._id) === String(selectedPatientId));
  const selectedChatPatientId = String(selectedChat?.patient?._id || "");
  const isSelectedChatAligned = Boolean(selectedPatientId) && selectedChatPatientId === String(selectedPatientId);
  const messages = [...(isSelectedChatAligned ? selectedChat?.chat?.messages || [] : []), ...optimisticMessages];
  const patient = isSelectedChatAligned ? selectedChat?.patient : selectedListPatient;

  const getLatestMessageTime = (entry) => {
    return getEntryLastMessageTime(entry);
  };

  const sortedPatients = [...patients].sort((a, b) => {
    const aTime = getLatestMessageTime(a);
    const bTime = getLatestMessageTime(b);
    if (aTime !== bTime) {
      return bTime - aTime;
    }

    const aUnread = getEffectiveUnreadCount(a);
    const bUnread = getEffectiveUnreadCount(b);
    if (aUnread !== bUnread) {
      return bUnread - aUnread;
    }

    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });

  const newChats = sortedPatients.filter((entry) => getEffectiveUnreadCount(entry) > 0);
  const otherChats = sortedPatients.filter((entry) => getEffectiveUnreadCount(entry) === 0);

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

  const renderMessageStatus = (message) => {
    if (message.senderRole !== currentRole) return null;
    return <MessageStatusTicks status={message.status || "sent"} className="ml-1" />;
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[340px_1fr] xl:gap-4">
      {showPatientList ? (
      <aside className="rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 p-3 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.15)] sm:p-4">
        <h2 className="text-xl font-bold">Patient Chats</h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Patients with chat access enabled.</p>

        <div className="mt-4 space-y-3 max-h-[72vh] overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Loading...</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No chat-enabled patients yet.</p>
          ) : (
            <>
              {newChats.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">New chats</p>
                  <div className="space-y-2">
                    {newChats.map((entry) => (
                      <button
                        key={entry._id}
                        onClick={() => openPatientChat(entry._id)}
                        className="w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5"
                        style={(() => {
                          const isSelected = String(selectedPatientId) === String(entry._id);
                          return {
                            borderColor: isSelected
                              ? "color-mix(in srgb, var(--color-primary) 62%, transparent)"
                              : "color-mix(in srgb, var(--color-primary) 34%, transparent)",
                            background: isSelected
                              ? "color-mix(in srgb, var(--color-primary) 20%, var(--color-card) 80%)"
                              : "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                            boxShadow: isSelected
                              ? "0 0 0 1px color-mix(in srgb, var(--color-primary) 38%, transparent), 0 10px 24px -14px color-mix(in srgb, var(--color-primary) 45%, transparent)"
                              : "none",
                          };
                        })()}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--color-text-primary)]">{entry.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">New update</span>
                            <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
                              {getEffectiveUnreadCount(entry) > 9 ? "9+" : getEffectiveUnreadCount(entry)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{entry.chatUsername}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {Array.isArray(entry.locations) && entry.locations.length > 0 ? entry.locations.map((loc) => loc.locationName).join(", ") : "No visit location"}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-[var(--color-text-primary)]">{getAttachmentPreviewText(entry)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {otherChats.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-text-secondary)]">All chats</p>
                  <div className="space-y-2">
                    {otherChats.map((entry) => (
                      <button
                        key={entry._id}
                        onClick={() => openPatientChat(entry._id)}
                        className="w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5"
                        style={(() => {
                          const isSelected = String(selectedPatientId) === String(entry._id);
                          return {
                            borderColor: isSelected
                              ? "color-mix(in srgb, var(--color-primary) 62%, transparent)"
                              : "color-mix(in srgb, var(--color-border) 82%, transparent)",
                            background: isSelected
                              ? "color-mix(in srgb, var(--color-primary) 15%, var(--color-card) 85%)"
                              : "transparent",
                            boxShadow: isSelected
                              ? "0 0 0 1px color-mix(in srgb, var(--color-primary) 36%, transparent), 0 10px 24px -14px color-mix(in srgb, var(--color-primary) 42%, transparent)"
                              : "none",
                          };
                        })()}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--color-text-primary)]">{entry.name}</p>
                          {hasReplyPending(entry) ? (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ background: "color-mix(in srgb, var(--color-danger) 18%, transparent)", borderColor: "color-mix(in srgb, var(--color-danger) 38%, transparent)", color: "var(--color-danger)" }}>Reply..?</span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">{entry.chatInviteStatus}</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{entry.chatUsername}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {Array.isArray(entry.locations) && entry.locations.length > 0 ? entry.locations.map((loc) => loc.locationName).join(", ") : "No visit location"}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">{getAttachmentPreviewText(entry)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </aside>
      ) : null}

      {showChatPanel ? (
      <section className="flex min-h-[70vh] h-[calc(100vh-9rem)] flex-col rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.15)]">
        {!patient ? (
          <div className="m-auto p-6 text-center rounded-2xl text-sm text-[var(--color-text-secondary)]">Select a patient to open chat.</div>
        ) : (
          <>
            <div className="border-b border-[var(--color-border)]/80 bg-[var(--color-card)]/90 px-4 py-3 rounded-2xl sm:px-5 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isMobileView ? (
                    <button
                      type="button"
                      onClick={closeCurrentChat}
                      className="rounded-full p-1.5 text-[var(--color-text-primary)]"
                      aria-label="Back to patients"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  ) : null}
                  <h3 className="text-lg font-bold sm:text-xl">{patient.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeCurrentChat}
                  className="rounded-full border border-[var(--color-border)]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-soft)]"
                >
                  Close chat
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">{patient.chatUsername} · {patient.chatInviteStatus} {patient.chatLastLoginAt ? `· last login ${formatShortDate(patient.chatLastLoginAt)}` : ""}</p>
            </div>

            <div className="relative min-h-0 flex-1">
              <div
                ref={messagesContainerRef}
                onScroll={() => {
                  updateJumpToLatestVisibility();
                  emitVisibleSeenMessages();
                }}
                className="h-full overflow-y-auto px-3 py-4 space-y-3 sm:px-4"
                style={chatCanvasStyle}
              >
                {messages.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">No messages yet.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id || `${message.senderRole}-${message.createdAt}`}
                      ref={(node) => {
                        const messageId = String(message._id || "");
                        if (!messageId) return;
                        if (node) {
                          messageNodesRef.current.set(messageId, node);
                        } else {
                          messageNodesRef.current.delete(messageId);
                        }
                      }}
                      data-message-id={message._id || ""}
                      data-sender-role={message.senderRole || ""}
                      className={`flex ${message.senderRole === currentRole ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[88%] rounded-[1.1rem] border px-3 py-2.5 sm:max-w-[80%] sm:px-4" style={message.senderRole === currentRole ? sentBubbleStyle : receivedBubbleStyle}>
                        <p className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{message.senderName}</p>
                        {message.text && <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">{message.text}</p>}
                        {(message.attachments || []).length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
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
                                    loading="lazy"
                                    className="max-h-64 w-full object-cover"
                                  />
                                </button>
                              ) : isAudioAttachment(attachment) ? (
                                <VoiceMessagePlayer
                                  key={attachment.url}
                                  src={attachment.url}
                                  title={getVoiceAttachmentLabel(attachment)}
                                  badge={message.senderRole === "doctor" ? "Sent voice" : "Patient voice"}
                                  theme={message.senderRole === "doctor" ? sentVoiceTheme : receivedVoiceTheme}
                                />
                              ) : (
                                <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-[var(--color-border)]/80 px-3 py-2 text-xs text-[var(--color-primary)] hover:underline">
                                  {attachment.name}
                                </a>
                              )
                            ))}
                          </div>
                        )}
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[var(--color-text-secondary)]">
                          <span>{formatMessageTime(message.createdAt)}</span>
                          {renderMessageStatus(message)}
                        </div>
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
                  style={{ borderColor: "color-mix(in srgb, var(--color-primary) 45%, transparent)", background: "color-mix(in srgb, var(--color-card) 75%, var(--color-primary) 25%)", color: "var(--color-text-primary)" }}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  New messages
                </button>
              ) : null}
            </div>

            <div className="border-t border-[var(--color-border)]/80 bg-[var(--color-card)]/95 p-3 sm:p-4">
              {isRecording ? (
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full" style={{ background: "color-mix(in srgb, var(--color-danger) 14%, transparent)", borderColor: "color-mix(in srgb, var(--color-danger) 34%, transparent)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="flex items-end gap-1">
                      {[10, 14, 8, 16, 11, 13].map((barHeight, index) => (
                        <span
                          key={`${barHeight}-${index}`}
                          className="w-1 rounded-full bg-red-500 animate-pulse"
                          style={{ height: barHeight, animationDelay: `${index * 0.12}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-red-600">Recording... {formatTime(recordingTime)}</span>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="rounded-full p-2.5 transition"
                      style={{ background: "color-mix(in srgb, var(--color-danger) 26%, transparent)", color: "var(--color-danger)" }}
                      aria-label="Discard recording"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white hover:bg-green-600"
                    >
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
                      <button
                        type="button"
                        onClick={() => discardVoiceDraft(true)}
                        className="rounded-full p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10"
                        aria-label="Discard voice note"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  />
                </div>
              ) : null}

              {attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {attachments.map((file, idx) => (
                    isImageFile(file) ? (
                      <div key={idx} className="relative overflow-hidden rounded-2xl border border-[var(--color-border)]/80 p-2" style={{ background: "color-mix(in srgb, var(--color-card-elevated) 82%, var(--color-bg) 18%)" }}>
                        <img
                          src={imagePreviewUrls.get(getAttachmentKey(file))}
                          alt={file.name}
                          className="h-28 w-28 rounded-xl object-cover"
                        />
                        <p className="mt-1 w-28 truncate text-[11px] font-medium text-[var(--color-text-secondary)]">{file.name}</p>
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
                      <div key={idx} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs" style={{ borderColor: "color-mix(in srgb, var(--color-primary) 38%, transparent)", background: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}>
                        <span className="max-w-[220px] truncate font-medium text-[var(--color-primary)]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="font-bold text-[var(--color-primary)]"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
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
                  accept=".png,.jpg,.jpeg,.gif,.pdf,.webm,.ogg,.mp3,.wav"
                  onChange={(e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])])}
                  className="hidden"
                />

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Write a message..."
                  className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/70 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] sm:py-3"
                />

                {messageText.trim() || attachments.length > 0 || voiceDraft?.file ? (
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="rounded-full bg-[var(--color-primary)] p-2.5 text-white transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 sm:p-3"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className="rounded-full p-2.5 transition sm:p-3"
                    style={{
                      background: isRecording ? "rgba(239,68,68,0.1)" : "transparent",
                      color: isRecording ? "rgb(239,68,68)" : "var(--color-primary)",
                    }}
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
          <img src={previewImage.url} alt={previewImage.name} className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain" />
        </div>
      ) : null}
    </div>
  );
}
