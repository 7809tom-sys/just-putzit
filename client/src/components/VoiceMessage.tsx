/**
 * VoiceMessage — record, send, and play voice messages in chat.
 *
 * VoiceMessageRecorder: hold-to-record mic button, shows duration, sends on release
 * VoiceMessagePlayer: play/pause audio with waveform bars and duration
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Play, Pause, Check } from "lucide-react";
import { toast } from "sonner";

// ─── Recorder ─────────────────────────────────────────────────────────────────

interface RecorderProps {
  matchId: number;
  onSent?: (msg: { id: number; url: string; durationSeconds: number }) => void;
}

export function VoiceMessageRecorder({ matchId, onSent }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch {
      toast.error("Microphone access denied");
    }
  }, []);

  const stopAndSend = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    const recorder = mediaRecorderRef.current;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });

    const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
    if (durationSeconds < 0.5) {
      toast.info("Hold longer to record");
      setElapsed(0);
      return;
    }

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
    const formData = new FormData();
    formData.append("audio", blob, "voice.webm");
    formData.append("matchId", String(matchId));
    formData.append("durationSeconds", String(durationSeconds.toFixed(1)));

    setIsSending(true);
    try {
      const resp = await fetch("/api/voice/upload", { method: "POST", body: formData });
      if (!resp.ok) throw new Error("Upload failed");
      const data = await resp.json();
      onSent?.(data);
      setElapsed(0);
    } catch {
      toast.error("Failed to send voice message");
    } finally {
      setIsSending(false);
    }
  }, [isRecording, matchId, onSent]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <span className="text-xs text-red-500 font-mono animate-pulse">
          {formatTime(elapsed)}
        </span>
      )}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopAndSend}
        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopAndSend(); }}
        disabled={isSending}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150
          ${isRecording
            ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40"
            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
          }
          ${isSending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        title={isRecording ? "Release to send" : "Hold to record"}
      >
        {isSending ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// ─── Player ───────────────────────────────────────────────────────────────────

interface PlayerProps {
  url: string;
  durationSeconds: number;
  messageId: number;
  isOwn: boolean;
  played?: boolean;
  onPlayed?: () => void;
}

export function VoiceMessagePlayer({ url, durationSeconds, messageId, isOwn, played, onPlayed }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasMarkedPlayed = useRef(false);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      setProgress(pct);
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if (!isOwn && !hasMarkedPlayed.current) {
        hasMarkedPlayed.current = true;
        fetch(`/api/voice/played/${messageId}`, { method: "POST" }).catch(() => {});
        onPlayed?.();
      }
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url, messageId, isOwn, onPlayed]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => toast.error("Could not play audio"));
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const displayDuration = currentTime > 0 ? currentTime : durationSeconds;

  // Waveform bars (static decorative)
  const bars = Array.from({ length: 20 }, (_, i) => {
    const heights = [4, 8, 12, 6, 16, 10, 14, 8, 18, 12, 10, 16, 8, 14, 6, 12, 18, 8, 10, 6];
    return heights[i % heights.length];
  });

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl min-w-[180px] max-w-[240px] ${
      isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
    }`}>
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
          isOwn ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20"
        }`}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      {/* Waveform */}
      <div className="flex items-center gap-[2px] flex-1 h-8">
        {bars.map((h, i) => {
          const filled = (i / bars.length) * 100 <= progress;
          return (
            <div
              key={i}
              className={`rounded-full flex-shrink-0 transition-colors duration-100 ${
                filled
                  ? isOwn ? "bg-white" : "bg-primary"
                  : isOwn ? "bg-white/40" : "bg-muted-foreground/30"
              }`}
              style={{ width: 2, height: h }}
            />
          );
        })}
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] font-mono opacity-80">{formatTime(displayDuration)}</span>
        {!isOwn && (
          <span className="text-[9px] opacity-60">{played ? "Heard" : "New"}</span>
        )}
        {isOwn && played && (
          <Check className="w-3 h-3 opacity-60" />
        )}
      </div>
    </div>
  );
}
