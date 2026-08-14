# Madison Official Public Event Sources

Research completed on 2026-08-14 for the public-event crawler expansion.

| Source | Official URL | Public-event coverage | Ingestion note |
|---|---|---|---|
| Madison Public Library | https://www.madisonpubliclibrary.org/spaces/events | Branch-level free programs, storytimes, talks, clubs, workshops, and offsite events. | The page exposes dated event headings, time ranges, branch/room labels, and individual event links. It is suitable for a dedicated HTML parser. |
| City of Madison | https://www.cityofmadison.com/events | Public recreation, parks, pools, markets, senior programs, civic, nature, arts, and community events. | The paginated listing exposes dates, start/end times, venue names, and street addresses. It is suitable for a dedicated HTML parser with page support. |
| Overture Center | https://www.overture.org/ | Official performing-arts listings, resident-theater productions, family programs, comedy, music, and ticketed events. | The site exposes "Coming Up" cards with dates, times, venue labels, categories, descriptions, and event/ticket links. Use a theater-specific parser and retain the official source URL. |
| City Church Madison | https://citychurchmadison.org/events | Publicly listed faith-community gatherings, volunteer/social events, and registrations. | The page contains event headings, dates, times, descriptive text, venue information, and registration links. Include only events that are explicitly public or invite newcomers. |

All four sources were extracted directly from their official pages. Source URLs must be retained on every ingested activity, and the current crawler should only publish future event dates.

## Feed and Alternative Source Findings

| Source | Official URL | Finding | Follow-up |
|---|---|---|---|
| Madison Public Library | https://www.madisonpubliclibrary.org/spaces/events/calendar-subscription-feeds | The Library explicitly publishes WebCal `.ics` subscription feeds for all locations, branches, audiences, and event types. This is a compliant machine-readable alternative to the HTML page that rejected the scraper with HTTP 403. | Extract the feed link from the subscription page or identify its stable `.ics` URL, then add an iCalendar parser. |
| Overture Center | https://www.overture.org/calendar/ | The official calendar page exposes dated, descriptive, venue-specific listings and ticket links. It was successfully readable through the public extractor although a direct root-page fetch returned HTTP 403. | Prefer the calendar endpoint over the root page, add a narrower parser, and validate direct server accessibility before enabling it. |
| UW–Madison Events Calendar | https://today.wisc.edu/events.json?limit=100 | The University documents a public read-only JSON API; the endpoint returns title, description, date, location, cost, event URL, tags, and coordinates. It is directly accessible to the server. | Integrated. The importer excludes online and out-of-area records and retains current Madison-area campus events with their official links. |

The official Overture calendar also exposes high-school musical theater through the Jerry Awards, which is relevant to the platform’s school-play discovery priority.

### Runtime validation

On 2026-08-14, the official UW–Madison feed returned 59 future local listings. The first ingest persisted all 59, including Memorial Union music, Terrace art activities, an Arboretum restoration work party, and a family nature program. Each stored record preserves its official event URL and is marked as an on-campus university source.
