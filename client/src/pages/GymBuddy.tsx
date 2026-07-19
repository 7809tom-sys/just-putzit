import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Users, Calendar, MapPin, Phone, ExternalLink, Star, ChevronRight, Trophy, Zap, Heart, Crown, Building2, Mail } from "lucide-react";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";

// ─── Exercise Guide Data ──────────────────────────────────────────────────────
const EXERCISES = [
  {
    name: "Squats",
    target: "Legs & Glutes",
    emoji: "🦵",
    how: "Stand shoulder-width apart, keep chest up, lower hips back and down like sitting in a chair. Press through heels to stand.",
    benefits: "Builds lower body strength, engages core, improves balance.",
    difficulty: "Beginner",
  },
  {
    name: "Push-Ups",
    target: "Chest, Shoulders, Triceps",
    emoji: "💪",
    how: "Start in a plank position, lower body until chest nearly touches the floor, push back up keeping core tight.",
    benefits: "Upper body strength and core stability.",
    difficulty: "Beginner",
  },
  {
    name: "Planks",
    target: "Core & Stability",
    emoji: "🧘",
    how: "Hold a push-up position but on forearms, keeping the body in a straight line from head to heels.",
    benefits: "Strengthens the abs, back, and shoulders.",
    difficulty: "Beginner",
  },
  {
    name: "Lunges",
    target: "Legs & Core",
    emoji: "🏃",
    how: "Step forward with one leg, lowering hips until both knees are bent at 90°. Push back and switch legs.",
    benefits: "Improves balance, stability, and lower body strength.",
    difficulty: "Beginner",
  },
  {
    name: "Overhead Press",
    target: "Shoulders & Arms",
    emoji: "🏋️",
    how: "Stand or sit, holding weights at shoulder height. Press upward until arms are fully extended, then lower slowly.",
    benefits: "Builds shoulder and upper body strength.",
    difficulty: "Intermediate",
  },
  {
    name: "Glute Bridges",
    target: "Posterior Chain",
    emoji: "🍑",
    how: "Lie on your back with knees bent and feet flat. Lift hips toward the ceiling, squeezing glutes, then lower back down.",
    benefits: "Strengthens glutes and hamstrings, supports lower back health.",
    difficulty: "Beginner",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-green-500/20 text-green-400 border-green-500/30",
  Intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ─── Partner Tier Config ──────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; badge: string; badgeClass: string; icon: React.ReactNode }> = {
  premium: {
    label: "Premium Partner",
    badge: "🏆 Premium",
    badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    icon: <Crown className="w-3 h-3 mr-1" />,
  },
  featured: {
    label: "Featured Partner",
    badge: "⭐ Featured",
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    icon: <Star className="w-3 h-3 mr-1" />,
  },
  basic: {
    label: "Partner Gym",
    badge: "✓ Partner",
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: null,
  },
};

// ─── Tier accent colours ─────────────────────────────────────────────────────
const TIER_ACCENT = {
  premium: {
    bar: "bg-gradient-to-b from-yellow-400 to-amber-500",
    glow: "hover:shadow-[0_8px_32px_rgba(234,179,8,0.22)]",
    border: "hover:border-yellow-400/60",
    icon: "bg-gradient-to-br from-yellow-400 to-amber-600",
    cta: "text-yellow-400 group-hover:text-yellow-300",
    pill: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  featured: {
    bar: "bg-gradient-to-b from-orange-400 to-red-500",
    glow: "hover:shadow-[0_8px_32px_rgba(249,115,22,0.22)]",
    border: "hover:border-orange-400/60",
    icon: "bg-gradient-to-br from-orange-400 to-red-600",
    cta: "text-orange-400 group-hover:text-orange-300",
    pill: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  basic: {
    bar: "bg-gradient-to-b from-blue-400 to-indigo-500",
    glow: "hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]",
    border: "hover:border-blue-400/40",
    icon: "bg-gradient-to-br from-blue-400 to-indigo-600",
    cta: "text-blue-400 group-hover:text-blue-300",
    pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
} as const;

// ─── Gym Card ─────────────────────────────────────────────────────────────────
function GymCard({ gym }: { gym: {
  id: number; name: string; address: string | null; city: string; state: string | null;
  phone: string | null; websiteUrl: string | null; membershipUrl: string | null;
  description: string | null; isPartner: boolean; buddyCount: number;
  amenities: string[]; partnerTier?: string | null; referralCode?: string | null;
}}) {
  const [, navigate] = useLocation();
  const tier = (gym.partnerTier ?? "basic") as keyof typeof TIER_ACCENT;
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.basic;
  const accent = TIER_ACCENT[tier] ?? TIER_ACCENT.basic;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/gym-buddy/${gym.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/gym-buddy/${gym.id}`)}
      className={`group relative flex overflow-hidden rounded-2xl border border-border bg-card cursor-pointer
        transition-all duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]
        hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]
        ${accent.glow} ${accent.border}`}
    >
      {/* Tier accent bar — left edge */}
      <div className={`w-1 flex-shrink-0 ${accent.bar}`} />

      <div className="flex-1 p-4">
        {/* Top row: icon + name + badges */}
        <div className="flex items-start gap-3 mb-3">
          {/* Gym icon */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-md ${accent.icon}
            transition-transform duration-[220ms] group-hover:scale-110`}>
            🏋️
          </div>

          {/* Name + location */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] leading-snug text-foreground truncate">{gym.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {gym.address ? `${gym.address}, ` : ""}{gym.city}{gym.state ? `, ${gym.state}` : ""}
            </p>
          </div>

          {/* Partner badge */}
          {gym.isPartner && (
            <Badge className={`text-[11px] flex-shrink-0 font-semibold ${tierCfg.badgeClass}`}>
              {tierCfg.badge}
            </Badge>
          )}
        </div>

        {/* Description */}
        {gym.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{gym.description}</p>
        )}

        {/* Amenity pills */}
        {gym.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {gym.amenities.slice(0, 4).map((a) => (
              <span key={a} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${accent.pill}`}>
                {a}
              </span>
            ))}
            {gym.amenities.length > 4 && (
              <span className="text-[11px] text-muted-foreground px-2 py-0.5">+{gym.amenities.length - 4} more</span>
            )}
          </div>
        )}

        {/* Footer: phone + buddy count + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            {gym.phone && (
              <a
                href={`tel:${gym.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3 h-3" /> {gym.phone}
              </a>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {gym.buddyCount} {gym.buddyCount === 1 ? "buddy" : "buddies"}
            </span>
          </div>
          <span className={`text-xs font-semibold flex items-center gap-1 transition-all duration-200 ${accent.cta}`}>
            Find Buddies
            <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ ex }: { ex: typeof EXERCISES[0] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      className="cursor-pointer hover:border-orange-500/30 transition-all duration-200 bg-card"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{ex.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{ex.name}</h3>
              <Badge variant="outline" className={`text-xs ${DIFFICULTY_COLORS[ex.difficulty]}`}>
                {ex.difficulty}
              </Badge>
            </div>
            <p className="text-xs text-orange-400 mt-0.5">{ex.target}</p>
            {expanded && (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">How to: </span>
                  {ex.how}
                </div>
                <div>
                  <span className="font-medium text-foreground">Benefits: </span>
                  {ex.benefits}
                </div>
              </div>
            )}
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GymBuddy() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: gyms, isLoading } = trpc.gym.listGyms.useQuery();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero — Sales-Ready */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1a0a00 0%, #7c1d00 40%, #c0390a 75%, #ff6b35 100%)" }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full border-2 border-white/5" />
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-white/8" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full border border-white/5 -translate-x-1/2 translate-y-1/2" />

        <div className="relative px-4 pt-10 pb-0 max-w-lg mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-orange-400/30 text-orange-200 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-orange-400/30">
              Just Putzit • Milwaukee &amp; Waukesha
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-none mb-3" style={{ letterSpacing: "-0.02em" }}>
            Gym<br />
            <span className="text-orange-300">Buddy.</span>
          </h1>
          <p className="text-white/75 text-base leading-relaxed mb-6 max-w-xs">
            Find a real workout partner at your gym. Match by style, schedule sessions, and actually show up.
          </p>

          {/* Value prop pills */}
          <div className="flex flex-wrap gap-2 mb-7">
            {[
              { emoji: "🏋️", text: "Partner gyms" },
              { emoji: "🤝", text: "Buddy matching" },
              { emoji: "📅", text: "Group sessions" },
              { emoji: "⚡", text: "Free to join" },
            ].map(p => (
              <span key={p.text} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                {p.emoji} {p.text}
              </span>
            ))}
          </div>

          {/* CTA button */}
          {!user && (
            <Button
              className="mb-8 bg-white text-orange-700 hover:bg-orange-50 font-bold text-sm px-6 py-2.5 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95"
              onClick={() => navigate("/signup")}
            >
              Join Free →
            </Button>
          )}
        </div>

        {/* Stats bar */}
        <div className="bg-black/30 backdrop-blur-sm mt-2">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-around gap-2">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white">{gyms?.length ?? 4}</div>
              <div className="text-[11px] text-orange-200 font-medium uppercase tracking-wide">Partner Gyms</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white">{gyms?.reduce((s, g) => s + g.buddyCount, 0) ?? 0}</div>
              <div className="text-[11px] text-orange-200 font-medium uppercase tracking-wide">Gym Buddies</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white">6</div>
              <div className="text-[11px] text-orange-200 font-medium uppercase tracking-wide">Workouts</div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 pt-7 pb-2 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400">How It Works</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { num: "1", icon: "🏋️", title: "Pick Your Gym", desc: "Select from partner gyms in your area" },
            { num: "2", icon: "💪", title: "Set Your Style", desc: "Cardio, lifting, yoga — tell us your vibe" },
            { num: "3", icon: "🤝", title: "Find Buddies", desc: "Get matched with compatible workout partners" },
          ].map((step) => (
            <div
              key={step.title}
              className="relative bg-card border border-border rounded-2xl p-3 text-center
                hover:border-orange-500/30 hover:shadow-[0_4px_16px_rgba(249,115,22,0.1)]
                transition-all duration-200"
            >
              {/* Step number */}
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                {step.num}
              </span>
              <div className="text-2xl mt-1 mb-1.5">{step.icon}</div>
              <div className="text-xs font-bold mb-1 text-foreground">{step.title}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{step.desc}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="gyms">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="gyms" className="flex-1">
              <Dumbbell className="w-4 h-4 mr-1.5" /> Gyms
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex-1">
              <Trophy className="w-4 h-4 mr-1.5" /> Exercises
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex-1">
              <Heart className="w-4 h-4 mr-1.5" /> Join
            </TabsTrigger>
          </TabsList>

          {/* Gyms Tab */}
          <TabsContent value="gyms" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : gyms && gyms.length > 0 ? (
              gyms.flatMap((gym, i) => [
                <GymCard key={gym.id} gym={gym} />,
                // Insert a banner ad after every 3rd gym card
                ...(i > 0 && (i + 1) % 3 === 0
                  ? [<LocalVenueBanner key={`banner-${i}`} page="gym_buddy" className="my-1" />]
                  : []),
              ])
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No gyms listed yet</p>
              </div>
            )}
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Recommended exercises to get started with your gym buddy. Tap any exercise for step-by-step instructions.
            </p>
            {EXERCISES.map((ex) => <ExerciseCard key={ex.name} ex={ex} />)}
          </TabsContent>

          {/* Membership / Join Tab */}
          <TabsContent value="membership">
            <div className="space-y-4">
              <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/5">
                <CardContent className="p-5">
                  <div className="text-3xl mb-3">🏋️</div>
                  <h3 className="font-bold text-lg mb-2">Crunch Fitness — Partner Gym</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crunch Fitness is Just Putzit's featured partner gym. Sign up through us and get connected with local gym buddies instantly.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {[
                      "No judgments — welcoming to all fitness levels",
                      "Group fitness classes included",
                      "Personal training available",
                      "Tanning, sauna, smoothie bar (select locations)",
                      "Referral incentives for Just Putzit members",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-400 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => window.open("https://www.crunch.com", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Crunch Fitness
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-400" /> Referral Program
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Refer a friend to Crunch Fitness through Just Putzit and both of you get exclusive community perks. More details coming soon.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── Partner With Us Section ──────────────────────────────────────── */}
        <div className="mt-10 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold">Partner With Us</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Is your gym in the Milwaukee/Waukesha area? List your facility on Just Putzit and connect with motivated members looking for a home gym.
          </p>

          {/* Tier cards */}
          <div className="grid gap-3">
            {/* Basic */}
            <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">✓ Basic</Badge>
                    </div>
                    <p className="font-semibold text-sm">Gym Listing</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>✓ Gym profile page</li>
                      <li>✓ Buddy matching for members</li>
                      <li>✓ Group session scheduling</li>
                    </ul>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-blue-400">$49</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured */}
            <Card className="border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-xs">⭐ Featured</Badge>
                      <span className="text-xs text-orange-400 font-medium">Most Popular</span>
                    </div>
                    <p className="font-semibold text-sm">Featured Placement</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>✓ Everything in Basic</li>
                      <li>✓ Featured badge on gym card</li>
                      <li>✓ Priority in search results</li>
                      <li>✓ Membership referral tracking</li>
                    </ul>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-orange-400">$99</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-xs">🏆 Premium</Badge>
                    </div>
                    <p className="font-semibold text-sm">Premium Partner</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>✓ Everything in Featured</li>
                      <li>✓ Gold badge + homepage spotlight</li>
                      <li>✓ Dedicated referral code</li>
                      <li>✓ Monthly analytics report</li>
                      <li>✓ Push notifications to nearby users</li>
                    </ul>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-yellow-400">$199</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-4 bg-card border border-border rounded-xl p-4 text-center">
            <Mail className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="font-semibold text-sm mb-1">Ready to partner?</p>
            <p className="text-xs text-muted-foreground mb-3">
              Reach out and we'll get your gym listed within 24 hours.
            </p>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
              onClick={() => window.open("mailto:gyms@justputzit.com?subject=Gym%20Partnership%20Inquiry", "_blank")}
            >
              <Mail className="w-4 h-4 mr-2" /> Contact Us to Partner
            </Button>
          </div>

          {/* Banner ad slot below Partner With Us */}
          <LocalVenueBanner page="gym_buddy" className="mt-5" />
        </div>
      </div>
    </div>
  );
}
