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
import { Trophy, Send, Zap, Crown, Users, Copy, Check, ArrowLeft, Star } from "lucide-react";

type ChatMsg = {
  id: number;
  userId: number;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  message: string;
  createdAt: Date | string;
};

type Player = {
  rank: number;
  userId: number;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  score: number;
  correctAnswers: number;
  isMvp: boolean;
  isHost?: boolean;
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

  // Custom trivia form (host)
  const [showTriviaForm, setShowTriviaForm] = useState(false);
  const [triviaForm, setTriviaForm] = useState({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" as "A" | "B" | "C" | "D" });

  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  // Pool question for host
  const { data: poolQuestion, refetch: refetchPool } = trpc.watchParty.getPoolQuestion.useQuery(
    { team: roomData?.room?.teamHome || "packers" },
    { enabled: !!roomData?.isHost }
  );

  const sendChatMutation = trpc.watchParty.sendChat.useMutation();
  const launchTriviaMutation = trpc.watchParty.launchTrivia.useMutation();
  const submitAnswerMutation = trpc.watchParty.submitTriviaAnswer.useMutation();
  const endRoomMutation = trpc.watchParty.endRoom.useMutation();

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
        toast.success(`${p.avatarEmoji} ${p.displayName} joined the watch party!`, {
          duration: 3000,
          style: { background: "#16a34a", color: "#fff" },
        });
      }
    });
    setPrevPlayerIds(new Set(roomData.players.map((p) => p.userId)));
  }, [roomData?.players]);

  // Reset answer state when new trivia launches
  useEffect(() => {
    if (triviaData?.question) {
      setMyAnswer(triviaData.myAnswer as "A" | "B" | "C" | "D" | null);
      setAnswerResult(null);
    }
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
      toast.success("Trivia question launched!");
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
      toast.success("Custom trivia launched!");
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
      toast.success("Watch party ended! MVP crowned 🏆");
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
          <p className="text-lg">Loading watch party...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-white font-bold text-lg">{room.title}</h1>
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <Users className="w-3 h-3" />
                <span>{players.length} fans watching</span>
                <Badge className="bg-red-500 text-white text-xs animate-pulse">🔴 LIVE</Badge>
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
                End Party
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid lg:grid-cols-3 gap-4">
        {/* Main column: Chat + Trivia */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Trivia Question */}
          {activeTrivia && (
            <Card className="bg-gradient-to-br from-yellow-900 to-orange-900 border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-300 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4" /> TRIVIA BATTLE — Answer Fast!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white font-medium text-base">{activeTrivia.questionText}</p>
                {!myAnswer ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(["A", "B", "C", "D"] as const).map((letter) => (
                      <Button
                        key={letter}
                        onClick={() => handleSubmitAnswer(letter)}
                        disabled={submitAnswerMutation.isPending}
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

          {/* Host Trivia Controls */}
          {isHost && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" /> Host Controls — Launch Trivia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {poolQuestion?.question && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/80 text-sm mb-2">📋 Suggested: {poolQuestion.question.questionText}</p>
                    <Button onClick={handleLaunchPoolQuestion} disabled={launchTriviaMutation.isPending} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm">
                      <Zap className="w-3 h-3 mr-1" /> Launch This Question
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
                    <div className="flex gap-2">
                      {(["A", "B", "C", "D"] as const).map((l) => (
                        <Button key={l} size="sm" onClick={() => setTriviaForm({ ...triviaForm, correctAnswer: l })} className={triviaForm.correctAnswer === l ? "bg-green-600" : "bg-white/10 text-white"}>
                          {l}
                        </Button>
                      ))}
                      <span className="text-white/50 text-xs self-center ml-1">= correct</span>
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
              <CardTitle className="text-white text-sm">💬 Watch Party Chat</CardTitle>
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
                        <span className="text-white/80 text-sm break-words">{msg.message}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
              </ScrollArea>
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

        {/* Sidebar: Leaderboard */}
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-400" /> Trivia Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">No scores yet — launch a trivia question!</p>
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
                        {p.isMvp && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
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
