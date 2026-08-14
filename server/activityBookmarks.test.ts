import { describe, expect, it } from "vitest";
import { getActivityBookmarkFeedback, isActivityBookmarked } from "../shared/activityBookmarks";

describe("activity bookmarks", () => {
  it("identifies saved activities and uses clear feedback", () => {
    expect(isActivityBookmarked([3, 9], 9)).toBe(true);
    expect(isActivityBookmarked([3, 9], 2)).toBe(false);
    expect(getActivityBookmarkFeedback(true)).toBe("Saved for later");
    expect(getActivityBookmarkFeedback(false)).toBe("Removed from saved events");
  });
});
