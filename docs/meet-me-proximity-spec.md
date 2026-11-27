# Meet Me — Proximity Feature Technical Spec (Phase 1)

Status: **Phase 1A implemented** · Target repo: `just-putzit` · Owner: Tom
Scope source: product scope v1 ("Meet Me proximity feature")

Ships behind `MEET_ME_ENABLED=true` and is off by default. Implementation notes are in §11.

---

## 0. Read this first — one scope item cannot be built as written

The scope asks for **~10-foot proximity detection via BLE**. This app is a **React 19 + Vite PWA**
(`client/`, `vite-plugin-pwa`, `client/public/manifest.json`) served by an Express + tRPC 11 + Drizzle/MySQL
backend. There is no native shell in the repo — no Capacitor, no `android/`, no `ios/`.

In that environment, 10-foot BLE detection between two members is **not achievable**:

| Constraint | Reality |
| --- | --- |
| `navigator.bluetooth.requestDevice()` | Requires a user gesture **and** a per-device chooser. It cannot passively scan for nearby app users. |
| Advertising | Browsers cannot advertise a BLE beacon at all. Two web users therefore cannot see each other. |
| Background scanning | Not available on web. Screen must stay open and focused. |
| iOS | Web Bluetooth is unsupported in Safari entirely. Roughly half of US mobile traffic is excluded. |
| GPS | ~10–50 m accuracy at best. Cannot resolve 10 feet, and the scope already rules it out. |

So "turn the feature on and walk near someone" **cannot ship as a browser feature.** There are three honest paths:

| Option | Real range | Ship cost | Verdict |
| --- | --- | --- | --- |
| **A. Venue presence (Phase 1)** | Same public venue, overlapping session window | Low — existing stack only | **Recommended now** |
| **B. QR / tap-to-confirm handshake** | Arm's length | Low | Good *addition* to A, not a substitute |
| **C. Capacitor native shell + BLE plugin** | True ~10 ft (RSSI) | High — app-store distribution, 2 native plugins, iOS background limits | **Phase 2**, gated on A's metrics |

This spec builds **Option A**, keeps the data model so **Option C is a drop-in range upgrade**, and drops the
GPS/ultrasonic alternatives.

> **Copy implication:** until Phase 2 ships, do not market "10 feet." Market
> *"Know when someone at your gym or event is open to meeting."* The 10-foot promise is what makes the
> feature feel novel; shipping a weaker promise under a stronger label is the fastest way to lose trust.

---

## 1. What Phase 1 actually builds

A member opens the app at a **public venue** — a partner venue, a gym, or a community event — and toggles
**"Meet Me here."** The toggle is live for 90 minutes by default. While two opted-in members have overlapping
active sessions at the **same venue**, each gets a light Sally prompt. Tapping it opens the other person's
**face profile** and an icebreaker line so they can recognise and greet each other in person. There is no chat
thread; the introduction happens on the floor.

### In scope (Phase 1)

- Ephemeral, opt-in-only presence sessions scoped to a public venue.
- Mutual-visibility encounter detection (no match-pool requirement, no pre-existing match).
- Sally nudge + face-profile reveal + one-shot "Say hi" acknowledgement.
- Instant off switch, block, report, and per-encounter dismiss.
- No coordinates stored. Ever.

### Out of scope (Phase 1)

- BLE/RSSI ranging, background beaconing, any native client.
- Long-distance or map/GPS movement tracking.
- In-app chat threads, or matchmaking before meeting.
- Custom hardware, beacons at venues, agency builds.

---

## 2. The privacy model — make the residential buffer structural, not radio-based

The scope justifies the residential buffer with range: *"someone would have to be right at the front door to
trigger a ping."* That argument is fragile — it depends on radio physics we are not shipping in Phase 1, and on
GPS we are explicitly not using.

**Stronger design: a member can only check in to a venue that is already a verified public place in our own
data.** The buffer then holds by construction, not by range:

- Allowed venue sources, resolved server-side from existing tables:
  - `venue_partners` where `is_public_access = true` (see `drizzle/0024_public_access_venues.sql`)
  - `gyms` (see `server/routers/gym.ts`)
  - `community_events` / `discovered_local_events` with a real `venueName`
- **No free-text venue and no latitude/longitude in the API.** A member cannot create a venue, and cannot
  pass a coordinate. A home address is unrepresentable in the schema.
- The server never reads `userProfiles.latitude/longitude` or `gpsVerifiedLat/Lng` for this feature, and never
  computes distance between two members. Distance is not a field anywhere in this feature.
- A "front-door ping" requires the front door to be a listed public venue. It cannot be.

This is the single most important invariant in the spec. Any implementation that accepts a coordinate, or
derives a distance, is a spec violation regardless of intent.

### Member-facing controls

| Control | Behaviour |
| --- | --- |
| Toggle off | Session deleted immediately, not soft-closed. Pending encounters for that session are revoked. |
| Auto-expiry | Session dies at `expiresAt` (default 90 min, hard cap 4 h). No renewal without a fresh tap. |
| Dismiss | Hides one person for the rest of the session. No prompt, no nudge, no recall. |
| Block | Writes to the existing `blocks` table. Overrides everything, permanently. |
| Report | Writes to the existing `reports` table; encounter marked reported and never re-surfaced. |
| Reciprocity | Viewing a face profile tells the other person **nothing**. Only an explicit "Say hi" sends a nudge. |
| First-run interstitial | One-time safety screen before the first reveal: "You're about to see a real person who is nearby." |

**Anti-farming:** a member cannot camp a venue to farm faces. Enforced limits: max 6 encounters surfaced per
session, 5-minute cooldown between reveals, per-session TTL, and no free-text in either direction.

---

## 3. Data model

One migration: `drizzle/0062_meet_me_proximity.sql`. Follows the `event_introductions` naming style
(camelCase columns). Note the repo stopped journaling migrations after `0022` — everything from `0023`
onward is a bare SQL file, so `drizzle/meta/_journal.json` is deliberately left untouched here.

```ts
// ─── Meet Me proximity sessions ──────────────────────────────────────────────
// A session is venue-scoped presence, never a location trail. The venue must be
// a row already marked public in our data; no coordinates are stored here.
export const meetMeSessions = mysqlTable("meet_me_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  venueType: mysqlEnum("venueType", ["partner", "gym", "event"]).notNull(),
  venueId: int("venueId").notNull(),
  venueKey: varchar("venueKey", { length: 96 }).notNull(), // `${venueType}:${venueId}`
  venueName: varchar("venueName", { length: 200 }).notNull(), // denormalised label, no address
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  endedAt: timestamp("endedAt"),
  endReason: mysqlEnum("endReason", ["manual", "expired", "superseded", "safety"]),
});

export const meetMeEncounters = mysqlTable("meet_me_encounters", {
  id: int("id").autoincrement().primaryKey(),
  lowerUserId: int("lowerUserId").notNull(), // pair always stored low/high, per event_introductions
  higherUserId: int("higherUserId").notNull(),
  venueKey: varchar("venueKey", { length: 96 }).notNull(),
  dayKey: varchar("dayKey", { length: 10 }).notNull(), // YYYY-MM-DD in venue-local time
  status: mysqlEnum("status", ["pending", "opened", "greeted", "dismissed", "expired", "reported"])
    .notNull().default("pending"),
  surfacedAt: timestamp("surfacedAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"),
  greetedAt: timestamp("greetedAt"),
  expiresAt: timestamp("expiresAt").notNull(), // ~20 min after surfacing
});

export const meetMeNudges = mysqlTable("meet_me_nudges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // who received the nudge
  encounterId: int("encounterId").notNull(),
  promptText: varchar("promptText", { length: 240 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  seenAt: timestamp("seenAt"),
});
```

Indexes: `meet_me_sessions (venueKey, expiresAt)`, `meet_me_sessions (userId, endedAt)`,
`meet_me_encounters (lowerUserId, higherUserId, venueKey, dayKey) UNIQUE`.

**Why `dayKey` in the unique key:** prevents the same pair being re-surfaced every few minutes at the same
venue, while still allowing a genuine repeat encounter on a later day. It also gives us a hard dedupe key if a
future BLE transport reports the same pair repeatedly at 1 Hz.

**Why no `matches` row:** the existing `event_introductions` flow creates a real match via
`createMutualEventIntroduction` in `server/db.ts`. Meet Me must **not** — an encounter is ephemeral and carries
no relationship state. Do not reuse that table; the semantics differ and mixing them would silently start
match threads.

---

## 4. Shared policy module

`shared/meetMePolicy.ts` — pure functions only, matching the repo's established pattern
(`shared/pickupActivityPolicy.ts`, `shared/eventIntroductionPolicy.ts`). Tests at `server/meetMePolicy.test.ts`,
per repo convention of testing `shared/` modules from `server/`.

```ts
export const MEET_ME_DEFAULT_TTL_MS = 90 * 60 * 1000;
export const MEET_ME_MAX_TTL_MS = 4 * 60 * 60 * 1000;
export const MEET_ME_ENCOUNTER_TTL_MS = 20 * 60 * 1000;
export const MEET_ME_MAX_ENCOUNTERS_PER_SESSION = 6;
export const MEET_ME_REVEAL_COOLDOWN_MS = 5 * 60 * 1000;
export const MEET_ME_NUDGE_MIN_GAP_MS = 10 * 60 * 1000;

export function meetMeVenueKey(venueType: "partner" | "gym" | "event", venueId: number): string;

export function getMeetMeStopReason(
  session: { expiresAt: Date; endedAt: Date | null },
  now?: Date,
): "expired" | "closed" | null;

/** The full surfacing gate. Returns null when an encounter may be created, else the reason it may not. */
export function getMeetMeBlockReason(input: {
  viewerUserId: number;
  candidateUserId: number;
  viewerActive: boolean;
  candidateActive: boolean;
  sameVenue: boolean;
  isBlocked: boolean;
  alreadyGreeted: boolean;
  encountersThisSession: number;
  lastRevealAt: Date | null;
  now?: Date;
}): string | null;

export function canRevealMeetMeProfile(input: {
  hasPrimaryPhoto: boolean;
  profileCompleteness: number;   // reuse shared/profileCompleteness.ts
  isVerified: boolean;
  hasActiveReportAgainst: boolean;
}): boolean;

/** Deterministic nudge copy — no LLM on the hot path. */
export function pickMeetMePrompt(input: {
  displayName: string;
  venueName: string;
  variant: number;
  isFirstEver: boolean;
}): string;
```

### Copy — replacing the scope's example

The scope's sample line is *"Hey, there's a young lady over there that likes to meet a new person. Can you
please say hi?"* **Do not ship that.** It is gendered, appearance-first, and reads as a stranger describing a
woman's body across a room — precisely the tone that gets a social app screenshotted. It also breaks the
product's own voice: every other Sally surface in this codebase (see the system prompts in
`server/routers.ts`) is neutral, warm, and never describes a member's appearance.

Replace with venue-and-name-anchored copy:

- *"Someone at [venue] is also open to a hello right now."*
- *"Mike is at [venue] too and turned Meet Me on. If you're up for it, go say hi."*
- *"Two of you are open to meeting at [venue]. Mike's photo is one tap away."*
- First time only: *"This shows a real person who is nearby right now. Only say hi if you'd genuinely like to."*

Hard rules for nudge text: no appearance, no age, no gender, no "over there," no implication the other person
is waiting, no urgency after the first prompt. Never repeat a nudge for the same person in a session.

---

## 5. tRPC contract

New router `server/routers/meetMe.ts`, mounted in `server/routers.ts` alongside `gymRouter` / `localDiscoveryRouter`.
All procedures `protectedProcedure`.

| Procedure | Input | Returns |
| --- | --- | --- |
| `meetMe.getState` | — | `{ activeSession \| null, nearbyCount, pendingEncounterId \| null }` |
| `meetMe.start` | `{ venueType, venueId }` | `{ session, expiresAt }` — validates the venue is public |
| `meetMe.stop` | `{ sessionId }` | `{ ended: true }` |
| `meetMe.poll` | `{ sessionId }` | `{ nearbyCount, prompt, greeting }` — **no photo, no profile** |
| `meetMe.open` | `{ encounterId }` | face profile + icebreaker; marks `opened` |
| `meetMe.greet` | `{ encounterId }` | sends the one-shot nudge to the other member |
| `meetMe.dismiss` | `{ encounterId }` | `{ dismissed: true }` |
| `meetMe.block` | `{ encounterId }` | reuses `isBlockInEffect` / `blocks` |
| `meetMe.report` | `{ encounterId, reason }` | reuses the `reports` path |

**Identity is gated twice.** `poll` returns counts plus at most one Sally line and an opaque `encounterId`;
the nudge copy may name the person, because naming someone is the product's whole prompt ("Mike is at the
library too…"). The **face photo and profile** exist only in the `open` response. That means no scraping of
nearby faces by polling, and because `open` reveals nothing to the other member, looky-loos stay invisible.

`meetMe.open` must return a **short-lived signed URL** for the primary photo from `profile_photos`, not the
stored `url` — a face shown to a stranger should not be a permanent hotlink.

### Server-side checks on `start`

1. `getMeetMeBlockReason` passes for the pair at encounter creation.
2. Venue resolves and is public (see §2). Reject otherwise with a plain message, in the style of
   `getPickupSafetyError` ("Use a named public venue so people can decide safely.").
3. No other active session for this user — end it as `superseded`.
4. `canRevealMeetMeProfile` is true for the viewer. If a member has no primary photo, they may still check in,
   but they will not receive reveals and cannot be revealed. Prompt them to add a face photo first.

---

## 6. Sally prompt logic

The moment that matters is *"someone is here now."* It must not wait on a language model.

- **Nudge text:** deterministic template from `pickMeetMePrompt`. Zero latency, zero cost, no hallucinated
  venue names or invented members.
- **Icebreaker line:** generated by `invokeLLM` (`server/_core/llm.ts`) **after** `open`, cached per pair, with
  a 1.5 s budget and a template fallback. Grounded only in `buildProfileSummaryEvidence`
  (`shared/profileSummaryEvidence.ts`) so Sally cannot assert a trait the member never expressed — the same
  evidence rule the profile summary already enforces.
- **Rate limits:** 1 nudge per 10 min, max 3 per session, never for a dismissed, blocked, or reported pair,
  never more than twice per pair per day.
- **Silence is a valid outcome.** If `nearbyCount` is 0, show nothing. No streaks, no "nobody likes you"
  empty state, no engagement bait.

---

## 7. Client

New page `client/src/pages/MeetMe.tsx`, route `/meet-me` in `client/src/App.tsx`.
Entry point: a toggle in `Profile` beside the existing connection settings, since that page already frames the
"always-on community discovery vs. optional introductions" boundary and Meet Me is the third rung of that ladder.

**Active session card:** venue name, time remaining, "N people open to meeting nearby," and a permanently
visible **Stop** button. The stop control never scrolls out of view and never sits behind a confirm dialog.

**Encounter sheet:** primary photo, display name, venue line, one Sally line, two actions — **Say hi** and
**Not now**. No chat box.

**"Say hi" is deliberately not a chat thread.** It sends one acknowledgement to the other member ("Mike said
hi — he's at [venue] too") and dissolves. Out of scope means out of scope: this is a doorbell, not a messenger.

**Battery and permissions (Phase 1):**

- No location permission is requested at all. This is the feature's best battery and privacy property — say so
  in the UI.
- Poll only while the tab is visible, at 10 s with backoff to 30 s after 5 idle minutes.
- Stop polling when `document.visibilityState === "hidden"`; resume on focus and reconcile via `getState`.
- No service-worker background sync for this feature in Phase 1.

---

## 8. Metrics and rollout

Feature-flagged off by default (env `MEET_ME_ENABLED`, evaluated server-side so the toggle cannot be
client-forced).

Instrument: toggle-on rate, sessions per weekly active, encounters per session, open rate, greet rate, dismiss
rate, report rate, and **same-day toggle-off after a greet** — that last one is the trust canary.

Pilot with three venues we already have data for: Waukesha Public Library, one public gym (the seeded
Crunch Fitness — Brookfield record and similar), and one community event. Do not launch city-wide.

Gate for Phase 2 (native BLE): greet rate ≥ 25% of encounters, report rate < 1%, and ≥ 150 encounters in the
pilot. Below that, the venue-presence model is not working, and spending on a native shell would be premature.

---

## 9. Test plan (vitest, repo convention)

`server/meetMePolicy.test.ts`:

- Gate rejects: self, inactive viewer, inactive candidate, different venue, block either direction,
  already greeted, session cap reached, reveal cooldown not elapsed.
- Gate accepts the minimal happy path.
- `getMeetMeStopReason` at TTL boundary.
- `meetMeVenueKey` is stable and namespace-separated (`partner:1` ≠ `gym:1`).
- Nudge copy contains no gendered or appearance terms — assert against a banned-word list, so a future copy
  edit cannot quietly reintroduce the scope's sample line.
- `canRevealMeetMeProfile` refuses without a primary photo.

`server/meetMeRoute.test.ts` (source-assertion style, as `eventIntroductionPolicy.test.ts` already does):
`open` is `protectedProcedure`, `poll` returns no photo/displayName keys, `report` routes to the existing
report path.

---

## 10. Open questions for Tom

1. **Is the 10-foot promise load-bearing for the pitch?** If yes, Phase 1 needs a rename
   ("Meet Me Here" / "Open to a hello") and BLE moves into the near roadmap, not Phase 2 someday.
2. **Couples network:** `userProfiles.networkType` allows `couples`. Meeting couples in person is a different
   safety conversation. Default to `singles` + `community` for the pilot?
3. **Venue consent:** do partner venues get told that Meet Me sessions happen there, and can a venue opt out?
   I would say yes — a library may not want to be a pickup spot, and they can see aggregate session counts.
4. **Verification bar:** `isVerified` and `cityVerified` exist but there is no liveness check. A face at 10 feet
   is the highest-risk surface in the product. Require a primary photo + a completed profile before a member
   can be revealed, or hold Phase 1 to city-verified members only?
5. **Native appetite:** if Phase 2 is likely, build the client so the discovery transport is swappable now
   (`useMeetMeTransport`) — cheap insurance, roughly a day.

---

## 11. Implementation notes (Phase 1A)

### Files

| File | Role |
| --- | --- |
| `shared/meetMePolicy.ts` | Every gate, limit, and copy string. Pure functions, no DB, no network. |
| `drizzle/schema.ts` | `meetMeSessions`, `meetMeEncounters`, `meetMeNudges`. |
| `drizzle/0062_meet_me_proximity.sql` | The migration. |
| `server/meetMe/service.ts` | Venue resolution, session lifecycle, the poll that creates a reveal, and the encounter actions. |
| `server/routers/meetMe.ts` | tRPC surface. Every mutation refuses when the flag is off. |
| `client/src/pages/MeetMe.tsx` | The member surface at `/meet-me`. |
| `server/meetMePolicy.test.ts` | Gate, TTL, copy, and venue eligibility tests. |
| `server/meetMeRoute.test.ts` | Wiring tests: flag on every mutation, no face in `poll`, no coordinates, no match row. |

### Turn it on

```bash
MEET_ME_ENABLED=true
# apply the migration first
psql "$DATABASE_URL" -f drizzle/0062_meet_me_proximity.sql
```

`meetMe.getState` deliberately answers even while the flag is off, so the page can say "not open yet"
instead of throwing.

### Deviations from the plan above

1. **`poll` may name the person**, in the Sally line only. Blocking the name made the prompt read like a
   riddle. The photo and the profile remain gated behind `open`.
2. **The personalised icebreaker is a second call** (`meetMe.icebreaker`) fired after the dialog is already on
   screen. A language model in the critical path of "someone is standing near you" would add a visible pause
   at exactly the wrong moment, so `open` returns the deterministic line immediately and the client upgrades it
   silently. A generated line that describes appearance, runs long, or names anyone but the person being
   introduced is discarded.
3. **`venueName` is denormalised onto the encounter.** Without it, `greet` had to read the greeter's current
   session — wrong if they had already walked to a different venue. A greeting must describe where the hello
   actually happened.
4. **Encounter pairs are deduped by `(lower, higher, venueKey, dayKey)`.** One face per pair per venue per day.
   This is also the dedupe key a future BLE transport needs, since it would report the same pair many times a
   minute.

### Verified

- `tsc --noEmit` clean across `client/`, `server/`, `shared/`.
- 25 Meet Me tests pass (19 policy, 6 wiring).
- Full suite: 347 passed, 29 failed. All 29 failures are pre-existing tests that need a live MySQL (`DATABASE_URL`
  is unset here) or a network scraper — none are in a file this change touches.

### Not verified here

- `vite build` / a real browser render. The sandbox blocked `@tailwindcss/oxide`'s install script, so a bundler
  run would fail on environment rather than on this code. The page needs one pass in the running app.
- Any live-DB behaviour: session creation, the poll race, and the duplicate-key path are reasoned about but only
  exercised once against a real database.
- Nothing about true proximity. This is still venue presence, as §0 explains.
