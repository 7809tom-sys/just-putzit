import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MapPin, Calendar, Users, Search, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
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

export default function ActivityBoard() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const { data: profile } = trpc.profile.get.useQuery();
  const userCity = profile?.city ?? undefined;

  const { data: sallyRecs, isLoading: recsLoading } = trpc.activityBoard.getSallyRecommendations.useQuery({});
  const { data: activities, refetch } = trpc.activityBoard.getAll.useQuery({
    city: userCity,
    category: selectedCategory === "all" ? undefined : selectedCategory,
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
    // Use Places API to find nearby activities
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
                  icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  },
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

  const categoryEmoji: Record<string, string> = Object.fromEntries(
    CATEGORIES.map(c => [c.id, c.emoji])
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">
            What's Happening Near {userCity ?? "You"}
          </h1>
          <p className="text-gray-600">
            {userCity
              ? `Showing activities in and around ${userCity} — stop putzing around alone!`
              : "Stop putzing around alone — find something amazing to do this weekend."}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search activities, venues, events..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-primary/40"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Activities List */}
          <div className="lg:col-span-2">
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
                          {/* Venue name + city */}
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
                          {/* Price */}
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
          </div>

          {/* Map Panel */}
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

            {/* How It Works */}
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
