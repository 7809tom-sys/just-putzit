import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Heart, Users, Sparkles, Plus, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const INTEREST_SUGGESTIONS = [
  "Hiking", "Board games", "Wine tasting", "Cooking", "Live music",
  "Travel", "Foodie adventures", "Movie nights", "Dancing", "Camping",
];

export default function Couples() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: myCouple, isLoading: coupleLoading } = trpc.couples.getMyCouple.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: matches } = trpc.couples.getMyCoupleMatches.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [partnerName, setPartnerName] = useState("");
  const [relLength, setRelLength] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (myCouple) {
      setPartnerName(myCouple.partnerName ?? "");
      setRelLength(myCouple.relationshipLength ?? "");
      setInterests(myCouple.sharedInterests ?? []);
      setLookingFor(myCouple.lookingFor ?? "");
    }
  }, [myCouple]);

  const saveMutation = trpc.couples.saveCouple.useMutation({
    onSuccess: () => {
      toast.success("Couple profile saved! 💞");
      utils.couples.getMyCouple.invalidate();
    },
  });

  const findMutation = trpc.couples.findCoupleMatches.useMutation({
    onSuccess: (res) => {
      toast.success(
        res.matches.length > 0
          ? `Sally found ${res.matches.length} couple match${res.matches.length > 1 ? "es" : ""}! 🎉`
          : "No new matches right now — check back as more couples join!"
      );
      utils.couples.getMyCoupleMatches.invalidate();
    },
    onError: (e) => toast.error(e.message || "Couldn't find matches."),
  });

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const addCustomInterest = () => {
    const v = newInterest.trim();
    if (v && !interests.includes(v)) {
      setInterests(prev => [...prev, v]);
      setNewInterest("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32"><Spinner /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md py-24 text-center">
          <div className="text-5xl mb-4">💞</div>
          <h1 className="font-display text-2xl font-bold mb-2">The Couples Network</h1>
          <p className="text-muted-foreground mb-6">
            Already a pair? Meet other couples for double dates and group adventures. Sign in to begin.
          </p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="rounded-full">Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full gradient-sally flex items-center justify-center text-white shadow-md">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Couples Network</h1>
            <p className="text-sm text-muted-foreground">
              Meet other couples for double dates, game nights, and group outings.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Couple profile form */}
          <Card className="border-none shadow-md">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" /> Your couple profile
              </h2>

              <div className="space-y-1.5">
                <Label>Partner's name</Label>
                <Input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Alex" />
              </div>

              <div className="space-y-1.5">
                <Label>How long together?</Label>
                <Input value={relLength} onChange={e => setRelLength(e.target.value)} placeholder="3 years" />
              </div>

              <div className="space-y-1.5">
                <Label>Shared interests</Label>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_SUGGESTIONS.map(i => (
                    <button
                      key={i} onClick={() => toggleInterest(i)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        interests.includes(i)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-primary/5"
                      }`}
                    >{i}</button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newInterest} onChange={e => setNewInterest(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
                    placeholder="Add your own…" className="h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" className="rounded-full bg-card" onClick={addCustomInterest}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {interests.filter(i => !INTEREST_SUGGESTIONS.includes(i)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {interests.filter(i => !INTEREST_SUGGESTIONS.includes(i)).map(i => (
                      <Badge key={i} variant="secondary" className="rounded-full gap-1">
                        {i}
                        <button onClick={() => toggleInterest(i)}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>What are you looking for?</Label>
                <Textarea
                  value={lookingFor} onChange={e => setLookingFor(e.target.value)} rows={2}
                  placeholder="Fun couples for weekend adventures and game nights…"
                />
              </div>

              <Button
                className="w-full rounded-full"
                disabled={saveMutation.isPending || !partnerName.trim()}
                onClick={() => saveMutation.mutate({
                  partnerName, relationshipLength: relLength || undefined,
                  sharedInterests: interests, lookingFor: lookingFor || undefined,
                })}
              >
                {saveMutation.isPending ? <Spinner className="w-4 h-4" /> : myCouple ? "Update profile" : "Create couple profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Matches */}
          <div className="space-y-4">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-lg font-semibold">Couple matches</h2>
                  <Button
                    size="sm" className="rounded-full gap-1.5"
                    disabled={findMutation.isPending || !myCouple}
                    onClick={() => findMutation.mutate()}
                  >
                    {findMutation.isPending ? <Spinner className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Find matches
                  </Button>
                </div>
                {!myCouple && (
                  <p className="text-xs text-muted-foreground">Create your couple profile first to unlock matching.</p>
                )}
              </CardContent>
            </Card>

            {coupleLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : matches && matches.length > 0 ? (
              matches.map(m => (
                <Card key={m.id} className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full gradient-sally flex items-center justify-center text-white text-sm">
                          💑
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {m.otherProfile?.displayName ?? "A lovely couple"}
                            {m.otherCouple?.partnerName ? ` & ${m.otherCouple.partnerName}` : ""}
                          </p>
                          {m.otherCouple?.relationshipLength && (
                            <p className="text-xs text-muted-foreground">Together {m.otherCouple.relationshipLength}</p>
                          )}
                        </div>
                      </div>
                      <Badge className="rounded-full">{m.compatibilityScore}%</Badge>
                    </div>
                    {m.compatibilityReason && (
                      <p className="text-xs text-muted-foreground italic mb-2">"{m.compatibilityReason}"</p>
                    )}
                    {m.otherCouple?.sharedInterests && m.otherCouple.sharedInterests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.otherCouple.sharedInterests.slice(0, 5).map(i => (
                          <Badge key={i} variant="outline" className="rounded-full text-[10px]">{i}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="p-8 text-center">
                  <div className="text-3xl mb-2">💞</div>
                  <p className="text-sm text-muted-foreground">
                    No couple matches yet. Save your profile and hit "Find matches" to let Sally work her magic.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
