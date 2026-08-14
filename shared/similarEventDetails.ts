export type SimilarEventCandidate = {
  id: number;
  category?: string | null;
  eventDate?: Date | string | null;
};

export function selectSimilarEventDetails<T extends SimilarEventCandidate>(input: {
  activities: T[];
  currentActivityId: number;
  currentCategory?: string | null;
  preferredCategories: string[];
  limit?: number;
}) {
  const preferred = new Set(input.preferredCategories);
  return input.activities
    .map((activity, index) => ({
      activity,
      index,
      score: (activity.category === input.currentCategory ? 3 : 0) + (activity.category && preferred.has(activity.category) ? 2 : 0),
    }))
    .filter(({ activity }) => activity.id !== input.currentActivityId)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, input.limit ?? 3)
    .map(({ activity }) => activity);
}
