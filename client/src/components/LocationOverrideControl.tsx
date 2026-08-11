import { MapPin, RotateCcw, Search, Loader2, Bookmark, Trash2, Home, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserCity } from "@/hooks/useUserCity";
import { useState, type FormEvent } from "react";

export function LocationOverrideControl({ compact = false }: { compact?: boolean }) {
  const { city, detectedCity, isDetecting, isResolvingManualLocation, manualLocationError, isManualOverride, setManualLocation, clearManualLocation, savedLocations, selectSavedLocation, saveCurrentLocation, setSavedLocationHome, deleteSavedLocation, isSavingLocation } = useUserCity();
  const [draft, setDraft] = useState("");
  const [saveLabel, setSaveLabel] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualLocation(draft);
  };

  return (
    <section className={compact ? "rounded-xl border border-orange-100 bg-orange-50/70 p-3" : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"} aria-label="Discovery location">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Showing nearby</p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
            <MapPin className="h-4 w-4 shrink-0 text-orange-500" aria-hidden="true" />
            {detectedCity?.displayName ?? `${city}${detectedCity?.state ? `, ${detectedCity.state}` : ""}`}
            {isManualOverride && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Travel mode</span>}
          </p>
        </div>
        {isManualOverride && (
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-orange-700 hover:bg-orange-100" onClick={clearManualLocation}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Use my location
          </Button>
        )}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search a city or ZIP code"
          aria-label="Search a city or ZIP code"
          className="h-9 min-w-0 bg-white text-sm"
        />
        <Button type="submit" size="sm" className="h-9 shrink-0 gap-1.5 bg-slate-900 text-white hover:bg-slate-800" disabled={draft.trim().length < 2 || isResolvingManualLocation}>
          {isResolvingManualLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Search className="h-3.5 w-3.5" aria-hidden="true" />}
          Search
        </Button>
      </form>
      {isDetecting && !isManualOverride && <p className="mt-2 text-xs text-slate-500">Checking your phone location…</p>}
      {manualLocationError && <p className="mt-2 text-xs font-medium text-red-600" role="alert">{manualLocationError}</p>}
      {isManualOverride && <p className="mt-2 text-xs text-slate-500">Events and activities are filtered around this travel location.</p>}
      {savedLocations.length > 0 && (
        <div className="mt-3 border-t border-slate-200/80 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" /> Saved locations
          </p>
          <div className="flex flex-wrap gap-2">
            {savedLocations.map((location) => (
              <div key={location.id} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white pl-1.5 pr-1 text-xs shadow-sm">
                <button type="button" className="flex min-h-8 items-center gap-1.5 px-1.5 text-left font-semibold text-slate-700 hover:text-orange-600" onClick={() => selectSavedLocation(location)}>
                  {location.isHome ? <Home className="h-3 w-3 text-orange-500" aria-label="Home" /> : <MapPin className="h-3 w-3 text-slate-400" aria-hidden="true" />}
                  <span>{location.label}</span>
                  {location.isHome && <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />}
                </button>
                {!location.isHome && (
                  <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-orange-50 hover:text-orange-600" aria-label={`Set ${location.label} as home`} onClick={() => setSavedLocationHome(location.id)}>
                    <Home className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
                <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${location.label}`} onClick={() => deleteSavedLocation(location.id)}>
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {detectedCity?.lat !== undefined && detectedCity?.lng !== undefined && (
        <form onSubmit={(event) => { event.preventDefault(); saveCurrentLocation(saveLabel); setSaveLabel(""); }} className="mt-3 flex gap-2">
          <Input value={saveLabel} onChange={(event) => setSaveLabel(event.target.value)} placeholder="Save this location as…" aria-label="Name this saved location" className="h-8 min-w-0 bg-white text-xs" />
          <Button type="submit" size="sm" variant="outline" className="h-8 shrink-0 gap-1.5 text-xs" disabled={isSavingLocation}>
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" /> Save
          </Button>
        </form>
      )}
    </section>
  );
}
