import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowDown, LogOut, Mic, Plus, Send, X } from "lucide-react";
import axiosInstance from "../api/axios";
import MessageStatusTicks from "../components/MessageStatusTicks";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";
import { getRealtimeSocketForRole } from "../realtime/socket";
import usePatientAuthStore from "../store/patientAuthStore";

const formatMessageDate = (date) =>
  new Date(date).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

export default function PatientChatPage() {
  const currentRole = "patient";
  const navigate = useNavigate();
  const { patient, logout } = usePatientAuthStore();
  const [chatData, setChatData] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageNodesRef = useRef(new Map());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const seenMessageIdsRef = useRef(new Set());

  const scrollMessagesToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
    setShowJumpToLatest(false);
  };

  const patchMessages = (updater) => {
    setChatData((prev) => {
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

  const markMessagesSeenLocally = (messageIds = []) => {
    const normalizedIds = messageIds.map(String).filter(Boolean);
    if (normalizedIds.length === 0) return;

    const now = new Date().toISOString();
    const idSet = new Set(normalizedIds);
    patchMessages((messages) => messages.map((message) => {
      if (!idSet.has(String(message._id || ""))) return message;
      if (message.senderRole === currentRole) return message;
      return {
        ...message,
        status: "seen",
        deliveredAt: message.deliveredAt || now,
        seenAt: now,
      };
    }));
  };

  const markMessagesDeliveredLocally = (messageIds = []) => {
    const normalizedIds = messageIds.map(String).filter(Boolean);
    if (normalizedIds.length === 0) return;

    const now = new Date().toISOString();
    const idSet = new Set(normalizedIds);
    patchMessages((messages) => messages.map((message) => {
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

  const emitVisibleSeenMessages = () => {
    const container = messagesContainerRef.current;
    if (!container || !chatData?.chat?.messages?.length) return;

    const containerRect = container.getBoundingClientRect();
    const visibleIds = [];

    for (const message of chatData.chat.messages) {
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
    markMessagesSeenLocally(visibleIds);

    const socket = getRealtimeSocketForRole(currentRole);
    socket.emit("message_seen", { messageIds: visibleIds });
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

  const loadChat = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/patient-chats/patient/me");
      setChatData(res.data || null);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
      toast.error("Failed to load chat");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
    const socket = getRealtimeSocketForRole("patient");

    const handleChatUpdate = ({ payload } = {}) => {
      if (!payload) return;
      setChatData(payload);
      setOptimisticMessages([]);
      setIsLoading(false);
    };

    const handleMessageDelivered = ({ messageIds = [] } = {}) => {
      markMessagesDeliveredLocally(messageIds);
    };

    const handleMessageSeen = ({ messageIds = [] } = {}) => {
      markMessagesSeenLocally(messageIds);
    };

    const handleSocketError = (error) => {
      if (error?.message !== "Unauthorized") return;
      logout();
    };

    const handleReconnectSync = () => {
      joinPatientRoom();
      loadChat();
    };
    const joinPatientRoom = () => {
      socket.emit("patient-chat:join");
    };

    socket.connect();
    joinPatientRoom();
    socket.on("connect", handleReconnectSync);
    socket.on("patient-chat:self-updated", handleChatUpdate);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("message_seen", handleMessageSeen);
    socket.on("connect_error", handleSocketError);

    return () => {
      socket.emit("patient-chat:leave");
      socket.off("connect", handleReconnectSync);
      socket.off("patient-chat:self-updated", handleChatUpdate);
      socket.off("connect_error", handleSocketError);
    };
  }, []);

  useEffect(() => {
    scrollMessagesToBottom();
    const timeoutId = window.setTimeout(scrollMessagesToBottom, 120);
    return () => window.clearTimeout(timeoutId);
  }, [chatData?.chat?.messages, optimisticMessages]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      emitVisibleSeenMessages();
    }, 160);
    return () => window.clearTimeout(timeoutId);
  }, [chatData?.chat?.messages, optimisticMessages, chatData?.patient?._id]);

  useEffect(() => {
    updateJumpToLatestVisibility();
  }, [chatData?.chat?.messages, optimisticMessages]);

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
    if (!messageText.trim() && files.length === 0 && !voiceDraft?.file) {
      toast.error("Type a message or add a file");
      return;
    }

    const textToSend = messageText.trim();
    const outgoingFiles = voiceDraft?.file ? [...files, voiceDraft.file] : files;
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
      senderRole: "patient",
      senderName: patientName,
      text: textToSend,
      attachments: optimisticAttachments,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setIsSending(true);
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setMessageText("");
    setFiles([]);
    discardVoiceDraft(false);
    try {
      const formData = new FormData();
      if (textToSend) {
        formData.append("text", textToSend);
      }
      outgoingFiles.forEach((file) => formData.append("attachments", file));
      await axiosInstance.post("/patient-chats/patient/me/messages", formData, {
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
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const renderMessageStatus = (message) => {
    if (message.senderRole !== currentRole) return null;
    return <MessageStatusTicks status={message.status || "sent"} className="ml-1" />;
  };

  const isImageFile = (file) => {
    const mimeType = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();
    return mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(name);
  };

  const getAttachmentKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

  const imagePreviewUrls = useMemo(() => {
    const map = new Map();
    files.forEach((file) => {
      if (isImageFile(file)) {
        map.set(getAttachmentKey(file), URL.createObjectURL(file));
      }
    });
    return map;
  }, [files]);

  useEffect(
    () => () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    },
    [imagePreviewUrls],
  );

  const messages = [...(chatData?.chat?.messages || []), ...optimisticMessages];
  const doctor = chatData?.doctor;
  const patientName = chatData?.patient?.name || patient?.name || "Patient";

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

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/patient-auth/logout");
    } catch {
      // Continue local logout even when network request fails.
    } finally {
      logout();
      navigate("/patient-login", { replace: true });
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-1rem)] h-[calc(100vh-1rem)] w-full max-w-5xl flex-col rounded-3xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/95 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.2)] sm:min-h-[calc(100vh-2rem)] sm:h-[calc(100vh-2rem)]">
      <div className="border-b border-[var(--color-border)]/80 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-secondary)]">Patient Chat</p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">{doctor ? `Dr. ${doctor.fullName}` : "Doctor"}</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">{patientName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)]/80 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-soft)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
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
          {isLoading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Loading chat...</p>
          ) : messages.length === 0 ? (
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
                            <img src={attachment.url} alt={attachment.name} loading="lazy" onLoad={scrollMessagesToBottom} className="max-h-64 w-full object-cover" />
                          </button>
                        ) : isAudioAttachment(attachment) ? (
                          <VoiceMessagePlayer
                            key={attachment.url}
                            src={attachment.url}
                            title={attachment.name}
                            badge={message.senderRole === "patient" ? "Sent voice" : "Voice note"}
                            theme={message.senderRole === "patient" ? sentVoiceTheme : receivedVoiceTheme}
                          />
                        ) : (
                          <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-[var(--color-border)]/80 px-3 py-2 text-xs text-[var(--color-primary)] hover:underline">
                            {attachment.name}
                          </a>
                        )
                      ))}
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[var(--color-text-secondary)]">
                    <span>{formatMessageDate(message.createdAt)}</span>
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

      <div className="border-t border-[var(--color-border)]/80 p-3 sm:p-4">
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
          <div className="mb-3 rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/85 px-3 py-2">
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

        {files.length > 0 && (
          <div className="mb-3 space-y-2">
            {files.map((file, idx) => (
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
            onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
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

          {messageText.trim() || files.length > 0 || voiceDraft?.file ? (
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
