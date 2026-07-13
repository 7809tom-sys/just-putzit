import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Sparkles, MapPin, Wallet, Users, CalendarDays, CheckCircle2, Heart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const VIBES = [
  "Romantic picnic in the park",
  "Cozy coffee & a walk",
  "Adventurous outdoor day",
  "Foodie tasting tour",
  "Laid-back game night",
  "Sunset by the water",
];

function dollars(cents?: number | null) {
  return `$${((cents ?? 0) / 100).toFixed(0)}`;
}

export default function Concierge() {
  const { isAuthenticated, loading } = useAuth();
  const [occasion, setOccasion] = useState("First date");
  const [vibe, setVibe] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState(60);
  const [partySize, setPartySize] = useState(2);
  const [dietary, setDietary] = useState("");

  const { data: myRequests, refetch } = trpc.concierge.myRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const planMutation = trpc.concierge.plan.useMutation({
    onSuccess: () => {
      toast.success("Sally drafted your plan! 🌟");
      refetch();
    },
    onError: () => toast.error("Sally hit a snag. Try again in a moment."),
  });

  const confirmMutation = trpc.concierge.confirm.useMutation({
    onSuccess: () => {
      toast.success("Sally is arranging everything now! 💛");
      refetch();
    },
  });

  const handlePlan = () => {
    if (!vibe.trim() || !location.trim()) {
      toast.error("Tell Sally the vibe and the area first.");
      return;
    }
    planMutation.mutate({
      occasion,
      vibe,
      location,
      budgetDollars: budget,
      partySize,
      dietaryNotes: dietary || undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md py-24 text-center">
          <div className="text-5xl mb-4">🧺</div>
          <h1 className="font-display text-2xl font-bold mb-2">Meet your Date Concierge</h1>
          <p className="text-muted-foreground mb-6">
            Sign in and let Sally arrange the whole outing — from the picnic blanket to the food delivery.
          </p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="rounded-full">
            Sign in to start
          </Button>
        </div>
      </div>
    );
  }

  const latestPlan = myRequests?.find(r => r.sallyPlanTitle);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full gradient-sally flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Sally Date Concierge</h1>
              <p className="text-sm text-muted-foreground">
                Tell Sally the vibe. She arranges the rest — vendors, food, and all.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            Always free for you — local vendors cover the cost
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Request form */}
          <Card className="border-none shadow-md">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">What are we planning?</h2>

              <div className="space-y-1.5">
                <Label>Occasion</Label>
                <Input value={occasion} onChange={e => setOccasion(e.target.value)} placeholder="First date, anniversary…" />
              </div>

              <div className="space-y-1.5">
                <Label>The vibe</Label>
                <Input value={vibe} onChange={e => setVibe(e.target.value)} placeholder="Romantic picnic in the park" />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {VIBES.map(v => (
                    <button
                      key={v}
                      onClick={() => setVibe(v)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-primary/5 hover:border-primary/40 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Area</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Downtown Austin, Zilker Park…" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Budget</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={20} max={300} step={10}
                      value={budget} onChange={e => setBudget(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-semibold w-12 text-right">${budget}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> People</Label>
                  <Input type="number" min={1} max={20} value={partySize} onChange={e => setPartySize(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Dietary notes (optional)</Label>
                <Textarea value={dietary} onChange={e => setDietary(e.target.value)} placeholder="Vegetarian, no nuts…" rows={2} />
              </div>

              <Button onClick={handlePlan} disabled={planMutation.isPending} className="w-full rounded-full gap-2">
                {planMutation.isPending ? <Spinner className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {planMutation.isPending ? "Sally is planning…" : "Let Sally plan it"}
              </Button>
            </CardContent>
          </Card>

          {/* Plan preview */}
          <div className="space-y-4">
            {planMutation.isPending && (
              <Card className="border-none shadow-md">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 py-12">
                  <Spinner />
                  <p className="text-sm text-muted-foreground">Sally is calling around to local spots… 🌼</p>
                </CardContent>
              </Card>
            )}

            {!planMutation.isPending && latestPlan && (
              <Card className="border-none shadow-md overflow-hidden">
                <div className="gradient-sally p-5 text-white">
                  <p className="text-xs uppercase tracking-wide opacity-90">Sally's plan</p>
                  <h3 className="font-display text-xl font-bold">{latestPlan.sallyPlanTitle}</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground italic">"{latestPlan.sallyPlanSummary}"</p>

                  <div className="space-y-3">
                    {(latestPlan.sallyPlanItems ?? []).map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">{item.label}</p>
                            {item.estCostCents != null && (
                              <span className="text-sm font-semibold text-primary">{dollars(item.estCostCents)}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                          {item.vendorName && (
                            <Badge variant="outline" className="mt-1 text-[10px] rounded-full">
                              {item.vendorName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Estimated total</span>
                    <span className="font-display text-lg font-bold">{dollars(latestPlan.estTotalCents)}</span>
                  </div>

                  {latestPlan.status === "arranged" ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Sally is arranging this for you!
                    </div>
                  ) : (
                    <Button
                      onClick={() => confirmMutation.mutate({ requestId: latestPlan.id })}
                      disabled={confirmMutation.isPending}
                      className="w-full rounded-full gap-2"
                    >
                      <Heart className="w-4 h-4" /> Yes Sally, arrange it!
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {!planMutation.isPending && !latestPlan && (
              <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 py-12">
                  <div className="text-4xl">🧺</div>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Fill in the details and Sally will craft a complete outing — including who she'll contact to make it happen.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Past requests */}
        {myRequests && myRequests.length > 1 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold mb-3">Your arrangements</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myRequests.map(r => (
                <Card key={r.id} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{r.sallyPlanTitle ?? r.occasion}</p>
                      <Badge
                        variant={r.status === "arranged" ? "default" : "secondary"}
                        className="rounded-full text-[10px] capitalize shrink-0"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleDateString()} · {dollars(r.estTotalCents)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
