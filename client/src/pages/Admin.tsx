import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { OUTREACH_TEMPLATES, hydrateOutreachTemplate } from "@/../../shared/outreachTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Shield,
  Flag,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Search,
  TrendingUp,
  MessageSquare,
  Heart,
  UserCheck,
  ChevronRight,
  BarChart3,
  RefreshCw,
  Calendar,
  Plus,
  DollarSign,
  Star,
  Zap,
  ToggleLeft,
  Image,
  Trash2,
  UserX,
  UserCheck2,
  Camera,
  MapPin,
  ClipboardCheck,
  Send,
} from "lucide-react";
import { Link } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date | string;
};

type SallyEventFeedbackRow = {
  id: number;
  response: "interested" | "not_for_me";
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  eventId: number;
  eventTitle: string;
  eventDate: Date | string;
  eventCity: string;
  eventVenueName: string | null;
  eventExternalUrl: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const reasonColors: Record<string, string> = {
  scammer: "bg-red-100 text-red-800",
  bot: "bg-orange-100 text-orange-800",
  harassment: "bg-purple-100 text-purple-800",
  fake_profile: "bg-yellow-100 text-yellow-800",
  inappropriate: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ?? "bg-primary/10"}`}>
            {icon}
          </div>
          <span className="font-display text-3xl font-bold text-foreground">{value}</span>
        </div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SharedQuestionEditorialTab() {
  const utils = trpc.useUtils();
  const { data: questions = [], isLoading } = trpc.sharedQuestionAdmin.list.useQuery();
  const refresh = () => utils.sharedQuestionAdmin.list.invalidate();
  const approve = trpc.sharedQuestionAdmin.approve.useMutation({
    onSuccess: () => { toast.success("Question approved. It is still not live until published."); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const publish = trpc.sharedQuestionAdmin.publish.useMutation({
    onSuccess: () => { toast.success("Question published to its eligible game targets."); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const retire = trpc.sharedQuestionAdmin.retire.useMutation({
    onSuccess: () => { toast.success("Question retired from future game selection."); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const counts = questions.reduce((result: Record<string, number>, question) => {
    result[question.contentStatus] = (result[question.contentStatus] ?? 0) + 1;
    return result;
  }, {});

  return (
    <div className="space-y-5">
      <Card className="border-amber-100 bg-amber-50/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><ClipboardCheck className="h-5 w-5 text-amber-700" /> Shared question editorial review</CardTitle></CardHeader>
        <CardContent className="text-sm text-amber-950">Only <strong>published</strong> questions are available to games. Approval checks question format, target compatibility, answer requirements, and image-rights metadata before a separate publish action.</CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["draft", "approved", "published", "retired"] as const).map((status) => <StatCard key={status} label={status[0].toUpperCase() + status.slice(1)} value={counts[status] ?? 0} icon={<ClipboardCheck className="h-5 w-5 text-amber-700" />} accent="bg-amber-100" />)}
      </div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : questions.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">No shared questions are awaiting review.</Card> : <div className="space-y-3">{questions.map((question) => {
        const busy = approve.isPending || publish.isPending || retire.isPending;
        return <Card key={question.id} className="border-none shadow-sm"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant={question.contentStatus === "published" ? "default" : "secondary"}>{question.contentStatus}</Badge><Badge variant="outline">{question.format.replaceAll("_", " ")}</Badge><span className="text-xs text-muted-foreground">{question.category} · {question.difficulty}</span></div><p className="mt-3 font-medium text-foreground">{question.prompt}</p>{question.optionA && <p className="mt-2 text-sm text-muted-foreground">A. {question.optionA} {question.optionB ? ` · B. ${question.optionB}` : ""}</p>}<p className="mt-2 text-xs text-muted-foreground">Targets: {question.targets.map((target) => target.gameType.replaceAll("_", " ")).join(", ") || "None"}</p>{question.format === "visual" && <p className="mt-1 text-xs text-muted-foreground">Visual rights: {question.license && question.attribution && question.sourceUrl ? "metadata supplied" : "incomplete"}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{question.contentStatus === "draft" && <Button size="sm" onClick={() => approve.mutate({ questionId: question.id })} disabled={busy}>Approve</Button>}{question.contentStatus === "approved" && <Button size="sm" onClick={() => publish.mutate({ questionId: question.id })} disabled={busy}>Publish</Button>}{(question.contentStatus === "approved" || question.contentStatus === "published") && <Button size="sm" variant="outline" onClick={() => retire.mutate({ questionId: question.id })} disabled={busy}>Retire</Button>}</div></div></CardContent></Card>;
      })}</div>}
    </div>
  );
}

function OutreachTab() {
  const [venueId, setVenueId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: venues = [], isLoading: venuesLoading } = trpc.outreach.eligibleVenues.useQuery();
  const selectedVenue = venues.find((venue) => venue.id === venueId) ?? null;
  const { data: history = [] } = trpc.outreach.history.useQuery({ venueId: venueId! }, { enabled: venueId !== null });
  const send = trpc.outreach.send.useMutation({
    onSuccess: () => { toast.success("Outreach email accepted by the delivery provider."); setSubject(""); setBody(""); setConfirmOpen(false); if (venueId) utils.outreach.history.invalidate({ venueId }); },
    onError: (error) => toast.error(error.message),
  });
  const ready = Boolean(selectedVenue && subject.trim().length >= 3 && body.trim().length >= 10);

  return <div className="space-y-5">
    <Card className="border-sky-100 bg-sky-50/60 shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Send className="h-5 w-5 text-sky-700" /> Direct partner outreach</CardTitle></CardHeader><CardContent className="text-sm text-sky-950">Every message is reviewed and confirmed before delivery. It goes to the selected active venue’s stored business contact, comes from <strong>support@justputzit.com</strong>, and is logged for administrators.</CardContent></Card>
    <Card className="border-none shadow-sm"><CardContent className="space-y-4 p-5">
      <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Venue<select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={venueId ?? ""} onChange={(event) => setVenueId(event.target.value ? Number(event.target.value) : null)} disabled={venuesLoading}><option value="">Choose a venue with an official email</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}</option>)}</select></label><div className="rounded-md border bg-muted/35 px-3 py-2 text-sm"><p className="font-medium">Recipient</p><p className="text-muted-foreground">{selectedVenue ? selectedVenue.contactEmail : "Select a venue to reveal its official outreach address."}</p></div></div>
      <label className="grid gap-1.5 text-sm font-medium">Start from a reviewable template<select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={templateId} disabled={!selectedVenue} onChange={(event) => { const nextTemplate = event.target.value; setTemplateId(nextTemplate); if (selectedVenue && nextTemplate) { const hydrated = hydrateOutreachTemplate(nextTemplate, selectedVenue); if (hydrated) { setSubject(hydrated.subject); setBody(hydrated.body); } } }}><option value="">Write a custom message</option>{OUTREACH_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium">Subject<Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={500} placeholder="A community partnership idea for your venue" /></label>
      <label className="grid gap-1.5 text-sm font-medium">Message<Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={20000} className="min-h-40" placeholder="Introduce Just Putzit, the community opportunity, and a clear next step. Do not include member names or private member information." /></label>
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">No email is sent until you confirm the exact recipient, subject, and body in the next step.</p><Button disabled={!ready || send.isPending} onClick={() => setConfirmOpen(true)}><Send className="mr-2 h-4 w-4" /> Review & send</Button></div>
    </CardContent></Card>
    {venueId !== null && <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Recent outreach to this venue</CardTitle></CardHeader><CardContent>{history.length === 0 ? <p className="text-sm text-muted-foreground">No logged outreach for this venue yet.</p> : <div className="space-y-2">{history.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm first:border-t-0 first:pt-0"><span className="font-medium">{entry.subject}</span><span className="text-muted-foreground">{entry.status} · {new Date(entry.sentAt).toLocaleDateString()}</span></div>)}</div>}</CardContent></Card>}
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Send this outreach email?</AlertDialogTitle><AlertDialogDescription>This will send the reviewed message from support@justputzit.com to {selectedVenue?.contactEmail}. The recipient, sender, subject, delivery status, and provider message identifier will be logged for administrators.</AlertDialogDescription></AlertDialogHeader><div className="rounded-md bg-muted p-3 text-sm"><p className="font-medium">{subject}</p><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{body}</p></div><AlertDialogFooter><AlertDialogCancel disabled={send.isPending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={!ready || send.isPending} onClick={(event) => { event.preventDefault(); if (venueId) send.mutate({ venueId, subject, body, confirmed: true }); }}>{send.isPending ? "Sending…" : "Send email"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

// ── User Detail Drawer ────────────────────────────────────────────────────────
function UserDetailDrawer({
  userId,
  onClose,
  onSuspend,
}: {
  userId: number | null;
  onClose: () => void;
  onSuspend: (id: number) => void;
}) {
  const { data, isLoading } = trpc.safety.getUserDetail.useQuery(
    { userId: userId! },
    { enabled: userId !== null }
  );

  return (
    <Sheet open={userId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display">User Details</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data ? (
          <p className="text-muted-foreground text-center py-12">User not found.</p>
        ) : (
          <div className="space-y-6">
            {/* Identity */}
            <div className="rounded-xl bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{data.user.name ?? "Unnamed"}</span>
                <Badge variant={data.user.role === "admin" ? "default" : "secondary"}>{data.user.role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{data.user.email ?? "No email"}</p>
              <p className="text-xs text-muted-foreground">Joined {fmtDate(data.user.createdAt)}</p>
            </div>

            {/* Profile */}
            {data.profile && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile</h3>
                <div className="rounded-xl bg-muted/40 p-4 space-y-1 text-sm">
                  {data.profile.displayName && (
                    <p><span className="text-muted-foreground">Display name:</span> {data.profile.displayName}</p>
                  )}
                  {data.profile.city && (
                    <p><span className="text-muted-foreground">City:</span> {data.profile.city}</p>
                  )}
                  {data.profile.networkType && (
                    <p><span className="text-muted-foreground">Network:</span> {data.profile.networkType}</p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Verified:</span>{" "}
                    {data.profile.isVerified ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Onboarding:</span>{" "}
                    {data.profile.onboardingComplete ? (
                      <span className="text-green-600 font-medium">Complete</span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Activity stats */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/40 p-3 text-center">
                  <p className="font-display text-2xl font-bold">{data.matchCount}</p>
                  <p className="text-xs text-muted-foreground">Matches</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 text-center">
                  <p className="font-display text-2xl font-bold">{data.messageCount}</p>
                  <p className="text-xs text-muted-foreground">Messages sent</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {data.user.role !== "admin" && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actions</h3>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => {
                    onSuspend(data.user.id);
                    onClose();
                  }}
                >
                  <Ban className="w-4 h-4" /> Suspend this user
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Post Event Button ────────────────────────────────────────────────────────
function PostEventButton({
  form,
  onSuccess,
}: {
  form: {
    title: string;
    description: string;
    category: "music" | "food" | "market" | "sports" | "arts" | "community" | "outdoors" | "other";
    eventDate: string;
    endDate: string;
    venueName: string;
    address: string;
    city: string;
    isFree: boolean;
    priceCents: number;
    externalUrl: string;
  };
  onSuccess: () => void;
}) {
  const createEvent = trpc.events.create.useMutation({
    onSuccess,
    onError: (err) => toast.error(err.message || "Failed to post event"),
  });
  return (
    <Button
      onClick={() => {
        if (!form.title || !form.eventDate) {
          toast.error("Title and start date are required");
          return;
        }
        createEvent.mutate({
          ...form,
          state: "WI",
          externalUrl: form.externalUrl || undefined,
        });
      }}
      disabled={createEvent.isPending}
      className="bg-orange-500 hover:bg-orange-600 text-white"
    >
      <Plus className="w-4 h-4 mr-2" />
      {createEvent.isPending ? "Posting..." : "Post Event"}
    </Button>
  );
}

// ── GPS Locations Tab ───────────────────────────────────────────────────────
function LocationsTab() {
  const { data: locationUsers, isLoading, refetch } = trpc.safety.listUsersWithLocation.useQuery();
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");

  const filtered = (locationUsers ?? []).filter((u) => {
    if (filter === "verified") return u.locationVerified;
    if (filter === "unverified") return !u.locationVerified;
    return true;
  });

  const verifiedCount = (locationUsers ?? []).filter((u) => u.locationVerified).length;
  const withGpsCount = (locationUsers ?? []).filter((u) => u.latitude || u.gpsVerifiedLat).length;

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" /> User GPS Locations
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{verifiedCount} verified</Badge>
              <Badge variant="outline">{withGpsCount} with GPS</Badge>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter buttons */}
          <div className="flex gap-2 mb-4">
            {(["all", "verified", "unverified"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className="rounded-full capitalize"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">User</th>
                    <th className="pb-2 pr-4 font-medium">Claimed City</th>
                    <th className="pb-2 pr-4 font-medium">GPS Coords</th>
                    <th className="pb-2 pr-4 font-medium">Verified City</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Map</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => {
                    const lat = u.gpsVerifiedLat ?? u.latitude;
                    const lng = u.gpsVerifiedLng ?? (u as any).longitude;
                    const mapsUrl = lat && lng
                      ? `https://www.google.com/maps?q=${lat},${lng}`
                      : null;
                    return (
                      <tr key={u.userId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{u.avatarEmoji ?? "👤"}</span>
                            <div>
                              <p className="font-medium">{u.displayName ?? u.name ?? "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground">{u.email ?? `User #${u.userId}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-muted-foreground">{u.city ?? u.claimedCity ?? "—"}</span>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs">
                          {lat && lng ? (
                            <span className="text-blue-600">{parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}</span>
                          ) : (
                            <span className="text-muted-foreground/50">No GPS</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-muted-foreground">{u.gpsVerifiedCity ?? "—"}</span>
                          {u.gpsVerifiedAt && (
                            <p className="text-xs text-muted-foreground">{fmtDate(u.gpsVerifiedAt)}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {u.locationVerified ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </Badge>
                          ) : lat ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300 gap-1">
                              <MapPin className="w-3 h-3" /> Has GPS
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground gap-1">
                              <XCircle className="w-3 h-3" /> No Location
                            </Badge>
                          )}
                        </td>
                        <td className="py-3">
                          {mapsUrl ? (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <MapPin className="w-3 h-3" /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    category: "community" as "music" | "food" | "market" | "sports" | "arts" | "community" | "outdoors" | "other",
    eventDate: "",
    endDate: "",
    venueName: "",
    address: "",
    city: "Milwaukee",
    isFree: true,
    priceCents: 0,
    externalUrl: "",
  });

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.safety.getStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: revenueSummary, refetch: refetchRevenue } = trpc.revenue.summary.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: allEvents, refetch: refetchEvents } = trpc.events.list.useQuery({}, {
    enabled: user?.role === "admin" && activeTab === "events",
  });
  const { data: sourceHealth } = trpc.events.sourceHealth.useQuery(undefined, {
    enabled: user?.role === "admin" && activeTab === "events",
  });
  const { data: reports, refetch: refetchReports } = trpc.safety.getReports.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: flags, refetch: refetchFlags } = trpc.safety.getFlags.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: statsEnhanced, refetch: refetchStatsEnhanced } = trpc.safety.getStatsEnhanced.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: allPhotos, refetch: refetchPhotos } = trpc.safety.getAllPhotos.useQuery(undefined, {
    enabled: user?.role === "admin" && activeTab === "photos",
  });
  const { data: sallyEventFeedback, isLoading: feedbackLoading } = trpc.safety.getSallyEventFeedback.useQuery({ limit: 200 }, {
    enabled: user?.role === "admin" && activeTab === "sally-feedback",
  });
  const searchInput = useMemo(() => ({ query: search, limit: 50, offset: 0 }), [search]);
  const { data: userList, isLoading: usersLoading } = trpc.safety.searchUsers.useQuery(searchInput, {
    enabled: user?.role === "admin",
  });

  // Mutations
  const updateReport = trpc.safety.updateReport.useMutation({
    onSuccess: () => { refetchReports(); toast.success("Report updated"); },
  });
  const resolveFlag = trpc.safety.resolveFlag.useMutation({
    onSuccess: () => { refetchFlags(); toast.success("Flag resolved"); },
  });
  const suspendUser = trpc.safety.suspendUser.useMutation({
    onSuccess: () => {
      toast.success("User suspended");
      utils.safety.searchUsers.invalidate();
      utils.safety.getStats.invalidate();
    },
  });
  const toggleEventSponsored = trpc.events.toggleSponsored.useMutation({
    onSuccess: () => { toast.success("Event sponsorship updated!"); refetchEvents(); refetchRevenue(); },
    onError: () => toast.error("Failed to update"),
  });
  const toggleThirdWheelHost = trpc.events.setThirdWheelHost.useMutation({
    onSuccess: () => { toast.success("Third Wheel host setting updated"); refetchEvents(); },
    onError: () => toast.error("Failed to update host setting"),
  });
  const toggleActivitySponsored = trpc.activities.toggleSponsored.useMutation({
    onSuccess: () => { toast.success("Activity sponsorship updated!"); refetchRevenue(); },
    onError: () => toast.error("Failed to update"),
  });
  const banUserMutation = trpc.safety.banUser.useMutation({
    onSuccess: () => {
      toast.success("User banned");
      utils.safety.searchUsers.invalidate();
      refetchStatsEnhanced();
    },
    onError: () => toast.error("Failed to ban user"),
  });
  const unbanUserMutation = trpc.safety.unbanUser.useMutation({
    onSuccess: () => {
      toast.success("User unbanned");
      utils.safety.searchUsers.invalidate();
      refetchStatsEnhanced();
    },
    onError: () => toast.error("Failed to unban user"),
  });
  const approveUserMutation = trpc.safety.approveUser.useMutation({
    onSuccess: () => {
      toast.success("Account approved and restored");
      utils.safety.searchUsers.invalidate();
      refetchStatsEnhanced();
    },
    onError: () => toast.error("Failed to approve account"),
  });
  const deletePhotoMutation = trpc.safety.deletePhoto.useMutation({
    onSuccess: () => { toast.success("Photo deleted"); refetchPhotos(); },
    onError: () => toast.error("Failed to delete photo"),
  });

  const refreshEventsMutation = trpc.safety.refreshEvents.useMutation({
    onSuccess: () => toast.success("Event refresh started — new events will appear within a minute"),
    onError: (err) => toast.error(`Refresh failed: ${err.message}`),
  });

  // ── Access guard ────────────────────────────────────────────────────────────
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">This area is for Just Putzit administrators only.</p>
          <Link href="/">
            <Button className="rounded-full">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingReports = reports?.filter((r) => r.status === "pending") ?? [];
  const unresolvedFlags = flags?.filter((f) => !f.resolvedAt) ?? [];
  const feedbackRows = (sallyEventFeedback ?? []) as SallyEventFeedbackRow[];
  const interestedFeedbackCount = feedbackRows.filter((item) => item.response === "interested").length;
  const declinedFeedbackCount = feedbackRows.filter((item) => item.response === "not_for_me").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Just Putzit — Safety & Trust Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/members">
              <Button variant="outline" size="sm" className="gap-2 rounded-full"><Users className="w-3.5 h-3.5" /> Administrators</Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => {
                refetchStats();
                refetchReports();
                refetchFlags();
                toast.success("Refreshed");
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            accent="bg-blue-50"
            sub="all time"
          />
          <StatCard
            label="New This Week"
            value={stats?.newThisWeek ?? 0}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            accent="bg-green-50"
          />
          <StatCard
            label="Verified"
            value={stats?.verifiedCount ?? 0}
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            accent="bg-emerald-50"
          />
          <StatCard
            label="Interviewed"
            value={stats?.interviewedCount ?? 0}
            icon={<BarChart3 className="w-5 h-5 text-violet-600" />}
            accent="bg-violet-50"
          />
          <StatCard
            label="Matches Made"
            value={stats?.totalMatches ?? 0}
            icon={<Heart className="w-5 h-5 text-rose-600" />}
            accent="bg-rose-50"
          />
          <StatCard
            label="Messages"
            value={statsEnhanced?.totalMessages ?? stats?.totalMessages ?? 0}
            icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
            accent="bg-amber-50"
          />
          <StatCard
            label="Photos"
            value={statsEnhanced?.totalPhotos ?? 0}
            icon={<Camera className="w-5 h-5 text-sky-600" />}
            accent="bg-sky-50"
            sub={`${statsEnhanced?.verifiedPhotos ?? 0} city-verified`}
          />
          <StatCard
            label="Banned"
            value={statsEnhanced?.bannedUsers ?? 0}
            icon={<Ban className="w-5 h-5 text-red-600" />}
            accent="bg-red-50"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 rounded-full flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
            <TabsTrigger value="revenue" className="rounded-full gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Revenue
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-full gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Events
            </TabsTrigger>
            <TabsTrigger value="sally-feedback" className="rounded-full gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Sally Feedback
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-full gap-1.5">
              <Users className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Reports
              {pendingReports.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-0.5 h-4 px-1">{pendingReports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="flags" className="rounded-full gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              Flags
              {unresolvedFlags.length > 0 && (
                <Badge className="bg-orange-500 text-white text-xs ml-0.5 h-4 px-1">{unresolvedFlags.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="photos" className="rounded-full gap-1.5">
              <Image className="w-3.5 h-3.5" /> Photos
            </TabsTrigger>
            <TabsTrigger value="locations" className="rounded-full gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Locations
            </TabsTrigger>
            <TabsTrigger value="shared-questions" className="rounded-full gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" /> Questions
            </TabsTrigger>
            <TabsTrigger value="outreach" className="rounded-full gap-1.5">
              <Send className="w-3.5 h-3.5" /> Outreach
            </TabsTrigger>
          </TabsList>

          {/* ── Revenue ── */}
          <TabsContent value="revenue">
            <div className="space-y-6">
              {/* Revenue summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard
                  label="Ad Impressions"
                  value={revenueSummary?.totalImpressions ?? 0}
                  icon={<Zap className="w-5 h-5 text-yellow-600" />}
                  accent="bg-yellow-50"
                  sub="login video ads"
                />
                <StatCard
                  label="Ad Revenue"
                  value={`$${((revenueSummary?.totalAdSpentCents ?? 0) / 100).toFixed(2)}`}
                  icon={<DollarSign className="w-5 h-5 text-green-600" />}
                  accent="bg-green-50"
                  sub="earned from vendors"
                />
                <StatCard
                  label="Active Campaigns"
                  value={revenueSummary?.activeAdCampaigns ?? 0}
                  icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
                  accent="bg-blue-50"
                  sub="login ad campaigns"
                />
                <StatCard
                  label="Sponsored Events"
                  value={revenueSummary?.sponsoredEventCount ?? 0}
                  icon={<Star className="w-5 h-5 text-amber-600" />}
                  accent="bg-amber-50"
                  sub="pinned to top"
                />
                <StatCard
                  label="Featured Activities"
                  value={revenueSummary?.sponsoredActivityCount ?? 0}
                  icon={<Star className="w-5 h-5 text-orange-600" />}
                  accent="bg-orange-50"
                  sub="marketplace featured"
                />
              </div>

              {/* AdSense placeholder */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" /> Google AdSense
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-xl p-5 text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">AdSense is ready to activate</p>
                    <p>Ad slots are placed on the Events, Matches, and Home pages. To enable live ads:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Apply at <a href="https://adsense.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">adsense.google.com</a></li>
                      <li>Get your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)</li>
                      <li>Uncomment the AdSense script in <code className="bg-muted px-1 rounded">client/index.html</code></li>
                      <li>Replace the placeholder publisher ID in <code className="bg-muted px-1 rounded">AdSenseSlot.tsx</code></li>
                    </ol>
                    <p className="text-xs mt-2">Estimated earnings: $2–$8 CPM for Milwaukee/Waukesha local traffic.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Sponsored events list */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Sponsored Events
                    <span className="text-xs font-normal text-muted-foreground ml-auto">Toggle to pin events to top of Events page</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-900">
                      <RefreshCw className="h-3.5 w-3.5 text-sky-600" /> Official calendar source health
                    </div>
                    {!sourceHealth || sourceHealth.length === 0 ? (
                      <p className="text-xs text-slate-600">No scheduled source refresh has completed yet.</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {sourceHealth.map((source) => (
                          <div key={source.sourceKey} className="rounded-lg bg-white/80 px-2.5 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-medium text-slate-800">{source.sourceLabel}</span>
                              <Badge className={source.status === "healthy" ? "bg-green-100 text-green-700 border-0" : source.status === "empty" ? "bg-amber-100 text-amber-700 border-0" : "bg-red-100 text-red-700 border-0"}>{source.status}</Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600">
                              {source.status === "healthy" ? `${source.eventsFound} upcoming found` : source.status === "empty" ? "No upcoming events returned" : "Last refresh failed"}
                            </p>
                            {source.status === "failed" && source.errorMessage && <p className="mt-1 line-clamp-1 text-[10px] text-red-600">{source.errorMessage}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!allEvents || allEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No events yet. Post events in the Events tab first.</p>
                  ) : (
                    <div className="space-y-2">
                      {(allEvents as Array<{ id: number; title: string; city: string; eventDate: Date | string; isSponsored: boolean; hasThirdWheelHost?: boolean }>).map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ev.title}</p>
                            <p className="text-xs text-muted-foreground">{ev.city} · {new Date(ev.eventDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => toggleEventSponsored.mutate({ eventId: ev.id, isSponsored: !ev.isSponsored })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                ev.isSponsored
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-700"
                                  : "bg-muted border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-700"
                              }`}
                            >
                              <Star className={`w-3 h-3 ${ev.isSponsored ? "fill-amber-500 text-amber-500" : ""}`} />
                              {ev.isSponsored ? "Sponsored" : "Set Sponsored"}
                            </button>
                            <button
                              onClick={() => toggleThirdWheelHost.mutate({ eventId: ev.id, hasThirdWheelHost: !ev.hasThirdWheelHost })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                ev.hasThirdWheelHost
                                  ? "bg-sky-100 border-sky-300 text-sky-700"
                                  : "bg-muted border-border text-muted-foreground hover:border-sky-300 hover:text-sky-700"
                              }`}
                            >
                              🛡️ {ev.hasThirdWheelHost ? "Host on site" : "Add event host"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Overview ── */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Pending Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingReports.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">All clear — no pending reports.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingReports.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${reasonColors[r.reason] ?? "bg-gray-100 text-gray-800"}`}>
                              {r.reason.replace("_", " ")}
                            </Badge>
                            <span className="text-muted-foreground">User #{r.reportedUserId}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setActiveTab("reports")}
                          >
                            Review <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                      {pendingReports.length > 5 && (
                        <button
                          className="text-xs text-primary mt-1"
                          onClick={() => setActiveTab("reports")}
                        >
                          + {pendingReports.length - 5} more
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="w-4 h-4 text-orange-500" /> Open Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {unresolvedFlags.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No open flags.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unresolvedFlags.slice(0, 5).map((f) => (
                        <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${severityColors[f.severity ?? "low"] ?? "bg-gray-100"}`}>
                              {f.severity}
                            </Badge>
                            <span className="text-muted-foreground">{f.flagType?.replace("_", " ")}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setActiveTab("flags")}
                          >
                            Review <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Sally Event Feedback ── */}
          <TabsContent value="sally-feedback">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Responses" value={feedbackRows.length} icon={<MessageSquare className="w-5 h-5 text-blue-600" />} accent="bg-blue-50" sub="from Sally interviews" />
                <StatCard label="Interested" value={interestedFeedbackCount} icon={<Heart className="w-5 h-5 text-rose-600" />} accent="bg-rose-50" sub="event matches to learn from" />
                <StatCard label="Not for me" value={declinedFeedbackCount} icon={<XCircle className="w-5 h-5 text-slate-600" />} accent="bg-slate-50" sub="future picks should avoid" />
              </div>

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><Heart className="w-4 h-4 text-rose-500" /> Sally’s local event feedback</CardTitle>
                  <p className="text-sm text-muted-foreground">Review what members said about Sally’s verified event recommendations during interviews. Responses improve future suggestions and event-based matches.</p>
                </CardHeader>
                <CardContent>
                  {feedbackLoading ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                  ) : feedbackRows.length === 0 ? (
                    <div className="py-12 text-center">
                      <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                      <p className="font-medium text-foreground">No feedback yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">Feedback will appear here after members respond to Sally’s event picks during an interview.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {feedbackRows.map((feedback) => (
                        <article key={feedback.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={feedback.response === "interested" ? "bg-rose-100 text-rose-800 hover:bg-rose-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
                                {feedback.response === "interested" ? "Interested" : "Not for me"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{fmtDate(feedback.updatedAt)}</span>
                            </div>
                            <p className="mt-2 truncate font-medium text-foreground">{feedback.eventTitle}</p>
                            <p className="text-sm text-muted-foreground">{feedback.eventVenueName ?? "Community venue"} · {feedback.eventCity} · {fmtDate(feedback.eventDate)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Member: {feedback.userName ?? "Unnamed"}{feedback.userEmail ? ` · ${feedback.userEmail}` : ""}</p>
                          </div>
                          {feedback.eventExternalUrl && (
                            <a href={feedback.eventExternalUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-primary hover:underline">Open source</a>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>All Users</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 rounded-full h-9 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-12"><Spinner /></div>
                ) : !userList || userList.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {search ? "No users match your search." : "No users yet."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {(userList as UserRow[]).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between py-3 group cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {(u.name ?? "?")[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name ?? "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{u.email ?? "No email"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground hidden sm:block">{fmtDate(u.createdAt)}</span>
                          <Badge
                            variant={u.role === "admin" ? "default" : u.role === "banned" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {u.role}
                          </Badge>
                          {u.role !== "admin" && (
                            <button
                              className={`p-1 rounded-full transition-colors ${
                                u.role === "banned"
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-red-500 hover:bg-red-50"
                              }`}
                              title={u.role === "banned" ? "Approve & restore account" : "Ban user"}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (u.role === "banned") {
                                  approveUserMutation.mutate({ userId: u.id });
                                } else {
                                  banUserMutation.mutate({ userId: u.id, reason: "Admin action" });
                                }
                              }}
                            >
                              {u.role === "banned" ? (
                                <UserCheck2 className="w-4 h-4" />
                              ) : (
                                <UserX className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {!reports || reports.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">No reports yet — the community is safe!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className={`text-xs ${reasonColors[report.reason] ?? "bg-gray-100 text-gray-800"}`}>
                                {report.reason.replace("_", " ")}
                              </Badge>
                              <Badge variant={report.status === "pending" ? "destructive" : "secondary"} className="text-xs">
                                {report.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Reporter #{report.reporterId} → User #{report.reportedUserId}
                            </p>
                            {report.details && (
                              <p className="text-sm bg-muted/40 rounded-lg p-2 mt-2 italic text-muted-foreground">
                                "{report.details}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">{fmtDate(report.createdAt)}</p>
                          </div>
                          {report.status === "pending" && (
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 h-8 text-xs"
                                onClick={() => updateReport.mutate({ reportId: report.id, status: "reviewed" })}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 h-8 text-xs"
                                onClick={() => {
                                  updateReport.mutate({ reportId: report.id, status: "actioned" });
                                  suspendUser.mutate({ userId: report.reportedUserId });
                                }}
                              >
                                <Ban className="w-3 h-3 mr-1" /> Suspend
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() => updateReport.mutate({ reportId: report.id, status: "dismissed" })}
                              >
                                <XCircle className="w-3 h-3 mr-1" /> Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Events ── */}
          <TabsContent value="events">
            {/* Event Sources Status Dashboard */}
            <Card className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-emerald-500/20 mb-4">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Event Sources Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">📚 Chicago Public Library</p>
                    <p className="text-sm text-white font-semibold">Auto-crawled nightly</p>
                    <p className="text-xs text-emerald-400 mt-1">✓ Active</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">🎨 Art Institute Chicago</p>
                    <p className="text-sm text-white font-semibold">Auto-crawled nightly</p>
                    <p className="text-xs text-emerald-400 mt-1">✓ Active</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">📖 Milwaukee Public Library</p>
                    <p className="text-sm text-white font-semibold">Auto-crawled nightly</p>
                    <p className="text-xs text-emerald-400 mt-1">✓ Active</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 border-t border-white/10 pt-3 mt-3">
                  🔄 Scheduled refresh: Every night at midnight CDT. Events older than 3 days are automatically purged. Cities with fewer than 10 upcoming events are re-seeded with LLM-generated events.
                </p>
              </CardContent>
            </Card>
            {/* Refresh Events CTA */}
            <Card className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/20 mb-4">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">🔄 Manual Refresh</p>
                  <p className="text-blue-300 text-xs mt-0.5">Trigger an immediate refresh of all event sources</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => refreshEventsMutation.mutate()}
                  disabled={refreshEventsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-full gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshEventsMutation.isPending ? "animate-spin" : ""}`} />
                  {refreshEventsMutation.isPending ? "Refreshing..." : "Refresh Now"}
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  Post Community Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 mb-1 block">Event Title *</label>
                    <Input
                      placeholder="e.g. Music on the Square"
                      value={eventForm.title}
                      onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 mb-1 block">Description</label>
                    <textarea
                      placeholder="Describe the event..."
                      value={eventForm.description}
                      onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Category *</label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value as typeof f.category }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      {["music","food","market","sports","arts","community","outdoors","other"].map((c) => (
                        <option key={c} value={c} className="bg-gray-900">{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">City *</label>
                    <select
                      value={eventForm.city}
                      onChange={(e) => setEventForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <option value="Milwaukee" className="bg-gray-900">Milwaukee</option>
                      <option value="Waukesha" className="bg-gray-900">Waukesha</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Start Date &amp; Time *</label>
                    <Input
                      type="datetime-local"
                      value={eventForm.eventDate}
                      onChange={(e) => setEventForm((f) => ({ ...f, eventDate: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">End Date &amp; Time</label>
                    <Input
                      type="datetime-local"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Venue Name</label>
                    <Input
                      placeholder="e.g. Frame Park Bandshell"
                      value={eventForm.venueName}
                      onChange={(e) => setEventForm((f) => ({ ...f, venueName: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Address</label>
                    <Input
                      placeholder="e.g. 1220 Frame Park Dr"
                      value={eventForm.address}
                      onChange={(e) => setEventForm((f) => ({ ...f, address: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">External URL</label>
                    <Input
                      placeholder="https://..."
                      value={eventForm.externalUrl}
                      onChange={(e) => setEventForm((f) => ({ ...f, externalUrl: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-400">Free event?</label>
                    <button
                      type="button"
                      onClick={() => setEventForm((f) => ({ ...f, isFree: !f.isFree }))}
                      className={`w-10 h-6 rounded-full transition-colors ${eventForm.isFree ? "bg-green-500" : "bg-gray-600"}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${eventForm.isFree ? "translate-x-4" : ""}`} />
                    </button>
                    {!eventForm.isFree && (
                      <Input
                        type="number"
                        placeholder="Price (cents)"
                        value={eventForm.priceCents}
                        onChange={(e) => setEventForm((f) => ({ ...f, priceCents: parseInt(e.target.value) || 0 }))}
                        className="bg-white/5 border-white/10 text-white w-32"
                      />
                    )}
                  </div>
                </div>
                <PostEventButton form={eventForm} onSuccess={() => {
                  setEventForm({ title:"", description:"", category:"community", eventDate:"", endDate:"", venueName:"", address:"", city:"Milwaukee", isFree:true, priceCents:0, externalUrl:"" });
                  toast.success("Event posted!");
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flags">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Auto-Generated Flags</CardTitle>
              </CardHeader>
              <CardContent>
                {!flags || flags.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">No flags — all clear!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flags.map((flag) => (
                      <div key={flag.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className={`text-xs ${severityColors[flag.severity ?? "low"] ?? "bg-gray-100"}`}>
                                {flag.severity} severity
                              </Badge>
                              <Badge variant="outline" className="text-xs">{flag.flagType?.replace("_", " ")}</Badge>
                              {flag.resolvedAt && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Resolved</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">User #{flag.userId}</p>
                            {flag.notes && (
                              <p className="text-sm bg-muted/40 rounded-lg p-2 mt-2 text-muted-foreground">{flag.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">{fmtDate(flag.createdAt)}</p>
                          </div>
                          {!flag.resolvedAt && (
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 h-8 text-xs"
                                onClick={() => resolveFlag.mutate({ flagId: flag.id })}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 h-8 text-xs"
                                onClick={() => {
                                  suspendUser.mutate({ userId: flag.userId });
                                  resolveFlag.mutate({ flagId: flag.id });
                                }}
                              >
                                <Ban className="w-3 h-3 mr-1" /> Suspend
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Photos ── */}
          <TabsContent value="photos">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-500" /> Profile Photos
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => refetchPhotos()}>
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!allPhotos || allPhotos.length === 0 ? (
                  <div className="text-center py-16">
                    <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No profile photos uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allPhotos.map((photo) => (
                      <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-border bg-muted/30 aspect-square">
                        <img
                          src={photo.url}
                          alt="Profile photo"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                        />
                        {/* Verification badge */}
                        <div className="absolute top-2 left-2">
                          {photo.cityVerified === true ? (
                            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : photo.cityVerified === false ? (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <XCircle className="w-3 h-3" /> Mismatch
                            </span>
                          ) : (
                            <span className="bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded-full">No GPS</span>
                          )}
                        </div>
                        {/* City label */}
                        {photo.exifCity && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {photo.exifCity}
                          </div>
                        )}
                        {/* Delete button */}
                        <button
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          onClick={() => deletePhotoMutation.mutate({ photoId: photo.id })}
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {/* User ID */}
                        <div className="absolute bottom-6 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                          User #{photo.userId}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── GPS Locations ── */}
          <TabsContent value="locations">
            <LocationsTab />
          </TabsContent>

          <TabsContent value="shared-questions">
            <SharedQuestionEditorialTab />
          </TabsContent>

          <TabsContent value="outreach">
            <OutreachTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* User detail drawer */}
      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onSuspend={(id) => suspendUser.mutate({ userId: id })}
      />
    </div>
  );
}
