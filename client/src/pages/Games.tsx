import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Sparkles } from "lucide-react";

type GameType = "newlywed" | "two_truths" | "this_or_that";

export default function Games() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();
  const mid = parseInt(matchId || "0");
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ user1Score: number; user2Score: number; sallyNarration?: string | null; matchPercent?: number } | null>(null);

  const { data: myMatches } = trpc.matchmaking.getMyMatches.useQuery(undefined, { enabled: !!mid });
  const match = myMatches?.find(m => m.id === mid);
  const otherProfile = match?.otherProfile;

  const { data: profile } = trpc.profile.get.useQuery();

  const startNewlywed = trpc.games.startNewlywed.useMutation({
    onSuccess: (data: any) => {
      if (data) {
        setSessionId(data.id);
        setQuestions(data.questions || []);
        setCurrentQ(0);
        setResult(null);
      }
      setIsLoading(false);
    },
    onError: () => { toast.error("Couldn't start the game."); setIsLoading(false); },
  });

  const startTwoTruths = trpc.games.startTwoTruths.useMutation({
    onSuccess: (data: any) => {
      if (data) {
        setSessionId(data.id);
        setQuestions(data.questions || []);
        setCurrentQ(0);
        setResult(null);
      }
      setIsLoading(false);
    },
    onError: () => { toast.error("Couldn't start the game."); setIsLoading(false); },
  });

  const startThisOrThat = trpc.games.startThisOrThat.useMutation({
    onSuccess: (data: any) => {
      if (data) {
        setSessionId(data.id);
        setQuestions(data.questions || []);
        setCurrentQ(0);
        setResult(null);
      }
      setIsLoading(false);
    },
    onError: () => { toast.error("Couldn't start the game."); setIsLoading(false); },
  });

  const submitAnswer = trpc.games.submitAnswer.useMutation({
    onSuccess: (data: any) => {
      if (data.isComplete) {
        setResult({ user1Score: data.user1Score, user2Score: data.user2Score, sallyNarration: data.sallyNarration, matchPercent: data.matchPercent });
      } else {
        setCurrentQ(prev => prev + 1);
      }
      setIsLoading(false);
    },
    onError: () => { toast.error("Couldn't submit answer."); setIsLoading(false); },
  });

  const handleStartGame = (type: GameType) => {
    setActiveGame(type);
    setIsLoading(true);
    setQuestions([]);
    if (type === "newlywed") startNewlywed.mutate({ matchId: mid });
    else if (type === "two_truths") startTwoTruths.mutate({ matchId: mid });
    else startThisOrThat.mutate({ matchId: mid });
  };

  const handleAnswer = (answer: string) => {
    if (!sessionId || isLoading) return;
    const q = questions[currentQ];
    if (!q) return;
    const isUser1 = profile?.userId === match?.user1Id;
    setIsLoading(true);
    submitAnswer.mutate({ sessionId, questionId: q.id, answer, isUser1: isUser1 ?? true });
  };

  // Game selection screen
  if (!activeGame) {
    return (
      <div className="min-h-screen gradient-warm">
        <div className="container py-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/chat/${matchId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-2xl">Sally's Games 🎮</h1>
              <p className="text-muted-foreground text-sm">Fun ways to get to know each other</p>
            </div>
          </div>

          {otherProfile && (
            <div className="bg-white rounded-3xl p-5 mb-6 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: otherProfile.avatarColor || "#f97316" }}>
                {otherProfile.avatarEmoji || "😊"}
              </div>
              <div>
                <p className="font-bold">Playing with {otherProfile.displayName}</p>
                <p className="text-sm text-primary font-semibold">{match?.compatibilityScore}% compatible</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <GameSelectCard emoji="💍" title="Newlywed Game" desc="Sally quizzes you on what you think your match answered. How well do you already know each other?" color="gradient-singles" onPlay={() => handleStartGame("newlywed")} />
            <GameSelectCard emoji="🎭" title="Two Truths & a Lie" desc="Sally crafts 3 statements from your match's profile — can you spot the one that's false?" color="gradient-couples" onPlay={() => handleStartGame("two_truths")} />
            <GameSelectCard emoji="⚡" title="This or That" desc="Rapid-fire either/or questions — Sally reveals how often your answers matched!" color="gradient-community" onPlay={() => handleStartGame("this_or_that")} />
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading || (activeGame && questions.length === 0 && !result)) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse">🤖</div>
          <p className="font-semibold">Sally is preparing your game...</p>
          <p className="text-sm text-muted-foreground mt-1">Personalizing questions from your profiles</p>
        </div>
      </div>
    );
  }

  // Results
  if (result) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-3xl animate-float">🤖</div>
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">Game Over!</h2>
          {activeGame === "this_or_that" && result.matchPercent != null && (
            <div className="mb-6">
              <div className="text-5xl font-display font-bold text-primary">{result.matchPercent}%</div>
              <div className="text-sm text-muted-foreground">your answers matched!</div>
            </div>
          )}
          {result.sallyNarration && (
            <div className="bg-primary/5 rounded-2xl p-4 mb-6 text-sm italic border border-primary/10">
              <div className="flex items-center gap-2 justify-center mb-2">
                <span>🤖</span>
                <span className="font-semibold text-primary not-italic">Sally says:</span>
              </div>
              {result.sallyNarration}
            </div>
          )}
          {activeGame !== "this_or_that" && (
            <div className="flex gap-4 justify-center mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{result.user1Score}</div>
                <div className="text-xs text-muted-foreground">Your Score</div>
              </div>
              <div className="text-2xl text-muted-foreground self-center">vs</div>
              <div className="text-center">
                <div className="text-3xl font-bold">{result.user2Score}</div>
                <div className="text-xs text-muted-foreground">{otherProfile?.displayName}</div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setActiveGame(null); setResult(null); setQuestions([]); }}>Play Again</Button>
            <Button className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale" onClick={() => navigate(`/chat/${matchId}`)}>Back to Chat</Button>
          </div>
        </div>
      </div>
    );
  }

  // Active question
  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full gradient-sally flex items-center justify-center text-xl">🤖</div>
          <div className="flex-1">
            <p className="font-bold text-sm">Sally — {activeGame === "newlywed" ? "Newlywed Game" : activeGame === "two_truths" ? "Two Truths & a Lie" : "This or That"}</p>
            <p className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <Badge variant="secondary" className="rounded-full">{currentQ + 1}/{questions.length}</Badge>
        </div>
        <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="mb-6">
          <p className="text-lg font-semibold mb-1">{q.question}</p>
          {q.targetUserName && <p className="text-sm text-muted-foreground">About: <span className="font-medium">{q.targetUserName}</span></p>}
        </div>

        {activeGame === "two_truths" && q.statements ? (
          <div className="space-y-3">
            {q.statements.map((stmt: string, i: number) => (
              <button key={i} onClick={() => handleAnswer(String(i))} disabled={isLoading}
                className="w-full text-left p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium disabled:opacity-50">
                <span className="text-primary font-bold mr-2">{i + 1}.</span> {stmt}
              </button>
            ))}
          </div>
        ) : activeGame === "this_or_that" && q.optionA && q.optionB ? (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAnswer("A")} disabled={isLoading}
              className="p-6 rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center font-bold text-lg disabled:opacity-50">
              {q.optionA}
            </button>
            <button onClick={() => handleAnswer("B")} disabled={isLoading}
              className="p-6 rounded-2xl border-2 border-pink-200 hover:border-pink-500 hover:bg-pink-50 transition-all text-center font-bold text-lg disabled:opacity-50">
              {q.optionB}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(q.options || [q.correctAnswer, "Something else", "I'm not sure"]).map((opt: string) => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={isLoading}
                className="w-full text-left p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium disabled:opacity-50">
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameSelectCard({ emoji, title, desc, color, onPlay }: { emoji: string; title: string; desc: string; color: string; onPlay: () => void }) {
  return (
    <div className={`${color} rounded-3xl p-6 card-hover`}>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{emoji}</div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm text-foreground/70 mb-4">{desc}</p>
          <Button size="sm" className="gradient-sally text-white border-0 rounded-xl btn-scale gap-2" onClick={onPlay}>
            <Sparkles className="w-3.5 h-3.5" /> Play with Sally
          </Button>
        </div>
      </div>
    </div>
  );
}
