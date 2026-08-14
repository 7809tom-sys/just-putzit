import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExternalLink, X, ChevronLeft, ChevronRight, Megaphone, Share2, Check } from "lucide-react";
import { useLocation } from "wouter";

type PageSlot = "home" | "activities" | "community" | "activity_board" | "gym_buddy" | "gym_detail";

interface LocalVenueBannerProps {
  page: PageSlot;
  className?: string;
}

// ─── Fallback community announcements ────────────────────────────────────────
// Shown when no paid ads are active within the user's radius.
// Rotate deterministically by day-of-week so they feel fresh without randomness.
type FallbackAnnouncement = {
  emoji: string;
  headline: string;
  body: string;
  cta?: string;
  href?: string;
  gradient: string; // Tailwind gradient classes
  labelColor: string;
};

const FALLBACK_ANNOUNCEMENTS: FallbackAnnouncement[] = [
  {
    emoji: "🏙️",
    headline: "Advertise Your Business Here",
    body: "Reach thousands of locals in the Milwaukee/Waukesha area. Banner slots start at $49/mo.",
    cta: "Learn More",
    href: "/advertise",
    gradient: "from-orange-50 to-amber-50",
    labelColor: "text-orange-500",
  },
  {
    emoji: "📅",
    headline: "Submit a Community Event",
    body: "Got something happening in your neighborhood? Post it on the Activity Board — it's free!",
    cta: "Post Event",
    href: "/activity-board",
    gradient: "from-blue-50 to-indigo-50",
    labelColor: "text-blue-500",
  },
  {
    emoji: "🤝",
    headline: "Start or Join a Community Group",
    body: "Book clubs, hiking crews, cooking circles — find your people right here in Just Putzit.",
    cta: "Browse Groups",
    href: "/community",
    gradient: "from-green-50 to-teal-50",
    labelColor: "text-green-600",
  },
  {
    emoji: "🎳",
    headline: "Find Something Fun to Do",
    body: "Bowling, mini golf, go-karts, beaches — discover local activities near you right now.",
    cta: "Explore Activities",
    href: "/activities",
    gradient: "from-purple-50 to-pink-50",
    labelColor: "text-purple-600",
  },
  {
    emoji: "🎮",
    headline: "Play Jeopardy or Trivia Pursuit",
    body: "Challenge yourself with local trivia and community-themed questions. New rounds daily!",
    cta: "Play Now",
    href: "/games-hub",
    gradient: "from-rose-50 to-orange-50",
    labelColor: "text-rose-500",
  },
  {
    emoji: "📣",
    headline: "Invite a Friend to Just Putzit",
    body: "Know someone who'd love this community? Share the app — the more locals, the better!",
    cta: "Invite Friends",
    href: "/shout-out",
    gradient: "from-yellow-50 to-amber-50",
    labelColor: "text-yellow-600",
  },
  {
    emoji: "🛡️",
    headline: "Keep it local, on your terms",
    body: "Use your saved location to discover nearby events. Optional account and location verification tools are available in Safety & Trust.",
    cta: "How safety works",
    href: "/safety",
    gradient: "from-slate-50 to-blue-50",
    labelColor: "text-slate-500",
  },
];

// Pick a fallback based on the current page + day of week so it rotates daily
function pickFallback(page: PageSlot): FallbackAnnouncement {
  const dayIndex = new Date().getDay(); // 0–6
  const pageOffset: Record<PageSlot, number> = {
    home: 0,
    activities: 2,
    community: 1,
    activity_board: 3,
    gym_buddy: 4,
    gym_detail: 5,
  };
  const idx = (dayIndex + pageOffset[page]) % FALLBACK_ANNOUNCEMENTS.length;
  return FALLBACK_ANNOUNCEMENTS[idx]!;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LocalVenueBanner({ page, className = "" }: LocalVenueBannerProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fallbackDismissed, setFallbackDismissed] = useState(false);
  const [shared, setShared] = useState(false);

  // Prefer any saved coordinates for geographically relevant local banners.
  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const userLat = profileQuery.data?.gpsVerifiedLat
    ? parseFloat(profileQuery.data.gpsVerifiedLat)
    : profileQuery.data?.latitude
    ? parseFloat(profileQuery.data.latitude)
    : undefined;

  const userLng = profileQuery.data?.gpsVerifiedLng
    ? parseFloat(profileQuery.data.gpsVerifiedLng)
    : profileQuery.data?.longitude
    ? parseFloat(profileQuery.data.longitude)
    : undefined;

  const { data: banners = [], isLoading: bannersLoading } = trpc.advertising.getBanners.useQuery(
    { page, userLat, userLng },
    {
      // Don't block on profile loading — if no location, still show statewide banners
      enabled: !user || !profileQuery.isLoading,
    }
  );

  const fallback = useMemo(() => pickFallback(page), [page]);

  const visible = banners.filter(b => !dismissed.has(b.id));
  const hasPaidAds = visible.length > 0;

  // ── Paid ad handlers ──
  const handleDismiss = () => {
    const banner = visible[currentIndex % visible.length];
    if (!banner) return;
    setDismissed(prev => { const next = new Set(prev); next.add(banner.id); return next; });
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };
  const handleNext = () => setCurrentIndex(prev => (prev + 1) % visible.length);
  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + visible.length) % visible.length);
  const handleClick = () => {
    const banner = visible[currentIndex % visible.length];
    if (banner?.bannerLinkUrl) window.open(banner.bannerLinkUrl, "_blank", "noopener,noreferrer");
  };

  // Still loading — render nothing to avoid flash
  if (bannersLoading && user) return null;

  // Share handler for fallback banners
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = fallback.href
      ? `${window.location.origin}${fallback.href}`
      : window.location.origin;
    const shareData = {
      title: fallback.headline,
      text: fallback.body,
      url: shareUrl,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(`${fallback.headline} — ${shareUrl}`);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User cancelled share — do nothing
    }
  };

  // ── Fallback community announcement ──
  if (!hasPaidAds) {
    if (fallbackDismissed) return null;
    return (
      <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-r ${fallback.gradient} shadow-sm ${className}`}>
        {/* Label */}
        <div className="absolute top-2 left-3 z-10">
          <span className={`text-[10px] font-semibold ${fallback.labelColor} uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full`}>
            Community
          </span>
        </div>

        {/* Top-right actions: Share + Dismiss */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <button
            onClick={handleShare}
            className={`h-6 flex items-center gap-1 rounded-full px-2 text-[10px] font-semibold transition-all ${
              shared
                ? "bg-green-500 text-white"
                : "bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700"
            }`}
            aria-label="Share this announcement"
          >
            {shared ? (
              <><Check className="w-3 h-3" /> Copied!</>
            ) : (
              <><Share2 className="w-3 h-3" /> Share</>
            )}
          </button>
          <button
            onClick={() => setFallbackDismissed(true)}
            className="w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div
          className={`flex items-center gap-4 p-4 pt-8 ${fallback.href ? "cursor-pointer" : ""}`}
          onClick={fallback.href ? () => navigate(fallback.href!) : undefined}
        >
          {/* Emoji icon */}
          <div className="w-14 h-14 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 text-2xl shadow-sm">
            {fallback.emoji}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {fallback.headline}
            </p>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{fallback.body}</p>
          </div>

          {/* CTA */}
          {fallback.cta && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-gray-700 hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors">
                {fallback.cta}
              </span>
            </div>
          )}
        </div>

        {/* Bottom bar: Sponsor CTA */}
        <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-3 border-t border-black/5 mt-1">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Megaphone className="w-3 h-3 flex-shrink-0" />
            This spot is available for local businesses
          </span>
          <button
            onClick={e => { e.stopPropagation(); navigate("/advertise"); }}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 bg-orange-100 hover:bg-orange-200 border border-orange-200 hover:border-orange-300 px-3 py-1 rounded-full transition-all active:scale-95"
          >
            <Megaphone className="w-3 h-3" />
            Sponsor this space
          </button>
        </div>
      </div>
    );
  }

  // ── Paid ad banner ──
  const banner = visible[currentIndex % visible.length]!;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm ${className}`}>
      {/* Sponsored label */}
      <div className="absolute top-2 left-3 z-10">
        <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full">
          Local Sponsor
        </span>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss ad"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Banner content */}
      <div
        className={`flex items-center gap-4 p-4 pt-8 ${banner.bannerLinkUrl ? "cursor-pointer" : ""}`}
        onClick={banner.bannerLinkUrl ? handleClick : undefined}
      >
        {/* Image */}
        {banner.bannerImageUrl ? (
          <img
            src={banner.bannerImageUrl}
            alt={banner.businessName}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-orange-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-2xl">
            🍺
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">
            {banner.bannerHeadline || banner.businessName}
          </p>
          {banner.tagline && (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{banner.tagline}</p>
          )}
          {banner.promoText && (
            <p className="text-xs text-orange-600 font-medium mt-1 line-clamp-1">🎉 {banner.promoText}</p>
          )}
        </div>

        {/* CTA */}
        {banner.bannerLinkUrl && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-full transition-colors">
              {banner.bannerCta || "Visit"}
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>

      {/* Pagination dots (if multiple banners) */}
      {visible.length > 1 && (
        <div className="flex items-center justify-center gap-2 pb-3">
          <button onClick={handlePrev} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex % visible.length ? "bg-orange-500" : "bg-gray-300"}`}
            />
          ))}
          <button onClick={handleNext} className="text-gray-400 hover:text-gray-600">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
