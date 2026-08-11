/**
 * useUserCity — detects the user's city automatically.
 *
 * Strategy:
 *  1. If the user has a saved city in their profile, use that.
 *  2. Otherwise, try GPS (navigator.geolocation) → reverse-geocode via nominatim.
 *  3. Fall back to IP geolocation (ipapi.co/json — free, no key needed).
 *  4. Persist the result to the user profile via tRPC.
 */
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type DetectedCity = {
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
  source: "profile" | "gps" | "ip" | "manual";
  postalCode?: string;
  displayName?: string;
};

export type SavedLocationSummary = {
  id: number;
  label: string;
  city: string;
  state: string;
  postalCode?: string | null;
  latitude: string;
  longitude: string;
  isHome: boolean;
};

const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);

function isUsState(value: string) {
  const normalized = value.trim().toUpperCase();
  return US_STATE_CODES.has(normalized) || normalized === "UNITED STATES" || normalized.endsWith(" USA");
}

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
    if (!city || country !== "US") return null;
    return { city: normalizeCityName(city), state, country };
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

const MANUAL_LOCATION_KEY_PREFIX = "justputzit:manual-location:";

function getManualLocationKey(userId?: number | string) {
  return `${MANUAL_LOCATION_KEY_PREFIX}${userId ?? "guest"}`;
}

function readStoredManualLocation(userId?: number | string): DetectedCity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getManualLocationKey(userId));
    return raw ? (JSON.parse(raw) as DetectedCity) : null;
  } catch {
    return null;
  }
}

function parseVerifiedCityLabel(label: string): { city: string; state: string } | null {
  const [cityPart, ...stateParts] = label.split(",");
  const city = cityPart.trim();
  const state = stateParts.join(",").trim();
  return city && isUsState(state) ? { city, state } : null;
}

async function detectByIP(): Promise<DetectedCity | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const city = data.city ?? "";
    const state = data.region ?? "";
    const country = String(data.country_code ?? "").toUpperCase();
    if (!city || (country && country !== "US")) return null;
    return { city: normalizeCityName(city), state, country: country || "US", source: "ip" };
  } catch {
    return null;
  }
}

export function useUserCity() {
  const { user } = useAuth();
  const [detectedCity, setDetectedCity] = useState<DetectedCity | null>(null);
  const [manualOverride, setManualOverride] = useState<DetectedCity | null>(() => readStoredManualLocation(user?.id));
  const [manualSearch, setManualSearch] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionKeyRef = useRef<string | null>(null);

  // Read saved city from profile
  const { data: profile } = trpc.profile.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const updateCityMutation = trpc.profile.updateCity.useMutation();
  const manualLocationInput = useMemo(() => ({ query: manualSearch || "  " }), [manualSearch]);
  const manualLocationQuery = trpc.location.resolve.useQuery(manualLocationInput, {
    enabled: !!user && manualSearch.trim().length >= 2,
    retry: false,
  });
  const savedLocationsQuery = trpc.location.saved.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
  });
  const trpcUtils = trpc.useUtils();
  const saveLocationMutation = trpc.location.save.useMutation({
    onSuccess: () => trpcUtils.location.saved.invalidate(),
  });
  const setHomeMutation = trpc.location.setHome.useMutation({
    onSuccess: () => trpcUtils.location.saved.invalidate(),
  });
  const deleteLocationMutation = trpc.location.delete.useMutation({
    onSuccess: () => trpcUtils.location.saved.invalidate(),
  });
  const renameLocationMutation = trpc.location.rename.useMutation({
    onSuccess: () => trpcUtils.location.saved.invalidate(),
  });

  const detect = useCallback(async () => {
    if (isDetecting) return;
    setIsDetecting(true);
    try {
      const savedManualOverride = manualOverride ?? readStoredManualLocation(user?.id);
      if (savedManualOverride) {
        setManualOverride(savedManualOverride);
        setDetectedCity(savedManualOverride);
        setIsDetecting(false);
        return;
      }

      // Prefer a previously GPS-verified city over a stale or manually entered profile city.
      const verifiedLabel = profile?.gpsVerifiedCity ?? "";
      const verifiedLocation = verifiedLabel ? parseVerifiedCityLabel(verifiedLabel) : null;
      const trustedSavedLocation = verifiedLocation ?? (profile?.city && isUsState(profile.state ?? "") ? { city: profile.city, state: profile.state ?? "" } : null);
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
  }, [profile, user, isDetecting, manualOverride, updateCityMutation]);

  useEffect(() => {
    if (!user?.id) return;
    const detectionKey = `${user.id}:${profile?.city ?? ""}:${profile?.state ?? ""}:${manualOverride?.city ?? ""}`;
    if (detectionKeyRef.current === detectionKey) return;
    detectionKeyRef.current = detectionKey;
    void detect();
  }, [user?.id, profile?.city, profile?.state, manualOverride]);

  useEffect(() => {
    const stored = readStoredManualLocation(user?.id);
    setManualOverride(stored);
    if (stored) setDetectedCity(stored);
    detectionKeyRef.current = null;
  }, [user?.id]);

  useEffect(() => {
    const onLocationChanged = () => {
      const stored = readStoredManualLocation(user?.id);
      setManualOverride(stored);
      if (stored) setDetectedCity(stored);
    };
    window.addEventListener("justputzit:location-changed", onLocationChanged);
    return () => window.removeEventListener("justputzit:location-changed", onLocationChanged);
  }, [user?.id]);

  useEffect(() => {
    const resolved = manualLocationQuery.data;
    if (!resolved || !manualSearch.trim()) return;
    const location: DetectedCity = {
      city: resolved.city,
      state: resolved.state,
      country: resolved.country,
      lat: resolved.lat,
      lng: resolved.lng,
      postalCode: resolved.postalCode,
      displayName: resolved.displayName,
      source: "manual",
    };
    setManualOverride(location);
    setDetectedCity(location);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getManualLocationKey(user?.id), JSON.stringify(location));
      window.dispatchEvent(new Event("justputzit:location-changed"));
    }
    updateCityMutation.mutate({ city: location.city, state: location.state, lat: String(location.lat), lng: String(location.lng) });
    setManualSearch("");
  }, [manualLocationQuery.data, manualSearch, updateCityMutation, user?.id]);

  const setManualLocation = useCallback((query: string) => {
    const value = query.trim();
    if (value.length >= 2) setManualSearch(value);
  }, []);

  const clearManualLocation = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getManualLocationKey(user?.id));
      window.dispatchEvent(new Event("justputzit:location-changed"));
    }
    setManualOverride(null);
    setDetectedCity(null);
    detectionKeyRef.current = null;
  }, [user?.id]);

  const setCity = useCallback((city: string) => {
    setDetectedCity(prev => prev ? { ...prev, city, source: "profile" } : { city, state: "", country: "", source: "profile" });
    if (user) {
      updateCityMutation.mutate({ city, state: detectedCity?.state });
    }
  }, [user, detectedCity?.state, updateCityMutation]);

  const selectSavedLocation = useCallback((location: SavedLocationSummary) => {
    const next: DetectedCity = {
      city: location.city,
      state: location.state,
      country: "US",
      lat: Number(location.latitude),
      lng: Number(location.longitude),
      postalCode: location.postalCode ?? undefined,
      displayName: `${location.city}, ${location.state}`,
      source: "manual",
    };
    setManualOverride(next);
    setDetectedCity(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getManualLocationKey(user?.id), JSON.stringify(next));
      window.dispatchEvent(new Event("justputzit:location-changed"));
    }
    if (user) {
      updateCityMutation.mutate({ city: next.city, state: next.state, lat: String(next.lat), lng: String(next.lng) });
    }
  }, [user?.id, updateCityMutation]);

  const saveCurrentLocation = useCallback((label?: string) => {
    if (!user || !detectedCity?.lat || !detectedCity?.lng) return;
    saveLocationMutation.mutate({
      label: label?.trim() || detectedCity.city,
      city: detectedCity.city,
      state: detectedCity.state || "",
      postalCode: detectedCity.postalCode,
      latitude: String(detectedCity.lat),
      longitude: String(detectedCity.lng),
      isHome: false,
    });
  }, [user, detectedCity, saveLocationMutation]);

  const setSavedLocationHome = useCallback((id: number) => {
    setHomeMutation.mutate({ id });
  }, [setHomeMutation]);

  const deleteSavedLocation = useCallback((id: number) => {
    deleteLocationMutation.mutate({ id });
  }, [deleteLocationMutation]);

  const renameSavedLocation = useCallback((id: number, label: string) => {
    const nextLabel = label.trim();
    if (nextLabel) renameLocationMutation.mutate({ id, label: nextLabel });
  }, [renameLocationMutation]);

  return {
    city: detectedCity?.city ?? "Milwaukee",
    detectedCity,
    isDetecting,
    isResolvingManualLocation: manualLocationQuery.isFetching,
    manualLocationError: manualLocationQuery.error?.message ?? null,
    isManualOverride: detectedCity?.source === "manual",
    setCity,
    setManualLocation,
    clearManualLocation,
    savedLocations: (savedLocationsQuery.data ?? []) as SavedLocationSummary[],
    selectSavedLocation,
    saveCurrentLocation,
    setSavedLocationHome,
    deleteSavedLocation,
    renameSavedLocation,
    isSavingLocation: saveLocationMutation.isPending,
    isDeletingSavedLocation: deleteLocationMutation.isPending,
  };
}
