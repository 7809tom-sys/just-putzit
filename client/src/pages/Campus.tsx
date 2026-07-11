import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, Users, MapPin, CheckCircle, Search, Heart, ShieldCheck, Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function CampusPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [browseCampusId, setBrowseCampusId] = useState<number | null>(null);

  // .edu verification state
  const [eduEmail, setEduEmail] = useState("");
  const [eduCode, setEduCode] = useState("");
  const [eduStep, setEduStep] = useState<"email" | "code">("email");
  const [eduUniversityName, setEduUniversityName] = useState("");
  const [showEduDialog, setShowEduDialog] = useState(false);

  // Search & join (unverified) state
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestCity, setRequestCity] = useState("");
  const [requestState, setRequestState] = useState("");

  const { data: campuses, refetch } = trpc.campus.listAll.useQuery(undefined, { enabled: !!user });
  const { data: members } = trpc.campus.browseMembers.useQuery(
    { campusId: browseCampusId! },
    { enabled: browseCampusId !== null }
  );
  const { data: searchResults } = trpc.campus.search.useQuery(
    { query: schoolSearch },
    { enabled: schoolSearch.length >= 2 }
  );

  const joinMutation = trpc.campus.join.useMutation({
    onSuccess: () => { toast.success("Joined campus dating pool!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const leaveMutation = trpc.campus.leave.useMutation({
    onSuccess: () => { toast.success("Left campus dating pool."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const requestEduMutation = trpc.campus.requestEduVerification.useMutation({
    onSuccess: (data) => {
      setEduUniversityName(data.universityName);
      setEduStep("code");
      toast.success(`Code sent! Check your ${eduEmail} inbox.`);
    },
    onError: (e) => toast.error(e.message),
  });
  const verifyEduMutation = trpc.campus.verifyEduEmail.useMutation({
    onSuccess: (data) => {
      setShowEduDialog(false);
      setEduStep("email"); setEduEmail(""); setEduCode("");
      refetch();
      toast.success(`Verified! You joined ${data.campusName}${data.isLive ? " — it's live!" : " — building toward launch!"}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const requestNewMutation = trpc.campus.requestNew.useMutation({
    onSuccess: (data) => {
      setShowRequestForm(false);
      setRequestName(""); setRequestCity(""); setRequestState("");
      refetch();
      toast.success(`${data.created ? "Campus requested and joined!" : "Joined " + data.campusName + "!"}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (campuses ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    if (a.city === "Waukesha" && b.city !== "Waukesha") return -1;
    if (b.city === "Waukesha" && a.city !== "Waukesha") return 1;
    return (b.memberCount ?? 0) - (a.memberCount ?? 0);
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4 text-center p-8">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-xl font-bold mb-2">Campus Dating Pool</h2>
          <p className="text-muted-foreground mb-4">Sign in to join your university's dating pool and meet people from your campus.</p>
          <Button asChild><Link href="/">Get Started</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 to-background pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Campus Dating Pool</h1>
          <p className="text-muted-foreground text-sm mt-1">Meet singles from your university</p>
        </div>

        {/* Join Your Campus card */}
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-orange-500" />
              Join Your Campus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Option A: .edu email verified */}
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-green-800">
                    Verified Student{" "}
                    <Badge className="ml-1 text-xs bg-green-600 text-white">Recommended</Badge>
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Use your .edu email to get a verified checkmark and auto-join your campus.
                  </p>
                  <Dialog
                    open={showEduDialog}
                    onOpenChange={(o) => {
                      setShowEduDialog(o);
                      if (!o) { setEduStep("email"); setEduEmail(""); setEduCode(""); }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700 text-white">
                        <Mail className="w-3 h-3 mr-1" /> Verify with .edu Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-green-600" /> Verify Your .edu Email
                        </DialogTitle>
                      </DialogHeader>
                      {eduStep === "email" ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Enter your university email. We'll send a 6-digit code to verify you're a student.
                          </p>
                          <Input
                            type="email"
                            placeholder="you@university.edu"
                            value={eduEmail}
                            onChange={(e) => setEduEmail(e.target.value)}
                          />
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            disabled={!eduEmail.endsWith(".edu") || requestEduMutation.isPending}
                            onClick={() => requestEduMutation.mutate({ email: eduEmail })}
                          >
                            {requestEduMutation.isPending ? "Sending..." : "Send Verification Code"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Found <strong>{eduUniversityName}</strong>! Enter the 6-digit code sent to{" "}
                            <strong>{eduEmail}</strong>.
                          </p>
                          <Input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={eduCode}
                            onChange={(e) => setEduCode(e.target.value.replace(/\D/g, ""))}
                            className="text-center text-2xl tracking-widest font-mono"
                          />
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            disabled={eduCode.length !== 6 || verifyEduMutation.isPending}
                            onClick={() => verifyEduMutation.mutate({ email: eduEmail, code: eduCode })}
                          >
                            {verifyEduMutation.isPending ? "Verifying..." : "Confirm & Join Campus"}
                          </Button>
                          <button
                            className="text-xs text-muted-foreground underline w-full text-center"
                            onClick={() => setEduStep("email")}
                          >
                            Use a different email
                          </button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Option B: Search by school name (unverified) */}
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <Search className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">No .edu Email? Search Your School</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Find your university and join as an unverified member.
                  </p>
                  <div className="mt-2 space-y-2">
                    <Input
                      placeholder="Search university name..."
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                    />
                    {schoolSearch.length >= 2 && (
                      <div className="rounded-lg border bg-background shadow-sm max-h-48 overflow-y-auto">
                        {(searchResults ?? []).length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            No results —{" "}
                            <button
                              className="text-orange-500 underline"
                              onClick={() => { setShowRequestForm(true); setRequestName(schoolSearch); }}
                            >
                              request your campus
                            </button>
                          </div>
                        ) : (
                          (searchResults ?? []).map((c) => (
                            <button
                              key={c.id}
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between border-b last:border-0"
                              onClick={() => { joinMutation.mutate({ campusId: c.id }); setSchoolSearch(""); }}
                            >
                              <div>
                                <p className="text-sm font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.city}, {c.state}</p>
                              </div>
                              <Badge variant={c.isLive ? "default" : "secondary"} className="text-xs shrink-0">
                                {c.isLive ? "Live" : "Building"}
                              </Badge>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {showRequestForm && (
                      <div className="rounded-lg border bg-orange-50 p-3 space-y-2">
                        <p className="text-xs font-semibold text-orange-700">Request a new campus</p>
                        <Input placeholder="University name *" value={requestName} onChange={(e) => setRequestName(e.target.value)} />
                        <div className="flex gap-2">
                          <Input placeholder="City" value={requestCity} onChange={(e) => setRequestCity(e.target.value)} />
                          <Input placeholder="State" value={requestState} onChange={(e) => setRequestState(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={requestName.length < 3 || requestNewMutation.isPending}
                            onClick={() => requestNewMutation.mutate({ name: requestName, city: requestCity || undefined, state: requestState || undefined })}
                          >
                            {requestNewMutation.isPending ? "Requesting..." : "Request & Join"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowRequestForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Campuses */}
        {(campuses ?? []).some((c) => c.isMember) && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">My Campuses</h2>
            <div className="space-y-3">
              {sorted.filter((c) => c.isMember).map((campus) => (
                <Card key={campus.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{campus.name}</span>
                          {(campus as any).verifiedEmail && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </Badge>
                          )}
                          <Badge variant={campus.isLive ? "default" : "secondary"} className="text-xs">
                            {campus.isLive ? "🟢 Live" : "⏳ Building"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{campus.city}, {campus.state}</span>
                          <span className="mx-1">·</span>
                          <Users className="w-3 h-3" />
                          <span><strong className="text-foreground">{campus.memberCount ?? 0}</strong> members</span>
                          {!campus.isLive && (campus as any).launchThreshold && (
                            <span className="text-orange-500">
                              {" "}· {(campus as any).launchThreshold - (campus.memberCount ?? 0)} more to launch
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setBrowseCampusId(campus.id)}>
                              <Heart className="w-3 h-3 mr-1" /> Browse
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{campus.name} — Dating Pool</DialogTitle>
                            </DialogHeader>
                            {!members || members.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p>No other members yet. Invite your classmates!</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {members.map((m, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                                    <Avatar>
                                      <AvatarFallback className="bg-orange-100 text-orange-700">
                                        {(m.displayName ?? "?")[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{m.displayName ?? "Anonymous"}</p>
                                      {m.city && <p className="text-xs text-muted-foreground">{m.city}</p>}
                                      {m.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.bio}</p>}
                                    </div>
                                    {m.gender && <Badge variant="secondary" className="text-xs shrink-0">{m.gender}</Badge>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600 hover:border-red-300"
                          onClick={() => leaveMutation.mutate({ campusId: campus.id })}
                          disabled={leaveMutation.isPending}
                        >
                          Leave
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Campuses */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Campuses</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search campuses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sorted.map((campus) => (
              <Card
                key={campus.id}
                className={`relative overflow-hidden transition-all hover:shadow-md ${campus.isMember ? "ring-2 ring-orange-400" : ""}`}
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: campus.colorHex ?? "#f97316" }} />
                <CardContent className="p-4 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{campus.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{campus.city}, {campus.state}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Users className="w-3 h-3" />
                        <span><strong className="text-foreground">{campus.memberCount ?? 0}</strong> members</span>
                        <Badge variant={campus.isLive ? "default" : "secondary"} className="text-xs ml-1">
                          {campus.isLive ? "Live" : "Building"}
                        </Badge>
                      </div>
                    </div>
                    {campus.isMember ? (
                      <Badge className="bg-orange-500 text-white shrink-0 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" /> Joined
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                        onClick={() => joinMutation.mutate({ campusId: campus.id })}
                        disabled={joinMutation.isPending}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {sorted.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No universities found matching "{search}"</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => { setShowRequestForm(true); setRequestName(search); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <Plus className="w-3 h-3 mr-1" /> Request This Campus
              </Button>
            </div>
          )}
        </div>

        {/* Recommend a Friend Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-1">Know someone who should be here?</h3>
          <p className="text-orange-100 mb-4">Recommend a friend and help grow your campus community!</p>
          <Button asChild variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold">
            <Link href="/shout-out">Recommend a Friend</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
