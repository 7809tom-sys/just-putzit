/**
 * EventDetail — publicly accessible event page for SEO indexing.
 * Route: /events/:activityId
 * No login required to VIEW — users are prompted to sign up to RSVP.
 */
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Sparkles, ChevronLeft, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";

const CATEGORY_EMOJI: Record<string, string> = {
  bowling: "🎳", mini_golf: "⛳", kayaking: "🛶", movies: "🎬",
  dining: "🍽️", coffee: "☕", cooking_class: "👨‍🍳", escape_room: "🔐",
  wine_tasting: "🍷", hiking: "🥾", park: "🌳", library: "📚",
  church: "⛪", community_center: "🏛️", sports: "⚽", arts: "🎨", other: "✨",
};

export default function EventDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(activityId ?? "0", 10);

  const { data: activity, isLoading, error } = trpc.activityBoard.publicGetById.useQuery(
    { activityId: id },
    { enabled: id > 0 }
  );

  // Build SEO data from activity
  const title = activity
    ? `${activity.title}${activity.venueCity ? ` in ${activity.venueCity}` : ""} — Just Putzit`
    : "Local Activity — Just Putzit";

  const description = activity
    ? `${activity.description ?? activity.title}. Join locals for this ${activity.category?.replace("_", " ")} activity${activity.venueCity ? ` in ${activity.venueCity}` : ""}. Free to join on Just Putzit.`
    : "Discover local activities and date ideas on Just Putzit.";

  useSEO({
    title,
    description,
    canonical: `https://justputzit.com/events/${id}`,
    jsonLd: activity
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          "name": activity.title,
          "description": activity.description ?? activity.title,
          "startDate": activity.eventDate ?? undefined,
          "location": activity.venueAddress
            ? { "@type": "Place", "name": activity.venueName ?? "Local Venue", "address": activity.venueAddress }
            : undefined,
          "organizer": { "@type": "Organization", "name": "Just Putzit", "url": "https://justputzit.com" },
          "url": `https://justputzit.com/events/${id}`,
        }
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center animate-pulse text-2xl">🤖</div>
          <p className="text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="font-display text-2xl font-bold mb-2">Activity Not Found</h1>
          <p className="text-muted-foreground mb-6">This activity may have ended or been removed.</p>
          <Button onClick={() => navigate("/")} className="gradient-sally text-white border-0 rounded-full">
            Browse Activities
          </Button>
        </div>
      </div>
    );
  }

  const emoji = CATEGORY_EMOJI[activity.category ?? "other"] ?? "✨";
  const eventDate = activity.eventDate ? new Date(activity.eventDate) : null;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full gradient-sally flex items-center justify-center text-white font-bold text-xs">JP</div>
              <span className="font-display font-bold text-lg text-foreground">Just Putzit</span>
            </div>
          </button>
          <a href={getLoginUrl()}>
            <Button size="sm" className="gradient-sally text-white border-0 rounded-full">
              Join Free
            </Button>
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="gradient-warm py-16">
        <div className="container max-w-3xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-4xl flex-shrink-0">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              {activity.isSponsored && (
                <Badge className="mb-2 bg-amber-100 text-amber-700 border-0 text-xs">⭐ Featured</Badge>
              )}
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {activity.title}
              </h1>
              {activity.venueCity && (
                <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {activity.venueName ? `${activity.venueName}, ` : ""}{activity.venueCity}
                </p>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {eventDate && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <Calendar className="w-5 h-5 text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold text-sm">{eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
              </div>
            )}
            {activity.durationMinutes && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <Clock className="w-5 h-5 text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-sm">{activity.durationMinutes >= 60 ? `${Math.floor(activity.durationMinutes / 60)}h ${activity.durationMinutes % 60 > 0 ? `${activity.durationMinutes % 60}m` : ""}`.trim() : `${activity.durationMinutes}m`}</p>
              </div>
            )}
            {activity.maxGroupSize && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <Users className="w-5 h-5 text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Group Size</p>
                <p className="font-semibold text-sm">Up to {activity.maxGroupSize}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <h2 className="font-display font-bold text-lg mb-3">About This Activity</h2>
              <p className="text-muted-foreground leading-relaxed">{activity.description}</p>
            </div>
          )}

          {/* CTA */}
          <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-3xl">🤖</div>
            <h2 className="font-display text-2xl font-bold mb-2">Want to Go?</h2>
            <p className="text-muted-foreground mb-6">
              Join Just Putzit free. Sally will match you with someone who'd love this activity too.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="gradient-sally text-white border-0 shadow-lg rounded-full px-8 gap-2">
                <Sparkles className="w-5 h-5" />
                Join Free & RSVP
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Biometric verified · Real people only
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
