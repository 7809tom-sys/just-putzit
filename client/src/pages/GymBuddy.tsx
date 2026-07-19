import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Users, Calendar, MapPin, Phone, ExternalLink, Star, ChevronRight, Trophy, Zap, Heart, Crown, Building2, Mail } from "lucide-react";

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

// ─── Gym Card ─────────────────────────────────────────────────────────────────
function GymCard({ gym }: { gym: {
  id: number; name: string; address: string | null; city: string; state: string | null;
  phone: string | null; websiteUrl: string | null; membershipUrl: string | null;
  description: string | null; isPartner: boolean; buddyCount: number;
  amenities: string[]; partnerTier?: string | null; referralCode?: string | null;
}}) {
  const [, navigate] = useLocation();
  const tier = gym.partnerTier ?? "basic";
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.basic;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-card border-border ${
        tier === "premium"
          ? "hover:border-yellow-500/50 hover:shadow-yellow-500/10"
          : tier === "featured"
          ? "hover:border-orange-500/50 hover:shadow-orange-500/10"
          : "hover:border-blue-500/30 hover:shadow-blue-500/5"
      }`}
      onClick={() => navigate(`/gym-buddy/${gym.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
              tier === "premium"
                ? "bg-gradient-to-br from-yellow-500 to-amber-600"
                : tier === "featured"
                ? "bg-gradient-to-br from-orange-500 to-red-600"
                : "bg-gradient-to-br from-blue-500 to-indigo-600"
            }`}>
              🏋️
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{gym.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {gym.address ? `${gym.address}, ` : ""}{gym.city}, {gym.state}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {gym.isPartner && (
              <Badge className={`text-xs ${tierCfg.badgeClass}`}>
                {tierCfg.icon}{tierCfg.badge}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {gym.buddyCount} {gym.buddyCount === 1 ? "buddy" : "buddies"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {gym.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{gym.description}</p>
        )}
        {gym.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {gym.amenities.slice(0, 5).map((a) => (
              <span key={a} className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                {a}
              </span>
            ))}
            {gym.amenities.length > 5 && (
              <span className="text-xs text-muted-foreground">+{gym.amenities.length - 5} more</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {gym.phone && (
              <a href={`tel:${gym.phone}`} onClick={(e) => e.stopPropagation()}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {gym.phone}
              </a>
            )}
          </div>
          <Button size="sm" variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 -mr-2">
            Find Buddies <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
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
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-orange-800 px-4 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-lg mx-auto text-center">
          <div className="text-5xl mb-3">🏋️‍♂️</div>
          <h1 className="text-3xl font-bold text-white mb-2">Gym Buddy</h1>
          <p className="text-orange-100 text-sm leading-relaxed mb-6">
            Find workout partners at your gym, schedule group sessions, and crush your fitness goals together.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-center">
              <div className="text-xl font-bold">{gyms?.length ?? "—"}</div>
              <div className="text-xs text-orange-100">Gyms</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-center">
              <div className="text-xl font-bold">{gyms?.reduce((sum, g) => sum + g.buddyCount, 0) ?? "—"}</div>
              <div className="text-xs text-orange-100">Gym Buddies</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-center">
              <div className="text-xl font-bold">6</div>
              <div className="text-xs text-orange-100">Workouts</div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" /> How It Works
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "🏋️", title: "Pick Your Gym", desc: "Select from partner gyms in your area" },
            { icon: "💪", title: "Set Your Style", desc: "Cardio, lifting, yoga — tell us your vibe" },
            { icon: "🤝", title: "Find Buddies", desc: "Get matched with compatible workout partners" },
          ].map((step) => (
            <div key={step.title} className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{step.icon}</div>
              <div className="text-xs font-semibold mb-1">{step.title}</div>
              <div className="text-xs text-muted-foreground leading-tight">{step.desc}</div>
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
              gyms.map((gym) => <GymCard key={gym.id} gym={gym} />)
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
        </div>
      </div>
    </div>
  );
}
