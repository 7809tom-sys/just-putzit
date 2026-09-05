# County Parks Source Audit

## Milwaukee County Parks

Official calendar: https://county.milwaukee.gov/EN/Parks/Experience/Events-Calendar

The official public calendar exposes current dated listings, park or facility names, locations, descriptions, categories, and individual official event-detail URLs. It includes multi-day programming and can present an anti-bot challenge to automated access. Its page output showed current listings such as park art displays, farmers markets, restoration programs, and the Mitchell Park Dome show. It is appropriate only when the existing deterministic scraper can access the official listing without bypassing access controls.

## Waukesha County Parks and Land Use

Official calendar: https://www.waukeshacounty.gov/parks-and-land-use/parks-and-land-use-events/

The official page publishes upcoming programs and links each listing to an official detail page. Its visible records include a dated event title, description, exact venue or facility, official detail URL, registration or ticket guidance where applicable, and, in many cases, a specific city such as Brookfield or Waukesha. This is a suitable primary source for a future-only adapter because it preserves precise city and official handoff information.

## Integration Decision

Start with Waukesha County Parks because the official page is accessible and has clear dated event records. Preserve each event's stated city—especially Brookfield, Waukesha, Muskego, Menomonee Falls, and Mukwonago—rather than labeling the source broadly as Waukesha or Milwaukee. Do not circumvent the Milwaukee County anti-bot challenge; revisit it only through an approved official feed or accessible public calendar endpoint.

## Milwaukee County Parks Follow-up

On September 5, 2026, both the main Milwaukee County Parks event calendar and its official WebTrac public-program listing returned access challenges to automated requests. Search visibility confirms that these are official sources, but no documented API, RSS feed, or other public structured endpoint was identified. The integration remains intentionally unimplemented: Just Putzit will not automate around the access controls. If Milwaukee County Parks later provides an accessible official feed or data-sharing endpoint, it can be evaluated as a separate source adapter.

## Brookfield Public Library

Official calendar: https://www.ci.brookfield.wi.us/calendar.aspx?view=list&CID=29

The City of Brookfield's official calendar publishes a dedicated Library Calendar with future event titles, start dates and times, descriptions where available, and the exact Brookfield library address. The adapter reads only that category, treats it as free unless the official calendar states otherwise, removes closure notices, and retains the official calendar as the handoff link. Its first verified refresh returned 42 current public library programs in Brookfield.

## Waukesha County Parks Access Status

The Waukesha County Parks page returned an accessible official calendar during the initial verification and supplied the individually dated listings already stored from that verified pull. A subsequent refresh attempt on September 5, 2026 received an HTTP 403 response. No access-control bypass was attempted and no new parks events were inserted from that denied request. The production parser retains the new occurrence-splitting safeguards for the next authorized official response; the source-health record will surface any failed scheduled refresh rather than silently inventing or updating data.

## City of Waukesha Special Events

Official calendar: https://www.waukesha-wi.gov/special-events.php

The official City of Waukesha page lists individual future events with titles, dates, times, venues when published, and official detail or registration links. The September 5, 2026 review included Neighborhood Beer Garden at Merrill Crest Park, It's Our Fox River Day, Oktoberfest, Waukesha Unlocked, Wauk-Tober, Tombstone Trot, and city seasonal events. The page was visible to text extraction but presented a browser access challenge. A standard server-side request also returned HTTP 403, so no adapter is implemented and no access controls will be bypassed. The source can be reconsidered only if the city provides an accessible official feed, API, or data-sharing endpoint.

## Visit Waukesha Events

Authoritative destination calendar: https://visitwaukesha.org/events/

Visit Waukesha provides an accessible current-events listing for the Waukesha–Pewaukee area. The September 5, 2026 review contained individual event dates and times, exact venues and addresses, descriptive previews, free-admission markers, and official event detail pages for public events including the Wisconsin Highland Games, Fiesta del Río, the Pewaukee Farmers Market, and Waukesha Oktoberfest. Each record would preserve its stated city instead of being broadly labelled Waukesha. However, a standard server-side request returns a Cloudflare challenge, so no adapter is implemented and the protected source will not be bypassed. It can be revisited only with a permitted official feed or data-sharing endpoint.

## Waukesha Civic Theatre

Official calendar candidate: https://www.waukeshacivictheatre.org/box-office/upcoming-shows/

The official theatre page renders a shell without the current show data in its static markup. Its standard public WordPress content endpoint timed out during the September 5, 2026 assessment. No parser or records are added from an incomplete or unavailable response. The source can be revisited if an accessible official calendar feed or stable public endpoint is confirmed.
