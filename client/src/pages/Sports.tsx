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
import { Users, Plus, Trophy, Tv, Calendar, Zap, MessageSquare, Radio, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sport = "nfl" | "nba" | "mlb" | "all";

interface ScheduleTeam {
  name: string;
  shortName: string;
  abbreviation: string;
  logo: string;
  color: string;
}

interface ScheduleGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  statusName: string;
  statusDetail: string;
  isLive: boolean;
  isFinal: boolean;
  sport: "nfl" | "nba" | "mlb";
  homeTeam: ScheduleTeam;
  awayTeam: ScheduleTeam;
  broadcast?: string;
  venue?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGameTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
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

// ─── Sport Schedule Section ───────────────────────────────────────────────────

function SportSchedule({
  sport,
  liveRooms,
  onCreateRoom,
  isCreating,
}: {
  sport: "nfl" | "nba" | "mlb";
  liveRooms: { id: number; teamHome: string; teamAway: string; playerCount: number; gameCode: string; status: string; title: string; hostName: string; sport: string }[];
  onCreateRoom: (game: ScheduleGame) => void;
  isCreating: boolean;
}) {
  const { data, isLoading, refetch, dataUpdatedAt } = trpc.sportsScores.getUpcomingSchedule.useQuery(
    { sport, days: 7 },
    {
      // Refresh every 60s so live scores update without a page reload
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
    }
  );

  const hasLiveGames = (data?.games ?? []).some((g) => (g as ScheduleGame).isLive);
  const updatedTime = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  const games = (data?.games ?? []) as ScheduleGame[];

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 h-44 animate-pulse" />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-10 text-white/40">
        <p className="text-3xl mb-2">{sport === "nfl" ? "🏈" : sport === "nba" ? "🏀" : "⚾"}</p>
        <p className="font-medium">No {sport.toUpperCase()} games in the next 7 days</p>
        <button onClick={() => refetch()} className="mt-3 text-xs text-white/30 hover:text-white/60 flex items-center gap-1 mx-auto">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Live status bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {hasLiveGames ? (
            <span className="flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              Games in progress · auto-updating
            </span>
          ) : (
            <span className="text-white/30">Auto-refreshes every 60s</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-white/30">
          {updatedTime && <span>Updated {updatedTime}</span>}
          <button onClick={() => refetch()} className="hover:text-white/60 transition-colors" title="Refresh now">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => {
        const existingRoom = liveRooms.find(
          (r) => r.teamHome === game.homeTeam.name && r.teamAway === game.awayTeam.name
        );
        return (
          <Card key={game.id} className={`bg-gradient-to-br ${getSportColor(game.sport)} border-white/10`}>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <Badge className={`${getSportBadgeColor(game.sport)} text-white text-xs`}>
                  {game.sport.toUpperCase()}
                  {game.isLive && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />}
                </Badge>
                {existingRoom ? (
                  <Badge className="bg-red-500 text-white text-xs gap-1">
                    <Radio className="w-2.5 h-2.5" /> {existingRoom.playerCount} live
                  </Badge>
                ) : (
                  <Tv className="w-4 h-4 text-white/40" />
                )}
              </div>

              {/* Teams */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-3 mb-1">
                  {game.awayTeam.logo ? (
                    <img src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{game.awayTeam.abbreviation.slice(0, 2)}</div>
                  )}
                  <span className="text-white/40 text-sm font-bold">@</span>
                  {game.homeTeam.logo ? (
                    <img src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{game.homeTeam.abbreviation.slice(0, 2)}</div>
                  )}
                </div>
                <p className="text-white font-bold text-sm">{game.awayTeam.shortName || game.awayTeam.name}</p>
                <p className="text-white/60 text-xs">@ {game.homeTeam.shortName || game.homeTeam.name}</p>
              </div>

              {/* Time */}
              <p className="text-white/50 text-xs text-center mb-1">
                {game.isLive ? (
                  <span className="text-red-400 font-semibold">🔴 {game.statusDetail}</span>
                ) : game.isFinal ? (
                  <span className="text-white/40">Final · {game.statusDetail}</span>
                ) : (
                  formatGameTime(game.date)
                )}
              </p>
              {game.broadcast && (
                <p className="text-white/30 text-xs text-center mb-3">📺 {game.broadcast}</p>
              )}

              {/* CTA */}
              {existingRoom ? (
                <Button
                  onClick={() => { window.location.href = `/sports/watch-party/${existingRoom.id}`; }}
                  className="w-full bg-red-500 hover:bg-red-400 text-white font-bold text-sm gap-1"
                >
                  <MessageSquare className="w-3 h-3" /> Join Live Chat
                </Button>
              ) : (
                <Button
                  onClick={() => onCreateRoom(game)}
                  disabled={isCreating}
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Sports() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeSport, setActiveSport] = useState<Sport>("mlb");
  const [joinCode, setJoinCode] = useState("");
  const [showCreateLocal, setShowCreateLocal] = useState(false);
  const [localForm, setLocalForm] = useState({ title: "", teamHome: "", teamAway: "", gameTime: "" });

  const { data: roomsData, refetch: refetchRooms } = trpc.watchParty.listRooms.useQuery(
    { sport: activeSport === "all" ? undefined : activeSport },
    { refetchInterval: 10000 }
  );

  const createRoomMutation = trpc.watchParty.createRoom.useMutation();
  const joinRoomMutation = trpc.watchParty.joinRoom.useMutation();

  const liveRooms = roomsData?.rooms ?? [];
  const totalFans = liveRooms.reduce((sum, r) => sum + r.playerCount, 0);

  const handleCreateFromGame = async (game: ScheduleGame) => {
    if (!user) { toast.error("Sign in to open a Game Day Chat"); return; }
    try {
      const result = await createRoomMutation.mutateAsync({
        title: `${game.awayTeam.shortName || game.awayTeam.name} @ ${game.homeTeam.shortName || game.homeTeam.name}`,
        teamHome: game.homeTeam.name,
        teamAway: game.awayTeam.name,
        sport: game.sport,
        gameTime: game.date,
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
          {(["mlb", "nfl", "nba"] as Exclude<Sport, "all">[]).map((s) => (
            <Button
              key={s}
              onClick={() => setActiveSport(s)}
              variant={activeSport === s ? "default" : "outline"}
              className={activeSport === s ? "bg-green-600 hover:bg-green-700" : "border-white/30 text-white hover:bg-white/10"}
            >
              {s === "nfl" ? "🏈 NFL" : s === "nba" ? "🏀 NBA" : "⚾ MLB"}
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

        {/* Upcoming Games — live from ESPN */}
        <section>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Upcoming Games — Next 7 Days
          </h2>
          <p className="text-white/40 text-xs mb-4">Live schedule from ESPN · Tap any game to start a chat room</p>
          {activeSport === "all" ? (
            <div className="space-y-8">
              {(["mlb", "nfl", "nba"] as const).map((s) => (
                <div key={s}>
                  <h3 className="text-white/70 text-sm font-semibold mb-3">{s === "nfl" ? "🏈 NFL" : s === "nba" ? "🏀 NBA" : "⚾ MLB"}</h3>
                  <SportSchedule sport={s} liveRooms={liveRooms} onCreateRoom={handleCreateFromGame} isCreating={createRoomMutation.isPending} />
                </div>
              ))}
            </div>
          ) : (
            <SportSchedule sport={activeSport} liveRooms={liveRooms} onCreateRoom={handleCreateFromGame} isCreating={createRoomMutation.isPending} />
          )}
        </section>
      </div>
    </div>
  );
}
