import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";
import {
  Trophy, Zap, Heart, MessageSquare, Brain, Star, Clock,
  Users, Lock, ChevronRight, Gamepad2
} from "lucide-react";

const GAMES = [
  {
    id: "trivia",
    title: "Trivia Challenge",
    description: "1–8 players compete across 6 categories with real-time chat",
    emoji: "🎯",
    color: "from-orange-500 to-amber-500",
    badge: "Multiplayer",
    badgeColor: "bg-orange-100 text-orange-700",
    route: "/trivia",
    players: "1–8",
    time: "10–15 min",
    premium: false,
    traits: ["knowledge", "interests", "competitive_style"],
  },
  {
    id: "hot_takes",
    title: "Hot Takes",
    description: "Rapid-fire agree/disagree on spicy statements. See where you clash.",
    emoji: "🔥",
    color: "from-red-500 to-orange-500",
    badge: "2 Players",
    badgeColor: "bg-red-100 text-red-700",
    route: "/games-hub/hot-takes",
    players: "2",
    time: "5 min",
    premium: false,
    traits: ["values", "lifestyle", "dealbreakers"],
  },
  {
    id: "finish_sentence",
    title: "Finish My Sentence",
    description: "Complete open-ended prompts and reveal your personality.",
    emoji: "✍️",
    color: "from-purple-500 to-pink-500",
    badge: "2 Players",
    badgeColor: "bg-purple-100 text-purple-700",
    route: "/games-hub/finish-sentence",
    players: "2",
    time: "5 min",
    premium: false,
    traits: ["communication_style", "humor", "dreams"],
  },
  {
    id: "compatibility_quiz",
    title: "Compatibility Quiz",
    description: "Answer the same 10 questions. Sally scores how aligned you are.",
    emoji: "💕",
    color: "from-pink-500 to-rose-500",
    badge: "2 Players",
    badgeColor: "bg-pink-100 text-pink-700",
    route: "/games-hub/compatibility",
    players: "2",
    time: "8 min",
    premium: false,
    traits: ["relationship_style", "values", "compatibility_score"],
  },
  {
    id: "trivia_date_night",
    title: "Trivia Date Night",
    description: "Team up against Sally in pub-style trivia. You vs. the AI.",
    emoji: "🍷",
    color: "from-rose-500 to-pink-600",
    badge: "Co-op",
    badgeColor: "bg-rose-100 text-rose-700",
    route: "/games-hub/date-night-trivia",
    players: "2",
    time: "10 min",
    premium: false,
    traits: ["teamwork", "knowledge_domains"],
  },
  {
    id: "sally_challenge",
    title: "Sally's Challenge",
    description: "Sally quizzes you on what your match has shared. How well do you listen?",
    emoji: "🤖",
    color: "from-blue-500 to-cyan-500",
    badge: "Premium",
    badgeColor: "bg-blue-100 text-blue-700",
    route: "/games-hub/sally-challenge",
    players: "2",
    time: "5 min",
    premium: true,
    traits: ["attentiveness", "emotional_investment"],
  },
  {
    id: "memory_lane",
    title: "Memory Lane",
    description: "Sally quizzes you on things your match said in chat. Pay attention!",
    emoji: "🧠",
    color: "from-green-500 to-teal-500",
    badge: "Premium",
    badgeColor: "bg-green-100 text-green-700",
    route: "/games-hub/memory-lane",
    players: "2",
    time: "5 min",
    premium: true,
    traits: ["attentiveness", "memory", "engagement"],
  },
  {
    id: "jeopardy",
    title: "Jeopardy!",
    description: "Answer clues for points with 1-10 players. Hear clues read aloud!",
    emoji: "🎬",
    color: "from-purple-500 to-blue-500",
    badge: "Multiplayer",
    badgeColor: "bg-purple-100 text-purple-700",
    route: "/jeopardy",
    players: "1-10",
    time: "15-20 min",
    premium: false,
    traits: ["knowledge", "competitive_style"],
  },
  {
    id: "trivia_pursuit",
    title: "Trivia Pursuit",
    description: "Multiple choice trivia with 1-10 players. Click to hear questions!",
    emoji: "🎯",
    color: "from-orange-500 to-red-500",
    badge: "Multiplayer",
    badgeColor: "bg-orange-100 text-orange-700",
    route: "/trivia-pursuit",
    players: "1-10",
    time: "10-15 min",
    premium: false,
    traits: ["knowledge", "interests"],
  },
];

// ─── Hot Takes Game ────────────────────────────────────────────────────────
const HOT_TAKES = [
  { id: 1, statement: "Pineapple on pizza is actually good.", traitKey: "food_adventurous" },
  { id: 2, statement: "Morning people are more productive than night owls.", traitKey: "schedule_type" },
  { id: 3, statement: "It's okay to check your phone during a date.", traitKey: "phone_etiquette" },
  { id: 4, statement: "Couples should share all their passwords.", traitKey: "privacy_in_relationships" },
  { id: 5, statement: "Long-distance relationships can work long-term.", traitKey: "relationship_flexibility" },
  { id: 6, statement: "Splitting the bill on a first date is the right move.", traitKey: "traditional_vs_modern" },
  { id: 7, statement: "It's fine to be friends with your ex.", traitKey: "ex_friendship" },
  { id: 8, statement: "Social media is hurting real relationships.", traitKey: "social_media_views" },
  { id: 9, statement: "You should live together before getting married.", traitKey: "cohabitation_views" },
  { id: 10, statement: "Jealousy is a sign of love, not insecurity.", traitKey: "jealousy_views" },
];

const FINISH_SENTENCES = [
  { id: 1, prompt: "My perfect Sunday morning looks like...", traitKey: "weekend_style" },
  { id: 2, prompt: "The thing that makes me laugh the hardest is...", traitKey: "humor_type" },
  { id: 3, prompt: "In 5 years, I see myself...", traitKey: "life_goals" },
  { id: 4, prompt: "My love language is best described as...", traitKey: "love_language" },
  { id: 5, prompt: "The weirdest thing about me is...", traitKey: "quirks" },
  { id: 6, prompt: "I feel most alive when...", traitKey: "passion" },
  { id: 7, prompt: "My biggest dealbreaker in a relationship is...", traitKey: "dealbreakers" },
  { id: 8, prompt: "The best date I can imagine is...", traitKey: "ideal_date" },
];

const COMPATIBILITY_QUESTIONS = [
  { id: 1, q: "How important is physical fitness to you?", options: ["Very important", "Somewhat important", "Not important", "Depends on the person"], traitKey: "fitness_values" },
  { id: 2, q: "How do you prefer to spend Friday nights?", options: ["Out with friends", "Quiet night in", "Date night out", "Depends on my mood"], traitKey: "social_energy" },
  { id: 3, q: "How do you handle conflict in relationships?", options: ["Talk it out immediately", "Need time to cool down", "Avoid conflict", "Depends on the issue"], traitKey: "conflict_style" },
  { id: 4, q: "How important is religion/spirituality to you?", options: ["Very important", "Somewhat important", "Not important", "Open to discussion"], traitKey: "spirituality" },
  { id: 5, q: "Where do you see yourself living in 5 years?", options: ["Same city", "Different city", "Different country", "No preference"], traitKey: "location_goals" },
  { id: 6, q: "Do you want children?", options: ["Yes, definitely", "Open to it", "No", "Already have them"], traitKey: "children_views" },
  { id: 7, q: "How do you feel about pets?", options: ["Love them, have some", "Love them, want some", "Like them but don't want any", "Not a pet person"], traitKey: "pet_preference" },
  { id: 8, q: "How do you prefer to communicate?", options: ["Text constantly", "Call when important", "In person only", "Mix of everything"], traitKey: "communication_preference" },
  { id: 9, q: "How important is career ambition to you?", options: ["Very — I'm driven", "Important but balanced", "Work to live, not live to work", "Still figuring it out"], traitKey: "career_ambition" },
  { id: 10, q: "What's your ideal relationship pace?", options: ["Slow and steady", "Medium — see how it goes", "Fast when it feels right", "No preference"], traitKey: "relationship_pace" },
];

// ─── Mini Game Components ─────────────────────────────────────────────────

function HotTakesGame({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const updateProfileMutation = trpc.games.recordGameAnswer.useMutation();

  const current = HOT_TAKES[index];
  const total = HOT_TAKES.length;

  const handleAnswer = async (agree: boolean) => {
    setAnswers(prev => ({ ...prev, [current.id]: agree }));
    try {
      await updateProfileMutation.mutateAsync({
        gameType: "hot_takes",
        questionId: current.id,
        answer: agree ? "agree" : "disagree",
        traitKey: current.traitKey,
        traitValue: agree ? "agree" : "disagree",
      });
    } catch { /* silent */ }
    if (index + 1 >= total) {
      onDone();
    } else {
      setIndex(i => i + 1);
    }
  };

  const pct = ((index) / total) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 max-w-sm mx-auto">
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{index + 1} of {total}</span>
          <span>Hot Takes 🔥</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-8 w-full">
        <div className="text-4xl mb-4">🔥</div>
        <p className="text-lg font-semibold text-gray-900 leading-relaxed">{current.statement}</p>
      </div>

      <div className="flex gap-4 w-full">
        <button
          onClick={() => handleAnswer(false)}
          className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold text-lg hover:bg-gray-200 active:scale-95 transition-all"
        >
          ❌ Nope
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-600 active:scale-95 transition-all"
        >
          ✅ Agree
        </button>
      </div>
    </div>
  );
}

function FinishSentenceGame({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState<string[]>([]);
  const updateProfileMutation = trpc.games.recordGameAnswer.useMutation();

  const current = FINISH_SENTENCES[index];
  const total = FINISH_SENTENCES.length;

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const answer = input.trim();
    setSubmitted(prev => [...prev, answer]);
    try {
      await updateProfileMutation.mutateAsync({
        gameType: "finish_sentence",
        questionId: current.id,
        answer,
        traitKey: current.traitKey,
        traitValue: answer,
      });
    } catch { /* silent */ }
    setInput("");
    if (index + 1 >= total) {
      onDone();
    } else {
      setIndex(i => i + 1);
    }
  };

  return (
    <div className="flex flex-col min-h-[60vh] px-4 max-w-sm mx-auto pt-8">
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{index + 1} of {total}</span>
          <span>Finish My Sentence ✍️</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(index / total) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 w-full">
        <p className="text-base font-medium text-gray-500 mb-1">Complete this sentence:</p>
        <p className="text-xl font-bold text-gray-900 leading-relaxed">"{current.prompt}"</p>
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Your answer..."
        className="w-full p-4 rounded-xl border border-gray-200 text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
        rows={3}
        maxLength={200}
      />

      <Button
        onClick={handleSubmit}
        disabled={!input.trim()}
        className="w-full bg-purple-500 hover:bg-purple-600 py-3 text-base"
      >
        Next <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

function CompatibilityQuizGame({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const updateProfileMutation = trpc.games.recordGameAnswer.useMutation();

  const current = COMPATIBILITY_QUESTIONS[index];
  const total = COMPATIBILITY_QUESTIONS.length;

  const handleAnswer = async (answer: string) => {
    setAnswers(prev => ({ ...prev, [current.id]: answer }));
    try {
      await updateProfileMutation.mutateAsync({
        gameType: "compatibility_quiz",
        questionId: current.id,
        answer,
        traitKey: current.traitKey,
        traitValue: answer,
      });
    } catch { /* silent */ }
    if (index + 1 >= total) {
      onDone();
    } else {
      setIndex(i => i + 1);
    }
  };

  return (
    <div className="flex flex-col min-h-[60vh] px-4 max-w-sm mx-auto pt-8">
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{index + 1} of {total}</span>
          <span>Compatibility Quiz 💕</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${(index / total) * 100}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 w-full">
        <p className="text-lg font-bold text-gray-900 leading-relaxed">{current.q}</p>
      </div>

      <div className="space-y-3">
        {current.options.map(opt => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="w-full py-3.5 px-4 rounded-xl border border-gray-200 text-left text-gray-800 font-medium hover:border-pink-400 hover:bg-pink-50 active:scale-95 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function GameDone({ game, onBack }: { game: typeof GAMES[0]; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Complete!</h2>
      <p className="text-gray-500 mb-2">Your answers have been saved to your profile.</p>
      <p className="text-sm text-orange-600 font-medium mb-8">
        Sally learned more about you — your matches just got better! ✨
      </p>
      <Button onClick={onBack} className="bg-orange-500 hover:bg-orange-600 px-8">
        Back to Games
      </Button>
    </div>
  );
}

// ─── Main Hub ─────────────────────────────────────────────────────────────

export default function GamesHub() {
  useSEO({
    title: "Games — Just Putzit",
    description: "Play profile-building games that help Sally find your perfect match.",
  });

  const [, navigate] = useLocation();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameDone, setGameDone] = useState(false);

  const handleGameSelect = (game: typeof GAMES[0]) => {
    if (game.id === "trivia") {
      navigate("/trivia");
      return;
    }
    if (game.premium) {
      toast.info("This game is coming soon for Premium members!");
      return;
    }
    setActiveGame(game.id);
    setGameDone(false);
  };

  const handleDone = () => setGameDone(true);
  const handleBack = () => { setActiveGame(null); setGameDone(false); };

  const activeGameObj = GAMES.find(g => g.id === activeGame);

  // Render active mini-game
  if (activeGame && !gameDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={handleBack} className="text-gray-500 hover:text-gray-800 transition-colors">
            ← Back
          </button>
          <span className="font-semibold text-gray-900">{activeGameObj?.title}</span>
        </div>
        {activeGame === "hot_takes" && <HotTakesGame onDone={handleDone} />}
        {activeGame === "finish_sentence" && <FinishSentenceGame onDone={handleDone} />}
        {activeGame === "compatibility" && <CompatibilityQuizGame onDone={handleDone} />}
        {activeGame === "trivia_date_night" && <CompatibilityQuizGame onDone={handleDone} />}
      </div>
    );
  }

  if (gameDone && activeGameObj) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3">
          <button onClick={handleBack} className="text-gray-500 hover:text-gray-800 transition-colors">← Back</button>
        </div>
        <GameDone game={activeGameObj} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Gamepad2 className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">Games</h1>
        </div>
        <p className="text-sm text-gray-500">Every game teaches Sally more about you — better games = better matches</p>
      </div>

      {/* Trait bar */}
      <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
        <div className="flex items-center gap-2 text-xs text-orange-700">
          <Brain className="w-3.5 h-3.5" />
          <span className="font-medium">Profile traits unlocked by games:</span>
          <div className="flex gap-1 flex-wrap">
            {["values", "humor", "lifestyle", "dealbreakers", "love language"].map(t => (
              <span key={t} className="bg-orange-100 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="px-4 pt-4 space-y-3">
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => handleGameSelect(game)}
            className="w-full text-left"
          >
            <Card className="overflow-hidden hover:shadow-md transition-all active:scale-[0.99] border border-gray-100">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Color strip */}
                  <div className={`w-2 bg-gradient-to-b ${game.color} flex-shrink-0`} />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{game.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-gray-900 text-sm">{game.title}</h3>
                            {game.premium && <Lock className="w-3 h-3 text-gray-400" />}
                          </div>
                          <Badge className={`text-xs mt-0.5 ${game.badgeColor}`}>{game.badge}</Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>

                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{game.description}</p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" /> {game.players}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {game.time}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-orange-500">
                        <Star className="w-3 h-3" /> Builds profile
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Sally note */}
      <div className="mx-4 mt-6 p-4 bg-white rounded-2xl border border-orange-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-600 mb-0.5">Sally says:</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              "The more games you play, the better I understand you — and the better your matches get. 
              Each answer teaches me something new about your values, humor, and what you're really looking for. 
              Keep playing! 💕"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
