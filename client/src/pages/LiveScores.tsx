import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, BellOff, Radio, Clock, Trophy, RefreshCw, Star, StarOff, Filter, X, Check, Users, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

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

// ─── Static team lists (abbreviation + full name + sport) ─────────────────────
// Used to populate the "Pick Your Teams" drawer even when no games are scheduled.

const NFL_TEAMS = [
  { abbr: "ARI", name: "Arizona Cardinals" }, { abbr: "ATL", name: "Atlanta Falcons" },
  { abbr: "BAL", name: "Baltimore Ravens" }, { abbr: "BUF", name: "Buffalo Bills" },
  { abbr: "CAR", name: "Carolina Panthers" }, { abbr: "CHI", name: "Chicago Bears" },
  { abbr: "CIN", name: "Cincinnati Bengals" }, { abbr: "CLE", name: "Cleveland Browns" },
  { abbr: "DAL", name: "Dallas Cowboys" }, { abbr: "DEN", name: "Denver Broncos" },
  { abbr: "DET", name: "Detroit Lions" }, { abbr: "GB", name: "Green Bay Packers" },
  { abbr: "HOU", name: "Houston Texans" }, { abbr: "IND", name: "Indianapolis Colts" },
  { abbr: "JAX", name: "Jacksonville Jaguars" }, { abbr: "KC", name: "Kansas City Chiefs" },
  { abbr: "LV", name: "Las Vegas Raiders" }, { abbr: "LAC", name: "LA Chargers" },
  { abbr: "LAR", name: "LA Rams" }, { abbr: "MIA", name: "Miami Dolphins" },
  { abbr: "MIN", name: "Minnesota Vikings" }, { abbr: "NE", name: "New England Patriots" },
  { abbr: "NO", name: "New Orleans Saints" }, { abbr: "NYG", name: "NY Giants" },
  { abbr: "NYJ", name: "NY Jets" }, { abbr: "PHI", name: "Philadelphia Eagles" },
  { abbr: "PIT", name: "Pittsburgh Steelers" }, { abbr: "SF", name: "San Francisco 49ers" },
  { abbr: "SEA", name: "Seattle Seahawks" }, { abbr: "TB", name: "Tampa Bay Buccaneers" },
  { abbr: "TEN", name: "Tennessee Titans" }, { abbr: "WSH", name: "Washington Commanders" },
];

const NBA_TEAMS = [
  { abbr: "ATL", name: "Atlanta Hawks" }, { abbr: "BOS", name: "Boston Celtics" },
  { abbr: "BKN", name: "Brooklyn Nets" }, { abbr: "CHA", name: "Charlotte Hornets" },
  { abbr: "CHI", name: "Chicago Bulls" }, { abbr: "CLE", name: "Cleveland Cavaliers" },
  { abbr: "DAL", name: "Dallas Mavericks" }, { abbr: "DEN", name: "Denver Nuggets" },
  { abbr: "DET", name: "Detroit Pistons" }, { abbr: "GS", name: "Golden State Warriors" },
  { abbr: "HOU", name: "Houston Rockets" }, { abbr: "IND", name: "Indiana Pacers" },
  { abbr: "LAC", name: "LA Clippers" }, { abbr: "LAL", name: "LA Lakers" },
  { abbr: "MEM", name: "Memphis Grizzlies" }, { abbr: "MIA", name: "Miami Heat" },
  { abbr: "MIL", name: "Milwaukee Bucks" }, { abbr: "MIN", name: "Minnesota Timberwolves" },
  { abbr: "NO", name: "New Orleans Pelicans" }, { abbr: "NYK", name: "NY Knicks" },
  { abbr: "OKC", name: "Oklahoma City Thunder" }, { abbr: "ORL", name: "Orlando Magic" },
  { abbr: "PHI", name: "Philadelphia 76ers" }, { abbr: "PHX", name: "Phoenix Suns" },
  { abbr: "POR", name: "Portland Trail Blazers" }, { abbr: "SAC", name: "Sacramento Kings" },
  { abbr: "SA", name: "San Antonio Spurs" }, { abbr: "TOR", name: "Toronto Raptors" },
  { abbr: "UTAH", name: "Utah Jazz" }, { abbr: "WSH", name: "Washington Wizards" },
];

const MLB_TEAMS = [
  { abbr: "ARI", name: "Arizona Diamondbacks" }, { abbr: "ATL", name: "Atlanta Braves" },
  { abbr: "BAL", name: "Baltimore Orioles" }, { abbr: "BOS", name: "Boston Red Sox" },
  { abbr: "CHC", name: "Chicago Cubs" }, { abbr: "CHW", name: "Chicago White Sox" },
  { abbr: "CIN", name: "Cincinnati Reds" }, { abbr: "CLE", name: "Cleveland Guardians" },
  { abbr: "COL", name: "Colorado Rockies" }, { abbr: "DET", name: "Detroit Tigers" },
  { abbr: "HOU", name: "Houston Astros" }, { abbr: "KC", name: "Kansas City Royals" },
  { abbr: "LAA", name: "LA Angels" }, { abbr: "LAD", name: "LA Dodgers" },
  { abbr: "MIA", name: "Miami Marlins" }, { abbr: "MIL", name: "Milwaukee Brewers" },
  { abbr: "MIN", name: "Minnesota Twins" }, { abbr: "NYM", name: "NY Mets" },
  { abbr: "NYY", name: "NY Yankees" }, { abbr: "OAK", name: "Oakland Athletics" },
  { abbr: "PHI", name: "Philadelphia Phillies" }, { abbr: "PIT", name: "Pittsburgh Pirates" },
  { abbr: "SD", name: "San Diego Padres" }, { abbr: "SF", name: "San Francisco Giants" },
  { abbr: "SEA", name: "Seattle Mariners" }, { abbr: "STL", name: "St. Louis Cardinals" },
  { abbr: "TB", name: "Tampa Bay Rays" }, { abbr: "TEX", name: "Texas Rangers" },
  { abbr: "TOR", name: "Toronto Blue Jays" }, { abbr: "WSH", name: "Washington Nationals" },
];

// ─── Favorite Teams Drawer ────────────────────────────────────────────────────

function FavoriteTeamsDrawer({
  favoriteTeams,
  onToggle,
  onClose,
}: {
  favoriteTeams: Set<string>;
  onToggle: (abbr: string, name: string, sport: "nfl" | "nba" | "mlb") => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"nfl" | "nba" | "mlb">("mlb");
  const [search, setSearch] = useState("");

  const teamList = tab === "nfl" ? NFL_TEAMS : tab === "nba" ? NBA_TEAMS : MLB_TEAMS;
  const filtered = search.trim()
    ? teamList.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.abbr.toLowerCase().includes(search.toLowerCase()))
    : teamList;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Pick Your Favorite Teams
            </h2>
            <p className="text-xs text-muted-foreground">
              {favoriteTeams.size} team{favoriteTeams.size !== 1 ? "s" : ""} selected · filter Live Scores to just these games
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sport tabs */}
        <div className="px-5 pt-3 flex gap-2">
          {(["mlb", "nfl", "nba"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                tab === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "nfl" ? "🏈 NFL" : s === "nba" ? "🏀 NBA" : "⚾ MLB"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Team list */}
        <div className="overflow-y-auto flex-1 px-5 py-3 grid grid-cols-2 gap-2">
          {filtered.map((team) => {
            const selected = favoriteTeams.has(team.abbr);
            return (
              <button
                key={`${tab}-${team.abbr}`}
                onClick={() => onToggle(team.abbr, team.name, tab)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  selected
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                {selected ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded border border-border flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{team.abbr}</p>
                  <p className="text-xs text-muted-foreground truncate">{team.name}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <Button className="w-full gap-2" onClick={onClose}>
            <Check className="w-4 h-4" /> Done — {favoriteTeams.size} team{favoriteTeams.size !== 1 ? "s" : ""} selected
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({
  game,
  favoriteTeams,
  onToggleFavorite,
  isLoggedIn,
}: {
  game: ScoreGame;
  favoriteTeams: Set<string>;
  onToggleFavorite: (team: ScoreTeam, sport: "nfl" | "nba" | "mlb") => void;
  isLoggedIn: boolean;
}) {
  const { homeTeam, awayTeam } = game;
  const isScheduled = game.statusName === "STATUS_SCHEDULED";
  const isHomeFav = favoriteTeams.has(homeTeam.abbreviation);
  const isAwayFav = favoriteTeams.has(awayTeam.abbreviation);
  const [, navigate] = useLocation();
  const [joiningChat, setJoiningChat] = useState(false);

  const { data: fanCountData } = trpc.watchParty.getGameFanCount.useQuery({
    teamHome: homeTeam.displayName,
    teamAway: awayTeam.displayName,
    sport: game.sport,
  }, { refetchInterval: 30000 });
  const fanCount = fanCountData?.count ?? 0;

  const findOrCreateRoom = trpc.watchParty.findOrCreateGameRoom.useMutation({
    onSuccess: (data) => {
      navigate(`/sports/watch-party/${data.roomId}`);
    },
    onError: () => {
      toast.error("Couldn't open chat room — please try again");
      setJoiningChat(false);
    },
  });

  const handleOpenChat = async () => {
    if (!isLoggedIn) {
      toast.error("Sign in to join the Game Day Chat");
      return;
    }
    setJoiningChat(true);
    findOrCreateRoom.mutate({
      teamHome: homeTeam.displayName,
      teamAway: awayTeam.displayName,
      sport: game.sport,
      gameTitle: game.name,
    });
  };

  const TeamRow = ({ team, isWinner }: { team: ScoreTeam; isWinner: boolean }) => {
    const isFav = favoriteTeams.has(team.abbreviation);
    return (
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
            <span className="font-semibold text-sm">{team.shortDisplayName || team.abbreviation}</span>
            {isWinner && game.isFinal && <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
            {isFav && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          </div>
          {team.record && <span className="text-xs text-muted-foreground">{team.record}</span>}
        </div>
        {!isScheduled && (
          <span className={`text-2xl font-bold tabular-nums ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
            {team.score}
          </span>
        )}
        {isLoggedIn && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(team, game.sport); }}
            className={`ml-1 p-1 rounded-full transition-colors ${
              isFav ? "text-yellow-500 hover:text-yellow-400" : "text-muted-foreground hover:text-foreground"
            }`}
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            {isFav ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md ${
      game.isLive ? "border-red-500/40 shadow-red-500/10 shadow-sm" :
      (isHomeFav || isAwayFav) ? "border-yellow-400/40 shadow-yellow-400/5 shadow-sm" :
      "border-border"
    }`}>
      {/* Status bar */}
      <div className={`px-4 py-1.5 flex items-center justify-between text-xs ${
        game.isLive ? "bg-red-500/10" :
        (isHomeFav || isAwayFav) ? "bg-yellow-400/5" :
        "bg-muted/50"
      }`}>
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
        <div className="flex items-center gap-2">
          {(isHomeFav || isAwayFav) && (
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          )}
          {game.broadcast && <span className="text-muted-foreground">{game.broadcast}</span>}
        </div>
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

      {/* Chat button */}
      <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20">
        <button
          onClick={handleOpenChat}
          disabled={joiningChat}
          className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-all ${
            game.isLive
              ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30"
              : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {joiningChat ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              {fanCount > 0 ? (
                <span>Game Day Chat <span className="opacity-70">· {fanCount} fan{fanCount !== 1 ? "s" : ""} live</span></span>
              ) : (
                <span>Open Game Day Chat</span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Sport Tab Content ────────────────────────────────────────────────────────

function SportScores({
  sport,
  favoriteTeams,
  onToggleFavorite,
  isLoggedIn,
  filterToFavorites,
}: {
  sport: "nfl" | "nba" | "mlb";
  favoriteTeams: Set<string>;
  onToggleFavorite: (team: ScoreTeam, sport: "nfl" | "nba" | "mlb") => void;
  isLoggedIn: boolean;
  filterToFavorites: boolean;
}) {
  const { data, isLoading, error, dataUpdatedAt, refetch } = trpc.sportsScores.getScores.useQuery(
    { sport },
    { refetchInterval: 60_000 }
  );

  const allGames = data?.games ?? [];

  // Apply favorites filter if active
  const games = useMemo(() => {
    if (!filterToFavorites || favoriteTeams.size === 0) return allGames;
    return allGames.filter(
      (g) => favoriteTeams.has(g.homeTeam.abbreviation) || favoriteTeams.has(g.awayTeam.abbreviation)
    );
  }, [allGames, filterToFavorites, favoriteTeams]);

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

  if (allGames.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-4xl mb-3">{sportEmoji}</p>
        <p className="font-medium">No {sportLabel} games scheduled today</p>
        <p className="text-sm mt-1">Check back on game day!</p>
      </div>
    );
  }

  if (filterToFavorites && games.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-4xl mb-3">⭐</p>
        <p className="font-medium">None of your favorite {sportLabel} teams play today</p>
        <p className="text-sm mt-1">There are {allGames.length} other game{allGames.length !== 1 ? "s" : ""} scheduled — turn off the filter to see them all.</p>
      </div>
    );
  }

  const updatedTime = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="space-y-6">
      {/* Last updated */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Powered by ESPN · Updates every 60s{filterToFavorites ? ` · showing ${games.length} of ${allGames.length} games` : ""}</span>
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
              <ScoreCard key={g.id} game={g} favoriteTeams={favoriteTeams} onToggleFavorite={onToggleFavorite} isLoggedIn={isLoggedIn} />
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
              <ScoreCard key={g.id} game={g} favoriteTeams={favoriteTeams} onToggleFavorite={onToggleFavorite} isLoggedIn={isLoggedIn} />
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
              <ScoreCard key={g.id} game={g} favoriteTeams={favoriteTeams} onToggleFavorite={onToggleFavorite} isLoggedIn={isLoggedIn} />
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
  const [favoriteTeams, setFavoriteTeams] = useState<Set<string>>(new Set());
  const [filterToFavorites, setFilterToFavorites] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const { data: alertsData } = trpc.sportsScores.getMyAlerts.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  const setAlertMutation = trpc.sportsScores.setTeamAlert.useMutation();

  useEffect(() => {
    if (alertsData?.alerts) {
      setFavoriteTeams(new Set(alertsData.alerts.filter((a) => a.enabled).map((a) => a.teamAbbreviation)));
    }
  }, [alertsData]);

  const handleToggleFavorite = async (team: ScoreTeam, sport: "nfl" | "nba" | "mlb") => {
    if (!isLoggedIn) {
      toast.error("Sign in to save favorite teams");
      return;
    }
    const isEnabled = favoriteTeams.has(team.abbreviation);
    const newEnabled = !isEnabled;

    // Optimistic update
    setFavoriteTeams((prev) => {
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
      toast.success(newEnabled ? `⭐ ${team.shortDisplayName || team.abbreviation} added to favorites` : `Removed ${team.shortDisplayName || team.abbreviation} from favorites`);
    } catch {
      // Rollback
      setFavoriteTeams((prev) => {
        const next = new Set(prev);
        if (isEnabled) next.add(team.abbreviation);
        else next.delete(team.abbreviation);
        return next;
      });
      toast.error("Failed to update favorites");
    }
  };

  // Also handle toggles from the picker drawer (uses abbreviation + name + sport directly)
  const handleToggleFromPicker = async (abbr: string, name: string, sport: "nfl" | "nba" | "mlb") => {
    if (!isLoggedIn) {
      toast.error("Sign in to save favorite teams");
      return;
    }
    const isEnabled = favoriteTeams.has(abbr);
    const newEnabled = !isEnabled;

    setFavoriteTeams((prev) => {
      const next = new Set(prev);
      if (newEnabled) next.add(abbr);
      else next.delete(abbr);
      return next;
    });

    try {
      await setAlertMutation.mutateAsync({
        teamAbbreviation: abbr,
        teamName: name,
        sport,
        enabled: newEnabled,
      });
    } catch {
      setFavoriteTeams((prev) => {
        const next = new Set(prev);
        if (isEnabled) next.add(abbr);
        else next.delete(abbr);
        return next;
      });
      toast.error("Failed to update favorites");
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
          <p className="text-slate-400 text-sm mb-4">
            Real-time NFL, NBA & MLB scores · Powered by ESPN
          </p>

          {/* Action bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Pick teams button */}
            <button
              onClick={() => {
                if (!isLoggedIn) { toast.error("Sign in to save favorite teams"); return; }
                setShowPicker(true);
              }}
              className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              {favoriteTeams.size > 0 ? `${favoriteTeams.size} Favorite Team${favoriteTeams.size !== 1 ? "s" : ""}` : "Pick Favorite Teams"}
            </button>

            {/* My Teams filter toggle */}
            {favoriteTeams.size > 0 && (
              <button
                onClick={() => setFilterToFavorites((v) => !v)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${
                  filterToFavorites
                    ? "bg-yellow-400 text-slate-900 font-semibold"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {filterToFavorites ? "My Teams Only" : "Show My Teams Only"}
              </button>
            )}

            {/* Favorite team badges */}
            {favoriteTeams.size > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from(favoriteTeams).slice(0, 6).map((abbr) => (
                  <Badge key={abbr} className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    ⭐ {abbr}
                  </Badge>
                ))}
                {favoriteTeams.size > 6 && (
                  <Badge className="bg-white/10 text-slate-300 text-xs">+{favoriteTeams.size - 6} more</Badge>
                )}
              </div>
            )}

            {!isLoggedIn && (
              <p className="text-slate-500 text-xs">Sign in to save favorite teams and filter scores 🌟</p>
            )}
          </div>
        </div>
      </div>

      {/* Scores Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="mlb">
          <TabsList className="mb-6">
            <TabsTrigger value="nfl" className="gap-1.5">🏈 NFL</TabsTrigger>
            <TabsTrigger value="nba" className="gap-1.5">🏀 NBA</TabsTrigger>
            <TabsTrigger value="mlb" className="gap-1.5">⚾ MLB</TabsTrigger>
          </TabsList>

          <TabsContent value="nfl">
            <SportScores sport="nfl" favoriteTeams={favoriteTeams} onToggleFavorite={handleToggleFavorite} isLoggedIn={isLoggedIn} filterToFavorites={filterToFavorites} />
          </TabsContent>
          <TabsContent value="nba">
            <SportScores sport="nba" favoriteTeams={favoriteTeams} onToggleFavorite={handleToggleFavorite} isLoggedIn={isLoggedIn} filterToFavorites={filterToFavorites} />
          </TabsContent>
          <TabsContent value="mlb">
            <SportScores sport="mlb" favoriteTeams={favoriteTeams} onToggleFavorite={handleToggleFavorite} isLoggedIn={isLoggedIn} filterToFavorites={filterToFavorites} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Favorite Teams Picker Drawer */}
      {showPicker && (
        <FavoriteTeamsDrawer
          favoriteTeams={favoriteTeams}
          onToggle={handleToggleFromPicker}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
