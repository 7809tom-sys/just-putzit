import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { nameMatchesChainDenylist, classifyVenue } from "../shared/localDiscovery/chains";
import { cityAreaKey, primaryAreaKey, zipAreaKey } from "../shared/localDiscovery/model";
import { parseIcsFeed, parseJsonLd, parseRssFeed } from "../shared/localDiscovery/parse";
import { discoverLocalEvents, type DiscoveryFetch } from "../shared/localDiscovery/pipeline";
import { allowsDiscoveredEvent, buildSallyPlanBrief, dedupeEvents, rankDiscoveredEvents } from "../shared/localDiscovery/rank";
import { eventbriteSearchUrl, FACEBOOK_EVENTS_SOURCE, isAllowedByRobots, mapEventbriteEvents, mapTicketmasterEvents, ticketmasterSearchUrl } from "../shared/localDiscovery/sources";
import { getHappeningNearYou } from "./localDiscovery/service";
import type { CachedArea } from "./localDiscovery/store";
import type { CuratedFeed, NormalizedEvent, VenueOverride } from "../shared/localDiscovery/model";

const NOW = new Date("2026-10-28T18:00:00.000Z");

const LIBRARY_ICS = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:storytime-1
SUMMARY:Family Storytime
DTSTART:20261103T150000Z
DTEND:20261103T160000Z
LOCATION:East Branch Library, 123 Main St, Milwaukee, WI
DESCRIPTION:Free storytime for kids and families.
URL:https://library.example/storytime
END:VEVENT
BEGIN:VEVENT
UID:past-1
SUMMARY:Past Lecture
DTSTART:20261001T150000Z
END:VEVENT
BEGIN:VEVENT
UID:later-1
SUMMARY:Winter Gala
DTSTART:20261220T150000Z
END:VEVENT
END:VCALENDAR`;

const CHURCH_HTML = `<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"SocialEvent","name":"Community Potluck","startDate":"2026-11-06T23:00:00Z","isAccessibleForFree":true,"description":"A free supper for neighbors.","location":{"@type":"Place","name":"Grace Chapel","address":{"streetAddress":"10 Church St","addressLocality":"Milwaukee","addressRegion":"WI"}},"url":"https://grace.example/potluck"}
</script>
</head><body><a href="https://facebook.com/events/123">Facebook</a></body></html>`;

const YMCA_HTML = `<script type="application/ld+json">
{"@type":"SportsEvent","name":"Saturday Yoga","startDate":"2026-11-07T15:00:00Z","description":"All-levels yoga workout. Free for members and neighbors.","location":{"@type":"Place","name":"River YMCA","address":{"addressLocality":"Milwaukee","addressRegion":"WI"}},"url":"https://ymca.example/yoga"}
</script>`;

const COFFEE_HTML = `<link rel="alternate" type="application/rss+xml" href="/events.rss" />`;
const COFFEE_RSS = `<?xml version="1.0"?><rss><channel><item>
<title>Open Mic Night</title>
<description>An evening at the neighborhood coffee shop.</description>
<startDate>2026-11-04T23:00:00Z</startDate>
<link>https://cornercup.example/mic</link>
<location>Corner Cup</location>
</item></channel></rss>`;

const PAPER_RSS = `<?xml version="1.0"?><rss><channel><item>
<title>Farmers Market on November 8, 2026</title>
<description>Free outdoor market downtown.</description>
<link>https://paper.example/market</link>
</item></channel></rss>`;

function place(partial: Record<string, unknown>) {
  return { type: "node", id: partial.id, lat: 43.04, lon: -87.9, tags: partial.tags };
}

const OVERPASS = {
  elements: [
    place({ id: 1, tags: { name: "East Branch Library", amenity: "library", website: "https://library.example/", "addr:city": "Milwaukee" } }),
    place({ id: 2, tags: { name: "Grace Chapel", amenity: "place_of_worship", website: "https://grace.example/", "addr:city": "Milwaukee" } }),
    place({ id: 3, tags: { name: "River YMCA", amenity: "community_centre", office: "ngo", website: "https://ymca.example/", "addr:city": "Milwaukee" } }),
    place({ id: 4, tags: { name: "Corner Cup", amenity: "cafe", website: "https://cornercup.example/", "addr:city": "Milwaukee" } }),
    place({ id: 5, tags: { name: "Starbucks", amenity: "cafe", brand: "Starbucks", "brand:wikidata": "Q37158", website: "https://starbucks.example/events", "addr:city": "Milwaukee" } }),
    place({ id: 6, tags: { name: "Applebee's Grill + Bar", amenity: "restaurant", website: "https://applebees.example/events", "addr:city": "Milwaukee" } }),
    place({ id: 7, tags: { name: "City Paper", office: "newspaper", website: "https://paper.example/", "addr:city": "Milwaukee" } }),
  ],
};

function fixtureFetch(pages: Record<string, { status?: number; body: string }>): { fetch: DiscoveryFetch; urls: string[] } {
  const urls: string[] = [];
  const fetch: DiscoveryFetch = async (url) => {
    urls.push(url);
    const parsed = new URL(url);
    if (parsed.pathname === "/robots.txt") {
      if (parsed.hostname === "paper.example") return { ok: true, status: 200, text: "User-agent: *\nDisallow: /\n" };
      return { ok: true, status: 200, text: "User-agent: *\nDisallow:\n" };
    }
    if (parsed.hostname === "overpass-api.de") return { ok: true, status: 200, text: JSON.stringify(OVERPASS) };
    const body = pages[url] ?? pages[`${parsed.origin}${parsed.pathname}`] ?? (parsed.pathname === "/" ? pages[parsed.origin] : undefined);
    if (!body) return { ok: false, status: 404, text: "" };
    return { ok: (body.status ?? 200) < 400, status: body.status ?? 200, text: body.body };
  };
  return { fetch, urls };
}

const PAGES = {
  "https://library.example": { body: `<a href="/events.ics">Subscribe</a>` },
  "https://library.example/events.ics": { body: LIBRARY_ICS },
  "https://grace.example": { body: CHURCH_HTML },
  "https://ymca.example": { body: YMCA_HTML },
  "https://cornercup.example": { body: COFFEE_HTML },
  "https://cornercup.example/events.rss": { body: COFFEE_RSS },
};

describe("local event discovery adapters", () => {
  it("parses an iCal library feed, a newspaper RSS item, and schema.org JSON-LD", () => {
    const library = parseIcsFeed(LIBRARY_ICS, { source: "library", sourceLabel: "Library", organizerKind: "library", city: "Milwaukee" });
    expect(library.map((event) => event.title)).toEqual(["Family Storytime", "Past Lecture", "Winter Gala"]);
    expect(library[0]).toMatchObject({ isFree: true, familyFriendly: true, url: "https://library.example/storytime" });

    const paper = parseRssFeed(PAPER_RSS, { source: "newspaper", sourceLabel: "City Paper", organizerKind: "newspaper", city: "Milwaukee" }, NOW);
    expect(paper).toHaveLength(1);
    expect(paper[0].title).toContain("Farmers Market");
    expect(paper[0].isFree).toBe(true);

    const church = parseJsonLd(CHURCH_HTML, { source: "church", sourceLabel: "Grace Chapel", organizerKind: "church" });
    expect(church[0]).toMatchObject({ title: "Community Potluck", isFree: true, venueName: "Grace Chapel", city: "Milwaukee" });
  });

  it("keeps Facebook as a documented placeholder and never requests it", async () => {
    expect(FACEBOOK_EVENTS_SOURCE).toMatchObject({ id: "facebook_events", state: "unavailable", eventCount: 0 });
    expect(FACEBOOK_EVENTS_SOURCE.detail).toMatch(/does not scrape Facebook/i);
    const { fetch, urls } = fixtureFetch(PAGES);
    const result = await discoverLocalEvents({
      lat: 43.04,
      lng: -87.9,
      radiusMiles: 25,
      city: "Milwaukee",
      state: "WI",
      ticketmasterApiKey: "",
      eventbriteToken: "",
    }, { fetch, now: NOW, minHostIntervalMs: 0, sleep: async () => {}, deadlineMs: 20_000 });
    expect(result.sources.find((source) => source.id === "facebook_events")?.state).toBe("unavailable");
    expect(urls.some((url) => /facebook\.com|fb\.com/.test(url))).toBe(false);
    expect(urls.some((url) => url.includes("starbucks.example") || url.includes("applebees.example"))).toBe(false);
    expect(urls.some((url) => url === "https://paper.example/" || url === "https://paper.example")).toBe(false);
    expect(urls.some((url) => url.endsWith("paper.example/robots.txt"))).toBe(true);
  });

  it("discovers library, church, nonprofit, and independent events and drops chains", async () => {
    const { fetch } = fixtureFetch(PAGES);
    const result = await discoverLocalEvents({
      lat: 43.04,
      lng: -87.9,
      radiusMiles: 25,
      city: "Milwaukee",
      state: "WI",
      curatedFeeds: [{ areaKey: "zip:53202", url: "https://news.example/feed.xml", feedKind: "rss", label: "City Paper", organizerKind: "newspaper" }],
      ticketmasterApiKey: "",
      eventbriteToken: "",
    }, {
      fetch: async (url, init) => {
        if (url.includes("news.example/feed.xml")) return { ok: true, status: 200, text: PAPER_RSS };
        return fetch(url, init);
      },
      now: NOW,
      minHostIntervalMs: 0,
      sleep: async () => {},
      deadlineMs: 20_000,
    });
    const titles = result.events.map((event) => event.title).sort();
    expect(titles).toEqual(["Community Potluck", "Family Storytime", "Farmers Market on November 8, 2026", "Open Mic Night", "Saturday Yoga"]);
    expect(result.events.find((event) => event.title === "Family Storytime")?.organizerKind).toBe("library");
    expect(result.events.find((event) => event.title === "Saturday Yoga")?.organizerKind).toBe("nonprofit");
    expect(result.events.find((event) => event.title === "Open Mic Night")?.venueOwnership).toBe("independent");
    expect(result.sources.find((source) => source.id === "ticketmaster")?.state).toBe("skipped");
    expect(result.sources.find((source) => source.id === "eventbrite")?.state).toBe("skipped");
  });

  it("uses Ticketmaster only with a key and dedupes the same event from a feed", () => {
    const ticketmaster = mapTicketmasterEvents({
      _embedded: {
        events: [{
          id: "tm1",
          name: "Family Storytime",
          url: "https://ticketmaster.example/story",
          dates: { start: { dateTime: "2026-11-03T15:00:00Z" } },
          priceRanges: [{ min: 0 }],
          _embedded: { venues: [{ name: "East Branch Library", city: { name: "Milwaukee" }, state: { stateCode: "WI" }, location: { latitude: "43.04", longitude: "-87.90" } }] },
        }],
      },
    });
    const library = parseIcsFeed(LIBRARY_ICS, { source: "library", sourceLabel: "Library", organizerKind: "library", city: "Milwaukee", venueName: "East Branch Library" })
      .filter((event) => event.title === "Family Storytime");
    const deduped = dedupeEvents([...ticketmaster, ...library]);
    expect(deduped.filter((event) => event.title === "Family Storytime")).toHaveLength(1);
    expect(deduped[0].organizerKind).toBe("library");
    expect(ticketmasterSearchUrl("secret", 43, -87, 15, NOW, new Date("2026-11-11T18:00:00Z"))).toContain("latlong=43%2C-87");
    expect(ticketmasterSearchUrl("secret", 43, -87, 15, NOW, new Date("2026-11-11T18:00:00Z"))).not.toContain("secret-logged");
  });

  it("skips Eventbrite without a token and records a restricted search response", () => {
    expect(eventbriteSearchUrl("token", 43, -88, 15)).toContain("location.within=15mi");
    const events = mapEventbriteEvents({
      events: [{ id: "eb1", name: { text: "Jazz in the Park" }, url: "https://eventbrite.example/jazz", start: { utc: "2026-11-05T00:00:00Z" }, is_free: true, venue: { name: "Cathedral Square", address: { city: "Milwaukee", region: "WI" } } }],
    });
    expect(events[0]).toMatchObject({ title: "Jazz in the Park", isFree: true, source: "eventbrite" });
  });
});

describe("chain policy, ranking, and cache", () => {
  it("treats OSM brand tags and the denylist as chains, with an admin override", () => {
    expect(nameMatchesChainDenylist("Applebee's Grill + Bar")).toBe(true);
    expect(nameMatchesChainDenylist("The Local Apple")).toBe(false);
    expect(classifyVenue({ name: "Starbucks", brand: "Starbucks", brandWikidata: "Q37158", organizerKind: "business" })).toBe("chain");
    expect(classifyVenue({ name: "Corner Cup", organizerKind: "business" })).toBe("independent");
    expect(classifyVenue({ name: "River YMCA", organizerKind: "nonprofit" })).toBe("nonprofit");
    expect(classifyVenue({
      name: "Applebee's",
      organizerKind: "business",
      city: "Milwaukee",
      overrides: [{ venueKey: "applebees|milwaukee", displayName: "Applebee's", classification: "local" }],
    })).toBe("independent");
    expect(classifyVenue({
      name: "Corner Cup",
      organizerKind: "business",
      city: "Milwaukee",
      overrides: [{ venueKey: "corner cup|milwaukee", displayName: "Corner Cup", classification: "chain" }],
    })).toBe("chain");
  });

  it("drops chain and sponsored events unless the policy flag says otherwise", () => {
    const chain = event({ title: "Trivia", organizerKind: "business", venueOwnership: "chain", venueName: "Applebee's" });
    const local = event({ title: "Open Mic", organizerKind: "business", venueOwnership: "independent", venueName: "Corner Cup" });
    const sponsored = event({ title: "Paid Jazz", organizerKind: "business", venueOwnership: "independent", isSponsored: true });
    expect(allowsDiscoveredEvent(chain, { featureIndependentOnly: true, sponsoredPlacement: false })).toBe(false);
    expect(allowsDiscoveredEvent(local, { featureIndependentOnly: true, sponsoredPlacement: false })).toBe(true);
    expect(allowsDiscoveredEvent(sponsored, { featureIndependentOnly: true, sponsoredPlacement: false })).toBe(false);
    expect(allowsDiscoveredEvent(sponsored, { featureIndependentOnly: true, sponsoredPlacement: true })).toBe(true);
    expect(allowsDiscoveredEvent(chain, { featureIndependentOnly: false, sponsoredPlacement: false })).toBe(true);
  });

  it("ranks by distance, time, and match type inside a two-week window", () => {
    const yoga = event({
      title: "Saturday Yoga",
      category: "sports",
      organizerKind: "nonprofit",
      start: new Date("2026-11-07T15:00:00Z"),
      lat: 43.05,
      lng: -87.9,
      description: "A workout for neighbors",
    });
    const jazz = event({
      title: "Jazz Night",
      category: "live_music",
      organizerKind: "business",
      venueOwnership: "independent",
      start: new Date("2026-11-04T23:00:00Z"),
      lat: 43.041,
      lng: -87.9,
    });
    const farFuture = event({ title: "Winter Gala", start: new Date("2026-12-20T18:00:00Z"), lat: 43.04, lng: -87.9 });
    const gym = rankDiscoveredEvents([jazz, yoga, farFuture], { lat: 43.04, lng: -87.9, radiusMiles: 15, matchType: "gym_buddy", interests: ["yoga"], now: NOW });
    const date = rankDiscoveredEvents([jazz, yoga, farFuture], { lat: 43.04, lng: -87.9, radiusMiles: 15, matchType: "date", interests: ["jazz"], now: NOW });
    expect(gym.map((item) => item.title)).toEqual(["Saturday Yoga", "Jazz Night"]);
    expect(date[0].title).toBe("Jazz Night");
    expect(date.some((item) => item.title === "Winter Gala")).toBe(false);
  });

  it("caches an area and does not fetch again until the cache is stale", async () => {
    const { fetch, urls } = fixtureFetch(PAGES);
    let stored: CachedArea | null = null;
    const feeds: CuratedFeed[] = [{ areaKey: "zip:53202", url: "https://news.example/feed.xml", feedKind: "rss", label: "City Paper", organizerKind: "newspaper" }];
    const overrides: VenueOverride[] = [];
    const deps = {
      fetch: async (url: string, init?: Parameters<DiscoveryFetch>[1]) => {
        if (url.includes("news.example/feed.xml")) return { ok: true, status: 200, text: PAPER_RSS };
        return fetch(url, init);
      },
      now: NOW,
      minHostIntervalMs: 0,
      sleep: async () => {},
      deadlineMs: 20_000,
      ticketmasterApiKey: "" as string | null,
      eventbriteToken: "" as string | null,
      readCache: async () => stored,
      writeCache: async (area: CachedArea) => { stored = area; },
      loadFeeds: async () => feeds,
      loadOverrides: async () => overrides,
    };
    const first = await getHappeningNearYou({ city: "Milwaukee", state: "WI", postalCode: "53202", lat: 43.04, lng: -87.9, radiusMiles: 15, matchType: "friends" }, deps);
    const callsAfterFirst = urls.length;
    const second = await getHappeningNearYou({ city: "Milwaukee", state: "WI", postalCode: "53202", lat: 43.04, lng: -87.9, radiusMiles: 15, matchType: "friends" }, deps);
    expect(first.areaKey).toBe("zip:53202");
    expect(first.events.map((event) => event.title)).toContain("Family Storytime");
    expect(second.cached).toBe(true);
    expect(second.stale).toBe(false);
    expect(urls.length).toBe(callsAfterFirst);
    expect(buildSallyPlanBrief(first.events.map((event) => ({ ...event, start: new Date(event.start) })))).toMatch(/Family Storytime/);
    expect(buildSallyPlanBrief(first.events.map((event) => ({ ...event, start: new Date(event.start) })))).toMatch(/Do not invent/);
  });

  it("builds area keys and respects robots.txt", () => {
    expect(zipAreaKey("53202-1234")).toBe("zip:53202");
    expect(cityAreaKey("Milwaukee", "WI")).toBe("city:milwaukee|wi");
    expect(primaryAreaKey({ postalCode: "53202", city: "Milwaukee", state: "WI" })).toBe("zip:53202");
    expect(isAllowedByRobots("User-agent: *\nDisallow: /private\n", "https://library.example/private/feed.ics")).toBe(false);
    expect(isAllowedByRobots("User-agent: *\nDisallow: /private\n", "https://library.example/events.ics")).toBe(true);
    expect(readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8")).toContain("HappeningNearYou");
    expect(readFileSync(resolve(__dirname, "../client/src/components/HappeningNearYou.tsx"), "utf8")).toContain("Happening near you");
  });
});

function event(partial: Partial<NormalizedEvent> & Pick<NormalizedEvent, "title">): NormalizedEvent {
  return {
    externalId: partial.externalId ?? partial.title,
    description: partial.description,
    start: partial.start ?? new Date("2026-11-04T18:00:00Z"),
    end: partial.end ?? null,
    venueName: partial.venueName,
    city: partial.city ?? "Milwaukee",
    state: partial.state ?? "WI",
    lat: partial.lat ?? 43.04,
    lng: partial.lng ?? -87.9,
    category: partial.category ?? "community",
    source: partial.source ?? "test",
    sourceLabel: partial.sourceLabel ?? "Test",
    url: partial.url,
    priceCents: partial.priceCents ?? null,
    isFree: partial.isFree ?? false,
    familyFriendly: partial.familyFriendly ?? false,
    organizerKind: partial.organizerKind ?? "other",
    venueOwnership: partial.venueOwnership ?? "unknown",
    isSponsored: partial.isSponsored ?? false,
    title: partial.title,
  };
}
