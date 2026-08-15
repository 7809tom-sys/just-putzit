# Technical Implementation Plan: Synchronizing the Shared Question Library Across Game Clients

**Product:** Just Putzit  
**Scope:** A governed content library with a planning target of **2,000 reviewed questions**, used across existing and future game clients.  
**Audience:** Product engineering, platform engineering, game engineering, and editorial operations.  
**Status:** Proposed implementation plan.

## 1. Architecture decision

> The question library is a **single server-authoritative database**. Game clients synchronize only the minimum safe representation required for their current game state; they do not maintain independent writable copies of the full catalog.

The phrase “sync across multiple game clients” should not mean replicating all 2,000 questions and answer keys into every browser, mobile client, or game room. That would create stale-content, rights, answer-leakage, and rollback risks. Instead, clients share a **versioned content contract** backed by one database, one publishing workflow, and server-selected game packs.

| Component | Responsibility | May contain correct answers? | May write library data? |
|---|---|---:|---:|
| Editorial Admin | Create, review, retire, and publish content | Yes | Yes, admin only |
| Shared Content API | Resolve versions, eligibility, selection, and redaction | Yes | Controlled server procedures only |
| Game server / tRPC router | Pins a release and issues game-session packs | Yes | No direct editorial writes |
| Web/PWA game client | Renders a sanitized pack and submits answers/votes | No during active competitive play | No |
| Future native client | Uses the same API contract and cache policy | No during active competitive play | No |

This model keeps the **content source of truth** centralized while allowing Would You Rather, Trivia, Jeopardy, Trivia Pursuit, Visual Jeopardy, Pick a Plan, and later games to consume the same governed inventory.

## 2. Core data model

The current game-specific tables remain available during migration. The new library is introduced as an additive control plane, with adapters reading the shared records where coverage exists.

### 2.1 Canonical tables

| Table | Key fields | Purpose |
|---|---|---|
| `shared_game_questions` | `id`, `currentRevisionId`, `promptType`, `status`, `safetyTier`, `sourceType`, `createdAt`, `updatedAt` | Stable identity for each reusable question or planning prompt. |
| `shared_question_revisions` | `id`, `questionId`, `revisionNumber`, `body`, `answerSpec`, `editorialStatus`, `factStatus`, `createdBy`, `reviewedBy`, `publishedAt` | Immutable version history; publishing never overwrites a released question in place. |
| `shared_question_game_configs` | `questionId`, `gameKey`, `isEligible`, `presentationSpec`, `scoringSpec`, `audienceTier`, `weight` | Per-game rules and rendering configuration. |
| `shared_question_tags` | `questionId`, `tag` | Topic, locale, format, and policy tags used for selection. |
| `shared_question_assets` | `questionId`, `visualAssetId`, `role`, `altTextOverride` | Links questions to approved visual assets without duplicating rights metadata. |
| `content_releases` | `id`, `version`, `status`, `publishedAt`, `publishedBy`, `notes`, `checksum` | Immutable publication boundary used by all clients. |
| `content_release_items` | `releaseId`, `questionId`, `revisionId`, `gameKey`, `configHash` | Exact content membership for a release. |
| `question_usage_events` | `questionId`, `gameKey`, `anonymizedSessionId`, `shownAt`, `outcome` | Repetition control and quality analysis with minimal identity exposure. |

### 2.2 Content state machine

Each question revision moves through a controlled state machine:

```text
draft → in_review → approved → published → retired
                   ↘ rejected
any state with unresolved fact/rights issue → conflict
```

`conflict` is a hard no-publish state. A question may be visible to reviewers for remediation, but it must be excluded from all game packs immediately. A retired question remains in historical room snapshots so completed games retain an auditable record, but it is never selected for new sessions.

### 2.3 Release immutability

The database must never silently update question wording, answer keys, or eligibility inside an active game room. When an editor publishes a change, the publisher creates a new `content_releases` row and maps it to exact question revision IDs. Active rooms retain the release that was pinned at creation.

| Situation | Correct behavior |
|---|---|
| Editor corrects a typo | Publish a new release; new rooms use it; existing rooms keep their pinned revision. |
| Rights or fact conflict discovered | Mark the item conflicted and block new selection immediately; inspect active rooms under a documented incident policy. |
| Game client reconnects | Rehydrate the room’s pinned release and question snapshot, not the newest content release. |
| Game client asks for a new session | Resolve against the newest eligible release for its `gameKey`. |

## 3. API contract and synchronization protocol

The project should implement these procedures through tRPC so client types flow from the router contract. Each response uses a stable `contentReleaseVersion`, ETag-like checksum, and schema version.

### 3.1 Manifest and delta endpoints

| Procedure | Caller | Input | Output | Purpose |
|---|---|---|---|---|
| `content.getManifest` | authenticated game client | `gameKey`, `clientSchemaVersion`, `knownReleaseVersion?` | latest release metadata, compatibility status, delta availability | Cheap startup check. |
| `content.getDelta` | authenticated game client | `gameKey`, `fromReleaseVersion`, `toReleaseVersion?` | changed and retired presentation records only | Refresh noncompetitive cache without downloading a full catalog. |
| `content.getPack` | server-created game session | `roomId` or `matchId`, `gameKey` | sanitized, pinned question pack | Runtime game payload. |
| `content.getAttribution` | authenticated game client | `visualAssetId` or pack item | attribution text and source page | Allows required attribution to render consistently. |
| `content.adminPublishRelease` | admin only | release notes, selected approved revisions, optimistic version | immutable release record | Editorial publication boundary. |
| `content.adminRollbackRelease` | admin only | release ID, reason | newly created rollback release | Safe forward-only rollback; never mutate history. |

### 3.2 Response partitions

The system exposes different payloads for editorial, game setup, active play, and reveal. This prevents a browser from receiving answer keys before a player answers.

```ts
// Safe for active competitive game clients
type ActiveQuestionPresentation = {
  contentReleaseVersion: string;
  packItemId: string;
  questionId: number;
  revisionId: number;
  promptType: "binary_choice" | "multiple_choice" | "knowledge" | "visual" | "planning";
  prompt: string;
  options?: Array<{ id: string; label: string }>;
  visual?: {
    displayUrl: string;
    altText: string;
    attributionText?: string;
    sourcePageUrl?: string;
  };
  expiresAt?: string;
};

// Server-only or reveal-only after answer validation
type AnswerKey = {
  questionId: number;
  revisionId: number;
  canonicalAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
  answerSourceUrl: string;
};
```

The server evaluates answers and returns only the player’s outcome plus the appropriate reveal data. For a collaborative noncompetitive game such as Pick a Plan, the hidden payload is the other participant’s vote until the mutual-agreement condition is met.

### 3.3 Client sync lifecycle

1. The client loads its locally persisted manifest: `gameKey`, `contentReleaseVersion`, `schemaVersion`, and `checksum`.
2. The client calls `content.getManifest` at app start, return-from-background, and before creating a new room. The call is low-volume and contains no full question bodies.
3. If the client release is current, it uses its cached presentation-only catalog for eligible browsing surfaces, if any.
4. If a delta is available and compatible, the client calls `content.getDelta`; it atomically replaces changed presentation items and removes retired items.
5. If the delta is unavailable, too large, or schema-incompatible, the client discards the local catalog and obtains a new full presentation snapshot.
6. When a room begins, the server creates a **room content snapshot** containing question IDs, revision IDs, selection seed, and pinned release version. The client receives the sanitized pack only.
7. During play, the client never selects a new question independently. It requests the next pack item from the server or uses the already pinned, server-issued room pack.
8. On reconnect, the client calls `game.getRoomState`; the server returns the current question’s safe presentation and the same pinned release metadata.

## 4. Caching and offline behavior

The 2,000-question target is small enough for carefully controlled presentation caching, but full answer keys and rights-review notes should never be broadly cached in clients.

| Cache layer | Contents | Lifetime | Invalidated by |
|---|---|---|---|
| In-memory query cache | Current screen or room pack | Current session | Navigation, pack replacement, logout |
| IndexedDB / local persisted cache | Presentation-only manifest and deltas for supported game browsers | Bounded TTL plus release version | New release, retirement, schema incompatibility, logout |
| Room snapshot cache | Current room’s sanitized presentation and progress | Until room ends or expires | Server room state, session completion, invalid room |
| Server database | Complete question revisions, answer keys, editorial and rights data | Durable | Controlled retention policy only |

### 4.1 Offline rules

Offline behavior must preserve scoring integrity and editorial safety.

| Scenario | Permitted behavior | Not permitted |
|---|---|---|
| Browsing previously cached noncompetitive content | Show clearly labeled cached content if it has not expired | Present retired or conflicted records as current |
| Active competitive room loses connectivity | Show the current question and reconnect state if already issued | Accept or score answers offline as final |
| Starting a new competitive game | Require server connectivity | Locally selecting from a cached answer-bearing catalog |
| Pick a Plan vote | Allow drafting local UI state only | Reveal, submit, or infer the other member’s vote offline |

The PWA service worker should cache application shell resources and explicitly exclude server answer-key responses from persistent caches. The client-side cache key must include `userId`, `gameKey`, `contentReleaseVersion`, and `schemaVersion` to avoid cross-user or incompatible data reuse.

## 5. Selection, fairness, and repetition control

Question selection runs only on the server. The selector accepts a `gameKey`, room context, audience constraints, allowed release, content rules, and a deterministic selection seed. It then filters and ranks eligible candidates.

```text
eligible candidate =
  published in pinned release
  AND game configuration is eligible
  AND prompt is active
  AND no rights/fact conflict
  AND audience tier is allowed
  AND required asset is approved
  AND not recently used for the member, match, or room
```

The selection algorithm should use a seeded weighted shuffle, not a database-wide `RAND()` call. The seed and selected revision IDs are stored with the room snapshot, enabling deterministic replay and debugging. Usage data should be scoped cautiously:

* **Solo games:** avoid a question recently shown to the same member.
* **Matched games:** avoid a question recently shown to either participant or the pair.
* **Public rooms:** avoid duplicates within the room first; broad per-player history is optional and should have a limited retention period.
* **Pick a Plan:** select only planning prompts and events that are active, future-dated, city/radius eligible, and safe for the participating match.

## 6. Migration from existing game tables

Existing tables must remain functional while adapters are rolled out. Do not migrate live games in one destructive operation.

### 6.1 Inventory and import mapping

| Existing source | Target prompt type | Initial adapter strategy |
|---|---|---|
| `would_you_rather_questions` | `binary_choice` | Import reviewed rows; retain legacy fallback until sufficient shared coverage exists. |
| `trivia_questions` | `multiple_choice` | Import questions, options, correct answer, category, and difficulty as revisions. |
| `game_questions` (Jeopardy / Trivia Pursuit) | `knowledge` or `multiple_choice` | Import clue, answer, value, category, and answer form; preserve legacy IDs for room history. |
| `bullgerdash_photos` | `visual_asset` candidate only | Do not promote caption text automatically; run rights and fact review first. |
| Pick a Plan candidates | `planning` | Store planning lens prompts in shared library; continue sourcing event candidates from current event records. |

### 6.2 Adapter rollout

1. Add shared tables and read-only selection helpers.
2. Build a one-time import job that creates draft revisions with source provenance metadata.
3. Review and publish a starter release with a deliberately limited set of approved questions.
4. Route one low-risk game surface—recommended: new Visual Jeopardy or a subset of Would You Rather—through the shared selector.
5. Compare selection, error, and completion telemetry against the legacy flow.
6. Add remaining adapters one at a time, keeping a feature flag and server fallback per game key.
7. Retire legacy selection only when historical room replay and current game behavior are both verified.

## 7. Editorial publishing workflow

The 2,000-question target should be an ongoing editorial operation, not a single automated insert. New questions enter a draft queue with required source, safety, and game eligibility fields. The publisher validates the draft set, calculates a checksum, and creates one immutable release.

### 7.1 Publication checks

| Check | Owner | Failure behavior |
|---|---|---|
| Required fields and schema validation | Server | Block release creation |
| Duplicate or near-duplicate prompt detection | Editorial tooling | Flag for review; do not auto-publish |
| Rights and attribution validation for visual prompts | Reviewer | Mark asset or question `conflict` |
| Fact source and accepted-answer review | Reviewer | Keep revision in `in_review` |
| Game configuration compatibility | Server + tests | Exclude from game-specific release membership |
| Release checksum and revision linkage | Publisher | Abort transaction on mismatch |

### 7.2 Concurrency

Editors should use optimistic concurrency on `currentRevisionId` and `updatedAt`. If two reviewers edit the same draft, the second update fails with a conflict response rather than overwriting the first. Publication is transactional: a release is visible only after all `content_release_items` rows, release metadata, and published revision statuses are committed together.

## 8. Security and privacy controls

| Risk | Control |
|---|---|
| Answer key exposed in client | Keep canonical answers and accepted variants server-side until reveal; use sanitized presentation contracts. |
| Client manipulates selected questions | Server issues room snapshot and pack; client treats IDs/revisions as read-only. |
| Unauthorized match participant reads a private pack | Reuse exact-match participant guards for every room and pack read. |
| Blocked users receive a shared invitation | Validate block status before creating and reading any matched-game room. |
| Rights or fact issue spreads across games | Central `conflict` state excludes the record from every new selection. |
| Partner learns member identity | Store only aggregate analytics with minimum cohort thresholds; never expose match, vote, or profile records. |
| Stale events appear in Pick a Plan | Revalidate event status and future date at vote and reveal time, not only at invitation time. |

## 9. Observability and operational metrics

Add structured server events with release ID, game key, schema version, and anonymized session reference. Do not log question text, answer keys, full profile data, or unnecessary personal identifiers in application logs.

| Metric | Why it matters | Alert / review trigger |
|---|---|---|
| Manifest and delta success rate | Client synchronization health | Sustained failures by schema or app version |
| Release adoption | Confirms clients move to the intended content version | Older version persists after compatibility window |
| Pack selection failure rate | Signals gaps in eligible content or bad filters | Any game key cannot build a required pack |
| Question retirement/conflict count | Measures content-quality and rights workload | Sudden spike after source import |
| Duplicate exposure rate | Checks repetition controls | High repeat rate within a member, match, or room window |
| Answer-validation dispute rate | Tests fairness of accepted answer variants | Repeated disputes on a specific revision |
| Pick a Plan stale-event rejection rate | Measures event freshness quality | Candidate fails validation after selection |

## 10. Test strategy

### 10.1 Unit tests

Unit tests should cover release eligibility predicate construction, revision immutability, optimistic editor conflicts, exact answer normalization, accepted-answer matching, deterministic seeded selection, and cache-key construction.

### 10.2 Integration tests

Integration tests should create a release, generate packs for multiple game keys, verify sanitization of competitive payloads, reconnect into a pinned room release after a newer release is published, retire a question, and prove that future rooms exclude it. Test match-only access and block checks for every private game procedure.

### 10.3 Client tests

Client tests should validate manifest compatibility handling, atomic delta application, cache removal for retired content, offline reconnect state, attribution rendering, and the fact that a correct answer is absent from an active question payload.

### 10.4 Rollback tests

Test a forward-only rollback release: publish Release A, publish Release B, create a room on B, then publish a rollback Release C that excludes a faulty question. New rooms must use C; the B room must remain replayable from its pinned snapshot.

## 11. Delivery sequence

| Increment | Technical deliverables | Exit condition |
|---|---|---|
| 1. Data foundation | Shared schema, revisions, releases, eligibility helper, unit tests | Server can create a release and resolve eligible questions. |
| 2. Editorial workflow | Admin draft/review/publish flow, conflict handling, audit fields | Reviewer can publish and safely withdraw a question. |
| 3. Client sync contract | Manifest, delta, cache policy, schema compatibility behavior | Two clients converge on the same release without answer-key leakage. |
| 4. First game adapter | Visual Jeopardy or limited Would You Rather adapter | A new room pins a release and survives reconnect. |
| 5. Legacy migration | Import reviewed legacy questions and instrument fallback | One adapter at a time can move without breaking current games. |
| 6. Pick a Plan | Planning prompt adapter plus event revalidation | Private votes and mutual reveal remain correct across reconnects. |
| 7. Catalog scale-up | Reviewed batches toward the 2,000-question planning target | Editorial throughput, rights controls, and repetition health remain stable. |

## 12. Immediate engineering recommendation

Implement **Increment 1** first: stable question identities, immutable revisions, releases, game configurations, and a server-only eligibility selector. Then implement the sanitized room-pack contract before attempting broad catalog import. This order ensures that the shared library is a reliable platform capability—not merely a larger table of questions.
