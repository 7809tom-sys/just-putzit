import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";
import { Send, Clock, CheckCircle2, CalendarDays, Heart, ThumbsDown, MapPin, Mic, MicOff } from "lucide-react";

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
  const [eventSuggestions, setEventSuggestions] = useState<Array<{
    id: number;
    title: string;
    eventDate: Date | string;
    venueName?: string | null;
    city: string;
    feedback?: "interested" | "not_for_me" | null;
  }>>([]);
  const [discoveredEvents, setDiscoveredEvents] = useState<Array<{
    id: string;
    title: string;
    start: string;
    venueName?: string;
    city?: string;
    url?: string;
    isFree: boolean;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isSupported: speechSupported, isListening, error: speechError, startListening, stopListening } = useSpeechRecognition((transcript) => {
    setInput((current) => current ? `${current} ${transcript}` : transcript);
  });

  const startInterview = trpc.interview.start.useMutation({
    onSuccess: data => {
      setSessionId(data.sessionId);
      setMessages([{ role: "assistant", content: data.message }]);
      setEventSuggestions(data.eventSuggestions ?? []);
      setDiscoveredEvents(data.discoveredEvents ?? []);
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

  const eventFeedback = trpc.interview.eventFeedback.useMutation({
    onSuccess: (data, variables) => {
      setEventSuggestions((current) => current.map((event) => (
        event.id === variables.eventId ? { ...event, feedback: data.response } : event
      )));
      toast.success(data.response === "interested" ? "Sally will remember this sounds like your kind of event." : "Got it — Sally will use that to sharpen future picks.");
    },
    onError: () => toast.error("We couldn't save that event feedback. Please try again."),
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

  useEffect(() => {
    if (speechError) toast.error(speechError);
  }, [speechError]);

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
          {eventSuggestions.length > 0 && (
            <section className="rounded-2xl border border-primary/15 bg-primary/5 p-3" aria-label="Sally's current local event suggestions">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-foreground">Sally’s current local picks</p>
                  <p className="text-xs text-muted-foreground">Tell Sally what feels like you. She’ll learn from every response.</p>
                </div>
              </div>
              <div className="space-y-2">
                {eventSuggestions.map((event) => (
                  <article key={event.id} className={`rounded-xl border bg-white p-3 ${event.feedback === "not_for_me" ? "opacity-60" : ""}`}>
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <p>{new Date(event.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                      {(event.venueName || event.city) && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venueName ?? event.city}{event.venueName ? ` · ${event.city}` : ""}</p>}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" className="h-8 rounded-full bg-primary text-xs text-white hover:bg-primary/90" disabled={!sessionId || eventFeedback.isPending || event.feedback === "interested"} onClick={() => sessionId && eventFeedback.mutate({ sessionId, eventId: event.id, response: "interested" })}>
                        <Heart className="mr-1 h-3.5 w-3.5" /> {event.feedback === "interested" ? "Interested" : "Sounds good"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" disabled={!sessionId || eventFeedback.isPending || event.feedback === "not_for_me"} onClick={() => sessionId && eventFeedback.mutate({ sessionId, eventId: event.id, response: "not_for_me" })}>
                        <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Not for me
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
          {discoveredEvents.length > 0 && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3" aria-label="Happening near you">
              <p className="text-sm font-bold text-foreground">Happening near you</p>
              <p className="mb-2 text-xs text-muted-foreground">Public plans Sally can use for a date, friends, or a Gym Buddy workout.</p>
              <div className="space-y-2">
                {discoveredEvents.map((event) => (
                  <article key={event.id} className="rounded-xl border bg-white p-3">
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(event.start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{event.venueName || event.city ? ` · ${event.venueName ?? event.city}` : ""}{event.isFree ? " · Free" : ""}</p>
                    {event.url && <a href={event.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">Official details</a>}
                  </article>
                ))}
              </div>
            </section>
          )}
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
        <div className="border-t p-4">
          <p className="mb-2 text-xs text-muted-foreground">{speechSupported ? "You can speak your answer, then review your words before sending." : "Type your answer, then send it when you are ready."}</p>
          <div className="flex gap-2">
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
          {speechSupported && (
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              onClick={isListening ? stopListening : startListening}
              disabled={isSending || isComplete}
              className="self-end rounded-xl px-3"
              aria-label={isListening ? "Stop listening" : "Speak your answer"}
              title={isListening ? "Stop listening" : "Speak your answer"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
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
    </div>
  );
}
