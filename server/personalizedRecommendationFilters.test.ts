import { describe, expect, it } from "vitest";
import { filterPersonalizedRecommendations, getRecommendationCategories } from "../client/src/lib/personalizedRecommendationFilters";

const activities = [
  { id: 1, title: "Bowling", category: "bowling", eventDate: "2026-08-13T17:00:00.000Z", venueLat: 43.01, venueLng: -88.23 },
  { id: 2, title: "Basketball", category: "basketball", eventDate: "2026-08-17T17:00:00.000Z", venueLat: 43.05, venueLng: -88.28 },
  { id: 3, title: "Library club", category: "library", eventDate: "2026-09-01T17:00:00.000Z", venueLat: 43.0, venueLng: -88.22 },
];

describe("personalized recommendation filters", () => {
  it("filters recommended activities by category and time window", () => {
    const result = filterPersonalizedRecommendations({
      activities,
      category: "basketball",
      timeWindow: "next_7_days",
      sortBy: "relevance",
      now: new Date("2026-08-13T12:00:00.000Z"),
    });
    expect(result.map((activity) => activity.id)).toEqual([2]);
  });

  it("sorts nearby recommendations by computed distance", () => {
    const result = filterPersonalizedRecommendations({
      activities,
      category: "all",
      timeWindow: "any",
      sortBy: "distance",
      userLat: 43.0,
      userLng: -88.22,
      now: new Date("2026-08-13T12:00:00.000Z"),
    });
    expect(result.map((activity) => activity.id)).toEqual([3, 1, 2]);
  });

  it("returns a stable category list for filter controls", () => {
    expect(getRecommendationCategories(activities)).toEqual(["basketball", "bowling", "library"]);
  });
});
