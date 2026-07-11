import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Swords, Heart, Trophy, ArrowRight, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

// ─── Challenge Lobby (send a challenge to a match) ────────────────────────────
function ChallengeLobby({ onStartSolo }: { onStartSolo: () => void }) {
  const { data: matchData } = trpc.matchmaking.getMyMatches.useQuery();
  const sendChallenge = trpc.wyr.sendChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge sent! They'll get a notification to play.");
    },
    onError: () => toast.error("Couldn't send challenge right now."),
  });

  const matches = matchData ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center mx-auto shadow-lg">
            <Swords className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Challenge a Match</h1>
          <p className="text-gray-500 text-sm">
            Both of you answer the same 10 questions — then see how well you line up.
          </p>
        </div>

        {/* Challenge a match */}
        {matches.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              Send a challenge to one of your matches
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.otherProfile?.avatarEmoji ?? "😊"}</span>
                    <span className="font-medium text-gray-800">
                      {m.otherProfile?.displayName ?? "Your match"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={sendChallenge.isPending}
                    onClick={() =>
                      sendChallenge.mutate({
                        challengedId: m.otherUserId,
                        matchId: m.id,
                      })
                    }
                  >
                    Challenge
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 text-center text-gray-400 text-sm">
            You don't have any matches yet — complete Sally's interview to get matched!
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="flex-1 h-px bg-gray-200" />
          or
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Solo play */}
        <Button
          onClick={onStartSolo}
          variant="outline"
          className="w-full h-12 text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          Play solo — just answer for yourself
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ─── Answer card ──────────────────────────────────────────────────────────────
interface Question {
  id: number;
  optionA: string;
  optionB: string;
  category: string;
}

interface AnswerResult {
  yourChoice: "A" | "B";
  percentA: number;
  percentB: number;
  totalVotes: number;
}

function AnswerCard({
  question,
  index,
  total,
  onAnswer,
  result,
}: {
  question: Question;
  index: number;
  total: number;
  onAnswer: (choice: "A" | "B") => void;
  result: AnswerResult | null;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Question {index + 1} of {total}</span>
            <Badge variant="secondary" className="text-xs capitalize">
              {question.category}
            </Badge>
          </div>
          <Progress value={((index + 1) / total) * 100} className="h-1.5" />
        </div>

        {/* Prompt */}
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">Would you rather…</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {(["A", "B"] as const).map((choice) => {
            const label = choice === "A" ? question.optionA : question.optionB;
            const pct = result ? (choice === "A" ? result.percentA : result.percentB) : null;
            const chosen = result?.yourChoice === choice;

            return (
              <button
                key={choice}
                disabled={!!result}
                onClick={() => onAnswer(choice)}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                  result
                    ? chosen
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-gray-50 opacity-60"
                    : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        chosen
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {choice}
                    </span>
                    <span className="font-medium text-gray-800 leading-snug">{label}</span>
                  </div>
                  {pct !== null && (
                    <span className={`text-sm font-bold flex-shrink-0 ${chosen ? "text-orange-500" : "text-gray-400"}`}>
                      {pct}%
                    </span>
                  )}
                </div>
                {result && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          chosen ? "bg-orange-400" : "bg-gray-300"
                        }`}
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{result.totalVotes} players answered</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Next hint */}
        {result && (
          <p className="text-center text-xs text-gray-400 animate-pulse">
            Tap next question →
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Compatibility reveal ─────────────────────────────────────────────────────
function CompatibilityReveal({
  pct,
  onPlayAgain,
}: {
  pct: number;
  onPlayAgain: () => void;
}) {
  const emoji =
    pct >= 80 ? "🔥" : pct >= 60 ? "💛" : pct >= 40 ? "🤔" : "😅";
  const label =
    pct >= 80
      ? "You two are basically the same person!"
      : pct >= 60
      ? "Pretty solid match — lots in common."
      : pct >= 40
      ? "Interesting mix — opposites can attract!"
      : "Very different tastes — that's okay too!";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="space-y-2">
          <div className="text-6xl">{emoji}</div>
          <h2 className="text-3xl font-bold text-gray-900">Your Compatibility</h2>
        </div>

        {/* Big number */}
        <div className="relative">
          <div className="w-40 h-40 rounded-full border-8 border-orange-200 flex items-center justify-center mx-auto bg-white shadow-lg">
            <div>
              <span className="text-5xl font-black text-orange-500">{pct}</span>
              <span className="text-2xl font-bold text-orange-400">%</span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-base font-medium">{label}</p>

        <div className="space-y-3">
          <Button
            onClick={onPlayAgain}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-orange-200 text-orange-600 hover:bg-orange-50"
            onClick={() => window.history.back()}
          >
            Back to Matches
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Solo play mode (no challenge partner) ────────────────────────────────────
function SoloPlay({ onDone }: { onDone: (pct: number) => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [pendingResult, setPendingResult] = useState<AnswerResult | null>(null);

  const { data } = trpc.wyr.getBatch.useQuery({ limit: 10 });
  const answerMutation = trpc.wyr.answer.useMutation({
    onSuccess: (res) => {
      setPendingResult(res);
    },
  });

  const questions = data?.questions ?? [];

  const handleAnswer = (choice: "A" | "B") => {
    if (!questions[currentIdx] || pendingResult) return;
    answerMutation.mutate({ questionId: questions[currentIdx].id, choice });
  };

  const handleNext = () => {
    if (!pendingResult) return;
    const newResults = [...results, pendingResult];
    setResults(newResults);
    setPendingResult(null);

    if (currentIdx + 1 >= questions.length) {
      // Compute a pseudo-compatibility with the "crowd" (average agreement)
      const avgA = newResults.reduce((s, r) => s + r.percentA, 0) / newResults.length;
      const pct = Math.round(avgA > 50 ? avgA : 100 - avgA);
      onDone(pct);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  if (!data || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (pendingResult) {
    return (
      <div onClick={handleNext} className="cursor-pointer">
        <AnswerCard
          question={questions[currentIdx]}
          index={currentIdx}
          total={questions.length}
          onAnswer={() => {}}
          result={pendingResult}
        />
      </div>
    );
  }

  return (
    <AnswerCard
      question={questions[currentIdx]}
      index={currentIdx}
      total={questions.length}
      onAnswer={handleAnswer}
      result={null}
    />
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function WyrChallengePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"lobby" | "solo" | "result">("lobby");
  const [finalPct, setFinalPct] = useState(0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Heart className="w-12 h-12 text-orange-400 mx-auto" />
          <p className="text-gray-600">Sign in to play Would You Rather with your matches.</p>
          <Button onClick={() => navigate("/")} className="bg-orange-500 hover:bg-orange-600 text-white">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "lobby") {
    return <ChallengeLobby onStartSolo={() => setMode("solo")} />;
  }

  if (mode === "solo") {
    return (
      <SoloPlay
        onDone={(pct) => {
          setFinalPct(pct);
          setMode("result");
        }}
      />
    );
  }

  return (
    <CompatibilityReveal
      pct={finalPct}
      onPlayAgain={() => {
        setFinalPct(0);
        setMode("lobby");
      }}
    />
  );
}
