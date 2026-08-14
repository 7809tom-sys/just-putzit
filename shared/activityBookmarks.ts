export function isActivityBookmarked(bookmarkIds: number[] | undefined, activityId: number) {
  return bookmarkIds?.includes(activityId) ?? false;
}

export function getActivityBookmarkFeedback(isBookmarked: boolean) {
  return isBookmarked ? "Saved for later" : "Removed from saved events";
}
