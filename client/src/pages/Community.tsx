import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Search, BookOpen, Mountain, ChefHat, Music, Palette, Dumbbell, Globe, Gamepad2, ChevronRight, Zap, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";

const GROUP_CATEGORIES = [
  { id: "all", label: "All Groups", icon: <Users className="w-4 h-4" /> },
  { id: "book_club", label: "Book Club", icon: <BookOpen className="w-4 h-4" /> },
  { id: "hiking", label: "Hiking", icon: <Mountain className="w-4 h-4" /> },
  { id: "cooking", label: "Cooking", icon: <ChefHat className="w-4 h-4" /> },
  { id: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
  { id: "arts", label: "Arts", icon: <Palette className="w-4 h-4" /> },
  { id: "fitness", label: "Fitness", icon: <Dumbbell className="w-4 h-4" /> },
  { id: "travel", label: "Travel", icon: <Globe className="w-4 h-4" /> },
  { id: "gaming", label: "Gaming", icon: <Gamepad2 className="w-4 h-4" /> },
  { id: "go_karts", label: "Go-Karts", icon: <span className="text-sm">🏎️</span> },
  { id: "beach", label: "Beaches", icon: <span className="text-sm">🏖️</span> },
  { id: "basketball", label: "Basketball", icon: <span className="text-sm">🏀</span> },
  { id: "tennis", label: "Tennis", icon: <span className="text-sm">🎾</span> },
  { id: "sports", label: "Sports", icon: <span className="text-sm">⚽</span> },
  { id: "social", label: "Social", icon: <span className="text-sm">🤝</span> },
  { id: "other", label: "Other", icon: <span className="text-sm">🌟</span> },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  book_club: "📚", hiking: "🥾", cooking: "👨‍🍳", sports: "⚽",
  arts: "🎨", music: "🎵", gaming: "🎮", travel: "✈️",
  fitness: "💪", social: "🤝", other: "🌟",
};

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", category: "social", city: "" });
  const [cinchStatus, setCinchStatus] = useState<"loading" | "mounted" | "unavailable">("loading");
  const cinchMountRef = useRef<HTMLDivElement>(null);

  const [, navigate] = useLocation();
  const { data: groups, refetch } = trpc.community.getGroups.useQuery({
    // category filter not supported server-side yet, filter client-side
  });
  const { data: cinchConfig, isError: cinchConfigError } = trpc.cinchSeed.getEmbedConfig.useQuery(undefined, { retry: false });

  useEffect(() => {
    const mount = cinchMountRef.current;
    if (!mount || !cinchConfig) return;

    const script = document.createElement("script");
    script.src = cinchConfig.scriptUrl;
    script.dataset.seed = cinchConfig.seedId;
    script.dataset.key = cinchConfig.connectKey;
    script.dataset.platform = "generic";
    script.async = true;
    script.onload = () => setCinchStatus("mounted");
    script.onerror = () => setCinchStatus("unavailable");

    mount.replaceChildren(script);
    setCinchStatus("mounted");
    return () => script.remove();
  }, [cinchConfig]);

  const joinMutation = trpc.community.joinGroup.useMutation({
    onSuccess: () => {
      toast.success("You've joined the group! Sally will introduce you to the other members. 🎉");
      refetch();
    },
  });

  const createMutation = trpc.community.createGroup.useMutation({
    onSuccess: () => {
      toast.success("Group created! Sally will help find members for you. ✨");
      setCreateOpen(false);
      setNewGroup({ name: "", description: "", category: "social", city: "" });
      refetch();
    },
  });

  const filteredGroups = groups?.filter(g =>
    searchQuery === "" ||
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="bg-gradient-to-br from-secondary/10 via-accent/10 to-primary/10 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">Community Groups</h1>
              <p className="text-gray-600">
                Find your people. Join a group, show up, and stop putzing around alone.
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Start a Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Start a New Community Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Group Name</label>
                    <Input
                      placeholder="e.g. Saturday Morning Hikers"
                      value={newGroup.name}
                      onChange={e => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                    <Textarea
                      placeholder="What is this group about? What will you do together?"
                      value={newGroup.description}
                      onChange={e => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={newGroup.category}
                      onChange={e => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {["book_club","hiking","cooking","sports","arts","music","gaming","travel","fitness","social","other"].map(cat => (
                        <option key={cat} value={cat}>{cat.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                    <Input
                      placeholder="e.g. Austin, TX"
                      value={newGroup.city}
                      onChange={e => setNewGroup(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                    onClick={() => createMutation.mutate({
                      name: newGroup.name,
                      description: newGroup.description,
                      category: newGroup.category as "book_club" | "hiking" | "cooking" | "sports" | "arts" | "music" | "gaming" | "travel" | "fitness" | "social" | "other",
                      city: newGroup.city,
                    })}
                    disabled={!newGroup.name || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Group 🎉"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Local venue banner ad slot */}
        <LocalVenueBanner page="community" className="mb-6" />

        <section aria-labelledby="cinch-community-heading" className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
          <div className="grid gap-4 p-5 md:grid-cols-[1fr_260px] md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
                <Sparkles className="h-4 w-4" /> Community workspace
              </div>
              <h2 id="cinch-community-heading" className="text-xl font-bold text-gray-900">Cinch Community recommendations</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                Cinch is managed from your Cinch Seed dashboard. Just Putz It does not send profile, matching, message, or payment records through this integration. Every Cinch-originated improvement requires administrator approval before it can change or publish anything on Just Putz It.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-800">
                <ShieldCheck className="h-4 w-4" /> Review before publish is active
              </div>
            </div>
            <div className="min-h-24 rounded-xl border border-indigo-100 bg-white px-4 py-5 text-sm text-gray-600">
              <div ref={cinchMountRef} aria-live="polite" />
              {cinchConfigError
                ? "The Community workspace is temporarily unavailable. Community Groups remain available below."
                : cinchStatus === "unavailable"
                  ? "Cinch is temporarily unavailable. You can manage it from your Cinch Seed dashboard and return here later."
                  : cinchStatus === "mounted"
                    ? "Cinch is installed. Manage recommendations in your Cinch Seed dashboard."
                    : "Connecting Cinch Community workspace…"}
            </div>
          </div>
        </section>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-gray-200"
          />
        </div>

        {/* Category Filter — two-row wrap on mobile, single scrollable row on desktop */}
        <div className="flex flex-wrap gap-2 pb-1 mb-8 sm:flex-nowrap sm:overflow-x-auto sm:pb-3" style={{ scrollbarWidth: "none" }}>
          {GROUP_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-secondary text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-secondary/40"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gym Buddy Feature Card — shown when Fitness is selected or always at top of All */}
        {(selectedCategory === "fitness" || selectedCategory === "all") && (
          <div
            className="mb-6 rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => navigate("/gym-buddy")}
            style={{
              background: "linear-gradient(135deg, #ff4500 0%, #ff6b35 40%, #ff8c42 100%)",
              boxShadow: "0 8px 32px rgba(255,69,0,0.35)",
            }}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Just Putzit Feature</span>
                  </div>
                  {/* Headline */}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">
                    🏋️ Gym Buddy
                  </h2>
                  <p className="text-white/85 text-sm sm:text-base mb-4 leading-relaxed">
                    Find a workout partner at your gym. Match by workout style, schedule group sessions, and crush your fitness goals together.
                  </p>
                  {/* Value props */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {[
                      { icon: <Dumbbell className="w-3.5 h-3.5" />, text: "Match by workout style" },
                      { icon: <Calendar className="w-3.5 h-3.5" />, text: "Schedule sessions" },
                      { icon: <Zap className="w-3.5 h-3.5" />, text: "Stay accountable" },
                    ].map(vp => (
                      <span key={vp.text} className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                        {vp.icon} {vp.text}
                      </span>
                    ))}
                  </div>
                  {/* CTA */}
                  <button className="flex items-center gap-2 bg-white text-orange-600 font-bold text-sm px-5 py-2.5 rounded-full shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all active:scale-95">
                    Find a Gym Buddy <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Big emoji illustration */}
                <div className="hidden sm:flex flex-col items-center justify-center flex-shrink-0 w-24 h-24 rounded-2xl bg-white/15 text-5xl">
                  🏋️
                </div>
              </div>
            </div>
            {/* Bottom stats bar */}
            <div className="bg-black/20 px-5 sm:px-6 py-2.5 flex items-center gap-4 text-white/80 text-xs font-medium">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Partner gyms in Milwaukee &amp; Waukesha</span>
              <span className="hidden sm:flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Free to join</span>
            </div>
          </div>
        )}


        {/* My Workout Program Card — shown alongside Gym Buddy under Fitness/All */}
        {(selectedCategory === "fitness" || selectedCategory === "all") && (
          <div
            className="mb-6 rounded-2xl overflow-hidden cursor-pointer group border border-emerald-500/30"
            onClick={() => navigate("/my-workout")}
            style={{
              background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
              boxShadow: "0 8px 32px rgba(6,78,59,0.35)",
            }}
          >
            <div className="px-5 sm:px-6 py-5 flex items-center gap-4">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest mb-1">Solo Fitness</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-1">
                  💪 My Workout Program
                </h2>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  No buddy yet? No problem. Build your own weekly workout plan, add custom exercises, and track your progress.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Starter exercises included", "Add your own", "Track sets & reps"].map(v => (
                    <span key={v} className="text-[11px] font-semibold bg-white/15 text-white px-2.5 py-1 rounded-full">{v}</span>
                  ))}
                </div>
                <button className="self-start flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-full shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all active:scale-95">
                  View My Program <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center flex-shrink-0 w-20 h-20 rounded-2xl bg-white/15 text-4xl">
                📋
              </div>
            </div>
            <div className="bg-black/20 px-5 sm:px-6 py-2.5 flex items-center gap-4 text-white/80 text-xs font-medium">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Personalized to your schedule</span>
              <span className="hidden sm:flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Weekly view</span>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Groups Yet in Your Area</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Be the first to start a community group! Sally will help find members who share your interests.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start the First Group
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map(group => (
              <Card key={group.id} className="border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{CATEGORY_EMOJIS[group.category] ?? "🌟"}</div>
                    <Badge variant="secondary" className="text-xs">
                      {group.category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{group.name}</h3>
                  {group.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>Community Group</span>
                    </div>
                    {group.city && (
                      <span className="text-xs text-gray-400">📍 {group.city}</span>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-white rounded-full"
                    size="sm"
                    onClick={() => joinMutation.mutate({ groupId: group.id })}
                    disabled={joinMutation.isPending}
                  >
                    Join Group →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
