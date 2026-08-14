export function getNotificationDestination(type: string, relatedId?: number | null) {
  if (type === "pickup_invite") return "/activities";
  if (type === "event_proposal" && relatedId) return `/chat/${relatedId}`;
  return null;
}

export function getNotificationActionLabel(type: string) {
  if (type === "pickup_invite") return "View public pickup";
  if (type === "event_proposal") return "Open invitation";
  return null;
}
