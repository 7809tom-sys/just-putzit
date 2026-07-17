import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, BellOff, Radio, Clock, Trophy, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreTeam {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color: string;
  score: string;
  homeAway: "home" | "away";
  winner?: boolean;
  record?: string;
}

interface ScoreGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  statusName: string;
  statusDetail: string;
  isLive: boolean;
  isFinal: boolean;
  sport: "nfl" | "nba" | "mlb";
  homeTeam: ScoreTeam;
  awayTeam: ScoreTeam;
  broadcast?: string;
  venue?: string;
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({
  game,
  alertedTeams,
  onToggleAlert,
  isLoggedIn,
}: {
  game: ScoreGame;
  alertedTeams: Set<string>;
  onToggleAlert: (team: ScoreTeam, sport: "nfl" | "nba" | "mlb") => void;
  isLoggedIn: boolean;
}) {
  const { homeTeam, awayTeam } = game;
  const isScheduled = game.statusName === "STATUS_SCHEDULED";

  const TeamRow = ({ team, isWinner }: { team: ScoreTeam; isWinner: boolean }) => (
    <div className={`flex items-center gap-3 py-2 ${isWinner ? "opacity-100" : game.isFinal ? "opacity-50" : "opacity-100"}`}>
      {team.logo ? (
        <img
          src={team.logo}
          alt={team.abbreviation}
          className="w-9 h-9 object-contain flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: `#${team.color || "1a1a2e"}` }}
        >
          {team.abbreviation.slice(0, 2)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-sm ${isWinner ? "text-foreground" : "text-foreground"}`}>
            {team.shortDisplayName || team.abbreviation}
          </span>
          {isWinner && game.isFinal && <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
        </div>
        {team.record && (
          <span className="text-xs text-muted-foreground">{team.record}</span>
        )}
      </div>
      {!isScheduled && (
        <span className={`text-2xl font-bold tabular-nums ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
          {team.score}
        </span>
      )}
      {isLoggedIn && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleAlert(team, game.sport); }}
          className={`ml-1 p-1 rounded-full transition-colors ${
            alertedTeams.has(team.abbreviation)
              ? "text-yellow-500 hover:text-yellow-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={alertedTeams.has(team.abbreviation) ? "Remove alert" : "Get alerts for this team"}
        >
          {alertedTeams.has(team.abbreviation) ? (
            <Bell className="w-3.5 h-3.5 fill-current" />
          ) : (
            <BellOff className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md ${game.isLive ? "border-red-500/40 shadow-red-500/10 shadow-sm" : "border-border"}`}>
      {/* Status bar */}
      <div className={`px-4 py-1.5 flex items-center justify-between text-xs ${game.isLive ? "bg-red-500/10" : "bg-muted/50"}`}>
        <div className="flex items-center gap-1.5">
          {game.isLive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 font-semibold">LIVE</span>
              <span className="text-muted-foreground">·</span>
            </>
          ) : game.isFinal ? (
            <span className="text-muted-foreground font-medium">Final</span>
          ) : (
            <Clock className="w-3 h-3 text-muted-foreground" />
          )}
          <span className={`${game.isLive ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
            {game.statusDetail}
          </span>
        </div>
        {game.broadcast && (
          <span className="text-muted-foreground">{game.broadcast}</span>
        )}
      </div>

      {/* Teams */}
      <div className="px-4 divide-y divide-border/50">
        <TeamRow team={awayTeam} isWinner={awayTeam.winner ?? false} />
        <TeamRow team={homeTeam} isWinner={homeTeam.winner ?? false} />
      </div>

      {/* Venue */}
      {game.venue && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground bg-muted/30 border-t border-border/50">
          📍 {game.venue}
        </div>
      )}
    </div>
  );
}

// ─── Sport Tab Content ────────────────────────────────────────────────────────

function SportScores({
  sport,
  alertedTeams,
  onToggleAlert,
  isLoggedIn,
}: {
  sport: "nfl" | "nba" | "mlb";
  alertedTeams: Set<string>;
  onToggleAlert: (team: ScoreTeam, sport: "nfl" | "nba" | "mlb") => void;
  isLoggedIn: boolean;
}) {
  const { data, isLoading, error, dataUpdatedAt, refetch } = trpc.sportsScores.getScores.useQuery(
    { sport },
    { refetchInterval: 60_000 }
  );

  const games = data?.games ?? [];
  const liveGames = games.filter((g) => g.isLive);
  const scheduledGames = games.filter((g) => !g.isLive && !g.isFinal);
  const finalGames = games.filter((g) => g.isFinal);

  const sportLabel = sport === "nfl" ? "NFL" : sport === "nba" ? "NBA" : "MLB";
  const sportEmoji = sport === "nfl" ? "🏈" : sport === "nba" ? "🏀" : "⚾";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-4xl mb-3">📡</p>
        <p className="font-medium">Could not load {sportLabel} scores</p>
        <p className="text-sm mt-1">ESPN data temporarily unavailable</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-4xl mb-3">{sportEmoji}</p>
        <p className="font-medium">No {sportLabel} games scheduled today</p>
        <p className="text-sm mt-1">Check back on game day!</p>
      </div>
    );
  }

  const updatedTime = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="space-y-6">
      {/* Last updated */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Powered by ESPN · Updates every 60s</span>
        <div className="flex items-center gap-2">
          {updatedTime && <span>Updated {updatedTime}</span>}
          <button onClick={() => refetch()} className="hover:text-foreground transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Live games */}
      {liveGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-sm">Live Now</h3>
            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{liveGames.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map((g) => (
              <ScoreCard key={g.id} game={g} alertedTeams={alertedTeams} onToggleAlert={onToggleAlert} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming games */}
      {scheduledGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Upcoming</h3>
            <span className="text-xs text-muted-foreground">({scheduledGames.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledGames.map((g) => (
              <ScoreCard key={g.id} game={g} alertedTeams={alertedTeams} onToggleAlert={onToggleAlert} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </section>
      )}

      {/* Final games */}
      {finalGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground">Final</h3>
            <span className="text-xs text-muted-foreground">({finalGames.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {finalGames.map((g) => (
              <ScoreCard key={g.id} game={g} alertedTeams={alertedTeams} onToggleAlert={onToggleAlert} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LiveScores() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [alertedTeams, setAlertedTeams] = useState<Set<string>>(new Set());

  const { data: alertsData } = trpc.sportsScores.getMyAlerts.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  const setAlertMutation = trpc.sportsScores.setTeamAlert.useMutation();

  useEffect(() => {
    if (alertsData?.alerts) {
      setAlertedTeams(new Set(alertsData.alerts.filter((a) => a.enabled).map((a) => a.teamAbbreviation)));
    }
  }, [alertsData]);

  const handleToggleAlert = async (team: ScoreTeam, sport: "nfl" | "nba" | "mlb") => {
    if (!isLoggedIn) {
      toast.error("Sign in to set game alerts");
      return;
    }
    const isEnabled = alertedTeams.has(team.abbreviation);
    const newEnabled = !isEnabled;

    // Optimistic update
    setAlertedTeams((prev) => {
      const next = new Set(prev);
      if (newEnabled) next.add(team.abbreviation);
      else next.delete(team.abbreviation);
      return next;
    });

    try {
      await setAlertMutation.mutateAsync({
        teamAbbreviation: team.abbreviation,
        teamName: team.displayName,
        sport,
        enabled: newEnabled,
      });
      if (newEnabled) {
        toast.success(`🔔 Alerts on for ${team.shortDisplayName || team.abbreviation}`);
      } else {
        toast.info(`🔕 Alerts off for ${team.shortDisplayName || team.abbreviation}`);
      }
    } catch {
      // Rollback
      setAlertedTeams((prev) => {
        const next = new Set(prev);
        if (isEnabled) next.add(team.abbreviation);
        else next.delete(team.abbreviation);
        return next;
      });
      toast.error("Failed to update alert");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="w-6 h-6 text-red-400" />
            <h1 className="text-2xl font-bold">Live Scores</h1>
            <Badge className="bg-red-500 text-white text-xs animate-pulse gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              LIVE
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">
            Real-time NFL, NBA & MLB scores · Powered by ESPN
          </p>
          {!isLoggedIn && (
            <p className="text-slate-500 text-xs mt-2">
              Sign in to set alerts for your favorite teams 🔔
            </p>
          )}
          {alertedTeams.size > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Bell className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-yellow-300">Watching:</span>
              {Array.from(alertedTeams).map((abbr) => (
                <Badge key={abbr} className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                  {abbr}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scores Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="nfl">
          <TabsList className="mb-6">
            <TabsTrigger value="nfl" className="gap-1.5">🏈 NFL</TabsTrigger>
            <TabsTrigger value="nba" className="gap-1.5">🏀 NBA</TabsTrigger>
            <TabsTrigger value="mlb" className="gap-1.5">⚾ MLB</TabsTrigger>
          </TabsList>

          <TabsContent value="nfl">
            <SportScores sport="nfl" alertedTeams={alertedTeams} onToggleAlert={handleToggleAlert} isLoggedIn={isLoggedIn} />
          </TabsContent>
          <TabsContent value="nba">
            <SportScores sport="nba" alertedTeams={alertedTeams} onToggleAlert={handleToggleAlert} isLoggedIn={isLoggedIn} />
          </TabsContent>
          <TabsContent value="mlb">
            <SportScores sport="mlb" alertedTeams={alertedTeams} onToggleAlert={handleToggleAlert} isLoggedIn={isLoggedIn} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
