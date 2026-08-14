import { useState } from "react";
import { CalendarHeart, Loader2, MapPin, ShieldCheck, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MatchChoice = { id: number; otherUserId: number; otherProfile?: { displayName?: string | null } | null };

type TodayPlanInviteDialogProps = {
  eventId: number;
  eventTitle: string;
  eventDate?: Date | string | null;
  venueName?: string | null;
  matches: MatchChoice[];
};

export function TodayPlanInviteDialog({ eventId, eventTitle, eventDate, venueName, matches }: TodayPlanInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [note, setNote] = useState("");
  const sendProposal = trpc.eventProposals.create.useMutation({
    onSuccess: (result) => {
      const match = matches.find((item) => String(item.id) === matchId);
      toast.success(`Invitation sent to ${match?.otherProfile?.displayName || "your match"}`, { description: `They can privately accept or decline ${result.event.title} in chat.` });
      setOpen(false);
      setMatchId("");
      setNote("");
    },
    onError: (error) => toast.error("Couldn’t send invitation", { description: error.message }),
  });
  const dateLabel = eventDate ? new Date(eventDate).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" size="sm" variant="outline" className="rounded-full border-orange-200 bg-white text-orange-800 hover:bg-orange-50"><UserRoundPlus className="mr-1.5 h-3.5 w-3.5" />Invite a match</Button></DialogTrigger>
    <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0">
      <div className="bg-gradient-to-br from-orange-50 via-white to-teal-50 p-6"><DialogHeader><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white"><CalendarHeart className="h-5 w-5" /></div><DialogTitle className="font-display text-2xl">Invite a match to your plan</DialogTitle><DialogDescription className="pt-1 leading-relaxed">Choose someone you already match with. They can accept or decline privately, and the plan stays centered on this public event.</DialogDescription></DialogHeader></div>
      <div className="space-y-5 px-6 pb-6">
        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4"><p className="font-semibold text-foreground">{eventTitle}</p>{(dateLabel || venueName) && <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{[dateLabel, venueName].filter(Boolean).join(" · ")}</p>}</div>
        <div className="space-y-2"><Label htmlFor={`today-plan-match-${eventId}`}>Choose a match</Label><select id={`today-plan-match-${eventId}`} value={matchId} onChange={(event) => setMatchId(event.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Select a match</option>{matches.map((match) => <option key={match.id} value={String(match.id)}>{match.otherProfile?.displayName || "Your match"}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor={`today-plan-note-${eventId}`}>Add a note <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id={`today-plan-note-${eventId}`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Example: I saved this for today and thought you might enjoy it too." className="resize-none rounded-xl bg-white" /></div>
        <div className="flex items-start gap-2 rounded-2xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />Plans start in public places. A yes marks this event as going for both of you; it never shares personal contact information.</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Not now</Button><Button type="button" className="gradient-sally rounded-xl text-white" disabled={!matchId || sendProposal.isPending} onClick={() => sendProposal.mutate({ matchId: Number(matchId), eventId, note: note.trim() || undefined })}>{sendProposal.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <><CalendarHeart className="mr-2 h-4 w-4" />Send invitation</>}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
