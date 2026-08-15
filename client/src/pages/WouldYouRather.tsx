import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Scale, Sparkles, RotateCcw, Trophy, Users2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

type Choice = "A" | "B";

interface ResultState {
  yourChoice: Choice;
  percentA: number;
  percentB: number;
  totalVotes: number;
}

const CATEGORIES = [
  { key: "all", label: "Everything" },
  { key: "romance", label: "Romance" },
  { key: "food", label: "Food" },
  { key: "travel", label: "Travel" },
  { key: "fun", label: "Just Fun" },
  { key: "campus", label: "Campus" },
  { key: "deep", label: "Deep" },
];

export default function WouldYouRather() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();

  const [category, setCategory] = useState<string>("all");
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<ResultState | null>(null);
  const [streak, setStreak] = useState(0);

  const batchInput = useMemo(() => ({ category, limit: 12 }), [category]);

  const { data, isLoading } = trpc.wyr.getBatch.useQuery(batchInput, {
    enabled: isAuthenticated,
  });

  const answerMutation = trpc.wyr.answer.useMutation({
    onSuccess: (res) => {
      setResult({
        yourChoice: res.yourChoice,
        percentA: res.percentA,
        percentB: res.percentB,
        totalVotes: res.totalVotes,
      });
      setStreak((s) => s + 1);
      if (res.profileUpdated && res.learnedTraits.length > 0) {
        const preview = res.learnedTraits.slice(0, 2).join(" and ");
        toast.success(`Sally saved a preference from your pick: ${preview}.`);
      }
    },
  });

  const questions = data?.questions ?? [];
  const current = questions[index];

  function pick(choice: Choice) {
    if (!current || answerMutation.isPending || result) return;
    answerMutation.mutate({ questionId: current.id, choice });
  }

  function next() {
    setResult(null);
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      // Out of this batch — refetch a fresh batch and reset.
      setIndex(0);
      utils.wyr.getBatch.invalidate();
    }
  }

  function changeCategory(key: string) {
    setCategory(key);
    setIndex(0);
    setResult(null);
  }

  // ── Loading / auth states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32"><Spinner /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md py-24 text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <h1 className="font-display text-2xl font-bold mb-2">Would You Rather</h1>
          <p className="text-muted-foreground mb-6">
            A quick, fun way to break the ice and see how you line up with everyone else. Sign in to play.
          </p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="rounded-full">Sign in to play</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full gradient-sally flex items-center justify-center text-white shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold">Would You Rather</h1>
            <p className="text-sm text-muted-foreground">
              Tap your pick, then see how everyone else voted. No wrong answers.
            </p>
          </div>
          {streak > 0 && (
            <Badge variant="secondary" className="gap-1 rounded-full">
              <Trophy className="w-3.5 h-3.5" /> {streak} streak
            </Badge>
          )}
        </div>

        <div className="mb-6 inline-flex rounded-xl bg-muted p-1" aria-label="Would You Rather game mode">
          <button
            type="button"
            aria-pressed="true"
            className="rounded-lg bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm"
          >
            Solo
          </button>
          <button
            type="button"
            aria-pressed="false"
            onClick={() => navigate("/wyr-challenge")}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Challenge a Match
          </button>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => changeCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                category === c.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Game body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Spinner /></div>
        ) : !current ? (
          <Card className="border-none shadow-md">
            <CardContent className="p-10 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="font-display text-xl font-bold mb-2">You've answered them all!</h2>
              <p className="text-muted-foreground mb-6">
                You've gone through every question in this category. Try another category or check back later for more.
              </p>
              <Button onClick={() => changeCategory("all")} className="rounded-full gap-2">
                <RotateCcw className="w-4 h-4" /> Browse all questions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <p className="text-center text-sm font-medium text-muted-foreground mb-4">
              Would you rather...
            </p>

            {/* The two options */}
            <div className="grid gap-4 sm:grid-cols-2">
              {(["A", "B"] as Choice[]).map((side) => {
                const text = side === "A" ? current.optionA : current.optionB;
                const percent = side === "A" ? result?.percentA : result?.percentB;
                const isYours = result?.yourChoice === side;
                return (
                  <button
                    key={side}
                    onClick={() => pick(side)}
                    disabled={!!result || answerMutation.isPending}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-default ${
                      result
                        ? isYours
                          ? "border-primary ring-2 ring-primary/40"
                          : "border-border opacity-70"
                        : "border-border hover:border-primary hover:shadow-md"
                    }`}
                  >
                    {/* fill bar shown after answering */}
                    {result && (
                      <div
                        className="absolute inset-0 bg-primary/10 transition-all duration-500"
                        style={{ width: `${percent ?? 0}%` }}
                      />
                    )}
                    <div className="relative">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                          {side}
                        </span>
                        {result && (
                          <span className="font-display text-lg font-bold text-primary">
                            {percent}%
                          </span>
                        )}
                      </div>
                      <p className="text-base font-medium leading-snug">{text}</p>
                      {result && isYours && (
                        <Badge className="mt-3 rounded-full" variant="default">Your pick</Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* After-answer footer */}
            {result ? (
              <div className="mt-6 text-center">
                <p className="mb-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  {result.totalVotes <= 1
                    ? "You're the first to answer this one!"
                    : `Based on ${result.totalVotes} answers so far`}
                </p>
                <Button onClick={next} size="lg" className="rounded-full gap-2">
                  <Sparkles className="h-4 w-4" /> Next question
                </Button>
              </div>
            ) : (
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5" /> Pick the one that feels more like you
                </span>
              </div>
            )}

            {/* progress through batch */}
            <div className="mt-8">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Question {index + 1} of {questions.length}</span>
                <span>{data?.totalAnswered ?? 0} answered total</span>
              </div>
              <Progress value={((index + (result ? 1 : 0)) / questions.length) * 100} className="h-1.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
