import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, MapPin, Play, LogIn, Gamepad2, RefreshCw, Trophy, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

const GAME_TYPE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  would_you_rather: { label: "Would You Rather", emoji: "🤔", description: "Pick between two fun options and see who agrees!" },
  trivia: { label: "Trivia", emoji: "🧠", description: "Test your knowledge with pop culture & fun facts!" },
  icebreaker: { label: "Icebreaker", emoji: "🧊", description: "Open-ended questions to spark real conversations." },
  two_truths: { label: "Two Truths & a Lie", emoji: "🎭", description: "Share statements and guess which one is the lie!" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: "Waiting for players", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "In progress", color: "bg-green-100 text-green-800" },
  finished: { label: "Finished", color: "bg-gray-100 text-gray-600" },
};

export default function GameLobby() {
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newGameType, setNewGameType] = useState<"would_you_rather" | "trivia" | "icebreaker" | "two_truths">("would_you_rather");
  const [newMaxPlayers, setNewMaxPlayers] = useState(6);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredIndices, setAnsweredIndices] = useState<Set<number>>(new Set());

  const { data: profile } = trpc.profile.get.useQuery();
  const userCity = profile?.city ?? undefined;

  const { data: rooms, refetch: refetchRooms, isLoading: roomsLoading } = trpc.gameLobby.listRooms.useQuery(
    { city: userCity },
    { refetchInterval: 5000 }
  );

  const { data: activeRoom, refetch: refetchRoom } = trpc.gameLobby.getRoom.useQuery(
    { roomId: activeRoomId! },
    { enabled: !!activeRoomId, refetchInterval: 3000 }
  );

  const utils = trpc.useUtils();

  const createRoomMutation = trpc.gameLobby.createRoom.useMutation({
    onSuccess: (room) => {
      toast.success("Room created! Questions are ready 🎉");
      setCreateOpen(false);
      setNewRoomName("");
      if (room) setActiveRoomId(room.id);
      refetchRooms();
    },
    onError: (e) => toast.error(e.message),
  });

  const joinRoomMutation = trpc.gameLobby.joinRoom.useMutation({
    onSuccess: (_, vars) => {
      setActiveRoomId(vars.roomId);
      refetchRooms();
    },
    onError: (e) => toast.error(e.message),
  });

  const leaveRoomMutation = trpc.gameLobby.leaveRoom.useMutation({
    onSuccess: () => {
      setActiveRoomId(null);
      setAnsweredIndices(new Set());
      refetchRooms();
    },
  });

  const startGameMutation = trpc.gameLobby.startGame.useMutation({
    onSuccess: () => { toast.success("Game started! 🎮"); refetchRoom(); },
    onError: (e) => toast.error(e.message),
  });

  const submitAnswerMutation = trpc.gameLobby.submitAnswer.useMutation({
    onSuccess: (_, vars) => {
      setAnsweredIndices(prev => { const next = new Set(Array.from(prev)); next.add(vars.questionIndex); return next; });
      setSelectedAnswer(null);
      toast.success("Answer submitted! ✅");
      refetchRoom();
    },
  });

  const nextQuestionMutation = trpc.gameLobby.nextQuestion.useMutation({
    onSuccess: () => refetchRoom(),
  });

  const currentQuestion = activeRoom?.questions?.[activeRoom.currentQuestionIndex ?? 0] as any;
  const isHost = activeRoom?.hostUserId === profile?.userId;
  const myUserId = profile?.userId;
  const alreadyAnsweredCurrent = myUserId !== undefined && answeredIndices.has(activeRoom?.currentQuestionIndex ?? 0);

  // Answers for current question
  const currentAnswers = (activeRoom?.answers as any[] ?? []).filter(
    (a: any) => a.questionIndex === (activeRoom?.currentQuestionIndex ?? 0)
  );

  if (activeRoomId && activeRoom) {
    const gameInfo = GAME_TYPE_LABELS[activeRoom.gameType] ?? GAME_TYPE_LABELS.would_you_rather;
    const questions = (activeRoom.questions ?? []) as any[];
    const isFinished = activeRoom.status === "finished";

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Room Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => leaveRoomMutation.mutate({ roomId: activeRoomId })}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Leave
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{activeRoom.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {gameInfo.emoji} {gameInfo.label}
                {activeRoom.city && <><MapPin className="w-3 h-3 ml-2" />{activeRoom.city}</>}
              </p>
            </div>
            <Badge className={STATUS_LABELS[activeRoom.status]?.color ?? ""}>
              {STATUS_LABELS[activeRoom.status]?.label}
            </Badge>
          </div>

          {/* Players */}
          <Card className="mb-6 border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Players ({activeRoom.players?.length ?? 0}/{activeRoom.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(activeRoom.players ?? []).map((p: any) => (
                  <div key={p.userId} className="flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                      {(p.displayName ?? "?")[0]?.toUpperCase()}
                    </span>
                    <span className="font-medium text-gray-800">{p.displayName ?? `Player ${p.userId}`}</span>
                    {p.userId === activeRoom.hostUserId && <span className="text-xs text-primary">👑</span>}
                    {p.city && <span className="text-xs text-gray-400">· {p.city}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Waiting room */}
          {activeRoom.status === "waiting" && (
            <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50">
              <CardContent className="py-10 text-center">
                <div className="text-5xl mb-3">🎮</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Waiting for players to join...</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Share this room with friends nearby! The game will start when the host is ready.
                </p>
                {isHost && (
                  <Button
                    className="bg-primary text-white rounded-full px-8"
                    onClick={() => startGameMutation.mutate({ roomId: activeRoomId })}
                    disabled={startGameMutation.isPending || (activeRoom.players?.length ?? 0) < 1}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game ({activeRoom.players?.length ?? 0} player{(activeRoom.players?.length ?? 0) !== 1 ? "s" : ""})
                  </Button>
                )}
                {!isHost && <p className="text-sm text-gray-400">Waiting for the host to start...</p>}
              </CardContent>
            </Card>
          )}

          {/* Active game */}
          {activeRoom.status === "in_progress" && currentQuestion && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Question {(activeRoom.currentQuestionIndex ?? 0) + 1} of {questions.length}</span>
                <span>{currentAnswers.length} answer{currentAnswers.length !== 1 ? "s" : ""} in</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(((activeRoom.currentQuestionIndex ?? 0) + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question card */}
              <Card className="border-orange-200 shadow-md">
                <CardContent className="pt-8 pb-6 text-center">
                  <p className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">{currentQuestion.text}</p>

                  {/* WYR / Trivia options */}
                  {(currentQuestion.optionA || currentQuestion.optionB) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[currentQuestion.optionA, currentQuestion.optionB, currentQuestion.optionC, currentQuestion.optionD]
                        .filter(Boolean)
                        .map((opt: string, i: number) => (
                          <button
                            key={i}
                            className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${
                              selectedAnswer === opt
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-primary/50 hover:bg-orange-50"
                            } ${alreadyAnsweredCurrent ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            onClick={() => !alreadyAnsweredCurrent && setSelectedAnswer(opt)}
                            disabled={alreadyAnsweredCurrent}
                          >
                            {opt}
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Icebreaker / Two Truths — free text */}
                  {!currentQuestion.optionA && !currentQuestion.optionB && (
                    <Input
                      placeholder="Type your answer..."
                      value={selectedAnswer ?? ""}
                      onChange={e => setSelectedAnswer(e.target.value)}
                      disabled={alreadyAnsweredCurrent}
                      className="text-center text-lg py-6"
                    />
                  )}

                  {!alreadyAnsweredCurrent && (
                    <Button
                      className="mt-6 bg-primary text-white rounded-full px-10"
                      disabled={!selectedAnswer || submitAnswerMutation.isPending}
                      onClick={() => selectedAnswer && submitAnswerMutation.mutate({
                        roomId: activeRoomId,
                        questionIndex: activeRoom.currentQuestionIndex ?? 0,
                        answer: selectedAnswer,
                      })}
                    >
                      Submit Answer
                    </Button>
                  )}

                  {alreadyAnsweredCurrent && (
                    <p className="mt-4 text-green-600 font-medium">✅ Answer submitted! Waiting for others...</p>
                  )}
                </CardContent>
              </Card>

              {/* Who answered */}
              {currentAnswers.length > 0 && (
                <div className="text-sm text-gray-500 text-center">
                  {currentAnswers.map((a: any) => {
                    const player = (activeRoom.players ?? []).find((p: any) => p.userId === a.userId);
                    return (
                      <span key={a.userId} className="inline-flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-2 py-0.5 mr-1">
                        ✓ {player?.displayName ?? `Player ${a.userId}`}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Host: next question */}
              {isHost && alreadyAnsweredCurrent && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => nextQuestionMutation.mutate({ roomId: activeRoomId })}
                    disabled={nextQuestionMutation.isPending}
                  >
                    Next Question →
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Finished */}
          {isFinished && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-10 text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Over!</h2>
                <p className="text-gray-600 mb-6">
                  Great game with {(activeRoom.players?.length ?? 1) - 1} other player{(activeRoom.players?.length ?? 1) - 1 !== 1 ? "s" : ""}!
                  You played {questions.length} questions of {GAME_TYPE_LABELS[activeRoom.gameType]?.label}.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Did you connect with someone? Check out their profile and send them a match request!
                </p>
                <Button
                  className="bg-primary text-white rounded-full px-8"
                  onClick={() => { leaveRoomMutation.mutate({ roomId: activeRoomId }); }}
                >
                  Back to Lobby
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display mb-2 flex items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-primary" />
              Game Lobby
            </h1>
            <p className="text-gray-600">
              {userCity
                ? `Play games with people near ${userCity} — no match required!`
                : "Play games with anyone on Just Putzit — no match required!"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => refetchRooms()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Game Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Room Name</label>
                    <Input
                      placeholder="e.g. Waukesha Friday Night Games"
                      value={newRoomName}
                      onChange={e => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Game Type</label>
                    <Select value={newGameType} onValueChange={v => setNewGameType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GAME_TYPE_LABELS).map(([key, val]) => (
                          <SelectItem key={key} value={key}>
                            {val.emoji} {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">{GAME_TYPE_LABELS[newGameType]?.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Max Players</label>
                    <Select value={String(newMaxPlayers)} onValueChange={v => setNewMaxPlayers(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} players</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-400">
                    Your city ({userCity ?? "unknown"}) will be attached so nearby players can find your room.
                  </p>
                  <Button
                    className="w-full bg-primary text-white rounded-full"
                    disabled={!newRoomName.trim() || createRoomMutation.isPending}
                    onClick={() => createRoomMutation.mutate({ name: newRoomName.trim(), gameType: newGameType, maxPlayers: newMaxPlayers })}
                  >
                    {createRoomMutation.isPending ? "Creating room & generating questions..." : "Create Room"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Room list */}
        {roomsLoading ? (
          <div className="text-center py-16 text-gray-400">Loading rooms...</div>
        ) : !rooms || rooms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No open rooms yet!</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Be the first to create a game room in {userCity ?? "your area"} and invite others to play!
            </p>
            <Button className="bg-primary text-white rounded-full" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create the First Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => {
              const info = GAME_TYPE_LABELS[room.gameType] ?? GAME_TYPE_LABELS.would_you_rather;
              const statusInfo = STATUS_LABELS[room.status] ?? STATUS_LABELS.waiting;
              return (
                <Card key={room.id} className="border border-gray-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <span>{info.emoji}</span> {info.label}
                          {room.city && <><MapPin className="w-3 h-3 ml-1" />{room.city}</>}
                        </p>
                      </div>
                      <Badge className={statusInfo.color + " text-xs"}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {room.maxPlayers} max players
                      </span>
                      <Button
                        size="sm"
                        className="bg-primary text-white rounded-full"
                        disabled={room.status === "finished" || joinRoomMutation.isPending}
                        onClick={() => joinRoomMutation.mutate({ roomId: room.id })}
                      >
                        <LogIn className="w-3.5 h-3.5 mr-1" />
                        {room.status === "waiting" ? "Join" : "Watch"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> How Game Lobby Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="text-2xl">1️⃣</span>
              <div><strong className="text-gray-800">Create or join a room</strong><br />No match needed — anyone nearby can join.</div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">2️⃣</span>
              <div><strong className="text-gray-800">Play together</strong><br />Sally generates fun questions. Answer and see what others picked!</div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">3️⃣</span>
              <div><strong className="text-gray-800">Connect after</strong><br />Liked someone in the game? Send them a match request!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
