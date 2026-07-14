import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MapPin, Calendar, Users, Search, CheckCircle, BookOpen, GraduationCap, Newspaper, ExternalLink } from "lucide-react";
import { MapView } from "@/components/Map";

const CATEGORIES = [
  { id: "all", label: "All Activities", emoji: "✨" },
  { id: "bowling", label: "Bowling", emoji: "🎳" },
  { id: "mini_golf", label: "Mini Golf", emoji: "⛳" },
  { id: "kayaking", label: "Kayaking", emoji: "🛶" },
  { id: "movies", label: "Movies", emoji: "🎬" },
  { id: "dining", label: "Dining", emoji: "🍽️" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "cooking_class", label: "Cooking", emoji: "👨‍🍳" },
  { id: "escape_room", label: "Escape Room", emoji: "🔐" },
  { id: "hiking", label: "Hiking", emoji: "🥾" },
  { id: "library", label: "Library", emoji: "📚" },
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
  { id: "community", label: "Community", emoji: "🤝" },
  { id: "outdoors", label: "Outdoors", emoji: "🌿" },
  { id: "other", label: "Other", emoji: "🌟" },
];

const SOURCE_META: Record<string, { label: string; colorClass: string; icon: string }> = {
  milwaukee_library: { label: "Milwaukee Library", colorClass: "bg-blue-100 text-blue-700", icon: "📚" },
  waukesha_library: { label: "Waukesha Library", colorClass: "bg-blue-100 text-blue-700", icon: "📚" },
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
};

// Source groups for quick filtering
const LIBRARY_SOURCES = ["milwaukee_library", "waukesha_library"];
const NEWSPAPER_SOURCES = ["jsonline", "milwaukee_journal", "waukesha_freeman", "newspaper", "onmilwaukee"];
const COLLEGE_SOURCES = ["uwm", "marquette", "college", "university"];
const COMMUNITY_SOURCES = ["church", "senior_center", "youth_group", "neighborhood", "general", "community"];

export default function ActivityBoard() {
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

  const { data: profile } = trpc.profile.get.useQuery();
  const userCity = profile?.city ?? undefined;
  const userLat = profile?.latitude ? parseFloat(profile.latitude) : undefined;
  const userLng = profile?.longitude ? parseFloat(profile.longitude) : undefined;

  const { data: sallyRecs, isLoading: recsLoading } = trpc.activityBoard.getSallyRecommendations.useQuery({});
  const { data: activities, refetch } = trpc.activityBoard.getAll.useQuery({
    city: userCity,
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const effectiveCity = showAllCities ? undefined : (userCity ? userCity.split(",")[0].trim() : "Milwaukee");

  // Use lat/lng radius query when user has location, otherwise fall back to city name
  const useRadiusQuery = !showAllCities && userLat !== undefined && userLng !== undefined;

  const { data: communityEvents, isLoading: communityLoading } = trpc.events.list.useQuery({
    city: useRadiusQuery ? undefined : effectiveCity,
    lat: useRadiusQuery ? userLat : undefined,
    lng: useRadiusQuery ? userLng : undefined,
    radiusMiles: useRadiusQuery ? 90 : undefined,
    category: communityCategory === "all" ? undefined : communityCategory,
    isFree: showFreeOnly ? true : undefined,
    limit: 150,
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">
            What's Happening Near {userCity ?? "You"}
          </h1>
          <p className="text-gray-600">
            {userCity
              ? `Showing activities in and around ${userCity} — stop putzing around alone!`
              : "Stop putzing around alone — find something amazing to do this weekend."}
          </p>
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
            {(communityEvents?.length ?? 0) > 0 && (
              <span className="ml-2 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                {communityEvents!.length}
              </span>
            )}
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
            {/* Quick filters */}
            <div className="flex gap-2 flex-wrap">
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
                                  <MapPin className="w-3.5 h-3.5" />
                                  {(activity as any).venueName}
                                  {(activity as any).venueCity && (
                                    <span className="text-muted-foreground font-normal">
                                      · {(activity as any).venueCity}
                                    </span>
                                  )}
                                </p>
                              )}
                              {(activity.priceCents ?? 0) > 0 ? (
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
                {communityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredCommunity.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="text-6xl mb-4">🏛️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Community Events Coming Soon</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Just Putzit scrapes local libraries, universities, and newspapers nightly. Check back tomorrow for fresh events!
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
                    {filteredCommunity.map((event: any) => {
                      const src = SOURCE_META[(event as any).source ?? "admin"] ?? SOURCE_META.admin;
                      return (
                        <Card key={event.id} className="border border-gray-100 hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                {/* Source badge */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${src.colorClass}`}>
                                    <span>{src.icon}</span>
                                    {src.label}
                                  </span>
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
                                </div>
                              </div>
                              {event.externalUrl && (
                                <a
                                  href={event.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0"
                                >
                                  <Button size="sm" variant="outline" className="rounded-full text-xs gap-1">
                                    Details
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
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
    </div>
  );
}
