import { haversineDistanceMiles } from "@shared/geo";

export type RecommendationSort = "relevance" | "distance" | "time";
export type RecommendationTimeWindow = "any" | "today" | "next_7_days" | "upcoming";

export type RecommendationActivity = {
  id: number;
  title: string;
  category: string;
  eventDate?: Date | string | null;
  venueLat?: number | string | null;
  venueLng?: number | string | null;
};

export type FilteredRecommendation<T extends RecommendationActivity> = T & { distanceMiles?: number };

function startOfToday(now: Date) {
  const value = new Date(now);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isInTimeWindow(value: RecommendationActivity, timeWindow: RecommendationTimeWindow, now: Date) {
  if (timeWindow === "any") return true;
  if (!value.eventDate) return timeWindow === "upcoming";
  const date = new Date(value.eventDate);
  if (Number.isNaN(date.getTime())) return false;
  const today = startOfToday(now);
  if (timeWindow === "today") return date >= today && date < new Date(today.getTime() + 24 * 60 * 60 * 1000);
  if (timeWindow === "next_7_days") return date >= today && date < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return date >= today;
}

export function getRecommendationCategories(activities: RecommendationActivity[]) {
  return Array.from(new Set(activities.map((activity) => activity.category).filter(Boolean))).sort();
}

export function filterPersonalizedRecommendations<T extends RecommendationActivity>(input: {
  activities: T[];
  category: string;
  timeWindow: RecommendationTimeWindow;
  sortBy: RecommendationSort;
  userLat?: number;
  userLng?: number;
  now?: Date;
}): FilteredRecommendation<T>[] {
  const now = input.now ?? new Date();
  const filtered = input.activities
    .filter((activity) => input.category === "all" || activity.category === input.category)
    .filter((activity) => isInTimeWindow(activity, input.timeWindow, now))
    .map((activity) => {
      const venueLat = activity.venueLat === null || activity.venueLat === undefined ? undefined : Number(activity.venueLat);
      const venueLng = activity.venueLng === null || activity.venueLng === undefined ? undefined : Number(activity.venueLng);
      const distanceMiles = input.userLat !== undefined && input.userLng !== undefined && Number.isFinite(venueLat) && Number.isFinite(venueLng)
        ? haversineDistanceMiles(input.userLat, input.userLng, venueLat!, venueLng!)
        : undefined;
      return { ...activity, distanceMiles };
    });

  if (input.sortBy === "distance") {
    return filtered.sort((left, right) => (left.distanceMiles ?? Number.POSITIVE_INFINITY) - (right.distanceMiles ?? Number.POSITIVE_INFINITY));
  }
  if (input.sortBy === "time") {
    return filtered.sort((left, right) => {
      const leftTime = left.eventDate ? new Date(left.eventDate).getTime() : Number.POSITIVE_INFINITY;
      const rightTime = right.eventDate ? new Date(right.eventDate).getTime() : Number.POSITIVE_INFINITY;
      return leftTime - rightTime;
    });
  }
  return filtered;
}
