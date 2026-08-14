import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Phone, Globe, Users, Calendar, Dumbbell, CheckCircle, Plus, Clock, CalendarPlus, Crown, Star, ExternalLink, Flag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";
import { parseGymSessionDraft } from "../../../shared/gymSessionDraft";

const WORKOUT_STYLES = [
  { value: "cardio", label: "🏃 Cardio", desc: "Running, cycling, HIIT" },
  { value: "lifting", label: "🏋️ Lifting", desc: "Free weights, machines" },
  { value: "yoga", label: "🧘 Yoga / Flexibility", desc: "Yoga, stretching, Pilates" },
  { value: "group_classes", label: "👥 Group Classes", desc: "Zumba, spin, aerobics" },
  { value: "crossfit", label: "⚡ CrossFit / Functional", desc: "WODs, functional training" },
  { value: "sports", label: "🏀 Sports Training", desc: "Basketball, tennis, etc." },
  { value: "swimming", label: "🏊 Swimming", desc: "Lap swimming, water aerobics" },
  { value: "general", label: "💪 General Fitness", desc: "Mix of everything" },
];

const SCHEDULE_SLOTS = [
  "Early Morning (5–7 AM)", "Morning (7–9 AM)", "Mid-Morning (9–11 AM)",
  "Lunch (11 AM–1 PM)", "Afternoon (1–4 PM)", "Evening (4–7 PM)", "Night (7–10 PM)",
];

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner", description: "Building a consistent routine" },
  { value: "intermediate", label: "Intermediate", description: "Comfortable with regular workouts" },
  { value: "advanced", label: "Advanced", description: "Training with experience and focus" },
] as const;

function BuddyCard({ buddy, onMessage }: {
  buddy: {
    userId: number; displayName: string | null; avatarEmoji: string | null;
    avatarColor: string | null; workoutStyles: string[]; schedulePrefs?: string[]; schedule?: string[];
    bio: string | null; isVerified: boolean; city: string | null; fitnessLevel?: string | null; goals?: string | null;
  };
  onMessage: (userId: number, name: string) => void;
}) {
  const { user } = useAuth();
  const isMe = user?.id === buddy.userId;

  return (
    <Card className="bg-card border-border hover:border-orange-500/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
            style={{ background: buddy.avatarColor || "#f97316" }}
          >
            {buddy.avatarEmoji || "💪"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{buddy.displayName || "Gym Buddy"}</span>
              {buddy.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              )}
              {buddy.city && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />{buddy.city}
                </span>
              )}
            </div>
            {buddy.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{buddy.bio}</p>
            )}
            {(buddy.fitnessLevel || buddy.goals) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {buddy.fitnessLevel && <Badge variant="outline" className="border-orange-500/25 bg-orange-500/5 text-[10px] font-medium capitalize text-orange-500">{buddy.fitnessLevel}</Badge>}
                {buddy.goals && <span className="line-clamp-1 text-xs text-muted-foreground">Goal: {buddy.goals}</span>}
              </div>
            )}
            {buddy.workoutStyles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {buddy.workoutStyles.map((s) => {
                  const style = WORKOUT_STYLES.find((ws) => ws.value === s);
                  return (
                    <span key={s} className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
                      {style ? style.label : s}
                    </span>
                  );
                })}
              </div>
            )}
            {((buddy.schedulePrefs ?? buddy.schedule ?? []).length > 0) && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(buddy.schedulePrefs ?? buddy.schedule ?? []).slice(0, 2).map((s) => (
                  <span key={s} className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                    <Clock className="w-2.5 h-2.5 inline mr-0.5" />{s.split("(")[0].trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!isMe && user && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
            onClick={() => onMessage(buddy.userId, buddy.displayName || "Gym Buddy")}
          >
            💬 Message
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function addToCalendar(type: "google" | "apple" | "outlook", session: {
  title: string; scheduledAt: string; description: string | null;
}, gymName: string, gymAddress: string) {
  const start = new Date(session.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
  const title = encodeURIComponent(`${session.title} @ ${gymName}`);
  const details = encodeURIComponent(session.description || `Group workout at ${gymName}`);
  const location = encodeURIComponent(gymAddress);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  if (type === "google") {
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
    window.open(url, "_blank");
  } else if (type === "outlook") {
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${details}&location=${location}`;
    window.open(url, "_blank");
  } else {
    // Apple Calendar via .ics download
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${decodeURIComponent(title)}`,
      `DESCRIPTION:${decodeURIComponent(details)}`,
      `LOCATION:${decodeURIComponent(location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${session.title.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

function SessionCard({ session, onRsvp, myRsvps, gymName, gymAddress }: {
  session: {
    id: number; title: string; description: string | null; workoutType: string;
    scheduledAt: string; maxParticipants: number | null; rsvpCount: number;
    hostName: string | null; hostEmoji: string | null; hostColor: string | null;
    participantAvatars?: Array<{ userId: number; emoji: string; color: string; name: string }>;
    extraParticipants?: number;
  };
  onRsvp: (sessionId: number) => void;
  myRsvps: number[];
  gymName: string;
  gymAddress: string;
}) {
  const isRsvped = myRsvps.includes(session.id);
  const date = new Date(session.scheduledAt);
  const style = WORKOUT_STYLES.find((ws) => ws.value === session.workoutType);
  const isFull = session.maxParticipants != null && session.rsvpCount >= session.maxParticipants;

  return (
    <Card className={`bg-card border-border transition-colors ${isRsvped ? "border-orange-500/50" : "hover:border-orange-500/20"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm">{session.title}</span>
              {isRsvped && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Joined</Badge>}
            </div>
            <p className="text-xs text-orange-400 mb-1.5">{style ? style.label : session.workoutType}</p>
            {session.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{session.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {session.rsvpCount}{session.maxParticipants ? `/${session.maxParticipants}` : ""}
              </span>
            </div>
            {session.hostName && (
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ background: session.hostColor || "#f97316" }}
                >
                  {session.hostEmoji || "💪"}
                </div>
                <span className="text-xs text-muted-foreground">Hosted by {session.hostName}</span>
              </div>
            )}
            {/* Participant avatars */}
            {session.participantAvatars && session.participantAvatars.length > 0 && (
              <div className="flex items-center gap-1 mt-2.5">
                <div className="flex -space-x-2">
                  {session.participantAvatars.map((p) => (
                    <div
                      key={p.userId}
                      title={p.name}
                      className="w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-sm ring-1 ring-border"
                      style={{ background: p.color }}
                    >
                      {p.emoji}
                    </div>
                  ))}
                  {(session.extraParticipants ?? 0) > 0 && (
                    <div className="w-7 h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-1 ring-border">
                      +{session.extraParticipants}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground ml-1">
                  {session.rsvpCount === 1 ? "1 going" : `${session.rsvpCount} going`}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              variant={isRsvped ? "default" : "outline"}
              className={isRsvped
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"}
              disabled={isFull && !isRsvped}
              onClick={() => onRsvp(session.id)}
            >
              {isRsvped ? "✓ Joined" : isFull ? "Full" : "Join"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-orange-400 px-2">
                  <CalendarPlus className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => addToCalendar("google", session, gymName, gymAddress)}>
                  📅 Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addToCalendar("apple", session, gymName, gymAddress)}>
                  🍎 Apple Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addToCalendar("outlook", session, gymName, gymAddress)}>
                  📧 Outlook
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GymPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const id = parseInt(gymId || "0", 10);
  const utils = trpc.useUtils();

  const { data: gym, isLoading: gymLoading } = trpc.gym.getGym.useQuery({ gymId: id }, { enabled: id > 0 });
  const { data: buddies, isLoading: buddiesLoading, refetch: refetchBuddies } = trpc.gym.findBuddies.useQuery({ gymId: id }, { enabled: id > 0 && !!user });
    const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = trpc.gym.listSessions.useQuery({ gymId: id }, { enabled: id > 0 });
  const { data: myProfile } = trpc.gym.getMyBuddyProfile.useQuery({ gymId: id }, { enabled: id > 0 && !!user });
  const { data: myRsvps = [] } = trpc.gym.getMyRsvps.useQuery(undefined, { enabled: !!user });
  const upsertProfile = trpc.gym.saveBuddyProfile.useMutation({
    onSuccess: () => { refetchBuddies(); void utils.gym.getMyBuddyProfile.invalidate({ gymId: id }); setShowProfileDialog(false); toast.success("Gym Buddy profile updated!"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const createSession = trpc.gym.createSession.useMutation({
    onSuccess: () => { refetchSessions(); resetSessionForm(); setShowSessionDialog(false); toast.success("Session created!"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const rsvpSession = trpc.gym.rsvpSession.useMutation({
    onSuccess: () => refetchSessions(),
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const claimGym = trpc.gym.claimGym.useMutation({
    onSuccess: () => {
      toast.success("Claim submitted! We'll review and contact you within 24 hours.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(myProfile?.workoutStyles ?? []);
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>(myProfile?.schedule ?? []);
  const [bio, setBio] = useState(myProfile?.bio ?? "");
  const [fitnessLevel, setFitnessLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [goals, setGoals] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionType, setSessionType] = useState("general");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [sessionMax, setSessionMax] = useState("10");

  const resetSessionForm = () => {
    setSessionTitle("");
    setSessionDesc("");
    setSessionType("general");
    setSessionDate("");
    setSessionTime("");
    setSessionMax("10");
  };

  const toggleStyle = (v: string) =>
    setSelectedStyles((prev) => prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]);
  const toggleSchedule = (v: string) =>
    setSelectedSchedule((prev) => prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]);

  const handleSaveProfile = () => {
    if (!user) { toast.error("Sign in to save your profile"); return; }
    upsertProfile.mutate({ gymId: id, workoutStyles: selectedStyles, schedule: selectedSchedule, fitnessLevel, goals: goals.trim() || undefined, bio: bio || undefined });
  };

  const handleCreateSession = () => {
    if (!user) { toast.error("Sign in to create a session"); return; }
    const parsed = parseGymSessionDraft({
      title: sessionTitle,
      date: sessionDate,
      time: sessionTime,
      maxParticipants: sessionMax,
    });
    if (!parsed.ok) { toast.error(parsed.message); return; }
    createSession.mutate({
      gymId: id, title: sessionTitle, notes: sessionDesc || undefined,
      workoutType: sessionType, scheduledAt: parsed.scheduledAt, maxParticipants: parsed.maxParticipants,
    });
  };

  const handleRsvp = (sessionId: number) => {
    if (!user) { toast.error("Sign in to join a session"); return; }
    rsvpSession.mutate({ sessionId });
  };

  const handleMessage = (userId: number, name: string) => {
    navigate(`/chat?userId=${userId}`);
  };

  if (gymLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🏋️</div>
          <p className="text-muted-foreground">Loading gym...</p>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Gym not found</p>
          <Button variant="ghost" onClick={() => navigate("/gym-buddy")} className="mt-3">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gym Buddy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-orange-800 px-4 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-lg mx-auto">
          <button onClick={() => navigate("/gym-buddy")} className="flex items-center gap-1.5 text-orange-100 hover:text-white mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> All Gyms
          </button>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
              🏋️
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">{gym.name}</h1>
              <p className="text-orange-100 text-sm mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {gym.address ? `${gym.address}, ` : ""}{gym.city}, {gym.state}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {gym.isPartner && (() => {
                  const tier = gym.partnerTier ?? "basic";
                  if (tier === "premium") return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs"><Crown className="w-3 h-3 mr-1" />🏆 Premium Partner</Badge>;
                  if (tier === "featured") return <Badge className="bg-orange-400/20 text-orange-200 border-orange-400/40 text-xs"><Star className="w-3 h-3 mr-1" />⭐ Featured Partner</Badge>;
                  return <Badge className="bg-white/20 text-white border-white/30 text-xs">✓ Partner Gym</Badge>;
                })()}
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  <Users className="w-3 h-3 mr-1" />{(gym as typeof gym & { buddyCount?: number }).buddyCount ?? 0} buddies
                </Badge>
              </div>
            </div>
          </div>
          {gym.description && (
            <p className="text-orange-100 text-sm mt-4 leading-relaxed">{gym.description}</p>
          )}
          <div className="flex gap-2 mt-4 flex-wrap">
            {gym.phone && (
              <a href={`tel:${gym.phone}`} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/30">
                <Phone className="w-3.5 h-3.5" /> {gym.phone}
              </a>
            )}
            {gym.websiteUrl && (
              <a href={gym.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/30">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {gym.membershipUrl && (
              <a href={gym.membershipUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-orange-400/80 text-white text-xs px-3 py-1.5 rounded-full hover:bg-orange-400">
                <ExternalLink className="w-3 h-3" /> Join Gym
              </a>
            )}
            {!gym.claimedByUserId && user && (
              <button
                onClick={() => claimGym.mutate({ gymId: id })}
                disabled={claimGym.isPending}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-xs px-3 py-1.5 rounded-full hover:bg-white/20 border border-white/20 disabled:opacity-50"
              >
                <Flag className="w-3 h-3" /> {claimGym.isPending ? "Submitting..." : "Claim This Gym"}
              </button>
            )}
            {gym.claimedByUserId && (
              <span className="flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs px-3 py-1.5 rounded-full border border-green-500/30">
                <CheckCircle className="w-3 h-3" /> Claimed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Amenities */}
      {gym.amenities.length > 0 && (
        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="flex flex-wrap gap-2">
            {gym.amenities.map((a) => (
              <span key={a} className="text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full border border-border">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Banner Ad Slot — between amenities and membership CTA */}
      <div className="px-4 max-w-lg mx-auto mb-2">
        <LocalVenueBanner page="gym_detail" />
      </div>

      {/* Membership Referral CTA */}
      {gym.membershipUrl && (
        <div className="px-4 max-w-lg mx-auto mb-2">
          <Card className={`border-2 ${
            gym.partnerTier === "premium"
              ? "border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-amber-500/5"
              : gym.partnerTier === "featured"
              ? "border-orange-500/30 bg-gradient-to-br from-orange-500/8 to-transparent"
              : "border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">🏋️</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-0.5">Join {gym.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sign up for a membership through Just Putzit and get instantly connected with gym buddies in your area.
                    {gym.referralCode && (
                      <span className="ml-1 font-medium text-orange-400">Use code: {gym.referralCode}</span>
                    )}
                  </p>
                  <a
                    href={gym.membershipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg text-white ${
                      gym.partnerTier === "premium"
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Get Membership
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA for profile */}
      {user && !myProfile && (
        <div className="px-4 max-w-lg mx-auto mb-2">
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Set up your Gym Buddy profile</p>
                <p className="text-xs text-muted-foreground">Tell others your workout style to get matched</p>
              </div>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                onClick={() => setShowProfileDialog(true)}>
                Set Up
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        <Tabs defaultValue="buddies">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="buddies" className="flex-1">
              <Users className="w-4 h-4 mr-1.5" /> Buddies ({buddies?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex-1">
              <Calendar className="w-4 h-4 mr-1.5" /> Sessions ({sessions?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* Buddies Tab */}
          <TabsContent value="buddies" className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                {buddies?.length ?? 0} members at this gym
              </p>
              {user && (
                <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => { setSelectedStyles(myProfile?.workoutStyles ?? []); setSelectedSchedule(myProfile?.schedule ?? []); setFitnessLevel((myProfile?.fitnessLevel as "beginner" | "intermediate" | "advanced") ?? "intermediate"); setGoals(myProfile?.goals ?? ""); setBio(myProfile?.bio ?? ""); setShowProfileDialog(true); }}>
                  <Dumbbell className="w-3.5 h-3.5 mr-1.5" />
                  {myProfile ? "Edit Profile" : "Join Here"}
                </Button>
              )}
            </div>
            {buddiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}
              </div>
            ) : buddies && buddies.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (buddies as any[]).map((b: any) => <BuddyCard key={b.userId} buddy={b} onMessage={handleMessage} />)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No gym buddies yet</p>
                <p className="text-xs mt-1">Be the first to set up your profile here!</p>
              </div>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Upcoming group workouts</p>
              {user && (
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => { resetSessionForm(); setShowSessionDialog(true); }}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Schedule
                </Button>
              )}
            </div>
            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-28 bg-muted/30 rounded-xl animate-pulse" />)}
              </div>
            ) : sessions && sessions.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sessions as any[]).map((s: any) => <SessionCard key={s.id} session={s} onRsvp={handleRsvp} myRsvps={myRsvps as number[]} gymName={gym.name} gymAddress={gym.address ? `${gym.address}, ${gym.city}, ${gym.state}` : `${gym.city}, ${gym.state}`} />)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No sessions scheduled yet</p>
                {user && <p className="text-xs mt-1">Be the first to schedule a group workout!</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Gym Buddy Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">Workout Styles</Label>
              <div className="grid grid-cols-2 gap-2">
                {WORKOUT_STYLES.map((ws) => (
                  <button
                    key={ws.value}
                    onClick={() => toggleStyle(ws.value)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-colors ${
                      selectedStyles.includes(ws.value)
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-border bg-card hover:border-orange-500/30"
                    }`}
                  >
                    <div className="font-medium">{ws.label}</div>
                    <div className="text-muted-foreground mt-0.5">{ws.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Preferred Schedule</Label>
              <div className="space-y-1.5">
                {SCHEDULE_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => toggleSchedule(slot)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      selectedSchedule.includes(slot)
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-border bg-card hover:border-orange-500/30"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Fitness Level</Label>
              <Select value={fitnessLevel} onValueChange={(value) => setFitnessLevel(value as "beginner" | "intermediate" | "advanced")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FITNESS_LEVELS.map((level) => <SelectItem key={level.value} value={level.value}>{level.label} — {level.description}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Workout Goal <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea placeholder="e.g. Build strength, train for a 5K, stay consistent..." value={goals} onChange={(e) => setGoals(e.target.value)} className="text-sm resize-none" rows={2} maxLength={500} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">About You (optional)</Label>
              <Textarea
                placeholder="Tell potential gym buddies about your fitness goals..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="text-sm resize-none"
                rows={3}
              />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSaveProfile}
              disabled={upsertProfile.isPending}
            >
              {upsertProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Schedule a Group Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-1.5 block">Session Title *</Label>
              <Input placeholder="e.g. Morning Leg Day" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Workout Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_STYLES.map((ws) => (
                    <SelectItem key={ws.value} value={ws.value}>{ws.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Date *</Label>
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Time *</Label>
                <Input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Max Participants</Label>
                <Input type="number" min="2" max="20" value={sessionMax} onChange={(e) => setSessionMax(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Description (optional)</Label>
              <Textarea placeholder="What's the plan? Any equipment needed?" value={sessionDesc} onChange={(e) => setSessionDesc(e.target.value)} rows={2} className="resize-none text-sm" />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleCreateSession}
              disabled={createSession.isPending}
            >
              {createSession.isPending ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
