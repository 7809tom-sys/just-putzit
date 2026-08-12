export type SocialGameId = "local_legend" | "perfect_saturday" | "three_in_common" | "would_you_join_me";

export type ChoiceRound = {
  id: number;
  prompt: string;
  traitKey: string;
  choices: string[];
};

export const SOCIAL_GAMES: Array<{
  id: SocialGameId;
  title: string;
  shortTitle: string;
  description: string;
  emoji: string;
  eyebrow: string;
  duration: string;
  accent: string;
}> = [
  {
    id: "local_legend",
    title: "Local Legend",
    shortTitle: "Local Legend",
    description: "Trade the kinds of places that make your neighborhood feel like home.",
    emoji: "📍",
    eyebrow: "Your local vibe",
    duration: "3 quick picks",
    accent: "from-teal-500 to-emerald-500",
  },
  {
    id: "perfect_saturday",
    title: "Plan the Perfect Saturday",
    shortTitle: "Perfect Saturday",
    description: "Build a low-pressure day out, one delightful stop at a time.",
    emoji: "☀️",
    eyebrow: "Your weekend rhythm",
    duration: "4 quick picks",
    accent: "from-orange-500 to-amber-400",
  },
  {
    id: "three_in_common",
    title: "Three Things in Common",
    shortTitle: "Three in Common",
    description: "Pick three simple joys that give people an easy way to start talking.",
    emoji: "🫶",
    eyebrow: "Your conversation starters",
    duration: "Pick 3",
    accent: "from-fuchsia-500 to-rose-500",
  },
  {
    id: "would_you_join_me",
    title: "Would You Join Me?",
    shortTitle: "Would You Join Me?",
    description: "Choose a public local activity you would be comfortable enjoying with someone new.",
    emoji: "🤝",
    eyebrow: "Safe public plans",
    duration: "1 safe choice",
    accent: "from-sky-500 to-blue-600",
  },
];

export const LOCAL_LEGEND_ROUNDS: ChoiceRound[] = [
  {
    id: 1,
    prompt: "A great local afternoon starts with…",
    traitKey: "local_afternoon_style",
    choices: ["A coffee and a neighborhood stroll", "A park or trail with fresh air", "A library, gallery, or museum", "A farmers market or local shop"],
  },
  {
    id: 2,
    prompt: "When you recommend your town, you lead with…",
    traitKey: "local_recommendation_style",
    choices: ["A hidden breakfast spot", "A peaceful public green space", "A favorite live show or game", "A place where everyone knows your name"],
  },
  {
    id: 3,
    prompt: "Your favorite easy way to meet people is…",
    traitKey: "community_connection_style",
    choices: ["A class or club", "Volunteering for something useful", "A casual event with music or food", "A walk, workout, or recreation group"],
  },
];

export const PERFECT_SATURDAY_ROUNDS: ChoiceRound[] = [
  {
    id: 1,
    prompt: "Saturday morning feels best with…",
    traitKey: "saturday_morning_style",
    choices: ["A slow breakfast", "A gym class or trail", "A farmers market", "A museum or local exhibit"],
  },
  {
    id: 2,
    prompt: "For an afternoon reset, choose…",
    traitKey: "saturday_afternoon_style",
    choices: ["A public park picnic", "Browsing a local shop", "A pickup game or court", "A community class"],
  },
  {
    id: 3,
    prompt: "Your best early evening plan is…",
    traitKey: "saturday_evening_style",
    choices: ["Live music or a local play", "A friendly game night", "Dinner somewhere casual", "A beach, lake, or sunset walk"],
  },
  {
    id: 4,
    prompt: "What makes a plan worth repeating?",
    traitKey: "repeat_plan_value",
    choices: ["Good conversation", "Trying something new", "Getting active outdoors", "Supporting local places"],
  },
];

export const COMMON_GROUND_OPTIONS = [
  "A great cup of coffee",
  "Live local music",
  "A walk in the park",
  "Trying a new recipe",
  "Cheering for a hometown team",
  "A library or bookstore visit",
  "A gym class or pickup game",
  "Helping at a community event",
] as const;

export const PUBLIC_PLAN_OPTIONS = [
  "Meet at a farmers market",
  "Try a library book club",
  "Take a public park walk",
  "See a museum or gallery exhibit",
  "Watch a community theater show",
  "Join a public recreation class",
] as const;

export const SAFE_PLAN_COPY = "Keep it easy: start with a public activity, choose your own transportation, and use the app only when everyone is comfortable.";

export function hasExactlyThreeCommonGroundSelections(selections: readonly string[]) {
  return selections.length === 3;
}

export function getSocialGame(id: SocialGameId) {
  return SOCIAL_GAMES.find((game) => game.id === id);
}
