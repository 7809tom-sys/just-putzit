import { FormEvent, useState } from "react";
import { MapPin, RotateCcw, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserCity } from "@/hooks/useUserCity";

export function LocationOverrideControl({ compact = false }: { compact?: boolean }) {
  const { city, detectedCity, isDetecting, isResolvingManualLocation, manualLocationError, isManualOverride, setManualLocation, clearManualLocation } = useUserCity();
  const [draft, setDraft] = useState("");

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
    </section>
  );
}
