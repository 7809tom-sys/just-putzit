import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Users, Plus, Trophy, Tv, Calendar, Zap } from "lucide-react";

// ── Pro team schedule data (static for now — can be replaced with API) ──────
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
    if (!user) { toast.error("Sign in to create a watch party"); return; }
    try {
      const result = await createRoomMutation.mutateAsync({
        title: `${game.away} @ ${game.home}`,
        teamHome: game.home,
        teamAway: game.away,
        sport,
        gameTime: game.time,
      });
      toast.success(`Watch party created! Code: ${result.gameCode}`);
      navigate(`/sports/watch-party/${result.roomId}`);
    } catch {
      toast.error("Failed to create watch party");
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
      toast.success(`Watch party created! Code: ${result.gameCode}`);
      setShowCreateLocal(false);
      navigate(`/sports/watch-party/${result.roomId}`);
    } catch {
      toast.error("Failed to create watch party");
    }
  };

  const allGames = [
    ...NFL_GAMES.map((g) => ({ ...g, sport: "nfl" as const })),
    ...NBA_GAMES.map((g) => ({ ...g, sport: "nba" as const })),
    ...MLB_GAMES.map((g) => ({ ...g, sport: "mlb" as const })),
  ];

  const filteredGames = activeSport === "all" ? allGames : allGames.filter((g) => g.sport === activeSport);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                🏟️ Sports Watch Parties
              </h1>
              <p className="text-green-200 mt-1">Watch together. Trash talk. Win trivia. 🏆</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Join by code */}
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
              {/* Create local event */}
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
                      Create Watch Party Room
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

        {/* Active Watch Party Rooms */}
        {roomsData && roomsData.rooms.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Live Watch Party Rooms
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomsData.rooms.map((room) => (
                <Card
                  key={room.id}
                  className={`bg-gradient-to-br ${getSportColor(room.sport)} border-white/10 cursor-pointer hover:scale-[1.02] transition-transform`}
                  onClick={() => navigate(`/sports/watch-party/${room.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-green-500 text-white text-xs">
                        {room.status === "live" ? "🔴 LIVE" : "⏳ Waiting"}
                      </Badge>
                      <span className="text-white/60 text-xs font-mono">{room.gameCode}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">{room.title}</h3>
                    <div className="flex items-center gap-2 text-white/60 text-xs">
                      <Users className="w-3 h-3" /> {room.playerCount} fans
                      <span>· by {room.hostName}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Games */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Upcoming Games — Create a Watch Party
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game, idx) => (
              <Card key={idx} className={`bg-gradient-to-br ${getSportColor(game.sport)} border-white/10`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="border-white/30 text-white/70 text-xs">
                      {game.sport.toUpperCase()} {(game as typeof NFL_GAMES[0] & { week?: string }).week || ""}
                    </Badge>
                    <Tv className="w-4 h-4 text-white/40" />
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
                  <Button
                    onClick={() => handleCreateFromGame(game as typeof NFL_GAMES[0], game.sport)}
                    disabled={createRoomMutation.isPending}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm"
                  >
                    <Trophy className="w-3 h-3 mr-1" /> Start Watch Party
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
