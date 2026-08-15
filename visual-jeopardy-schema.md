# Sample Schema: Visual Jeopardy Questions

**Purpose:** Support image-based Jeopardy clues without treating a generic photo URL or an unverified Bulgar Dash caption as a game-ready fact. The model separates the **visual asset** from the **reviewed game clue**, so one licensed image can support multiple fair, source-backed questions.

## Design principles

> A Visual Jeopardy clue is publishable only when its image provenance, license state, visible or source-backed fact, canonical answer, accepted answer variants, and editorial approval are all present.

The image file itself should live in S3, not in the database. The database stores the stable storage key, source link, license terms, required credit, and review trail. The original source URL remains on the record even when Just Putzit stores an approved derivative or resized display copy.

| Entity | Responsibility |
|---|---|
| `visual_game_assets` | Image provenance, licensing, attribution, storage location, accessibility text, and editorial verification state. |
| `visual_jeopardy_questions` | A specific clue, answer set, category, value, difficulty, and review status linked to one approved visual asset. |
| `shared_game_questions` *(planned)* | The parent reusable question record used by Pick a Plan and other game types. `visual_jeopardy_questions` can link to it once the shared library is implemented. |

## Drizzle sample

```ts
import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Source and rights record. One approved image can support many visual clues.
export const visualGameAssets = mysqlTable("visual_game_assets", {
  id: int("id").autoincrement().primaryKey(),

  // Just Putzit's stored, display-safe derivative. Asset bytes remain in S3.
  storageKey: varchar("storage_key", { length: 512 }).notNull().unique(),
  displayUrl: text("display_url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  widthPx: int("width_px").notNull(),
  heightPx: int("height_px").notNull(),
  altText: varchar("alt_text", { length: 500 }).notNull(),

  // Origin and rights: enough information to reproduce the credit accurately.
  sourcePageUrl: text("source_page_url").notNull(),
  sourceAssetUrl: text("source_asset_url"),
  sourceTitle: varchar("source_title", { length: 300 }).notNull(),
  sourcePublisher: varchar("source_publisher", { length: 200 }),
  creatorName: varchar("creator_name", { length: 200 }),
  copyrightHolder: varchar("copyright_holder", { length: 200 }),
  sourceRetrievedAt: timestamp("source_retrieved_at").notNull(),
  sourcePublishedAt: timestamp("source_published_at"),

  // Do not constrain license values to a short enum. Store the exact supplied term.
  licenseName: varchar("license_name", { length: 200 }).notNull(),
  licenseUrl: text("license_url"),
  attributionText: text("attribution_text").notNull(),
  attributionRequired: boolean("attribution_required").notNull().default(true),
  derivativeUseAllowed: boolean("derivative_use_allowed").notNull().default(false),
  commercialUseAllowed: boolean("commercial_use_allowed").notNull().default(false),
  shareAlikeRequired: boolean("share_alike_required").notNull().default(false),

  // A conflict state prevents automatic publishing when facts or rights are uncertain.
  rightsStatus: mysqlEnum("rights_status", [
    "unverified",
    "verified",
    "restricted",
    "expired",
    "conflict",
  ]).notNull().default("unverified"),
  rightsVerifiedByUserId: int("rights_verified_by_user_id"),
  rightsVerifiedAt: timestamp("rights_verified_at"),
  rightsReviewNotes: text("rights_review_notes"),

  status: mysqlEnum("status", ["draft", "approved", "retired", "conflict"])
    .notNull()
    .default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// A reviewed, answerable clue. A visual asset can have many clues at different values.
export const visualJeopardyQuestions = mysqlTable("visual_jeopardy_questions", {
  id: int("id").autoincrement().primaryKey(),
  visualAssetId: int("visual_asset_id").notNull(),

  // Link later when shared_game_questions is introduced; keep nullable for safe migration.
  sharedQuestionId: int("shared_question_id"),
  categoryId: int("category_id").notNull(),
  categoryLabel: varchar("category_label", { length: 100 }).notNull(),
  value: int("value").notNull().default(400),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"])
    .notNull()
    .default("medium"),

  // The clue must identify a fact, not reuse an unverified story caption.
  clueText: text("clue_text").notNull(),
  canonicalAnswer: varchar("canonical_answer", { length: 300 }).notNull(),
  acceptedAnswers: json("accepted_answers").$type<string[]>().notNull(),
  answerExplanation: text("answer_explanation").notNull(),
  answerCaseSensitive: boolean("answer_case_sensitive").notNull().default(false),
  answerSourceUrl: text("answer_source_url").notNull(),
  answerSourceQuote: text("answer_source_quote"),

  // Rendering metadata. The UI must show credit when attributionRequired is true.
  cropFocusX: int("crop_focus_x"),
  cropFocusY: int("crop_focus_y"),
  imageCreditLabel: varchar("image_credit_label", { length: 500 }).notNull(),
  showCreditInGame: boolean("show_credit_in_game").notNull().default(true),
  accessibilityDescription: varchar("accessibility_description", { length: 500 }).notNull(),

  // Editorial control. `conflict` is a hard no-publish state.
  editorialStatus: mysqlEnum("editorial_status", [
    "draft",
    "in_review",
    "approved",
    "rejected",
    "retired",
    "conflict",
  ]).notNull().default("draft"),
  factStatus: mysqlEnum("fact_status", [
    "unverified",
    "verified",
    "conflict",
  ]).notNull().default("unverified"),
  reviewedByUserId: int("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  reviewerNotes: text("reviewer_notes"),

  // Selection and maintenance controls.
  isActive: boolean("is_active").notNull().default(false),
  usageWeight: int("usage_weight").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```

## Required publish rule

The server-side question selector should return a Visual Jeopardy clue only when all of the following are true:

```ts
asset.status === "approved" &&
asset.rightsStatus === "verified" &&
question.editorialStatus === "approved" &&
question.factStatus === "verified" &&
question.isActive === true &&
question.clueText.length > 0 &&
question.canonicalAnswer.length > 0 &&
question.acceptedAnswers.length > 0 &&
question.answerSourceUrl.length > 0
```

If either `rightsStatus` or `factStatus` is `conflict`, the asset or clue must be withheld from selection even if another field was previously approved. This prevents a rights question or disputed fact from becoming a live game prompt by accident.

## Example: converting a Bulgar Dash image safely

The following record structure illustrates the **shape** of an approved visual clue. It does not assert that any existing Bulgar Dash record is already approved.

```ts
const exampleVisualClue = {
  visualAsset: {
    sourceTitle: "Good Food Display — NCI Visuals Online",
    sourcePublisher: "National Cancer Institute",
    licenseName: "Public domain / U.S. federal government work",
    attributionText: "Image: National Cancer Institute, via Wikimedia Commons",
    rightsStatus: "verified",
    status: "approved",
  },
  question: {
    categoryLabel: "Food & Health",
    value: 400,
    clueText: "This display from a U.S. health agency illustrates what broad kind of meal?",
    canonicalAnswer: "A balanced meal",
    acceptedAnswers: ["balanced meal", "healthy meal", "balanced diet"],
    answerExplanation: "The cited source describes the image as a display of healthy foods.",
    editorialStatus: "approved",
    factStatus: "verified",
    isActive: true,
  },
};
```

## Implementation notes

| Rule | Reason |
|---|---|
| Store `sourcePageUrl` and `answerSourceUrl` separately | The rights source and the factual answer source may be different pages. |
| Store exact license text plus a license URL | “Wikimedia” alone is not a license and does not define commercial or attribution terms. |
| Keep `acceptedAnswers` separate from `canonicalAnswer` | Players should receive credit for valid word-order, synonym, or article variations. |
| Render the required credit with the image | Attribution should be visible at play time, not buried in an admin record. |
| Require `altText` and `accessibilityDescription` | The visual clue must not be inaccessible to members using assistive technology. |
| Use `conflict` statuses | When rights or factual evidence is uncertain, the question stays out of production until resolved. |
| Do not infer answer facts from a Bulgar Dash story caption | The caption is part of a bluffing game; Visual Jeopardy needs independently sourced facts. |

## Suggested first migration scope

Start with the two new tables only and leave the current `game_questions` table untouched. Once the shared question library is implemented, add `sharedQuestionId` as a foreign key-equivalent application relationship and write an adapter that creates a Jeopardy board from only approved visual clues. This staged approach avoids breaking current Jeopardy or Trivia Pursuit play while the visual editorial workflow is proven.
