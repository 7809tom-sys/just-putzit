import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Camera, CheckCircle, XCircle, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { VoiceCallButton } from "@/components/VoiceCallButton";

export default function Bullgerdash() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const mid = parseInt(matchId || "0");

  const [caption, setCaption] = useState("");
  const [isLie, setIsLie] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealResult, setRevealResult] = useState<{ storytellerWon: boolean; storytellerPoints: number; voterPoints: number } | null>(null);

  const { data: myMatches } = trpc.matchmaking.getMyMatches.useQuery(undefined, { enabled: !!mid });
  const match = myMatches?.find(m => m.id === mid);
  const otherProfile = match?.otherProfile;
  const { data: gameData, refetch } = trpc.bullgerdash.getGame.useQuery(
    { matchId: mid },
    { enabled: !!mid, refetchInterval: 3000 }
  );

  const startGame = trpc.bullgerdash.startGame.useMutation({
    onSuccess: () => refetch(),
    onError: () => toast.error("Couldn't start the game."),
  });

  const submitCaption = trpc.bullgerdash.submitCaption.useMutation({
    onSuccess: () => { setSubmitting(false); refetch(); },
    onError: () => { toast.error("Couldn't submit caption."); setSubmitting(false); },
  });

  const submitVote = trpc.bullgerdash.submitVote.useMutation({
    onSuccess: (data) => {
      setRevealResult(data);
      setSubmitting(false);
      refetch();
    },
    onError: () => { toast.error("Couldn't submit vote."); setSubmitting(false); },
  });

  const nextRound = trpc.bullgerdash.nextRound.useMutation({
    onSuccess: () => { setRevealResult(null); setCaption(""); setIsLie(null); refetch(); },
    onError: () => toast.error("Couldn't advance to next round."),
  });

  const endGame = trpc.bullgerdash.endGame.useMutation({
    onSuccess: () => navigate(`/chat/${matchId}`),
  });

  if (!mid) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4">📸</div>
          <h1 className="font-display font-bold text-2xl mb-2">Play Bulger Dash with a match</h1>
          <p className="text-muted-foreground mb-6">Bulger Dash is a private two-player game. Choose a match first, then open Games to start a mystery-photo round together.</p>
          <Button className="w-full gradient-sally text-white border-0 rounded-xl btn-scale" onClick={() => navigate("/matches")}>
            Find a Match to Play
          </Button>
        </div>
      </div>
    );
  }

  // Auto-start game if no game exists
  useEffect(() => {
    if (gameData === null && match && user) {
      const opponentId = match.user1Id === user.id ? match.user2Id : match.user1Id;
      startGame.mutate({ matchId: mid, opponentId });
    }
  }, [gameData, match, user]);

  if (!gameData && gameData !== null) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse">📸</div>
          <p className="font-semibold">Loading Bulger Dash...</p>
        </div>
      </div>
    );
  }

  const game = gameData?.game;
  const round = gameData?.round;
  const photo = gameData?.photo;

  const isStoryteller = round?.storytellerId === user?.id;
  const myScore = game ? (game.player1Id === user?.id ? game.player1Score : game.player2Score) : 0;
  const opponentScore = game ? (game.player1Id === user?.id ? game.player2Score : game.player1Score) : 0;

  // ── Game finished ──────────────────────────────────────────────────────────
  if (game?.status === "finished") {
    const iWon = myScore > opponentScore;
    const tied = myScore === opponentScore;
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4">{iWon ? "🏆" : tied ? "🤝" : "🎉"}</div>
          <h2 className="font-display font-bold text-2xl mb-1">Game Over!</h2>
          <p className="text-muted-foreground mb-6">{iWon ? "You won!" : tied ? "It's a tie!" : `${otherProfile?.displayName} wins!`}</p>
          <div className="flex gap-6 justify-center mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">{myScore}</div>
              <div className="text-xs text-muted-foreground mt-1">You</div>
            </div>
            <div className="text-2xl text-muted-foreground self-center">vs</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500">{opponentScore}</div>
              <div className="text-xs text-muted-foreground mt-1">{otherProfile?.displayName}</div>
            </div>
          </div>
          <Button className="w-full gradient-sally text-white border-0 rounded-xl btn-scale" onClick={() => navigate(`/chat/${matchId}`)}>
            Back to Chat
          </Button>
        </div>
      </div>
    );
  }

  // ── Reveal phase ───────────────────────────────────────────────────────────
  if (round?.phase === "reveal") {
    const storytellerWon = revealResult?.storytellerWon ?? (round.isLie ? round.voterGuess === "truth" : round.voterGuess === "lie");
    const voterWasRight = !storytellerWon;
    return (
      <div className="min-h-screen gradient-warm flex flex-col">
        <div className="container py-6 max-w-lg flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/chat/${matchId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl">Bulger Dash 📸</h1>
              <p className="text-xs text-muted-foreground">Round {game?.currentRound}</p>
            </div>
            <ScoreChip myScore={myScore} opponentScore={opponentScore} opponentName={otherProfile?.displayName} />
          </div>
          <VoiceCallButton myUserId={user?.id} otherUserId={otherProfile?.userId} otherName={otherProfile?.displayName ?? undefined} />

          {/* Photo */}
          {photo && (
            <div className="rounded-2xl overflow-hidden mb-4 shadow-lg">
              <img src={photo.imageUrl} alt="Mystery photo" className="w-full h-56 object-cover" />
            </div>
          )}

          {/* Reveal */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={round.isLie ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}>
                {round.isLie ? "😈 That was a LIE!" : "✅ That was the TRUTH!"}
              </Badge>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">Storyteller said:</p>
            <p className="text-gray-900 italic mb-4">"{round.caption}"</p>
            {photo?.truthCaption && (
              <>
                <p className="text-sm font-medium text-gray-700 mb-1">The real story:</p>
                <p className="text-gray-600 text-sm italic">"{photo.truthCaption}"</p>
              </>
            )}
          </div>

          {/* Points */}
          <div className={`rounded-2xl p-4 mb-6 text-center ${storytellerWon ? "bg-purple-50 border border-purple-200" : "bg-pink-50 border border-pink-200"}`}>
            {isStoryteller ? (
              storytellerWon
                ? <p className="font-bold text-purple-700">🎉 You fooled them! +{revealResult?.storytellerPoints ?? 3} pts</p>
                : <p className="font-bold text-pink-600">😅 They saw through you! No points this round.</p>
            ) : (
              voterWasRight
                ? <p className="font-bold text-green-700">🎯 You got it right! +{revealResult?.voterPoints ?? 2} pts</p>
                : <p className="font-bold text-pink-600">😅 You were fooled! No points this round.</p>
            )}
          </div>

          {/* Next round / End */}
          <div className="flex gap-3 mt-auto">
            <Button
              variant="outline"
              className="flex-1 rounded-xl gap-2"
              onClick={() => game && endGame.mutate({ gameId: game.id })}
            >
              <LogOut className="w-4 h-4" /> End Game
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-xl btn-scale gap-2"
              onClick={() => game && nextRound.mutate({ gameId: game.id })}
            >
              <RefreshCw className="w-4 h-4" /> Next Round
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Storyteller writing ────────────────────────────────────────────────────
  if (round?.phase === "storyteller_writing" && isStoryteller) {
    return (
      <div className="min-h-screen gradient-warm flex flex-col">
        <div className="container py-6 max-w-lg flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/chat/${matchId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl">Bulger Dash 📸</h1>
              <p className="text-xs text-muted-foreground">Round {game?.currentRound} — Your turn to tell a story</p>
            </div>
            <ScoreChip myScore={myScore} opponentScore={opponentScore} opponentName={otherProfile?.displayName} />
          </div>
          <VoiceCallButton myUserId={user?.id} otherUserId={otherProfile?.userId} otherName={otherProfile?.displayName ?? undefined} />

          {photo && (
            <div className="rounded-2xl overflow-hidden mb-4 shadow-lg">
              <img src={photo.imageUrl} alt="Mystery photo" className="w-full h-56 object-cover" />
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex-1">
            <p className="font-semibold mb-1">Write your caption</p>
            <p className="text-sm text-muted-foreground mb-4">Tell the truth about this photo — or make up a convincing lie. Your opponent has to guess!</p>
            <Textarea
              placeholder="What's the story behind this photo?"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="mb-4 min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mb-4 text-right">{caption.length}/500</p>

            <p className="font-semibold mb-3">Is your caption the truth or a lie?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLie(false)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${isLie === false ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-green-300"}`}
              >
                ✅ Truth
              </button>
              <button
                onClick={() => setIsLie(true)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${isLie === true ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:border-red-300"}`}
              >
                😈 Lie
              </button>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-xl h-12 btn-scale"
            disabled={caption.trim().length < 5 || isLie === null || submitting}
            onClick={() => {
              if (!round || !game || isLie === null) return;
              setSubmitting(true);
              submitCaption.mutate({ gameId: game.id, roundId: round.id, caption: caption.trim(), isLie });
            }}
          >
            {submitting ? "Submitting..." : "Submit Caption →"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Storyteller waiting for voter ──────────────────────────────────────────
  if (round?.phase === "voter_guessing" && isStoryteller) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h2 className="font-display font-bold text-xl mb-2">Waiting for {otherProfile?.displayName}...</h2>
          <p className="text-muted-foreground text-sm mb-6">They're deciding if your story is truth or lie.</p>
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your caption</p>
            <p className="text-gray-800 italic">"{round.caption}"</p>
            <Badge className={`mt-2 ${round.isLie ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {round.isLie ? "😈 Lie" : "✅ Truth"}
            </Badge>
          </div>
          <ScoreChip myScore={myScore} opponentScore={opponentScore} opponentName={otherProfile?.displayName} inline />
        </div>
      </div>
    );
  }

  // ── Voter guessing ─────────────────────────────────────────────────────────
  if (round?.phase === "voter_guessing" && !isStoryteller) {
    return (
      <div className="min-h-screen gradient-warm flex flex-col">
        <div className="container py-6 max-w-lg flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/chat/${matchId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl">Bulger Dash 📸</h1>
              <p className="text-xs text-muted-foreground">Round {game?.currentRound} — Can you spot the lie?</p>
            </div>
            <ScoreChip myScore={myScore} opponentScore={opponentScore} opponentName={otherProfile?.displayName} />
          </div>

          {photo && (
            <div className="rounded-2xl overflow-hidden mb-4 shadow-lg">
              <img src={photo.imageUrl} alt="Mystery photo" className="w-full h-56 object-cover" />
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{otherProfile?.displayName} says:</p>
            <p className="text-gray-900 text-lg italic mb-6">"{round.caption}"</p>
            <p className="font-semibold mb-4 text-center">Is this the truth or a lie?</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (!round || !game || submitting) return;
                  setSubmitting(true);
                  submitVote.mutate({ gameId: game.id, roundId: round.id, guess: "truth" });
                }}
                disabled={submitting}
                className="flex-1 py-6 rounded-2xl border-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-lg transition-all active:scale-95 flex flex-col items-center gap-2"
              >
                <CheckCircle className="w-8 h-8" />
                Truth
              </button>
              <button
                onClick={() => {
                  if (!round || !game || submitting) return;
                  setSubmitting(true);
                  submitVote.mutate({ gameId: game.id, roundId: round.id, guess: "lie" });
                }}
                disabled={submitting}
                className="flex-1 py-6 rounded-2xl border-2 border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-lg transition-all active:scale-95 flex flex-col items-center gap-2"
              >
                <XCircle className="w-8 h-8" />
                Lie
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting for storyteller to write ──────────────────────────────────────
  if (round?.phase === "storyteller_writing" && !isStoryteller) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4 animate-pulse">✍️</div>
          <h2 className="font-display font-bold text-xl mb-2">{otherProfile?.displayName} is writing...</h2>
          <p className="text-muted-foreground text-sm mb-6">They're crafting a story about the mystery photo. Truth or lie? You'll find out soon!</p>
          {photo && (
            <div className="rounded-2xl overflow-hidden mb-6 shadow-md">
              <img src={photo.imageUrl} alt="Mystery photo" className="w-full h-40 object-cover" />
            </div>
          )}
          <ScoreChip myScore={myScore} opponentScore={opponentScore} opponentName={otherProfile?.displayName} inline />
        </div>
      </div>
    );
  }

  // ── Loading / no round yet ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse">📸</div>
        <p className="font-semibold">Setting up Bulger Dash...</p>
      </div>
    </div>
  );
}

// ── Score chip component ───────────────────────────────────────────────────────
function ScoreChip({ myScore, opponentScore, opponentName, inline }: { myScore: number; opponentScore: number; opponentName?: string | null; inline?: boolean }) {
  if (inline) {
    return (
      <div className="flex gap-4 justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{myScore}</div>
          <div className="text-xs text-muted-foreground">You</div>
        </div>
        <div className="text-lg text-muted-foreground self-center">vs</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pink-500">{opponentScore}</div>
          <div className="text-xs text-muted-foreground">{opponentName}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 bg-white/80 rounded-full px-3 py-1 text-xs font-bold shadow-sm">
      <span className="text-purple-600">{myScore}</span>
      <span className="text-gray-400">–</span>
      <span className="text-pink-500">{opponentScore}</span>
    </div>
  );
}
