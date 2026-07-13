import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSEO } from "@/hooks/useSEO";
import {
  Trophy, Users, Play, Volume2, Send, Copy, Check, Home,
} from "lucide-react";
import { toast } from "sonner";

type GamePhase = "lobby" | "playing" | "results";

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
  const [scoreboard, setScoreboard] = useState<Array<{ userId: number; score: number; correctAnswers: number; rank: number }>>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ userId: number; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const createRoomMutation = trpc.triviaPursuit.createRoom.useMutation();
  const joinRoomMutation = trpc.triviaPursuit.joinRoom.useMutation();
  const getRoomQuery = trpc.triviaPursuit.getRoom.useQuery(roomId ? { roomId } : { roomId: 0 }, { enabled: !!roomId });
  const nextQuestionMutation = trpc.triviaPursuit.nextQuestion.useMutation();
  const submitAnswerMutation = trpc.triviaPursuit.submitAnswer.useMutation();
  const getScoreboardQuery = trpc.triviaPursuit.getScoreboard.useQuery(roomId ? { roomId } : { roomId: 0 }, { enabled: !!roomId });
  const startGameMutation = trpc.triviaPursuit.startGame.useMutation();
  const chatMutation = trpc.triviaPursuit.chat.useMutation();

  // Handle TTS for question
  const handleSpeakQuestion = async (text: string) => {
    if (!text) return;
    
    setIsSpeaking(true);
    try {
      // Use Web Speech API for TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast.error("Failed to speak question");
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setIsSpeaking(false);
      toast.error("TTS not available");
    }
  };

  // Create room
  const handleCreateRoom = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Select at least one category");
      return;
    }

    try {
      const result = await createRoomMutation.mutateAsync({
        categoryIds: selectedCategories,
        maxPlayers,
      });
      setRoomId(result.roomId);
      setGameCode(result.gameCode);
      setIsHost(true);
      setPhase("playing");
      toast.success(`Game created! Code: ${result.gameCode}`);
    } catch (error) {
      toast.error("Failed to create room");
    }
  };

  // Join room
  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast.error("Enter a game code");
      return;
    }

    try {
      const result = await joinRoomMutation.mutateAsync({ gameCode: joinCode.toUpperCase() });
      setRoomId(result.roomId);
      setPhase("playing");
      toast.success("Joined game!");
    } catch (error) {
      toast.error("Failed to join room");
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
    } catch (error) {
      toast.error("Failed to get next question");
    }
  };

  // Submit answer
  const handleSubmitAnswer = async (answer: "A" | "B" | "C" | "D") => {
    if (!currentQuestion) return;

    try {
      const result = await submitAnswerMutation.mutateAsync({
        roomId: roomId!,
        questionId: currentQuestion.questionId,
        answer,
      });
      
      setSelectedAnswer(answer);
      setAnswerRevealed(true);
      
      if (result.isCorrect) {
        toast.success(`Correct! +${result.pointsAwarded} points`);
      } else {
        toast.error(`Incorrect. Answer: ${result.correctAnswer}`);
      }
    } catch (error) {
      toast.error("Failed to submit answer");
    }
  };

  // Send chat
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    try {
      await chatMutation.mutateAsync({ roomId: roomId!, message: chatInput });
      setChatMessages([...chatMessages, { userId: user?.id || 0, content: chatInput }]);
      setChatInput("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  // Copy game code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (phase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-900 mb-2">Trivia Pursuit</h1>
            <p className="text-gray-600">Answer multiple choice questions with 1-10 players!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Room */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Create Game
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Categories</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((id) => (
                      <Button
                        key={id}
                        variant={selectedCategories.includes(id) ? "default" : "outline"}
                        onClick={() =>
                          setSelectedCategories((prev) =>
                            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
                          )
                        }
                      >
                        Category {id}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Max Players</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleCreateRoom}
                  disabled={createRoomMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Create Game
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Join Game
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Game Code</label>
                  <Input
                    placeholder="Enter game code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleJoinRoom}
                  disabled={joinRoomMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Join Game
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 to-red-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Trivia Pursuit</h1>
            {isHost && (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Badge variant="secondary">Code: {gameCode}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className="text-white hover:bg-white/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Question */}
              {currentQuestion && (
                <Card className="bg-white/95">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-lg font-medium text-gray-800">{currentQuestion.question}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSpeakQuestion(currentQuestion.question)}
                        disabled={isSpeaking}
                        className="flex-shrink-0"
                      >
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
                            <span className="text-sm">
                              {currentQuestion[`option${letter}` as keyof typeof currentQuestion]}
                            </span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        disabled={nextQuestionMutation.isPending}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        Next Question
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Start Game */}
              {!currentQuestion && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Play?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleNextQuestion}
                      disabled={nextQuestionMutation.isPending}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-20 text-lg"
                    >
                      Start Game
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Scoreboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Scoreboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scoreboard.map((player, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div>
                          <div className="font-medium">#{player.rank}</div>
                          <div className="text-xs text-gray-600">{player.correctAnswers} correct</div>
                        </div>
                        <span className="font-bold text-orange-600">{player.score}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chat */}
              <Card>
                <CardHeader>
                  <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-40 border rounded p-2">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="text-sm mb-2">
                        <span className="font-medium">Player {msg.userId}:</span> {msg.content}
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Say something..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                    />
                    <Button
                      size="sm"
                      onClick={handleSendChat}
                      disabled={chatMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
