export type LibrarySpotlightEvent = {
  id: number;
  title: string;
  eventDate: Date | string;
  venueName?: string | null;
  externalUrl?: string | null;
};

export function getWaukeshaLibrarySpotlight(events: LibrarySpotlightEvent[], now = new Date()) {
  return events
    .filter((event) => event.venueName?.toLowerCase() === "waukesha public library")
    .filter((event) => new Date(event.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 1)[0] ?? null;
}
