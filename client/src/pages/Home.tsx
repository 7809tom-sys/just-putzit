import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, MapPin, Users, Sparkles, Shield, MessageCircle, ChevronRight, Star, Smartphone, Share2, MoreVertical, Plus, Megaphone, GripVertical, Settings2, X, Radio, RotateCcw, Calendar, CalendarPlus, Navigation, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useRef, useCallback } from "react";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";
import { WaukeshaLibrarySpotlight } from "@/components/WaukeshaLibrarySpotlight";
import { LocationOverrideControl } from "@/components/LocationOverrideControl";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";
import { useUserCity } from "@/hooks/useUserCity";
import { toggleHomepageSection } from "@shared/homepageLayout";
import { filterHomepageDiscovery, type HomepageDiscoveryDateRange, type HomepageDiscoverySort } from "@shared/homepageDiscovery";
import { formatMilesAway, haversineDistanceMiles } from "@shared/geo";
import { buildTodayPlanSelection } from "@shared/todaysPlan";
import { TodayPlanInviteDialog } from "@/components/TodayPlanInviteDialog";

// ─── Module definitions ───────────────────────────────────────────────────────

interface ModuleDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  defaultPinned: boolean;
  defaultPosition: number;
}

const ALL_MODULES: ModuleDef[] = [
  { id: "sally",      label: "Chat with Sally",    emoji: "🤖", description: "Your AI connection guide",         defaultPinned: true,  defaultPosition: 0 },
  { id: "matches",    label: "My Matches",          emoji: "💕", description: "See your connections",            defaultPinned: true,  defaultPosition: 1 },
  { id: "activities", label: "Local Activities",    emoji: "🗺️", description: "Discover nearby events",         defaultPinned: true,  defaultPosition: 2 },
  { id: "sports",     label: "Sports & Live Scores",emoji: "🏟️", description: "Game Day Chat & live scores",    defaultPinned: true,  defaultPosition: 3 },
  { id: "games",      label: "Games Hub",           emoji: "🎮", description: "Trivia, Jeopardy & more",        defaultPinned: true,  defaultPosition: 4 },
  { id: "community",  label: "Community",           emoji: "👥", description: "Groups & local events",          defaultPinned: false, defaultPosition: 5 },
  { id: "concierge",  label: "Concierge",           emoji: "🎩", description: "AI-planned date nights",         defaultPinned: false, defaultPosition: 6 },
  { id: "marketplace",label: "Marketplace",         emoji: "🛍️", description: "Local deals & services",        defaultPinned: false, defaultPosition: 7 },
  { id: "family",     label: "Family Connect",      emoji: "👨‍👩‍👧", description: "Meet families nearby",         defaultPinned: false, defaultPosition: 8 },
  { id: "trip",       label: "Trip Planner",        emoji: "✈️", description: "Plan adventures together",       defaultPinned: false, defaultPosition: 9 },
  { id: "shoutout",   label: "Shout Out",           emoji: "📣", description: "Refer friends & earn rewards",   defaultPinned: true,  defaultPosition: 10 },
  { id: "localevents",label: "Local Events",         emoji: "🏙️", description: "Museum, library & community events", defaultPinned: false, defaultPosition: 11 },
  { id: "gymbuddy",   label: "Gym Buddy",           emoji: "🏋️", description: "Find a workout partner or build your own plan", defaultPinned: false, defaultPosition: 12 },
];

interface ActiveModule {
  moduleId: string;
  position: number;
  pinned: boolean;
}

function buildLayout(savedModules: ActiveModule[]): ActiveModule[] {
  if (savedModules.length === 0) {
    return ALL_MODULES.map(m => ({ moduleId: m.id, position: m.defaultPosition, pinned: m.defaultPinned }));
  }
  // Merge saved with defaults for any new modules not yet in DB
  const savedIds = new Set(savedModules.map(m => m.moduleId));
  const missing = ALL_MODULES.filter(m => !savedIds.has(m.id)).map(m => ({
    moduleId: m.id,
    position: m.defaultPosition + 100, // put new modules at the end
    pinned: false,
  }));
  return [...savedModules, ...missing].sort((a, b) => a.position - b.position);
}

// ─── Module card renderers ────────────────────────────────────────────────────

function SallyModule({ profile, navigate }: { profile: any; navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full gradient-sally flex items-center justify-center text-2xl flex-shrink-0 animate-pulse-ring">🤖</div>
      <div className="flex-1">
        <p className="font-bold text-foreground mb-1">Sally says hi! 👋</p>
        <p className="text-muted-foreground text-sm mb-3">
          {profile?.interviewCount === 0
            ? "I can't wait to get to know you! Let's start with a quick 90-second chat."
            : "Great to see you again! I have new questions to refine your profile."}
        </p>
        <Button size="sm" className="gradient-sally text-white border-0 rounded-full gap-2 btn-scale" onClick={() => navigate("/interview")}>
          <MessageCircle className="w-4 h-4" /> Chat with Sally
        </Button>
      </div>
    </div>
  );
}

function MatchesModule({ matches, navigate }: { matches: any[]; navigate: (p: string) => void }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-xl">My Matches</h2>
        </div>
        <p className="text-muted-foreground text-sm">No matches yet — keep chatting with Sally to improve your profile!</p>
        <Button size="sm" variant="outline" className="mt-3 rounded-full" onClick={() => navigate("/matches")}>Browse Matches</Button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl">My Matches</h2>
        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate("/matches")}>
          See all <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.slice(0, 3).map((match: any) => (
          <MatchCard key={match.id} match={match} onChat={() => navigate(`/chat/${match.id}`)} />
        ))}
      </div>
    </div>
  );
}

function GymBuddyModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-6 text-white shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl" aria-hidden="true">🏋️</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-100">Fitness, your way</p>
          <h2 className="mt-1 font-display text-xl font-bold">Gym Buddy</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/85">Find a workout partner at your gym, plan a session together, or keep building your own program.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full bg-white text-orange-700 hover:bg-orange-50" onClick={() => navigate("/gym-buddy")}>
              Find a workout partner <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-full border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate("/my-workout")}>
              My workout program
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscoveryFilters({
  dateRange,
  category,
  sortBy,
  onDateChange,
  onCategoryChange,
  onSortChange,
  categories,
  radiusMiles,
  onRadiusChange,
}: {
  dateRange: HomepageDiscoveryDateRange;
  category: string;
  sortBy: HomepageDiscoverySort;
  onDateChange: (value: HomepageDiscoveryDateRange) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: HomepageDiscoverySort) => void;
  categories: Array<{ value: string; label: string }>;
  radiusMiles?: number;
  onRadiusChange?: (value: number) => void;
}) {
  const selectClass = "rounded-full border border-white/25 bg-white/15 px-2.5 py-1.5 text-xs text-white outline-none [&>option]:text-foreground";
  return (
    <div className="flex flex-wrap gap-2 mt-4" onClick={(event) => event.stopPropagation()}>
      <select aria-label="Filter by date" value={dateRange} onChange={(event) => onDateChange(event.target.value as HomepageDiscoveryDateRange)} className={selectClass}>
        <option value="all">Any date</option>
        <option value="week">Next 7 days</option>
        <option value="month">Next 30 days</option>
      </select>
      <select aria-label="Filter by category" value={category} onChange={(event) => onCategoryChange(event.target.value)} className={selectClass}>
        {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <select aria-label="Sort discovery results" value={sortBy} onChange={(event) => onSortChange(event.target.value as HomepageDiscoverySort)} className={selectClass}>
        <option value="date">Sort: date</option>
        <option value="category">Sort: category</option>
      </select>
      {radiusMiles !== undefined && onRadiusChange && (
        <select aria-label="Homepage discovery radius" value={radiusMiles} onChange={(event) => onRadiusChange(Number(event.target.value))} className={selectClass}>
          <option value={10}>Within 10 mi</option>
          <option value={25}>Within 25 mi</option>
          <option value={50}>Within 50 mi</option>
        </select>
      )}
    </div>
  );
}

function ActivitiesModule({ navigate }: { navigate: (p: string) => void }) {
  const [dateRange, setDateRange] = useState<HomepageDiscoveryDateRange>("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<HomepageDiscoverySort>("date");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const { detectedCity } = useUserCity();
  const userLat = detectedCity?.lat;
  const userLng = detectedCity?.lng;
  const { data: activities = [], isLoading } = trpc.activityBoard.getAll.useQuery({
    city: detectedCity?.city,
    lat: userLat,
    lng: userLng,
    radiusMiles,
  });
  const filtered = filterHomepageDiscovery(activities, { dateRange, category, sortBy }).slice(0, 2);
  const categories = [
    { value: "all", label: "All activities" },
    { value: "sports", label: "Sports" },
    { value: "outdoors", label: "Outdoors" },
    { value: "fitness", label: "Fitness" },
    { value: "arts", label: "Arts" },
    { value: "community", label: "Community" },
  ];

  return (
    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 card-hover" onClick={() => navigate("/activities")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Discover</p>
          <h2 className="font-display font-bold text-2xl text-white">Local Activities</h2>
          <p className="text-white/70 text-sm mt-1">Events, outings & meetups near you</p>
        </div>
        <div className="text-5xl">🗺️</div>
      </div>
      <DiscoveryFilters dateRange={dateRange} category={category} sortBy={sortBy} onDateChange={setDateRange} onCategoryChange={setCategory} onSortChange={setSortBy} categories={categories} radiusMiles={userLat !== undefined && userLng !== undefined ? radiusMiles : undefined} onRadiusChange={setRadiusMiles} />
      <div className="mt-3 space-y-2">
        {isLoading && <p className="text-xs text-white/70">Finding activities near you…</p>}
        {!isLoading && filtered.map((activity: any) => (
          <button key={activity.id} type="button" className="w-full text-left rounded-2xl bg-white/15 hover:bg-white/25 p-3 text-white transition-colors" onClick={(event) => { event.stopPropagation(); navigate(`/activities/${activity.id}`); }}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate">{activity.title}</span>
              <span className="text-[11px] text-white/70 whitespace-nowrap">{activity.category ?? "Activity"}</span>
            </div>
            <p className="text-xs text-white/70 mt-1">{activity.eventDate ? new Date(activity.eventDate).toLocaleDateString() : "Flexible date"}{activity.venueCity ? ` · ${activity.venueCity}` : ""}{(activity as any).distanceMiles != null ? ` · ${formatMilesAway((activity as any).distanceMiles)}` : userLat !== undefined && userLng !== undefined && (activity as any).venueLat != null && (activity as any).venueLng != null ? ` · ${formatMilesAway(haversineDistanceMiles(userLat, userLng, Number((activity as any).venueLat), Number((activity as any).venueLng)))}` : ""}</p>
          </button>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-xs text-white/70">No activities match those filters.</p>}
      </div>
      <Button size="sm" className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2" onClick={(event) => { event.stopPropagation(); navigate("/activities"); }}>
        Explore all <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function SportsModule({ navigate }: { navigate: (p: string) => void }) {
  const { data: liveData } = trpc.sportsScores.getLiveGames.useQuery(undefined, { refetchInterval: 60000 });
  const liveCount = liveData?.games?.length ?? 0;
  return (
    <div
      className="bg-gradient-to-br from-slate-800 to-green-900 rounded-3xl p-6 cursor-pointer card-hover"
      onClick={() => navigate("/sports")}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white/80 text-sm font-medium">Sports</p>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-xs bg-red-500/30 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> {liveCount} live
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-2xl text-white">Game Day Chat</h2>
          <p className="text-white/70 text-sm mt-1">Live scores, chat rooms & trivia</p>
        </div>
        <div className="text-5xl">🏟️</div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2" onClick={(e) => { e.stopPropagation(); navigate("/sports/live-scores"); }}>
          <Radio className="w-3 h-3" /> Live Scores
        </Button>
        <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-full" onClick={(e) => { e.stopPropagation(); navigate("/sports"); }}>
          Chat Rooms
        </Button>
      </div>
    </div>
  );
}

function GamesModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div
      className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 cursor-pointer card-hover"
      onClick={() => navigate("/games-hub")}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Play</p>
          <h2 className="font-display font-bold text-2xl text-white">Games Hub</h2>
          <p className="text-white/70 text-sm mt-1">Trivia, Jeopardy, Bulger Dash & more</p>
        </div>
        <div className="text-5xl">🎮</div>
      </div>
      <Button size="sm" className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2">
        Play Now <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function CommunityModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/community")}>
      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl flex-shrink-0">👥</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Community</h2>
        <p className="text-muted-foreground text-sm">Join groups & local events</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function ConciergeModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/concierge")}>
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl flex-shrink-0">🎩</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Concierge</h2>
        <p className="text-muted-foreground text-sm">AI-planned date nights & outings</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function MarketplaceModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/marketplace")}>
      <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center text-3xl flex-shrink-0">🛍️</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Marketplace</h2>
        <p className="text-muted-foreground text-sm">Local deals & services</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function FamilyModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/family")}>
      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-3xl flex-shrink-0">👨‍👩‍👧</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Family Connect</h2>
        <p className="text-muted-foreground text-sm">Meet families nearby</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function TripModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-4 cursor-pointer card-hover" onClick={() => navigate("/trip-planner")}>
      <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-3xl flex-shrink-0">✈️</div>
      <div className="flex-1">
        <h2 className="font-bold text-lg">Trip Planner</h2>
        <p className="text-muted-foreground text-sm">Plan adventures together</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function LocalEventsModule({ navigate }: { navigate: (p: string) => void }) {
  const { city, detectedCity } = useUserCity();
  const [dateRange, setDateRange] = useState<HomepageDiscoveryDateRange>("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<HomepageDiscoverySort>("date");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const userLat = detectedCity?.lat;
  const userLng = detectedCity?.lng;
  const hasGps = userLat !== undefined && userLng !== undefined;
  const { data: events = [], isLoading } = trpc.events.list.useQuery({
    city: hasGps ? undefined : city,
    lat: hasGps ? userLat : undefined,
    lng: hasGps ? userLng : undefined,
    radiusMiles: hasGps ? radiusMiles : undefined,
    limit: 30,
  });
  const filtered = filterHomepageDiscovery(events, { dateRange, category, sortBy }).slice(0, 2);
  const categories = [
    { value: "all", label: "All events" },
    { value: "plays", label: "Plays & musicals" },
    { value: "arts", label: "Arts" },
    { value: "music", label: "Music" },
    { value: "community", label: "Community" },
    { value: "outdoors", label: "Outdoors" },
  ];

  return (
    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 card-hover" onClick={() => navigate("/events")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-white/70" />
            <p className="text-white/80 text-sm font-medium">{city}</p>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">Local Events</h2>
          <p className="text-white/70 text-sm mt-1">Plays, concerts, museums & community events</p>
        </div>
        <div className="text-5xl">🏙️</div>
      </div>
      <DiscoveryFilters dateRange={dateRange} category={category} sortBy={sortBy} onDateChange={setDateRange} onCategoryChange={setCategory} onSortChange={setSortBy} categories={categories} radiusMiles={hasGps ? radiusMiles : undefined} onRadiusChange={setRadiusMiles} />
      <div className="mt-3 space-y-2">
        {isLoading && <p className="text-xs text-white/70">Finding current events near you…</p>}
        {!isLoading && filtered.map((event: any) => (
          <button key={event.id} type="button" className="w-full text-left rounded-2xl bg-white/15 hover:bg-white/25 p-3 text-white transition-colors" onClick={(clickEvent) => { clickEvent.stopPropagation(); navigate("/events"); }}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate">{event.title}</span>
              <span className="text-[11px] text-white/70 whitespace-nowrap">{event.category ?? "Event"}</span>
            </div>
            <p className="text-xs text-white/70 mt-1">{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "Date to be announced"}{event.venueName ? ` · ${event.venueName}` : ""}{hasGps && event.lat != null && event.lng != null ? ` · ${formatMilesAway(haversineDistanceMiles(userLat, userLng, Number(event.lat), Number(event.lng)))}` : ""}</p>
          </button>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-xs text-white/70">No events match those filters.</p>}
      </div>
      <Button size="sm" className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full gap-2" onClick={(event) => { event.stopPropagation(); navigate("/events"); }}>
        <Calendar className="w-3.5 h-3.5" /> Browse all <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function ShoutoutModule({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div
      className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-5 flex items-center gap-4 cursor-pointer card-hover"
      onClick={() => navigate("/shout-out")}
    >
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <Megaphone className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-white text-base">Refer a Friend 🎉</p>
        <p className="text-white/80 text-sm">Invite friends from your contacts</p>
      </div>
      <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
    </div>
  );
}

type NearbyDiscoveryItem = {
  id: number;
  kind: "event" | "activity";
  title: string;
  description?: string | null;
  category?: string | null;
  eventDate?: Date | string | null;
  endDate?: Date | string | null;
  venueName?: string | null;
  venueCity?: string | null;
  address?: string | null;
  externalUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceMiles?: number | null;
  venueWebsite?: string | null;
  venueIsLocallyOwned?: boolean | null;
  venueOwnershipNote?: string | null;
};

function calendarDate(value: Date | string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function getCalendarUrl(item: NearbyDiscoveryItem) {
  if (!item.eventDate) return null;
  const start = new Date(item.eventDate);
  const end = item.endDate ? new Date(item.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.title,
    dates: `${calendarDate(start)}/${calendarDate(end)}`,
    details: `Found on Just Putzit${item.externalUrl ? `\\n${item.externalUrl}` : ""}`,
    location: [item.venueName, item.address, item.venueCity].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getDirectionsUrl(item: NearbyDiscoveryItem) {
  const destination = item.lat != null && item.lng != null ? `${item.lat},${item.lng}` : [item.venueName, item.address, item.venueCity].filter(Boolean).join(", ");
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
}

function StandardDiscoveryCard({ item, onPlan, navigate }: { item: NearbyDiscoveryItem; onPlan: () => void; navigate: (path: string) => void }) {
  const detailPath = item.kind === "event" ? `/events/${item.id}` : `/activities/${item.id}`;
  const dateLabel = item.eventDate ? new Date(item.eventDate).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Flexible date";
  const calendarUrl = getCalendarUrl(item);
  const directionsUrl = getDirectionsUrl(item);
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{item.kind}</span>
            {item.category && <span className="truncate text-[11px] text-muted-foreground">{item.category}</span>}
          </div>
          <h3 className="font-semibold text-sm leading-snug text-foreground">{item.title}</h3>
        </div>
        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{dateLabel}{item.distanceMiles != null ? ` · ${formatMilesAway(item.distanceMiles)}` : ""}</p>
      {item.description && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>}
      {item.venueName && <p className="mt-2 flex items-start gap-1 text-xs font-medium text-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{item.venueName}{item.venueCity ? ` · ${item.venueCity}` : ""}</p>}
      {item.address && <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{item.address}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" className="h-8 rounded-full gap-1.5" onClick={onPlan}>
          <CalendarPlus className="h-3.5 w-3.5" /> Plan it
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 rounded-full gap-1.5" onClick={() => navigate(detailPath)}>
          Details <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        {calendarUrl && <a href={calendarUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"><Calendar className="h-3.5 w-3.5" /> Calendar</a>}
        {directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"><Navigation className="h-3.5 w-3.5" /> Directions</a>}
        {item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted">Official details <ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span>Want company? Start with the public event.</span>
        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => navigate(detailPath)}>Meet safely</button>
      </div>
    </div>
  );
}

function NearbyNowModule({ navigate }: { navigate: (path: string) => void }) {
  const { city, detectedCity } = useUserCity();
  const [radiusMiles, setRadiusMiles] = useState(25);
  const hasGps = detectedCity?.lat != null && detectedCity?.lng != null;
  const userLat = hasGps ? Number(detectedCity?.lat) : undefined;
  const userLng = hasGps ? Number(detectedCity?.lng) : undefined;
  const utils = trpc.useUtils();
  const { data: events = [], isLoading: eventsLoading } = trpc.events.list.useQuery({
    city: hasGps ? undefined : city,
    lat: userLat,
    lng: userLng,
    radiusMiles: hasGps ? radiusMiles : undefined,
    limit: 12,
  });
  const { data: activities = [], isLoading: activitiesLoading } = trpc.activityBoard.getAll.useQuery({
    city,
    lat: userLat,
    lng: userLng,
    radiusMiles,
  });
  const locallyOwnedDining = activities.filter((activity: any) =>
    (activity.category === "dining" || activity.category === "coffee") &&
    activity.venueIsLocallyOwned &&
    activity.venueName &&
    activity.venueWebsite
  ).slice(0, 2);
  const { data: plan } = trpc.homepage.getTodaysPlan.useQuery();
  const savePlan = trpc.homepage.saveTodaysPlan.useMutation({ onSuccess: () => utils.homepage.getTodaysPlan.invalidate() });
  const clearPlan = trpc.homepage.clearTodaysPlan.useMutation({ onSuccess: () => utils.homepage.getTodaysPlan.invalidate() });
  const { data: myMatches = [] } = trpc.matchmaking.getMyMatches.useQuery();

  const items: NearbyDiscoveryItem[] = [
    ...events.map((event: any) => ({
      id: Number(event.id), kind: "event" as const, title: event.title, category: event.category,
      description: event.description,
      eventDate: event.eventDate, endDate: event.endDate, venueName: event.venueName, venueCity: event.city ?? event.venueCity,
      address: event.address, externalUrl: event.externalUrl, lat: event.lat, lng: event.lng, distanceMiles: hasGps && event.lat != null && event.lng != null ? haversineDistanceMiles(userLat!, userLng!, Number(event.lat), Number(event.lng)) : event.distanceMiles,
    })),
    ...activities.map((activity: any) => ({
      id: Number(activity.id), kind: "activity" as const, title: activity.title, category: activity.category,
      description: activity.description,
      eventDate: activity.eventDate, endDate: activity.endDate, venueName: activity.venueName, venueCity: activity.venueCity ?? activity.city,
      address: activity.venueAddress ?? activity.address, externalUrl: activity.venueWebsite ?? activity.externalUrl, lat: activity.venueLat ?? activity.lat, lng: activity.venueLng ?? activity.lng, distanceMiles: activity.distanceMiles,
      venueWebsite: activity.venueWebsite, venueIsLocallyOwned: activity.venueIsLocallyOwned, venueOwnershipNote: activity.venueOwnershipNote,
    })),
  ].sort((a, b) => new Date(a.eventDate ?? "9999-12-31").getTime() - new Date(b.eventDate ?? "9999-12-31").getTime()).slice(0, 4);

  const selected = plan ? items.find((item) => (item.kind === "event" && item.id === plan.eventId) || (item.kind === "activity" && item.id === plan.activityId)) : undefined;
  const isLoading = eventsLoading || activitiesLoading;
  const planTitle = selected?.title ?? (plan ? "Your saved plan" : null);

  return (
    <section className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Navigation className="h-3.5 w-3.5" /> Near you today</div>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">What’s happening in {city}?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick one thing to do, then use your plan to coordinate safely.</p>
        </div>
        <select aria-label="Nearby discovery radius" value={radiusMiles} onChange={(event) => setRadiusMiles(Number(event.target.value))} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">
          <option value={10}>Within 10 miles</option><option value={25}>Within 25 miles</option><option value={50}>Within 50 miles</option>
        </select>
      </div>

      {planTitle && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/5 p-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Today's plan</p><p className="mt-1 font-semibold text-foreground">{planTitle}</p>{selected?.venueName && <p className="text-xs text-muted-foreground">{selected.venueName} · {selected.distanceMiles != null ? formatMilesAway(selected.distanceMiles) : "nearby"}</p>}</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => clearPlan.mutate()}>Clear</Button>
            {selected && <Button type="button" size="sm" className="rounded-full" onClick={() => navigate(selected.kind === "event" ? "/events" : `/activities/${selected.id}`)}>Open</Button>}
            {plan?.eventId && selected?.kind === "event" && myMatches.length > 0 && <TodayPlanInviteDialog eventId={plan.eventId} eventTitle={selected.title} eventDate={selected.eventDate} venueName={selected.venueName} matches={myMatches} />}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {isLoading && <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground sm:col-span-2">Finding current events and activities near you…</div>}
        {!isLoading && items.map((item) => <StandardDiscoveryCard key={`${item.kind}-${item.id}`} item={item} navigate={navigate} onPlan={() => savePlan.mutate(buildTodayPlanSelection(item))} />)}
        {!isLoading && items.length === 0 && <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground sm:col-span-2">No verified listings matched this radius. Try 50 miles or search another city.</div>}
      </div>
      {locallyOwnedDining.length > 0 && (
        <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Community favorites</p>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">Locally owned coffee & dining nearby</h3>
              <p className="mt-1 text-xs text-muted-foreground">Each card shows its exact city. Local ownership is shown only when stated on the business’s official site.</p>
            </div>
            <Button type="button" size="sm" variant="outline" className="rounded-full bg-background" onClick={() => navigate("/activities")}>See all activities</Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {locallyOwnedDining.map((activity: any) => (
              <article key={activity.id} className="rounded-xl border border-orange-100 bg-background p-3">
                <div className="flex items-center gap-2"><span className="text-lg">{activity.category === "coffee" ? "☕" : "🍽️"}</span><Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Locally owned</Badge></div>
                <h4 className="mt-2 font-semibold text-foreground">{activity.venueName}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activity.venueOwnershipNote}</p>
                <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{activity.venueAddress}{activity.venueCity ? ` · ${activity.venueCity}` : ""}</p>
                <a href={activity.venueWebsite} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Official site, hours & menu <ExternalLink className="h-3.5 w-3.5" /></a>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/events")}>Browse events</Button><Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/activities")}>Browse activities</Button></div>
    </section>
  );
}

function renderModule(moduleId: string, navigate: (p: string) => void, profile: any, matches: any[]) {
  switch (moduleId) {
    case "sally":       return <SallyModule profile={profile} navigate={navigate} />;
    case "matches":     return <MatchesModule matches={matches} navigate={navigate} />;
    case "activities":  return <ActivitiesModule navigate={navigate} />;
    case "sports":      return <SportsModule navigate={navigate} />;
    case "games":       return <GamesModule navigate={navigate} />;
    case "community":   return <CommunityModule navigate={navigate} />;
    case "concierge":   return <ConciergeModule navigate={navigate} />;
    case "marketplace": return <MarketplaceModule navigate={navigate} />;
    case "family":      return <FamilyModule navigate={navigate} />;
    case "trip":        return <TripModule navigate={navigate} />;
    case "gymbuddy":    return <GymBuddyModule navigate={navigate} />;
    case "shoutout":    return <ShoutoutModule navigate={navigate} />;
    case "localevents": return <LocalEventsModule navigate={navigate} />;
    default:            return null;
  }
}

// ─── Customize drawer ─────────────────────────────────────────────────────────

function CustomizeDrawer({
  layout,
  onSave,
  onClose,
}: {
  layout: ActiveModule[];
  onSave: (layout: ActiveModule[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ActiveModule[]>([...layout]);
  const dragIndex = useRef<number | null>(null);

  const toggleSection = (moduleId: string) => {
    const next = toggleHomepageSection(draft, moduleId);
    setDraft(next);
    onSave(next);
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDrop = (targetIndex: number) => {
    const sourceIndex = dragIndex.current;
    dragIndex.current = null;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const reordered = [...draft];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const next = reordered.map((section, position) => ({ ...section, position }));
    setDraft(next);
    onSave(next);
  };

  const handleReset = () => {
    const defaults = ALL_MODULES.map(m => ({
      moduleId: m.id,
      position: m.defaultPosition,
      pinned: m.defaultPinned,
    }));
    setDraft(defaults);
    onSave(defaults);
  };

  const pinnedCount = draft.filter(m => m.pinned).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">Customize Your Home</h2>
            <p className="text-xs text-muted-foreground">{pinnedCount} selected · check to add, drag to reorder</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active modules */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {draft.map((m) => {
            const def = ALL_MODULES.find(d => d.id === m.moduleId);
            if (!def) return null;
            return (
              <div
                key={m.moduleId}
                draggable={m.pinned}
                onDragStart={() => handleDragStart(draft.indexOf(m))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(draft.indexOf(m))}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  m.pinned ? "bg-card border-primary/30 shadow-sm" : "bg-muted/40 border-dashed border-border/60"
                }`}
              >
                {m.pinned && <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />}
                <span className="text-xl">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${!m.pinned ? "text-muted-foreground" : ""}`}>{def.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{def.description}</p>
                </div>
                <Checkbox
                  checked={m.pinned}
                  onCheckedChange={() => toggleSection(m.moduleId)}
                  aria-label={`${m.pinned ? "Remove" : "Add"} ${def.label} from your home page`}
                  className="h-5 w-5 flex-shrink-0"
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border space-y-2">
          <p className="text-center text-xs text-muted-foreground">Your order is saved automatically.</p>
          <Button className="w-full" onClick={onClose}>Done</Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground gap-1.5 text-xs"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Authenticated home ───────────────────────────────────────────────────────

function AuthenticatedHome({ user, profile }: { user: any; profile: any }) {
  const [, navigate] = useLocation();
  const [showCustomize, setShowCustomize] = useState(false);
  const [layout, setLayout] = useState<ActiveModule[]>([]);

  const { data: myMatches } = trpc.matchmaking.getMyMatches.useQuery();
  const { data: savedLayout, isLoading: layoutLoading } = trpc.homepage.getLayout.useQuery();
  const saveLayoutMutation = trpc.homepage.saveLayout.useMutation();

  // Build layout from saved DB rows (or defaults)
  useEffect(() => {
    if (!layoutLoading) {
      const saved = savedLayout?.modules ?? [];
      setLayout(buildLayout(saved as ActiveModule[]));
    }
  }, [savedLayout, layoutLoading]);

  const handleSaveLayout = useCallback(async (newLayout: ActiveModule[]) => {
    setLayout(newLayout);
    try {
      await saveLayoutMutation.mutateAsync({ modules: newLayout });
      toast.success("Home layout saved!");
    } catch {
      toast.error("Failed to save layout");
    }
  }, [saveLayoutMutation]);

  const pinnedModules = layout.filter(m => m.pinned).sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8">
        <section className="mb-5 rounded-2xl border border-border/70 bg-white/90 p-3 shadow-sm backdrop-blur-sm sm:p-4" aria-label="Search your community">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <MapPin className="h-3.5 w-3.5" /> Find your community
          </div>
          <LocationOverrideControl compact />
        </section>

        {/* Welcome header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Welcome back, {profile?.displayName || user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              {profile?.interviewCount === 0
                ? "Sally is ready to get to know you better!"
                : `You've had ${profile?.interviewCount} chat${profile?.interviewCount !== 1 ? "s" : ""} with Sally`}
            </p>
          </div>
          <div className="mt-1 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate("/shout-out")}
              className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
              aria-label="Recommend Just Putzit to a friend"
              title="Recommend a friend"
            >
              <Megaphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refer</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              title="Customize your home"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Customize</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <NearbyNowModule navigate={navigate} />
        </div>

        <div className="mb-6">
          <WaukeshaLibrarySpotlight onExplore={() => navigate("/entertainment")} />
        </div>

        {/* Identity completion prompt */}
        {(!((profile as any)?.gender) || !((profile as any)?.sexualOrientation) || !((profile as any)?.birthDate)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Complete your identity info</p>
              <p className="text-xs text-amber-600">Add your gender, orientation, and age to get better matches</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full border-amber-300 text-amber-700 text-xs" onClick={() => navigate("/profile")}>
              Add info
            </Button>
          </div>
        )}

        {/* Local venue banner */}
        <LocalVenueBanner page="home" className="mb-6" />

        {/* Pinned modules */}
        {layoutLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/40 rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {pinnedModules.map(m => {
              const content = renderModule(m.moduleId, navigate, profile, myMatches ?? []);
              if (!content) return null;
              return (
                <div key={m.moduleId} className="relative group">
                  {content}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!layoutLoading && pinnedModules.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📌</p>
            <p className="font-semibold text-lg">No modules pinned</p>
            <p className="text-muted-foreground text-sm mb-4">Customize your home to pin the sections you use most</p>
            <Button onClick={() => setShowCustomize(true)} className="gap-2">
              <Settings2 className="w-4 h-4" /> Customize Home
            </Button>
          </div>
        )}
      </div>

      {/* Customize drawer */}
      {showCustomize && (
        <CustomizeDrawer
          layout={layout}
          onSave={handleSaveLayout}
          onClose={() => setShowCustomize(false)}
        />
      )}
      <button
        type="button"
        onClick={() => navigate("/shout-out")}
        className="fixed bottom-6 left-2 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-orange-300 bg-orange-500 text-white shadow-lg shadow-orange-500/25 transition-transform hover:bg-orange-600 active:scale-95 sm:flex"
        aria-label="Invite friends to Just Putzit"
        title="Invite friends"
      >
        <Megaphone className="h-5 w-5" />
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Home() {
  useSEO({
    title: "Just Putzit — Real Dates. Real Activities.",
    description: "Meet locals who actually want to go out. Find matches for activities, date nights, and real connections in your city. Free to join.",
    canonical: "https://justputzit.com/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Just Putzit",
      "operatingSystem": "Web, iOS, Android",
      "applicationCategory": "SocialNetworkingApplication",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Meet locals who actually want to go out. Find matches for activities, date nights, and real connections in your city.",
      "url": "https://justputzit.com",
    },
  });
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: verifyStatus } = trpc.verification.getStatus.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && isAuthenticated && profile !== undefined) {
      if (!profile?.onboardingComplete) {
        navigate("/onboarding");
      } else if (!verifyStatus?.locationVerified && verifyStatus !== undefined) {
        navigate("/verify");
      } else if ((profile?.interviewCount ?? 0) === 0) {
        navigate("/interview");
      }
    }
  }, [loading, isAuthenticated, profile, verifyStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-muted-foreground">Loading Just Putzit...</p>
        </div>
      </div>
    );
  }

  // A member may have an authenticated navigation session before their profile
  // query resolves. Do not briefly show public sign-in or onboarding CTAs in
  // that state; wait for the profile decision instead.
  if (isAuthenticated && profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-muted-foreground">Preparing your home…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && profile?.onboardingComplete) {
    return <AuthenticatedHome user={user} profile={profile} />;
  }
  return <LandingPage isAuthenticated={isAuthenticated} />;
}

// ─── Landing page (public) ────────────────────────────────────────────────────

function LandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [, navigate] = useLocation();
  const primaryAction = isAuthenticated
    ? { label: "Continue setup", destination: "/onboarding" }
    : { label: "Get Started", destination: "/signup" };
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative gradient-warm min-h-screen flex flex-col">
        {/* Top nav for landing */}
        <div className="container flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/justputzit-logo-transparent_2e545ffa.png" alt="Just Putzit" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated && <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign in</Button>}
            <Button size="sm" className="gradient-primary text-white border-0 rounded-full" onClick={() => navigate(primaryAction.destination)}>{primaryAction.label}</Button>
          </div>
        </div>

        {/* Hero content */}
        <div className="container flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-16">
          <div className="flex-1 max-w-xl">
            <Badge className="mb-4 rounded-full px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
              ✨ AI-Powered Real Connections
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Don't Swipe.<br />
              <span className="text-primary">Show Up.</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Just Putzit connects you with real people for real experiences — powered by Sally, your AI guide who gets to know the real you.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" className="gradient-primary text-white border-0 rounded-full gap-2 btn-scale" onClick={() => navigate(primaryAction.destination)}>
                <Sparkles className="w-5 h-5" /> {isAuthenticated ? "Continue Your Setup" : "Start Your Journey"}
              </Button>
              <Button size="lg" variant="outline" className="rounded-full" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                Learn More
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> Safety Tools</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500" /> AI-Matched</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Local Events</span>
            </div>
          </div>

          {/* Sally card */}
          <div className="flex-shrink-0 w-full max-w-xs">
            <div className="bg-white rounded-3xl shadow-xl p-6 relative">
              <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                ✨ Match Insights
              </div>
              <div className="w-20 h-20 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-4xl">🤖</div>
              <h3 className="font-bold text-center text-lg mb-1">Hi! I'm Sally</h3>
              <p className="text-muted-foreground text-center text-sm mb-4">Your AI Connection Guide</p>
              <div className="bg-muted/50 rounded-2xl p-3 text-sm">
                <span className="font-semibold text-primary">Sally:</span> "Tell me — what's your idea of a perfect Sunday? ☀️"
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Shield className="w-3 h-3 text-green-500" /> Safety & Trust
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold mb-3">Connecting You In Real Life</h2>
          <p className="text-muted-foreground mb-12 max-w-xl mx-auto">Whether you're single, in a couple, or just looking for community — Just Putzit has a network for you.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: "🤖", title: "Meet Sally", desc: "Our AI guide learns what makes you tick through quick daily chats — no boring questionnaires." },
              { emoji: "💕", title: "Get Matched", desc: "Sally finds people who share your vibe, values, and interests — not just your zip code." },
              { emoji: "🗺️", title: "Show Up", desc: "Plan real activities together. Coffee, mini golf, trivia nights — whatever feels right." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="p-6">
                <div className="text-5xl mb-4">{emoji}</div>
                <h3 className="font-bold text-xl mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-warm text-center">
        <div className="container">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to show up?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of locals already connecting through Just Putzit.</p>
          <Button size="lg" className="gradient-primary text-white border-0 rounded-full gap-2 btn-scale" onClick={() => navigate("/signup")}>
            <Heart className="w-5 h-5" /> Join Free Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <p>&copy; 2026 Just Putzit. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/safety" className="hover:text-foreground transition-colors">Safety &amp; Trust</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function MatchCard({ match, onChat }: any) {
  const profile = match.otherProfile;
  const traits = profile?.traits as any;
  return (
    <div className="border border-border rounded-2xl p-4 card-hover">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ background: profile?.avatarColor || "#f97316" }}
        >
          {profile?.avatarEmoji || "😊"}
        </div>
        <div>
          <p className="font-bold text-sm">{profile?.displayName || "Mystery Match"}</p>
          <p className="text-xs text-primary font-semibold">{match.compatibilityScore}% compatible</p>
        </div>
      </div>
      {traits?.personalityKeywords && (
        <div className="flex flex-wrap gap-1 mb-3">
          {traits.personalityKeywords.slice(0, 3).map((k: string) => (
            <Badge key={k} variant="secondary" className="text-xs rounded-full">{k}</Badge>
          ))}
        </div>
      )}
      <Button size="sm" variant="outline" className="w-full rounded-full gap-2" onClick={onChat}>
        <MessageCircle className="w-3 h-3" /> Chat
      </Button>
    </div>
  );
}
