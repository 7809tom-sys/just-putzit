import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";
import { FINISH_SENTENCE_PROMPTS, normalizeFinishSentenceAnswer } from "@shared/finishSentence";

export default function FinishSentence() {
  useSEO({ title: "Finish My Sentence — Just Putzit", description: "A quick solo game that helps Sally learn what makes you, you." });
  const [, navigate] = useLocation();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const current = FINISH_SENTENCE_PROMPTS[index];
  const recordAnswer = trpc.games.recordGameAnswer.useMutation();
  const answer = normalizeFinishSentenceAnswer(draft);

  const submit = () => {
    if (!current || !answer || recordAnswer.isPending) return;
    recordAnswer.mutate({ gameType: "finish_sentence", questionId: current.id, answer, traitKey: current.traitKey, traitValue: answer }, {
      onSuccess: () => {
        const nextAnswers = [...answers, answer];
        setAnswers(nextAnswers);
        setDraft("");
        if (index + 1 >= FINISH_SENTENCE_PROMPTS.length) setComplete(true);
        else setIndex((value) => value + 1);
      },
    });
  };

  if (complete) return <div className="min-h-screen bg-gradient-to-b from-orange-50 via-background to-background"><main className="mx-auto max-w-xl px-4 py-10 sm:py-16"><Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-xl"><CardContent className="p-7 text-center sm:p-10"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground"><CheckCircle2 className="h-8 w-8" /></div><Badge className="mt-5 rounded-full">Saved to your profile</Badge><h1 className="mt-4 font-display text-3xl font-bold tracking-tight">That sounds like you.</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sally saved these answers as conversation context. You decide what to share and when.</p><div className="mt-6 space-y-2 text-left">{answers.map((item, answerIndex) => <div key={`${answerIndex}-${item}`} className="rounded-2xl border bg-card p-3 text-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{FINISH_SENTENCE_PROMPTS[answerIndex]?.prompt}</p><p className="mt-1 font-medium text-foreground">{item}</p></div>)}</div><div className="mt-7 grid gap-3 sm:grid-cols-2"><Button className="rounded-full" onClick={() => { setIndex(0); setDraft(""); setAnswers([]); setComplete(false); }}>Play again <Sparkles className="ml-2 h-4 w-4" /></Button><Button variant="outline" className="rounded-full" onClick={() => navigate("/game-lobby")}>Back to games</Button></div></CardContent></Card></main></div>;

  return <div className="min-h-screen bg-gradient-to-b from-orange-50 via-background to-background"><main className="mx-auto max-w-xl px-4 py-8 sm:py-12"><Button variant="ghost" size="sm" className="-ml-3" onClick={() => navigate("/game-lobby")}><ArrowLeft className="mr-2 h-4 w-4" />Game lobby</Button><div className="mt-6"><Badge className="rounded-full">Solo reflection game</Badge><h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Finish My Sentence</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">There are no right answers. Complete each thought in your own words; Sally uses them only to make future conversations and local ideas feel more like you.</p></div><div className="mt-7"><div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground"><span>Prompt {index + 1} of {FINISH_SENTENCE_PROMPTS.length}</span><span>{Math.round(((index + 1) / FINISH_SENTENCE_PROMPTS.length) * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${((index + 1) / FINISH_SENTENCE_PROMPTS.length) * 100}%` }} /></div></div><Card className="mt-6 border-primary/15 bg-card shadow-xl shadow-primary/5"><CardContent className="p-6 sm:p-8"><div className="flex items-start gap-3"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><PenLine className="h-6 w-6" /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Your turn</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight">{current.prompt}</h2></div></div><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={240} placeholder="Write whatever comes naturally…" className="mt-7 min-h-32 resize-none rounded-2xl text-base" autoFocus /><div className="mt-2 flex justify-end text-xs text-muted-foreground">{draft.length}/240</div><Button className="mt-6 w-full rounded-full" disabled={!answer || recordAnswer.isPending} onClick={submit}>{recordAnswer.isPending ? "Saving your answer…" : index + 1 === FINISH_SENTENCE_PROMPTS.length ? "See my answers" : "Next prompt"}<Sparkles className="ml-2 h-4 w-4" /></Button></CardContent></Card></main></div>;
}
