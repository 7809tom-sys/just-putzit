import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { CalendarPlus, CheckCircle2, ExternalLink, MapPin, Sparkles, Ticket } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PickAPlan() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();
  const numericMatchId = Number(matchId);
  const [roundId, setRoundId] = useState<number | null>(() => {
    const value = new URLSearchParams(window.location.search).get("round");
    const parsed = value ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.pickPlan.get.useQuery({ roundId: roundId ?? 0 }, { enabled: !!roundId, retry: false });
  const startRound = trpc.pickPlan.start.useMutation({
    onSuccess: ({ roundId: createdRoundId }) => {
      setRoundId(createdRoundId);
      navigate(`/pick-a-plan/${numericMatchId}?round=${createdRoundId}`);
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const vote = trpc.pickPlan.vote.useMutation({
    onSuccess: async () => {
      await utils.pickPlan.get.invalidate({ roundId: roundId ?? 0 });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (!Number.isInteger(numericMatchId) || numericMatchId < 1) {
    return <div className="container py-12"><Card className="p-6 text-center"><p className="font-semibold">This plan link is not valid.</p><Button className="mt-4" onClick={() => navigate("/matches")}>Back to matches</Button></Card></div>;
  }

  if (!roundId) {
    return (
      <div className="min-h-screen gradient-warm py-10">
        <div className="container max-w-2xl">
          <Card className="overflow-hidden border-amber-100 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">🗓️</div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-amber-700">Matched-member game</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-gray-900">Pick a Plan</h1>
            <p className="mx-auto mt-3 max-w-lg text-gray-600">Sally will offer current public events near your match. Each of you chooses privately. The event is revealed only if you both pick the same one.</p>
            <div className="mx-auto mt-5 max-w-md rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-950"><span className="font-semibold">Your control matters:</span> no RSVP, booking, or message is created automatically. A shared pick only opens your optional next steps.</div>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={() => navigate(`/games/${numericMatchId}`)}>Back to games</Button><Button onClick={() => startRound.mutate({ matchId: numericMatchId })} disabled={startRound.isPending} className="gap-2 bg-amber-600 hover:bg-amber-700"><Sparkles size={16} />{startRound.isPending ? "Finding plans…" : "Show us three plans"}</Button></div>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="container py-12"><Card className="p-6 text-center text-gray-600">Loading your private plan choices…</Card></div>;
  if (error || !data) return <div className="container py-12"><Card className="p-6 text-center"><p className="font-semibold">We could not open this plan round.</p><p className="mt-2 text-sm text-gray-600">{error?.message ?? "Try returning to the matched games screen."}</p><Button className="mt-4" onClick={() => navigate(`/games/${numericMatchId}`)}>Back to games</Button></Card></div>;

  const { round, candidates } = data as any;
  const hasMatched = round.status === "matched" && round.matchedEvent;
  const addMatchedEventToTrip = () => {
    const event = round.matchedEvent;
    const params = new URLSearchParams({
      title: event.title,
      time: event.eventDate ? new Date(event.eventDate).toISOString() : "",
      location: [event.venueName, event.address, event.city].filter(Boolean).join(" · "),
      notes: event.description ?? "",
      type: "event",
    });
    navigate(`/trip-planner?${params.toString()}`);
  };

  return (
    <div className="min-h-screen gradient-warm py-8">
      <div className="container max-w-4xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">Private matched-member vote</p><h1 className="mt-1 font-display text-3xl font-bold text-gray-900">Pick a Plan</h1><p className="mt-1 text-sm text-gray-600">Choose the activity that feels right. Your selection stays private unless you both choose the same event.</p></div><Button variant="outline" onClick={() => navigate(`/games/${numericMatchId}`)}>Back to games</Button></div>

        {hasMatched ? (
          <Card className="border-emerald-200 bg-emerald-50 p-6"><div className="flex items-start gap-4"><CheckCircle2 className="mt-1 h-8 w-8 shrink-0 text-emerald-600" /><div className="min-w-0"><p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">You both picked this plan</p><h2 className="mt-1 font-display text-2xl font-bold text-gray-900">{round.matchedEvent.title}</h2><p className="mt-2 text-sm text-gray-700">{round.matchedEvent.eventDate ? new Date(round.matchedEvent.eventDate).toLocaleString([], { dateStyle: "full", timeStyle: "short" }) : "Date to be confirmed"}</p>{(round.matchedEvent.venueName || round.matchedEvent.city) && <p className="mt-1 flex items-center gap-1 text-sm text-gray-700"><MapPin size={14} />{[round.matchedEvent.venueName, round.matchedEvent.city].filter(Boolean).join(" · ")}</p>}<div className="mt-5 flex flex-wrap gap-2"><Button onClick={addMatchedEventToTrip} className="gap-2"><CalendarPlus size={16} />Add to a trip</Button>{round.matchedEvent.externalUrl && <Button asChild variant="outline" className="gap-2"><a href={round.matchedEvent.externalUrl} target="_blank" rel="noopener noreferrer"><Ticket size={16} />Official details / book <ExternalLink size={14} /></a></Button>}<Button variant="outline" onClick={() => navigate(`/chat/${numericMatchId}`)}>Open match chat</Button></div></div></div></Card>
        ) : (
          <>
            <Card className="mb-5 border-blue-100 bg-blue-50 p-4"><p className="text-sm text-blue-950">{round.myVoteEventId ? round.partnerSubmitted ? "Your match has also voted. We will reveal only if you selected the same event." : "Your choice is saved privately. Waiting for your match to choose." : "Pick the one event you would genuinely like to attend. Your match cannot see your choice."}</p></Card>
            <div className="grid gap-4 md:grid-cols-3">{candidates.map((event: any) => {
              const selected = round.myVoteEventId === event.id;
              return (
                <Card key={event.id} className={`p-5 ${selected ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2"><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{event.category}</Badge>{event.isFree && <span className="text-xs font-semibold text-emerald-700">Free</span>}</div>
                  <h2 className="mt-4 font-display text-xl font-bold text-gray-900">{event.title}</h2>
                  <p className="mt-2 text-sm text-gray-600">{event.eventDate ? new Date(event.eventDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Date to be confirmed"}</p>
                  {(event.venueName || event.city) && <p className="mt-1 text-sm text-gray-600">{[event.venueName, event.city].filter(Boolean).join(" · ")}</p>}
                  {event.description && <p className="mt-3 line-clamp-3 text-sm text-gray-600">{event.description}</p>}
                  <Button className="mt-5 w-full" variant={selected ? "outline" : "default"} onClick={() => vote.mutate({ roundId, eventId: event.id })} disabled={vote.isPending}>{selected ? "Change private choice" : "Choose privately"}</Button>
                </Card>
              );
            })}</div>
          </>
        )}
      </div>
    </div>
  );
}
