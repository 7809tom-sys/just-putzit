import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Trophy, Send, Zap, Crown, Users, Copy, Check, ArrowLeft, Radio, Timer, RefreshCw, Shield } from "lucide-react";

type ChatMsg = {
  id: number;
  userId: number;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  message: string;
  createdAt: Date | string;
  teamFlair?: string | null;
};

type TriviaQuestion = {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  launchedAt: Date | string;
};

const REACTIONS = ["🔥", "🎯", "😱", "👏", "💀", "🏆"];
const TRIVIA_SECONDS = 30;

export default function WatchParty() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const numRoomId = parseInt(roomId || "0");

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [lastMsgId, setLastMsgId] = useState(0);
  const [prevPlayerIds, setPrevPlayerIds] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [myAnswer, setMyAnswer] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Custom trivia form (host)
  const [showFlairPicker, setShowFlairPicker] = useState(false);
  const [myFlair, setMyFlair] = useState<string | null>(null);

  const [showTriviaForm, setShowTriviaForm] = useState(false);
  const [triviaForm, setTriviaForm] = useState({
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctAnswer: "A" as "A" | "B" | "C" | "D",
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Room data (polls every 5s)
  const { data: roomData } = trpc.watchParty.getRoom.useQuery(
    { roomId: numRoomId },
    { enabled: !!numRoomId, refetchInterval: 5000 }
  );

  // Chat polling (every 2s)
  const { data: chatData } = trpc.watchParty.getChat.useQuery(
    { roomId: numRoomId, since: lastMsgId },
    { enabled: !!numRoomId, refetchInterval: 2000 }
  );

  // Active trivia (polls every 3s)
  const { data: triviaData, refetch: refetchTrivia } = trpc.watchParty.getActiveTrivia.useQuery(
    { roomId: numRoomId },
    { enabled: !!numRoomId, refetchInterval: 3000 }
  );

  // Leaderboard (polls every 5s)
  const { data: leaderboardData } = trpc.watchParty.getLeaderboard.useQuery(
    { roomId: numRoomId },
    { enabled: !!numRoomId, refetchInterval: 5000 }
  );

  // Live score for this game (polls every 60s)
  const roomInfo = roomData?.room;
  const sportForScore = (roomInfo?.sport === "nfl" || roomInfo?.sport === "nba" || roomInfo?.sport === "mlb") ? roomInfo.sport : null;
  const { data: scoreData, dataUpdatedAt: scoreUpdatedAt, refetch: refetchScore } = trpc.sportsScores.getGameByTeams.useQuery(
    { teamHome: roomInfo?.teamHome ?? "", teamAway: roomInfo?.teamAway ?? "", sport: sportForScore ?? "mlb" },
    { enabled: !!roomInfo && !!sportForScore && !roomInfo.isLocal, refetchInterval: 60_000, refetchIntervalInBackground: false }
  );
  const liveGame = scoreData?.game ?? null;

  // Pool question for host
  const { data: poolQuestion, refetch: refetchPool } = trpc.watchParty.getPoolQuestion.useQuery(
    { team: roomData?.room?.teamHome?.toLowerCase().split(" ").pop() || "packers" },
    { enabled: !!roomData?.isHost }
  );

  const sendChatMutation = trpc.watchParty.sendChat.useMutation();
  const launchTriviaMutation = trpc.watchParty.launchTrivia.useMutation();
  const submitAnswerMutation = trpc.watchParty.submitTriviaAnswer.useMutation();
  const endRoomMutation = trpc.watchParty.endRoom.useMutation();
  const setFlairMutation = trpc.watchParty.setFlair.useMutation();

  const { data: myFlairData } = trpc.watchParty.getMyFlair.useQuery(
    { roomId: numRoomId },
    { enabled: !!numRoomId && !!user }
  );

  useEffect(() => {
    if (myFlairData?.teamFlair !== undefined) setMyFlair(myFlairData.teamFlair);
  }, [myFlairData?.teamFlair]);

  const handleSetFlair = async (flair: string | null) => {
    setMyFlair(flair);
    setShowFlairPicker(false);
    try {
      await setFlairMutation.mutateAsync({ roomId: numRoomId, teamFlair: flair });
      toast.success(flair ? `🏅 Flair set to ${flair}!` : "Flair removed");
    } catch {
      toast.error("Failed to set flair");
    }
  };

  // Merge new chat messages
  useEffect(() => {
    if (!chatData?.messages?.length) return;
    const newMsgs = chatData.messages;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
      return [...prev, ...fresh];
    });
    const maxId = Math.max(...newMsgs.map((m) => m.id));
    if (maxId > lastMsgId) setLastMsgId(maxId);
  }, [chatData]);

  // Detect new player joins
  useEffect(() => {
    if (!roomData?.players) return;
    roomData.players.forEach((p) => {
      if (!prevPlayerIds.has(p.userId) && p.userId !== user?.id) {
        toast.success(`${p.avatarEmoji} ${p.displayName} joined the chat!`, {
          duration: 3000,
          style: { background: "#16a34a", color: "#fff" },
        });
      }
    });
    setPrevPlayerIds(new Set(roomData.players.map((p) => p.userId)));
  }, [roomData?.players]);

  // Reset answer state + start countdown when new trivia launches
  useEffect(() => {
    if (triviaData?.question) {
      setMyAnswer(triviaData.myAnswer as "A" | "B" | "C" | "D" | null);
      setAnswerResult(null);
      // Start 30-second countdown from launch time
      const launchedAt = new Date(triviaData.question.launchedAt).getTime();
      const elapsed = Math.floor((Date.now() - launchedAt) / 1000);
      const remaining = Math.max(0, TRIVIA_SECONDS - elapsed);
      setCountdown(remaining);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (remaining > 0) {
        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c === null || c <= 1) {
              clearInterval(countdownRef.current!);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }
    } else {
      setCountdown(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [triviaData?.question?.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const optimistic: ChatMsg = {
      id: Date.now(),
      userId: user?.id || 0,
      displayName: "You",
      avatarEmoji: "🏈",
      avatarColor: "#ea580c",
      message: chatInput,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setChatInput("");
    try {
      await sendChatMutation.mutateAsync({ roomId: numRoomId, message: chatInput });
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleReaction = async (emoji: string) => {
    const optimistic: ChatMsg = {
      id: Date.now(),
      userId: user?.id || 0,
      displayName: "You",
      avatarEmoji: "🏈",
      avatarColor: "#ea580c",
      message: emoji,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await sendChatMutation.mutateAsync({ roomId: numRoomId, message: emoji });
    } catch { /* silent */ }
  };

  const handleSubmitAnswer = async (answer: "A" | "B" | "C" | "D") => {
    if (!triviaData?.question || myAnswer) return;
    setMyAnswer(answer);
    try {
      const result = await submitAnswerMutation.mutateAsync({
        roomId: numRoomId,
        triviaId: triviaData.question.id,
        answer,
      });
      setAnswerResult({ isCorrect: result.isCorrect, correctAnswer: result.correctAnswer });
      if (result.isCorrect) {
        toast.success(`✅ Correct! +${result.pointsAwarded} points`);
      } else {
        toast.error(`❌ Wrong! Answer was ${result.correctAnswer}`);
      }
      refetchTrivia();
    } catch {
      toast.error("Failed to submit answer");
    }
  };

  const handleLaunchPoolQuestion = async () => {
    if (!poolQuestion?.question) { toast.error("No question available"); return; }
    const q = poolQuestion.question;
    try {
      await launchTriviaMutation.mutateAsync({
        roomId: numRoomId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer as "A" | "B" | "C" | "D",
      });
      toast.success("Commercial break trivia launched! ⚡");
      refetchPool();
      refetchTrivia();
    } catch {
      toast.error("Failed to launch trivia");
    }
  };

  const handleLaunchCustom = async () => {
    if (!triviaForm.questionText || !triviaForm.optionA || !triviaForm.optionB || !triviaForm.optionC || !triviaForm.optionD) {
      toast.error("Fill in all fields"); return;
    }
    try {
      await launchTriviaMutation.mutateAsync({ roomId: numRoomId, ...triviaForm });
      toast.success("Custom trivia launched! ⚡");
      setShowTriviaForm(false);
      setTriviaForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" });
      refetchTrivia();
    } catch {
      toast.error("Failed to launch trivia");
    }
  };

  const handleEndRoom = async () => {
    try {
      await endRoomMutation.mutateAsync({ roomId: numRoomId });
      toast.success("Game Day Chat ended! MVP crowned 🏆");
      navigate("/sports");
    } catch {
      toast.error("Failed to end room");
    }
  };

  const handleCopyCode = () => {
    if (!roomData?.room?.gameCode) return;
    navigator.clipboard.writeText(roomData.room.gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const room = roomData?.room;
  const isHost = roomData?.isHost;
  const players = roomData?.players || [];
  const leaderboard = leaderboardData?.players || [];
  const activeTrivia = triviaData?.question as TriviaQuestion | null | undefined;

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">🏟️</div>
          <p className="text-lg">Loading Game Day Chat...</p>
        </div>
      </div>
    );
  }

  const countdownPct = countdown !== null ? (countdown / TRIVIA_SECONDS) * 100 : 0;
  const countdownColor = countdown !== null && countdown <= 10 ? "text-red-400" : "text-yellow-300";

  const scoreUpdatedTime = scoreUpdatedAt ? new Date(scoreUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 px-4 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/sports")} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-lg">{room.title}</h1>
                <Badge className="bg-red-500 text-white text-xs gap-1 animate-pulse">
                  <Radio className="w-2.5 h-2.5" /> LIVE
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-green-200 text-xs">
                <Users className="w-3 h-3" />
                <span>{players.length} fan{players.length !== 1 ? "s" : ""} in chat</span>
                {isHost && <span className="text-yellow-300 font-semibold">· You are the host</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-white/60 text-xs">Code:</span>
              <span className="text-yellow-300 font-mono font-bold tracking-widest">{room.gameCode}</span>
              <Button size="sm" variant="ghost" onClick={handleCopyCode} className="text-white hover:bg-white/20 h-6 w-6 p-0">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            {isHost && (
              <Button size="sm" onClick={handleEndRoom} disabled={endRoomMutation.isPending} variant="outline" className="border-red-400 text-red-300 hover:bg-red-900/30 text-xs">
                End Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Live Score Banner ─────────────────────────────────────────────── */}
      {liveGame && (
        <div className={`px-4 py-3 border-b border-white/10 ${
          liveGame.isLive ? "bg-gradient-to-r from-red-900/60 to-slate-900" : "bg-slate-900/80"
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              {/* Away team */}
              <div className="flex items-center gap-2 flex-1">
                {liveGame.awayTeam.logo ? (
                  <img src={liveGame.awayTeam.logo} alt={liveGame.awayTeam.abbreviation} className="w-9 h-9 object-contain" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">{liveGame.awayTeam.abbreviation.slice(0,2)}</div>
                )}
                <div>
                  <p className="text-white font-bold text-sm">{liveGame.awayTeam.shortDisplayName || liveGame.awayTeam.displayName}</p>
                  <p className="text-white/40 text-xs">{liveGame.awayTeam.record || "Away"}</p>
                </div>
              </div>

              {/* Score / Status */}
              <div className="text-center flex-shrink-0 px-4">
                {liveGame.isLive ? (
                  <>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-white font-black text-2xl tabular-nums">{liveGame.awayTeam.score || "0"}</span>
                      <span className="text-white/30 text-sm">–</span>
                      <span className="text-white font-black text-2xl tabular-nums">{liveGame.homeTeam.score || "0"}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-400 text-xs font-semibold">{liveGame.statusDetail}</span>
                    </div>
                  </>
                ) : liveGame.isFinal ? (
                  <>
                    <div className="flex items-center justify-center gap-3">
                      <span className={`font-black text-2xl tabular-nums ${liveGame.awayTeam.winner ? "text-white" : "text-white/40"}`}>{liveGame.awayTeam.score || "0"}</span>
                      <span className="text-white/30 text-sm">–</span>
                      <span className={`font-black text-2xl tabular-nums ${liveGame.homeTeam.winner ? "text-white" : "text-white/40"}`}>{liveGame.homeTeam.score || "0"}</span>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">Final</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/60 text-sm font-medium">{liveGame.statusDetail}</p>
                    <p className="text-white/30 text-xs mt-0.5">{liveGame.broadcast && `📺 ${liveGame.broadcast}`}</p>
                  </>
                )}
              </div>

              {/* Home team */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{liveGame.homeTeam.shortDisplayName || liveGame.homeTeam.displayName}</p>
                  <p className="text-white/40 text-xs">{liveGame.homeTeam.record || "Home"}</p>
                </div>
                {liveGame.homeTeam.logo ? (
                  <img src={liveGame.homeTeam.logo} alt={liveGame.homeTeam.abbreviation} className="w-9 h-9 object-contain" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">{liveGame.homeTeam.abbreviation.slice(0,2)}</div>
                )}
              </div>
            </div>

            {/* Footer: venue + last updated */}
            <div className="flex items-center justify-between mt-1.5 text-xs text-white/30">
              <span>{liveGame.venue || ""}</span>
              <div className="flex items-center gap-1.5">
                {scoreUpdatedTime && <span>Updated {scoreUpdatedTime}</span>}
                <button onClick={() => refetchScore()} className="hover:text-white/60 transition-colors" title="Refresh score">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 grid lg:grid-cols-3 gap-4">
        {/* Main column: Chat + Trivia */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Trivia Question */}
          {activeTrivia && (
            <Card className="bg-gradient-to-br from-yellow-900 to-orange-900 border-yellow-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-yellow-300 flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4" /> COMMERCIAL BREAK TRIVIA — Answer Fast!
                  </CardTitle>
                  {countdown !== null && !myAnswer && (
                    <div className="flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-white/60" />
                      <span className={`font-mono font-bold text-lg ${countdownColor}`}>{countdown}s</span>
                    </div>
                  )}
                </div>
                {/* Countdown progress bar */}
                {countdown !== null && !myAnswer && (
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-1000 ${countdown <= 10 ? "bg-red-400" : "bg-yellow-400"}`}
                      style={{ width: `${countdownPct}%` }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white font-medium text-base">{activeTrivia.questionText}</p>
                {!myAnswer ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(["A", "B", "C", "D"] as const).map((letter) => (
                      <Button
                        key={letter}
                        onClick={() => handleSubmitAnswer(letter)}
                        disabled={submitAnswerMutation.isPending || countdown === 0}
                        className="h-auto py-3 flex flex-col items-start text-left bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                      >
                        <span className="font-bold text-yellow-300">{letter}.</span>
                        <span className="text-sm">{activeTrivia[`option${letter}` as keyof TriviaQuestion] as string}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg text-center ${answerResult?.isCorrect ? "bg-green-700/50 border border-green-400" : "bg-red-700/50 border border-red-400"}`}>
                    <p className="text-white font-bold text-lg">{answerResult?.isCorrect ? "✅ Correct! +10 pts" : `❌ Wrong! Answer: ${answerResult?.correctAnswer}`}</p>
                    <p className="text-white/70 text-sm mt-1">You answered: {myAnswer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Host Controls */}
          {isHost && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" /> Host Controls — Commercial Break Trivia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {poolQuestion?.question && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/80 text-sm mb-2">📋 Suggested: {poolQuestion.question.questionText}</p>
                    <Button onClick={handleLaunchPoolQuestion} disabled={launchTriviaMutation.isPending} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm">
                      <Zap className="w-3 h-3 mr-1" /> Launch During Commercial Break
                    </Button>
                  </div>
                )}
                {!showTriviaForm ? (
                  <Button onClick={() => setShowTriviaForm(true)} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 text-sm">
                    + Write Custom Question
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input placeholder="Question text" value={triviaForm.questionText} onChange={(e) => setTriviaForm({ ...triviaForm, questionText: e.target.value })} className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm" />
                    {(["A", "B", "C", "D"] as const).map((l) => (
                      <Input key={l} placeholder={`Option ${l}`} value={triviaForm[`option${l}` as keyof typeof triviaForm] as string} onChange={(e) => setTriviaForm({ ...triviaForm, [`option${l}`]: e.target.value })} className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm" />
                    ))}
                    <div className="flex gap-2 items-center">
                      <span className="text-white/50 text-xs">Correct answer:</span>
                      {(["A", "B", "C", "D"] as const).map((l) => (
                        <Button key={l} size="sm" onClick={() => setTriviaForm({ ...triviaForm, correctAnswer: l })} className={triviaForm.correctAnswer === l ? "bg-green-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}>
                          {l}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleLaunchCustom} disabled={launchTriviaMutation.isPending} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm">
                        Launch
                      </Button>
                      <Button onClick={() => setShowTriviaForm(false)} variant="ghost" className="text-white/50 hover:bg-white/10 text-sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live Chat */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                💬 Game Day Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-72 pr-2">
                <div className="space-y-2">
                  {messages.length === 0 && (
                    <p className="text-white/30 text-sm text-center py-8">Be the first to say something! 🏈</p>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{msg.avatarEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-xs font-bold mr-1"
                          style={{ color: msg.avatarColor || "#ea580c" }}
                        >
                          {msg.userId === user?.id ? "You" : msg.displayName}
                        </span>
                        {msg.teamFlair && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded px-1 py-0.5 mr-1 align-middle">
                            🏅 {msg.teamFlair}
                          </span>
                        )}
                        <span className="text-white/80 text-sm break-words">{msg.message}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
              </ScrollArea>

              {/* Flair picker */}
              {user && (
                <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                  <button
                    onClick={() => setShowFlairPicker((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-full"
                  >
                    <Shield className="w-3 h-3" />
                    {myFlair ? (
                      <span>Rooting for: <span className="text-yellow-300 font-bold">{myFlair}</span></span>
                    ) : (
                      <span>Pick your team flair</span>
                    )}
                  </button>
                  {showFlairPicker && (
                    <div className="flex flex-wrap gap-1.5">
                      {/* The two teams in this room */}
                      {[roomInfo?.teamHome, roomInfo?.teamAway].filter(Boolean).map((teamName) => {
                        const abbr = teamName!.split(" ").pop()!;
                        return (
                          <button
                            key={abbr}
                            onClick={() => handleSetFlair(myFlair === abbr ? null : abbr)}
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                              myFlair === abbr
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            {myFlair === abbr ? "✓ " : ""}{abbr}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleSetFlair(null)}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 hover:bg-white/10 transition-all"
                      >
                        Neutral
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quick reactions */}
              <div className="flex gap-1.5 flex-wrap">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-lg hover:scale-125 transition-transform active:scale-95 cursor-pointer"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Say something..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button size="sm" onClick={handleSendChat} disabled={sendChatMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Leaderboard + Fans */}
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-400" /> Trivia Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/30 text-xs">No scores yet</p>
                  <p className="text-white/20 text-xs mt-1">Launch trivia during a commercial break!</p>
                </div>
              ) : (
                leaderboard.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-2 p-2 rounded-lg transition-all duration-300"
                    style={{
                      background: p.rank === 1 ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.05)",
                      borderLeft: `3px solid ${p.avatarColor}`,
                    }}
                  >
                    <span className="text-white/40 text-xs w-4 font-bold">#{p.rank}</span>
                    <span className="text-lg">{p.avatarEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-white text-xs font-medium truncate">{p.userId === user?.id ? "You" : p.displayName}</span>
                        {p.rank === 1 && p.score > 0 && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-300 text-xs font-bold">{p.score} pts</span>
                        {p.correctAnswers > 0 && <span className="text-white/40 text-[10px]">✅ {p.correctAnswers}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Players in room */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> Fans ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div key={p.userId} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                    <span className="text-sm">{p.avatarEmoji}</span>
                    <span className="text-white text-xs">{p.userId === user?.id ? "You" : p.displayName}</span>
                    {p.isHost && <Crown className="w-3 h-3 text-yellow-400" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
