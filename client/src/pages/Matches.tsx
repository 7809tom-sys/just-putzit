import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Heart, MessageCircle, Gamepad2, Sparkles, Users, Shield, Calendar } from "lucide-react";

export default function Matches() {
  const [, navigate] = useLocation();
  const { data: myMatches, isLoading, refetch } = trpc.matchmaking.getMyMatches.useQuery();
  const findMatches = trpc.matchmaking.findMatches.useMutation({
    onSuccess: data => {
      if (data.matches.length > 0) {
        toast.success(`Sally found ${data.matches.length} new match${data.matches.length !== 1 ? "es" : ""}! 🎉`);
        refetch();
      } else {
        toast.info("No new matches right now — keep chatting with Sally to improve your profile!");
      }
    },
    onError: () => toast.error("Couldn't find matches. Please try again."),
  });

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Your Matches 💕</h1>
            <p className="text-muted-foreground mt-1">Sally-powered compatibility matching</p>
          </div>
          <Button
            className="gradient-sally text-white border-0 rounded-xl btn-scale gap-2"
            onClick={() => findMatches.mutate()}
            disabled={findMatches.isPending}
          >
            <Sparkles className="w-4 h-4" />
            {findMatches.isPending ? "Finding..." : "Find Matches"}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 animate-pulse h-48" />
            ))}
          </div>
        ) : myMatches && myMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myMatches.map(match => (
              <MatchCard key={match.id} match={match} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-4xl animate-float">🤖</div>
            <h2 className="font-display font-bold text-2xl mb-3">No matches yet!</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Chat with Sally to build your profile, then let her find your perfect connections!
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate("/interview")}>
                <MessageCircle className="w-4 h-4" /> Chat with Sally
              </Button>
              <Button
                className="gradient-sally text-white border-0 rounded-xl btn-scale gap-2"
                onClick={() => findMatches.mutate()}
                disabled={findMatches.isPending}
              >
                <Sparkles className="w-4 h-4" /> Find Matches
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, navigate }: { match: any; navigate: any }) {
  const profile = match.otherProfile;
  const traits = profile?.traits as any;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-border p-6 card-hover">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md flex-shrink-0"
          style={{ background: profile?.avatarColor || "#f97316" }}
        >
          {profile?.avatarEmoji || "😊"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-lg truncate">{profile?.displayName || "Mystery Match"}</p>
            {profile?.isVerified && (
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-primary font-bold text-sm">{match.compatibilityScore}% compatible</span>
          </div>
        </div>
      </div>

      {/* Compatibility reason */}
      {match.compatibilityReason && (
        <div className="bg-primary/5 rounded-xl p-3 mb-4 text-xs text-foreground/80 italic border border-primary/10">
          <span className="font-semibold text-primary not-italic">Sally says: </span>
          {match.compatibilityReason}
        </div>
      )}

      {/* Traits */}
      {traits?.personalityKeywords && (
        <div className="flex flex-wrap gap-1 mb-4">
          {traits.personalityKeywords.slice(0, 4).map((k: string) => (
            <Badge key={k} variant="secondary" className="text-xs rounded-full">{k}</Badge>
          ))}
        </div>
      )}

      {/* Network badge */}
      <Badge variant="outline" className="mb-4 text-xs capitalize rounded-full">
        {profile?.networkType === "singles" ? "💙" : profile?.networkType === "couples" ? "💚" : "🧡"} {profile?.networkType || "singles"} Network
      </Badge>

      {/* Event interests badge (placeholder for Phase 3) */}
      <div className="mb-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar className="w-3 h-3" />
          Interested in events
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale gap-1.5"
          onClick={() => navigate(`/chat/${match.id}`)}
        >
          <MessageCircle className="w-3.5 h-3.5" /> Chat
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 rounded-xl gap-1.5"
          onClick={() => navigate(`/games/${match.id}`)}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> Games
        </Button>
      </div>
    </div>
  );
}
