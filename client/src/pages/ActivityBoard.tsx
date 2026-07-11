import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MapPin, Calendar, Users, Search, CheckCircle, Ticket, Star,
  ExternalLink, Heart, Zap, Building2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { MapView } from "@/components/Map";

const LOCAL_CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "bowling", label: "Bowling", emoji: "🎳" },
  { id: "mini_golf", label: "Mini Golf", emoji: "⛳" },
  { id: "movies", label: "Movies", emoji: "🎬" },
  { id: "dining", label: "Dining", emoji: "🍽️" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "escape_room", label: "Escape Room", emoji: "🔐" },
  { id: "hiking", label: "Hiking", emoji: "🥾" },
  { id: "arts", label: "Arts", emoji: "🎨" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "other", label: "Other", emoji: "🌟" },
];

const LIVE_CATEGORIES = [
  { id: "all", label: "All Events", emoji: "✨" },
  { id: "concerts", label: "Concerts", emoji: "🎵" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "arts", label: "Arts & Theatre", emoji: "🎭" },
  { id: "comedy", label: "Comedy", emoji: "😂" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "food", label: "Food & Drink", emoji: "🍻" },
  { id: "community", label: "Community", emoji: "🤝" },
  { id: "other", label: "Other", emoji: "🌟" },
];

type Tab = "live" | "local";

export default function ActivityBoard() {
  const [tab, setTab] = useState<Tab>("live");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveSearchQuery, setLiveSearchQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [dateNightEvent, setDateNightEvent] = useState<{ id: string; title: string; matchId: number } | null>(null);

  const { data: profile } = trpc.profile.get.useQuery();
  const userCity = profile?.city ?? "";

  // ── Local activities ───────────────────────────────────────────────────────
  const { data: sallyRecs, isLoading: recsLoading } = trpc.activityBoard.getSallyRecommendations.useQuery({});
  const { data: activities, refetch: refetchLocal } = trpc.activityBoard.getAll.useQuery({
    city: userCity || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  // ── Live events (Ticketmaster + Eventbrite) ────────────────────────────────
  const { data: liveEvents, isLoading: liveLoading } = trpc.activityBoard.getLiveEvents.useQuery(
    { city: userCity, keyword: liveSearchQuery || undefined },
    { enabled: !!userCity, staleTime: 5 * 60 * 1000 }
  );

  // ── Featured venue listings ────────────────────────────────────────────────
  const { data: featuredVenues } = trpc.activityBoard.getFeaturedVenues.useQuery(
    { city: userCity },
    { enabled: !!userCity }
  );

  // ── My live RSVPs ──────────────────────────────────────────────────────────
  const { data: myLiveRsvps, refetch: refetchRsvps } = trpc.activityBoard.getMyLiveRsvps.useQuery();
  const myRsvpIds = new Set(myLiveRsvps?.map(r => r.externalEventId) ?? []);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const rsvpMutation = trpc.activityBoard.rsvp.useMutation({
    onSuccess: () => { toast.success("You're going! 🎉"); refetchLocal(); },
  });

  const rsvpLiveMutation = trpc.activityBoard.rsvpLiveEvent.useMutation({
    onSuccess: (data, variables) => {
      if (data.alreadyRsvped) {
        toast.info("You already RSVPed to this event.");
      } else {
        toast.success("RSVP saved! 🎉");
        refetchRsvps();
        // Trigger Date Night upsell if mutual match
        if (data.mutualMatch && variables.matchId) {
          setDateNightEvent({
            id: variables.externalEventId,
            title: variables.eventTitle,
            matchId: variables.matchId,
          });
        }
      }
    },
  });

  const purchaseDateNightMutation = trpc.activityBoard.purchaseDateNightPackage.useMutation({
    onSuccess: () => {
      toast.success("Date Night Package reserved! 💕 We'll send you details.");
      setDateNightEvent(null);
    },
  });

  const checkInMutation = trpc.activityBoard.checkIn.useMutation({
    onSuccess: () => toast.success("Checked in! Have an amazing time! ✨"),
  });

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setMapReady(true);
    const service = new google.maps.places.PlacesService(map);
    const center = map.getCenter();
    if (!center) return;
    const types = ["library", "bowling_alley", "movie_theater", "restaurant", "park"];
    types.forEach(type => {
      service.nearbySearch({ location: center, radius: 5000, type }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.slice(0, 3).forEach(place => {
            if (place.geometry?.location) {
              new google.maps.Marker({
                position: place.geometry.location,
                map,
                title: place.name,
                icon: { url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
              });
            }
          });
        }
      });
    });
  }, []);

  // Reset category when switching tabs
  useEffect(() => { setSelectedCategory("all"); }, [tab]);

  const filteredLocal = activities?.filter(a =>
    searchQuery === "" ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const filteredLive = (liveEvents ?? []).filter(e =>
    (selectedCategory === "all" || e.category === selectedCategory)
  );

  const categoryEmoji: Record<string, string> = Object.fromEntries(
    LOCAL_CATEGORIES.map(c => [c.id, c.emoji])
  );

  const apiKeysConfigured = (liveEvents !== undefined) || liveLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Sally's Recommendation Banner */}
      {tab === "local" && (sallyRecs || recsLoading) && (
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-primary/20 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl flex-shrink-0 shadow-md">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-primary mb-1">Sally's Weekend Pick</p>
              <p className="text-gray-700">
                {recsLoading
                  ? "Sally is finding the perfect activities for you..."
                  : sallyRecs?.sallyMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 font-display mb-1">
            What's Happening Near {userCity || "You"}
          </h1>
          <p className="text-gray-500 text-sm">
            Stop putzing around alone — find something amazing to do this weekend.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setTab("live")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "live"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Ticket className="w-4 h-4" />
            Live Events
            <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0 h-4">NEW</Badge>
          </button>
          <button
            onClick={() => setTab("local")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "local"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Local Activities
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {tab === "live" ? (
              <LiveEventsTab
                userCity={userCity}
                liveEvents={filteredLive}
                featuredVenues={featuredVenues ?? []}
                isLoading={liveLoading}
                apiKeysConfigured={apiKeysConfigured}
                myRsvpIds={myRsvpIds}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchQuery={liveSearchQuery}
                setSearchQuery={setLiveSearchQuery}
                onRsvp={(event) => {
                  rsvpLiveMutation.mutate({
                    externalEventId: event.id,
                    eventTitle: event.title,
                    eventDate: event.date ?? undefined,
                    eventCity: event.city,
                  });
                }}
                rsvpPending={rsvpLiveMutation.isPending}
              />
            ) : (
              <LocalActivitiesTab
                activities={filteredLocal}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categoryEmoji={categoryEmoji}
                onRsvp={(id) => rsvpMutation.mutate({ activityId: id })}
                onCheckIn={(id) => checkInMutation.mutate({ activityId: id })}
                rsvpPending={rsvpMutation.isPending}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Map */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Near You
                </h3>
              </div>
              <div className="h-56">
                <MapView onMapReady={handleMapReady} className="w-full h-full" />
              </div>
            </div>

            {/* Featured Venue CTA */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-gray-900 text-sm">Featured Spots</h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Local businesses pay to appear at the top of the Live Events feed. Get your venue featured!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full text-xs border-amber-300 hover:bg-amber-50"
                onClick={() => toast.info("Email us at venues@justputzit.com to get featured — $49/month!")}
              >
                <Building2 className="w-3 h-3 mr-1" />
                Feature Your Venue — $49/mo
              </Button>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">How Just Putzit Works</h3>
              <div className="space-y-2 text-xs text-gray-600">
                {[
                  { emoji: "🤖", text: "Sally learns your interests" },
                  { emoji: "🎯", text: "Matches you with compatible people" },
                  { emoji: "📅", text: "Suggests activities you'll both love" },
                  { emoji: "🎉", text: "You show up and have an amazing time!" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span>{step.emoji}</span>
                    <span>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Night Package Dialog */}
      <Dialog open={!!dateNightEvent} onOpenChange={() => setDateNightEvent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              Date Night Match! 💕
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Your match also RSVPed to <strong>{dateNightEvent?.title}</strong>! This could be your perfect date night.
            </p>
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-rose-700">Date Night Package — $9.99</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Personalized icebreaker conversation starters</li>
                <li>✓ Sally-curated date night itinerary</li>
                <li>✓ Shared event reminder for both of you</li>
                <li>✓ Post-date feedback to improve future matches</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full"
                onClick={() => {
                  if (dateNightEvent) {
                    purchaseDateNightMutation.mutate({
                      matchId: dateNightEvent.matchId,
                      externalEventId: dateNightEvent.id,
                      externalEventTitle: dateNightEvent.title,
                    });
                  }
                }}
                disabled={purchaseDateNightMutation.isPending}
              >
                {purchaseDateNightMutation.isPending ? "Processing..." : "Get Date Night Package 💕"}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => setDateNightEvent(null)}>
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Live Events Tab ──────────────────────────────────────────────────────────
interface LiveEvent {
  id: string;
  source: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  address: string;
  city: string;
  date: string | null;
  imageUrl: string | null;
  ticketUrl: string;
  price: string;
  isFree: boolean;
  isFeatured: boolean;
}

interface FeaturedVenue {
  id: number;
  venueName: string;
  venueType: string;
  city: string;
  description: string | null;
  logoUrl: string | null;
  ctaUrl: string;
  ctaLabel: string;
}

function LiveEventsTab({
  userCity,
  liveEvents,
  featuredVenues,
  isLoading,
  apiKeysConfigured,
  myRsvpIds,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onRsvp,
  rsvpPending,
}: {
  userCity: string;
  liveEvents: LiveEvent[];
  featuredVenues: FeaturedVenue[];
  isLoading: boolean;
  apiKeysConfigured: boolean;
  myRsvpIds: Set<string>;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRsvp: (event: LiveEvent) => void;
  rsvpPending: boolean;
}) {
  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search concerts, sports, comedy..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-11 rounded-xl border-gray-200"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        {LIVE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary/40"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Venue Listings */}
      {featuredVenues.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="font-bold text-gray-800 text-sm">Featured Venues in {userCity}</h3>
            <Badge className="bg-amber-100 text-amber-700 text-xs">Sponsored</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {featuredVenues.map(venue => (
              <a
                key={venue.id}
                href={venue.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200 hover:shadow-md transition-shadow"
              >
                {venue.logoUrl ? (
                  <img src={venue.logoUrl} alt={venue.venueName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{venue.venueName}</p>
                  <p className="text-xs text-gray-500 truncate">{venue.description ?? venue.venueType}</p>
                  <span className="text-xs text-amber-700 font-medium">{venue.ctaLabel} →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Events List */}
      {!userCity ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-3">📍</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Set Your City First</h3>
          <p className="text-gray-500 text-sm">Verify your location in your profile to see live events near you.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : liveEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-3">🎟️</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Live Events Coming Soon!</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            {apiKeysConfigured
              ? `No events found in ${userCity} right now. Try a different category or check back soon.`
              : "Ticketmaster & Eventbrite integration is being set up. Check back Monday!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {liveEvents.map(event => (
            <LiveEventCard
              key={event.id}
              event={event}
              isRsvped={myRsvpIds.has(event.id)}
              onRsvp={() => onRsvp(event)}
              rsvpPending={rsvpPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveEventCard({
  event,
  isRsvped,
  onRsvp,
  rsvpPending,
}: {
  event: LiveEvent;
  isRsvped: boolean;
  onRsvp: () => void;
  rsvpPending: boolean;
}) {
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const sourceLabel = event.source === "ticketmaster" ? "Ticketmaster" : "Eventbrite";
  const sourceBadgeColor = event.source === "ticketmaster"
    ? "bg-blue-100 text-blue-700"
    : "bg-orange-100 text-orange-700";

  return (
    <Card className="border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Event Image */}
          {event.imageUrl && (
            <div className="w-28 sm:w-36 flex-shrink-0">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                style={{ minHeight: "120px" }}
              />
            </div>
          )}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={`text-xs px-1.5 py-0 ${sourceBadgeColor}`}>{sourceLabel}</Badge>
                  {event.isFree && (
                    <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0">Free</Badge>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                  {event.title}
                </h3>
                <div className="space-y-0.5 text-xs text-gray-500">
                  {formattedDate && (
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formattedDate}
                    </p>
                  )}
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.venue}{event.city && event.city !== event.venue ? ` · ${event.city}` : ""}
                  </p>
                  <p className="font-semibold text-gray-700">{event.price}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className={`rounded-full text-xs h-7 px-3 ${
                  isRsvped
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
                onClick={onRsvp}
                disabled={rsvpPending || isRsvped}
              >
                {isRsvped ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Going!</>
                ) : (
                  "I'm Going! 🙋"
                )}
              </Button>
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <Ticket className="w-3 h-3" />
                Get Tickets
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Local Activities Tab ─────────────────────────────────────────────────────
function LocalActivitiesTab({
  activities,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categoryEmoji,
  onRsvp,
  onCheckIn,
  rsvpPending,
}: {
  activities: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  categoryEmoji: Record<string, string>;
  onRsvp: (id: number) => void;
  onCheckIn: (id: number) => void;
  rsvpPending: boolean;
}) {
  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search activities, venues..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-11 rounded-xl border-gray-200"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        {LOCAL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary/40"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sally Is Scouting Your Area!</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
            No activities have been added to your area yet. Check back soon — Just Putzit is growing fast!
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-sm text-gray-600">
            {[
              { emoji: "🎳", text: "Bowling nights" },
              { emoji: "⛳", text: "Mini golf outings" },
              { emoji: "🛶", text: "Kayaking trips" },
              { emoji: "📚", text: "Book club meetups" },
              { emoji: "🎬", text: "Movie nights" },
              { emoji: "☕", text: "Coffee socials" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity: any) => (
            <Card key={activity.id} className="border border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{categoryEmoji[activity.category] ?? "✨"}</span>
                      <h3 className="font-bold text-gray-900 text-lg">{activity.title}</h3>
                    </div>
                    {activity.description && (
                      <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {activity.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(activity.eventDate).toLocaleDateString("en-US", {
                            weekday: "long", month: "short", day: "numeric",
                            hour: "numeric", minute: "2-digit",
                          })}
                        </span>
                      )}
                      {activity.maxGroupSize && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Up to {activity.maxGroupSize} people
                        </span>
                      )}
                      {activity.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          🔄 {activity.recurringSchedule ?? "Recurring"}
                        </Badge>
                      )}
                    </div>
                    {activity.venueName && (
                      <p className="text-sm font-medium text-primary mt-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {activity.venueName}
                        {activity.venueCity && (
                          <span className="text-muted-foreground font-normal">· {activity.venueCity}</span>
                        )}
                      </p>
                    )}
                    {(activity.priceCents ?? 0) > 0 ? (
                      <p className="text-xs text-gray-500 mt-1">${((activity.priceCents ?? 0) / 100).toFixed(2)} per person</p>
                    ) : (
                      <p className="text-xs text-green-600 mt-1 font-medium">Free</p>
                    )}
                    {activity.totalReferrals > 0 && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {activity.totalReferrals} Just Putzit members have been here!
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white rounded-full"
                      onClick={() => onRsvp(activity.id)}
                      disabled={rsvpPending}
                    >
                      I'm Going! 🙋
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      onClick={() => onCheckIn(activity.id)}
                    >
                      Check In
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
