import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CalendarDays, Check, ChevronRight, Compass, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GameCompletionCelebration } from "@/components/GameCompletionCelebration";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";
import { playGameCompletionChime } from "@/lib/gameCelebration";
import {
  COMMON_GROUND_OPTIONS,
  getSocialGame,
  hasExactlyThreeCommonGroundSelections,
  LOCAL_LEGEND_ROUNDS,
  PERFECT_SATURDAY_ROUNDS,
  PUBLIC_PLAN_OPTIONS,
  SAFE_PLAN_COPY,
  SOCIAL_GAMES,
  type ChoiceRound,
  type SocialGameId,
} from "@/lib/socialGames";

type CompleteGame = { id: SocialGameId; summary: string[] } | null;

const ART_REFERENCE_URL = "/manus-storage/just-putzit-social-games-reference_afd73bb0.png";

function ProgressRail({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-7" aria-label={`${current} of ${total} choices completed`}>
      <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>{current} of {total}</span><span>Just Putzit Games</span></div>
      <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(8, (current / total) * 100)}%` }} /></div>
    </div>
  );
}

function ChoiceRoundGame({
  round,
  current,
  total,
  onChoice,
}: {
  round: ChoiceRound;
  current: number;
  total: number;
  onChoice: (choice: string) => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <ProgressRail current={current} total={total} />
      <Card className="border-primary/15 bg-card shadow-xl shadow-primary/5"><CardContent className="p-6 sm:p-8">
        <Badge variant="secondary" className="rounded-full">Quick choice</Badge>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{round.prompt}</h2>
        <div className="mt-7 grid gap-3">
          {round.choices.map((choice) => <Button key={choice} variant="outline" className="h-auto min-h-14 justify-between whitespace-normal rounded-2xl border-border bg-background px-5 py-4 text-left text-base hover:border-primary hover:bg-primary/5" onClick={() => onChoice(choice)}>
            <span>{choice}</span><ChevronRight className="h-4 w-4 shrink-0 text-primary" />
          </Button>)}
        </div>
      </CardContent></Card>
    </div>
  );
}

function ThreeInCommonGame({ selected, onToggle, onSubmit }: { selected: string[]; onToggle: (value: string) => void; onSubmit: () => void }) {
  const ready = hasExactlyThreeCommonGroundSelections(selected);
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <ProgressRail current={selected.length} total={3} />
      <Card className="border-fuchsia-200 bg-card shadow-xl shadow-fuchsia-500/5"><CardContent className="p-6 sm:p-8">
        <Badge variant="secondary" className="rounded-full">Pick exactly three</Badge>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">What makes an easy conversation starter?</h2>
        <p className="mt-3 text-sm text-muted-foreground">Choose three things you genuinely enjoy. Sally uses these as low-pressure common-ground prompts.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {COMMON_GROUND_OPTIONS.map((option) => {
            const isSelected = selected.includes(option);
            const isDisabled = !isSelected && selected.length >= 3;
            return <Button key={option} variant={isSelected ? "default" : "outline"} disabled={isDisabled} onClick={() => onToggle(option)} className={cn("h-auto rounded-full px-4 py-3 text-left", isSelected && "bg-fuchsia-600 hover:bg-fuchsia-700")}>{isSelected && <Check className="mr-2 h-4 w-4" />}{option}</Button>;
          })}
        </div>
        <Button className="mt-8 w-full rounded-full" disabled={!ready} onClick={onSubmit}>Save my three things <Sparkles className="ml-2 h-4 w-4" /></Button>
      </CardContent></Card>
    </div>
  );
}

function WouldYouJoinMeGame({ onChoice }: { onChoice: (choice: string) => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <Card className="border-sky-200 bg-card shadow-xl shadow-sky-500/5"><CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-3"><div className="rounded-2xl bg-sky-100 p-3 text-sky-700"><ShieldCheck className="h-6 w-6" /></div><div><Badge variant="secondary" className="rounded-full">Public plans only</Badge><h2 className="mt-3 font-display text-3xl font-bold tracking-tight">What would you comfortably do with someone new?</h2></div></div>
        <p className="mt-4 text-sm text-muted-foreground">There is no pressure to contact anyone. This just helps surface public activities you would feel good about joining.</p>
        <div className="mt-7 grid gap-3">
          {PUBLIC_PLAN_OPTIONS.map((option) => <Button key={option} variant="outline" className="h-auto min-h-14 justify-between whitespace-normal rounded-2xl border-border bg-background px-5 py-4 text-left text-base hover:border-sky-500 hover:bg-sky-50" onClick={() => onChoice(option)}><span>{option}</span><ChevronRight className="h-4 w-4 shrink-0 text-sky-600" /></Button>)}
        </div>
        <p className="mt-6 rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-sky-900"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />{SAFE_PLAN_COPY}</p>
      </CardContent></Card>
    </div>
  );
}

function GameComplete({ complete, onPlayAgain, onBack }: { complete: Exclude<CompleteGame, null>; onPlayAgain: () => void; onBack: () => void }) {
  const game = getSocialGame(complete.id);
  const isPublicPlan = complete.id === "would_you_join_me";
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-xl"><GameCompletionCelebration /><CardContent className="relative p-7 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-3xl text-primary-foreground">{game?.emoji}</div>
        <Badge className="mt-5 rounded-full">Saved to your profile</Badge>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">Nice work!</h2>
        <p className="mt-3 text-sm text-muted-foreground">Sally learned a little more about the kind of community time that feels natural to you.</p>
        <div className="mt-6 rounded-2xl border bg-card p-4 text-left"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your picks</p><div className="mt-3 flex flex-wrap gap-2">{complete.summary.map((item) => <Badge key={item} variant="secondary" className="rounded-full px-3 py-1.5">{item}</Badge>)}</div></div>
        {isPublicPlan ? <div className="mt-6 rounded-2xl bg-sky-50 p-5 text-left"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><h3 className="font-semibold text-sky-950">Ready when you are</h3><p className="mt-1 text-sm leading-relaxed text-sky-900">Browse public activities near you. Start with a public place and only take the next step when everyone is comfortable.</p></div></div><Button className="mt-4 w-full rounded-full" asChild><a href="/events"><Compass className="mr-2 h-4 w-4" />Browse public events</a></Button></div> : <div className="mt-6 rounded-2xl bg-primary/5 p-4 text-left text-sm text-muted-foreground"><Users className="mr-2 inline h-4 w-4 text-primary" />These preferences can help turn a future conversation into an easy local plan.</div>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button className="flex-1 rounded-full" onClick={onPlayAgain}>Play another</Button><Button variant="outline" className="flex-1 rounded-full bg-card" onClick={onBack}>Back to games</Button></div>
      </CardContent></Card>
    </div>
  );
}

export default function SocialGames() {
  useSEO({ title: "Community Games — Just Putzit", description: "Short social games that turn shared interests into safe local plans." });
  const [, navigate] = useLocation();
  const recordAnswer = trpc.games.recordGameAnswer.useMutation();
  const [activeGame, setActiveGame] = useState<SocialGameId | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [summary, setSummary] = useState<string[]>([]);
  const [commonSelections, setCommonSelections] = useState<string[]>([]);
  const [complete, setComplete] = useState<CompleteGame>(() => new URLSearchParams(window.location.search).get("demo") === "complete"
    ? { id: "local_legend", summary: ["A coffee and a neighborhood stroll", "A hidden breakfast spot", "A class or club"] }
    : null);

  const startGame = (id: SocialGameId) => { setActiveGame(id); setRoundIndex(0); setSummary([]); setCommonSelections([]); setComplete(null); };
  const leaveGame = () => { setActiveGame(null); setRoundIndex(0); setSummary([]); setCommonSelections([]); };
  const saveAnswer = (gameType: SocialGameId, questionId: number, answer: string, traitKey: string) => recordAnswer.mutate({ gameType, questionId, answer, traitKey, traitValue: answer });
  const celebrateCompletion = () => { playGameCompletionChime(); };

  const handleChoiceRound = (rounds: ChoiceRound[], choice: string) => {
    const round = rounds[roundIndex];
    if (!activeGame || !round) return;
    saveAnswer(activeGame, round.id, choice, round.traitKey);
    const nextSummary = [...summary, choice];
    if (roundIndex + 1 >= rounds.length) { celebrateCompletion(); setSummary(nextSummary); setComplete({ id: activeGame, summary: nextSummary }); setActiveGame(null); return; }
    setSummary(nextSummary); setRoundIndex((current) => current + 1);
  };

  const toggleCommonGround = (option: string) => setCommonSelections((current) => current.includes(option) ? current.filter((item) => item !== option) : current.length < 3 ? [...current, option] : current);
  const submitCommonGround = () => { commonSelections.forEach((answer, index) => saveAnswer("three_in_common", index + 1, answer, "common_ground_starters")); celebrateCompletion(); setComplete({ id: "three_in_common", summary: commonSelections }); setActiveGame(null); toast.success("Your common-ground starters are saved."); };
  const submitPublicPlan = (answer: string) => { saveAnswer("would_you_join_me", 1, answer, "public_plan_interest"); celebrateCompletion(); setComplete({ id: "would_you_join_me", summary: [answer] }); setActiveGame(null); toast.success("Your public-plan preference is saved."); };

  if (complete) return <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background"><header className="border-b bg-card/80 px-4 py-3"><div className="container max-w-5xl"><Button variant="ghost" size="sm" onClick={leaveGame}><ArrowLeft className="mr-2 h-4 w-4" />Games</Button></div></header><GameComplete complete={complete} onPlayAgain={() => startGame(complete.id)} onBack={() => { setComplete(null); leaveGame(); }} /></div>;

  if (activeGame) {
    const game = getSocialGame(activeGame);
    const rounds = activeGame === "local_legend" ? LOCAL_LEGEND_ROUNDS : activeGame === "perfect_saturday" ? PERFECT_SATURDAY_ROUNDS : null;
    return <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background"><header className="border-b bg-card/80 px-4 py-3"><div className="container max-w-5xl"><Button variant="ghost" size="sm" onClick={leaveGame}><ArrowLeft className="mr-2 h-4 w-4" />All games</Button><span className="ml-3 text-sm font-semibold">{game?.shortTitle}</span></div></header>{rounds ? <ChoiceRoundGame round={rounds[roundIndex]} current={roundIndex + 1} total={rounds.length} onChoice={(choice) => handleChoiceRound(rounds, choice)} /> : activeGame === "three_in_common" ? <ThreeInCommonGame selected={commonSelections} onToggle={toggleCommonGround} onSubmit={submitCommonGround} /> : <WouldYouJoinMeGame onChoice={submitPublicPlan} />}</div>;
  }

  return <div className="min-h-screen bg-gradient-to-b from-orange-50 via-background to-background pb-24"><section className="border-b bg-card/80"><div className="container grid max-w-5xl gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:py-12"><div><Button variant="ghost" size="sm" className="-ml-3" onClick={() => navigate("/games-hub")}><ArrowLeft className="mr-2 h-4 w-4" />Games hub</Button><Badge className="mt-4 rounded-full">Community-first connection</Badge><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Play small. Find common ground. Get out there.</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">These short games help Sally understand your local rhythm and create easy, public-event ideas without turning every connection into a big commitment.</p></div><img src={ART_REFERENCE_URL} alt="Warm community game card artwork" className="hidden h-40 w-28 rounded-3xl border bg-muted object-cover shadow-lg sm:block" /></div></section><main className="container max-w-5xl py-7"><div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />Built for the places and people in your community</div><div className="grid gap-4 md:grid-cols-2">{SOCIAL_GAMES.map((game) => <Card key={game.id} className="group overflow-hidden border-border/80 transition-shadow hover:shadow-lg"><CardContent className="p-0"><div className="flex"><div className={cn("w-2 bg-gradient-to-b", game.accent)} /><div className="flex min-w-0 flex-1 flex-col p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{game.emoji}</span><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{game.eyebrow}</p><h2 className="font-display text-xl font-bold">{game.title}</h2></div></div><Badge variant="secondary" className="shrink-0 rounded-full">{game.duration}</Badge></div><p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{game.description}</p><Button className="mt-5 w-full rounded-full" onClick={() => startGame(game.id)}>Play now <ChevronRight className="ml-2 h-4 w-4" /></Button></div></div></CardContent></Card>)}</div><div className="mt-7 flex items-start gap-3 rounded-3xl border border-sky-200 bg-sky-50 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><h2 className="font-semibold text-sky-950">Designed for real life, at your own pace</h2><p className="mt-1 text-sm leading-relaxed text-sky-900">Games help uncover shared interests. If you decide to make a plan, start with a public activity and keep control of your own timing and transportation.</p></div></div><div className="mt-5 flex flex-wrap gap-3"><Button variant="outline" className="rounded-full bg-card" asChild><a href="/events"><CalendarDays className="mr-2 h-4 w-4" />Explore public events</a></Button><Button variant="outline" className="rounded-full bg-card" asChild><a href="/activities"><Compass className="mr-2 h-4 w-4" />Find local activities</a></Button></div></main></div>;
}
