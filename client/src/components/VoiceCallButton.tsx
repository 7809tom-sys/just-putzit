/**
 * VoiceCallButton — self-contained voice call button for game pages.
 * Includes AudioAnalyser-based speaking detection with glowing avatar rings.
 * Usage: <VoiceCallButton myUserId={...} otherUserId={...} otherName="..." otherAvatar={...} myAvatar={...} />
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, PhoneOff, PhoneCall, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  myUserId: number | undefined;
  otherUserId: number | undefined;
  otherName?: string;
  /** Emoji or image URL for the other person's avatar */
  otherAvatar?: string;
  /** Emoji or image URL for my avatar */
  myAvatar?: string;
  otherAvatarColor?: string;
  myAvatarColor?: string;
}

// ─── Audio level analyser hook ────────────────────────────────────────────────
function useAudioLevel(stream: MediaStream | null): boolean {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      setIsSpeaking(false);
      return;
    }
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      setIsSpeaking(avg > 12); // threshold: ~12/255
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.close();
    };
  }, [stream]);

  return isSpeaking;
}

// ─── Glowing avatar component ─────────────────────────────────────────────────
function SpeakingAvatar({
  emoji,
  color,
  isSpeaking,
  label,
  size = "lg",
}: {
  emoji?: string;
  color?: string;
  isSpeaking: boolean;
  label: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-16 h-16 text-2xl" : "w-12 h-12 text-xl";
  const ringSize = size === "lg" ? "w-20 h-20" : "w-16 h-16";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring — only visible when speaking */}
        <div
          className={`absolute rounded-full transition-all duration-150 ${ringSize} ${
            isSpeaking
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90"
          }`}
          style={{
            background: isSpeaking
              ? `radial-gradient(circle, ${color || "#22c55e"}44 0%, transparent 70%)`
              : "transparent",
            boxShadow: isSpeaking
              ? `0 0 0 3px ${color || "#22c55e"}88, 0 0 16px 4px ${color || "#22c55e"}44`
              : "none",
          }}
        />
        {/* Pulsing ring animation when speaking */}
        {isSpeaking && (
          <div
            className={`absolute rounded-full ${ringSize} animate-ping`}
            style={{
              border: `2px solid ${color || "#22c55e"}`,
              opacity: 0.4,
            }}
          />
        )}
        {/* Avatar circle */}
        <div
          className={`${dim} rounded-full flex items-center justify-center relative z-10 transition-transform duration-100 ${isSpeaking ? "scale-105" : "scale-100"}`}
          style={{ background: color || "#f97316" }}
        >
          {emoji || "😊"}
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      {isSpeaking && (
        <div className="flex gap-[3px] items-end h-3">
          {[3, 5, 7, 5, 3].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-green-500"
              style={{
                height: h,
                animation: `soundbar 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function VoiceCallButton({
  myUserId,
  otherUserId,
  otherName = "Your match",
  otherAvatar,
  myAvatar,
  otherAvatarColor = "#3b82f6",
  myAvatarColor = "#f97316",
}: Props) {
  const [callState, setCallState] = useState<"idle" | "calling" | "incoming" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // Speaking detection
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const iAmSpeaking = useAudioLevel(isMuted ? null : localStream);
  const theyAreSpeaking = useAudioLevel(remoteStream);

  useEffect(() => {
    if (!myUserId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/voice/signal`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register", userId: myUserId }));
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "call-offer") {
        incomingOfferRef.current = msg.offer;
        setCallState("incoming");
      } else if (msg.type === "call-answer" && pcRef.current) {
        await pcRef.current.setRemoteDescription(msg.answer);
        setCallState("active");
      } else if (msg.type === "ice-candidate" && pcRef.current) {
        try { await pcRef.current.addIceCandidate(msg.candidate); } catch {}
      } else if (msg.type === "call-end" || msg.type === "call-reject") {
        hangUp(false);
        if (msg.type === "call-reject") toast.info("Call declined");
      } else if (msg.type === "call-unavailable") {
        toast.info(`${otherName} is not available right now`);
        hangUp(false);
      }
    };

    return () => { ws.close(); };
  }, [myUserId, otherName]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ice-candidate", targetUserId: otherUserId, candidate: e.candidate }));
      }
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }
      remoteAudioRef.current.srcObject = stream;
    };
    return pc;
  }, [otherUserId]);

  const hangUp = useCallback((notify = true) => {
    if (notify && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "call-end", targetUserId: otherUserId }));
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setIsMuted(false);
  }, [otherUserId]);

  const startCall = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current?.send(JSON.stringify({ type: "call-offer", targetUserId: otherUserId, offer }));
      setCallState("calling");
    } catch {
      toast.error("Could not access microphone");
    }
  }, [otherUserId, createPeerConnection]);

  const acceptCall = useCallback(async () => {
    if (!incomingOfferRef.current || !otherUserId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(incomingOfferRef.current);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      wsRef.current?.send(JSON.stringify({ type: "call-answer", targetUserId: otherUserId, answer }));
      setCallState("active");
    } catch {
      toast.error("Could not access microphone");
    }
  }, [otherUserId, createPeerConnection]);

  const rejectCall = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "call-reject", targetUserId: otherUserId }));
    setCallState("idle");
  }, [otherUserId]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((m) => !m);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Incoming call banner */}
      {callState === "incoming" && (
        <div className="bg-white rounded-2xl shadow-lg p-3 flex items-center gap-3 border border-green-200">
          <PhoneCall className="w-5 h-5 text-green-600 animate-bounce flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{otherName} is calling...</p>
          </div>
          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs px-3" onClick={acceptCall}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl text-red-500 border-red-200 text-xs px-3" onClick={rejectCall}>
            Decline
          </Button>
        </div>
      )}

      {/* Active call — avatars with speaking rings */}
      {callState === "active" && (
        <div className="bg-white border border-green-200 rounded-2xl px-4 py-4 shadow-sm">
          {/* Speaking avatars */}
          <div className="flex items-center justify-around mb-4">
            <SpeakingAvatar
              emoji={myAvatar}
              color={iAmSpeaking ? "#22c55e" : myAvatarColor}
              isSpeaking={iAmSpeaking}
              label="You"
            />
            <div className="flex flex-col items-center gap-1">
              <div className="text-lg">📞</div>
              <div className="flex gap-[2px]">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-green-400"
                    style={{ animation: `ping 1.2s ${i * 0.3}s ease-in-out infinite` }}
                  />
                ))}
              </div>
            </div>
            <SpeakingAvatar
              emoji={otherAvatar}
              color={theyAreSpeaking ? "#22c55e" : otherAvatarColor}
              isSpeaking={theyAreSpeaking}
              label={otherName}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className={`rounded-full w-10 h-10 p-0 ${isMuted ? "border-red-300 text-red-500 bg-red-50" : "border-gray-200"}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              className="rounded-full w-12 h-12 p-0 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => hangUp()}
              title="End call"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Calling banner */}
      {callState === "calling" && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-orange-700">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-medium flex-1">Calling {otherName}...</span>
          <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0 text-red-500" onClick={() => hangUp()}>
            <PhoneOff className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Idle call button */}
      {callState === "idle" && (
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
          onClick={startCall}
          disabled={!otherUserId}
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="text-xs">Voice Call</span>
        </Button>
      )}
    </div>
  );
}
