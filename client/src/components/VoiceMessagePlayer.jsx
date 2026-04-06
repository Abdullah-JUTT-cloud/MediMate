import { useEffect, useRef, useState } from "react";
import { AudioLines, Pause, Play, Volume2 } from "lucide-react";

const DEFAULT_THEME = {
  surface: "color-mix(in srgb, var(--color-bg-soft) 72%, var(--color-card) 28%)",
  border: "color-mix(in srgb, var(--color-border) 82%, transparent)",
  accent: "var(--color-primary)",
  accentSoft: "color-mix(in srgb, var(--color-primary) 16%, transparent)",
  text: "var(--color-text-primary)",
  muted: "var(--color-text-secondary)",
};

const VOICE_FILE_PATTERN = /^voice-note-\d+\.(webm|ogg|mp3|wav|m4a|aac)$/i;

const formatAudioTime = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const normalizeVoiceLabel = (title) => {
  const fileName = String(title || "").trim();
  if (!fileName) return "Voice message";
  return VOICE_FILE_PATTERN.test(fileName) ? "Voice message" : fileName;
};

export default function VoiceMessagePlayer({
  src,
  title,
  badge = "Voice",
  duration = 0,
  action = null,
  theme = {},
  className = "",
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  const resolvedTheme = { ...DEFAULT_THEME, ...theme };
  const displayTitle = normalizeVoiceLabel(title);
  const progress = totalDuration > 0 ? Math.min(currentTime / totalDuration, 1) : 0;
  const barHeights = [14, 22, 17, 26, 20, 30, 18, 28, 16, 24, 19, 27];

  useEffect(() => {
    setTotalDuration(duration || 0);
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const syncTime = () => {
      setCurrentTime(audio.currentTime || 0);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncTime);
    audio.addEventListener("durationchange", syncTime);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncTime);
      audio.removeEventListener("durationchange", syncTime);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div
      className={`rounded-[1.25rem] border px-3 py-3 ${className}`.trim()}
      style={{
        borderColor: resolvedTheme.border,
        background: `linear-gradient(135deg, ${resolvedTheme.surface}, color-mix(in srgb, ${resolvedTheme.accentSoft} 55%, ${resolvedTheme.surface} 45%))`,
        boxShadow: `inset 0 1px 0 color-mix(in srgb, ${resolvedTheme.accent} 10%, transparent)`,
      }}
    >
      <audio ref={audioRef} preload="metadata" src={src} />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2.5">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            style={{
              color: resolvedTheme.accent,
              borderColor: "color-mix(in srgb, currentColor 18%, transparent)",
              background: resolvedTheme.accentSoft,
            }}
          >
            <AudioLines className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: resolvedTheme.muted }}>
              {badge}
            </p>
            <p className="truncate text-sm font-medium" style={{ color: resolvedTheme.text }}>
              {displayTitle}
            </p>
          </div>
        </div>
        {action}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-[1.03] active:scale-95"
          style={{
            color: "#fff",
            background: `linear-gradient(135deg, ${resolvedTheme.accent}, color-mix(in srgb, ${resolvedTheme.accent} 70%, black 30%))`,
            boxShadow: `0 10px 20px -14px ${resolvedTheme.accent}`,
          }}
          aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        >
          {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="ml-0.5 h-4.5 w-4.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-end gap-1">
            {barHeights.map((height, index) => {
              const threshold = barHeights.length === 1 ? 1 : index / (barHeights.length - 1);
              const isActive = progress >= threshold;
              return (
                <span
                  key={`${height}-${index}`}
                  className={`block w-1 rounded-full transition-all duration-200 ${isPlaying && isActive ? "animate-pulse" : ""}`}
                  style={{
                    height,
                    opacity: isActive ? 1 : 0.28,
                    background: isActive
                      ? `linear-gradient(180deg, ${resolvedTheme.accent}, color-mix(in srgb, ${resolvedTheme.accent} 60%, white 40%))`
                      : "color-mix(in srgb, var(--color-text-secondary) 40%, transparent)",
                  }}
                />
              );
            })}
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(totalDuration, 0)}
            step="0.1"
            value={Math.min(currentTime, totalDuration || currentTime || 0)}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent"
            style={{
              background: `linear-gradient(90deg, ${resolvedTheme.accent} 0%, ${resolvedTheme.accent} ${progress * 100}%, color-mix(in srgb, ${resolvedTheme.muted} 22%, transparent) ${progress * 100}%, color-mix(in srgb, ${resolvedTheme.muted} 22%, transparent) 100%)`,
            }}
            aria-label="Seek voice message"
          />

          <div className="mt-2 flex items-center justify-between gap-3 text-[11px]" style={{ color: resolvedTheme.muted }}>
            <span>{formatAudioTime(currentTime)}</span>
            <span className="inline-flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5" />
              {formatAudioTime(totalDuration || duration || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
