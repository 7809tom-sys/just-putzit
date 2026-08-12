/**
 * communityScraper.ts
 * Scrapes public event calendars from Milwaukee/Waukesha area sources:
 *   - Milwaukee Public Library (mpl.libnet.info/events)
 *   - Waukesha Public Library (waukesha.librarycalendar.com/events/list)
 *   - UW-Milwaukee (uwm.edu/events)
 *   - Marquette University (today.marquette.edu/calendar)
 *   - OnMilwaukee (onmilwaukee.com/articles/weekend-preview)
 *
 * Each scraper returns a normalized ScrapedEvent[] array.
 * Scrapers fail gracefully — a broken source returns [] and logs a warning.
 */

import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedEvent {
  title: string;
  description: string | null;
  eventDate: Date | null;
  endDate: Date | null;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string;
  category: string; // maps to our activity category enum
  sourceUrl: string;
  sourceName: string;
  isFree: boolean;
  isOnCampus: boolean;
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; JustPutzit-EventBot/1.0; +https://justputzit.com/about)",
  "Accept": "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      maxRedirects: 5,
    });
    return res.data as string;
  } catch (err: any) {
    console.warn(`[communityScraper] Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

/** Parse a loose date string into a Date object, returns null if unparseable */
function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s+/g, " ");
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

export function parseWaukeshaCalendarDate(month: string, day: string, year: string, time?: string) {
  const monthIndex = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(month.trim().slice(0, 3).toLowerCase());
  const numericDay = Number(day);
  const numericYear = Number(year);
  if (monthIndex < 0 || !Number.isInteger(numericDay) || !Number.isInteger(numericYear)) return null;
  const match = time?.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  let hour = match ? Number(match[1]) : 0;
  const minute = match ? Number(match[2]) : 0;
  if (match?.[3].toLowerCase() === "pm" && hour < 12) hour += 12;
  if (match?.[3].toLowerCase() === "am" && hour === 12) hour = 0;
  const date = new Date(numericYear, monthIndex, numericDay, hour, minute, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Guess a category from title/description keywords */
function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (/bowl|bowling/i.test(t)) return "bowling";
  if (/golf/i.test(t)) return "mini_golf";
  if (/kayak|canoe|paddle/i.test(t)) return "kayaking";
  if (/movie|film|cinema|screening/i.test(t)) return "movies";
  if (/dinner|dining|restaurant|food|taste|culinary/i.test(t)) return "dining";
  if (/coffee|cafe|tea/i.test(t)) return "coffee";
  if (/cook|bake|kitchen|chef/i.test(t)) return "cooking_class";
  if (/escape room/i.test(t)) return "escape_room";
  if (/wine|beer|brew|tasting/i.test(t)) return "wine_tasting";
  if (/hike|trail|nature walk/i.test(t)) return "hiking";
  if (/park|garden|outdoor/i.test(t)) return "park";
  if (/library|book|reading|author|storytime/i.test(t)) return "library";
  if (/church|worship|faith|prayer/i.test(t)) return "church";
  if (/sport|game|league|tournament|athletic/i.test(t)) return "sports";
  if (/art|exhibit|gallery|museum|craft|paint|draw|theater|theatre|concert|music|dance|perform/i.test(t)) return "arts";
  if (/community|volunteer|fair|festival|market|meetup|social/i.test(t)) return "community_center";
  return "other";
}

// ─── Milwaukee Public Library ────────────────────────────────────────────────
export async function scrapeMilwaukeeLibrary(): Promise<ScrapedEvent[]> {
  const url = "https://mpl.libnet.info/events";
  const html = await fetchHtml(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // libnet uses .views-row or article.event-row elements
  $(".views-row, article.event-row, .event-listing, .event-item, li.event").each((_, el) => {
    const title = $(el).find("h2, h3, .event-title, .title, a").first().text().trim();
    if (!title || title.length < 3) return;

    const dateText = $(el).find(".date-display-single, .field-name-field-date, time, .event-date, .date").first().text().trim();
    const description = $(el).find(".field-name-body, .description, p").first().text().trim().slice(0, 300) || null;
    const location = $(el).find(".field-name-field-location, .location, .venue").first().text().trim() || null;
    const link = $(el).find("a").first().attr("href");
    const fullUrl = link ? (link.startsWith("http") ? link : `https://mpl.libnet.info${link}`) : url;

    events.push({
      title,
      description,
      eventDate: parseDate(dateText),
      endDate: null,
      venueName: location ?? "Milwaukee Public Library",
      venueAddress: null,
      venueCity: "Milwaukee, WI",
      category: guessCategory(title + " " + (description ?? "")),
      sourceUrl: fullUrl,
      sourceName: "Milwaukee Public Library",
      isFree: true,
      isOnCampus: false,
    });
  });

  // Fallback: grab any anchor with date-like sibling text
  if (events.length === 0) {
    $("a").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length < 5 || text.length > 120) return;
      const parent = $(el).parent();
      const dateText = parent.find("time, .date").first().text().trim();
      events.push({
        title: text,
        description: null,
        eventDate: parseDate(dateText),
        endDate: null,
        venueName: "Milwaukee Public Library",
        venueAddress: null,
        venueCity: "Milwaukee, WI",
        category: guessCategory(text),
        sourceUrl: $(el).attr("href") ? `https://mpl.libnet.info${$(el).attr("href")}` : url,
        sourceName: "Milwaukee Public Library",
        isFree: true,
        isOnCampus: false,
      });
    });
  }

  return events.slice(0, 30);
}

// ─── Waukesha Public Library ─────────────────────────────────────────────────
export async function scrapeWaukeshaLibrary(): Promise<ScrapedEvent[]> {
  const url = "https://waukesha.librarycalendar.com/events/upcoming";
  const pages = await Promise.all([0, 1, 2].map((page) => fetchHtml(page === 0 ? url : `${url}?page=${page}`)));
  const events: ScrapedEvent[] = [];
  const seenUrls = new Set<string>();

  for (const html of pages) {
    if (!html) continue;
    const $ = cheerio.load(html);
    $("article.event-card.event-card--sparse").each((_, el) => {
    // The calendar also exposes room reservations. Public library programs carry
    // an official age-group indicator; only those should appear in discovery.
    if ($(el).find(".lc-event__color-indicator").length === 0) return;
    const title = $(el).find(".lc-event__title a, h2, h3, .title, a").first().text().trim();
    if (!title || title.length < 3) return;

    const dateIcon = $(el).find(".lc-date-icon").first();
    const month = dateIcon.find(".lc-date-icon__item--month").text().trim();
    const day = dateIcon.find(".lc-date-icon__item--day").text().trim();
    const year = dateIcon.find(".lc-date-icon__item--year").text().trim();
    const time = $(el).find(".lc-event-info-item--time").first().text().trim();
    const description = null;
    const link = $(el).find(".lc-event__title a, a").first().attr("href");
    const fullUrl = link ? (link.startsWith("http") ? link : `https://waukesha.librarycalendar.com${link}`) : url;
    if (seenUrls.has(fullUrl)) return;
    seenUrls.add(fullUrl);

    events.push({
      title,
      description,
      eventDate: parseWaukeshaCalendarDate(month, day, year, time),
      endDate: null,
      venueName: "Waukesha Public Library",
      venueAddress: "321 Wisconsin Ave, Waukesha, WI 53186",
      venueCity: "Waukesha, WI",
      category: guessCategory(title + " " + (description ?? "")),
      sourceUrl: fullUrl,
      sourceName: "Waukesha Public Library",
      isFree: true,
      isOnCampus: false,
    });
    });
  }

  return events.slice(0, 30);
}

// ─── UW-Milwaukee ─────────────────────────────────────────────────────────────
export async function scrapeUWMilwaukee(): Promise<ScrapedEvent[]> {
  const url = "https://uwm.edu/events/";
  const html = await fetchHtml(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $("article, .event, .tribe-event, .views-row, li.event-item").each((_, el) => {
    const title = $(el).find("h2, h3, h4, .tribe-event-url, .entry-title, a").first().text().trim();
    if (!title || title.length < 3) return;

    const dateText = $(el).find("time, .tribe-event-date-start, .date, .event-date, abbr").first().text().trim();
    const description = $(el).find(".tribe-event-description, p, .description").first().text().trim().slice(0, 300) || null;
    const location = $(el).find(".tribe-venue, .location, .tribe-address").first().text().trim() || null;
    const link = $(el).find("a").first().attr("href");

    events.push({
      title,
      description,
      eventDate: parseDate(dateText),
      endDate: null,
      venueName: location ?? "UW-Milwaukee",
      venueAddress: null,
      venueCity: "Milwaukee, WI",
      category: guessCategory(title + " " + (description ?? "")),
      sourceUrl: link ?? url,
      sourceName: "UW-Milwaukee",
      isFree: false, // campus events may have admission
      isOnCampus: true,
    });
  });

  return events.slice(0, 30);
}

// ─── Marquette University ─────────────────────────────────────────────────────
export async function scrapeMarquette(): Promise<ScrapedEvent[]> {
  const url = "https://today.marquette.edu/calendar/";
  const html = await fetchHtml(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $("article, .event, .tribe-event, .views-row, .event-item, li").each((_, el) => {
    const title = $(el).find("h2, h3, h4, .entry-title, a").first().text().trim();
    if (!title || title.length < 3 || title.length > 150) return;

    const dateText = $(el).find("time, .tribe-event-date-start, .date, abbr").first().text().trim();
    const description = $(el).find("p, .description, .tribe-event-description").first().text().trim().slice(0, 300) || null;
    const location = $(el).find(".tribe-venue, .location, .venue").first().text().trim() || null;
    const link = $(el).find("a").first().attr("href");
    const fullUrl = link ? (link.startsWith("http") ? link : `https://today.marquette.edu${link}`) : url;

    events.push({
      title,
      description,
      eventDate: parseDate(dateText),
      endDate: null,
      venueName: location ?? "Marquette University",
      venueAddress: null,
      venueCity: "Milwaukee, WI",
      category: guessCategory(title + " " + (description ?? "")),
      sourceUrl: fullUrl,
      sourceName: "Marquette University",
      isFree: false,
      isOnCampus: true,
    });
  });

  return events.slice(0, 30);
}

// ─── OnMilwaukee Weekend Preview ─────────────────────────────────────────────
export async function scrapeOnMilwaukee(): Promise<ScrapedEvent[]> {
  const url = "https://onmilwaukee.com/articles/weekend-preview";
  const html = await fetchHtml(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  // OnMilwaukee uses article cards
  $("article, .article-item, .story-item, .card").each((_, el) => {
    const title = $(el).find("h2, h3, h4, .title, a").first().text().trim();
    if (!title || title.length < 5 || title.length > 150) return;

    const description = $(el).find("p, .summary, .excerpt").first().text().trim().slice(0, 300) || null;
    const link = $(el).find("a").first().attr("href");
    const fullUrl = link ? (link.startsWith("http") ? link : `https://onmilwaukee.com${link}`) : url;
    const dateText = $(el).find("time, .date, .published").first().attr("datetime") || $(el).find("time, .date").first().text().trim();

    events.push({
      title,
      description,
      eventDate: parseDate(dateText),
      endDate: null,
      venueName: null,
      venueAddress: null,
      venueCity: "Milwaukee, WI",
      category: guessCategory(title + " " + (description ?? "")),
      sourceUrl: fullUrl,
      sourceName: "OnMilwaukee",
      isFree: false,
      isOnCampus: false,
    });
  });

  return events.slice(0, 20);
}

// ─── Master scrape function ───────────────────────────────────────────────────
export async function scrapeAllMilwaukeeEvents(): Promise<ScrapedEvent[]> {
  const results = await Promise.allSettled([
    scrapeMilwaukeeLibrary(),
    scrapeWaukeshaLibrary(),
    scrapeUWMilwaukee(),
    scrapeMarquette(),
    scrapeOnMilwaukee(),
  ]);

  const all: ScrapedEvent[] = [];
  const labels = ["Milwaukee Library", "Waukesha Library", "UWM", "Marquette", "OnMilwaukee"];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`[communityScraper] ${labels[i]}: ${r.value.length} events`);
      all.push(...r.value);
    } else {
      console.warn(`[communityScraper] ${labels[i]} failed: ${r.reason}`);
    }
  });

  // Deduplicate by normalized title
  const seen = new Set<string>();
  return all.filter(e => {
    const key = e.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
