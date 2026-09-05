# County Parks Source Audit

## Milwaukee County Parks

Official calendar: https://county.milwaukee.gov/EN/Parks/Experience/Events-Calendar

The official public calendar exposes current dated listings, park or facility names, locations, descriptions, categories, and individual official event-detail URLs. It includes multi-day programming and can present an anti-bot challenge to automated access. Its page output showed current listings such as park art displays, farmers markets, restoration programs, and the Mitchell Park Dome show. It is appropriate only when the existing deterministic scraper can access the official listing without bypassing access controls.

## Waukesha County Parks and Land Use

Official calendar: https://www.waukeshacounty.gov/parks-and-land-use/parks-and-land-use-events/

The official page publishes upcoming programs and links each listing to an official detail page. Its visible records include a dated event title, description, exact venue or facility, official detail URL, registration or ticket guidance where applicable, and, in many cases, a specific city such as Brookfield or Waukesha. This is a suitable primary source for a future-only adapter because it preserves precise city and official handoff information.

## Integration Decision

Start with Waukesha County Parks because the official page is accessible and has clear dated event records. Preserve each event's stated city—especially Brookfield, Waukesha, Muskego, Menomonee Falls, and Mukwonago—rather than labeling the source broadly as Waukesha or Milwaukee. Do not circumvent the Milwaukee County anti-bot challenge; revisit it only through an approved official feed or accessible public calendar endpoint.
