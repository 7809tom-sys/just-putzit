import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSEO } from "@/hooks/useSEO";
import { Trophy, Users, Play, Volume2, Send, Copy, Check, Crown, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type GamePhase = "lobby" | "waiting" | "playing" | "results";
type AnswerResult = { isCorrect: boolean; pointsAwarded: number; correctAnswer: string | null };

type Player = {
  userId: number;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  score: number;
  correctAnswers: number;
  isReady: boolean;
  isHost: boolean;
};

const TRIVIA_CATEGORIES = [
  { id: 1, name: "Science & Nature", emoji: "🔬" },
  { id: 2, name: "History & Geography", emoji: "🌍" },
  { id: 3, name: "Pop Culture", emoji: "🎬" },
  { id: 4, name: "Sports & Games", emoji: "⚽" },
  { id: 5, name: "Food & Drink", emoji: "🍕" },
];

export default function TriviaPursuit() {
  useSEO({
    title: "Trivia Pursuit — Just Putzit",
    description: "Play multiplayer Trivia Pursuit with 1-10 players. Answer multiple choice questions and compete for the highest score!",
  });

  const { user } = useAuth();
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [gameCode, setGameCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState<{
    questionId: number;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [prevPlayerIds, setPrevPlayerIds] = useState<Set<number>>(new Set());
  const [chatMessages, setChatMessages] = useState<Array<{ userId: number; displayName: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const createRoomMutation = trpc.triviaPursuit.createRoom.useMutation();
  const joinRoomMutation = trpc.triviaPursuit.joinRoom.useMutation();
  const nextQuestionMutation = trpc.triviaPursuit.nextQuestion.useMutation();
  const submitAnswerMutation = trpc.triviaPursuit.submitAnswer.useMutation();
  const startGameMutation = trpc.triviaPursuit.startGame.useMutation();
  const endGameMutation = trpc.triviaPursuit.endGame.useMutation();
  const chatMutation = trpc.triviaPursuit.chat.useMutation();

  // Real-time player polling (every 3s)
  const { data: playersData } = trpc.triviaPursuit.getPlayers.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId, refetchInterval: 3000 }
  );
  const { data: persistedChat, refetch: refetchChat } = trpc.triviaPursuit.getChat.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId, refetchInterval: 3000 }
  );

  // Sync players and detect new joins
  useEffect(() => {
    if (!playersData) return;
    const incoming = playersData.players as Player[];

    incoming.forEach((p) => {
      if (!prevPlayerIds.has(p.userId) && p.userId !== user?.id) {
        toast.success(`${p.avatarEmoji} ${p.displayName} joined the game!`, {
          duration: 3000,
          style: { background: "#ea580c", color: "#fff" },
        });
      }
    });

    setPrevPlayerIds(new Set(incoming.map((p) => p.userId)));
    setPlayers(incoming);

    if (playersData.roomStatus === "in_progress" && phase === "waiting") {
      setPhase("playing");
    }
    if (playersData.roomStatus === "completed" && phase === "playing") setPhase("results");
  }, [playersData]);

  useEffect(() => {
    if (!persistedChat) return;
    setChatMessages(persistedChat.map((message) => {
      const player = players.find((candidate) => candidate.userId === message.userId);
      return { userId: message.userId, displayName: player?.displayName ?? `Player ${message.userId}`, content: message.content };
    }));
  }, [persistedChat, players]);

  // TTS
  const handleSpeakQuestion = (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Create room
  const handleCreateRoom = async () => {
    if (selectedCategories.length === 0) { toast.error("Select at least one category"); return; }
    try {
      const result = await createRoomMutation.mutateAsync({ categoryIds: selectedCategories, maxPlayers });
      setRoomId(result.roomId);
      setGameCode(result.gameCode);
      setIsHost(true);
      setPhase("waiting");
      toast.success(`Game created! Code: ${result.gameCode}`);
    } catch {
      toast.error("Failed to create room");
    }
  };

  // Join room
  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { toast.error("Enter a game code"); return; }
    try {
      const result = await joinRoomMutation.mutateAsync({ gameCode: joinCode.toUpperCase() });
      setRoomId(result.roomId);
      setPhase("waiting");
      toast.success("Joined game! Waiting for host to start...");
    } catch {
      toast.error("Game not found or already started");
    }
  };

  // Start game (host only)
  const handleStartGame = async () => {
    if (!roomId) return;
    try {
      await startGameMutation.mutateAsync({ roomId });
      setPhase("playing");
    } catch {
      toast.error("Failed to start game");
    }
  };

  // Get next question
  const handleNextQuestion = async () => {
    try {
      const result = await nextQuestionMutation.mutateAsync({ roomId: roomId! });
      setCurrentQuestion({
        questionId: result.questionId,
        question: result.question,
        optionA: result.optionA,
        optionB: result.optionB,
        optionC: result.optionC,
        optionD: result.optionD,
      });
      setSelectedAnswer(null);
      setAnswerRevealed(false);
      setAnswerResult(null);
    } catch (error: any) {
      if (error.message?.includes("No more questions")) {
        void handleEndGame();
      } else {
        toast.error(error.message || "Failed to get next question");
      }
    }
  };

  // Submit answer
  const handleSubmitAnswer = async (answer: "A" | "B" | "C" | "D") => {
    if (!currentQuestion || answerRevealed) return;
    try {
      const result = await submitAnswerMutation.mutateAsync({ roomId: roomId!, questionId: currentQuestion.questionId, answer });
      setSelectedAnswer(answer);
      setAnswerResult({ isCorrect: result.isCorrect, pointsAwarded: result.pointsAwarded, correctAnswer: result.correctAnswer ?? null });
      setAnswerRevealed(true);
      if (result.isCorrect) {
        toast.success(`Correct! +${result.pointsAwarded} points`);
      } else {
        toast.error(`Incorrect. Answer: ${result.correctAnswer}`);
      }
    } catch {
      toast.error("Failed to submit answer");
    }
  };

  const handleEndGame = async () => {
    if (!roomId) return;
    try {
      await endGameMutation.mutateAsync({ roomId });
      setPhase("results");
    } catch (error: any) {
      toast.error(error.message || "We couldn't finish this game. Please try again.");
    }
  };

  // Copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send chat
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    chatMutation.mutate(
      { roomId: roomId!, message: chatInput.trim() },
      { onSuccess: () => { void refetchChat(); }, onError: (error) => toast.error(error.message || "Message could not be sent.") }
    );
    setChatInput("");
  };

  // Shared scoreboard sidebar
  const ScoreboardSidebar = () => (
    <Card className="bg-white/10 border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Players ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.length === 0 ? (
          <p className="text-white/50 text-xs text-center py-2">Waiting for players...</p>
        ) : (
          players.map((p, idx) => (
            <div
              key={p.userId}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/10 transition-all duration-300"
              style={{ borderLeft: `3px solid ${p.avatarColor}` }}
            >
              <span className="text-lg">{p.avatarEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-white text-xs font-medium truncate">{p.displayName}</span>
                  {p.isHost && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                  {p.userId === user?.id && <Badge className="text-[9px] px-1 py-0 h-4 bg-orange-500">You</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-orange-300 text-xs font-bold">{p.score} pts</span>
                  {p.correctAnswers > 0 && (
                    <span className="text-white/50 text-[10px] flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />{p.correctAnswers}
                    </span>
                  )}
                  {idx === 0 && p.score > 0 && <Star className="w-3 h-3 text-yellow-400" />}
                </div>
              </div>
              <span className="text-white/40 text-xs">#{idx + 1}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 to-red-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Trivia Pursuit</h1>
            <p className="text-orange-200">Answer multiple choice questions with 1-10 players!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Room */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Play className="w-5 h-5" /> Create Game
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-orange-200">Select Categories</label>
                  <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2">
                    {TRIVIA_CATEGORIES.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                        className={`min-h-12 h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm leading-tight sm:text-base ${selectedCategories.includes(cat.id) ? "bg-orange-500 border-orange-400" : "border-white/30 text-white hover:bg-white/10"}`}
                        onClick={() => setSelectedCategories((prev) => prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id])}
                      >
                        {cat.emoji} {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-200">Max Players</label>
                  <Input type="number" min="1" max="10" value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="mt-1 bg-white/10 border-white/30 text-white" />
                </div>
                <Button onClick={handleCreateRoom} disabled={createRoomMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-400">
                  Create Game
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5" /> Join Game
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-orange-200">Game Code</label>
                  <Input
                    placeholder="Enter game code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    className="mt-1 bg-white/10 border-white/30 text-white placeholder:text-white/40 font-mono tracking-widest text-center text-xl"
                  />
                </div>
                <Button onClick={handleJoinRoom} disabled={joinRoomMutation.isPending} className="w-full bg-red-500 hover:bg-red-400">
                  Join Game
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ───────────────────────────────────────────────────────────
  if (phase === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 to-red-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Trivia Pursuit</h1>
            <p className="text-orange-200">Waiting for players to join...</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Share code */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" /> Share Game Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold text-yellow-300 tracking-widest py-4 bg-white/10 rounded-xl mb-3">
                    {gameCode}
                  </div>
                  <Button onClick={handleCopyCode} variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                    {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
                  </Button>
                </div>
                <p className="text-orange-200 text-sm text-center">Share this code with friends. They can join at justputzit.com → Entertainment → Trivia Pursuit</p>
                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    disabled={startGameMutation.isPending || players.length < 1}
                    className="w-full bg-green-500 hover:bg-green-400 text-white font-bold"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game ({players.length} player{players.length !== 1 ? "s" : ""})
                  </Button>
                )}
                {!isHost && (
                  <div className="flex items-center justify-center gap-2 text-orange-200 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Waiting for host to start...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live player list */}
            <ScoreboardSidebar />
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (phase === "playing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 to-red-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-white">Trivia Pursuit</h1>
            {isHost && (
              <div className="flex flex-wrap items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Badge variant="secondary" className="font-mono tracking-widest">Code: {gameCode}</Badge>
                <Button size="sm" variant="ghost" onClick={handleCopyCode} className="text-white hover:bg-white/20">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleEndGame} disabled={endGameMutation.isPending} className="border-white/40 text-white hover:bg-white/20">{endGameMutation.isPending ? "Finishing…" : "End Game"}</Button>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Question */}
              {currentQuestion ? (
                <Card className="bg-white/95">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-lg font-medium text-gray-800 flex-1">{currentQuestion.question}</p>
                      <Button size="sm" variant="outline" onClick={() => handleSpeakQuestion(currentQuestion.question)} disabled={isSpeaking} className="flex-shrink-0">
                        <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!answerRevealed ? (
                      <div className="grid grid-cols-2 gap-3">
                        {(["A", "B", "C", "D"] as const).map((letter) => (
                          <Button
                            key={letter}
                            onClick={() => handleSubmitAnswer(letter)}
                            disabled={submitAnswerMutation.isPending}
                            variant={selectedAnswer === letter ? "default" : "outline"}
                            className="h-20 flex flex-col items-start justify-start p-3 text-left"
                          >
                            <span className="font-bold text-lg">{letter}.</span>
                            <span className="text-sm">{currentQuestion[`option${letter}` as keyof typeof currentQuestion]}</span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className={`rounded-xl border p-4 text-center ${answerResult?.isCorrect ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
                        <p className="font-bold">{answerResult?.isCorrect ? `Correct! +${answerResult.pointsAwarded} points` : "Not quite this time."}</p>
                        {!answerResult?.isCorrect && answerResult?.correctAnswer && <p className="mt-1 text-sm">Correct answer: <span className="font-semibold">{answerResult.correctAnswer}</span></p>}
                        {isHost ? <Button onClick={handleNextQuestion} disabled={nextQuestionMutation.isPending} className="mt-4 w-full bg-orange-600 hover:bg-orange-700">{nextQuestionMutation.isPending ? "Loading…" : "Next Question"}</Button> : <p className="mt-4 text-sm">Waiting for the host to choose the next question.</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/10 border-white/20">
                  <CardHeader><CardTitle className="text-white">Ready to Play?</CardTitle></CardHeader>
                  <CardContent>
                    <Button onClick={handleNextQuestion} disabled={nextQuestionMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-400 h-20 text-lg">
                      Start Game
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Chat */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader><CardTitle className="text-white text-sm">Chat</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-32 border border-white/20 rounded p-2">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="text-sm mb-1 text-white/80">
                        <span className="font-medium text-orange-300">{msg.displayName}:</span> {msg.content}
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input placeholder="Say something..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendChat()} className="bg-white/10 border-white/30 text-white placeholder:text-white/40" />
                    <Button size="sm" onClick={handleSendChat} disabled={chatMutation.isPending}><Send className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar — Live Scoreboard */}
            <div>
              <ScoreboardSidebar />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const finalPlayers = [...players].sort((left, right) => right.score - left.score);
    const winner = finalPlayers[0];
    return <div className="min-h-screen bg-gradient-to-br from-orange-900 to-red-900 p-4"><main className="mx-auto max-w-xl py-8"><Card className="border-yellow-300/40 bg-white/95 shadow-2xl"><CardContent className="p-6 text-center sm:p-8"><Trophy className="mx-auto h-12 w-12 text-yellow-500" /><h1 className="mt-4 text-3xl font-bold text-gray-950">Final Scoreboard</h1>{winner && <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-gray-900">{winner.displayName}</span> takes the win with {winner.score} points.</p>}<div className="mt-6 space-y-2 text-left">{finalPlayers.map((player, index) => <div key={player.userId} className="flex items-center gap-3 rounded-xl border bg-white p-3"><span className="w-7 text-center font-bold text-orange-700">#{index + 1}</span><span className="text-xl">{player.avatarEmoji}</span><span className="min-w-0 flex-1 truncate font-semibold">{player.displayName}{player.userId === user?.id ? " (You)" : ""}</span><span className="font-bold text-orange-700">{player.score} pts</span></div>)}</div><Button className="mt-6 w-full" onClick={() => window.location.assign("/game-lobby")}>Back to Game Lobby</Button></CardContent></Card></main></div>;
  }

  return null;
}
