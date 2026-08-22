import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Camera, CheckCircle2, Trophy, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function BullgerdashGroup() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = Number(rawRoomId);
  const [, navigate] = useLocation();
  const [caption, setCaption] = useState("");
  const [isLie, setIsLie] = useState("lie");
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: room } = trpc.gameLobby.getRoom.useQuery({ roomId }, { enabled: Number.isFinite(roomId), refetchInterval: 3000 });
  const { data: group, refetch } = trpc.bullgerdash.groupGet.useQuery({ roomId }, { enabled: Number.isFinite(roomId), refetchInterval: 3000, retry: false });

  const start = trpc.bullgerdash.groupStart.useMutation({ onSuccess: () => refetch(), onError: (error) => toast.error(error.message) });
  const submitCaption = trpc.bullgerdash.groupSubmitCaption.useMutation({ onSuccess: () => { setCaption(""); refetch(); }, onError: (error) => toast.error(error.message) });
  const vote = trpc.bullgerdash.groupSubmitVote.useMutation({ onSuccess: (result) => { toast.success(result.revealed ? "All votes are in — reveal unlocked!" : "Vote saved privately."); refetch(); }, onError: (error) => toast.error(error.message) });
  const next = trpc.bullgerdash.groupNextRound.useMutation({ onSuccess: () => refetch(), onError: (error) => toast.error(error.message) });
  const end = trpc.bullgerdash.groupEnd.useMutation({ onSuccess: () => navigate("/game-lobby"), onError: (error) => toast.error(error.message) });

  if (!Number.isFinite(roomId)) return <GroupNotice title="Bulger Dash needs a game room" detail="Create or join a Bulger Dash room in Game Lobby first." onBack={() => navigate("/game-lobby")} />;
  if (!room) return <div className="min-h-screen gradient-warm flex items-center justify-center">Loading group game…</div>;
  const isHost = room.hostUserId === profile?.userId;

  if (!group) {
    return (
      <div className="min-h-screen gradient-warm p-4">
        <div className="max-w-lg mx-auto pt-12">
          <Button variant="ghost" onClick={() => navigate("/game-lobby")}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Game Lobby</Button>
          <GroupNotice title="Bulger Dash Group Room" detail={`${room.players?.length ?? 0} player${(room.players?.length ?? 0) === 1 ? "" : "s"} are ready. The host starts a mystery-photo bluff round for the room.`} onBack={isHost ? () => start.mutate({ roomId }) : undefined} actionLabel="Start Group Game" pending={start.isPending} />
        </div>
      </div>
    );
  }

  const scores = Object.entries(group.game.scores).sort(([, left], [, right]) => right - left);
  const isFinished = group.game.status === "finished";
  const canVote = !group.isStoryteller && group.round.phase === "group_voting" && !group.myVote;

  return (
    <div className="min-h-screen gradient-warm pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="sm" onClick={() => navigate("/game-lobby")}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1"><h1 className="font-display font-bold text-2xl">Bulger Dash Group</h1><p className="text-sm text-muted-foreground">Round {group.round.roundNumber} · {group.game.playerIds.length} players</p></div>
          <Users className="w-5 h-5 text-violet-600" />
        </div>

        <Card className="mb-4 border-violet-100"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Votes in</span><span className="text-sm text-violet-700 font-bold">{group.votesSubmitted}/{group.requiredVotes}</span></div><div className="mt-2 h-2 rounded-full bg-violet-100"><div className="h-2 rounded-full bg-violet-600 transition-all" style={{ width: `${group.requiredVotes ? (group.votesSubmitted / group.requiredVotes) * 100 : 0}%` }} /></div></CardContent></Card>

        {group.photo && <img src={group.photo.imageUrl} alt="Mystery photo for the current Bulger Dash round" className="w-full h-60 object-cover rounded-3xl shadow-lg mb-4" />}

        {isFinished ? <Card><CardContent className="p-7 text-center"><Trophy className="mx-auto w-10 h-10 text-amber-500 mb-3" /><h2 className="text-2xl font-bold">Game complete</h2><Scoreboard scores={scores} players={room.players ?? []} /></CardContent></Card> : group.isStoryteller && group.round.phase === "storyteller_writing" ? (
          <Card><CardContent className="p-6 space-y-4"><h2 className="font-bold text-lg">You are the storyteller</h2><p className="text-sm text-muted-foreground">Write a convincing caption, then choose whether it is the truth or a bluff. The room will not see your choice until the reveal.</p><Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Write your caption…" maxLength={500} /><RadioGroup value={isLie} onValueChange={setIsLie} className="flex gap-5"><div className="flex items-center gap-2"><RadioGroupItem value="truth" id="truth" /><Label htmlFor="truth">This is true</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="lie" id="lie" /><Label htmlFor="lie">This is a bluff</Label></div></RadioGroup><Button className="w-full gradient-sally text-white" disabled={caption.trim().length < 5 || submitCaption.isPending} onClick={() => submitCaption.mutate({ roomId, caption: caption.trim(), isLie: isLie === "lie" })}>Share caption for voting</Button></CardContent></Card>
        ) : group.round.phase === "group_voting" ? (
          <Card><CardContent className="p-6 text-center space-y-4"><h2 className="font-bold text-lg">{group.round.caption}</h2>{group.isStoryteller ? <p className="text-muted-foreground">Your caption is live. Let the group decide.</p> : group.myVote ? <p className="text-violet-700 font-medium">Your vote is private. Waiting for the group…</p> : <><p className="text-sm text-muted-foreground">Is this caption the truth or a bluff?</p><div className="grid grid-cols-2 gap-3"><Button variant="outline" className="h-14" disabled={!canVote || vote.isPending} onClick={() => vote.mutate({ roomId, guess: "truth" })}>Truth</Button><Button className="h-14 bg-violet-600 hover:bg-violet-700" disabled={!canVote || vote.isPending} onClick={() => vote.mutate({ roomId, guess: "lie" })}>Bluff</Button></div></>}</CardContent></Card>
        ) : (
          <Card><CardContent className="p-6 text-center space-y-3"><CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" /><h2 className="font-bold text-lg">Reveal</h2><p className="text-sm text-muted-foreground">{group.photo?.truthCaption}</p><p className="font-semibold">The storyteller said: {group.round.isLie ? "a bluff" : "the truth"}</p><Scoreboard scores={scores} players={room.players ?? []} />{isHost && <div className="grid grid-cols-2 gap-3 pt-3"><Button variant="outline" onClick={() => end.mutate({ roomId })}>End game</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={() => next.mutate({ roomId })}>Next round</Button></div>}</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function GroupNotice({ title, detail, onBack, actionLabel = "Find a room", pending = false }: { title: string; detail: string; onBack?: () => void; actionLabel?: string; pending?: boolean }) {
  return <Card className="rounded-3xl shadow-xl"><CardContent className="p-8 text-center"><Camera className="w-12 h-12 mx-auto text-violet-600 mb-4" /><h1 className="font-display font-bold text-2xl mb-2">{title}</h1><p className="text-muted-foreground mb-6">{detail}</p>{onBack && <Button className="w-full bg-violet-600 hover:bg-violet-700" disabled={pending} onClick={onBack}>{actionLabel}</Button>}</CardContent></Card>;
}

function Scoreboard({ scores, players }: { scores: [string, number][]; players: Array<{ userId: number; displayName?: string | null }> }) {
  return <div className="mt-5 text-left space-y-2">{scores.map(([userId, score], index) => <div key={userId} className="flex justify-between rounded-xl bg-violet-50 px-4 py-2"><span>{index + 1}. {players.find((player) => player.userId === Number(userId))?.displayName ?? "Player"}</span><strong>{score} pts</strong></div>)}</div>;
}
