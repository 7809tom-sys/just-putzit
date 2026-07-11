import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
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
} from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date | string;
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
  const { data: reports, refetch: refetchReports } = trpc.safety.getReports.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: flags, refetch: refetchFlags } = trpc.safety.getFlags.useQuery(undefined, {
    enabled: user?.role === "admin",
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
            value={stats?.totalMessages ?? 0}
            icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
            accent="bg-amber-50"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 rounded-full">
            <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
            <TabsTrigger value="events" className="rounded-full gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Events
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
          </TabsList>

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
                          <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                            {u.role}
                          </Badge>
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

          {/* ── Flags ── */}
          <TabsContent value="events">
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
