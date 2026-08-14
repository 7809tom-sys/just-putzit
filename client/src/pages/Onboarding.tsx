import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const AVATARS = ["😊", "😎", "🥳", "🤩", "😄", "🌟", "🦋", "🌺", "🎯", "🎨", "🎸", "⚽", "🌈", "🦁", "🐺", "🦊"];
const COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#8b5cf6",
  "#ec4899", "#f59e0b", "#06b6d4", "#ef4444",
  "#84cc16", "#6366f1", "#14b8a6", "#f43f5e",
];
const NETWORKS = [
  { value: "singles", label: "Just me", emoji: "💙", desc: "Personal activities and connections" },
  { value: "couples", label: "My partner and me", emoji: "💚", desc: "Double dates and shared activities" },
  { value: "community", label: "Community first", emoji: "🧡", desc: "Local events, groups, and activities" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarEmoji, setAvatarEmoji] = useState("😊");
  const [avatarColor, setAvatarColor] = useState("#f97316");
  const [networkType, setNetworkType] = useState<"singles" | "couples" | "community">("singles");
  const [friendshipEnabled, setFriendshipEnabled] = useState(false);
  const [datingEnabled, setDatingEnabled] = useState(false);

  const completeOnboarding = trpc.profile.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Just Putzit! 🎉 Let's verify your location next.");
      navigate("/verify");
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleFinish = () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    completeOnboarding.mutate({ avatarEmoji, avatarColor, displayName: displayName.trim(), networkType, connectionPreferences: { friendship: friendshipEnabled, dating: datingEnabled } });
  };

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
        {/* Sally header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-3 flex items-center justify-center text-3xl animate-float">
            🤖
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">Welcome to Just Putzit!</h1>
          <p className="text-muted-foreground text-sm mt-1">I'm Sally — let's set up your profile! ✨</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/40" : "w-4 bg-muted"}`} />
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display font-bold text-xl mb-2">What should I call you?</h2>
              <p className="text-muted-foreground text-sm">This is how other members will see you</p>
            </div>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your display name..."
              className="text-center text-lg h-12 rounded-xl"
              maxLength={50}
              onKeyDown={e => e.key === "Enter" && displayName.trim() && setStep(2)}
            />
            <Button
              className="w-full gradient-sally text-white border-0 rounded-xl h-12 text-base btn-scale"
              onClick={() => displayName.trim() && setStep(2)}
              disabled={!displayName.trim()}
            >
              Next →
            </Button>
          </div>
        )}

        {/* Step 2: Avatar */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display font-bold text-xl mb-2">Pick your avatar!</h2>
              <p className="text-muted-foreground text-sm">Choose an emoji and color that feels like you</p>
            </div>

            {/* Preview */}
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all duration-200"
                style={{ background: avatarColor }}
              >
                {avatarEmoji}
              </div>
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-2">
              {AVATARS.map(e => (
                <button
                  key={e}
                  onClick={() => setAvatarEmoji(e)}
                  className={`text-2xl p-1.5 rounded-xl transition-all ${avatarEmoji === e ? "bg-primary/20 scale-110" : "hover:bg-muted"}`}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Color grid */}
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  className={`w-full aspect-square rounded-xl transition-all ${avatarColor === c ? "scale-110 ring-2 ring-foreground ring-offset-2" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>← Back</Button>
              <Button className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale" onClick={() => setStep(3)}>Next →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Network */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display font-bold text-xl mb-2">Which network fits you?</h2>
              <p className="text-muted-foreground text-sm">This only organizes your home base. Your connection choices are next.</p>
            </div>
            <div className="space-y-3">
              {NETWORKS.map(n => (
                <button
                  key={n.value}
                  onClick={() => setNetworkType(n.value as any)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${networkType === n.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <span className="text-3xl">{n.emoji}</span>
                  <div>
                    <p className="font-bold text-foreground">{n.label}</p>
                    <p className="text-sm text-muted-foreground">{n.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(2)}>← Back</Button>
              <Button className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale" onClick={() => setStep(4)}>Next →</Button>
            </div>
          </div>
        )}

        {/* Step 4: Explicit connection opt-ins */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="font-display font-bold text-xl mb-2">How would you like to connect?</h2>
              <p className="text-muted-foreground text-sm">Community events stay on. Dating and friendship introductions are optional and private.</p>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <p className="font-semibold text-teal-900">🧡 Community activities</p>
              <p className="mt-1 text-sm text-teal-800">Always on. Browse events and join public groups without appearing in a dating pool.</p>
            </div>
            <button type="button" onClick={() => setFriendshipEnabled((value) => !value)} className={`w-full rounded-2xl border-2 p-4 text-left transition-colors ${friendshipEnabled ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">🤝 Open to new friendships</p><p className="mt-1 text-sm text-muted-foreground">Let Sally introduce compatible people for shared public activities.</p></div><span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm ${friendshipEnabled ? "bg-primary text-white" : "border border-muted-foreground/40 text-transparent"}`}>✓</span></div>
            </button>
            <button type="button" onClick={() => setDatingEnabled((value) => !value)} className={`w-full rounded-2xl border-2 p-4 text-left transition-colors ${datingEnabled ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">💛 Open to dating introductions</p><p className="mt-1 text-sm text-muted-foreground">Only see date-oriented introductions with people who also opt in.</p></div><span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm ${datingEnabled ? "bg-primary text-white" : "border border-muted-foreground/40 text-transparent"}`}>✓</span></div>
            </button>
            <p className="rounded-xl bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">You can change these settings anytime from your profile. No one sees your choices unless you both opt in to the same kind of connection.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(3)}>← Back</Button>
              <Button className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale" onClick={handleFinish} disabled={completeOnboarding.isPending}>{completeOnboarding.isPending ? "Setting up..." : "Let's Go! 🚀"}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
