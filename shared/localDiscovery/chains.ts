import {
  isPublicOrganizer,
  normalizeName,
  type OrganizerKind,
  type VenueOverride,
  type VenueOwnership,
  venueKey,
} from "./model";

/**
 * Maintainable chain denylist. Matching is on the venue name after
 * punctuation is removed, as a whole phrase, so "Applebee's" matches and
 * "The Local Apple" does not. OSM `brand` / `brand:wikidata` are treated as
 * chain signals. Admin overrides win over both.
 */
export const CHAIN_NAME_DENYLIST = [
  "applebee's",
  "starbucks",
  "mcdonald's",
  "walmart",
  "target",
  "olive garden",
  "chili's",
  "buffalo wild wings",
  "dunkin",
  "dunkin donuts",
  "subway",
  "chipotle",
  "panera",
  "panera bread",
  "wendy's",
  "burger king",
  "taco bell",
  "pizza hut",
  "domino's",
  "kfc",
  "ihop",
  "denny's",
  "cracker barrel",
  "red lobster",
  "outback steakhouse",
  "texas roadhouse",
  "cheesecake factory",
  "the cheesecake factory",
  "costco",
  "cvs",
  "walgreens",
  "dollar general",
  "dollar tree",
  "planet fitness",
  "la fitness",
  "anytime fitness",
  "orangetheory",
  "24 hour fitness",
  "gold's gym",
  "barnes and noble",
  "barnes & noble",
  "best buy",
  "home depot",
  "lowe's",
  "whole foods",
  "trader joe's",
  "culver's",
  "noodles and company",
  "noodles & company",
  "potbelly",
  "five guys",
  "shake shack",
  "chick-fil-a",
  "popeyes",
  "arby's",
  "sonic drive-in",
  "dairy queen",
  "jimmy john's",
  "jersey mike's",
  "firehouse subs",
  "panda express",
  "qdoba",
  "red robin",
  "longhorn steakhouse",
  "marriott",
  "hilton",
  "holiday inn",
  "hampton inn",
];

export function nameMatchesChainDenylist(name: string) {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  return CHAIN_NAME_DENYLIST.some((entry) => {
    const needle = normalizeName(entry);
    if (!needle) return false;
    if (normalized === needle) return true;
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(normalized);
  });
}

export function findVenueOverride(input: {
  name?: string;
  city?: string | null;
  osmId?: string;
  overrides: readonly VenueOverride[];
}) {
  const osmKey = input.osmId ? `osm:${input.osmId}` : "";
  const nameKey = input.name ? venueKey(input.name, input.city) : "";
  return input.overrides.find((override) => override.venueKey === osmKey || (nameKey !== "" && override.venueKey === nameKey)) ?? null;
}

export function classifyVenue(input: {
  name?: string;
  city?: string | null;
  osmId?: string;
  brand?: string;
  brandWikidata?: string;
  organizerKind: OrganizerKind;
  overrides?: readonly VenueOverride[];
}): VenueOwnership {
  const override = findVenueOverride({ ...input, overrides: input.overrides ?? [] });
  if (override?.classification === "chain") return "chain";
  if (override?.classification === "local") {
    if (input.organizerKind === "nonprofit") return "nonprofit";
    if (isPublicOrganizer(input.organizerKind)) return "public";
    return "independent";
  }
  if (input.organizerKind === "nonprofit") return "nonprofit";
  if (isPublicOrganizer(input.organizerKind)) return "public";
  if (input.brand?.trim() || input.brandWikidata?.trim()) return "chain";
  if (input.name && nameMatchesChainDenylist(input.name)) return "chain";
  if (input.organizerKind === "business") return "independent";
  return "unknown";
}
