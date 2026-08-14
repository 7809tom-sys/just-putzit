import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Send, Gamepad2, ArrowLeft, Clock, Phone, PhoneOff, PhoneCall, MicOff, Mic, CalendarHeart, CalendarPlus, MapPin } from "lucide-react";
import { VoiceMessageRecorder, VoiceMessagePlayer } from "@/components/VoiceMessage";
import { EventProposalDialog } from "@/components/EventProposalDialog";
import { buildBookingCalendarEvent, getBookingIcs } from "@/lib/bookingCalendar";
import { showCalendarDownloadToast } from "@/components/CalendarDownloadToast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface VoiceMsg {
  id: number;
  matchId: number;
  senderId: number;
  s3Url: string;
  durationSeconds: number;
  playedAt: string | null;
  createdAt: string;
  isVoice: true;
}

type ChatEntry =
  | { isVoice: false; id: number; senderId: number; content: string; createdAt: Date | string; matchId?: number; isRead?: boolean; messageType?: "text" | "event_proposal"; proposalId?: number | null }
  | VoiceMsg;

// ─── WebRTC helpers ───────────────────────────────────────────────────────────
function useVoiceCall(myUserId: number | undefined, otherUserId: number | undefined) {
  const [callState, setCallState] = useState<"idle" | "calling" | "incoming" | "active">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // Connect WebSocket signaling
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
      } else if (msg.type === "ice-candidate" && pcRef.current) {
        try { await pcRef.current.addIceCandidate(msg.candidate); } catch {}
      } else if (msg.type === "call-end" || msg.type === "call-reject") {
        hangUp(false);
        if (msg.type === "call-reject") toast.info("Call declined");
      } else if (msg.type === "call-unavailable") {
        toast.info("Your match is not available right now");
        hangUp(false);
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => { ws.close(); };
  }, [myUserId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "ice-candidate",
          targetUserId: otherUserId,
          candidate: e.candidate,
        }));
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

  const hangUp = useCallback((notify = true) => {
    if (notify && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "call-end", targetUserId: otherUserId }));
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setCallState("idle");
    setIsMuted(false);
  }, [otherUserId]);

  const rejectCall = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "call-reject", targetUserId: otherUserId }));
    setCallState("idle");
  }, [otherUserId]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  return { callState, isMuted, startCall, acceptCall, hangUp, rejectCall, toggleMute };
}

function downloadProposalCalendar(event: { title: string; eventDate: Date | string; endDate?: Date | string | null; venueName?: string | null; address?: string | null; externalUrl?: string | null }) {
  const start = new Date(event.eventDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const durationMinutes = end && end.getTime() > start.getTime() ? Math.round((end.getTime() - start.getTime()) / 60_000) : 120;
  const calendarEvent = buildBookingCalendarEvent({
    title: event.title,
    start: event.eventDate,
    durationMinutes,
    location: [event.venueName, event.address].filter(Boolean).join(" · "),
    details: event.externalUrl ? `Public event proposal accepted through Just Putzit. Details: ${event.externalUrl}` : "Public event proposal accepted through Just Putzit.",
  });
  if (!calendarEvent) return;
  const blob = new Blob([getBookingIcs(calendarEvent)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "just-putzit-event"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showCalendarDownloadToast("Your accepted event was added as a standard calendar file.");
}

function ProposalMessage({ entry, viewerId, pending, onRespond }: { entry: any; viewerId?: number; pending: boolean; onRespond: (proposalId: number, status: "accepted" | "declined") => void }) {
  const { proposal, event } = entry;
  const isRecipient = proposal.recipientId === viewerId;
  const isAccepted = proposal.status === "accepted";
  const eventDate = new Date(event.eventDate).toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return <div className="w-full max-w-sm rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-left shadow-sm">
    <div className="flex items-start gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white"><CalendarHeart className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-800">Public-event invitation</p><p className="mt-0.5 font-semibold leading-snug text-foreground">{event.title}</p></div></div>
    <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{eventDate}{event.venueName ? ` · ${event.venueName}` : ""}</p>
    {proposal.note && <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm italic text-foreground/80">“{proposal.note}”</p>}
    {proposal.status === "pending" && (isRecipient ? <div className="mt-4 flex gap-2"><Button size="sm" className="flex-1 rounded-xl bg-teal-700 text-white hover:bg-teal-800" disabled={pending} onClick={() => onRespond(proposal.id, "accepted")}>Accept</Button><Button size="sm" variant="outline" className="flex-1 rounded-xl border-orange-200 bg-white" disabled={pending} onClick={() => onRespond(proposal.id, "declined")}>Decline</Button></div> : <p className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-muted-foreground">Waiting for their answer. They can accept or decline privately.</p>)}
    {isAccepted && <div className="mt-4 rounded-xl bg-teal-50 p-3"><p className="font-semibold text-teal-900">You’re going together!</p><p className="mt-0.5 text-xs text-teal-800">This event is marked “going” for both of you.</p><Button size="sm" variant="outline" className="mt-2 rounded-lg border-teal-200 bg-white text-teal-800" onClick={() => downloadProposalCalendar(event)}><CalendarPlus className="mr-1.5 h-3.5 w-3.5" />Save to calendar</Button></div>}
    {proposal.status === "declined" && <p className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-xs text-muted-foreground">Invitation declined. No further action is needed.</p>}
  </div>;
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [chatStart] = useState(() => Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mid = parseInt(matchId || "0");

  const { data: match } = trpc.matchmaking.getMyMatches.useQuery(undefined, {
    enabled: !!mid,
    select: (matches) => matches.find((m) => m.id === mid),
  });
  const { data: messages, refetch } = trpc.chat.getMessages.useQuery(
    { matchId: mid },
    { enabled: !!mid, refetchInterval: 3000 },
  );
  const { data: proposals, refetch: refetchProposals } = trpc.eventProposals.getForMatch.useQuery(
    { matchId: mid },
    { enabled: !!mid, refetchInterval: 3000 },
  );
  const { data: profile } = trpc.profile.get.useQuery();

  // Voice messages state
  const [voiceMsgs, setVoiceMsgs] = useState<VoiceMsg[]>([]);
  const [playedIds, setPlayedIds] = useState<Set<number>>(new Set());

  // Fetch voice messages
  useEffect(() => {
    if (!mid) return;
    const load = () =>
      fetch(`/api/voice/messages/${mid}`)
        .then((r) => r.json())
        .then((data: any[]) => {
          setVoiceMsgs(
            data.map((m) => ({
              ...m,
              isVoice: true as const,
            })),
          );
        })
        .catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [mid]);

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => refetch(),
    onError: () => toast.error("Couldn't send message"),
  });
  const respondToProposal = trpc.eventProposals.respond.useMutation({
    onSuccess: (result) => {
      refetchProposals();
      refetch();
      toast.success(result.proposal.status === "accepted" ? "You’re going together!" : "Invitation declined", {
        description: result.proposal.status === "accepted" ? "The event is now in your Just Putzit plans." : "No further action is needed.",
      });
    },
    onError: (error) => toast.error("Couldn’t update invitation", { description: error.message }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, voiceMsgs]);

  const handleSend = () => {
    if (!input.trim() || !mid) return;
    sendMessage.mutate({ matchId: mid, content: input.trim() });
    setInput("");
  };

  const elapsedMinutes = Math.floor((Date.now() - chatStart) / 60000);
  const otherProfile = match?.otherProfile;
  const myUserId = profile?.userId;
  const otherUserId = otherProfile?.userId;

  const { callState, isMuted, startCall, acceptCall, hangUp, rejectCall, toggleMute } =
    useVoiceCall(myUserId, otherUserId);

  // Merge text + voice messages by time
  const allEntries: ChatEntry[] = [
    ...(messages?.map((m) => ({ ...m, isVoice: false as const })) ?? []),
    ...voiceMsgs,
  ]    .sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime());
  const proposalById = useMemo(() => new Map((proposals ?? []).map((entry) => [entry.proposal.id, entry])), [proposals]);

  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      <div className="container py-4 flex-1 flex flex-col max-w-2xl">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm p-4 mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/matches")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {otherProfile && (
            <>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: otherProfile.avatarColor || "#f97316" }}
              >
                {otherProfile.avatarEmoji || "😊"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{otherProfile.displayName}</p>
                <p className="text-xs text-green-500 font-medium">● Online</p>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedMinutes}m</span>
          </div>
          {match && <EventProposalDialog
            matchId={mid}
            matchName={otherProfile?.displayName || "your match"}
            city={profile?.city}
            onSent={() => { refetch(); refetchProposals(); }}
            trigger={<Button size="sm" variant="outline" className="h-9 rounded-full border-orange-200 bg-orange-50 px-2.5 text-orange-800 hover:bg-orange-100 sm:px-3"><CalendarHeart className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Invite</span></Button>}
          />}
          {/* Voice call button */}
          {callState === "idle" && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full w-9 h-9 p-0 text-green-600 hover:bg-green-50"
              onClick={startCall}
              title="Start voice call"
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
          {callState === "calling" && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full w-9 h-9 p-0 text-orange-500 animate-pulse"
              onClick={() => hangUp()}
              title="Cancel call"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          )}
          {callState === "active" && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className={`rounded-full w-9 h-9 p-0 ${isMuted ? "text-red-500" : "text-foreground"}`}
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full w-9 h-9 p-0 text-red-500 hover:bg-red-50"
                onClick={() => hangUp()}
                title="End call"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          )}
          {elapsedMinutes >= 8 && (
            <Button
              size="sm"
              className="gradient-sally text-white border-0 rounded-xl btn-scale gap-1.5 text-xs"
              onClick={() => navigate(`/games/${matchId}`)}
            >
              <Gamepad2 className="w-3.5 h-3.5" /> Play Games!
            </Button>
          )}
        </div>

        {/* Incoming call banner */}
        {callState === "incoming" && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex items-center gap-3 border border-green-200">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-green-600 animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{otherProfile?.displayName || "Your match"} is calling...</p>
              <p className="text-xs text-muted-foreground">Voice call</p>
            </div>
            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-xl" onClick={acceptCall}>
              Accept
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl text-red-500 border-red-200" onClick={rejectCall}>
              Decline
            </Button>
          </div>
        )}

        {/* Active call banner */}
        {callState === "active" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-2 mb-4 flex items-center gap-2 text-sm text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Voice call active</span>
            {isMuted && <span className="text-xs text-red-500 ml-auto">Muted</span>}
          </div>
        )}

        {/* Calling banner */}
        {callState === "calling" && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2 mb-4 flex items-center gap-2 text-sm text-orange-700">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-medium">Calling {otherProfile?.displayName || "your match"}...</span>
          </div>
        )}

        {/* Sally hint */}
        {elapsedMinutes < 8 && (
          <div className="bg-white/70 rounded-2xl px-4 py-2 mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-base">🤖</span>
            <span>
              Chat for {8 - elapsedMinutes} more minute{8 - elapsedMinutes !== 1 ? "s" : ""} to unlock the Newlywed Game with Sally!
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="bg-white rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {allEntries.length > 0 ? (
              allEntries.map((entry) => {
                const isMe = entry.senderId === myUserId;
                return (
                  <div key={`${entry.isVoice ? "v" : "t"}-${entry.id}`} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                    {!isMe && otherProfile && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
                        style={{ background: otherProfile.avatarColor || "#f97316" }}
                      >
                        {otherProfile.avatarEmoji || "😊"}
                      </div>
                    )}
                    {entry.isVoice ? (
                      <VoiceMessagePlayer
                        url={entry.s3Url}
                        durationSeconds={entry.durationSeconds}
                        messageId={entry.id}
                        isOwn={isMe}
                        played={playedIds.has(entry.id) || !!entry.playedAt}
                        onPlayed={() =>         setPlayedIds((s) => new Set(Array.from(s).concat(entry.id)))}
                      />
                    ) : entry.messageType === "event_proposal" && entry.proposalId && proposalById.get(entry.proposalId) ? (
                      <ProposalMessage entry={proposalById.get(entry.proposalId)} viewerId={myUserId} pending={respondToProposal.isPending} onRespond={(proposalId, status) => respondToProposal.mutate({ proposalId, status }, { onSuccess: (result) => { if (status === "accepted" && result.event) downloadProposalCalendar(result.event); } })} />
                    ) : (
                      <div className={`max-w-xs px-4 py-2.5 text-sm ${isMe ? "chat-bubble-sent" : "chat-bubble-received"}`}>
                        {entry.content}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-muted-foreground text-sm">Say hi to your match!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2 items-center">
            <VoiceMessageRecorder
              matchId={mid}
              onSent={(msg) => {
                setVoiceMsgs((prev) => [
                  ...prev,
                  {
                    id: msg.id,
                    matchId: mid,
                    senderId: myUserId!,
                    s3Url: msg.url,
                    durationSeconds: msg.durationSeconds,
                    playedAt: null,
                    createdAt: new Date().toISOString(),
                    isVoice: true,
                  },
                ]);
              }}
            />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              className="gradient-sally text-white border-0 rounded-xl px-4 btn-scale"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
