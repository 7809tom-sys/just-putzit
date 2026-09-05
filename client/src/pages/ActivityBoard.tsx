import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { toast } from "sonner";
import { MapPin, Calendar, CalendarDays, List, Users, Search, CheckCircle, BookOpen, GraduationCap, Newspaper, ExternalLink, Plus, BellRing, ShieldCheck, Trophy, Megaphone, Bookmark, BookmarkCheck, Share2, SlidersHorizontal, ChevronDown } from "lucide-react";
import { MapView } from "@/components/Map";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";
import { LocationOverrideControl } from "@/components/LocationOverrideControl";
import { useUserCity } from "@/hooks/useUserCity";
import { formatMilesAway, haversineDistanceMiles } from "@shared/geo";
import { filterPersonalizedRecommendations, getRecommendationCategories, type RecommendationSort, type RecommendationTimeWindow } from "@/lib/personalizedRecommendationFilters";

const CATEGORIES = [
  { id: "all", label: "All Activities", emoji: "✨" },
  { id: "bowling", label: "Bowling", emoji: "🎳" },
  { id: "mini_golf", label: "Mini Golf", emoji: "⛳" },
  { id: "go_karts", label: "Go-Karts", emoji: "🏎️" },
  { id: "kayaking", label: "Kayaking", emoji: "🚣" },
  { id: "swimming_pool", label: "Pools", emoji: "🏊" },
  { id: "beach", label: "Beaches", emoji: "🏖️" },
  { id: "basketball", label: "Basketball", emoji: "🏀" },
  { id: "tennis", label: "Tennis", emoji: "🎾" },
  { id: "volleyball", label: "Volleyball", emoji: "🏐" },
  { id: "golf", label: "Golf", emoji: "⛳" },
  { id: "disc_golf", label: "Disc Golf", emoji: "🥏" },
  { id: "dirt_track", label: "Dirt Tracks", emoji: "🏍️" },
  { id: "ymca", label: "YMCA", emoji: "🤝" },
  { id: "public_gym", label: "Public Gyms", emoji: "🏋️" },
  { id: "movies", label: "Movies", emoji: "🎦" },
  { id: "dining", label: "Dining", emoji: "🍽️" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "cooking_class", label: "Cooking", emoji: "👨‍🍳" },
  { id: "escape_room", label: "Escape Room", emoji: "🔐" },
  { id: "hiking", label: "Hiking", emoji: "🥾" },
  { id: "library", label: "Library", emoji: "📚" },
  { id: "church", label: "Churches", emoji: "⛪" },
  { id: "arts", label: "Arts", emoji: "🎨" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "other", label: "Other", emoji: "🌟" },
];

const COMMUNITY_CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "food", label: "Food", emoji: "🍽️" },
  { id: "market", label: "Market", emoji: "🛍️" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "arts", label: "Arts", emoji: "🎨" },
  { id: "comedy", label: "Comedy", emoji: "🎭" },
  { id: "karaoke", label: "Karaoke", emoji: "🎤" },
  { id: "live_music", label: "Live Bands", emoji: "🎸" },
  { id: "community", label: "Community", emoji: "🤝" },
  { id: "outdoors", label: "Outdoors", emoji: "🌿" },
  { id: "other", label: "Other", emoji: "🌟" },
];

const SOURCE_META: Record<string, { label: string; colorClass: string; icon: string }> = {
  milwaukee_library: { label: "Milwaukee Library", colorClass: "bg-blue-100 text-blue-700", icon: "📚" },
  waukesha_library: { label: "Waukesha Library", colorClass: "bg-blue-100 text-blue-700", icon: "📚" },
  waukesha_county_parks: { label: "Waukesha County Parks", colorClass: "bg-emerald-100 text-emerald-700", icon: "🌿" },
  uwm: { label: "UW-Milwaukee", colorClass: "bg-yellow-100 text-yellow-800", icon: "🎓" },
  marquette: { label: "Marquette", colorClass: "bg-yellow-100 text-yellow-800", icon: "🎓" },
  college: { label: "College", colorClass: "bg-yellow-100 text-yellow-800", icon: "🎓" },
  university: { label: "University", colorClass: "bg-yellow-100 text-yellow-800", icon: "🎓" },
  onmilwaukee: { label: "OnMilwaukee", colorClass: "bg-green-100 text-green-700", icon: "📰" },
  jsonline: { label: "Journal Sentinel", colorClass: "bg-red-100 text-red-700", icon: "📰" },
  milwaukee_journal: { label: "Milwaukee Journal", colorClass: "bg-red-100 text-red-700", icon: "📰" },
  waukesha_freeman: { label: "Waukesha Freeman", colorClass: "bg-red-100 text-red-700", icon: "📰" },
  newspaper: { label: "Local News", colorClass: "bg-red-100 text-red-700", icon: "📰" },
  church: { label: "Church", colorClass: "bg-indigo-100 text-indigo-700", icon: "⛪" },
  senior_center: { label: "Senior Center", colorClass: "bg-teal-100 text-teal-700", icon: "🏥" },
  youth_group: { label: "Youth & Family", colorClass: "bg-pink-100 text-pink-700", icon: "👨‍👩‍👧" },
  neighborhood: { label: "Neighborhood", colorClass: "bg-lime-100 text-lime-700", icon: "🏘️" },
  general: { label: "Community", colorClass: "bg-purple-100 text-purple-700", icon: "🤝" },
  community: { label: "Community", colorClass: "bg-purple-100 text-purple-700", icon: "🤝" },
  eventbrite: { label: "Eventbrite", colorClass: "bg-orange-100 text-orange-700", icon: "🎟️" },
  scraped: { label: "Local", colorClass: "bg-gray-100 text-gray-600", icon: "📍" },
  admin: { label: "Just Putzit", colorClass: "bg-primary/10 text-primary", icon: "✅" },
  chicago_library: { label: "Chicago Public Library", colorClass: "bg-blue-100 text-blue-700", icon: "📚" },
  chicago_museum: { label: "Art Institute of Chicago", colorClass: "bg-rose-100 text-rose-700", icon: "🎨" },
};

// Source groups for quick filtering
const LIBRARY_SOURCES = ["milwaukee_library", "waukesha_library", "chicago_library", "chicago_museum"];
const NEWSPAPER_SOURCES = ["jsonline", "milwaukee_journal", "waukesha_freeman", "newspaper", "onmilwaukee"];
const COLLEGE_SOURCES = ["uwm", "marquette", "college", "university"];
const COMMUNITY_SOURCES = ["church", "senior_center", "youth_group", "neighborhood", "general", "community"];

const BLANK_FORM = {
  title: "",
  description: "",
  category: "community" as const,
  eventDate: "",
  endDate: "",
  venueName: "",
  address: "",
  city: "",
  state: "WI",
  isFree: true,
  priceCents: 0,
  externalUrl: "",
};

export default function ActivityBoard() {
  const { user } = useAuth();
  const reportedSponsoredViews = useRef(new Set<number>());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [communityCategory, setCommunityCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"activities" | "community">("activities");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showCampusOnly, setShowCampusOnly] = useState(false);
  const [showLibrariesOnly, setShowLibrariesOnly] = useState(false);
  const [showNewspapersOnly, setShowNewspapersOnly] = useState(false);
  const [showCollegeOnly, setShowCollegeOnly] = useState(false);
  const [showCommunityOnly, setShowCommunityOnly] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitForm, setSubmitForm] = useState({ ...BLANK_FORM });
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [recommendationSort, setRecommendationSort] = useState<RecommendationSort>("relevance");
  const [recommendationTimeWindow, setRecommendationTimeWindow] = useState<RecommendationTimeWindow>("any");
  const [recommendationCategory, setRecommendationCategory] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [communitySort, setCommunitySort] = useState<"date" | "distance" | "trending">("date");
  const [communityView, setCommunityView] = useState<"list" | "calendar">("list");
  const [selectedCommunityDate, setSelectedCommunityDate] = useState<Date | undefined>();
  const [, navigate] = useLocation();
  const [pickupForm, setPickupForm] = useState({
    activityType: "basketball" as "basketball" | "bowling_singles" | "other",
    title: "Pickup basketball — 3:00–5:00 PM",
    description: "Open pickup basketball at a public gym. Confirm court access or guest rules before you go.",
    venueName: "",
    venueAddress: "",
    startAt: "",
    endAt: "",
    capacity: 10,
  });

  const { data: profile } = trpc.profile.get.useQuery();
  const { detectedCity } = useUserCity();
  const userCity = detectedCity?.city ?? profile?.city ?? undefined;
  const userLat = detectedCity?.lat ?? (profile?.latitude ? parseFloat(profile.latitude) : undefined);
  const userLng = detectedCity?.lng ?? (profile?.longitude ? parseFloat(profile.longitude) : undefined);

  const utils = trpc.useUtils();
  const { data: sallyRecs, isLoading: recsLoading } = trpc.activityBoard.getSallyRecommendations.useQuery({});
  const { data: rememberedActivities } = trpc.activityBoard.getPersonalized.useQuery();
  const { data: activities, refetch } = trpc.activityBoard.getAll.useQuery({
    city: userCity,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    lat: userLat,
    lng: userLng,
    radiusMiles,
  });
  const { data: pickupSessions, refetch: refetchPickups } = trpc.pickupActivities.list.useQuery({ city: userCity?.split(",")[0].trim() });
  const { data: pickupAlerts } = trpc.pickupActivities.alertPreference.useQuery();

  const effectiveCity = showAllCities ? undefined : (userCity ? userCity.split(",")[0].trim() : "Milwaukee");

  // Use lat/lng radius query when user has location, otherwise fall back to city name
  const useRadiusQuery = !showAllCities && userLat !== undefined && userLng !== undefined;

  const { data: communityEvents, isLoading: communityLoading } = trpc.events.list.useQuery({
    city: useRadiusQuery ? undefined : effectiveCity,
    lat: useRadiusQuery ? userLat : undefined,
    lng: useRadiusQuery ? userLng : undefined,
    radiusMiles: useRadiusQuery ? radiusMiles : undefined,
    category: communityCategory === "all" ? undefined : communityCategory,
    isFree: showFreeOnly ? true : undefined,
    limit: 150,
  });
  const { data: bookmarkedEventIds } = trpc.activityBoard.bookmarks.useQuery(undefined, { enabled: Boolean(user) });
  const toggleBookmark = trpc.activityBoard.toggleBookmark.useMutation({
    onSuccess: (result) => {
      void utils.activityBoard.bookmarks.invalidate();
      toast.success(result.bookmarked ? "Event saved for later." : "Removed from saved events.");
    },
    onError: () => toast.error("Couldn’t update saved events. Please try again."),
  });

  const rsvpMutation = trpc.activityBoard.rsvp.useMutation({
    onSuccess: () => {
      toast.success("You're going! Sally will send you a reminder. 🎉");
      refetch();
    },
  });

  const checkInMutation = trpc.activityBoard.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Checked in! Have an amazing time! ✨");
    },
  });

  const sponsoredMetricMutation = trpc.vendor.trackSponsoredMetric.useMutation();
  const reportSponsoredMetric = useCallback((activityId: number, eventType: "view" | "click") => {
    sponsoredMetricMutation.mutate({ activityId, eventType });
  }, [sponsoredMetricMutation]);

  useEffect(() => {
    for (const activity of activities ?? []) {
      if (activity.isSponsored && !reportedSponsoredViews.current.has(activity.id)) {
        reportedSponsoredViews.current.add(activity.id);
        reportSponsoredMetric(activity.id, "view");
      }
    }
  }, [activities, reportSponsoredMetric]);

  const pickupAlertMutation = trpc.pickupActivities.setAlertPreference.useMutation({
    onSuccess: () => utils.pickupActivities.alertPreference.invalidate(),
  });
  const pickupCreateMutation = trpc.pickupActivities.create.useMutation({
    onSuccess: ({ notifiedCount }) => {
      toast.success(notifiedCount > 0 ? `Public pickup posted — ${notifiedCount} nearby members were alerted.` : "Public pickup posted. It is now available to nearby members who opt in.");
      setShowPickupDialog(false);
      refetchPickups();
    },
    onError: (error) => toast.error(error.message),
  });
  const pickupJoinMutation = trpc.pickupActivities.join.useMutation({
    onSuccess: () => {
      toast.success("You’re in! Meet at the public venue and confirm access before you go.");
      refetchPickups();
    },
    onError: (error) => toast.error(error.message),
  });
  const submitMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event submitted! It's now live in the community feed. 🎉");
      setShowSubmitDialog(false);
      setSubmitForm({ ...BLANK_FORM });
      utils.events.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit event. Please try again.");
    },
  });

  function handleSubmitEvent() {
    if (!submitForm.title.trim()) { toast.error("Event title is required."); return; }
    if (!submitForm.eventDate) { toast.error("Event date & time is required."); return; }
    if (!submitForm.city.trim()) { toast.error("City is required."); return; }
    submitMutation.mutate({
      title: submitForm.title.trim(),
      description: submitForm.description.trim() || undefined,
      category: submitForm.category,
      eventDate: new Date(submitForm.eventDate).toISOString(),
      endDate: submitForm.endDate ? new Date(submitForm.endDate).toISOString() : undefined,
      venueName: submitForm.venueName.trim() || undefined,
      address: submitForm.address.trim() || undefined,
      city: submitForm.city.trim(),
      state: submitForm.state.trim() || "WI",
      isFree: submitForm.isFree,
      priceCents: submitForm.isFree ? 0 : submitForm.priceCents,
      externalUrl: submitForm.externalUrl.trim() || undefined,
    });
  }

  function applyPickupTemplate(type: "basketball" | "bowling_singles" | "other") {
    const templates = {
      basketball: { title: "Pickup basketball — 3:00–5:00 PM", description: "Open pickup basketball at a public gym. Confirm court access or guest rules before you go." },
      bowling_singles: { title: "Bowling Singles Mixer", description: "A low-pressure public bowling mixer for singles. Confirm lane availability with the alley before you go." },
      other: { title: "Public pickup activity", description: "A public-venue activity for nearby members." },
    };
    setPickupForm((current) => ({ ...current, activityType: type, ...templates[type] }));
  }

  function handleCreatePickup() {
    if (!pickupForm.startAt) { toast.error("Choose a public start time."); return; }
    if (!pickupForm.venueName.trim()) { toast.error("Name the public venue so members can decide safely."); return; }
    pickupCreateMutation.mutate({
      ...pickupForm,
      title: pickupForm.title.trim(),
      description: pickupForm.description.trim() || undefined,
      city: userCity?.split(",")[0].trim() || "Milwaukee",
      state: detectedCity?.state || profile?.state || "WI",
      venueName: pickupForm.venueName.trim(),
      venueAddress: pickupForm.venueAddress.trim() || undefined,
      startAt: new Date(pickupForm.startAt).toISOString(),
      endAt: pickupForm.endAt ? new Date(pickupForm.endAt).toISOString() : undefined,
    });
  }

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setMapReady(true);
    const service = new google.maps.places.PlacesService(map);
    const center = map.getCenter();
    if (!center) return;
    const types = ["library", "bowling_alley", "movie_theater", "restaurant", "park", "gym", "spa"];
    types.forEach(type => {
      service.nearbySearch(
        { location: center, radius: 5000, type },
        (results, status) => {
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
        }
      );
    });
  }, []);

  const filteredActivities = activities?.filter(a =>
    searchQuery === "" ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const rememberedRecommendationCategories = getRecommendationCategories((rememberedActivities?.activities ?? []) as any[]);
  const filteredRememberedActivities = filterPersonalizedRecommendations({
    activities: (rememberedActivities?.activities ?? []) as any[],
    category: recommendationCategory,
    timeWindow: recommendationTimeWindow,
    sortBy: recommendationSort,
    userLat,
    userLng,
  });

  const filteredCommunity = (communityEvents ?? []).filter((e: typeof communityEvents extends (infer T)[] | undefined ? T : never) => {
    const matchesSearch = searchQuery === "" ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCampus = !showCampusOnly || (e as any).isOnCampus;
    const src = (e as any).source ?? "admin";
    // Only one source filter can be active at a time
    const activeSourceFilter = showLibrariesOnly ? LIBRARY_SOURCES
      : showNewspapersOnly ? NEWSPAPER_SOURCES
      : showCollegeOnly ? COLLEGE_SOURCES
      : showCommunityOnly ? COMMUNITY_SOURCES
      : null;
    const matchesSource = !activeSourceFilter || activeSourceFilter.includes(src);
    return matchesSearch && matchesCampus && matchesSource;
  });

  const sortedCommunity = useMemo(() => [...filteredCommunity].sort((a: any, b: any) => {
    if (communitySort === "trending") {
      const engagementDifference = Number(b.interestCount ?? 0) - Number(a.interestCount ?? 0);
      return engagementDifference || new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    }
    if (communitySort === "distance" && userLat !== undefined && userLng !== undefined) {
      const distance = (event: any) => event.lat != null && event.lng != null
        ? haversineDistanceMiles(userLat, userLng, Number(event.lat), Number(event.lng))
        : Number.POSITIVE_INFINITY;
      return distance(a) - distance(b);
    }
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
  }), [filteredCommunity, communitySort, userLat, userLng]);

  const calendarEventDates = useMemo(() => sortedCommunity.reduce<Date[]>((dates, event: any) => {
    const eventDate = new Date(event.eventDate);
    return Number.isNaN(eventDate.getTime()) ? dates : [...dates, eventDate];
  }, []), [sortedCommunity]);
  const selectedCommunityEvents = useMemo(() => {
    if (!selectedCommunityDate) return sortedCommunity;
    const selectedDay = selectedCommunityDate.toDateString();
    return sortedCommunity.filter((event: any) => new Date(event.eventDate).toDateString() === selectedDay);
  }, [selectedCommunityDate, sortedCommunity]);

  async function shareEvent(event: { title: string; id: number }) {
    const url = `${window.location.origin}/events/${event.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: `Check out ${event.title} on Just Putzit`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Event link copied.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") toast.error("Couldn’t share this event. Try copying the link from its details page.");
    }
  }

  const categoryEmoji: Record<string, string> = Object.fromEntries(
    CATEGORIES.map(c => [c.id, c.emoji])
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Sally's Recommendation Banner */}
      {(sallyRecs || recsLoading) && (
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">
              What's Happening Near {userCity ?? "You"}
            </h1>
            <p className="text-gray-600">
              {userCity
                ? `Showing activities in and around ${userCity} — stop putzing around alone!`
                : "Stop putzing around alone — find something amazing to do this weekend."}
            </p>
          </div>
          {user && activeTab === "community" && (
            <Button
              onClick={() => {
                setSubmitForm(f => ({ ...f, city: userCity?.split(",")[0].trim() ?? "" }));
                setShowSubmitDialog(true);
              }}
              className="flex-shrink-0 bg-primary hover:bg-primary/90 text-white rounded-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Event
            </Button>
          )}
          {user && activeTab === "activities" && (
            <Button onClick={() => setShowPickupDialog(true)} className="flex-shrink-0 bg-primary hover:bg-primary/90 text-white rounded-full gap-2">
              <Plus className="w-4 h-4" /> Plan a public pickup
            </Button>
          )}
        </div>

        <div className="mb-6 max-w-xl">
          <LocationOverrideControl compact />
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "activities"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🎯 Local Activities
            <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{filteredActivities.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "community"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🏛️ Community Events
            <span className="ml-2 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
              {sortedCommunity.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={activeTab === "activities" ? "Search activities, venues..." : "Search community events..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {useRadiusQuery && (
          <label className="mb-5 inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Show within</span>
            <select aria-label="Activity search radius" value={radiusMiles} onChange={(event) => setRadiusMiles(Number(event.target.value))} className="bg-transparent font-semibold text-gray-900 outline-none">
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
            </select>
            <span>of your GPS location</span>
          </label>
        )}

        {/* Category Filter — Activities Tab */}
        {activeTab === "activities" && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-8" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-primary/40"
                }`}
              >
                <span className="text-base leading-none flex-shrink-0">{cat.emoji}</span>
                <span className="flex-shrink-0">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "activities" && (
          <section className="mb-8 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/8 via-white to-amber-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Pick-up moments near you</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">People who like what you like</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">We use your saved, going, and attended activity signals to surface similar public activities. No private profile data is shared.</p>
              </div>
              <Button variant={pickupAlerts?.enabled ? "outline" : "default"} onClick={() => pickupAlertMutation.mutate({ enabled: !pickupAlerts?.enabled, city: userCity?.split(",")[0].trim(), categories: ["basketball", "bowling", "sports", "community"] })} className="rounded-full gap-2">
                <BellRing className="h-4 w-4" /> {pickupAlerts?.enabled ? "Pickup alerts on" : "Get pickup alerts"}
              </Button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(pickupSessions ?? []).slice(0, 4).map((session: any) => (
                <div key={session.id} className="rounded-xl border border-gray-100 bg-white/90 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2"><span className="text-xl">{session.activityType === "basketball" ? "🏀" : session.activityType === "bowling_singles" ? "🎳" : "✨"}</span><h3 className="font-semibold text-gray-900">{session.title}</h3></div>
                      {session.recommended && <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/10">Matches your activity interests</Badge>}
                      <p className="mt-2 text-sm text-gray-600">{new Date(session.startAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {session.venueName}</p>
                      <p className="mt-1 text-xs text-gray-500">{session.participantCount}/{session.capacity} opt-in participants · public venue</p>
                    </div>
                    <Button size="sm" disabled={session.joined || pickupJoinMutation.isPending} onClick={() => pickupJoinMutation.mutate({ sessionId: session.id })} className="rounded-full">
                      {session.joined ? "Joined" : "I’m in"}
                    </Button>
                  </div>
                </div>
              ))}
              {(pickupSessions?.length ?? 0) === 0 && (
                <div className="rounded-xl border border-dashed border-primary/25 bg-white/70 p-4 text-sm text-gray-600 md:col-span-2">
                  No public pickup activities are posted nearby yet. Be the first to plan basketball, a bowling singles mixer, or another safe public activity.
                </div>
              )}
            </div>
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Public venues only. Just Putzit does not show participant rosters or private locations; confirm access, venue rules, and reservations before you go.</div>
          </section>
        )}

        {activeTab === "activities" && (rememberedActivities?.activities?.length ?? 0) > 0 && (
          <section className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Your activity memory</p>
                <h2 className="mt-1 font-display text-xl font-bold text-gray-900">Similar activities based on what you like</h2>
                <p className="mt-1 text-sm text-gray-600">We remember your saved, going, and attended community interests to prioritize similar public options nearby.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-white/80 p-3 md:col-span-2">
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="text-xs font-semibold text-gray-600">Sort
                    <select value={recommendationSort} onChange={(event) => setRecommendationSort(event.target.value as RecommendationSort)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-800">
                      <option value="relevance">Best match</option>
                      <option value="distance">Closest first</option>
                      <option value="time">Soonest first</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-gray-600">Time
                    <select value={recommendationTimeWindow} onChange={(event) => setRecommendationTimeWindow(event.target.value as RecommendationTimeWindow)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-800">
                      <option value="any">Any time</option>
                      <option value="today">Today</option>
                      <option value="next_7_days">Next 7 days</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-gray-600">Activity
                    <select value={recommendationCategory} onChange={(event) => setRecommendationCategory(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-800">
                      <option value="all">All activities</option>
                      {rememberedRecommendationCategories.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              {filteredRememberedActivities.slice(0, 4).map((activity: any) => (
                <div key={activity.id} className="rounded-xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900">{activity.title}</h3>{activity.isSponsored && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1"><Megaphone className="h-3 w-3" /> Sponsored</Badge>}</div><p className="mt-1 text-sm text-gray-600">{activity.venueName ?? "Local public venue"}{activity.venueCity ? ` · ${activity.venueCity}` : ""}</p>{activity.distanceMiles !== undefined && <p className="mt-1 text-xs font-medium text-emerald-700">{formatMilesAway(activity.distanceMiles)} away</p>}</div><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{activity.category}</Badge></div>
                </div>
              ))}
              {filteredRememberedActivities.length === 0 && (
                <div className="rounded-xl border border-dashed border-emerald-200 bg-white/70 p-4 text-sm text-gray-600 md:col-span-2">No saved-interest recommendations match these filters yet. Try a broader time window or a different activity category.</div>
              )}
            </div>
          </section>
        )}

        {/* Category + Filter Row — Community Tab */}
        {activeTab === "community" && (
          <div className="mb-6 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {COMMUNITY_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCommunityCategory(cat.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    communityCategory === cat.id
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-primary/40"
                  }`}
                >
                  <span className="text-base leading-none flex-shrink-0">{cat.emoji}</span>
                  <span className="flex-shrink-0">{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFreeOnly(v => !v)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  showFreeOnly
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                }`}
              >
                🆓 Free Events Only
              </button>
              <button
                onClick={() => setShowCampusOnly(v => !v)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  showCampusOnly
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-yellow-400"
                }`}
              >
                🎓 Campus Events Only
              </button>
              <button
                type="button"
                onClick={() => setShowMoreFilters((visible) => !visible)}
                aria-expanded={showMoreFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary/40"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> More filters
                <ChevronDown className={`h-3.5 w-3.5 ${showMoreFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
            {showMoreFilters && (
              <div className="flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <button
                onClick={() => { setShowLibrariesOnly(v => !v); setShowNewspapersOnly(false); setShowCollegeOnly(false); setShowCommunityOnly(false); }}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  showLibrariesOnly
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                📚 Libraries
              </button>
              <button
                onClick={() => { setShowNewspapersOnly(v => !v); setShowLibrariesOnly(false); setShowCollegeOnly(false); setShowCommunityOnly(false); }}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  showNewspapersOnly
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-red-400"
                }`}
              >
                📰 Newspapers
              </button>
              <button
                onClick={() => { setShowCollegeOnly(v => !v); setShowLibrariesOnly(false); setShowNewspapersOnly(false); setShowCommunityOnly(false); }}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  showCollegeOnly
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-yellow-400"
                }`}
              >
                🎓 College & University
              </button>
              <button
                onClick={() => { setShowCommunityOnly(v => !v); setShowLibrariesOnly(false); setShowNewspapersOnly(false); setShowCollegeOnly(false); }}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  showCommunityOnly
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400"
                }`}
              >
                ⛪🏥👨‍👩‍👧 Churches, Seniors & Youth
              </button>
              {userCity && (
                <button
                  onClick={() => setShowAllCities(v => !v)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    showAllCities
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-400"
                  }`}
                >
                  🌍 {showAllCities ? `All Cities` : `${userCity.split(",")[0].trim()} Only`}
                </button>
              )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-xs font-medium text-gray-600">{sortedCommunity.length} current event{sortedCommunity.length === 1 ? "" : "s"} found</p>
              <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Community Events view" className="flex rounded-lg border border-gray-200 p-0.5">
                  <Button type="button" size="sm" variant={communityView === "list" ? "secondary" : "ghost"} className="h-7 gap-1 px-2 text-xs" onClick={() => setCommunityView("list")} aria-pressed={communityView === "list"}><List className="h-3.5 w-3.5" /> List</Button>
                  <Button type="button" size="sm" variant={communityView === "calendar" ? "secondary" : "ghost"} className="h-7 gap-1 px-2 text-xs" onClick={() => setCommunityView("calendar")} aria-pressed={communityView === "calendar"}><CalendarDays className="h-3.5 w-3.5" /> Calendar</Button>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  Sort
                  <select aria-label="Sort community events" value={communitySort} onChange={(event) => setCommunitySort(event.target.value as "date" | "distance" | "trending")} className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800">
                    <option value="date">Date</option>
                    <option value="distance">Distance</option>
                    <option value="trending">Trending</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* ── Activities Tab ── */}
            {activeTab === "activities" && (
              <>
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Sally Is Scouting Your Area!</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
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
                    {filteredActivities.map(activity => (
                      <Card key={activity.id} className="border border-gray-100 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{categoryEmoji[activity.category] ?? "✨"}</span>
                                <h3 className="font-bold text-gray-900 text-lg">{activity.title}</h3>
                                {activity.isSponsored && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1"><Megaphone className="h-3 w-3" /> Sponsored</Badge>}
                              </div>
                              {activity.description && (
                                <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                {activity.eventDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(activity.eventDate).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
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
                              {(activity as any).venueName && (
                                <p className="text-sm font-medium text-primary mt-2 flex items-center gap-1">
                                  {(activity as any).distanceMiles != null ? (
                                    <span className="mr-1 text-xs font-semibold text-orange-600">{formatMilesAway((activity as any).distanceMiles)}</span>
                                  ) : userLat !== undefined && userLng !== undefined && (activity as any).venueLat != null && (activity as any).venueLng != null ? (
                                    <span className="mr-1 text-xs font-semibold text-orange-600">{formatMilesAway(haversineDistanceMiles(userLat, userLng, Number((activity as any).venueLat), Number((activity as any).venueLng)))}</span>
                                  ) : null}
                                  <MapPin className="w-3.5 h-3.5" />
                                  {(activity as any).venueName}
                                  {(activity as any).venueCity && (
                                    <span className="text-muted-foreground font-normal">
                                      · {(activity as any).venueCity}
                                    </span>
                                  )}
                                </p>
                              )}
                              {((activity as any).isPublicAccess || (activity as any).venueIsPublicAccess) && (
                                <div className="mt-2 space-y-1">
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Open to the public</Badge>
                                  <p className="text-xs text-gray-500">
                                    {(activity as any).accessNotes ?? (activity as any).venueAccessNotes ?? "Confirm current hours, guest rules, reservations, and fees before you go."}
                                  </p>
                                </div>
                              )}
                              {(activity as any).venueWebsite && (
                                <a
                                  href={(activity as any).venueWebsite}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => activity.isSponsored && reportSponsoredMetric(activity.id, "click")}
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  Check access & hours <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {((activity as any).isPublicAccess || (activity as any).venueIsPublicAccess) ? (
                                <p className="text-xs text-gray-500 mt-1">Public access · fees or reservations may apply</p>
                              ) : (activity.priceCents ?? 0) > 0 ? (
                                <p className="text-xs text-gray-500 mt-1">
                                  ${((activity.priceCents ?? 0) / 100).toFixed(2)} per person
                                </p>
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
                                onClick={() => rsvpMutation.mutate({ activityId: activity.id })}
                                disabled={rsvpMutation.isPending}
                              >
                                I'm Going! 🙋
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs"
                                onClick={() => checkInMutation.mutate({ activityId: activity.id })}
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
              </>
            )}

            {/* ── Community Events Tab ── */}
            {activeTab === "community" && (
              <>
                <LocalVenueBanner page="activity_board" className="mb-4" />
              </>)
            }
            {activeTab === "community" && (
              <>
                {communityView === "calendar" && (
                  <section className="mb-4 grid gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
                    <div className="overflow-x-auto rounded-xl bg-white p-1">
                      <CalendarWidget
                        mode="single"
                        selected={selectedCommunityDate}
                        onSelect={setSelectedCommunityDate}
                        defaultMonth={calendarEventDates[0] ?? new Date()}
                        modifiers={{ hasEvents: calendarEventDates }}
                        modifiersClassNames={{ hasEvents: "font-bold text-primary underline decoration-primary/50 decoration-2 underline-offset-4" }}
                        aria-label="Community Events calendar"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Calendar view</p>
                      <h2 className="mt-1 text-lg font-bold text-gray-900">{selectedCommunityDate ? selectedCommunityDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Choose a day"}</h2>
                      <p className="mt-1 text-sm text-gray-600">{selectedCommunityDate ? `${selectedCommunityEvents.length} current event${selectedCommunityEvents.length === 1 ? "" : "s"} match this day.` : "Dates with current events are underlined. Select a day to narrow the cards below."}</p>
                      {selectedCommunityDate && <Button type="button" size="sm" variant="ghost" className="mt-2 w-fit px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => setSelectedCommunityDate(undefined)}>Show all current events</Button>}
                      {selectedCommunityDate && selectedCommunityEvents.length > 0 && <div className="mt-3 space-y-2">{selectedCommunityEvents.slice(0, 3).map((event: any) => <button key={event.id} type="button" className="block w-full rounded-lg border border-gray-100 bg-white px-3 py-2 text-left text-xs font-medium text-gray-800 hover:border-primary/30" onClick={() => navigate(`/events/${event.id}`)}>{event.title}</button>)}</div>}
                    </div>
                  </section>
                )}
                {communityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : selectedCommunityEvents.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="text-6xl mb-4">🏛️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{communityView === "calendar" && selectedCommunityDate ? "No Current Events on This Day" : "Community Events Coming Soon"}</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      {communityView === "calendar" && selectedCommunityDate ? "Try another date or clear the day selection to review every current event matching your filters." : "Just Putzit scrapes local libraries, universities, and newspapers nightly. Check back tomorrow for fresh events!"}
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto text-sm text-gray-600">
                      {[
                        { icon: "📚", text: "Milwaukee Public Library" },
                        { icon: "📚", text: "Waukesha Public Library" },
                        { icon: "🎓", text: "UW-Milwaukee" },
                        { icon: "🎓", text: "Marquette University" },
                        { icon: "📰", text: "Milwaukee Journal Sentinel" },
                        { icon: "📰", text: "Waukesha Freeman" },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <span>{s.icon}</span>
                          <span className="text-xs">{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCommunityEvents.flatMap((event: any, index: number) => {
                      const src = SOURCE_META[(event as any).source ?? "admin"] ?? SOURCE_META.admin;
                      const bookmarked = bookmarkedEventIds?.includes(event.id) ?? false;
                      const eventCard = (
                        <Card key={event.id} className="border border-gray-100 hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                {/* Source badge */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${src.colorClass}`}>
                                    <span>{src.icon}</span>
                                    {src.label}
                                  </span>
                                  {event.category && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                                      {COMMUNITY_CATEGORIES.find((category) => category.id === event.category)?.emoji ?? "✨"} {event.category.replaceAll("_", " ")}
                                    </span>
                                  )}
                                  {event.isFree && (
                                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                      🆓 Free
                                    </span>
                                  )}
                                  {(event as any).isOnCampus && (
                                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                      🎓 Campus
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-gray-900 text-base mb-1">{event.title}</h3>
                                {event.description && (
                                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                                )}
                                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                  {event.eventDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                  {event.venueName && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {event.venueName}
                                    </span>
                                  )}
                                  {userLat !== undefined && userLng !== undefined && event.lat != null && event.lng != null && (
                                    <span className="flex items-center gap-1 font-semibold text-orange-600">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {formatMilesAway(haversineDistanceMiles(userLat, userLng, Number(event.lat), Number(event.lng)))}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                                {user && (
                                  <Button size="sm" variant="outline" aria-label={bookmarked ? `Remove ${event.title} from saved events` : `Save ${event.title} for later`} aria-pressed={bookmarked} disabled={toggleBookmark.isPending} onClick={() => toggleBookmark.mutate({ activityId: event.id })} className="rounded-full text-xs gap-1">
                                    {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />} Save
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => void shareEvent(event)} className="rounded-full text-xs gap-1">
                                  <Share2 className="h-3.5 w-3.5" /> Share
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => navigate(`/events/${event.id}`)} className="rounded-full text-xs gap-1">
                                  More info <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                      if (index !== 1) return [eventCard];
                      return [
                        eventCard,
                        <Card key="native-sponsor-cta" className="border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50">
                          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700"><Megaphone className="h-4 w-4" /></div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">For local partners</p>
                                <p className="mt-1 font-semibold text-gray-900">Put your activity in front of nearby people ready to make plans.</p>
                                <p className="mt-1 text-xs text-gray-600">Sponsored placements are clearly labeled. Member profiles remain private.</p>
                              </div>
                            </div>
                            <Link href="/vendor" className="shrink-0">
                              <Button size="sm" variant="outline" className="rounded-full border-amber-300 bg-white text-amber-900">Promote an activity</Button>
                            </Link>
                          </CardContent>
                        </Card>,
                      ];
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map + Sidebar Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Activities Near You
                </h3>
                <p className="text-xs text-gray-500 mt-1">Powered by Google Maps</p>
              </div>
              <div className="h-64">
                <MapView onMapReady={handleMapReady} className="w-full h-full" />
              </div>
            </div>

            {/* Community Sources Info */}
            {activeTab === "community" && (
              <div className="bg-gradient-to-br from-blue-50 to-yellow-50 rounded-2xl p-5 border border-blue-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  🏛️ Our Community Sources
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {[
                    { icon: "📚", name: "Milwaukee Public Library", type: "Library" },
                    { icon: "📚", name: "Waukesha Public Library", type: "Library" },
                    { icon: "🎓", name: "UW-Milwaukee", type: "University" },
                    { icon: "🎓", name: "Marquette University", type: "University" },
                    { icon: "📰", name: "OnMilwaukee", type: "News" },
                    { icon: "📰", name: "Milwaukee Journal Sentinel", type: "Newspaper" },
                    { icon: "📰", name: "Waukesha Freeman", type: "Newspaper" },
                    { icon: "📚", name: "Chicago Public Library", type: "Library" },
                    { icon: "🎨", name: "Art Institute of Chicago", type: "Museum" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>{s.icon}</span>
                        <span className="font-medium">{s.name}</span>
                      </span>
                      <span className="text-xs text-gray-400">{s.type}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">Updated nightly · Free to browse</p>
              </div>
            )}

            {/* How It Works */}
            {activeTab === "activities" && (
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
                <h3 className="font-bold text-gray-900 mb-3">How Just Putzit Works</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {[
                    { emoji: "🤖", text: "Sally learns your interests through daily interviews" },
                    { emoji: "🎯", text: "She matches you with compatible people nearby" },
                    { emoji: "📅", text: "Suggests activities you'll both love this weekend" },
                    { emoji: "🎉", text: "You show up and have an amazing time!" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-lg">{step.emoji}</span>
                      <span>{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor CTA */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Own a Local Venue?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Partner with Just Putzit and we'll send verified, activity-ready customers directly to your door.
              </p>
              <Button variant="outline" size="sm" className="w-full rounded-full" onClick={() => toast.info("Vendor partnership inquiries: contact@justputzit.com")}>
                Become a Partner →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit Event Dialog ── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Submit a Local Event</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Know about something happening in your community? Share it here and it'll appear in the Community Events feed immediately.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g. Summer Concert in the Park"
                value={submitForm.title}
                onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))}
                maxLength={255}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                placeholder="Tell people what to expect..."
                value={submitForm.description}
                onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                value={submitForm.category}
                onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value as typeof BLANK_FORM["category"] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="community">🤝 Community</option>
                <option value="music">🎵 Music</option>
                <option value="food">🍽️ Food & Drink</option>
                <option value="market">🛍️ Market</option>
                <option value="sports">⚽ Sports</option>
                <option value="arts">🎨 Arts</option>
                <option value="outdoors">🌿 Outdoors</option>
                <option value="other">🌟 Other</option>
              </select>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time <span className="text-red-500">*</span></label>
                <Input
                  type="datetime-local"
                  value={submitForm.eventDate}
                  onChange={e => setSubmitForm(f => ({ ...f, eventDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={submitForm.endDate}
                  onChange={e => setSubmitForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Venue */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                <Input
                  placeholder="e.g. Riverside Park"
                  value={submitForm.venueName}
                  onChange={e => setSubmitForm(f => ({ ...f, venueName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Input
                  placeholder="123 Main St"
                  value={submitForm.address}
                  onChange={e => setSubmitForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>

            {/* City / State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Milwaukee"
                  value={submitForm.city}
                  onChange={e => setSubmitForm(f => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <Input
                  placeholder="WI"
                  value={submitForm.state}
                  onChange={e => setSubmitForm(f => ({ ...f, state: e.target.value }))}
                  maxLength={2}
                />
              </div>
            </div>

            {/* Free / Paid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitForm(f => ({ ...f, isFree: true, priceCents: 0 }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    submitForm.isFree
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                  }`}
                >
                  🆓 Free
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitForm(f => ({ ...f, isFree: false }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    !submitForm.isFree
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-orange-400"
                  }`}
                >
                  💰 Paid
                </button>
              </div>
              {!submitForm.isFree && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Price (in dollars)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="e.g. 10.00"
                    value={submitForm.priceCents / 100 || ""}
                    onChange={e => setSubmitForm(f => ({ ...f, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                  />
                </div>
              )}
            </div>

            {/* External URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Website / Link</label>
              <Input
                type="url"
                placeholder="https://..."
                value={submitForm.externalUrl}
                onChange={e => setSubmitForm(f => ({ ...f, externalUrl: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEvent}
              disabled={submitMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Event 🎉"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Plan a safe public pickup</DialogTitle>
            <p className="text-sm text-gray-500">Post basketball, a bowling singles mixer, or another activity at a named public venue. Nearby alerts go only to members who opted in.</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-2">
              {(["basketball", "bowling_singles", "other"] as const).map((type) => (
                <Button key={type} type="button" variant={pickupForm.activityType === type ? "default" : "outline"} className="h-auto whitespace-normal rounded-xl py-3 text-xs" onClick={() => applyPickupTemplate(type)}>
                  {type === "basketball" ? "🏀 Pickup basketball" : type === "bowling_singles" ? "🎳 Singles mixer" : "✨ Other"}
                </Button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input value={pickupForm.title} onChange={(event) => setPickupForm((form) => ({ ...form, title: event.target.value }))} placeholder="Pickup title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What should people know?</label>
              <Textarea value={pickupForm.description} onChange={(event) => setPickupForm((form) => ({ ...form, description: event.target.value }))} placeholder="Access, gear, cost, or lane/court information" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Named public venue <span className="text-red-500">*</span></label>
                <Input value={pickupForm.venueName} onChange={(event) => setPickupForm((form) => ({ ...form, venueName: event.target.value }))} placeholder="Public gym or bowling alley" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Public address</label>
                <Input value={pickupForm.venueAddress} onChange={(event) => setPickupForm((form) => ({ ...form, venueAddress: event.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start <span className="text-red-500">*</span></label>
                <Input type="datetime-local" value={pickupForm.startAt} onChange={(event) => setPickupForm((form) => ({ ...form, startAt: event.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <Input type="datetime-local" value={pickupForm.endAt} onChange={(event) => setPickupForm((form) => ({ ...form, endAt: event.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum people</label>
              <Input type="number" min={2} max={20} value={pickupForm.capacity} onChange={(event) => setPickupForm((form) => ({ ...form, capacity: Number(event.target.value) || 2 }))} />
            </div>
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><Trophy className="mr-1 inline h-3.5 w-3.5" /> Use a public venue only. Confirm court, lane, guest, or reservation rules with the venue before you go. Participant rosters are not shown.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPickupDialog(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleCreatePickup} disabled={pickupCreateMutation.isPending} className="rounded-full">{pickupCreateMutation.isPending ? "Posting…" : "Post public pickup"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
