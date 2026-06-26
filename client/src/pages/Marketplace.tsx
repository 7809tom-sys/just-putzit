import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Ticket, Users, CalendarDays, Star, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "bowling", label: "Bowling", emoji: "🎳" },
  { id: "mini_golf", label: "Mini Golf", emoji: "⛳" },
  { id: "kayaking", label: "Kayaking", emoji: "🛶" },
  { id: "movies", label: "Movies", emoji: "🎬" },
  { id: "dining", label: "Dining", emoji: "🍽️" },
  { id: "escape_room", label: "Escape Room", emoji: "🔐" },
  { id: "wine_tasting", label: "Wine", emoji: "🍷" },
  { id: "cooking_class", label: "Cooking", emoji: "👨‍🍳" },
  { id: "arts", label: "Arts", emoji: "🎨" },
];

type Listing = {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  priceCents: number;
  hasTickets: boolean;
  imageEmoji: string;
  maxGroupSize?: number | null;
  recurringSchedule?: string | null;
  venue?: { name: string; city?: string | null; address?: string | null } | null;
};

function dollars(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(0)}`;
}

export default function Marketplace() {
  const { isAuthenticated, loading } = useAuth();
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [scheduledFor, setScheduledFor] = useState("");

  const utils = trpc.useUtils();
  const { data: listings, isLoading } = trpc.marketplace.browse.useQuery(
    { category: category === "all" ? undefined : category },
    { enabled: isAuthenticated }
  );

  const bookMutation = trpc.marketplace.book.useMutation({
    onSuccess: (booking) => {
      toast.success(`Booked! Confirmation ${booking?.confirmationCode ?? ""} 🎟️`);
      setSelected(null);
      utils.marketplace.myBookings.invalidate();
    },
    onError: () => toast.error("Couldn't complete the booking. Try again."),
  });

  const handleBook = () => {
    if (!selected) return;
    bookMutation.mutate({
      activityId: selected.id,
      partySize,
      scheduledFor: scheduledFor || undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Spinner /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-md py-24 text-center">
          <div className="text-5xl mb-4">🎟️</div>
          <h1 className="font-display text-2xl font-bold mb-2">The Activity Marketplace</h1>
          <p className="text-muted-foreground mb-6">
            Book bowling, mini golf, kayaking, dinners and more — in seconds. Sign in to browse.
          </p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="rounded-full">
            Sign in to browse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Activity Marketplace</h1>
            <p className="text-sm text-muted-foreground">
              Real things to do, booked in-app. No fees for you — ever.
            </p>
          </div>
          <Button variant="outline" className="rounded-full gap-2 bg-card" asChild>
            <a href="/bookings"><Ticket className="w-4 h-4" /> My Bookings</a>
          </Button>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                category === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-primary/5"
              }`}
            >
              <span className="mr-1">{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : listings && listings.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(listings as Listing[]).map(l => (
              <Card key={l.id} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="h-32 gradient-sally flex items-center justify-center text-5xl">
                  {l.imageEmoji}
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold leading-tight">{l.title}</h3>
                    <Badge variant={l.priceCents === 0 ? "secondary" : "default"} className="rounded-full shrink-0">
                      {dollars(l.priceCents)}
                    </Badge>
                  </div>
                  {l.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>
                  )}
                  {l.venue && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {l.venue.name}{l.venue.city ? `, ${l.venue.city}` : ""}
                    </p>
                  )}
                  {l.recurringSchedule && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {l.recurringSchedule}
                    </p>
                  )}
                  <Button
                    onClick={() => { setSelected(l); setPartySize(2); setScheduledFor(""); }}
                    className="w-full rounded-full gap-2"
                    size="sm"
                  >
                    {l.hasTickets ? <Ticket className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {l.hasTickets ? "Book tickets" : l.priceCents > 0 ? "Reserve" : "RSVP"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-10 text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-sm text-muted-foreground">
                No activities in this category yet. Check back soon — Sally is signing up local spots!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booking dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selected.imageEmoji}</span> {selected.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {selected.venue && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {selected.venue.name}
                    {selected.venue.address ? ` · ${selected.venue.address}` : ""}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Party size</Label>
                    <Input
                      type="number" min={1} max={selected.maxGroupSize ?? 20}
                      value={partySize} onChange={e => setPartySize(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> When</Label>
                    <Input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{dollars(selected.priceCents)} × {partySize}</span>
                    <span className="font-medium">{dollars(selected.priceCents * partySize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your platform fee</span>
                    <span className="font-medium text-green-600">$0.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t">
                    <span className="font-semibold">You pay the venue</span>
                    <span className="font-display font-bold">{dollars(selected.priceCents * partySize)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Just Putzit is always free — the venue handles payment on arrival.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-full bg-card" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button className="rounded-full gap-2" onClick={handleBook} disabled={bookMutation.isPending}>
                  {bookMutation.isPending ? <Spinner className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm booking
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
