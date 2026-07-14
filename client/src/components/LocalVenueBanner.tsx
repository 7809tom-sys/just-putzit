import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";

type PageSlot = "home" | "activities" | "community" | "activity_board";

interface LocalVenueBannerProps {
  page: PageSlot;
  className?: string;
}

export function LocalVenueBanner({ page, className = "" }: LocalVenueBannerProps) {
  const { user } = useAuth();

  // Use the user's saved GPS-verified location from their profile
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

  const { data: banners = [] } = trpc.advertising.getBanners.useQuery(
    { page, userLat, userLng },
    {
      // Don't block on profile loading — if no location, still show statewide banners
      enabled: !user || !profileQuery.isLoading,
    }
  );

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  const visible = banners.filter(b => !dismissed.has(b.id));

  if (visible.length === 0) return null;

  const banner = visible[currentIndex % visible.length]!;

  const handleDismiss = () => {
    setDismissed(prev => { const next = new Set(prev); next.add(banner.id); return next; });
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => setCurrentIndex(prev => (prev + 1) % visible.length);
  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + visible.length) % visible.length);

  const handleClick = () => {
    if (banner.bannerLinkUrl) {
      window.open(banner.bannerLinkUrl, "_blank", "noopener,noreferrer");
    }
  };

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
