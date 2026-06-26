import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ExternalLink, RefreshCw, Navigation } from "lucide-react";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

type Place = {
  name: string;
  vicinity: string;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  placeId: string;
  lat: number;
  lng: number;
  openNow?: boolean;
};

const ACTIVITY_TYPES = [
  { label: "All", value: "establishment" },
  { label: "Libraries", value: "library" },
  { label: "Churches", value: "church" },
  { label: "Parks", value: "park" },
  { label: "Sports", value: "gym" },
  { label: "Cafes", value: "cafe" },
  { label: "Museums", value: "museum" },
];

export default function Activities() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState("establishment");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const { data: profile } = trpc.profile.get.useQuery();
  const updateLocation = trpc.profile.update.useMutation();

  const searchNearby = (map: google.maps.Map, location: { lat: number; lng: number }, type: string) => {
    setIsLoading(true);
    setPlaces([]);
    // Clear old markers
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];

    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(
      {
        location,
        radius: 5000,
        type: type as any,
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const mapped: Place[] = results.slice(0, 12).map(r => ({
            name: r.name || "Unknown",
            vicinity: r.vicinity || "",
            rating: r.rating,
            userRatingsTotal: r.user_ratings_total,
            types: r.types || [],
            placeId: r.place_id || "",
            lat: r.geometry?.location?.lat() || 0,
            lng: r.geometry?.location?.lng() || 0,
            openNow: r.opening_hours?.isOpen?.(),
          }));
          setPlaces(mapped);
          // Add markers
          mapped.forEach(place => {
            const marker = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: place.lat, lng: place.lng },
              title: place.name,
            });
            markersRef.current.push(marker);
          });
        } else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          toast.error("Couldn't load nearby places");
        }
      }
    );
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        map.setCenter(loc);
        map.setZoom(14);
        // User marker
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position: loc,
          title: "You are here",
        });
        updateLocation.mutate({ latitude: String(loc.lat), longitude: String(loc.lng) });
        searchNearby(map, loc, activeType);
      },
      () => {
        setLocationError("Location access denied. Please allow location to see nearby activities.");
      }
    );
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    if (mapRef.current && userLocation) {
      searchNearby(mapRef.current, userLocation, type);
    }
  };

  const getTypeLabel = (types: string[]) => {
    const map: Record<string, string> = {
      library: "📚 Library", church: "⛪ Church", park: "🌳 Park",
      gym: "🏋️ Sports", cafe: "☕ Cafe", museum: "🏛️ Museum",
      restaurant: "🍽️ Restaurant", school: "🏫 School",
    };
    for (const t of types) {
      if (map[t]) return map[t];
    }
    return "📍 Venue";
  };

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-3xl text-foreground">Local Activities 🗺️</h1>
          <p className="text-muted-foreground mt-1">Discover nearby places to explore with your matches</p>
        </div>

        {/* Sally suggestion */}
        <div className="bg-white rounded-3xl p-4 mb-6 flex items-start gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full gradient-sally flex items-center justify-center text-xl flex-shrink-0">🤖</div>
          <div>
            <p className="font-semibold text-sm">Sally's suggestion</p>
            <p className="text-xs text-muted-foreground">
              {profile?.traits && (profile.traits as any).hobbies
                ? `Based on your love of ${((profile.traits as any).hobbies as string[]).slice(0, 2).join(" and ")}, here are some great spots nearby!`
                : "Here are some great spots nearby to explore with your matches!"}
            </p>
          </div>
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ACTIVITY_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${activeType === t.value ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary"}`}
            >
              {t.label}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="rounded-full gap-1.5" onClick={() => { if (mapRef.current && userLocation) searchNearby(mapRef.current, userLocation, activeType); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {locationError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">{locationError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <MapView
              className="h-96 lg:h-[480px]"
              initialCenter={{ lat: 39.8283, lng: -98.5795 }}
              initialZoom={4}
              onMapReady={handleMapReady}
            />
          </div>

          {/* Places list */}
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 480 }}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />
              ))
            ) : places.length > 0 ? (
              places.map(place => (
                <PlaceCard key={place.placeId} place={place} typeLabel={getTypeLabel(place.types)} />
              ))
            ) : !userLocation && !locationError ? (
              <div className="bg-white rounded-3xl p-8 text-center">
                <Navigation className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
                <p className="font-semibold">Getting your location...</p>
                <p className="text-sm text-muted-foreground mt-1">Please allow location access when prompted</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="font-semibold">No places found nearby</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceCard({ place, typeLabel }: { place: Place; typeLabel: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="text-xs rounded-full">{typeLabel}</Badge>
            {place.openNow !== undefined && (
              <Badge className={`text-xs rounded-full border-0 ${place.openNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {place.openNow ? "Open" : "Closed"}
              </Badge>
            )}
          </div>
          <p className="font-bold text-sm truncate">{place.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {place.vicinity}
          </p>
          {place.rating && (
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-500" /> {place.rating} ({place.userRatingsTotal?.toLocaleString()} reviews)
            </p>
          )}
        </div>
        <a href={`https://www.google.com/maps/place/?q=place_id:${place.placeId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs">
            <ExternalLink className="w-3 h-3" /> View
          </Button>
        </a>
      </div>
    </div>
  );
}
