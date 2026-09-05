import { describe, expect, it } from "vitest";
import { parseWaukeshaCountyParksEvents } from "./communityScraper";

const fixture = `
<ul>
  <li class="gs-feed-list-item item item_text-right divider-lines">
    <div class="gs-feed-list-content info"><div class="gs-feed-list-meta">
      <a href="https://events.waukeshacounty.gov/default/detail/2026-09-08-1030-AdultSenior-Skate-Eble" class="gs-feed-list-title">Adult/Senior Skate (Eble)</a>
      <span class="gs-feed-list-date">September 08, 2026</span>
      <span class="gs-feed-list-description"><p>Enjoy a relaxed public skating experience.</p><div><strong>LOCATION:</strong> Eble Park Ice Arena (19400 W. Bluemound Rd, Brookfield, WI)</div><div><strong>COST:</strong> $7.00 admission</div></span>
    </div></div>
  </li>
  <li class="gs-feed-list-item item item_text-right divider-lines">
    <div class="gs-feed-list-content info"><div class="gs-feed-list-meta">
      <a href="https://events.waukeshacounty.gov/default/detail/2026-09-10-1300-Free-Park-Walk" class="gs-feed-list-title">Free Park Walk</a>
      <span class="gs-feed-list-date">September 10, 2026</span>
      <span class="gs-feed-list-description"><p><strong>LOCATION:</strong> Retzer Nature Center (S14W28167 Madison St, Waukesha, WI)</p><p><strong>COST:</strong> Free</p></span>
    </div></div>
  </li>
  <li class="gs-feed-list-item"><a href="https://events.waukeshacounty.gov/default/detail/2026-08-01-past" class="gs-feed-list-title">Past Program</a><span class="gs-feed-list-date">August 01, 2026</span></li>
</ul>`;

describe("Waukesha County Parks official calendar parser", () => {
  it("retains exact event city, official handoff, and admission status for future records", () => {
    const events = parseWaukeshaCountyParksEvents(fixture, new Date("2026-09-05T12:00:00"));

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      title: "Adult/Senior Skate (Eble)",
      venueName: "Eble Park Ice Arena",
      venueAddress: "19400 W. Bluemound Rd, Brookfield, WI",
      venueCity: "Brookfield, WI",
      category: "sports",
      isFree: false,
      sourceName: "Waukesha County Parks",
      sourceUrl: "https://events.waukeshacounty.gov/default/detail/2026-09-08-1030-AdultSenior-Skate-Eble",
    });
    expect(events[1]).toMatchObject({ venueCity: "Waukesha, WI", isFree: true });
    expect(events[0]?.eventDate.toISOString()).toContain("2026-09-08T10:30:00");
  });
});
