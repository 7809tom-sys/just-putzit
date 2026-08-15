# Shared Question Library Delta Synchronization API Specification

**Status:** Proposed typed contract  
**Transport:** tRPC over the existing authenticated API boundary  
**Scope:** Synchronize a presentation-safe, game-specific question catalog across Just Putzit web, PWA, and future native game clients.  

## 1. Contract boundary

> Delta synchronization distributes **presentation records**, not a complete editorial database and not answer keys for active competitive games.

The shared library remains server-authoritative. A client may cache a game-specific, release-versioned presentation catalog, but it must request a server-issued room pack before it begins a scored or private game. Correct answers, accepted answer variants, editorial notes, rights-review notes, partner metrics, and other participants’ private selections never appear in a delta response.

| API surface | Returns | Never returns |
|---|---|---|
| Manifest | Version, checksum, sync action, TTL | Question bodies unless a snapshot is required |
| Delta | Safe additions, updates, retirements, game configuration | Correct answers, reviewer notes, partner/private match data |
| Snapshot | Complete safe presentation catalog for one game key | Correct answers, unpublished or conflicted records |
| Room pack | Pinned, sanitized questions for one authorized room | Other players’ private answers or votes |

## 2. Shared types

The following TypeScript and Zod definitions are the source-level contract. Exact game keys may grow, but adding a key must be backward-compatible.

```ts
import { z } from "zod";

export const CONTENT_SYNC_SCHEMA_VERSION = 1 as const;

export const GameKeySchema = z.enum([
  "would_you_rather",
  "trivia",
  "jeopardy",
  "trivia_pursuit",
  "visual_jeopardy",
  "pick_a_plan",
]);
export type GameKey = z.infer<typeof GameKeySchema>;

export const ClientPlatformSchema = z.enum(["web", "pwa", "ios", "android"]);

export const ReleaseVersionSchema = z
  .string()
  .regex(/^qrl_\d{8}_[a-z0-9]{8}$/, "Expected immutable release version");

export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i, "Expected SHA-256 checksum");

export const ContentCursorSchema = z
  .string()
  .regex(/^cursor_[A-Za-z0-9_-]{16,}$/)
  .nullable();

export const IsoTimestampSchema = z.string().datetime({ offset: true });

export const SyncSchemaVersion = z.literal(CONTENT_SYNC_SCHEMA_VERSION);
```

### 2.1 Presentation-safe question record

Every `upsert` operation includes a complete replacement record. This makes deltas idempotent and avoids complex field-level merge behavior.

```ts
export const SafeVisualSchema = z.object({
  displayUrl: z.string().url(),
  altText: z.string().min(1).max(500),
  attributionText: z.string().min(1).max(1000).optional(),
  sourcePageUrl: z.string().url().optional(),
  aspectRatio: z.enum(["square", "landscape", "portrait", "wide"]),
});

export const SafeQuestionRecordSchema = z.object({
  // Stable logical content identity and immutable released revision identity.
  questionId: z.number().int().positive(),
  revisionId: z.number().int().positive(),
  gameKey: GameKeySchema,
  contentReleaseVersion: ReleaseVersionSchema,

  // Client can render these fields during unscored catalog presentation.
  promptType: z.enum([
    "binary_choice",
    "multiple_choice",
    "knowledge",
    "visual",
    "planning",
    "icebreaker",
  ]),
  prompt: z.string().min(1).max(4000),
  options: z.array(z.object({
    id: z.string().min(1).max(64),
    label: z.string().min(1).max(500),
  })).max(8).optional(),
  category: z.string().min(1).max(100).optional(),
  tags: z.array(z.string().min(1).max(64)).max(30),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  visual: SafeVisualSchema.optional(),

  // Game adapter configuration that is safe to expose.
  presentation: z.object({
    timeLimitSeconds: z.number().int().min(0).max(300).nullable(),
    value: z.number().int().min(0).max(5000).nullable(),
    showAttributionInGame: z.boolean(),
    audienceTier: z.enum(["all_members", "adult_opt_in", "family_safe"]),
  }),

  // Versioning / cache control only.
  recordChecksum: Sha256Schema,
  updatedAt: IsoTimestampSchema,
});
export type SafeQuestionRecord = z.infer<typeof SafeQuestionRecordSchema>;
```

**Explicit exclusion:** `canonicalAnswer`, `acceptedAnswers`, `answerExplanation`, `answerSourceQuote`, `factStatus`, `rightsReviewNotes`, `editorialNotes`, and any member-specific data are absent from this type.

## 3. Manifest request and response

The manifest is the first call at client start, app return-from-background, or before starting a new game. It is small and establishes whether a delta, full snapshot, or application upgrade is required.

### 3.1 Request schema

```ts
export const GetContentManifestInputSchema = z.object({
  gameKey: GameKeySchema,
  clientPlatform: ClientPlatformSchema,
  clientSchemaVersion: SyncSchemaVersion,
  knownReleaseVersion: ReleaseVersionSchema.optional(),
  knownCatalogChecksum: Sha256Schema.optional(),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).default("en-US"),
});
export type GetContentManifestInput = z.infer<typeof GetContentManifestInputSchema>;
```

### 3.2 Discriminated response schema

```ts
const BaseManifestSchema = z.object({
  syncSchemaVersion: SyncSchemaVersion,
  gameKey: GameKeySchema,
  generatedAt: IsoTimestampSchema,
  latestReleaseVersion: ReleaseVersionSchema,
  latestCatalogChecksum: Sha256Schema,
  cacheTtlSeconds: z.number().int().min(60).max(86400),
});

export const ManifestUpToDateSchema = BaseManifestSchema.extend({
  action: z.literal("up_to_date"),
});

export const ManifestDeltaAvailableSchema = BaseManifestSchema.extend({
  action: z.literal("delta_available"),
  baseReleaseVersion: ReleaseVersionSchema,
  deltaId: z.string().regex(/^delta_[A-Za-z0-9_-]{16,}$/),
  estimatedOperationCount: z.number().int().min(1),
});

export const ManifestSnapshotRequiredSchema = BaseManifestSchema.extend({
  action: z.literal("snapshot_required"),
  reason: z.enum([
    "no_local_release",
    "release_too_old",
    "checksum_mismatch",
    "delta_pruned",
    "locale_changed",
  ]),
});

export const ManifestUpgradeRequiredSchema = z.object({
  action: z.literal("upgrade_required"),
  syncSchemaVersion: z.number().int(),
  minimumClientSchemaVersion: z.number().int(),
  message: z.string().min(1).max(300),
  retryAfterSeconds: z.number().int().min(60).max(86400),
});

export const ContentManifestResponseSchema = z.discriminatedUnion("action", [
  ManifestUpToDateSchema,
  ManifestDeltaAvailableSchema,
  ManifestSnapshotRequiredSchema,
  ManifestUpgradeRequiredSchema,
]);
export type ContentManifestResponse = z.infer<typeof ContentManifestResponseSchema>;
```

### 3.3 Example manifest response

```json
{
  "action": "delta_available",
  "syncSchemaVersion": 1,
  "gameKey": "visual_jeopardy",
  "generatedAt": "2026-08-15T15:10:02.000Z",
  "latestReleaseVersion": "qrl_20260815_k3m9x7p2",
  "latestCatalogChecksum": "985cb5a6a51cfed946d5bc7bc744bbb431ab0b7ee7cf5bfec63d620b4e0b5efc",
  "cacheTtlSeconds": 21600,
  "baseReleaseVersion": "qrl_20260801_s1r8m2a4",
  "deltaId": "delta_Zx7nM4uJb8QkR2pV",
  "estimatedOperationCount": 14
}
```

## 4. Delta request and response

### 4.1 Request schema

The client asks for one immutable delta at a time. A delta is paginated so response size stays controlled as the library grows.

```ts
export const GetContentDeltaInputSchema = z.object({
  gameKey: GameKeySchema,
  clientSchemaVersion: SyncSchemaVersion,
  deltaId: z.string().regex(/^delta_[A-Za-z0-9_-]{16,}$/),
  fromReleaseVersion: ReleaseVersionSchema,
  expectedToReleaseVersion: ReleaseVersionSchema,
  cursor: ContentCursorSchema.default(null),
  pageSize: z.number().int().min(1).max(100).default(50),
});
export type GetContentDeltaInput = z.infer<typeof GetContentDeltaInputSchema>;
```

### 4.2 Operation schemas

Every operation includes `operationId` for client deduplication and a monotonic `sequence` for observability. Operations are **complete replacement records** or explicit tombstones.

```ts
const DeltaOperationBaseSchema = z.object({
  operationId: z.string().regex(/^op_[A-Za-z0-9_-]{16,}$/),
  sequence: z.number().int().positive(),
  effectiveAt: IsoTimestampSchema,
});

export const QuestionUpsertOperationSchema = DeltaOperationBaseSchema.extend({
  type: z.literal("question_upsert"),
  record: SafeQuestionRecordSchema,
});

export const QuestionRetireOperationSchema = DeltaOperationBaseSchema.extend({
  type: z.literal("question_retire"),
  questionId: z.number().int().positive(),
  gameKey: GameKeySchema,
  retiredRevisionId: z.number().int().positive(),
  reason: z.enum([
    "editorial_retirement",
    "rights_conflict",
    "fact_conflict",
    "game_ineligible",
    "release_rollback",
  ]),
});

export const ContentDeltaOperationSchema = z.discriminatedUnion("type", [
  QuestionUpsertOperationSchema,
  QuestionRetireOperationSchema,
]);
export type ContentDeltaOperation = z.infer<typeof ContentDeltaOperationSchema>;
```

### 4.3 Response schema

```ts
export const ContentDeltaPageResponseSchema = z.object({
  action: z.literal("delta"),
  syncSchemaVersion: SyncSchemaVersion,
  gameKey: GameKeySchema,
  deltaId: z.string().regex(/^delta_[A-Za-z0-9_-]{16,}$/),
  fromReleaseVersion: ReleaseVersionSchema,
  toReleaseVersion: ReleaseVersionSchema,
  baseCatalogChecksum: Sha256Schema,
  targetCatalogChecksum: Sha256Schema,
  pageChecksum: Sha256Schema,
  operations: z.array(ContentDeltaOperationSchema).max(100),
  nextCursor: ContentCursorSchema,
  hasMore: z.boolean(),
  issuedAt: IsoTimestampSchema,
  expiresAt: IsoTimestampSchema,
});
export type ContentDeltaPageResponse = z.infer<typeof ContentDeltaPageResponseSchema>;
```

### 4.4 Example delta response

```json
{
  "action": "delta",
  "syncSchemaVersion": 1,
  "gameKey": "visual_jeopardy",
  "deltaId": "delta_Zx7nM4uJb8QkR2pV",
  "fromReleaseVersion": "qrl_20260801_s1r8m2a4",
  "toReleaseVersion": "qrl_20260815_k3m9x7p2",
  "baseCatalogChecksum": "0a8ce99e15d5a8e235c9e4b69c7bf78fce87f6552327516217afcdd93bb8d020",
  "targetCatalogChecksum": "985cb5a6a51cfed946d5bc7bc744bbb431ab0b7ee7cf5bfec63d620b4e0b5efc",
  "pageChecksum": "359f2c15988e22f5bd911e35aa410434541c65edbde83b2edf1ea816b1ac6f4a",
  "operations": [
    {
      "type": "question_upsert",
      "operationId": "op_Yd5uN9cHq1VwP3xK",
      "sequence": 41,
      "effectiveAt": "2026-08-15T15:00:00.000Z",
      "record": {
        "questionId": 842,
        "revisionId": 910,
        "gameKey": "visual_jeopardy",
        "contentReleaseVersion": "qrl_20260815_k3m9x7p2",
        "promptType": "visual",
        "prompt": "This display from a U.S. health agency illustrates what broad kind of meal?",
        "category": "Food & Health",
        "tags": ["food", "health", "visual"],
        "difficulty": "medium",
        "visual": {
          "displayUrl": "https://cdn.justputzit.com/game-assets/healthy-food-display-960.jpg",
          "altText": "A table displaying beans, vegetables, grains, fish, meat, fruit, and bread.",
          "attributionText": "Image: National Cancer Institute, via Wikimedia Commons",
          "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Good_Food_Display_-_NCI_Visuals_Online.jpg",
          "aspectRatio": "landscape"
        },
        "presentation": {
          "timeLimitSeconds": 20,
          "value": 400,
          "showAttributionInGame": true,
          "audienceTier": "all_members"
        },
        "recordChecksum": "fda604e41a1bf7669dcc94eece9c2a36d8f4e8bb5c34199d66c3dc248e31723d",
        "updatedAt": "2026-08-15T15:00:00.000Z"
      }
    },
    {
      "type": "question_retire",
      "operationId": "op_G7vD1qR9mK4hW2sL",
      "sequence": 42,
      "effectiveAt": "2026-08-15T15:00:00.000Z",
      "questionId": 721,
      "gameKey": "visual_jeopardy",
      "retiredRevisionId": 792,
      "reason": "fact_conflict"
    }
  ],
  "nextCursor": null,
  "hasMore": false,
  "issuedAt": "2026-08-15T15:10:03.000Z",
  "expiresAt": "2026-08-16T15:10:03.000Z"
}
```

## 5. Snapshot request and response

A snapshot is required when the client has no compatible base release, its checksum differs from the server’s expected base, the delta was pruned, or the game contract changed.

```ts
export const GetContentSnapshotInputSchema = z.object({
  gameKey: GameKeySchema,
  clientSchemaVersion: SyncSchemaVersion,
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).default("en-US"),
  cursor: ContentCursorSchema.default(null),
  pageSize: z.number().int().min(1).max(100).default(100),
});

export const ContentSnapshotPageResponseSchema = z.object({
  action: z.literal("snapshot"),
  syncSchemaVersion: SyncSchemaVersion,
  gameKey: GameKeySchema,
  releaseVersion: ReleaseVersionSchema,
  catalogChecksum: Sha256Schema,
  pageChecksum: Sha256Schema,
  records: z.array(SafeQuestionRecordSchema).max(100),
  nextCursor: ContentCursorSchema,
  hasMore: z.boolean(),
  issuedAt: IsoTimestampSchema,
  expiresAt: IsoTimestampSchema,
});
```

The client must stage all snapshot pages in a temporary namespace. It swaps the active catalog only after the last page is received and the locally calculated catalog checksum matches `catalogChecksum`.

## 6. Sync error and recovery schemas

tRPC transport errors remain authoritative for authentication and permission failures. For expected synchronization decisions, use a typed, recoverable response rather than forcing client parsing of generic error messages.

```ts
export const SyncRecoveryResponseSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("snapshot_required"),
    reason: z.enum([
      "base_release_unknown",
      "base_checksum_mismatch",
      "delta_expired",
      "delta_pruned",
      "schema_incompatible",
    ]),
    requiredReleaseVersion: ReleaseVersionSchema,
  }),
  z.object({
    action: z.literal("retry_later"),
    retryAfterSeconds: z.number().int().min(1).max(3600),
    reason: z.enum(["release_being_published", "temporary_capacity_limit"]),
  }),
  z.object({
    action: z.literal("upgrade_required"),
    minimumClientSchemaVersion: z.number().int(),
    message: z.string().max(300),
  }),
]);
```

| Condition | tRPC / response outcome | Required client action |
|---|---|---|
| User is unauthenticated | `UNAUTHORIZED` | Clear user-bound cache; complete login before retrying. |
| Game key unsupported | `BAD_REQUEST` | Disable that game surface for this client version. |
| Client schema too old | `upgrade_required` | Do not process data; prompt upgrade or use server-only room flow. |
| Base release or checksum invalid | `snapshot_required` | Discard staged delta; request snapshot. |
| Delta expired or pruned | `snapshot_required` | Request new snapshot. |
| Server is publishing a release | `retry_later` | Keep last valid catalog; retry after instructed interval. |
| User attempts editorial endpoint without role | `FORBIDDEN` | Do not retry; display permission state. |

## 7. Client-side application algorithm

### 7.1 Preconditions

Before applying any page, the client must verify all of the following:

1. `syncSchemaVersion` equals the supported schema version.
2. `gameKey` equals the requested game key.
3. Delta `fromReleaseVersion` equals the active local release version.
4. Every operation validates against `ContentDeltaOperationSchema`.
5. The calculated canonical JSON SHA-256 for the page equals `pageChecksum`.

### 7.2 Atomic delta application pseudocode

```ts
async function applyDeltaPage(
  db: ClientContentStore,
  page: ContentDeltaPageResponse,
): Promise<void> {
  validateDeltaPage(page);

  await db.transaction(async (tx) => {
    const manifest = await tx.getManifest(page.gameKey);
    if (!manifest || manifest.releaseVersion !== page.fromReleaseVersion) {
      throw new SnapshotRequiredError("base_release_unknown");
    }
    if (manifest.catalogChecksum !== page.baseCatalogChecksum) {
      throw new SnapshotRequiredError("base_checksum_mismatch");
    }

    for (const operation of page.operations.sort((a, b) => a.sequence - b.sequence)) {
      if (await tx.hasAppliedOperation(operation.operationId)) continue;

      if (operation.type === "question_upsert") {
        await tx.upsertSafeQuestion(operation.record);
      } else {
        await tx.tombstoneQuestion({
          questionId: operation.questionId,
          gameKey: operation.gameKey,
          retiredRevisionId: operation.retiredRevisionId,
          reason: operation.reason,
          effectiveAt: operation.effectiveAt,
        });
      }
      await tx.markOperationApplied(operation.operationId, operation.sequence);
    }

    // Do not promote the release until the final page completes.
    if (!page.hasMore) {
      const calculatedChecksum = await tx.calculateCatalogChecksum(page.gameKey);
      if (calculatedChecksum !== page.targetCatalogChecksum) {
        throw new SnapshotRequiredError("base_checksum_mismatch");
      }
      await tx.setManifest({
        gameKey: page.gameKey,
        releaseVersion: page.toReleaseVersion,
        catalogChecksum: page.targetCatalogChecksum,
        schemaVersion: page.syncSchemaVersion,
        syncedAt: page.issuedAt,
      });
    }
  });
}
```

The transaction should retain a last-known-good manifest until the target checksum verifies. If any page fails, the client discards the temporary staged catalog and falls back to its previously verified release or requests a clean snapshot.

## 8. Room pack contract: separate from catalog sync

Delta data helps a client render browse surfaces and preflight compatibility. It does **not** authorize a client to choose questions for a room. A room pack is a separate, server-issued, pinned contract.

```ts
export const GetRoomPackInputSchema = z.object({
  roomId: z.number().int().positive(),
});

export const RoomPackResponseSchema = z.object({
  roomId: z.number().int().positive(),
  gameKey: GameKeySchema,
  contentReleaseVersion: ReleaseVersionSchema,
  pinnedAt: IsoTimestampSchema,
  questions: z.array(SafeQuestionRecordSchema),
  currentQuestionIndex: z.number().int().min(0),
  roomState: z.enum(["waiting", "in_progress", "completed"]),
});
```

For active competitive play, `RoomPackResponseSchema.questions` must use a more restrictive `ActiveQuestionPresentation` projection that omits information that could reveal answers. The exact projection is selected by the game adapter.

## 9. Canonical checksum rules

Checksums make corruption and partial application visible. The server must document a canonical serialization that every supported client can reproduce:

1. Sort records by `gameKey`, then `questionId`, then `revisionId`.
2. Sort `tags` lexicographically and options by stable `id`.
3. Exclude fields that are expected to vary per request, such as `issuedAt`, `expiresAt`, cursors, and cache TTL.
4. Serialize UTF-8 JSON with deterministic key order.
5. Compute SHA-256 over the serialized byte stream.

The server is the final authority. A client that cannot reproduce a checksum should request a snapshot and log the schema/version mismatch for investigation rather than attempting a field-level repair.

## 10. Required regression cases

| Test | Expected result |
|---|---|
| Upsert then retry same delta page | `operationId` deduplication makes the second application a no-op. |
| Delta applied to wrong base release | Client rejects it and requests snapshot. |
| Retirement arrives after upsert | Tombstone removes item from future selection but preserves local audit metadata. |
| Answer key attempted in delta payload | Zod contract rejects the unexpected server projection in tests. |
| New release published while room is active | New room gets new release; existing room stays pinned. |
| One snapshot page fails checksum | Active catalog remains unchanged; staged snapshot is discarded. |
| Conflict retirement | New game packs exclude the record immediately. |
| Client schema mismatch | Server sends `upgrade_required`; client does not parse incompatible records. |

## 11. Implementation order

1. Add the shared release and revision tables plus a server-only eligibility selector.
2. Implement the safe presentation projection and Zod schemas in a shared TypeScript module.
3. Add `getManifest`, `getDelta`, and `getSnapshot` procedures with contract tests.
4. Implement an IndexedDB-backed client content store with staging, operation idempotency, and checksum verification.
5. Add the server-issued room-pack contract to one game adapter.
6. Instrument release adoption, snapshot fallbacks, delta failures, and checksum mismatches.
7. Only then begin staged migration of existing question tables and content expansion toward the 2,000-question planning target.
