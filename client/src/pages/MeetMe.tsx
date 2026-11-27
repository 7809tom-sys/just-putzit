import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowRight,
  Ban,
  Camera,
  Clock,
  Flag,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate behaviour" },
  { value: "fake_profile", label: "Fake profile or photo" },
  { value: "scammer", label: "Scam or solicitation" },
  { value: "other", label: "Something else" },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export default function MeetMe() {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [now, setNow] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<{
    encounterId: number;
    displayName: string;
    venueName: string;
    photoUrl: string;
    icebreaker: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("harassment");
  const [greeted, setGreeted] = useState(false);

  const stateQuery = trpc.meetMe.getState.useQuery(undefined, {
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const venuesQuery = trpc.meetMe.listVenues.useQuery(undefined, {
    enabled: Boolean(stateQuery.data?.enabled) && !stateQuery.data?.session,
  });

  const state = stateQuery.data;
  const session = state?.session ?? null;

  const poll = trpc.meetMe.poll.useMutation({
    onSuccess: (next) => {
      utils.meetMe.getState.setData(undefined, next);
    },
  });

  const start = trpc.meetMe.start.useMutation({
    onSuccess: async () => {
      toast.success("You're visible here", { description: "Only while you leave Meet Me on." });
      await utils.meetMe.getState.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const stop = trpc.meetMe.stop.useMutation({
    onSuccess: async () => {
      setDetail(null);
      toast.success("Meet Me is off", { description: "You're no longer visible to anyone." });
      await utils.meetMe.getState.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const icebreaker = trpc.meetMe.icebreaker.useMutation({
    onSuccess: (result) => {
      setDetail((current) => (current ? { ...current, icebreaker: result.icebreaker } : current));
    },
  });

  const open = trpc.meetMe.open.useMutation({
    onSuccess: (result) => {
      setGreeted(false);
      setDetail(result);
      // The face is already on screen; this only upgrades the one-line opener.
      icebreaker.mutate({ encounterId: result.encounterId });
    },
    onError: (error) => toast.error(error.message),
  });

  const greet = trpc.meetMe.greet.useMutation({
    onSuccess: () => {
      setGreeted(true);
      toast.success("They'll know you said hi", { description: "No message thread, no waiting on a reply." });
    },
    onError: (error) => toast.error(error.message),
  });

  const dismiss = trpc.meetMe.dismiss.useMutation({
    onSuccess: async () => {
      setDetail(null);
      await utils.meetMe.getState.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const block = trpc.meetMe.block.useMutation({
    onSuccess: async () => {
      setDetail(null);
      toast.success("Blocked", { description: "This member can't be introduced to you again." });
      await utils.meetMe.getState.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const report = trpc.meetMe.report.useMutation({
    onSuccess: async () => {
      setDetail(null);
      toast.success("Report sent", { description: "Our team reviews every report." });
      await utils.meetMe.getState.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const acknowledge = trpc.meetMe.acknowledgeGreeting.useMutation();

  // Quiet clock for the "time left" line only.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // The heartbeat: only while this tab is visible and a session is live.
  useEffect(() => {
    if (!session?.id) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      poll.mutate({ sessionId: session.id });
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [session?.id]);

  const venues = useMemo(() => {
    const all = venuesQuery.data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((venue) => venue.name.toLowerCase().includes(needle) || (venue.city ?? "").toLowerCase().includes(needle));
  }, [venuesQuery.data, search]);

  const minutesLeft = session ? Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - now) / 60000)) : 0;
  const openFromGreeting = (nudgeId: number, encounterId: number) => {
    acknowledge.mutate({ nudgeId });
    open.mutate({ encounterId });
  };

  return (
    <div className="min-h-screen gradient-warm py-8">
      <div className="container max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">In person, on purpose</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-gray-900">Meet Me</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            Turn this on when you are at a public place and would welcome a hello. It only works inside venues we list — never at a home address, and never in the background.
          </p>
        </div>

        {!state && <Card className="p-6 text-center text-gray-600">Loading Meet Me…</Card>}

        {state && !state.enabled && (
          <Card className="border-gray-200 p-6">
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Not open yet</Badge>
            <h2 className="mt-3 font-display text-xl font-bold text-gray-900">Meet Me isn't switched on in this area.</h2>
            <p className="mt-2 text-sm text-gray-600">We are piloting it at a small number of public venues. Nothing about you is visible meanwhile.</p>
          </Card>
        )}

        {state?.enabled && state.revealBlocker && (
          <Card className="mb-5 border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Camera className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">
                  {state.revealBlocker === "no_photo" && "Add a face photo before using Meet Me."}
                  {state.revealBlocker === "profile_incomplete" && "Finish a little of your profile first."}
                  {state.revealBlocker === "reported" && "Meet Me is paused on your account."}
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  Meeting someone in person needs a face to recognise and enough profile to feel like a real person. You can still check in, but nobody will be introduced to you yet.
                </p>
                <Button variant="outline" className="mt-3 gap-2" onClick={() => navigate("/profile")}>
                  Open my profile <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {state?.greeting && (
          <Card className="mb-5 border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-800">Someone said hi</p>
            <p className="mt-1 text-sm text-emerald-950">{state.greeting.text}</p>
            <Button
              className="mt-3 gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => openFromGreeting(state.greeting!.nudgeId, state.greeting!.encounterId)}
            >
              See who it is
            </Button>
          </Card>
        )}

        {state?.enabled && session && (
          <Card className="mb-5 border-gray-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Meet Me is on
                </div>
                <h2 className="mt-2 flex items-center gap-2 font-display text-2xl font-bold text-gray-900">
                  <MapPin size={20} className="text-amber-600" /> {session.venueName}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                  <Clock size={14} /> {minutesLeft} min left · ends on its own
                </p>
              </div>
              <Button variant="outline" onClick={() => stop.mutate({ sessionId: session.id })} disabled={stop.isPending}>
                Turn off
              </Button>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <Users size={16} className="text-gray-500" />
              {state.nearbyCount > 0
                ? `${state.nearbyCount} ${state.nearbyCount === 1 ? "person is" : "people are"} open to meeting here right now.`
                : "No one else has Meet Me on at this venue right now. That can change while you're here."}
            </div>

            {state.prompt && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Sally</p>
                <p className="mt-1 text-sm text-amber-950">{state.prompt.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="gap-2 bg-amber-600 hover:bg-amber-700"
                    onClick={() => open.mutate({ encounterId: state.prompt!.encounterId })}
                    disabled={open.isPending}
                  >
                    See who it is
                  </Button>
                  <Button variant="ghost" onClick={() => dismiss.mutate({ encounterId: state.prompt!.encounterId })}>
                    Not now
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {state?.enabled && !session && (
          <Card className="border-gray-200 p-6">
            <h2 className="font-display text-xl font-bold text-gray-900">Where are you?</h2>
            <p className="mt-1 text-sm text-gray-600">Pick the public place you are at. We only list venues that are already public in Just Putzit.</p>
            <Input
              className="mt-4"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search a library, gym, or community venue"
            />
            <div className="mt-4 space-y-2">
              {venuesQuery.isLoading && <p className="text-sm text-gray-500">Loading public venues…</p>}
              {!venuesQuery.isLoading && venues.length === 0 && (
                <p className="text-sm text-gray-600">No public venues match that search yet.</p>
              )}
              {venues.map((venue) => (
                <button
                  key={`${venue.venueType}:${venue.venueId}`}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-amber-300 hover:bg-amber-50"
                  onClick={() => start.mutate({ venueType: venue.venueType, venueId: venue.venueId })}
                  disabled={start.isPending}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-gray-900">{venue.name}</span>
                    <span className="block text-xs text-gray-500">{venue.city ?? "Nearby"}</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-xl bg-white/60 p-4 text-xs text-gray-600">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <p>
            Meet Me keeps no address and no location trail. Opening someone's profile never tells them — only an explicit “Say hi” does, and it sends no message thread.
            You can block or report from any profile.
          </p>
        </div>
      </div>

      <Dialog open={Boolean(detail)} onOpenChange={(isOpen) => { if (!isOpen) setDetail(null); }}>
        <DialogContent className="max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{detail.displayName}</DialogTitle>
                <DialogDescription className="flex items-center gap-1">
                  <MapPin size={14} /> {detail.venueName}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-xl bg-gray-100">
                <img src={detail.photoUrl} alt={`${detail.displayName} at ${detail.venueName}`} className="h-72 w-full object-cover" />
              </div>

              <p className="text-sm text-gray-700">{detail.icebreaker}</p>

              {greeted ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  You said hi. If they look up, that's your cue — go over and introduce yourself.
                </div>
              ) : (
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <Button
                    className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                    onClick={() => greet.mutate({ encounterId: detail.encounterId })}
                    disabled={greet.isPending}
                  >
                    Say hi <ArrowRight size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => dismiss.mutate({ encounterId: detail.encounterId })}
                    disabled={dismiss.isPending}
                  >
                    Not now
                  </Button>
                </DialogFooter>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Flag size={12} />
                  <select
                    className="rounded-md border border-gray-200 bg-white px-1 py-1 text-xs"
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value as ReportReason)}
                    aria-label="Report reason"
                  >
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-gray-600"
                  onClick={() => report.mutate({ encounterId: detail.encounterId, reason: reportReason })}
                  disabled={report.isPending}
                >
                  Report
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-gray-600"
                  onClick={() => block.mutate({ encounterId: detail.encounterId })}
                  disabled={block.isPending}
                >
                  <Ban size={12} /> Block
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
