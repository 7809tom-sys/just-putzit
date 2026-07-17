import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Users, Plus, Trophy, Tv, Calendar, Zap, MessageSquare, Radio, BarChart2 } from "lucide-react";

// ── Pro team schedule data ────────────────────────────────────────────────────
const NFL_GAMES = [
  { home: "Green Bay Packers", away: "Chicago Bears", time: "2025-09-07T13:00:00", week: "Week 1", homeEmoji: "🧀", awayEmoji: "🐻" },
  { home: "Green Bay Packers", away: "Minnesota Vikings", time: "2025-09-14T13:00:00", week: "Week 2", homeEmoji: "🧀", awayEmoji: "🪓" },
  { home: "Chicago Bears", away: "Green Bay Packers", time: "2025-11-09T13:00:00", week: "Week 9", homeEmoji: "🐻", awayEmoji: "🧀" },
  { home: "Green Bay Packers", away: "Detroit Lions", time: "2025-10-05T13:00:00", week: "Week 5", homeEmoji: "🧀", awayEmoji: "🦁" },
  { home: "Chicago Bears", away: "Detroit Lions", time: "2025-10-12T13:00:00", week: "Week 6", homeEmoji: "🐻", awayEmoji: "🦁" },
  { home: "Green Bay Packers", away: "Dallas Cowboys", time: "2025-11-23T20:20:00", week: "Week 12", homeEmoji: "🧀", awayEmoji: "⭐" },
];

const NBA_GAMES = [
  { home: "Milwaukee Bucks", away: "Chicago Bulls", time: "2025-10-22T19:30:00", homeEmoji: "🦌", awayEmoji: "🐂" },
  { home: "Milwaukee Bucks", away: "Boston Celtics", time: "2025-11-05T19:30:00", homeEmoji: "🦌", awayEmoji: "☘️" },
  { home: "Chicago Bulls", away: "Milwaukee Bucks", time: "2025-11-19T19:00:00", homeEmoji: "🐂", awayEmoji: "🦌" },
  { home: "Milwaukee Bucks", away: "Miami Heat", time: "2025-12-03T19:30:00", homeEmoji: "🦌", awayEmoji: "🔥" },
];

const MLB_GAMES = [
  { home: "Milwaukee Brewers", away: "Chicago Cubs", time: "2025-04-04T19:10:00", homeEmoji: "⚾", awayEmoji: "🐻" },
  { home: "Milwaukee Brewers", away: "Chicago White Sox", time: "2025-04-11T19:10:00", homeEmoji: "⚾", awayEmoji: "🧦" },
  { home: "Chicago Cubs", away: "Milwaukee Brewers", time: "2025-05-02T14:20:00", homeEmoji: "🐻", awayEmoji: "⚾" },
  { home: "Milwaukee Brewers", away: "Minnesota Twins", time: "2025-06-06T19:10:00", homeEmoji: "⚾", awayEmoji: "🎯" },
];

type Sport = "nfl" | "nba" | "mlb" | "all";

function formatGameTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getSportColor(sport: string) {
  if (sport === "nfl") return "from-green-800 to-green-900";
  if (sport === "nba") return "from-red-800 to-red-900";
  if (sport === "mlb") return "from-blue-800 to-blue-900";
  return "from-gray-800 to-gray-900";
}

function getSportBadgeColor(sport: string) {
  if (sport === "nfl") return "bg-green-600";
  if (sport === "nba") return "bg-red-600";
  if (sport === "mlb") return "bg-blue-600";
  return "bg-gray-600";
}

export default function Sports() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeSport, setActiveSport] = useState<Sport>("all");
  const [joinCode, setJoinCode] = useState("");
  const [showCreateLocal, setShowCreateLocal] = useState(false);
  const [localForm, setLocalForm] = useState({ title: "", teamHome: "", teamAway: "", gameTime: "" });

  const { data: roomsData, refetch: refetchRooms } = trpc.watchParty.listRooms.useQuery(
    { sport: activeSport === "all" ? undefined : activeSport },
    { refetchInterval: 10000 }
  );

  const createRoomMutation = trpc.watchParty.createRoom.useMutation();
  const joinRoomMutation = trpc.watchParty.joinRoom.useMutation();

  const handleCreateFromGame = async (game: typeof NFL_GAMES[0], sport: "nfl" | "nba" | "mlb") => {
    if (!user) { toast.error("Sign in to open a Game Day Chat"); return; }
    try {
      const result = await createRoomMutation.mutateAsync({
        title: `${game.away} @ ${game.home}`,
        teamHome: game.home,
        teamAway: game.away,
        sport,
        gameTime: game.time,
      });
      toast.success(`Game Day Chat created! Code: ${result.gameCode}`);
      navigate(`/sports/watch-party/${result.roomId}`);
    } catch {
      toast.error("Failed to create chat room");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { toast.error("Enter a room code"); return; }
    try {
      const result = await joinRoomMutation.mutateAsync({ gameCode: joinCode.toUpperCase() });
      toast.success(`Joined: ${result.title}`);
      navigate(`/sports/watch-party/${result.roomId}`);
    } catch {
      toast.error("Room not found or already ended");
    }
  };

  const handleCreateLocal = async () => {
    if (!localForm.title || !localForm.teamHome || !localForm.teamAway) {
      toast.error("Fill in all fields"); return;
    }
    try {
      const result = await createRoomMutation.mutateAsync({
        title: localForm.title,
        teamHome: localForm.teamHome,
        teamAway: localForm.teamAway,
        sport: "local",
        gameTime: localForm.gameTime || undefined,
        isLocal: true,
      });
      toast.success(`Game Day Chat created! Code: ${result.gameCode}`);
      setShowCreateLocal(false);
      navigate(`/sports/watch-party/${result.roomId}`);
    } catch {
      toast.error("Failed to create chat room");
    }
  };

  const allGames = [
    ...NFL_GAMES.map((g) => ({ ...g, sport: "nfl" as const })),
    ...NBA_GAMES.map((g) => ({ ...g, sport: "nba" as const })),
    ...MLB_GAMES.map((g) => ({ ...g, sport: "mlb" as const })),
  ];

  const filteredGames = activeSport === "all" ? allGames : allGames.filter((g) => g.sport === activeSport);
  const liveRooms = roomsData?.rooms ?? [];
  const totalFans = liveRooms.reduce((sum, r) => sum + r.playerCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-800 to-slate-900 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-xl">🏟️</div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Game Day Chat</h1>
              </div>
              <p className="text-green-200 text-sm md:text-base">Watch together. Trash talk. Win trivia during commercial breaks. 🏆</p>
              {liveRooms.length > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1.5 text-xs bg-red-500/20 border border-red-500/40 text-red-300 px-2.5 py-1 rounded-full">
                    <Radio className="w-3 h-3 animate-pulse" /> {liveRooms.length} live room{liveRooms.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                    <Users className="w-3 h-3" /> {totalFans} fan{totalFans !== 1 ? "s" : ""} watching
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap items-start">
              <Button
                onClick={() => navigate("/sports/live-scores")}
                className="bg-red-600 hover:bg-red-500 text-white font-bold gap-2"
              >
                <Radio className="w-4 h-4 animate-pulse" /> Live Scores
              </Button>
              <div className="flex gap-2">
                <Input
                  placeholder="Room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  className="w-32 bg-white/10 border-white/30 text-white placeholder:text-white/50 font-mono tracking-widest"
                />
                <Button onClick={handleJoinRoom} disabled={joinRoomMutation.isPending} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                  Join
                </Button>
              </div>
              <Dialog open={showCreateLocal} onOpenChange={setShowCreateLocal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                    <Plus className="w-4 h-4" /> Post Local Game
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Post a Local Sports Event</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Event title (e.g. Waukesha HS vs Brookfield)" value={localForm.title} onChange={(e) => setLocalForm({ ...localForm, title: e.target.value })} />
                    <Input placeholder="Home team" value={localForm.teamHome} onChange={(e) => setLocalForm({ ...localForm, teamHome: e.target.value })} />
                    <Input placeholder="Away team" value={localForm.teamAway} onChange={(e) => setLocalForm({ ...localForm, teamAway: e.target.value })} />
                    <Input type="datetime-local" value={localForm.gameTime} onChange={(e) => setLocalForm({ ...localForm, gameTime: e.target.value })} />
                    <Button onClick={handleCreateLocal} disabled={createRoomMutation.isPending} className="w-full bg-green-600 hover:bg-green-700">
                      Create Game Day Chat Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Sport filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "nfl", "nba", "mlb"] as Sport[]).map((s) => (
            <Button
              key={s}
              onClick={() => setActiveSport(s)}
              variant={activeSport === s ? "default" : "outline"}
              className={activeSport === s ? "bg-green-600 hover:bg-green-700" : "border-white/30 text-white hover:bg-white/10"}
            >
              {s === "all" ? "🏟️ All Sports" : s === "nfl" ? "🏈 NFL" : s === "nba" ? "🏀 NBA" : "⚾ MLB"}
            </Button>
          ))}
        </div>

        {/* Active Game Day Chat Rooms */}
        {liveRooms.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400 animate-pulse" /> Live Game Day Chats
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveRooms.map((room) => (
                <Card
                  key={room.id}
                  className={`bg-gradient-to-br ${getSportColor(room.sport)} border-white/10 cursor-pointer hover:scale-[1.02] transition-transform`}
                  onClick={() => navigate(`/sports/watch-party/${room.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${room.status === "live" ? "bg-red-500" : "bg-yellow-600"} text-white text-xs gap-1`}>
                        {room.status === "live" ? <><Radio className="w-2.5 h-2.5" /> LIVE</> : "⏳ Waiting"}
                      </Badge>
                      <span className="text-white/60 text-xs font-mono">{room.gameCode}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2">{room.title}</h3>
                    <div className="flex items-center justify-between text-white/60 text-xs">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.playerCount} fans</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {room.hostName}</span>
                    </div>
                    <Button
                      className="w-full mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs h-8"
                      onClick={(e) => { e.stopPropagation(); navigate(`/sports/watch-party/${room.id}`); }}
                    >
                      Join Chat →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* How it works callout */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center text-lg flex-shrink-0">💬</div>
            <div>
              <p className="text-white font-semibold text-sm">Live Chat</p>
              <p className="text-white/50 text-xs mt-0.5">React to every play in real time with fans watching the same game.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center text-lg flex-shrink-0">⚡</div>
            <div>
              <p className="text-white font-semibold text-sm">Commercial Break Trivia</p>
              <p className="text-white/50 text-xs mt-0.5">Host launches trivia questions during breaks — answer fast to score points.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-lg flex-shrink-0">🏆</div>
            <div>
              <p className="text-white font-semibold text-sm">MVP Leaderboard</p>
              <p className="text-white/50 text-xs mt-0.5">Top trivia scorer earns the MVP crown at the end of the game.</p>
            </div>
          </div>
        </div>

        {/* Upcoming Games */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Upcoming Games — Start a Chat Room
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game, idx) => {
              // Check if there's already a room for this game
              const existingRoom = liveRooms.find(
                (r) => r.teamHome === game.home && r.teamAway === game.away
              );
              return (
                <Card key={idx} className={`bg-gradient-to-br ${getSportColor(game.sport)} border-white/10`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${getSportBadgeColor(game.sport)} text-white text-xs`}>
                        {game.sport.toUpperCase()} {(game as typeof NFL_GAMES[0] & { week?: string }).week || ""}
                      </Badge>
                      {existingRoom ? (
                        <Badge className="bg-red-500 text-white text-xs gap-1">
                          <Radio className="w-2.5 h-2.5" /> {existingRoom.playerCount} live
                        </Badge>
                      ) : (
                        <Tv className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                    <div className="text-center mb-3">
                      <div className="flex items-center justify-center gap-3 text-2xl mb-1">
                        <span>{(game as typeof NFL_GAMES[0]).awayEmoji}</span>
                        <span className="text-white/40 text-sm font-bold">@</span>
                        <span>{(game as typeof NFL_GAMES[0]).homeEmoji}</span>
                      </div>
                      <p className="text-white font-bold text-sm">{game.away}</p>
                      <p className="text-white/60 text-xs">@ {game.home}</p>
                    </div>
                    <p className="text-white/50 text-xs text-center mb-3">{formatGameTime(game.time)}</p>
                    {existingRoom ? (
                      <Button
                        onClick={() => navigate(`/sports/watch-party/${existingRoom.id}`)}
                        className="w-full bg-red-500 hover:bg-red-400 text-white font-bold text-sm gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> Join Live Chat
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCreateFromGame(game as typeof NFL_GAMES[0], game.sport)}
                        disabled={createRoomMutation.isPending}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm"
                      >
                        <Trophy className="w-3 h-3 mr-1" /> Start Game Day Chat
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
