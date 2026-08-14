import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, Plus, TrendingUp, Ticket, DollarSign, Users, Building2, Play, Eye, ToggleLeft, ToggleRight, BarChart3, Megaphone, MousePointerClick, UserPlus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const CATEGORIES = [
  "bowling", "mini_golf", "kayaking", "movies", "dining", "coffee",
  "cooking_class", "escape_room", "wine_tasting", "hiking", "park",
  "sports", "arts", "other",
];
const EMOJIS = ["🎳","⛳","🛶","🎬","🍽️","☕","👨‍🍳","🔐","🍷","🥾","🌳","⚽","🎨","🌟"];

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function Vendor() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: venues, isLoading } = trpc.vendor.myVenues.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: sponsoredPerformance, isLoading: sponsoredPerformanceLoading } = trpc.vendor.sponsoredPerformance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: sponsoredAudience } = trpc.vendor.sponsoredAudience.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Register venue form
  const [venueOpen, setVenueOpen] = useState(false);
  const [vName, setVName] = useState("");
  const [vCategory, setVCategory] = useState("dining");
  const [vCity, setVCity] = useState("");
  const [vAddress, setVAddress] = useState("");
  const [vDesc, setVDesc] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vReferral, setVReferral] = useState(2);

  // Add listing form
  const [listingVenueId, setListingVenueId] = useState<number | null>(null);

  // Login Ads state
  const [adOpen, setAdOpen] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [adCtaText, setAdCtaText] = useState("");
  const [adCtaUrl, setAdCtaUrl] = useState("");
  const [adBudget, setAdBudget] = useState(1000); // cents
  const [adCpm, setAdCpm] = useState(5); // cents per 1000 impressions

  const { data: myAds = [], refetch: refetchAds } = trpc.loginAds.myAds.useQuery();
  const createAdMutation = trpc.loginAds.create.useMutation({
    onSuccess: () => {
      toast.success("Login ad created!");
      setAdOpen(false);
      setAdTitle(""); setAdVideoUrl(""); setAdCtaText(""); setAdCtaUrl("");
      refetchAds();
    },
    onError: (e) => toast.error(e.message),
  });
  const toggleAdMutation = trpc.loginAds.toggleActive.useMutation({
    onSuccess: () => refetchAds(),
  });
  const [lTitle, setLTitle] = useState("");
  const [lCategory, setLCategory] = useState("dining");
  const [lPrice, setLPrice] = useState(15);
  const [lTickets, setLTickets] = useState(true);
  const [lEmoji, setLEmoji] = useState("🎉");
  const [lDesc, setLDesc] = useState("");
  const [lSchedule, setLSchedule] = useState("");
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsoredListing, setSponsoredListing] = useState<any>(null);
  const [sponsorPackage, setSponsorPackage] = useState<"week" | "month">("week");

  const registerMutation = trpc.vendor.registerVenue.useMutation({
    onSuccess: () => {
      toast.success("Venue registered! Add your first activity. 🎉");
      setVenueOpen(false);
      setVName(""); setVCity(""); setVAddress(""); setVDesc(""); setVEmail("");
      utils.vendor.myVenues.invalidate();
    },
    onError: () => toast.error("Couldn't register venue. Check the fields."),
  });

  const addListingMutation = trpc.vendor.addListing.useMutation({
    onSuccess: () => {
      toast.success("Activity listed in the marketplace! ✨");
      setListingVenueId(null);
      setLTitle(""); setLDesc(""); setLSchedule("");
      utils.vendor.myVenues.invalidate();
    },
    onError: (e) => toast.error(e.message || "Couldn't add listing."),
  });
  const sponsorMutation = trpc.vendor.startSponsoredPlacementCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      toast.success("Opening secure promotion checkout in a new tab.");
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      setSponsorOpen(false);
      utils.vendor.myVenues.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

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
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="font-display text-2xl font-bold mb-2">Partner with Just Putzit</h1>
          <p className="text-muted-foreground mb-6">
            List your venue, fill seats with real dates and groups, and only pay when people show up.
          </p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="rounded-full">
            Sign in to get started
          </Button>
        </div>
      </div>
    );
  }

  // Aggregate stats
  const totalBookings = venues?.reduce((s, v) => s + v.bookingCount, 0) ?? 0;
  const totalReferrals = venues?.reduce((s, v) => s + v.totalReferrals, 0) ?? 0;
  const totalReferralRevenue = venues?.reduce((s, v) => s + v.referralRevenueCents, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gradient-sally flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Vendor Partner Portal</h1>
              <p className="text-sm text-muted-foreground">
                List activities. Pay only for real visits. Users are always free.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-full bg-card gap-2" asChild><a href="/partner-results"><BarChart3 className="w-4 h-4" /> Partner results</a></Button><Dialog open={venueOpen} onOpenChange={setVenueOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gap-2"><Plus className="w-4 h-4" /> Register venue</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register your venue</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label>Venue name</Label>
                  <Input value={vName} onChange={e => setVName(e.target.value)} placeholder="Lucky Strike Lanes" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={vCategory} onValueChange={setVCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={vCity} onChange={e => setVCity(e.target.value)} placeholder="Austin" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input value={vAddress} onChange={e => setVAddress(e.target.value)} placeholder="123 Main St" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact email</Label>
                  <Input value={vEmail} onChange={e => setVEmail(e.target.value)} placeholder="bookings@venue.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Short description</Label>
                  <Textarea value={vDesc} onChange={e => setVDesc(e.target.value)} rows={2} placeholder="What makes your spot great…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Referral fee per visit (you pay): ${vReferral}</Label>
                  <input
                    type="range" min={0} max={20} step={1}
                    value={vReferral} onChange={e => setVReferral(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">You only pay this when a guest actually checks in.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-full bg-card" onClick={() => setVenueOpen(false)}>Cancel</Button>
                <Button
                  className="rounded-full"
                  disabled={registerMutation.isPending || !vName.trim()}
                  onClick={() => registerMutation.mutate({
                    name: vName, category: vCategory as never, city: vCity || undefined,
                    address: vAddress || undefined, description: vDesc || undefined,
                    contactEmail: vEmail || undefined, referralFeePerVisit: vReferral * 100,
                  })}
                >
                  {registerMutation.isPending ? <Spinner className="w-4 h-4" /> : "Register"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Building2 className="w-4 h-4" />} label="Venues" value={String(venues?.length ?? 0)} />
          <StatCard icon={<Ticket className="w-4 h-4" />} label="Bookings" value={String(totalBookings)} />
          <StatCard icon={<Users className="w-4 h-4" />} label="Check-ins" value={String(totalReferrals)} />
          <StatCard icon={<DollarSign className="w-4 h-4" />} label="Referral spend" value={dollars(totalReferralRevenue)} />
        </div>

        {venues && venues.length > 0 && (
          <section className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Sponsored activity performance</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-gray-900">See what your promotion is doing</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">Views, venue-link clicks, and activity sign-ups are aggregate only. Member names and private profile details are never included.</p>
              </div>
              <Badge className="w-fit bg-amber-100 text-amber-900 hover:bg-amber-100">Privacy-safe reporting</Badge>
            </div>

            {sponsoredPerformanceLoading ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-gray-600"><Spinner className="h-4 w-4" /> Loading campaign performance…</div>
            ) : sponsoredPerformance ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <SponsoredMetric icon={<Eye className="h-4 w-4" />} label="Views" value={sponsoredPerformance.summary.views.toLocaleString()} />
                  <SponsoredMetric icon={<MousePointerClick className="h-4 w-4" />} label="Clicks" value={sponsoredPerformance.summary.clicks.toLocaleString()} />
                  <SponsoredMetric icon={<UserPlus className="h-4 w-4" />} label="Sign-ups" value={sponsoredPerformance.summary.signUps.toLocaleString()} />
                  <SponsoredMetric icon={<TrendingUp className="h-4 w-4" />} label="Click rate" value={`${sponsoredPerformance.summary.clickThroughRate}%`} />
                  <SponsoredMetric icon={<BarChart3 className="h-4 w-4" />} label="Sign-up rate" value={`${sponsoredPerformance.summary.signUpRate}%`} />
                </div>

                {sponsoredPerformance.placements.length > 0 ? (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {sponsoredPerformance.placements.map((placement) => (
                      <div key={placement.id} className="rounded-xl border border-amber-100 bg-white/90 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{placement.activityTitle}</p>
                            <p className="mt-1 text-xs text-gray-500">{placement.packageCode === "week" ? "7-day" : "30-day"} placement · {placement.status === "active" && placement.endsAt && new Date(placement.endsAt) > new Date() ? "Live" : "Completed"}</p>
                          </div>
                          <Badge className={placement.status === "active" && placement.endsAt && new Date(placement.endsAt) > new Date() ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}>
                            {placement.status === "active" && placement.endsAt && new Date(placement.endsAt) > new Date() ? "Live" : "Completed"}
                          </Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                          <div><p className="font-bold text-gray-900">{placement.views}</p><p className="text-gray-500">Views</p></div>
                          <div><p className="font-bold text-gray-900">{placement.clicks}</p><p className="text-gray-500">Clicks</p></div>
                          <div><p className="font-bold text-gray-900">{placement.signUps}</p><p className="text-gray-500">Sign-ups</p></div>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">{placement.clickThroughRate}% click rate · {placement.signUpRate}% sign-up rate</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-white/70 p-4 text-sm text-gray-600">Promote an active activity to begin measuring aggregate views, clicks, and sign-ups here.</div>
                )}

                <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Anonymous audience summary</p>
                      <p className="mt-1 text-sm text-gray-700">Broad age bands and activity themes from sponsored sign-ups. Individual identities, exact ages, and private profile answers are never shared.</p>
                    </div>
                    <Badge className="w-fit bg-teal-100 text-teal-800 hover:bg-teal-100">Minimum group protected</Badge>
                  </div>
                  {sponsoredAudience?.isSuppressed ? (
                    <p className="mt-4 rounded-lg border border-dashed border-teal-200 bg-white/80 p-3 text-sm text-gray-600">Audience details will appear after at least {sponsoredAudience.minimumGroupSize} unique sponsored sign-ups. This prevents small groups from being profiled.</p>
                  ) : sponsoredAudience ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <AudienceBreakdown title="Age bands" values={sponsoredAudience.ageBands} emptyLabel="No age bands meet the privacy threshold yet." />
                      <AudienceBreakdown title="Top activity interests" values={sponsoredAudience.topInterests} emptyLabel="No interest themes meet the privacy threshold yet." />
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </section>
        )}

        {/* Venues */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : venues && venues.length > 0 ? (
          <div className="space-y-5">
            {venues.map(v => (
              <Card key={v.id} className="border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{v.name}</h3>
                        <Badge variant="secondary" className="rounded-full capitalize text-[10px]">
                          {v.category.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {v.city ?? "—"} · {v.bookingCount} bookings · {v.totalReferrals} check-ins
                      </p>
                    </div>
                    <Button
                      size="sm" variant="outline" className="rounded-full bg-card gap-1.5"
                      onClick={() => { setListingVenueId(v.id); setLCategory(v.category); }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add activity
                    </Button>
                  </div>

                  {v.listings.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {v.listings.map(l => (
                        <div key={l.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
                          <div className="text-2xl">{l.imageEmoji}</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{l.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {l.priceCents === 0 ? "Free" : dollars(l.priceCents)} · {l.totalReferrals} visits
                            </p>
                            {l.isSponsored && <Badge className="mt-1 bg-amber-100 text-amber-800 hover:bg-amber-100">Sponsored placement active</Badge>}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 rounded-full gap-1.5 text-xs"
                            disabled={l.isSponsored || !l.isActive}
                            onClick={() => { setSponsoredListing(l); setSponsorPackage("week"); setSponsorOpen(true); }}
                          >
                            <Megaphone className="h-3.5 w-3.5" /> {l.isSponsored ? "Live" : "Promote"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No activities listed yet — add your first!</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-10 text-center">
              <div className="text-4xl mb-3">🏪</div>
              <p className="text-sm text-muted-foreground mb-4">
                No venues yet. Register your first venue to start filling seats with real dates and groups.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={sponsorOpen} onOpenChange={setSponsorOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Promote this activity</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">{sponsoredListing?.title}</p>
              <p className="mt-1 text-xs">Your activity will be shown near the top of relevant local recommendations with a clear <strong>Sponsored</strong> label. It remains subject to venue rules, accurate listing information, and community safety standards.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { id: "week", label: "7 days", price: "$99", detail: "Try a focused local placement" },
                { id: "month", label: "30 days", price: "$249", detail: "Keep your activity visible longer" },
              ] as const).map((option) => (
                <button key={option.id} type="button" onClick={() => setSponsorPackage(option.id)} className={`rounded-xl border p-3 text-left transition-colors ${sponsorPackage === option.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <span className="block text-sm font-semibold text-gray-900">{option.label} · {option.price}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{option.detail}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Payment is handled securely by Stripe. We do not sell member profiles or use private interview responses for advertising.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full bg-card" onClick={() => setSponsorOpen(false)}>Cancel</Button>
            <Button className="rounded-full gap-2" disabled={!sponsoredListing || sponsorMutation.isPending} onClick={() => sponsoredListing && sponsorMutation.mutate({ activityId: sponsoredListing.id, packageCode: sponsorPackage })}>
              <Megaphone className="h-4 w-4" /> {sponsorMutation.isPending ? "Opening checkout…" : "Continue to secure checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Login Ads Section ─── */}
      {venues && venues.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Play className="w-5 h-5 text-orange-500" /> Login Ad Campaigns
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your 10-second video plays to users during login. Pay per 1,000 impressions.
              </p>
            </div>
            <Button className="rounded-full gap-2" onClick={() => setAdOpen(true)}>
              <Plus className="w-4 h-4" /> New Ad
            </Button>
          </div>

          {myAds.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-3">🎬</div>
                <p className="font-semibold mb-1">No login ads yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a 10-second clip and reach every user who logs in — right when they're excited to meet someone.
                </p>
                <Button className="rounded-full" onClick={() => setAdOpen(true)}>Create your first ad</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myAds.map((ad) => (
                <Card key={ad.id} className="border-none shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{ad.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions.toLocaleString()} impressions</span>
                        <span>·</span>
                        <span>${(ad.spentCents / 100).toFixed(2)} spent</span>
                        {ad.budgetCents > 0 && <><span>·</span><span>${(ad.budgetCents / 100).toFixed(0)} budget</span></>}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAdMutation.mutate({ adId: ad.id, isActive: !ad.isActive })}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                        ad.isActive
                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {ad.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {ad.isActive ? "Live" : "Paused"}
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Ad Dialog */}
      <Dialog open={adOpen} onOpenChange={setAdOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Login Ad</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-sm text-orange-700 dark:text-orange-300">
              💡 Your video plays for 10 seconds to users during login. Rate: ${(adCpm / 100).toFixed(2)} per 1,000 impressions.
            </div>
            <div className="space-y-1.5">
              <Label>Ad title (internal)</Label>
              <Input value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Summer Promo 2025" />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input value={adVideoUrl} onChange={e => setAdVideoUrl(e.target.value)} placeholder="https://...mp4" />
              <p className="text-[11px] text-muted-foreground">Direct link to an .mp4 or .webm file (max 30s, recommended 10s)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CTA button text (optional)</Label>
                <Input value={adCtaText} onChange={e => setAdCtaText(e.target.value)} placeholder="Book Now" />
              </div>
              <div className="space-y-1.5">
                <Label>CTA link (optional)</Label>
                <Input value={adCtaUrl} onChange={e => setAdCtaUrl(e.target.value)} placeholder="https://yourvenue.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Total budget: ${(adBudget / 100).toFixed(0)} (0 = unlimited)</Label>
              <input
                type="range" min={0} max={10000} step={100}
                value={adBudget} onChange={e => setAdBudget(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full bg-card" onClick={() => setAdOpen(false)}>Cancel</Button>
            <Button
              className="rounded-full"
              disabled={createAdMutation.isPending || !adTitle.trim() || !adVideoUrl.trim()}
              onClick={() => createAdMutation.mutate({
                title: adTitle,
                videoUrl: adVideoUrl,
                ctaText: adCtaText || undefined,
                ctaUrl: adCtaUrl || undefined,
                budgetCents: adBudget,
                cpmCents: adCpm,
              })}
            >
              {createAdMutation.isPending ? <Spinner className="w-4 h-4" /> : "Launch ad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add listing dialog */}
      <Dialog open={listingVenueId !== null} onOpenChange={(o) => !o && setListingVenueId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add an activity</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Activity title</Label>
              <Input value={lTitle} onChange={e => setLTitle(e.target.value)} placeholder="Cosmic Bowling Night" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={lCategory} onValueChange={setLCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Price per person: ${lPrice}</Label>
                <input
                  type="range" min={0} max={150} step={5}
                  value={lPrice} onChange={e => setLPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map(e => (
                  <button
                    key={e} onClick={() => setLEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                      lEmoji === e ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                    }`}
                  >{e}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={lDesc} onChange={e => setLDesc(e.target.value)} rows={2} placeholder="What's included…" />
            </div>
            <div className="space-y-1.5">
              <Label>Recurring schedule (optional)</Label>
              <Input value={lSchedule} onChange={e => setLSchedule(e.target.value)} placeholder="Every Friday 8pm" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <Label className="cursor-pointer">Sells tickets</Label>
                <p className="text-[11px] text-muted-foreground">On = bookable tickets; Off = reservation/RSVP</p>
              </div>
              <Switch checked={lTickets} onCheckedChange={setLTickets} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full bg-card" onClick={() => setListingVenueId(null)}>Cancel</Button>
            <Button
              className="rounded-full"
              disabled={addListingMutation.isPending || !lTitle.trim() || listingVenueId === null}
              onClick={() => listingVenueId !== null && addListingMutation.mutate({
                venueId: listingVenueId, title: lTitle, category: lCategory as never,
                priceDollars: lPrice, hasTickets: lTickets, imageEmoji: lEmoji,
                description: lDesc || undefined, recurringSchedule: lSchedule || undefined,
              })}
            >
              {addListingMutation.isPending ? <Spinner className="w-4 h-4" /> : "List activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SponsoredMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white/90 p-3">
      <div className="flex items-center gap-1.5 text-amber-800">{icon}<span className="text-xs font-semibold">{label}</span></div>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function AudienceBreakdown({ title, values, emptyLabel }: { title: string; values: Array<{ label: string; count: number }>; emptyLabel: string }) {
  return (
    <div className="rounded-lg bg-white/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</p>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => <Badge key={value.label} variant="secondary" className="rounded-full capitalize">{value.label} · {value.count}</Badge>)}
        </div>
      ) : <p className="mt-2 text-sm text-gray-500">{emptyLabel}</p>}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
          {icon} {label}
        </div>
        <p className="font-display text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
