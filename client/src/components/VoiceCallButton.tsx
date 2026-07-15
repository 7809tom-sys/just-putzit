/**
 * VoiceCallButton — a self-contained voice call button for game pages.
 * Handles WebRTC signaling, incoming call banner, and active call state.
 * Usage: <VoiceCallButton myUserId={...} otherUserId={...} otherName="..." />
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, PhoneOff, PhoneCall, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  myUserId: number | undefined;
  otherUserId: number | undefined;
  otherName?: string;
}

export function VoiceCallButton({ myUserId, otherUserId, otherName = "Your match" }: Props) {
  const [callState, setCallState] = useState<"idle" | "calling" | "incoming" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

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
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }
      remoteAudioRef.current.srcObject = e.streams[0];
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
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setCallState("idle");
    setIsMuted(false);
  }, [otherUserId]);

  const startCall = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
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

      {/* Active call banner */}
      {callState === "active" && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-green-700">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium flex-1">Voice call active</span>
          <Button size="sm" variant="ghost" className={`rounded-full w-8 h-8 p-0 ${isMuted ? "text-red-500" : ""}`} onClick={toggleMute}>
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0 text-red-500" onClick={() => hangUp()}>
            <PhoneOff className="w-3.5 h-3.5" />
          </Button>
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
