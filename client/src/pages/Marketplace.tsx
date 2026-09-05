import { useEffect, useMemo, useState } from "react";
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
import { MapPin, Ticket, Users, CalendarDays, Star, CheckCircle2, RefreshCw, Compass, Search, X } from "lucide-react";
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

const INITIAL_VISIBLE_RESULTS = 12;

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
  isSponsored?: boolean;
  venue?: { name: string; city?: string | null; address?: string | null } | null;
};

function dollars(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(0)}`;
}

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const [category, setCategory] = useState("all");
  const [browseAllLocations, setBrowseAllLocations] = useState(false);
  const [visitorCityDraft, setVisitorCityDraft] = useState("");
  const [visitorCity, setVisitorCity] = useState<string | undefined>();
  const [selected, setSelected] = useState<Listing | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [scheduledFor, setScheduledFor] = useState("");
  const [visibleResults, setVisibleResults] = useState(INITIAL_VISIBLE_RESULTS);

  const utils = trpc.useUtils();
  const memberCity = profile?.city?.trim() || undefined;
  const activeCity = isAuthenticated
    ? (browseAllLocations ? undefined : memberCity)
    : visitorCity;
  const marketplaceInput = useMemo(() => ({
    category: category === "all" ? undefined : category,
    city: activeCity,
  }), [activeCity, category]);
  const marketplaceLocationInput = useMemo(() => ({
    city: activeCity,
  }), [activeCity]);
  const { data: listings, isLoading, isError, refetch } = trpc.marketplace.browse.useQuery(
    marketplaceInput,
    { enabled: true }
  );
  const { data: categoryCounts } = trpc.marketplace.categoryCounts.useQuery(marketplaceLocationInput);
  const availableCategories = CATEGORIES.filter((item) => item.id === "all" || (categoryCounts?.[item.id] ?? 0) > 0);
  const totalAvailable = Object.values(categoryCounts ?? {}).reduce((total, count) => total + Number(count), 0);
  const locationLabel = activeCity ?? null;

  useEffect(() => {
    if (category !== "all" && categoryCounts && (categoryCounts[category] ?? 0) === 0) {
      setCategory("all");
    }
  }, [category, categoryCounts]);

  useEffect(() => {
    setVisibleResults(INITIAL_VISIBLE_RESULTS);
  }, [activeCity, category]);

  const orderedListings = useMemo(
    () => [
      ...(listings as Listing[] | undefined ?? []).filter((listing) => listing.isSponsored),
      ...(listings as Listing[] | undefined ?? []).filter((listing) => !listing.isSponsored),
    ],
    [listings],
  );
  const visibleListings = orderedListings.slice(0, visibleResults);
  const remainingListings = Math.max(orderedListings.length - visibleListings.length, 0);

  const bookMutation = trpc.marketplace.book.useMutation({
    onSuccess: (booking) => {
      toast.success(`Booked! Confirmation ${booking?.confirmationCode ?? ""} 🎟️`);
      setSelected(null);
      utils.marketplace.myBookings.invalidate();
    },
    onError: () => toast.error("Couldn't complete the booking. Try again."),
  });

  const checkoutMutation = trpc.marketplace.createCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      toast.success("Opening secure card checkout", {
        description: "Complete payment safely in the Stripe checkout window.",
      });
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      setSelected(null);
    },
    onError: (error) => toast.error(error.message || "Unable to start secure checkout. Please try again."),
  });

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get("payment");
    if (!paymentStatus) return;
    if (paymentStatus === "cancelled") {
      toast.info("Checkout cancelled", { description: "No card was charged. You can try again whenever you’re ready." });
    }
    window.history.replaceState({}, "", "/marketplace");
  }, [utils.marketplace.myBookings]);

  const handleBook = () => {
    if (!selected) return;
    if (!isAuthenticated) {
      toast.info("Join free to book this local activity.");
      window.location.href = getLoginUrl();
      return;
    }
    if (selected.priceCents > 0) {
      checkoutMutation.mutate({
        activityId: selected.id,
        partySize,
        scheduledFor: scheduledFor || undefined,
      });
      return;
    }
    bookMutation.mutate({
      activityId: selected.id,
      partySize,
      scheduledFor: scheduledFor || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Activity Marketplace</h1>
            <p className="text-sm text-muted-foreground">
              {locationLabel ? `Showing bookable activities in ${locationLabel}.` : "Browse current local options."} Membership is free; sign in only when you are ready to book. {totalAvailable > 0 ? `${totalAvailable} activities available.` : ""}
            </p>
            {isAuthenticated && locationLabel && <button type="button" onClick={() => setBrowseAllLocations(true)} className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline">Browse all locations instead</button>}
            {isAuthenticated && !locationLabel && memberCity && <button type="button" onClick={() => setBrowseAllLocations(false)} className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline">Use saved {memberCity} location</button>}
          </div>
          <Button variant="outline" className="rounded-full gap-2 bg-card" asChild>
            <a href="/bookings"><Ticket className="w-4 h-4" /> My Bookings</a>
          </Button>
        </div>

        {!isAuthenticated && (
          <form
            className="mb-5 flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              const nextCity = visitorCityDraft.trim();
              setVisitorCity(nextCity || undefined);
              setCategory("all");
            }}
          >
            <div className="min-w-0 flex-1">
              <Label htmlFor="marketplace-city" className="text-xs font-semibold">Search active activities by city</Label>
              <Input id="marketplace-city" value={visitorCityDraft} onChange={(event) => setVisitorCityDraft(event.target.value)} placeholder="City, for example Milwaukee" className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-full gap-2"><Search className="h-4 w-4" /> Show this city</Button>
              {visitorCity && <Button type="button" variant="outline" className="rounded-full bg-card gap-2" onClick={() => { setVisitorCity(undefined); setVisitorCityDraft(""); setCategory("all"); }}><X className="h-4 w-4" /> All locations</Button>}
            </div>
          </form>
        )}

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {availableCategories.map(c => (
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
        ) : isError ? (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800"><RefreshCw className="h-5 w-5" /></div>
              <h2 className="font-display text-lg font-bold text-foreground">We couldn’t load Marketplace activities</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Your saved category has been kept. Please retry to see the current bookable activities.</p>
              <Button className="mt-5 rounded-full gap-2" onClick={() => void refetch()}><RefreshCw className="h-4 w-4" /> Try again</Button>
            </CardContent>
          </Card>
        ) : listings && listings.length > 0 ? (
          <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleListings.map(l => (
              <Card key={l.id} className={`overflow-hidden group transition-shadow ${
                l.isSponsored
                  ? "border border-amber-500/40 shadow-md hover:shadow-amber-500/20 ring-1 ring-amber-500/20"
                  : "border-none shadow-md hover:shadow-lg"
              }`}>
                <div className={`h-32 flex items-center justify-center text-5xl relative ${
                  l.isSponsored ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/10" : "gradient-sally"
                }`}>
                  {l.imageEmoji}
                  {l.isSponsored && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/80 text-white">
                      <Star className="w-3 h-3 fill-white" />
                      Featured
                    </span>
                  )}
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
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.info("Join free to book this local activity.");
                        window.location.href = getLoginUrl();
                        return;
                      }
                      setSelected(l);
                      setPartySize(2);
                      setScheduledFor("");
                    }}
                    className="w-full rounded-full gap-2"
                    size="sm"
                  >
                    {l.hasTickets ? <Ticket className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isAuthenticated ? (l.hasTickets ? "Book tickets" : l.priceCents > 0 ? "Reserve" : "RSVP") : "Join free to book"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {remainingListings > 0 && (
            <div className="mt-7 flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">Showing {visibleListings.length} of {orderedListings.length} available activities</p>
              <Button variant="outline" className="rounded-full bg-card" onClick={() => setVisibleResults((current) => current + INITIAL_VISIBLE_RESULTS)}>
                Show {Math.min(INITIAL_VISIBLE_RESULTS, remainingListings)} more activities
              </Button>
            </div>
          )}
          </>
        ) : (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Compass className="h-5 w-5" /></div>
              <h2 className="font-display text-lg font-bold text-foreground">No bookable activities in {locationLabel ? `${locationLabel} for ` : ""}{category === "all" ? "this Marketplace view" : `this ${category.replaceAll("_", " ")} category`} yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Try every available Marketplace category, expand your location search, or explore nearby public activities and current events while new partners are added.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {category !== "all" && <Button variant="outline" className="rounded-full bg-card" onClick={() => setCategory("all")}>Browse all available</Button>}
                {locationLabel && <Button variant="outline" className="rounded-full bg-card" onClick={() => setBrowseAllLocations(true)}>Browse all locations</Button>}
                <Button className="rounded-full" asChild><a href="/activities">Explore nearby activities</a></Button>
              </div>
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
                    <span className="font-semibold">{selected.priceCents > 0 ? "Pay securely by card" : "You pay the venue"}</span>
                    <span className="font-display font-bold">{dollars(selected.priceCents * partySize)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
                    <Star className="w-3 h-3" /> {selected.priceCents > 0
                      ? "Secure card payments are processed by Stripe. Just Putzit never stores card details."
                      : "Just Putzit is always free — no card is required for this RSVP."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-full bg-card" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button className="rounded-full gap-2" onClick={handleBook} disabled={bookMutation.isPending || checkoutMutation.isPending}>
                  {bookMutation.isPending || checkoutMutation.isPending ? <Spinner className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {selected.priceCents > 0 ? "Continue to secure checkout" : "Confirm RSVP"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
