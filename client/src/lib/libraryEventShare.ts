export type LibraryEventShareInput = {
  title: string;
  eventDate: Date | string;
  venueName?: string | null;
  externalUrl?: string | null;
};

export type LibraryEventShareOutcome = "shared" | "copied" | "cancelled" | "unavailable";

export function buildLibraryEventShareData(event: LibraryEventShareInput) {
  const date = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(event.eventDate));
  const venue = event.venueName || "Waukesha Public Library";
  const url = event.externalUrl || "https://waukesha.librarycalendar.com/events/upcoming";
  return {
    title: `${event.title} · Waukesha Public Library`,
    text: `Want to join me at ${event.title}? ${date} at ${venue}.`,
    url,
  };
}

export async function shareLibraryEvent(event: LibraryEventShareInput): Promise<LibraryEventShareOutcome> {
  if (typeof window === "undefined") return "unavailable";
  const shareData = buildLibraryEventShareData(event);
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
  }
  try {
    if (!navigator.clipboard?.writeText) return "unavailable";
    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    return "copied";
  } catch {
    return "unavailable";
  }
}
