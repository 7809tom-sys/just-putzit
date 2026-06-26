import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Send, Clock, CheckCircle2 } from "lucide-react";

const INTERVIEW_SECONDS = 90;

export default function Interview() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_SECONDS);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterview = trpc.interview.start.useMutation({
    onSuccess: data => {
      setSessionId(data.sessionId);
      setMessages([{ role: "assistant", content: data.message }]);
      setIsStarted(true);
      startTimer();
    },
    onError: () => toast.error("Couldn't start the interview. Please try again."),
  });

  const chat = trpc.interview.chat.useMutation({
    onSuccess: data => {
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      setIsSending(false);
      if (data.isComplete) {
        setIsComplete(true);
        stopTimer();
        toast.success("Interview complete! Sally updated your profile 🎉");
      }
    },
    onError: () => {
      setIsSending(false);
      toast.error("Something went wrong. Please try again.");
    },
  });

  const completeInterview = trpc.interview.complete.useMutation({
    onSuccess: () => {
      setIsComplete(true);
      stopTimer();
      toast.success("Profile updated! 🌟");
    },
  });

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          if (sessionId) completeInterview.mutate({ sessionId });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !sessionId || isSending || isComplete) return;
    const userMsg = input.trim();
    setInput("");
    setIsSending(true);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    chat.mutate({ sessionId, userMessage: userMsg });
  };

  const timerPercent = (timeLeft / INTERVIEW_SECONDS) * 100;
  const timerColor = timeLeft > 30 ? "bg-primary" : timeLeft > 10 ? "bg-amber-500" : "bg-red-500";

  if (isComplete) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-4xl animate-float">
            🤖
          </div>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-3">Interview Complete!</h2>
          <p className="text-muted-foreground mb-6">
            Sally has updated your profile with everything she learned about you. Your matches are getting smarter! 🌟
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/profile")}>
              View Profile
            </Button>
            <Button className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale" onClick={() => navigate("/matches")}>
              See Matches 💕
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-4xl animate-float sally-glow">
            🤖
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">Chat with Sally!</h2>
          <p className="text-muted-foreground mb-2">
            Sally will ask you a few fun questions to get to know you better.
          </p>
          <div className="bg-primary/10 rounded-2xl p-4 mb-6 text-sm text-foreground">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">90-second interview</span>
            </div>
            <p className="text-muted-foreground">Answer as many questions as you can — every answer helps Sally understand you better and find you amazing matches!</p>
          </div>
          <Button
            className="w-full gradient-sally text-white border-0 rounded-xl h-12 text-base btn-scale"
            onClick={() => startInterview.mutate()}
            disabled={startInterview.isPending}
          >
            {startInterview.isPending ? "Starting..." : "Start Chatting with Sally! 🚀"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: "80vh", maxHeight: 700 }}>
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b">
          <div className="w-10 h-10 rounded-full gradient-sally flex items-center justify-center text-xl">🤖</div>
          <div className="flex-1">
            <p className="font-bold text-sm">Sally AI Helper</p>
            <p className="text-xs text-green-500 font-medium">● Interviewing you</p>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${timeLeft <= 10 ? "text-red-500" : timeLeft <= 30 ? "text-amber-500" : "text-primary"}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
            <div className="text-xs text-muted-foreground">remaining</div>
          </div>
        </div>

        {/* Timer bar */}
        <div className="interview-timer mx-5 mt-2">
          <div
            className={`interview-timer-fill ${timerColor}`}
            style={{ width: `${timerPercent}%`, transition: "width 1s linear, background-color 0.3s" }}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full gradient-sally flex items-center justify-center text-sm flex-shrink-0 mt-1">🤖</div>
              )}
              <div
                className={`max-w-xs px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "chat-bubble-sent" : "chat-bubble-received"}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start gap-2">
              <div className="w-8 h-8 rounded-full gradient-sally flex items-center justify-center text-sm">🤖</div>
              <div className="chat-bubble-received px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="resize-none rounded-xl text-sm"
            rows={2}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending || isComplete}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending || isComplete}
            className="gradient-sally text-white border-0 rounded-xl px-4 btn-scale self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
