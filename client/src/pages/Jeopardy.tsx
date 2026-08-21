import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSEO } from "@/hooks/useSEO";
import {
  Trophy, Users, Play, Volume2, Send, Copy, Check, Crown, Star,
} from "lucide-react";
import { toast } from "sonner";
import { canSubmitJeopardyAnswer } from "@shared/jeopardyAnswerPolicy";
import { isJeopardyBoardComplete, sortJeopardyPlayers } from "@shared/jeopardyLifecycle";

type GamePhase = "lobby" | "waiting" | "playing" | "results";

const JEOPARDY_VALUES = [200, 400, 600, 800, 1000];

type BoardClue = { id: number; categoryId: number; clue: string; value: number; answered: boolean };
type BoardCategory = { id: number; name: string; clues: BoardClue[] };
type AnswerResult = { isCorrect: boolean; pointsAwarded: number; correctAnswer: string | null };

type Player = {
  userId: number;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
};

export default function Jeopardy() {
  useSEO({
    title: "Jeopardy — Just Putzit",
    description: "Play multiplayer Jeopardy with 1-10 players. Select clues, answer questions, and compete for the highest score!",
  });

  const { user } = useAuth();
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [gameCode, setGameCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [currentClue, setCurrentClue] = useState<{ clueId: number; clue: string; value: number } | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [prevPlayerIds, setPrevPlayerIds] = useState<Set<number>>(new Set());
  const [chatMessages, setChatMessages] = useState<Array<{ userId: number; displayName: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answeredClueIds, setAnsweredClueIds] = useState<Set<number>>(new Set());
  const [boardCategories, setBoardCategories] = useState<BoardCategory[]>([]);

  const { data: categories = [] } = trpc.jeopardy.getCategories.useQuery();
  const { data: roomData } = trpc.jeopardy.getRoom.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId && phase === "playing", refetchInterval: 5000 }
  );
  const createRoomMutation = trpc.jeopardy.createRoom.useMutation();
  const joinRoomMutation = trpc.jeopardy.joinRoom.useMutation();
  const selectClueMutation = trpc.jeopardy.selectClue.useMutation();
  const submitAnswerMutation = trpc.jeopardy.submitAnswer.useMutation();
  const startGameMutation = trpc.jeopardy.startGame.useMutation();
  const endGameMutation = trpc.jeopardy.endGame.useMutation();
  const chatMutation = trpc.jeopardy.chat.useMutation();

  // Real-time player polling
  const { data: playersData } = trpc.jeopardy.getPlayers.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId, refetchInterval: 3000 }
  );
  const { data: persistedChat, refetch: refetchChat } = trpc.jeopardy.getChat.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId, refetchInterval: 3000 }
  );

  // Sync players and detect new joins
  useEffect(() => {
    if (!playersData) return;
    const incoming = playersData.players as Player[];

    // Detect newly joined players and show toast
    incoming.forEach((p) => {
      if (!prevPlayerIds.has(p.userId) && p.userId !== user?.id) {
        toast.success(`${p.avatarEmoji} ${p.displayName} joined the game!`, {
          duration: 3000,
          style: { background: "#7c3aed", color: "#fff" },
        });
      }
    });

    setPrevPlayerIds(new Set(incoming.map((p) => p.userId)));
    setPlayers(incoming);

    // Auto-transition: if game started and we're still in waiting, move to playing
    if (playersData.roomStatus === "in_progress" && phase === "waiting") {
      setPhase("playing");
    }
    if (playersData.roomStatus === "completed" && phase === "playing") {
      setPhase("results");
    }
  }, [playersData]);

  useEffect(() => {
    if (!persistedChat) return;
    setChatMessages(persistedChat.map((message) => {
      const player = players.find((candidate) => candidate.userId === message.userId);
      return { userId: message.userId, displayName: player?.displayName ?? `Player ${message.userId}`, content: message.content };
    }));
  }, [persistedChat, players]);

  // Build board from room data
  useEffect(() => {
    if (!roomData || !categories.length) return;
    const clues = roomData.clues as BoardClue[];
    const catMap = new Map<number, BoardCategory>();
    categories.forEach((cat) => {
      catMap.set(cat.id, { id: cat.id, name: cat.name, clues: [] });
    });
    clues.forEach((clue) => {
      const cat = catMap.get(clue.categoryId);
      if (cat) cat.clues.push(clue);
    });
    // Sort clues by value within each category
    catMap.forEach((cat) => cat.clues.sort((a, b) => a.value - b.value));
    setBoardCategories(Array.from(catMap.values()).filter((c) => c.clues.length > 0));
  }, [roomData, categories]);

  const totalBoardClues = boardCategories.reduce((total, category) => total + category.clues.length, 0);
  const persistedAnsweredClues = boardCategories.flatMap((category) => category.clues).filter((clue) => clue.answered).length;
  const completedBoard = isJeopardyBoardComplete(totalBoardClues, Math.max(answeredClueIds.size, persistedAnsweredClues));

  // Handle TTS for clue
  const handleSpeakClue = (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Create room
  const handleCreateRoom = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Select at least one category");
      return;
    }
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

  // Select clue
  const handleSelectClue = async (clueId: number, value: number) => {
    try {
      const result = await selectClueMutation.mutateAsync({ roomId: roomId!, clueId });
      setCurrentClue({ clueId, clue: result.clue ?? "", value });
      setUserAnswer("");
      setAnswerRevealed(false);
      setAnswerResult(null);
    } catch {
      toast.error("Failed to select clue");
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!currentClue) { toast.error("Choose a clue before checking an answer."); return; }
    if (!userAnswer.trim()) { toast.error("Type your answer before checking it."); return; }
    try {
      const result = await submitAnswerMutation.mutateAsync({ roomId: roomId!, clueId: currentClue.clueId, answer: userAnswer });
      setAnswerResult({ isCorrect: result.isCorrect, pointsAwarded: result.pointsAwarded, correctAnswer: result.correctAnswer ?? null });
      setAnswerRevealed(true);
      // Mark clue as answered
      if (currentClue) setAnsweredClueIds((prev) => { const next = new Set(prev); next.add(currentClue.clueId); return next; });
      if (result.isCorrect) {
        toast.success(`Correct! +${result.pointsAwarded} points`);
      } else {
        toast.error(`Incorrect. Answer: ${result.correctAnswer}`);
      }
    } catch {
      toast.error("We couldn't save that answer. Please try again.");
    }
  };

  const handleNextClue = () => {
    setCurrentClue(null);
    setUserAnswer("");
    setAnswerResult(null);
    setAnswerRevealed(false);
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

  // Copy game code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scoreboard sidebar (shared between waiting and playing phases)
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
                  {p.userId === user?.id && <Badge className="text-[9px] px-1 py-0 h-4 bg-purple-500">You</Badge>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-yellow-300 text-xs font-bold">${p.score.toLocaleString()}</span>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Jeopardy!</h1>
            <p className="text-purple-200">Play with 1-10 players. Answer clues for points!</p>
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
                  <label className="text-sm font-medium text-purple-200">Select Categories</label>
                  <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-2">
                    {(categories.length > 0 ? categories : [1,2,3,4,5].map((id) => ({ id, name: `Category ${id}`, emoji: "❓" }))).map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                        className={`min-h-12 h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm leading-tight sm:text-base ${selectedCategories.includes(cat.id) ? "bg-purple-500 border-purple-400" : "border-white/30 text-white hover:bg-white/10"}`}
                        onClick={() => setSelectedCategories((prev) => prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id])}
                      >
                        {"emoji" in cat ? cat.emoji : "❓"} {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-purple-200">Max Players</label>
                  <Input type="number" min="1" max="10" value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="mt-1 bg-white/10 border-white/30 text-white" />
                </div>
                <Button onClick={handleCreateRoom} disabled={createRoomMutation.isPending} className="w-full bg-purple-500 hover:bg-purple-400">
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
                  <label className="text-sm font-medium text-purple-200">Game Code</label>
                  <Input
                    placeholder="Enter game code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    className="mt-1 bg-white/10 border-white/30 text-white placeholder:text-white/40 font-mono tracking-widest text-center text-xl"
                  />
                </div>
                <Button onClick={handleJoinRoom} disabled={joinRoomMutation.isPending} className="w-full bg-blue-500 hover:bg-blue-400">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Jeopardy!</h1>
            <p className="text-purple-200">Waiting for players to join...</p>
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
                <p className="text-purple-200 text-sm text-center">Share this code with friends. They can join at justputzit.com → Entertainment → Jeopardy</p>
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
                  <div className="flex items-center justify-center gap-2 text-purple-200 text-sm">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Jeopardy!</h1>
            {isHost && (
              <div className="flex flex-wrap items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Badge variant="secondary" className="font-mono tracking-widest">Code: {gameCode}</Badge>
                <Button size="sm" variant="ghost" onClick={handleCopyCode} className="text-white hover:bg-white/20">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleEndGame} disabled={endGameMutation.isPending} className="border-white/40 text-white hover:bg-white/20">
                  {endGameMutation.isPending ? "Finishing…" : "End Game"}
                </Button>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Clue */}
              {currentClue && (
                <Card className="bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-center text-2xl">${currentClue.value}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <p className="text-lg font-medium text-gray-800 flex-1">{currentClue.clue}</p>
                      <Button size="sm" variant="outline" onClick={() => handleSpeakClue(currentClue.clue)} disabled={isSpeaking}>
                        <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                      </Button>
                    </div>
                    {!answerRevealed && (
                      <div className="space-y-3">
                        <Input placeholder="What is...?" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmitAnswer(); } }} />
                        <Button onClick={handleSubmitAnswer} disabled={!canSubmitJeopardyAnswer(userAnswer, Boolean(currentClue), submitAnswerMutation.isPending)} className="w-full bg-purple-600 hover:bg-purple-700">{submitAnswerMutation.isPending ? "Checking answer…" : "Check Answer"}</Button>
                      </div>
                    )}
                    {answerRevealed && (
                      <div className={`rounded-xl border p-4 text-center ${answerResult?.isCorrect ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
                        <p className="font-bold">{answerResult?.isCorrect ? `Correct! +$${answerResult.pointsAwarded}` : "Not quite this time."}</p>
                        {!answerResult?.isCorrect && answerResult?.correctAnswer && <p className="mt-1 text-sm">Correct response: <span className="font-semibold">{answerResult.correctAnswer}</span></p>}
                        {completedBoard ? (
                          isHost ? <Button onClick={handleEndGame} disabled={endGameMutation.isPending} className="mt-4 w-full">{endGameMutation.isPending ? "Finishing…" : "View Final Scoreboard"}</Button> : <p className="mt-4 text-sm">All clues are complete. The host will open the final scoreboard.</p>
                        ) : (
                          <Button onClick={handleNextClue} className="mt-4 w-full" variant={answerResult?.isCorrect ? "default" : "secondary"}>Next Clue</Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Clue Board */}
              {!currentClue && completedBoard && (
                <Card className="bg-white/95"><CardContent className="py-10 text-center"><Trophy className="mx-auto h-10 w-10 text-yellow-500" /><h2 className="mt-3 text-xl font-bold">Every clue is answered.</h2><p className="mt-2 text-sm text-muted-foreground">{isHost ? "Open the final scoreboard when your group is ready." : "Waiting for the host to open the final scoreboard."}</p>{isHost && <Button onClick={handleEndGame} disabled={endGameMutation.isPending} className="mt-5">{endGameMutation.isPending ? "Finishing…" : "View Final Scoreboard"}</Button>}</CardContent></Card>
              )}
              {!currentClue && !completedBoard && (
                <Card className="bg-white/95">
                  <CardHeader><CardTitle>Select a Clue</CardTitle></CardHeader>
                  <CardContent>
                    {boardCategories.length > 0 ? (
                      <div className="overflow-x-auto">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${boardCategories.length}, minmax(100px, 1fr))` }}>
                          {/* Category headers */}
                          {boardCategories.map((cat) => (
                            <div key={cat.id} className="bg-purple-800 text-white text-center text-xs font-bold p-2 rounded uppercase tracking-wide">
                              {cat.name}
                            </div>
                          ))}
                          {/* Clue buttons — rows by value */}
                          {JEOPARDY_VALUES.map((val) =>
                            boardCategories.map((cat) => {
                              const clue = cat.clues.find((c) => c.value === val);
                              if (!clue) return <div key={`${cat.id}-${val}`} className="h-16" />;
                              const isAnswered = clue.answered || answeredClueIds.has(clue.id);
                              return (
                                <Button
                                  key={clue.id}
                                  onClick={() => !isAnswered && handleSelectClue(clue.id, clue.value)}
                                  disabled={isAnswered}
                                  className={`h-16 text-base font-bold ${
                                    isAnswered
                                      ? "bg-gray-400 cursor-not-allowed opacity-50"
                                      : "bg-purple-600 hover:bg-purple-700"
                                  }`}
                                >
                                  {isAnswered ? "—" : `$${val}`}
                                </Button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      // Fallback flat board while room data loads
                      <div className="grid grid-cols-5 gap-2">
                        {JEOPARDY_VALUES.map((value) => (
                          <div key={value} className="h-16 bg-purple-200 rounded animate-pulse" />
                        ))}
                      </div>
                    )}
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
                        <span className="font-medium text-purple-300">{msg.displayName}:</span> {msg.content}
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
    const finalPlayers = sortJeopardyPlayers(players);
    const winner = finalPlayers[0];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-4">
        <main className="mx-auto max-w-xl py-8">
          <Card className="border-yellow-300/40 bg-white/95 shadow-2xl"><CardContent className="p-6 text-center sm:p-8">
            <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
            <h1 className="mt-4 text-3xl font-bold text-gray-950">Final Scoreboard</h1>
            {winner && <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-gray-900">{winner.displayName}</span> takes the win with ${winner.score.toLocaleString()}.</p>}
            <div className="mt-6 space-y-2 text-left">{finalPlayers.map((player, index) => <div key={player.userId} className="flex items-center gap-3 rounded-xl border bg-white p-3"><span className="w-7 text-center font-bold text-purple-700">#{index + 1}</span><span className="text-xl">{player.avatarEmoji}</span><span className="min-w-0 flex-1 truncate font-semibold">{player.displayName}{player.userId === user?.id ? " (You)" : ""}</span><span className="font-bold text-purple-700">${player.score.toLocaleString()}</span></div>)}</div>
            <Button className="mt-6 w-full" onClick={() => window.location.assign("/game-lobby")}>Back to Game Lobby</Button>
          </CardContent></Card>
        </main>
      </div>
    );
  }

  return null;

  // Chat helper (defined after hooks to avoid conditional hook calls)
  function handleSendChat() {
    if (!chatInput.trim()) return;
    chatMutation.mutate(
      { roomId: roomId!, message: chatInput.trim() },
      { onSuccess: () => { void refetchChat(); }, onError: (error) => toast.error(error.message || "Message could not be sent.") }
    );
    setChatInput("");
  }
}
