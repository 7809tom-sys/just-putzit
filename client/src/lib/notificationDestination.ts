export function getNotificationDestination(type: string) {
  return type === "pickup_invite" ? "/activities" : null;
}

export function getNotificationActionLabel(type: string) {
  return type === "pickup_invite" ? "View public pickup" : null;
}
