import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  GraduationCap,
  Trophy,
  Copy,
  Share2,
  Star,
  Users,
  Zap,
  Heart,
  CheckCircle2,
} from "lucide-react";

// Carroll University campus ID (seeded as ID 1)
const CARROLL_CAMPUS_ID = 1;

export default function CampusWaitlist() {
  const { user } = useAuth();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: stats, refetch: refetchStats } = trpc.campus.getStats.useQuery({
    campusId: CARROLL_CAMPUS_ID,
  });

  const { data: leaderboard } = trpc.campus.getLeaderboard.useQuery({
    campusId: CARROLL_CAMPUS_ID,
    limit: 10,
  });

  const getInviteCode = trpc.campus.getMyInviteCode.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      refetchStats();
    },
    onError: () => toast.error("Couldn't generate your invite link right now."),
  });

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      navigator.share({
        title: "Join Just Putzit at Carroll University!",
        text: `Hey! I'm on Just Putzit — the dating app for Carroll students. Join with my link and let's get this thing going!`,
        url: inviteUrl,
      });
    } else {
      handleCopy();
    }
  };

  const total = stats?.total ?? 0;
  const threshold = stats?.threshold ?? 100;
  const pct = stats?.pct ?? 0;
  const isLive = stats?.isLive ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-rose-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 text-6xl">🎓</div>
          <div className="absolute top-12 right-12 text-5xl">🏆</div>
          <div className="absolute bottom-6 left-1/3 text-4xl">💛</div>
        </div>
        <div className="relative max-w-2xl mx-auto px-6 py-14 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <GraduationCap className="w-4 h-4" />
            Carroll University · Waukesha, WI
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Just Putzit is coming<br />to Carroll.
          </h1>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            Real dates. Real people. No swiping. Sally sets it up — you just show up.
          </p>
          {!isLive && (
            <p className="text-white/70 text-sm">
              We go live when <strong className="text-white">{threshold} Carroll students</strong> join.
              Help us get there.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Progress bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-gray-800 text-lg">Carroll Launch Progress</span>
            </div>
            {isLive && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Live!
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-orange-600 text-2xl">{total}</span>
              <span className="text-gray-400">of {threshold} students</span>
            </div>
            <Progress value={pct} className="h-4 rounded-full" />
            <p className="text-xs text-gray-400 text-right">{pct}% of the way there</p>
          </div>

          {!isLive && total < threshold && (
            <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-700 font-medium text-center">
              🎯 {threshold - total} more Carroll students needed to unlock the app!
            </div>
          )}
          {isLive && (
            <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium text-center">
              🎉 Just Putzit is live at Carroll! Sign in to start matching.
            </div>
          )}
        </div>

        {/* Invite section */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-800 text-lg">Your Personal Invite Link</h2>
          </div>
          <p className="text-sm text-gray-500">
            Every student you invite counts toward the launch goal — and earns you a spot on the leaderboard.
            Get 5+ friends to join and you become a <strong>Campus Ambassador</strong> 🏆.
          </p>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center">Sign in to get your personal invite link.</p>
              <Button
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                Sign in to get your link
              </Button>
            </div>
          ) : inviteUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-orange-50 rounded-xl p-3 border border-orange-200">
                <span className="text-xs text-orange-700 font-mono flex-1 truncate">{inviteUrl}</span>
                <button
                  onClick={handleCopy}
                  className="text-orange-500 hover:text-orange-700 flex-shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  onClick={handleShare}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => getInviteCode.mutate()}
              disabled={getInviteCode.isPending}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {getInviteCode.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating…
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Get My Invite Link
                </>
              )}
            </Button>
          )}
        </div>

        {/* What is Just Putzit */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800 text-lg">What is Just Putzit?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🤖",
                title: "Sally sets it up",
                desc: "Our AI host interviews you, learns what you're into, and arranges real outings — bowling, coffee, mini golf.",
              },
              {
                icon: "✅",
                title: "Verified students only",
                desc: "No fake profiles. Every Carroll student is real. Sally flags anything suspicious automatically.",
              },
              {
                icon: "🎮",
                title: "Games & icebreakers",
                desc: "Play Would You Rather with your matches before you meet. See your compatibility % before the date.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-orange-50 rounded-xl p-4 space-y-2">
                <div className="text-3xl">{item.icon}</div>
                <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ambassador leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-gray-800 text-lg">Top Inviters — Carroll Leaderboard</h2>
            </div>
            <p className="text-xs text-gray-400">
              Get 5+ friends to join → earn the Ambassador badge 🏆 and get featured here.
            </p>
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    i === 0
                      ? "bg-amber-50 border border-amber-200"
                      : i === 1
                      ? "bg-gray-50 border border-gray-200"
                      : i === 2
                      ? "bg-orange-50 border border-orange-100"
                      : "bg-gray-50"
                  }`}
                >
                  <span className="text-lg font-black text-gray-400 w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: entry.avatarColor + "33" }}
                  >
                    {entry.avatarEmoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-800 text-sm truncate">
                        {entry.displayName}
                      </span>
                      {entry.isAmbassador && (
                        <Badge className="bg-amber-400 text-white text-xs px-1.5 py-0">
                          <Star className="w-2.5 h-2.5 mr-0.5" />
                          Ambassador
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600 font-bold text-sm flex-shrink-0">
                    <Heart className="w-3.5 h-3.5" />
                    {entry.referralCount} invited
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center space-y-3 pb-8">
          <p className="text-sm text-gray-400">
            Just Putzit is always free for students. Businesses pay — not you.
          </p>
          {user && (
            <Button
              variant="outline"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => { window.location.href = "/"; }}
            >
              Back to Just Putzit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
