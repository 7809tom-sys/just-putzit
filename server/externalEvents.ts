import { ENV } from "./_core/env";

export interface ExternalEvent {
  id: string;
  source: "ticketmaster" | "eventbrite";
  title: string;
  description: string;
  category: string;
  venue: string;
  address: string;
  city: string;
  date: string | null;
  imageUrl: string | null;
  ticketUrl: string;
  price: string;
  isFree: boolean;
  isFeatured: boolean;
}

// Ticketmaster Discovery API
export async function fetchTicketmasterEvents(city: string, keyword?: string): Promise<ExternalEvent[]> {
  const apiKey = ENV.ticketmasterApiKey;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      city,
      size: "20",
      sort: "date,asc",
      classificationName: "music,sports,arts,family,comedy,film",
    });
    if (keyword) params.set("keyword", keyword);

    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    const events = data._embedded?.events ?? [];

    return events.map((e: any): ExternalEvent => {
      const venue = e._embedded?.venues?.[0];
      const priceRange = e.priceRanges?.[0];
      const classification = e.classifications?.[0];
      const category = classification?.segment?.name?.toLowerCase() ?? "other";
      // Affiliate link — append affiliate ID when you have one
      const ticketUrl = e.url ?? "#";

      return {
        id: `tm_${e.id}`,
        source: "ticketmaster",
        title: e.name,
        description: e.info ?? e.pleaseNote ?? "",
        category: mapTicketmasterCategory(category),
        venue: venue?.name ?? "TBD",
        address: venue?.address?.line1 ?? "",
        city: venue?.city?.name ?? city,
        date: e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? null,
        imageUrl: e.images?.find((img: any) => img.ratio === "16_9" && img.width > 300)?.url ?? e.images?.[0]?.url ?? null,
        ticketUrl,
        price: priceRange ? `$${priceRange.min}–$${priceRange.max}` : "See site",
        isFree: false,
        isFeatured: false,
      };
    });
  } catch {
    return [];
  }
}

// Eventbrite API
export async function fetchEventbriteEvents(city: string, keyword?: string): Promise<ExternalEvent[]> {
  const apiKey = ENV.eventbriteApiKey;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      "location.address": city,
      "location.within": "25mi",
      expand: "venue,ticket_availability",
      sort_by: "date",
      page_size: "20",
    });
    if (keyword) params.set("q", keyword);

    const res = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events = data.events ?? [];

    return events.map((e: any): ExternalEvent => {
      const isFree = e.is_free ?? false;
      const minPrice = e.ticket_availability?.minimum_ticket_price?.major_value;
      const ticketUrl = e.url ?? "#";

      return {
        id: `eb_${e.id}`,
        source: "eventbrite",
        title: e.name?.text ?? "Event",
        description: e.description?.text?.slice(0, 300) ?? e.summary ?? "",
        category: mapEventbriteCategory(e.category_id),
        venue: e.venue?.name ?? "TBD",
        address: e.venue?.address?.localized_address_display ?? "",
        city: e.venue?.address?.city ?? city,
        date: e.start?.utc ?? null,
        imageUrl: e.logo?.url ?? null,
        ticketUrl,
        price: isFree ? "Free" : minPrice ? `From $${minPrice}` : "See site",
        isFree,
        isFeatured: false,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchAllExternalEvents(city: string, keyword?: string): Promise<ExternalEvent[]> {
  const [tmEvents, ebEvents] = await Promise.all([
    fetchTicketmasterEvents(city, keyword),
    fetchEventbriteEvents(city, keyword),
  ]);
  // Merge and sort by date
  const all = [...tmEvents, ...ebEvents].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  return all;
}

function mapTicketmasterCategory(cat: string): string {
  if (cat.includes("music")) return "concerts";
  if (cat.includes("sport")) return "sports";
  if (cat.includes("art") || cat.includes("theatre")) return "arts";
  if (cat.includes("family")) return "family";
  if (cat.includes("comedy")) return "comedy";
  if (cat.includes("film")) return "movies";
  return "other";
}

function mapEventbriteCategory(categoryId: string): string {
  const map: Record<string, string> = {
    "103": "music",
    "110": "food",
    "113": "community",
    "105": "arts",
    "104": "film",
    "108": "sports",
    "107": "science",
    "102": "family",
    "109": "charity",
    "111": "government",
    "112": "fashion",
    "115": "health",
    "116": "home",
    "117": "auto",
    "118": "hobbies",
    "119": "business",
    "120": "other",
  };
  return map[categoryId] ?? "other";
}
