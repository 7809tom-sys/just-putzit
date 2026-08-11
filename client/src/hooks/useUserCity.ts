/**
 * useUserCity — detects the user's city automatically.
 *
 * Strategy:
 *  1. If the user has a saved city in their profile, use that.
 *  2. Otherwise, try GPS (navigator.geolocation) → reverse-geocode via nominatim.
 *  3. Fall back to IP geolocation (ipapi.co/json — free, no key needed).
 *  4. Persist the result to the user profile via tRPC.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type DetectedCity = {
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
  source: "profile" | "gps" | "ip";
};

const SUPPORTED_CITIES = [
  "Milwaukee", "Waukesha", "Chicago", "Brookfield", "West Allis", "Oklahoma City",
  "Wauwatosa", "Racine", "Kenosha", "Madison", "Green Bay",
  "Evanston", "Oak Park", "Naperville", "Aurora", "Joliet",
];

function normalizeCityName(raw: string): string {
  // Match against known supported cities (case-insensitive)
  const lower = raw.toLowerCase();
  const match = SUPPORTED_CITIES.find(c => lower.includes(c.toLowerCase()));
  return match ?? raw;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string; country: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";
    const state = addr.state ?? "";
    const country = addr.country_code?.toUpperCase() ?? "";
    return city ? { city: normalizeCityName(city), state, country } : null;
  } catch {
    return null;
  }
}

async function detectByGPS(): Promise<DetectedCity | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        if (!geo) { resolve(null); return; }
        resolve({ ...geo, lat, lng, source: "gps" });
      },
      () => resolve(null),
      { timeout: 6000, maximumAge: 300_000 }
    );
  });
}

function parseVerifiedCityLabel(label: string): { city: string; state: string } {
  const [cityPart, ...stateParts] = label.split(",");
  return { city: cityPart.trim(), state: stateParts.join(",").trim() };
}

async function detectByIP(): Promise<DetectedCity | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const city = data.city ?? "";
    const state = data.region ?? "";
    const country = data.country_code ?? "";
    if (!city) return null;
    return { city: normalizeCityName(city), state, country, source: "ip" };
  } catch {
    return null;
  }
}

export function useUserCity() {
  const { user } = useAuth();
  const [detectedCity, setDetectedCity] = useState<DetectedCity | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionKeyRef = useRef<string | null>(null);

  // Read saved city from profile
  const { data: profile } = trpc.profile.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const updateCityMutation = trpc.profile.updateCity.useMutation();

  const detect = useCallback(async () => {
    if (isDetecting) return;
    setIsDetecting(true);
    try {
      // Prefer a previously GPS-verified city over a stale or manually entered profile city.
      const verifiedLabel = profile?.gpsVerifiedCity ?? "";
      const verifiedLocation = verifiedLabel ? parseVerifiedCityLabel(verifiedLabel) : null;
      const trustedSavedLocation = verifiedLocation ?? (profile?.city ? { city: profile.city, state: profile.state ?? "" } : null);
      if (trustedSavedLocation) {
        setDetectedCity({
          ...trustedSavedLocation,
          country: "US",
          lat: verifiedLocation && profile?.gpsVerifiedLat ? Number(profile.gpsVerifiedLat) : undefined,
          lng: verifiedLocation && profile?.gpsVerifiedLng ? Number(profile.gpsVerifiedLng) : undefined,
          source: verifiedLocation ? "gps" : "profile",
        });
        if (user && verifiedLocation && (profile?.city !== verifiedLocation.city || profile?.state !== verifiedLocation.state)) {
          updateCityMutation.mutate({
            city: verifiedLocation.city,
            state: verifiedLocation.state || undefined,
            lat: profile?.gpsVerifiedLat ?? undefined,
            lng: profile?.gpsVerifiedLng ?? undefined,
          });
        }
      }

      // On login, check GPS even when a saved city exists. If the person is now in a
      // different community, updateCity starts the idempotent local events + activities refresh.
      const gps = await detectByGPS();
      if (gps) {
        setDetectedCity(gps);
        if (user && (gps.city.toLowerCase() !== profile?.city?.toLowerCase() || gps.state !== profile?.state)) {
          updateCityMutation.mutate({ city: gps.city, state: gps.state, lat: gps.lat?.toString(), lng: gps.lng?.toString() });
        }
        setIsDetecting(false);
        return;
      }

      // Keep the trusted saved/verified city if location permission is unavailable.
      if (trustedSavedLocation) {
        setIsDetecting(false);
        return;
      }

      // IP fallback for first-time users.
      const ip = await detectByIP();
      if (ip) {
        setDetectedCity(ip);
        if (user) {
          updateCityMutation.mutate({ city: ip.city, state: ip.state });
        }
        setIsDetecting(false);
        return;
      }
      // Default to Milwaukee
      setDetectedCity({ city: "Milwaukee", state: "WI", country: "US", source: "ip" });
    } finally {
      setIsDetecting(false);
    }
  }, [profile, user, isDetecting, updateCityMutation]);

  useEffect(() => {
    if (!user?.id) return;
    const detectionKey = `${user.id}:${profile?.city ?? ""}:${profile?.state ?? ""}`;
    if (detectionKeyRef.current === detectionKey) return;
    detectionKeyRef.current = detectionKey;
    void detect();
  }, [user?.id, profile?.city, profile?.state]);

  const setCity = useCallback((city: string) => {
    setDetectedCity(prev => prev ? { ...prev, city, source: "profile" } : { city, state: "", country: "", source: "profile" });
    if (user) {
      updateCityMutation.mutate({ city, state: detectedCity?.state });
    }
  }, [user, detectedCity?.state, updateCityMutation]);

  return {
    city: detectedCity?.city ?? "Milwaukee",
    detectedCity,
    isDetecting,
    setCity,
  };
}
