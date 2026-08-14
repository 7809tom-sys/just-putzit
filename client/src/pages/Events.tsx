import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Calendar,
  MapPin,
  Clock,
  Users,
  ExternalLink,
  Ticket,
  Music,
  ShoppingBag,
  Utensils,
  TreePine,
  Palette,
  Heart,
  Star,
  CheckCircle2,
  Search,
  RefreshCw,
} from "lucide-react";
import { useUserCity } from "@/hooks/useUserCity";
import { formatMilesAway, haversineDistanceMiles } from "@shared/geo";
import { LocationOverrideControl } from "@/components/LocationOverrideControl";
import { WaukeshaLibrarySpotlight } from "@/components/WaukeshaLibrarySpotlight";

const CATEGORIES = [
  { value: "all", label: "All Events", icon: Star },
  { value: "music", label: "Music", icon: Music },
  { value: "market", label: "Markets", icon: ShoppingBag },
  { value: "food", label: "Food", icon: Utensils },
  { value: "outdoors", label: "Outdoors", icon: TreePine },
  { value: "arts", label: "Arts", icon: Palette },
  { value: "community", label: "Community", icon: Heart },
];

const CITIES = ["All Cities", "Milwaukee", "Waukesha", "Chicago", "Brookfield", "West Allis", "Wauwatosa"];

function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    music: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    market: "bg-green-500/20 text-green-300 border-green-500/30",
    food: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    outdoors: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    arts: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    community: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    sports: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };
  return map[cat] ?? map.other;
}

interface EventCardProps {
  event: {
    id: number | string;
    title: string;
    description?: string | null;
    category: string;
    eventDate: Date | string;
    endDate?: Date | string | null;
    venueName?: string | null;
    address?: string | null;
    city: string;
    lat?: number | null;
    lng?: number | null;
    isFree: boolean;
    priceCents: number;
    externalUrl?: string | null;
    imageUrl?: string | null;
    rsvpCount: number;
    source?: string;
    isSponsored?: boolean;
    hasThirdWheelHost?: boolean;
    thirdWheelHostNote?: string | null;
  };
  onRsvp?: (id: number) => void;
  rsvpLoading?: boolean;
  hasRsvped?: boolean;
  introductionOptIn?: boolean;
  onToggleIntroductionOptIn?: (id: number, nextValue: boolean) => void;
  introductionLoading?: boolean;
  onRequestSallyIntroduction?: (id: number) => void;
  introductionRequestLoading?: boolean;
  interestedCount?: number;
  isInterested?: boolean;
  onToggleInterest?: (id: number) => void;
  interestLoading?: boolean;
  userLat?: number;
  userLng?: number;
}

function EventCard({ event, onRsvp, rsvpLoading, hasRsvped, introductionOptIn = false, onToggleIntroductionOptIn, introductionLoading, onRequestSallyIntroduction, introductionRequestLoading, interestedCount = 0, isInterested = false, onToggleInterest, interestLoading, userLat, userLng }: EventCardProps) {
  const CatIcon = CATEGORIES.find((c) => c.value === event.category)?.icon ?? Star;
  const numericId = typeof event.id === "string" ? parseInt(event.id.replace("eb_", ""), 10) : event.id;

  return (
    <div className={`group relative bg-white/5 border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
      event.isSponsored
        ? "border-amber-500/40 hover:border-amber-400/60 hover:shadow-amber-500/10 ring-1 ring-amber-500/20"
        : "border-white/10 hover:border-orange-400/40 hover:bg-white/8 hover:shadow-orange-500/10"
    }`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full ${event.isSponsored ? "bg-gradient-to-r from-amber-400 to-yellow-500" : event.isFree ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-orange-400 to-amber-500"}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {event.isSponsored && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Star className="w-3 h-3 fill-amber-400" />
                Sponsored
              </span>
            )}
            {event.hasThirdWheelHost && (
              <span
                title="A listed event host is scheduled to be on site. This is not emergency support."
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/15 text-sky-200 border border-sky-400/30"
              >
                🛡️ Host on site
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColor(event.category)}`}>
              <CatIcon className="w-3 h-3" />
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
            {event.isFree ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                FREE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ${(event.priceCents / 100).toFixed(0)}
              </span>
            )}
          </div>
          {event.source === "eventbrite" && (
            <span className="text-xs text-gray-500 shrink-0">via Eventbrite</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white text-base leading-snug mb-2 group-hover:text-orange-200 transition-colors">
          {event.title}
        </h3>
        {event.hasThirdWheelHost && (
          <p className="mb-2 text-xs leading-relaxed text-sky-100/90">
            A listed event host can help with event logistics. This does not replace emergency services.
          </p>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{event.description}</p>
        )}

        {/* Meta info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{formatDate(event.eventDate)}</span>
            <span className="text-gray-500">·</span>
            <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{formatTime(event.eventDate)}</span>
          </div>
          {(event.venueName || event.city) && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate">
                {event.venueName ? `${event.venueName}, ` : ""}{event.city}, WI
              </span>
            </div>
          )}
          {userLat !== undefined && userLng !== undefined && event.lat != null && event.lng != null && (
            <div className="flex items-center gap-2 text-sm text-orange-200">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{formatMilesAway(haversineDistanceMiles(userLat, userLng, Number(event.lat), Number(event.lng)))}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{event.rsvpCount} going</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleInterest && typeof event.id === "number" ? (
            <button
              onClick={() => onToggleInterest(numericId)}
              disabled={interestLoading}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isInterested
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "text-gray-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 hover:bg-red-500/5"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isInterested ? "fill-red-300" : ""}`} />
              {interestedCount > 0 && <span className="text-xs font-semibold">{interestedCount}</span>}
            </button>
          ) : null}
          {onRsvp && typeof event.id === "number" ? (
            <Button
              size="sm"
              onClick={() => onRsvp(numericId)}
              disabled={rsvpLoading || hasRsvped}
              className={`flex-1 text-sm font-medium transition-all ${
                hasRsvped
                  ? "bg-green-500/20 text-green-300 border border-green-500/30 cursor-default"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {hasRsvped ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Going!
                </>
              ) : rsvpLoading ? (
                "..."
              ) : (
                <>
                  <Ticket className="w-3.5 h-3.5 mr-1.5" /> I'm Going
                </>
              )}
            </Button>
          ) : null}
          {hasRsvped && onToggleIntroductionOptIn && typeof event.id === "number" ? (
            <button
              type="button"
              title="Sally may offer a public-event introduction only if another attendee independently opts in. Attendee identities stay private until both people agree."
              onClick={() => onToggleIntroductionOptIn(numericId, !introductionOptIn)}
              disabled={introductionLoading}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                introductionOptIn ? "border-teal-400/40 bg-teal-500/15 text-teal-100" : "border-white/10 text-gray-300 hover:border-teal-400/40 hover:text-teal-100"
              }`}
            >
              {introductionOptIn ? "Sally intro on" : "Open to an intro"}
            </button>
          ) : null}
          {hasRsvped && introductionOptIn && onRequestSallyIntroduction && typeof event.id === "number" ? (
            <button
              type="button"
              title="Sally creates a private match only when another attendee independently opted in and neither person blocked the other."
              onClick={() => onRequestSallyIntroduction(numericId)}
              disabled={introductionRequestLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-teal-400/40 bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-100 transition-all hover:bg-teal-500/25 disabled:opacity-60"
            >
              {introductionRequestLoading ? "Checking…" : "Ask Sally"}
            </button>
          ) : null}
          {event.externalUrl && (
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Details
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const { user } = useAuth();
  const { city: detectedCity, detectedCity: detectedLocation, isManualOverride } = useUserCity();
  const [category, setCategory] = useState("all");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [city, setCity] = useState<string | null>(null); // null = use detectedCity
  const [freeOnly, setFreeOnly] = useState(false);
  // Keep the page aligned with the selected travel location; restore GPS city after clearing it.
  useEffect(() => {
    if (isManualOverride) {
      setCity(null);
    } else if (detectedCity && city === null) {
      setCity(detectedCity);
    }
  }, [detectedCity, isManualOverride, city]);
  const [rsvpingId, setRsvpingId] = useState<number | null>(null);
  const [interestingId, setInterestingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeCity = city ?? detectedCity;
  const cityFilter = activeCity === "All Cities" ? undefined : activeCity;
  const userLat = detectedLocation?.lat;
  const userLng = detectedLocation?.lng;
  const hasGps = userLat !== undefined && userLng !== undefined && cityFilter !== undefined;

  const { data: ebEvents = [], refetch: refetchEventbrite } = trpc.events.getEventbrite.useQuery(
    { city: cityFilter ?? "Milwaukee" },
    { enabled: true }
  );

  const { data: events = [], isLoading, refetch } = trpc.events.list.useQuery({
    city: hasGps ? undefined : cityFilter,
    category: category === "all" ? undefined : category,
    isFree: freeOnly ? true : undefined,
    lat: hasGps ? userLat : undefined,
    lng: hasGps ? userLng : undefined,
    radiusMiles: hasGps ? radiusMiles : undefined,
  });

  const { data: myRsvps = [], refetch: refetchRsvps } = trpc.events.myRsvps.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: myInterests = [], refetch: refetchInterests } = trpc.events.myInterests.useQuery(undefined, {
    enabled: !!user,
  });

  const rsvpedIds = useMemo(() => {
    return new Set((myRsvps as Array<{ rsvp: { eventId: number } }>).map((r) => r.rsvp.eventId));
  }, [myRsvps]);

  const introductionOptInIds = useMemo(() => {
    return new Set((myRsvps as Array<{ rsvp: { eventId: number; openToSallyIntroduction?: boolean } }>).filter((r) => r.rsvp.openToSallyIntroduction).map((r) => r.rsvp.eventId));
  }, [myRsvps]);

  const interestedIds = useMemo(() => {
    return new Map((myInterests as Array<{ interest: { eventId: number; status: string } }>).map((i) => [i.interest.eventId, i.interest.status]));
  }, [myInterests]);

  const rsvpMutation = trpc.events.rsvp.useMutation({
    onSuccess: (data, variables) => {
      if ((data as { alreadyRsvped: boolean }).alreadyRsvped) {
        toast.info("You're already going to this event!");
      } else {
        toast.success("You're going! 🎉 See you there.");
      }
      setRsvpingId(null);
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Could not RSVP. Please try again.");
      setRsvpingId(null);
    },
  });

  const introductionOptInMutation = trpc.events.setIntroductionOptIn.useMutation({
    onSuccess: (data) => {
      void refetchRsvps();
      toast.success(data.openToSallyIntroduction ? "Sally introductions enabled" : "Sally introductions turned off", {
        description: data.openToSallyIntroduction ? "You remain private until both attendees independently agree to an introduction." : "You will not be considered for attendee introductions at this event.",
      });
    },
    onError: (error) => toast.error(error.message || "Could not update your introduction setting."),
  });

  const introductionRequestMutation = trpc.events.requestSallyIntroduction.useMutation({
    onSuccess: (data) => {
      if (data.status === "created") {
        toast.success("Sally introduction ready", {
          description: "A private match was created with another attendee who independently opted in. Find it in Matches.",
        });
      } else {
        toast.info("No mutual introduction yet", {
          description: "You are opted in. Sally keeps attendee identities private unless another eligible attendee is ready too.",
        });
      }
    },
    onError: (error) => toast.error(error.message || "Could not check for a Sally introduction."),
  });

  async function handleRefreshList() {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchEventbrite()]);
      toast.success("Event list refreshed with the latest saved listings.");
    } catch {
      toast.error("We could not refresh the event list. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleRsvp(eventId: number) {
    if (!user) {
      toast.error("Sign in to RSVP to events!");
      return;
    }
    setRsvpingId(eventId);
    rsvpMutation.mutate({ eventId });
  }

  function handleIntroductionOptIn(eventId: number, openToSallyIntroduction: boolean) {
    if (!user) {
      toast.error("Sign in to manage event introductions.");
      return;
    }
    introductionOptInMutation.mutate({ eventId, openToSallyIntroduction });
  }

  function handleRequestSallyIntroduction(eventId: number) {
    if (!user) {
      toast.error("Sign in to request a Sally introduction.");
      return;
    }
    introductionRequestMutation.mutate({ eventId });
  }

  const interestMutation = trpc.events.markInterest.useMutation({
    onSuccess: () => {
      toast.success("Added to your interests! 💜");
      setInterestingId(null);
      void refetchInterests();
    },
    onError: (err) => {
      toast.error(err.message || "Could not mark interest. Please try again.");
      setInterestingId(null);
    },
  });

  const removeInterestMutation = trpc.events.removeInterest.useMutation({
    onSuccess: () => {
      toast.success("Removed from your interests.");
      setInterestingId(null);
      void refetchInterests();
    },
    onError: (err) => {
      toast.error(err.message || "Could not remove interest. Please try again.");
      setInterestingId(null);
    },
  });

  function handleToggleInterest(eventId: number) {
    if (!user) {
      toast.error("Sign in to mark events as interested!");
      return;
    }
    setInterestingId(eventId);
    const isCurrentlyInterested = interestedIds.has(eventId);
    if (isCurrentlyInterested) {
      removeInterestMutation.mutate({ eventId });
    } else {
      interestMutation.mutate({ eventId, status: "interested" });
    }
  }

  // Merge community + Eventbrite events, then apply search filter
  const allEvents = useMemo(() => {
    const combined = [
      ...(events as Array<{ id: number; title: string; description?: string | null; category: string; eventDate: Date | string; endDate?: Date | string | null; venueName?: string | null; address?: string | null; city: string; isFree: boolean; priceCents: number; externalUrl?: string | null; imageUrl?: string | null; rsvpCount: number; source?: string; isSponsored?: boolean; }>),
      ...(ebEvents as Array<{ id: string; title: string; description?: string | null; category: string; eventDate: Date | string; endDate?: Date | string | null; venueName?: string | null; address?: string | null; city: string; isFree: boolean; priceCents: number; externalUrl?: string | null; imageUrl?: string | null; rsvpCount: number; source?: string; isSponsored?: boolean; }>).map((e) => ({ ...e, id: parseInt(e.id.replace("eb_", ""), 10) || Math.random() })),
    ];
    let filtered = combined;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = combined.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q) ||
          (e.venueName ?? "").toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q)
      );
    }
    // Pin sponsored events to the top
    return [...filtered.filter((e) => e.isSponsored), ...filtered.filter((e) => !e.isSponsored)];
  }, [events, ebEvents, searchQuery]);

  const freeCount = allEvents.filter((e) => e.isFree).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-lg">
                🗓️
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white">Free & Fun Near You</h1>
                <p className="text-sm text-gray-400">Milwaukee &amp; Waukesha community events</p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleRefreshList} disabled={isRefreshing} className="shrink-0 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing" : "Refresh list"}
            </Button>
          </div>

          {/* Sally tip */}
          <div className="mt-5 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-sm shrink-0">
              💬
            </div>
            <div>
              <p className="text-sm font-medium text-orange-200">Sally says</p>
              <p className="text-sm text-gray-300 mt-0.5">
                The best dates don't cost a thing! Farmers markets, free concerts, and community
                gatherings are perfect for a first meet-up. Browse below and tap "I'm Going" — your
                match might show up too. 😊
              </p>
            </div>
          </div>

          <div className="mt-5 max-w-xl">
            <LocationOverrideControl compact />
          </div>

          <div className="mt-5">
            <WaukeshaLibrarySpotlight dark onExplore={() => { window.location.href = "/entertainment"; }} />
          </div>

          {/* Stats strip */}
          {!isLoading && allEvents.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm text-gray-400">
              <span><span className="text-white font-semibold">{allEvents.length}</span> upcoming events</span>
              <span>·</span>
              <span><span className="text-green-400 font-semibold">{freeCount}</span> free</span>
              {cityFilter && <><span>·</span><span>in <span className="text-orange-300">{cityFilter}</span></span></>}
              {ebEvents.length > 0 && <><span>·</span><span className="text-purple-400">{ebEvents.length} via Eventbrite</span></>}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search events, venues, cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50"
          />
        </div>

        {/* Category tabs */}
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="bg-white/5 border border-white/10 h-auto p-1 flex-wrap gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 text-sm px-3 py-1.5 rounded-lg transition-all"
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {cat.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* City + Free toggle row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeCity === c
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {hasGps && (
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="whitespace-nowrap">Within</span>
              <select aria-label="Event search radius" value={radiusMiles} onChange={(event) => setRadiusMiles(Number(event.target.value))} className="bg-transparent text-white outline-none [&>option]:text-foreground">
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
              </select>
            </label>
          )}

          <button
            onClick={() => setFreeOnly(!freeOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              freeOnly
                ? "bg-green-500/20 border-green-500/40 text-green-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
            }`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${freeOnly ? "bg-green-500 border-green-500" : "border-gray-500"}`}>
              {freeOnly && <span className="text-white text-xs">✓</span>}
            </span>
            Free events only
          </button>
        </div>
      </div>

      {/* Events grid */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-5 space-y-3">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-5 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
                <Skeleton className="h-9 w-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : allEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌻</div>
            <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              {searchQuery
                ? `No events match "${searchQuery}" — try a different search term.`
                : freeOnly || category !== "all" || city !== "All Cities"
                ? "Try adjusting your filters — there may be events in other categories or cities."
                : "No events posted yet. Check back soon or ask an admin to post one!"}
            </p>
            {(freeOnly || category !== "all" || city !== "All Cities" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-white/20 text-gray-300 hover:text-white"
                onClick={() => {
                  setCategory("all");
                  setCity("All Cities");
                  setFreeOnly(false);
                  setSearchQuery("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(allEvents as Array<{
              id: number;
              title: string;
              description?: string | null;
              category: string;
              eventDate: Date | string;
              endDate?: Date | string | null;
              venueName?: string | null;
              address?: string | null;
              city: string;
              isFree: boolean;
              priceCents: number;
              externalUrl?: string | null;
              imageUrl?: string | null;
              rsvpCount: number;
              source?: string;
              lat?: number | null;
              lng?: number | null;
            }>).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRsvp={user ? handleRsvp : undefined}
                rsvpLoading={rsvpingId === event.id}
                hasRsvped={rsvpedIds.has(event.id)}
                introductionOptIn={introductionOptInIds.has(event.id)}
                onToggleIntroductionOptIn={user ? handleIntroductionOptIn : undefined}
                introductionLoading={introductionOptInMutation.isPending}
                onRequestSallyIntroduction={user ? handleRequestSallyIntroduction : undefined}
                introductionRequestLoading={introductionRequestMutation.isPending}
                onToggleInterest={user ? handleToggleInterest : undefined}
                isInterested={interestedIds.has(event.id)}
                interestLoading={interestingId === event.id}
                userLat={hasGps ? userLat : undefined}
                userLng={hasGps ? userLng : undefined}
                interestedCount={0}
              />
            ))}
          </div>
        )}

        {/* Eventbrite callout (shown when no token configured) */}
        <div className="mt-10 bg-white/3 border border-white/8 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Want even more events?</p>
          <p className="text-sm text-gray-400">
            Connect your free{" "}
            <a
              href="https://www.eventbrite.com/platform/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
            >
              Eventbrite API key
            </a>{" "}
            to pull in hundreds of local events automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
