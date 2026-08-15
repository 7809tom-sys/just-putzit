# Product Roadmap: Pick a Plan and the Shared Game Question Library

**Product:** Just Putzit  
**Prepared:** August 15, 2026  
**Status:** Proposed release roadmap  

## Product decision

> **Pick a Plan** should be a private, matched-member game that turns a lightweight shared choice into a safe, concrete local-event handoff. It is not a public dating vote and it does not expose either member’s choice until both members have participated.

The feature should be built on a **shared question library** rather than another isolated game-question table. The library will give Just Putzit one governed place to curate reusable questions, track which game formats each prompt supports, exclude unsuitable content, and gradually grow toward approximately **2,000 reviewed prompts**. Existing games should remain functional during migration; the new library is introduced through adapters, not a risky all-at-once replacement.

| Product principle | Product implication |
|---|---|
| Members remain free | Pick a Plan is a free engagement and local-discovery feature, not a paywall.
| Events must be current | Only future, active, geographically relevant events can be offered as plan choices.
| Safety comes first | Only the two participants in an existing eligible match may access, vote in, or reveal a plan.
| Partners never see member identities | Business analytics remain aggregated; individual votes, match data, and profile facts remain private.
| Questions need intentional reuse | One prompt can support several games only when its format, safety rating, and game-specific configuration allow it.

## Current assets to reuse

The first release should extend, not replace, working pieces already in the product. Just Putzit already has matched-member authorization patterns, the private Would You Rather challenge route, current event discovery with date and location filtering, event save/calendar/trip-planning actions, reporting and blocking controls, and a structured Home customization system. The shared library should initially sit beside the existing Would You Rather, Trivia, and Jeopardy/Trivia Pursuit tables, with thin selection adapters introduced game by game.

| Existing capability | Use in this roadmap |
|---|---|
| Match-only Would You Rather challenge guard | Authorization pattern for every Pick a Plan read, vote, and reveal action.
| Current community event records | Candidate pool for plan choices; past or stale records are excluded.
| Activity detail, save, calendar, and Trip Planner actions | Post-agreement handoff rather than a new duplicate planning system.
| Report/block safety controls | Eligibility gate; no game or follow-up action across a blocked connection.
| Existing question tables | Source inventory for migration and temporary adapters.

## Target experience

1. A member opens **Games** from an existing match and selects **Pick a Plan**.
2. The system finds three to five current, public, eligible events near the match’s relevant city or a mutually compatible saved location. It favors free or low-friction community activities and preserves city-level precision.
3. Each member privately selects one event or chooses **Pass for now**. Neither sees the other member’s selection or explanation while voting is open.
4. If both choose the same event, Just Putzit reveals the match and offers **Save event**, **Add to calendar**, **Add to trip**, and a safety-oriented chat prompt. If choices differ, the system offers a neutral next round, not a rejection message.
5. The experience records only the minimum necessary data. Partners can later see aggregated impressions, selections, and plan completions—not identities, profiles, or match details.

## Shared library model

The durable library should be modeled as **content plus eligibility**, not as a single rigid question type. The first implementation needs enough structure to serve games without overengineering editorial tooling.

| Concept | Required fields | Purpose |
|---|---|---|
| `shared_game_questions` | ID, prompt text, prompt type, status, safety tier, audience tier, source/author note, created/updated timestamps | Canonical reviewed prompt record.
| `shared_question_game_configs` | Question ID, game key, eligibility flag, display configuration, scoring/voting mode, ordering weight | Allows one prompt to support different games with game-specific behavior.
| `shared_question_tags` | Question ID, tag | Supports topics such as food, outdoors, local, fitness, values, music, family-friendly, and low-pressure social.
| `shared_question_localization` | Question ID, locale/city scope, replacement text or constraints | Supports genuinely local prompts without falsely treating a national prompt as local knowledge.
| `shared_question_usage` | Question ID, game key, anonymous session reference, shown/answered timestamps | Limits repetition, supports balancing, and does not store unnecessary member-profile detail.
| `question_editorial_reviews` | Question ID, reviewer/admin ID, status, rationale, reviewed timestamp | Provides a durable moderation trail for prompts added at scale.

The initial prompt types should be limited to formats already needed by existing games: **binary choice**, **multiple choice**, **open icebreaker**, **collaborative planning**, and **knowledge/trivia**. A question becomes playable only if it is active, reviewed, age-appropriate for the game surface, tagged for that game, and not recently overused for the member or match.

### Safety and editorial rules

The library must reject prompts that pressure members to disclose sensitive identity, finances, medical facts, home address, workplace location, sexual content, political affiliation, trauma, or contact information. Romantic material must remain clearly opt-in and use the same profile and matching boundaries as the rest of Just Putzit. Prompts for friendship, family, fitness, and community surfaces need distinct game eligibility settings.

Each prompt must carry an editorial source value such as **staff-curated**, **partner-suggested**, or **member-submitted—approved**. Member suggestions should never be published automatically. This preserves the distinction between a content catalog and user-generated claims or testimonials.

## Phased delivery plan

### Phase 0 — Foundation and inventory

**Objective:** Establish the technical and editorial baseline before moving any working game.

The team inventories every existing question source: Would You Rather, Trivia, the shared Jeopardy/Trivia Pursuit pool, static game copy, and future-plan candidates. Each source is mapped to a target prompt type, game eligibility set, safety tier, and migration status. The team also writes a short editorial rubric and an internal question-review checklist.

**Exit criteria:** The inventory identifies no question table or client-side prompt source that is silently omitted; migration adapters are defined; and the editorial rubric is approved before new bulk content is added.

### Phase 1 — Shared library v1

**Objective:** Ship the governed core without interrupting existing play.

Create the shared-library tables, unique and lookup indexes, server-side selection helper, admin-only review procedure, and a small internal content-management view. Build adapters that can read existing game tables while shared-library coverage grows. The first adapter should be Would You Rather because its format is simple, its existing security model is mature, and it already supports matched-member play.

**Exit criteria:** A server helper can return only active, eligible, reviewed prompts for a named game; selection avoids recently shown items; and the existing solo and matched Would You Rather flows stay regression-tested.

### Phase 2 — Catalog growth to 2,000 reviewed prompts

**Objective:** Scale content quality deliberately rather than insert a one-time unreviewed bulk dump.

Build the catalog in staged editorial batches. A suggested distribution is shown below; it is a planning target rather than a fabricated claim that the content already exists.

| Catalog area | Target prompts | Primary game uses |
|---|---:|---|
| Light social and icebreakers | 350 | Story Swap, Three Things in Common, finish-the-sentence formats |
| Would You Rather and This-or-That choices | 350 | Solo play, match challenges, local preference prompts |
| General knowledge and local trivia | 400 | Trivia, Jeopardy, Trivia Pursuit, city games |
| Community, culture, food, and outdoors | 250 | Local Trivia Duel, Pick a Plan preference rounds |
| Fitness, hobbies, and goal-oriented prompts | 200 | Gym Buddy, Team-Up Challenge, profile enrichment |
| Collaborative planning and low-pressure social choices | 250 | Pick a Plan, date-night/friendship planning, family activities |
| Seasonal and partner-sponsorable prompts | 100 | Optional event campaigns and community programming |
| Editorial reserve and replacements | 100 | Rotation, retirement, and quality fixes |
| **Total planned reviewed catalog** | **2,000** | **Shared use with game-specific eligibility** |

Every batch should pass duplicate detection, content-policy checks, readability checks, game-format validation, and human editorial review before activation. The catalog should start with a smaller reviewed production set—for example 150 to 250 prompts—then expand in repeatable batches. No generated content should be placed directly into production without review.

**Exit criteria:** The catalog has a documented count by game and safety tier, every active prompt has at least one permitted game configuration, and no game relies solely on an unreviewed bulk import.

### Phase 3 — Pick a Plan MVP

**Objective:** Convert current event discovery into a private, matched-member microgame.

The MVP uses existing future community-event records. A creator chooses an existing match; the server confirms that both users are the exact participants in an active eligible match and confirms no relevant block exists. The system builds a constrained candidate set from current events in the selected city/radius. It must not create candidate events from stale content, incomplete dates, or nonpublic venues.

The creator can select a planning lens such as **coffee and conversation**, **music or performing arts**, **outdoors**, **food**, **fitness**, **community service**, or **surprise me**. This lens is implemented as a shared-library collaborative-planning prompt plus event eligibility rules, rather than as hardcoded client text. Each participant gets the same candidate event IDs and casts one private vote or passes.

| MVP state | Member-visible behavior | Server requirement |
|---|---|---|
| `pending` | Invitation can be opened by only the two match participants | Verify match pair and block status before every read.
| `voting` | Each participant sees current events and a private vote control | Persist one valid vote per user; do not reveal the partner selection.
| `matched` | Shared event is revealed with calendar/save/trip actions | Reveal only after mutual selection of the same eligible event.
| `different_choices` | Offer a neutral new round or respectful pass | Do not frame disagreement as a rejection or expose individual choices.
| `expired` | Offer current choices again | Invalidate if selected event becomes past, cancelled, or unavailable.

**Exit criteria:** Pick a Plan has a match-only route, event freshness filtering, private vote storage, mutual-agreement reveal, safety handoff, clear empty state, and regression coverage for unauthorized access, stale-event exclusion, blocked pairs, and mismatched votes.

### Phase 4 — Handoff and partner value

**Objective:** Make agreement useful without converting it into an unsafe social commitment.

After a mutual match, present three clear next actions: save the event, add it to a calendar, or add it to a Trip Planner itinerary. A fourth action can open the existing match chat with a context-aware but editable message such as: “We both picked [event]. Would you like to coordinate there?” The member remains in control; the system should not automatically RSVP, share a phone number, disclose real-time location, or create a meeting commitment.

For partner reporting, add only aggregated measurements: candidate impressions, mutual selections, calendar intents, and outbound partner-link clicks, segmented by date range and broad city. Apply minimum cohort thresholds before displaying any demographic breakout. Do not reveal member names, exact ages, profiles, or the identity of two people who selected the same event.

**Exit criteria:** Every mutual plan has at least one safe next action; no action creates a booking or communication without the member choosing it; and partner reporting remains aggregate-only.

### Phase 5 — Rollout and learning loop

**Objective:** Prove product usefulness before expanding feature complexity or monetization.

Roll out first to a limited set of active markets with dependable event freshness, such as Milwaukee and Waukesha, then expand to cities where current source health is verified. Monitor operational metrics weekly and review qualitative feedback through existing reporting pathways. Prioritize source reliability, mutual-vote completion, safe handoff use, and report/block signals over raw game starts.

| Metric | Healthy early signal | Guardrail |
|---|---|---|
| Invitation acceptance | Members open and begin voting | No pressure notifications after a pass or ignored invite.
| Mutual selection rate | A meaningful share of active rounds reaches a shared event | Do not count a one-sided vote as engagement success.
| Event freshness | Nearly all shown candidates remain future and active | Immediately remove stale/cancelled items from candidates.
| Handoff conversion | Members choose save, calendar, trip, or optional chat after a match | Never auto-create bookings or meetings.
| Safety health | Low report/block rate and fast moderation response | Pause a rollout cohort if safety signals increase materially.
| Partner value | Aggregate impressions and mutual-plan actions | Enforce minimum cohorts and no identity disclosure.

## Release gates

The following gates prevent content volume or revenue pressure from outrunning safety and product quality.

1. **Content gate:** No prompt is active until it has game eligibility, a safety tier, and editorial approval.
2. **Event gate:** No event is eligible for Pick a Plan unless it has a valid future date, public-access status, a source URL, and city/location data sufficient for member display.
3. **Authorization gate:** All reads, invitations, votes, and reveals are server-authorized against the exact current match pair and block status.
4. **Privacy gate:** Individual member and match data never enters partner reports; aggregate thresholds are mandatory.
5. **Operational gate:** Every new event source is tracked for healthy, empty, or failed status. Empty or undated sources do not create placeholder events.
6. **Monetization gate:** Sponsored event eligibility may be added only after the organic experience works, is clearly labeled, and preserves relevance and event-quality rules.

## Delivery sequence

The recommended sequence is to complete Phase 0 and Phase 1 first, then release a small curated catalog and Pick a Plan MVP before attempting the full 2,000-question target. This gives the product a usable, safe core and lets editorial standards mature with real usage. The large catalog becomes an ongoing content operation, not a launch blocker.

| Delivery increment | Primary outcome | Do not include yet |
|---|---|---|
| Increment 1 | Shared-library schema, selection helper, editorial rubric, WYR adapter | Bulk 2,000 import or paid content packs |
| Increment 2 | Reviewed starter catalog and admin content review | Public member submissions without approval |
| Increment 3 | Pick a Plan private voting and mutual event reveal | Automatic booking, location sharing, or public votes |
| Increment 4 | Calendar/trip/chat handoff and aggregate partner measurement | Person-level partner data or opaque sponsored placement |
| Increment 5 | City-by-city rollout and structured catalog expansion | New-market launch with unverified event freshness |

## Immediate next build decisions

The next engineering step is to define the shared-library schema and adapter contract while keeping existing game tables untouched. In parallel, product and editorial owners should approve the question rubric and the initial Pick a Plan lenses. After those are in place, the team can implement the smallest safe MVP: one matched pair, three current event candidates, one private vote per member, a mutual reveal, and existing calendar/save/trip actions.
