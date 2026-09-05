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

export interface ScrapeSourceOutcome {
  sourceKey: string;
  sourceLabel: string;
  city: string;
  status: "healthy" | "empty" | "failed";
  eventsFound: number;
  errorMessage?: string;
}

interface NamedSourceScraper {
  sourceKey: string;
  sourceLabel: string;
  city: string;
  run: () => Promise<ScrapedEvent[]>;
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

/** Parse public calendar dates that omit their year, such as "Aug 15 · 7:30 PM". */
export function parseCommunityCalendarDate(raw: string, referenceDate = new Date()): Date | null {
  const cleaned = raw.replace(/[–—]/g, " ").replace(/\s+/g, " ").trim();
  const match = cleaned.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:[^\d]{0,25}(\d{1,2})(?::(\d{2}))?\s*(am|pm))?/i);
  if (!match) return null;
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months.indexOf(match[1].slice(0, 3).toLowerCase());
  const day = Number(match[2]);
  if (month < 0 || day < 1 || day > 31) return null;
  let year = match[3] ? Number(match[3]) : referenceDate.getFullYear();
  let hour = match[4] ? Number(match[4]) : 12;
  const minute = match[5] ? Number(match[5]) : 0;
  const meridiem = match[6]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  let result = new Date(year, month, day, hour, minute, 0, 0);
  if (!match[3] && result.getTime() < referenceDate.getTime() - 36 * 60 * 60 * 1000) {
    year += 1;
    result = new Date(year, month, day, hour, minute, 0, 0);
  }
  return Number.isNaN(result.getTime()) ? null : result;
}

function futureEvents(events: ScrapedEvent[], limit = 40) {
  const now = Date.now() - 6 * 60 * 60 * 1000;
  return events.filter((event) => event.eventDate && event.eventDate.getTime() >= now).slice(0, limit);
}

function dedupeScrapedEvents(events: ScrapedEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.sourceName}|${event.title.toLowerCase().replace(/\s+/g, " ").trim()}|${event.eventDate?.toISOString() ?? ""}|${event.venueAddress ?? event.venueName ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function parseWaukeshaCountyParksLocation(locationText: string) {
  const cityMatch = locationText.match(/,\s*([A-Za-z .'-]+),?\s+WI(?:\s+\d{5})?\)?/i);
  const venueCity = cityMatch?.[1]?.trim() ? `${cityMatch[1].trim()}, WI` : "Waukesha, WI";
  const addressMatch = locationText.match(/\(([^()]*\bWI(?:\s+\d{5})?[^()]*)\)/i);
  const venueName = locationText.split("(")[0]?.trim() || "Waukesha County Parks";
  return { venueCity, venueAddress: addressMatch?.[1]?.trim() || null, venueName };
}

function parseWaukeshaCountyParksOccurrences(title: string, detailText: string, sourceUrl: string): ScrapedEvent[] {
  const entries = detailText.matchAll(/(?:\b(CANCELLED)\s+)?\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T(?:EMBER)?)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s+(\d{1,2}),\s+(\d{4})\s*•\s*(\d{1,2})(?::(\d{2}))?\s*(?:[–-]\s*\d{1,2}(?::\d{2})?\s*)?([ap])\.?m\.?\s*•\s*(.*?)(?=\s+(?:\bCANCELLED\s+)?\b(?:JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T(?:EMBER)?)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s+\d{1,2},\s+\d{4}\s*•|$)/gi);
  const events: ScrapedEvent[] = [];

  Array.from(entries).forEach((entry) => {
    const [, cancelled, month, day, year, hourText, minuteText, meridiem, locationText] = entry;
    if (cancelled) return;
    const monthIndex = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(month.slice(0, 3).toLowerCase());
    if (monthIndex < 0) return;
    let hour = Number(hourText);
    if (meridiem.toLowerCase() === "p" && hour < 12) hour += 12;
    if (meridiem.toLowerCase() === "a" && hour === 12) hour = 0;
    const eventDate = new Date(Number(year), monthIndex, Number(day), hour, Number(minuteText ?? 0), 0, 0);
    if (Number.isNaN(eventDate.getTime())) return;
    const location = parseWaukeshaCountyParksLocation(locationText.trim());
    events.push({
      title,
      description: detailText.slice(0, 1000) || null,
      eventDate,
      endDate: null,
      ...location,
      category: guessCategory(`${title} ${detailText}`),
      sourceUrl,
      sourceName: "Waukesha County Parks",
      isFree: /\bfree\b|no charge|admission free/i.test(detailText),
      isOnCampus: false,
    });
  });
  return events;
}

export function parseWaukeshaCountyParksEvents(html: string, now = new Date()): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $("li.gs-feed-list-item").each((_, element) => {
    const titleLink = $(element).find("a.gs-feed-list-title").first();
    const title = titleLink.text().replace(/\s+/g, " ").trim();
    const eventDate = parseDate($(element).find(".gs-feed-list-date").first().text());
    if (!title || !eventDate) return;

    const sourceUrl = titleLink.attr("href")?.trim();
    if (!sourceUrl?.startsWith("https://events.waukeshacounty.gov/default/detail/")) return;

    const detailText = $(element).find(".gs-feed-list-description").text().replace(/\s+/g, " ").trim();
    if (/DATES\/TIMES\/LOCATIONS\s*:/i.test(detailText)) {
      events.push(...parseWaukeshaCountyParksOccurrences(title, detailText, sourceUrl));
      return;
    }
    const locationMatch = detailText.match(/LOCATION\s*:\s*([\s\S]{1,300}?)(?=(?:COST|HOW TO PURCHASE TICKETS|DATES\/TIMES|REGISTRATION|QUESTIONS|NOTE)\s*:|$)/i);
    const locationText = locationMatch?.[1]?.trim() ?? "";
    const location = parseWaukeshaCountyParksLocation(locationText);
    const detailDate = sourceUrl.match(/\/detail\/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})-/);
    const startAt = detailDate
      ? new Date(Number(detailDate[1]), Number(detailDate[2]) - 1, Number(detailDate[3]), Number(detailDate[4]), Number(detailDate[5]))
      : eventDate;
    const costMatch = detailText.match(/COST\s*:\s*([\s\S]{1,200}?)(?=(?:HOW TO PURCHASE TICKETS|DATES\/TIMES|REGISTRATION|QUESTIONS|NOTE)\s*:|$)/i);

    events.push({
      title,
      description: detailText.slice(0, 1000) || null,
      eventDate: startAt,
      endDate: null,
      ...location,
      category: guessCategory(`${title} ${detailText}`),
      sourceUrl,
      sourceName: "Waukesha County Parks",
      isFree: /\bfree\b|no charge|admission free/i.test(costMatch?.[1] ?? ""),
      isOnCampus: false,
    });
  });

  return futureEvents(dedupeScrapedEvents(events), 75)
    .filter((event) => event.eventDate && event.eventDate.getTime() >= now.getTime() - 6 * 60 * 60 * 1000);
}

// ─── Waukesha County Parks ──────────────────────────────────────────────────
export async function scrapeWaukeshaCountyParks(): Promise<ScrapedEvent[]> {
  const url = "https://www.waukeshacounty.gov/parks-and-land-use/parks-and-land-use-events/";
  const html = await fetchHtml(url);
  return html ? parseWaukeshaCountyParksEvents(html) : [];
}

export function parseBrookfieldLibraryCalendarEvents(html: string, now = new Date()): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const url = "https://www.ci.brookfield.wi.us/calendar.aspx?view=list&CID=29";
  const events: ScrapedEvent[] = [];

  $("#CID29 > ol > li").each((_, element) => {
    const title = $(element).find("h3").first().text().replace(/\s+/g, " ").trim();
    if (!title || /\bclosed\b/i.test(title)) return;

    const dateText = $(element).find(".subHeader .date").first().text().replace(/\s+/g, " ").trim();
    const eventDate = parseDate(dateText.split(/\s+[–—-]\s+/)[0]?.trim());
    if (!eventDate) return;

    const location = $(element).find(".eventLocation .name").first().text().replace(/\s+/g, " ").trim();
    const description = $(element).find(".icalDescription").first().text().replace(/\s+/g, " ").trim();
    events.push({
      title,
      description: description || null,
      eventDate,
      endDate: null,
      venueName: "Brookfield Public Library",
      venueAddress: location || "1900 N. Calhoun Rd, Brookfield, WI 53005",
      venueCity: "Brookfield, WI",
      category: guessCategory(`${title} ${description}`),
      sourceUrl: url,
      sourceName: "Brookfield Public Library",
      isFree: true,
      isOnCampus: false,
    });
  });

  return futureEvents(dedupeScrapedEvents(events), 75)
    .filter((event) => event.eventDate && event.eventDate.getTime() >= now.getTime() - 6 * 60 * 60 * 1000);
}

// ─── Brookfield Public Library ──────────────────────────────────────────────
export async function scrapeBrookfieldLibrary(): Promise<ScrapedEvent[]> {
  const url = "https://www.ci.brookfield.wi.us/calendar.aspx?view=list&CID=29";
  const html = await fetchHtml(url);
  return html ? parseBrookfieldLibraryCalendarEvents(html) : [];
}

/** Guess a category from title/description keywords */
function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (/karaoke/i.test(t)) return "karaoke";
  if (/comedy|comic|improv|stand-?up/i.test(t)) return "comedy";
  if (/live music|live band|\bband\b|open mic|jazz|acoustic|concert/i.test(t)) return "live_music";
  if (/skate|ice rink|ice arena/i.test(t)) return "sports";
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

// ─── Club 400, Waukesha ──────────────────────────────────────────────────────

export function parseClub400EntertainmentEvents(html: string, referenceDate = new Date()): ScrapedEvent[] {
  const url = "https://www.clubwaukesha.com/events";
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  $("h1, h2, h3").each((_, el) => {
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!/karaoke|open mic|live music|live band|comedy/i.test(title)) return;
    const card = $(el).closest("article, .event, li, section");
    const nearby = [card.text(), $(el).parent().text(), $(el).next().text()].join(" ").replace(/\s+/g, " ").trim();
    const eventDate = parseCommunityCalendarDate(nearby, referenceDate);
    if (!eventDate) return;
    const link = card.find("a[href]").first().attr("href") ?? $(el).find("a[href]").first().attr("href");
    events.push({
      title,
      description: nearby.replace(title, "").slice(0, 500).trim() || null,
      eventDate,
      endDate: null,
      venueName: "Club 400",
      venueAddress: "322 Williams St, Waukesha, WI 53186",
      venueCity: "Waukesha, WI",
      category: guessCategory(`${title} ${nearby}`),
      sourceUrl: link ? (link.startsWith("http") ? link : new URL(link, url).toString()) : url,
      sourceName: "Club 400",
      isFree: /free|no cover/i.test(nearby),
      isOnCampus: false,
    });
  });
  return futureEvents(dedupeScrapedEvents(events), 30).filter((event) => event.eventDate && event.eventDate.getTime() >= referenceDate.getTime() - 6 * 60 * 60 * 1000);
}

export async function scrapeClub400Entertainment(): Promise<ScrapedEvent[]> {
  const html = await fetchHtml("https://www.clubwaukesha.com/events");
  return html ? parseClub400EntertainmentEvents(html) : [];
}

// ─── Milwaukee Comedy ────────────────────────────────────────────────────────

export function parseMilwaukeeComedyEvents(html: string, referenceDate = new Date()): ScrapedEvent[] {
  const url = "https://www.milwaukeecomedy.com/";
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  $("a[href]").each((_, el) => {
    const title = $(el).text().replace(/\s+/g, " ").trim();
    const href = $(el).attr("href") ?? "";
    if (!title || title.length > 180 || !/comedy|laugh/i.test(title) || !/(ticket|laughingtap|milwaukeecomedy)/i.test(href)) return;
    const eventDate = parseCommunityCalendarDate(title, referenceDate);
    if (!eventDate) return;
    events.push({
      title,
      description: "Official Milwaukee Comedy ticket and show information.",
      eventDate,
      endDate: null,
      venueName: "Milwaukee Comedy",
      venueAddress: null,
      venueCity: "Milwaukee, WI",
      category: "comedy",
      sourceUrl: href.startsWith("http") ? href : new URL(href, url).toString(),
      sourceName: "Milwaukee Comedy",
      isFree: false,
      isOnCampus: false,
    });
  });
  return futureEvents(dedupeScrapedEvents(events), 30).filter((event) => event.eventDate && event.eventDate.getTime() >= referenceDate.getTime() - 6 * 60 * 60 * 1000);
}

export async function scrapeMilwaukeeComedy(): Promise<ScrapedEvent[]> {
  const html = await fetchHtml("https://www.milwaukeecomedy.com/");
  return html ? parseMilwaukeeComedyEvents(html) : [];
}

// ─── The Laughing Tap, Milwaukee ─────────────────────────────────────────────

export function parseLaughingTapComedyEvents(html: string, referenceDate = new Date()): ScrapedEvent[] {
  const url = "https://laughingtap.com/";
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  const addEvent = (title: string, href: string) => {
    if (!title || title.length > 180 || !/etix\.com\/ticket\/(?:e|p)\//i.test(href)) return;
    const eventDate = parseCommunityCalendarDate(title, referenceDate);
    if (!eventDate) return;
    events.push({
      title,
      description: "Official live comedy listing. Most shows are 18+ unless otherwise stated; confirm details with the venue.",
      eventDate,
      endDate: null,
      venueName: "The Laughing Tap Comedy Club",
      venueAddress: "761 N. Jefferson St, Milwaukee, WI 53202",
      venueCity: "Milwaukee, WI",
      category: "comedy",
      sourceUrl: href,
      sourceName: "The Laughing Tap",
      isFree: false,
      isOnCampus: false,
    });
  };
  $("a[href]").each((_, el) => {
    addEvent($(el).text().replace(/\s+/g, " ").trim(), $(el).attr("href") ?? "");
  });
  $("a[href] img[alt]").each((_, el) => {
    addEvent($(el).attr("alt")?.replace(/\s+/g, " ").trim() ?? "", $(el).closest("a[href]").attr("href") ?? "");
  });
  return futureEvents(dedupeScrapedEvents(events), 45).filter((event) => event.eventDate && event.eventDate.getTime() >= referenceDate.getTime() - 6 * 60 * 60 * 1000);
}

export async function scrapeLaughingTapComedy(): Promise<ScrapedEvent[]> {
  const html = await fetchHtml("https://laughingtap.com/");
  return html ? parseLaughingTapComedyEvents(html) : [];
}

// ─── Milwaukee Improv, Brookfield ────────────────────────────────────────────

export function parseMilwaukeeImprovEvents(html: string, referenceDate = new Date()): ScrapedEvent[] {
  const url = "https://improv.com/milwaukee/calendar/";
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  $(".cal-list a.item[href]").each((_, el) => {
    const month = $(el).find(".dates dt").first().text().trim();
    const day = $(el).find(".dates dd").first().clone().children().remove().end().text().trim();
    const title = $(el).find("h3").first().text().replace(/\s+/g, " ").trim();
    const href = $(el).attr("href") ?? "";
    const eventDate = parseCommunityCalendarDate(`${month} ${day}`, referenceDate);
    if (!title || !eventDate || !href) return;
    events.push({
      title,
      description: "Official Milwaukee Improv show listing. Unless otherwise specified, guests must be at least 21; confirm show details and venue policies before booking.",
      eventDate,
      endDate: null,
      venueName: "Milwaukee Improv",
      venueAddress: "20110 Lower Union Street, Brookfield, WI",
      venueCity: "Brookfield, WI",
      category: "comedy",
      sourceUrl: new URL(href, url).toString(),
      sourceName: "Milwaukee Improv",
      isFree: /two cents tuesday/i.test(title),
      isOnCampus: false,
    });
  });
  return futureEvents(dedupeScrapedEvents(events), 60).filter((event) => event.eventDate && event.eventDate.getTime() >= referenceDate.getTime() - 6 * 60 * 60 * 1000);
}

export async function scrapeMilwaukeeImprov(): Promise<ScrapedEvent[]> {
  const html = await fetchHtml("https://improv.com/milwaukee/calendar/");
  return html ? parseMilwaukeeImprovEvents(html) : [];
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

// ─── Madison official public calendars ───────────────────────────────────────

function addMadisonHeadingEvents($: cheerio.CheerioAPI, options: {
  selector: string;
  sourceUrl: string;
  sourceName: string;
  venueName: string;
  venueAddress?: string;
  categoryText?: string;
  isFree: boolean;
  isOnCampus?: boolean;
  excludedTitles?: string[];
}) {
  const events: ScrapedEvent[] = [];
  const excluded = new Set((options.excludedTitles ?? []).map((title) => title.toLowerCase()));
  $(options.selector).each((_, el) => {
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (title.length < 3 || title.length > 180 || excluded.has(title.toLowerCase()) || isDateOnlyHeading(title)) return;
    const card = $(el).closest("article, li, .event, .views-row, .card");
    const nearbyText = [card.text(), $(el).parent().text(), $(el).next().text(), $(el).next().next().text()].join(" ").replace(/\s+/g, " ").trim();
    const eventDate = parseCommunityCalendarDate(nearbyText);
    if (!eventDate) return;
    const link = card.find("a[href]").first().attr("href") ?? $(el).find("a[href]").first().attr("href");
    const sourceUrl = link ? (link.startsWith("http") ? link : new URL(link, options.sourceUrl).toString()) : options.sourceUrl;
    const description = nearbyText.replace(title, "").slice(0, 500).trim() || null;
    events.push({
      title,
      description,
      eventDate,
      endDate: null,
      venueName: options.venueName,
      venueAddress: options.venueAddress ?? null,
      venueCity: "Madison, WI",
      category: guessCategory(`${title} ${options.categoryText ?? ""} ${description ?? ""}`),
      sourceUrl,
      sourceName: options.sourceName,
      isFree: options.isFree,
      isOnCampus: options.isOnCampus ?? false,
    });
  });
  return futureEvents(dedupeScrapedEvents(events));
}

function isDateOnlyHeading(title: string) {
  return /^(?:(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:\s*\||\s|,|$)/i.test(title);
}

export async function scrapeMadisonLibrary(): Promise<ScrapedEvent[]> {
  const url = "https://www.madisonpubliclibrary.org/spaces/events";
  const html = await fetchHtml(url);
  if (!html) return [];
  return addMadisonHeadingEvents(cheerio.load(html), {
    selector: "h3, .event-title, .views-row h2",
    sourceUrl: url,
    sourceName: "Madison Public Library",
    venueName: "Madison Public Library",
    categoryText: "library books reading storytime author talk",
    isFree: true,
    excludedTitles: ["Events Calendar", "Find more events", "Around Madison", "Online"],
  });
}

export async function scrapeCityOfMadisonEvents(): Promise<ScrapedEvent[]> {
  const url = "https://www.cityofmadison.com/events";
  const html = await fetchHtml(url);
  if (!html) return [];
  return addMadisonHeadingEvents(cheerio.load(html), {
    selector: "article h2, article h3, .event h2, .event h3, main h2, main h3",
    sourceUrl: url,
    sourceName: "City of Madison",
    venueName: "City of Madison public event",
    categoryText: "park recreation community public event",
    isFree: true,
    excludedTitles: ["Events", "Annual & Special Events", "Search Events"],
  });
}

export async function scrapeOvertureCenter(): Promise<ScrapedEvent[]> {
  const url = "https://www.overture.org/";
  const html = await fetchHtml(url);
  if (!html) return [];
  return addMadisonHeadingEvents(cheerio.load(html), {
    selector: "article h2, article h3, .event h2, .event h3, .card h2, .card h3",
    sourceUrl: url,
    sourceName: "Overture Center",
    venueName: "Overture Center for the Arts",
    venueAddress: "201 State St, Madison, WI 53703",
    categoryText: "theater theatre performing arts music comedy dance",
    isFree: false,
    excludedTitles: ["Coming Up", "Overture’s 2025/26 Season", "Subscriptions available now"],
  });
}

export async function scrapeCityChurchMadison(): Promise<ScrapedEvent[]> {
  const url = "https://citychurchmadison.org/events";
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  $("h2, h3, .event-title").each((_, el) => {
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!title || title.length > 180 || isDateOnlyHeading(title) || ["events", "calendar", "for additional event registrations"].includes(title.toLowerCase())) return;
    const nearbyText = [$(el).next().text(), $(el).next().next().text(), $(el).next().next().next().text()].join(" ").replace(/\s+/g, " ").trim();
    const eventDate = parseCommunityCalendarDate(nearbyText);
    if (!eventDate) return;
    const link = $(el).nextAll("a[href]").first().attr("href");
    events.push({
      title,
      description: nearbyText.slice(0, 500) || null,
      eventDate,
      endDate: null,
      venueName: "City Church Madison",
      venueAddress: "4909 East Buckeye Road, Madison, WI 53716",
      venueCity: "Madison, WI",
      category: "church",
      sourceUrl: link ? (link.startsWith("http") ? link : new URL(link, url).toString()) : url,
      sourceName: "City Church Madison",
      isFree: true,
      isOnCampus: false,
    });
  });
  return futureEvents(dedupeScrapedEvents(events));
}

type UWMadisonCalendarEvent = {
  id: number | string;
  title?: string;
  description?: string;
  startDate?: string;
  startDateUnix?: number;
  endDateUnix?: number | null;
  cost?: string;
  url?: string;
  location?: string;
  latlon?: string;
  sponsor?: string;
  tags?: string[];
};

type UWMArtsCalendarEvent = {
  id: number | string;
  title?: string;
  description?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
  cost?: string;
  venue?: {
    venue?: string;
    address?: string;
    city?: string;
  };
};

function plainText(value: string | undefined) {
  if (!value) return "";
  return cheerio.load(value).text().replace(/\s+/g, " ").trim();
}

function parseApiDate(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseUWMArtsCalendarEvents(events: UWMArtsCalendarEvent[], now = new Date()): ScrapedEvent[] {
  const normalized = events.flatMap((event) => {
    const title = plainText(event.title);
    const eventDate = parseApiDate(event.start_date);
    if (!title || !eventDate) return [];
    const description = plainText(event.description).slice(0, 1000) || null;
    const cost = plainText(event.cost);
    const venue = event.venue;
    return [{
      title,
      description,
      eventDate,
      endDate: parseApiDate(event.end_date),
      venueName: venue?.venue?.trim() || "UW–Milwaukee Peck School of the Arts",
      venueAddress: venue?.address?.trim() || null,
      venueCity: venue?.city?.trim() ? `${venue.city.trim()}, WI` : "Milwaukee, WI",
      category: "arts",
      sourceUrl: event.url?.startsWith("http") ? event.url : "https://uwm.edu/arts/events/",
      sourceName: "UW–Milwaukee Peck School of the Arts",
      isFree: !cost || /free|no charge|\$0(?:\.00)?\b/i.test(cost),
      isOnCampus: true,
    } satisfies ScrapedEvent];
  });
  return dedupeScrapedEvents(normalized)
    .filter((event) => event.eventDate && event.eventDate.getTime() >= now.getTime() - 6 * 60 * 60 * 1000)
    .slice(0, 60);
}

// ─── UW–Milwaukee Peck School of the Arts ─────────────────────────────────────
export async function scrapeUWMArtsPerformingEvents(): Promise<ScrapedEvent[]> {
  const url = "https://uwm.edu/arts/wp-json/tribe/events/v1/events?per_page=60";
  try {
    const response = await axios.get<{ events?: UWMArtsCalendarEvent[] }>(url, {
      headers: { ...HEADERS, Accept: "application/json" },
      timeout: 15000,
      maxRedirects: 5,
    });
    return parseUWMArtsCalendarEvents(response.data.events ?? []);
  } catch (err: any) {
    console.warn(`[communityScraper] Failed to fetch ${url}: ${err.message}`);
    return [];
  }
}

export function isLocalMadisonCampusEvent(event: UWMadisonCalendarEvent) {
  const location = (event.location ?? "").toLowerCase();
  if (location.includes("online") || location.includes("virtual")) return false;
  const [lat, lng] = (event.latlon ?? "").split(",").map(Number);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return Math.abs(lat - 43.0731) < 0.28 && Math.abs(lng + 89.4012) < 0.32;
  return /(madison|university|arboretum|memorial union|campus)/i.test(event.location ?? "");
}

export async function scrapeUWMadisonEvents(): Promise<ScrapedEvent[]> {
  const url = "https://today.wisc.edu/events.json?limit=100";
  try {
    const response = await axios.get<UWMadisonCalendarEvent[]>(url, {
      headers: { ...HEADERS, Accept: "application/json" },
      timeout: 15000,
      maxRedirects: 5,
    });
    if (!Array.isArray(response.data)) return [];
    const events = response.data.flatMap((event) => {
      const eventDate = event.startDateUnix ? new Date(event.startDateUnix * 1000) : parseDate(event.startDate);
      if (!event.title || !eventDate || !isLocalMadisonCampusEvent(event)) return [];
      const detailsUrl = event.url?.startsWith("http") ? event.url : `https://today.wisc.edu/events/view/${event.id}`;
      const cost = (event.cost ?? "").trim();
      return [{
        title: event.title.trim(),
        description: event.description?.trim().slice(0, 1000) || null,
        eventDate,
        endDate: event.endDateUnix ? new Date(event.endDateUnix * 1000) : null,
        venueName: event.location?.trim() || "UW–Madison campus",
        venueAddress: null,
        venueCity: "Madison, WI",
        category: guessCategory(`${event.title} ${(event.tags ?? []).join(" ")} ${event.description ?? ""}`),
        sourceUrl: detailsUrl,
        sourceName: "UW–Madison Events Calendar",
        isFree: !cost || /free|no charge/i.test(cost),
        isOnCampus: true,
      } satisfies ScrapedEvent];
    });
    return futureEvents(dedupeScrapedEvents(events), 75);
  } catch (err: any) {
    console.warn(`[communityScraper] Failed to fetch ${url}: ${err.message}`);
    return [];
  }
}

// ─── Master scrape functions ──────────────────────────────────────────────────
async function runNamedSourceScrapers(sources: NamedSourceScraper[]) {
  const results = await Promise.allSettled(sources.map((source) => source.run()));
  const all: ScrapedEvent[] = [];
  const outcomes: ScrapeSourceOutcome[] = results.map((result, index) => {
    const source = sources[index];
    if (result.status === "fulfilled") {
      const eventsFound = result.value.length;
      console.log(`[communityScraper] ${source.sourceLabel}: ${eventsFound} events`);
      all.push(...result.value);
      return { sourceKey: source.sourceKey, sourceLabel: source.sourceLabel, city: source.city, status: eventsFound > 0 ? "healthy" : "empty", eventsFound };
    }
    const errorMessage = String(result.reason instanceof Error ? result.reason.message : result.reason).slice(0, 1000);
    console.warn(`[communityScraper] ${source.sourceLabel} failed: ${errorMessage}`);
    return { sourceKey: source.sourceKey, sourceLabel: source.sourceLabel, city: source.city, status: "failed", eventsFound: 0, errorMessage };
  });
  return { events: dedupeScrapedEvents(all), outcomes };
}

export async function scrapeAllMilwaukeeEventsWithHealth() {
  return runNamedSourceScrapers([
    { sourceKey: "milwaukee_library", sourceLabel: "Milwaukee Public Library", city: "Milwaukee", run: scrapeMilwaukeeLibrary },
    { sourceKey: "waukesha_library", sourceLabel: "Waukesha Public Library", city: "Waukesha", run: scrapeWaukeshaLibrary },
    { sourceKey: "waukesha_county_parks", sourceLabel: "Waukesha County Parks", city: "Waukesha County", run: scrapeWaukeshaCountyParks },
    { sourceKey: "brookfield_library", sourceLabel: "Brookfield Public Library", city: "Brookfield", run: scrapeBrookfieldLibrary },
    { sourceKey: "uwm", sourceLabel: "UW–Milwaukee", city: "Milwaukee", run: scrapeUWMilwaukee },
    { sourceKey: "uwm_arts", sourceLabel: "UW–Milwaukee Peck School of the Arts", city: "Milwaukee", run: scrapeUWMArtsPerformingEvents },
    { sourceKey: "marquette", sourceLabel: "Marquette University", city: "Milwaukee", run: scrapeMarquette },
    { sourceKey: "club_400", sourceLabel: "Club 400", city: "Waukesha", run: scrapeClub400Entertainment },
    { sourceKey: "milwaukee_comedy", sourceLabel: "Milwaukee Comedy", city: "Milwaukee", run: scrapeMilwaukeeComedy },
    { sourceKey: "laughing_tap", sourceLabel: "The Laughing Tap", city: "Milwaukee", run: scrapeLaughingTapComedy },
    { sourceKey: "milwaukee_improv", sourceLabel: "Milwaukee Improv", city: "Brookfield", run: scrapeMilwaukeeImprov },
    { sourceKey: "onmilwaukee", sourceLabel: "OnMilwaukee", city: "Milwaukee", run: scrapeOnMilwaukee },
  ]);
}

export async function scrapeAllMilwaukeeEvents(): Promise<ScrapedEvent[]> {
  return (await scrapeAllMilwaukeeEventsWithHealth()).events;
}

export async function scrapeAllMadisonEventsWithHealth() {
  return runNamedSourceScrapers([
    { sourceKey: "madison_library", sourceLabel: "Madison Public Library", city: "Madison", run: scrapeMadisonLibrary },
    { sourceKey: "city_madison", sourceLabel: "City of Madison", city: "Madison", run: scrapeCityOfMadisonEvents },
    { sourceKey: "overture", sourceLabel: "Overture Center", city: "Madison", run: scrapeOvertureCenter },
    { sourceKey: "city_church_madison", sourceLabel: "City Church Madison", city: "Madison", run: scrapeCityChurchMadison },
    { sourceKey: "uw_madison", sourceLabel: "UW–Madison", city: "Madison", run: scrapeUWMadisonEvents },
  ]);
}

export async function scrapeAllMadisonEvents(): Promise<ScrapedEvent[]> {
  return (await scrapeAllMadisonEventsWithHealth()).events;
}
