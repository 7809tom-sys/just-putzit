# Verified College Performing-Arts Sources

## Carroll University — Waukesha

The official Carroll University Community page links to an official campus events calendar and to a Visual and Performing Arts calendar hosted through CampusGroups. The public community page states that visitors can attend lectures and shows on campus, making it a suitable source for Waukesha-area public discovery once the linked calendar’s event data is assessed.

- Community source: https://carrollu.edu/community/
- Official arts calendar link: https://carrollu.campusgroups.com/events?group_ids=35527
- Location: Waukesha, Wisconsin

## Marquette University Music — Milwaukee

The official Marquette Music Performances page lists its 2026–27 performance season and identifies Varsity Theatre in Milwaukee as the location. Its individual performance titles do not expose event dates in the static page extraction, so a crawler should use a more structured official event feed or individual event pages where dates are present rather than treating these headings as current listings.

- Source: https://www.marquette.edu/music/performances.php
- Location: Varsity Theatre, 1324 W. Wisconsin Ave., Milwaukee, Wisconsin

## Implementation note

Only dated, future public events with an official source URL should be added to member discovery. Undated season headings should remain source references rather than generated events.

## Data-access assessment

The Carroll CampusGroups Visual and Performing Arts calendar currently exposes no upcoming public results in its rendered event list, despite being an official source. It should be monitored as a source reference but not seeded with placeholder or undated events.

The Marquette Music page currently exposes event titles but not dates in its extracted public markup. It should not be used to create event records until a dated official event feed or dated individual event URLs are identified.

The official Carroll University calendar at `connect.carrollu.edu/event-calendar` is publicly accessible and offers a calendar month selector plus iCalendar export. Its current rendered August 2026 view contains no dated event entries, so it should be retained as a verified official calendar endpoint but not used to generate empty or speculative listings.
