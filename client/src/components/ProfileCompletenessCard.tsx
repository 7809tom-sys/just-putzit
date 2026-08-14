import { CheckCircle2, Circle, Compass, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfileCompleteness, type ProfileCompletenessInput } from "@shared/profileCompleteness";

type ProfileCompletenessCardProps = ProfileCompletenessInput & {
  onAddBio: () => void;
  onSetLocation: () => void;
  onChatWithSally: () => void;
};

const actionIcons = {
  about: Sparkles,
  location: Compass,
  sally: MessageCircle,
};

export function ProfileCompletenessCard({ onAddBio, onSetLocation, onChatWithSally, ...input }: ProfileCompletenessCardProps) {
  const { items, completed, total, score } = getProfileCompleteness(input);
  const actions = { about: onAddBio, location: onSetLocation, sally: onChatWithSally };
  const next = items.find((item) => !item.complete);

  return <section className="mt-6 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-4 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-lg font-bold text-white shadow-sm">{score}%</div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-800">Profile completeness</p><h2 className="mt-1 text-sm font-bold text-foreground">{completed} of {total} essentials are ready</h2></div>
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-[width] duration-200" style={{ width: `${score}%` }} /></div>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">This score only covers an introduction, local discovery, and Sally context. It does not count photos, identity details, or dating preferences.</p>
    <div className="mt-4 space-y-2">
      {items.map((item) => {
        const Icon = actionIcons[item.id];
        return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5"><div className="flex min-w-0 items-center gap-2"><span className="shrink-0">{item.complete ? <CheckCircle2 className="h-4 w-4 text-teal-700" /> : <Circle className="h-4 w-4 text-sky-500" />}</span><div className="min-w-0"><p className="text-sm font-medium text-foreground">{item.label}</p>{!item.complete && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}</div></div>{!item.complete && <Button type="button" size="sm" variant="outline" className="shrink-0 rounded-full text-xs" onClick={actions[item.id]}><Icon className="mr-1 h-3.5 w-3.5" />{item.actionLabel}</Button>}</div>;
      })}
    </div>
    {next ? <p className="mt-3 text-xs font-medium text-sky-900">Next useful step: {next.label}.</p> : <p className="mt-3 text-xs font-medium text-teal-800">You have the essentials. You can keep refining your profile whenever you want.</p>}
  </section>;
}
