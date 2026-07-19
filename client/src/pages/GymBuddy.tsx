import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Users, Calendar, MapPin, Phone, ExternalLink, Star, ChevronRight, Trophy, Zap, Heart } from "lucide-react";

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

// ─── Gym Card ─────────────────────────────────────────────────────────────────
function GymCard({ gym }: { gym: {
  id: number; name: string; address: string | null; city: string; state: string | null;
  phone: string | null; websiteUrl: string | null; membershipUrl: string | null;
  description: string | null; isPartner: boolean; buddyCount: number;
  amenities: string[];
}}) {
  const [, navigate] = useLocation();
  return (
    <Card
      className="cursor-pointer hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10 bg-card border-border"
      onClick={() => navigate(`/gym-buddy/${gym.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl shadow-lg">
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
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                <Star className="w-3 h-3 mr-1" /> Partner
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

          {/* Membership Tab */}
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
                      "Tanning, sauna, smoothie bar",
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
      </div>
    </div>
  );
}
