import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPartnerTrendPresetRange, getTodayInputDate, type PartnerTrendPreset, type PartnerTrendRange } from "@/lib/partnerTrendRange";

const PRESETS: Array<{ key: Exclude<PartnerTrendPreset, "custom">; label: string; days: 7 | 30 | 90 }> = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

export function PartnerTrendRangeControls({ range, preset, onRangeChange, onPresetChange }: { range: PartnerTrendRange; preset: PartnerTrendPreset; onRangeChange: (range: PartnerTrendRange) => void; onPresetChange: (preset: PartnerTrendPreset) => void }) {
  const selectPreset = (nextPreset: Exclude<PartnerTrendPreset, "custom">, days: 7 | 30 | 90) => {
    onPresetChange(nextPreset);
    onRangeChange(getPartnerTrendPresetRange(days));
  };
  const updateCustomRange = (field: keyof PartnerTrendRange, value: string) => {
    onPresetChange("custom");
    onRangeChange({ ...range, [field]: value });
  };

  return <div className="mt-5 rounded-2xl border bg-card p-3 sm:flex sm:items-center sm:justify-between sm:gap-4"><div className="flex flex-wrap items-center gap-2" role="group" aria-label="Partner results chart date range">{PRESETS.map((option) => <Button key={option.key} type="button" size="sm" variant={preset === option.key ? "default" : "outline"} className="rounded-full" aria-pressed={preset === option.key} onClick={() => selectPreset(option.key, option.days)}>{option.label}</Button>)}<Button type="button" size="sm" variant={preset === "custom" ? "default" : "outline"} className="rounded-full" aria-pressed={preset === "custom"} onClick={() => onPresetChange("custom")}><CalendarDays className="mr-1.5 h-3.5 w-3.5" />Custom</Button></div>{preset === "custom" && <div className="mt-3 grid gap-2 sm:mt-0 sm:grid-cols-2"><div className="grid gap-1"><Label className="text-xs" htmlFor="partnerTrendStart">Start date</Label><Input id="partnerTrendStart" type="date" max={range.end || getTodayInputDate()} value={range.start} onChange={(event) => updateCustomRange("start", event.target.value)} /></div><div className="grid gap-1"><Label className="text-xs" htmlFor="partnerTrendEnd">End date</Label><Input id="partnerTrendEnd" type="date" min={range.start} max={getTodayInputDate()} value={range.end} onChange={(event) => updateCustomRange("end", event.target.value)} /></div></div>}</div>;
}
