import { useMemo, useState, type ReactNode } from "react";
import { CalendarHeart, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EventProposalDialogProps = {
  matchId: number;
  matchName: string;
  city?: string | null;
  trigger: ReactNode;
  onSent?: () => void;
};

function formatEventDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function EventProposalDialog({ matchId, matchName, city, trigger, onSent }: EventProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [note, setNote] = useState("");
  const eventQueryInput = useMemo(() => ({ city: city || undefined, limit: 24 }), [city]);
  const { data: events, isLoading } = trpc.events.list.useQuery(eventQueryInput, { enabled: open });
  const upcomingEvents = useMemo(() => (events ?? []).filter((event) => new Date(event.eventDate).getTime() >= Date.now()), [events]);
  const sendProposal = trpc.eventProposals.create.useMutation({
    onSuccess: (result) => {
      toast.success(`Invitation sent to ${matchName}`, { description: `They can safely accept or decline ${result.event.title} in your chat.` });
      setOpen(false);
      setEventId("");
      setNote("");
      onSent?.();
    },
    onError: (error) => toast.error("Couldn’t send invitation", { description: error.message }),
  });
  const selectedEvent = upcomingEvents.find((event) => String(event.id) === eventId);

  const submit = () => {
    if (!eventId) {
      toast.error("Choose a public event first");
      return;
    }
    sendProposal.mutate({ matchId, eventId: Number(eventId), note: note.trim() || undefined });
  };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden">
      <div className="bg-gradient-to-br from-orange-50 via-white to-teal-50 p-6">
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white"><CalendarHeart className="h-5 w-5" /></div>
          <DialogTitle className="font-display text-2xl">Want to go together?</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-relaxed">Invite {matchName} to a public local event. They can accept or decline privately—there’s no pressure and no contact information is shared.</DialogDescription>
        </DialogHeader>
      </div>
      <div className="space-y-5 px-6 pb-6">
        <div className="space-y-2">
          <Label htmlFor={`proposal-event-${matchId}`}>Choose a public event</Label>
          {isLoading ? <div className="flex h-10 items-center gap-2 rounded-xl border bg-muted/50 px-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Finding upcoming events…</div> : upcomingEvents.length > 0 ? <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger id={`proposal-event-${matchId}`} className="h-auto min-h-11 rounded-xl bg-white text-left"><SelectValue placeholder="Select an upcoming event" /></SelectTrigger>
            <SelectContent>
              {upcomingEvents.map((event) => <SelectItem key={event.id} value={String(event.id)}>{event.title} · {formatEventDate(event.eventDate)}</SelectItem>)}
            </SelectContent>
          </Select> : <p className="rounded-xl border border-dashed bg-muted/30 px-3 py-3 text-sm text-muted-foreground">There are no upcoming public events in this area yet. Check the Events page after the next refresh.</p>}
          {selectedEvent && <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{formatEventDate(selectedEvent.eventDate)}{selectedEvent.venueName ? ` · ${selectedEvent.venueName}` : ""}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`proposal-note-${matchId}`}>Add a note <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea id={`proposal-note-${matchId}`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Example: I saw this and thought it could be fun to check out together." className="resize-none rounded-xl bg-white" />
        </div>
        <div className="flex items-start gap-2 rounded-2xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />Keep plans public and on your own terms. An accepted invitation simply marks the event as “going” for both members; you choose whether to add it to your calendar.</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Not now</Button>
          <Button type="button" className="gradient-sally rounded-xl text-white" disabled={!eventId || sendProposal.isPending} onClick={submit}>{sendProposal.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <><CalendarHeart className="mr-2 h-4 w-4" />Send invitation</>}</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
