import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MessageCircle, Shield, Star, Zap, MapPin, Heart } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-sally animate-pulse flex items-center justify-center text-2xl">🤖</div>
      </div>
    );
  }

  const traits = profile?.traits as any;

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8 max-w-2xl">
        {/* Profile card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg flex-shrink-0"
              style={{ background: profile?.avatarColor || "#f97316" }}
            >
              {profile?.avatarEmoji || "😊"}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <h1 className="font-display font-bold text-2xl">{profile?.displayName || user?.name}</h1>
                {profile?.isVerified ? (
                  <Badge className="bg-green-100 text-green-700 border-0 gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                    <Shield className="w-3 h-3" /> Verification pending
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-3">{user?.email}</p>
              <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                <Badge variant="secondary" className="rounded-full capitalize">
                  {profile?.networkType === "singles" ? "💙" : profile?.networkType === "couples" ? "💚" : "🧡"} {profile?.networkType} Network
                </Badge>
                <Badge variant="secondary" className="rounded-full gap-1">
                  <Star className="w-3 h-3" /> {profile?.interviewCount || 0} Sally chats
                </Badge>
                {profile?.city && (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    <MapPin className="w-3 h-3" /> {profile.city}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {traits?.aiSummary && (
            <div className="mt-6 bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full gradient-sally flex items-center justify-center text-xs">🤖</div>
                <span className="text-xs font-semibold text-primary">Sally's take on you</span>
              </div>
              <p className="text-sm text-foreground italic">"{traits.aiSummary}"</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale gap-2"
              onClick={() => navigate("/interview")}
            >
              <MessageCircle className="w-4 h-4" /> Chat with Sally
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl gap-2"
              onClick={() => navigate("/matches")}
            >
              <Heart className="w-4 h-4" /> My Matches
            </Button>
          </div>
        </div>

        {/* Traits */}
        {traits && Object.keys(traits).filter(k => k !== "aiSummary").length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Your Personality Insights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {traits.personalityKeywords && (
                <TraitCard label="Personality" value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.personalityKeywords.map((k: string) => (
                      <Badge key={k} variant="secondary" className="rounded-full text-xs">{k}</Badge>
                    ))}
                  </div>
                } />
              )}
              {traits.hobbies && (
                <TraitCard label="Hobbies" value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.hobbies.map((h: string) => (
                      <Badge key={h} variant="secondary" className="rounded-full text-xs">{h}</Badge>
                    ))}
                  </div>
                } />
              )}
              {traits.perfectSunday && <TraitCard label="Perfect Sunday" value={traits.perfectSunday} />}
              {traits.idealDate && <TraitCard label="Ideal Date" value={traits.idealDate} />}
              {traits.dreamVacation && <TraitCard label="Dream Vacation" value={traits.dreamVacation} />}
              {traits.favoriteFood && <TraitCard label="Favorite Food" value={traits.favoriteFood} />}
              {traits.morningOrNight && <TraitCard label="Morning or Night?" value={traits.morningOrNight} />}
              {traits.lookingFor && <TraitCard label="Looking For" value={traits.lookingFor} />}
              {traits.funFact && <TraitCard label="Fun Fact" value={traits.funFact} />}
              {traits.guiltPleasure && <TraitCard label="Guilty Pleasure" value={traits.guiltPleasure} />}
            </div>
          </div>
        )}

        {/* Vetting status */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Continuous Vetting Status
          </h2>
          <div className="space-y-3">
            <VettingItem icon="✅" label="Profile Created" status="complete" />
            <VettingItem icon="🎤" label="Dynamic Re-Interview" status={profile?.interviewCount ? "complete" : "pending"} desc={`${profile?.interviewCount || 0} session${profile?.interviewCount !== 1 ? "s" : ""} completed`} />
            <VettingItem icon="🔒" label="Live Background Audit" status="pending" desc="Coming soon" />
            <VettingItem icon="📍" label="GPS Location Verification" status={profile?.latitude ? "complete" : "pending"} desc={profile?.city || "Not set"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TraitCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      {typeof value === "string" ? <p className="text-sm text-foreground">{value}</p> : value}
    </div>
  );
}

function VettingItem({ icon, label, status, desc }: { icon: string; label: string; status: "complete" | "pending"; desc?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Badge className={status === "complete" ? "bg-green-100 text-green-700 border-0" : "bg-muted text-muted-foreground border-0"}>
        {status === "complete" ? "✓ Done" : "Pending"}
      </Badge>
    </div>
  );
}
