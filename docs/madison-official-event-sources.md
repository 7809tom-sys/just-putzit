# Madison Official Public Event Sources

Research completed on 2026-08-14 for the public-event crawler expansion.

| Source | Official URL | Public-event coverage | Ingestion note |
|---|---|---|---|
| Madison Public Library | https://www.madisonpubliclibrary.org/spaces/events | Branch-level free programs, storytimes, talks, clubs, workshops, and offsite events. | The page exposes dated event headings, time ranges, branch/room labels, and individual event links. It is suitable for a dedicated HTML parser. |
| City of Madison | https://www.cityofmadison.com/events | Public recreation, parks, pools, markets, senior programs, civic, nature, arts, and community events. | The paginated listing exposes dates, start/end times, venue names, and street addresses. It is suitable for a dedicated HTML parser with page support. |
| Overture Center | https://www.overture.org/ | Official performing-arts listings, resident-theater productions, family programs, comedy, music, and ticketed events. | The site exposes "Coming Up" cards with dates, times, venue labels, categories, descriptions, and event/ticket links. Use a theater-specific parser and retain the official source URL. |
| City Church Madison | https://citychurchmadison.org/events | Publicly listed faith-community gatherings, volunteer/social events, and registrations. | The page contains event headings, dates, times, descriptive text, venue information, and registration links. Include only events that are explicitly public or invite newcomers. |

All four sources were extracted directly from their official pages. Source URLs must be retained on every ingested activity, and the current crawler should only publish future event dates.
