import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSEO } from "@/hooks/useSEO";
import {
  Trophy, Users, Clock, MessageCircle, Send, Play, CheckCircle,
  XCircle, Zap, Star, Crown, ArrowRight, Home, Copy, Check
} from "lucide-react";
import { toast } from "sonner";

type GamePhase = "lobby" | "playing" | "results";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  relationships: { label: "Relationships", emoji: "💕", color: "text-pink-500" },
  pop_culture: { label: "Pop Culture", emoji: "🎬", color: "text-purple-500" },
  local_knowledge: { label: "Local Knowledge", emoji: "📍", color: "text-blue-500" },
  food_drinks: { label: "Food & Drinks", emoji: "🍕", color: "text-orange-500" },
  sports_outdoors: { label: "Sports & Outdoors", emoji: "⚽", color: "text-green-500" },
  wild_card: { label: "Wild Card", emoji: "🃏", color: "text-yellow-500" },
};

const TIMER_SECONDS = 15;

export default function TriviaGame() {
  useSEO({
    title: "Trivia Game — Just Putzit",
    description: "Play multiplayer trivia with 1-8 players. 6 categories, in-game chat, and real-time scoring.",
  });

  const { user } = useAuth();
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [gameCode, setGameCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ userId: number; content: string; createdAt: Date }>>([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // tRPC hooks
  const createRoomMutation = trpc.trivia.createRoom.useMutation();
  const joinRoomMutation = trpc.trivia.joinRoom.useMutation();
  const setReadyMutation = trpc.trivia.setReady.useMutation();
  const startRoomMutation = trpc.trivia.startRoom.useMutation();
  const submitAnswerMutation = trpc.trivia.submitAnswer.useMutation();
  const advanceQuestionMutation = trpc.trivia.advanceQuestion.useMutation();
  const sendChatMutation = trpc.trivia.sendChat.useMutation();

  const { data: roomData, refetch: refetchRoom } = trpc.trivia.getRoom.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId, refetchInterval: 2000 }
  );

  const { data: chatData, refetch: refetchChat } = trpc.trivia.getChat.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId, refetchInterval: 1500 }
  );

  // Sync chat messages
  useEffect(() => {
    if (chatData) {
      setChatMessages(chatData as typeof chatMessages);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [chatData]);

  // Sync game state from server
  useEffect(() => {
    if (!roomData) return;
    const { room } = roomData;
    if (room.status === "in_progress" && phase !== "playing") {
      setPhase("playing");
      setCurrentQuestionIndex(room.currentQuestionIndex ?? 0);
    }
    if (room.status === "completed" && phase !== "results") {
      setPhase("results");
      if (timerRef.current) clearInterval(timerRef.current);
    }
    if (room.status === "in_progress") {
      const serverIndex = room.currentQuestionIndex ?? 0;
      if (serverIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(serverIndex);
        setSelectedAnswer(null);
        setAnswerRevealed(false);
        setTimeLeft(TIMER_SECONDS);
      }
    }
  }, [roomData, phase, currentQuestionIndex]);

  // Timer logic
  useEffect(() => {
    if (phase !== "playing" || answerRevealed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setAnswerRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQuestionIndex, phase]);

  // Get current question
  const questionIds = (roomData?.room?.questionIds as number[]) ?? [];
  const currentQuestionId = questionIds[currentQuestionIndex];

  const { data: currentQuestion } = trpc.trivia.getQuestions.useQuery(
    { limit: 1 },
    { enabled: false }
  );

  // Fetch current question directly
  const [questionData, setQuestionData] = useState<{
    id: number; question: string; optionA: string; optionB: string; optionC: string; optionD: string;
    correctAnswer: string; category: string; difficulty: string;
  } | null>(null);

  const utils = trpc.useUtils();
  useEffect(() => {
    if (!currentQuestionId) return;
    // Fetch via getQuestions with a specific ID approach — use getRoom data which has questionIds
    // We'll fetch all questions upfront when game starts
  }, [currentQuestionId]);

  // Fetch all questions for the room when game starts
  const [allQuestions, setAllQuestions] = useState<typeof questionData[]>([]);
  const { data: allQuestionsData } = trpc.trivia.getQuestions.useQuery(
    { limit: 200 },
    { enabled: phase === "playing" }
  );

  useEffect(() => {
    if (allQuestionsData && questionIds.length > 0) {
      const qMap = new Map(allQuestionsData.map(q => [q.id, q]));
      const ordered = questionIds.map(id => qMap.get(id) ?? null).filter(Boolean) as typeof questionData[];
      setAllQuestions(ordered);
    }
  }, [allQuestionsData, questionIds.length]);

  const currentQ = allQuestions[currentQuestionIndex] ?? null;

  // Handlers
  const handleCreateRoom = async () => {
    if (!user) return;
    try {
      const room = await createRoomMutation.mutateAsync({ maxPlayers });
      setRoomId(room.id);
      setGameCode(room.gameCode);
      setIsHost(true);
    } catch {
      toast.error("Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    try {
      const result = await joinRoomMutation.mutateAsync({ gameCode: joinCode.trim() });
      setRoomId(result.room.id);
      setGameCode(result.room.gameCode);
      setIsHost(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? "Failed to join room");
    }
  };

  const handleReady = async () => {
    if (!roomId) return;
    await setReadyMutation.mutateAsync({ roomId, isReady: true });
    toast.success("You're ready!");
  };

  const handleStart = async () => {
    if (!roomId) return;
    await startRoomMutation.mutateAsync({ roomId });
  };

  const handleAnswer = async (answer: "A" | "B" | "C" | "D") => {
    if (!roomId || !currentQ || selectedAnswer || answerRevealed) return;
    setSelectedAnswer(answer);
    setAnswerRevealed(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await submitAnswerMutation.mutateAsync({
        roomId,
        questionId: currentQ.id,
        answer,
        answeredAtMs: (TIMER_SECONDS - timeLeft) * 1000,
      });
    } catch {
      // Silently fail
    }
  };

  const handleNextQuestion = async () => {
    if (!roomId || !isHost) return;
    const result = await advanceQuestionMutation.mutateAsync({ roomId });
    if (result.done) {
      setPhase("results");
    } else {
      setSelectedAnswer(null);
      setAnswerRevealed(false);
      setTimeLeft(TIMER_SECONDS);
    }
    await refetchRoom();
  };

  const handleSendChat = async () => {
    if (!roomId || !chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    await sendChatMutation.mutateAsync({ roomId, content: msg });
    await refetchChat();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const players = roomData?.players ?? [];
  const myPlayer = players.find(p => p.userId === user?.id);
  const sortedPlayers = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // ─── Lobby ────────────────────────────────────────────────────────────────
  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-3">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900">Trivia Challenge</h1>
            <p className="text-gray-500 mt-1">1–8 players · 6 categories · In-game chat</p>
          </div>

          {/* Create Room */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-500" /> Create a Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Max Players</label>
                <div className="flex gap-2">
                  {[2, 4, 6, 8].map(n => (
                    <button
                      key={n}
                      onClick={() => setMaxPlayers(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        maxPlayers === n
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <Play className="w-4 h-4 mr-2" />
                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Join a Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Enter 6-digit game code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="text-center text-lg font-mono tracking-widest"
                onKeyDown={e => e.key === "Enter" && handleJoinRoom()}
              />
              <Button
                onClick={handleJoinRoom}
                disabled={joinRoomMutation.isPending || !joinCode.trim()}
                variant="outline"
                className="w-full"
              >
                {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Categories */}
          <div>
            <p className="text-xs text-gray-500 text-center mb-2">6 Categories</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(CATEGORY_LABELS).map(cat => (
                <div key={cat.label} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                  <div className="text-xl">{cat.emoji}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{cat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Waiting Room ─────────────────────────────────────────────────────────
  if (roomData?.room?.status === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-2">🎯</div>
            <h2 className="text-2xl font-bold">Waiting for Players</h2>
            <p className="text-gray-500 text-sm mt-1">{players.length}/{roomData.room.maxPlayers} players joined</p>
          </div>

          {/* Game Code */}
          <Card className="border-2 border-orange-200">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Share this code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-widest text-orange-600">{gameCode}</span>
                <button onClick={handleCopyCode} className="text-gray-400 hover:text-orange-500 transition-colors">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{i === 0 ? "👑" : `P${i + 1}`}</span>
                    <span className="text-sm font-medium">
                      {p.userId === user?.id ? "You" : `Player ${i + 1}`}
                    </span>
                  </div>
                  {p.isReady ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-400">Waiting</Badge>
                  )}
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">Waiting for players to join...</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            {!myPlayer?.isReady && (
              <Button onClick={handleReady} className="w-full bg-green-500 hover:bg-green-600">
                <CheckCircle className="w-4 h-4 mr-2" /> I'm Ready!
              </Button>
            )}
            {isHost && players.length >= 1 && (
              <Button
                onClick={handleStart}
                disabled={startRoomMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <Play className="w-4 h-4 mr-2" />
                {startRoomMutation.isPending ? "Starting..." : "Start Game Now"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Results ──────────────────────────────────────────────────────────────
  if (phase === "results") {
    const winner = sortedPlayers[0];
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold">Game Over!</h2>
            {winner && (
              <p className="text-gray-600 mt-1">
                {winner.userId === user?.id ? "You won! 🎉" : `Player ${sortedPlayers.indexOf(winner) + 1} wins!`}
              </p>
            )}
          </div>

          {/* Scoreboard */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Final Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedPlayers.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    i === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`}</span>
                    <span className="text-sm font-medium">
                      {p.userId === user?.id ? "You" : `Player ${i + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="font-bold text-sm">{p.score ?? 0} pts</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            onClick={() => {
              setRoomId(null);
              setPhase("lobby");
              setAllQuestions([]);
              setCurrentQuestionIndex(0);
            }}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            <Home className="w-4 h-4 mr-2" /> Play Again
          </Button>
        </div>
      </div>
    );
  }

  // ─── Playing ──────────────────────────────────────────────────────────────
  const cat = currentQ ? CATEGORY_LABELS[currentQ.category] : null;
  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 8 ? "bg-green-500" : timeLeft > 4 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Q{currentQuestionIndex + 1}/{questionIds.length}</span>
            {cat && (
              <Badge className="bg-gray-800 text-gray-300 text-xs">
                {cat.emoji} {cat.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className={`font-mono font-bold text-lg ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="h-1.5 bg-gray-800 rounded-full mb-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Question */}
        <Card className="bg-gray-900 border-gray-800 mb-4 flex-shrink-0">
          <CardContent className="pt-6 pb-4">
            <p className="text-white text-lg font-medium text-center leading-relaxed">
              {currentQ?.question ?? "Loading question..."}
            </p>
          </CardContent>
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(["A", "B", "C", "D"] as const).map(letter => {
            const optionKey = `option${letter}` as "optionA" | "optionB" | "optionC" | "optionD";
            const text = currentQ?.[optionKey] ?? "";
            const isSelected = selectedAnswer === letter;
            const isCorrect = currentQ?.correctAnswer === letter;
            const isWrong = isSelected && !isCorrect;

            let btnClass = "p-3 rounded-xl border-2 text-left transition-all text-sm font-medium ";
            if (!answerRevealed) {
              btnClass += isSelected
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-gray-800 border-gray-700 text-gray-200 hover:border-orange-400 hover:bg-gray-750 active:scale-95";
            } else {
              if (isCorrect) btnClass += "bg-green-600 border-green-500 text-white";
              else if (isWrong) btnClass += "bg-red-600 border-red-500 text-white";
              else btnClass += "bg-gray-800 border-gray-700 text-gray-500";
            }

            return (
              <button
                key={letter}
                onClick={() => handleAnswer(letter)}
                disabled={!!selectedAnswer || answerRevealed}
                className={btnClass}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {letter}
                  </span>
                  <span className="flex-1">{text}</span>
                  {answerRevealed && isCorrect && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  {answerRevealed && isWrong && <XCircle className="w-4 h-4 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Answer feedback */}
        {answerRevealed && (
          <div className={`text-center py-2 rounded-lg mb-3 text-sm font-medium ${
            selectedAnswer && currentQ?.correctAnswer === selectedAnswer
              ? "bg-green-900/50 text-green-400"
              : "bg-red-900/50 text-red-400"
          }`}>
            {selectedAnswer && currentQ?.correctAnswer === selectedAnswer
              ? `✓ Correct! ${timeLeft > 0 ? `+${timeLeft <= 5 ? 1 : 1} point` : ""}${myPlayer && (myPlayer.streak ?? 0) >= 3 ? " 🔥 Streak bonus!" : ""}`
              : `✗ The answer was ${currentQ?.correctAnswer}`
            }
          </div>
        )}

        {/* Host advance button */}
        {isHost && answerRevealed && (
          <Button
            onClick={handleNextQuestion}
            disabled={advanceQuestionMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {currentQuestionIndex + 1 >= questionIds.length ? "See Results" : "Next Question"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {/* Scoreboard mini */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {sortedPlayers.slice(0, 4).map((p, i) => (
            <div
              key={p.id}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                p.userId === user?.id ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              <Zap className="w-3 h-3" />
              {p.userId === user?.id ? "You" : `P${i + 1}`}: {p.score ?? 0}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="md:w-72 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col bg-gray-900">
        <div className="p-3 border-b border-gray-800 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm font-medium">Game Chat</span>
        </div>
        <ScrollArea className="flex-1 p-3" ref={chatScrollRef as React.RefObject<HTMLDivElement>}>
          <div className="space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-gray-600 text-xs text-center py-4">Chat is empty — say something!</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`text-xs ${msg.userId === user?.id ? "text-right" : ""}`}>
                <span className="text-gray-500 text-xs">
                  {msg.userId === user?.id ? "You" : `Player`}
                </span>
                <div className={`inline-block mt-0.5 px-2.5 py-1.5 rounded-xl max-w-[90%] text-left ${
                  msg.userId === user?.id
                    ? "bg-orange-500 text-white ml-auto"
                    : "bg-gray-800 text-gray-200"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-gray-800 flex gap-2">
          <Input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Say something..."
            className="bg-gray-800 border-gray-700 text-white text-sm placeholder:text-gray-500 flex-1"
            onKeyDown={e => e.key === "Enter" && handleSendChat()}
            maxLength={200}
          />
          <Button
            size="icon"
            onClick={handleSendChat}
            disabled={!chatInput.trim() || sendChatMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
