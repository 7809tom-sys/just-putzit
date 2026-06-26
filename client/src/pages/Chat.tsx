import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Send, Gamepad2, ArrowLeft, Clock } from "lucide-react";

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [chatStart] = useState(() => Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mid = parseInt(matchId || "0");

  const { data: match } = trpc.matchmaking.getMyMatches.useQuery(undefined, { enabled: !!mid, select: (matches) => matches.find(m => m.id === mid) });
  const { data: messages, refetch } = trpc.chat.getMessages.useQuery({ matchId: mid }, { enabled: !!mid, refetchInterval: 3000 });
  const { data: profile } = trpc.profile.get.useQuery();

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => refetch(),
    onError: () => toast.error("Couldn't send message"),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !mid) return;
    sendMessage.mutate({ matchId: mid, content: input.trim() });
    setInput("");
  };

  const elapsedMinutes = Math.floor((Date.now() - chatStart) / 60000);
  const otherProfile = match?.otherProfile;

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

        {/* Sally hint */}
        {elapsedMinutes < 8 && (
          <div className="bg-white/70 rounded-2xl px-4 py-2 mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-base">🤖</span>
            <span>Chat for {8 - elapsedMinutes} more minute{8 - elapsedMinutes !== 1 ? "s" : ""} to unlock the Newlywed Game with Sally!</span>
          </div>
        )}

        {/* Messages */}
        <div className="bg-white rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages && messages.length > 0 ? (
              messages.map(msg => {
                const isMe = msg.senderId === (profile?.userId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                    {!isMe && otherProfile && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
                        style={{ background: otherProfile.avatarColor || "#f97316" }}
                      >
                        {otherProfile.avatarEmoji || "😊"}
                      </div>
                    )}
                    <div className={`max-w-xs px-4 py-2.5 text-sm ${isMe ? "chat-bubble-sent" : "chat-bubble-received"}`}>
                      {msg.content}
                    </div>
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
          <div className="p-4 border-t flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="rounded-xl"
              onKeyDown={e => e.key === "Enter" && handleSend()}
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
