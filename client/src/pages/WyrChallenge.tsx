import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Clock3, Heart, Loader2, Scale, Swords, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

type Choice = "A" | "B";

type ChallengeQuestion = {
  id: number;
  optionA: string;
  optionB: string;
  category: string;
};

function ChallengeDirectory() {
  const [, navigate] = useLocation();
  const { data: matchData, isLoading } = trpc.matchmaking.getMyMatches.useQuery();
  const sendChallenge = trpc.wyr.sendChallenge.useMutation({
    onSuccess: (data) => {
      if (!data.challenge?.id) {
        toast.error("The challenge could not be created. Please try again.");
        return;
      }
      toast.success("Challenge created. Your shared questions are ready.");
      navigate(`/wyr-challenge/${data.challenge.id}`);
    },
    onError: () => toast.error("Challenges are available only with an existing match."),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <button onClick={() => navigate("/would-you-rather")} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-900">
          <ArrowLeft className="h-4 w-4" /> Solo Would You Rather
        </button>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg">
            <Swords className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Challenge a Match</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">Answer the same ten questions privately. Compatibility appears only after you both finish.</p>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-orange-500" /></div>
          ) : (matchData ?? []).length === 0 ? (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
              <Users className="mx-auto mb-3 h-9 w-9 text-orange-300" />
              <h2 className="font-display text-xl font-bold text-gray-900">No matches to challenge yet</h2>
              <p className="mt-2 text-sm text-gray-500">When you have a match, you can start a private shared-question challenge here.</p>
            </div>
          ) : (
            (matchData ?? []).map((match) => (
              <div key={match.id} className="flex items-center gap-4 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ background: match.otherProfile?.avatarColor || "#fed7aa" }}>
                  {match.otherProfile?.avatarEmoji || "😊"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-900">{match.otherProfile?.displayName || "Your match"}</p>
                  <p className="text-sm text-orange-700">Ten private picks, one shared reveal</p>
                </div>
                <Button
                  size="sm"
                  disabled={sendChallenge.isPending}
                  className="rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                  onClick={() => sendChallenge.mutate({ challengedId: match.otherUserId, matchId: match.id })}
                >
                  Challenge
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "active" | "completed" }) {
  const styles = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    active: "border-sky-200 bg-sky-50 text-sky-800",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  const copy = {
    pending: "Waiting to begin",
    active: "In progress",
    completed: "Compatibility revealed",
  };
  return <Badge variant="outline" className={`gap-1 rounded-full ${styles[status]}`}><Clock3 className="h-3 w-3" />{copy[status]}</Badge>;
}

function CompatibilityReveal({ pct, onBack }: { pct: number; onBack: () => void }) {
  const emoji = pct >= 80 ? "🔥" : pct >= 60 ? "💛" : pct >= 40 ? "🤔" : "😅";
  const message = pct >= 80 ? "You two line up remarkably often." : pct >= 60 ? "You share quite a few preferences." : pct >= 40 ? "You have a fun mix of shared and different tastes." : "Different preferences can make a great conversation.";
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
      <div className="mb-3 text-6xl">{emoji}</div>
      <h2 className="font-display text-2xl font-bold text-gray-900">Your Compatibility</h2>
      <div className="mx-auto my-6 flex h-36 w-36 items-center justify-center rounded-full border-8 border-orange-200 bg-orange-50">
        <span className="font-display text-5xl font-bold text-orange-600">{pct}%</span>
      </div>
      <p className="mx-auto max-w-sm text-sm text-gray-600">{message}</p>
      <Button onClick={onBack} variant="outline" className="mt-7 rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to games
      </Button>
    </div>
  );
}

function ChallengeParticipant({ challengeId }: { challengeId: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [answeredSinceLoad, setAnsweredSinceLoad] = useState<number[]>([]);
  const { data, isLoading, error } = trpc.wyr.getChallenge.useQuery(
    { challengeId },
    { refetchInterval: 12_000 },
  );
  const answerMutation = trpc.wyr.answer.useMutation({
    onSuccess: (_result, variables) => {
      setAnsweredSinceLoad((answered) => Array.from(new Set([...answered, variables.questionId])));
      void utils.wyr.getChallenge.invalidate({ challengeId });
    },
    onError: () => toast.error("Your pick could not be saved. Please try again."),
  });
  const compatibilityMutation = trpc.wyr.computeCompatibility.useMutation({
    onSuccess: () => {
      toast.success("Your shared compatibility is ready.");
      void utils.wyr.getChallenge.invalidate({ challengeId });
    },
    onError: (mutationError) => toast.error(mutationError.message || "Compatibility is not ready just yet."),
  });

  const questions = useMemo(
    () => ((data?.questions ?? []).filter(Boolean) as ChallengeQuestion[]),
    [data?.questions],
  );
  const answeredIds = useMemo(
    () => new Set([...(data?.myAnsweredQuestionIds ?? []), ...answeredSinceLoad]),
    [data?.myAnsweredQuestionIds, answeredSinceLoad],
  );
  const currentIndex = questions.findIndex((question) => !answeredIds.has(question.id));
  const currentQuestion = currentIndex >= 0 ? questions[currentIndex] : undefined;
  const answeredCount = Math.min(questions.length, answeredIds.size);

  useEffect(() => {
    if (data?.myAnsweredQuestionIds) {
      setAnsweredSinceLoad((answered) => answered.filter((questionId) => !data.myAnsweredQuestionIds.includes(questionId)));
    }
  }, [data?.myAnsweredQuestionIds]);

  if (isLoading) {
    return <div className="flex justify-center py-28"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <Heart className="mx-auto mb-3 h-10 w-10 text-rose-400" />
        <h1 className="font-display text-2xl font-bold text-gray-900">This invitation is private</h1>
        <p className="mt-2 text-sm text-gray-600">Only the two matched members on this challenge can open its questions and reveal.</p>
        <Button onClick={() => navigate("/matches")} variant="outline" className="mt-6 rounded-xl">Back to matches</Button>
      </div>
    );
  }

  const status = data.displayStatus as "pending" | "active" | "completed";
  const total = questions.length;
  const partnerDone = data.partnerAnsweredCount >= total && total > 0;
  const myDone = answeredCount >= total && total > 0;

  if (data.challenge.status === "completed" && data.challenge.compatibilityPct !== null) {
    return <CompatibilityReveal pct={data.challenge.compatibilityPct} onBack={() => navigate(data.challenge.matchId ? `/games/${data.challenge.matchId}` : "/matches")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate(data.challenge.matchId ? `/games/${data.challenge.matchId}` : "/matches")} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-900">
            <ArrowLeft className="h-4 w-4" /> Back to games
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500"><Scale className="h-5 w-5 text-white" /></div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Would You Rather Challenge</h1>
              <p className="text-sm text-gray-600">Your picks stay private until the shared reveal.</p>
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-800">Your progress</span>
          <span className="text-orange-700">{answeredCount} / {total}</span>
        </div>
        <Progress value={total ? (answeredCount / total) * 100 : 0} className="h-2" />
        <p className="mt-3 text-xs text-gray-500">Your match has completed {Math.min(data.partnerAnsweredCount, total)} of {total} private picks.</p>
      </div>

      {currentQuestion ? (
        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-gray-500">Question {currentIndex + 1} of {total}</span>
            <Badge variant="secondary" className="rounded-full capitalize">{currentQuestion.category}</Badge>
          </div>
          <p className="mb-6 text-center font-display text-2xl font-bold text-gray-900">Would you rather…</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["A", "B"] as Choice[]).map((choice) => (
              <button
                key={choice}
                disabled={answerMutation.isPending}
                onClick={() => answerMutation.mutate({ questionId: currentQuestion.id, choice })}
                className="group rounded-2xl border-2 border-orange-100 bg-orange-50/50 p-5 text-left transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="mb-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-orange-700 shadow-sm group-hover:bg-orange-500 group-hover:text-white">{choice}</span>
                <span className="block font-semibold leading-snug text-gray-900">{choice === "A" ? currentQuestion.optionA : currentQuestion.optionB}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          {partnerDone ? <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-500" /> : <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />}
          <h2 className="font-display text-2xl font-bold text-gray-900">{partnerDone ? "Both sets of picks are in" : "Your answers are saved"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            {partnerDone ? "Reveal your shared compatibility when you’re ready." : "Your match needs to finish their private picks before the compatibility reveal unlocks. This page checks for progress automatically."}
          </p>
          {partnerDone && (
            <Button disabled={compatibilityMutation.isPending} onClick={() => compatibilityMutation.mutate({ challengeId })} className="mt-6 rounded-xl bg-orange-500 text-white hover:bg-orange-600">
              {compatibilityMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
              Reveal compatibility
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function WyrChallengePage() {
  const { user, loading } = useAuth();
  const { challengeId } = useParams<{ challengeId?: string }>();
  const numericChallengeId = Number(challengeId);
  const hasChallengeId = Number.isSafeInteger(numericChallengeId) && numericChallengeId > 0;

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50"><div className="flex justify-center py-28"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 px-4 py-24 text-center">
        <Heart className="mx-auto mb-4 h-12 w-12 text-rose-400" />
        <h1 className="font-display text-2xl font-bold text-gray-900">Sign in to play together</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">Would You Rather challenges are private to the two matched members.</p>
      </div>
    );
  }

  if (!hasChallengeId) return <ChallengeDirectory />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 px-4 py-10">
      <main className="mx-auto w-full max-w-2xl"><ChallengeParticipant challengeId={numericChallengeId} /></main>
    </div>
  );
}
