export type EntertainmentListing = {
  id: number;
  title: string;
  category: string;
  eventDate: Date;
  venueName?: string | null;
  city: string;
  isFree: boolean;
  externalUrl?: string | null;
};

const entertainmentTerms = /music|concert|festival|theat(?:er|re)|movie|film|comedy|art|show|performance|dance|book|game|night/i;
const entertainmentCategories = new Set(["music", "arts", "community"]);

export function filterCurrentEntertainment(listings: EntertainmentListing[], now = new Date()) {
  return listings
    .filter((listing) => new Date(listing.eventDate) >= now)
    .filter((listing) => entertainmentCategories.has(listing.category) || entertainmentTerms.test(listing.title))
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 12);
}

export function filterVenueListings(listings: EntertainmentListing[], venueName: string, now = new Date()) {
  return listings
    .filter((listing) => new Date(listing.eventDate) >= now)
    .filter((listing) => listing.venueName?.toLowerCase() === venueName.toLowerCase())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 4);
}

export const officialEntertainmentCalendars = [
  { title: "Downtown Waukesha", detail: "Friday Night Live, outdoor movies, Riverside Rhythms, and seasonal downtown events.", href: "https://www.downtownwaukesha.com/calendar/", label: "View calendar" },
  { title: "Waukesha Civic Theatre", detail: "Local theatre, guest acts, cabaret, and community performances.", href: "https://www.waukeshacivictheatre.org/box-office/upcoming-shows/", label: "Upcoming shows" },
  { title: "Waukesha Public Library", detail: "Author talks, films, book clubs, tabletop games, and free public programs.", href: "https://waukesha.librarycalendar.com/events/upcoming", label: "Library calendar" },
  { title: "Marcus Theatres", detail: "Current showtimes and ticket information for the Waukesha-area cinema.", href: "https://www.marcustheatres.com/theatre-locations/majestic-cinema-of-brookfield", label: "See showtimes" },
  { title: "Visit Milwaukee", detail: "Festivals, concerts, performances, and citywide entertainment across Milwaukee.", href: "https://www.visitmilwaukee.org/events/", label: "Explore events" },
] as const;
