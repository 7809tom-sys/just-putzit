# Shared Question Library: Editorial Intake Playbook

## Purpose

The shared library will grow toward 2,000 prompts through **staged editorial intake**, not automatic publication. A question is reusable only when its format, audience, answer model, and rights status are clear. The library’s `draft → approved → published → retired` state is the controlling publication path; games may request only published questions that are explicitly targeted to their format.

## Initial Taxonomy

| Family | Formats | Initial target games | Editorial rules |
|---|---|---|---|
| Light preferences | Would You Rather | Would You Rather | Two balanced, non-coercive choices; no sensitive inference from the answer. |
| General knowledge | Multiple choice | Trivia, Trivia Pursuit | One documented correct answer; four plausible answer options; no ambiguous wording. |
| Culture and local history | Free response, visual | Jeopardy | A verifiable answer source and accepted-answer variants are mandatory. |
| Image-based knowledge | Visual | Jeopardy, Trivia | Source URL, license, attribution, alt text, and objective answer are mandatory. |
| Conversation starters | Free response | Bulger Dash, future social games | No personal data request, sexualized framing, harassment, or pressure to disclose. |
| Activity planning | Free response | Pick a Plan | A question must never replace the current public-event and mutual-vote safeguards. |

## Editorial Workflow

| Status | Who can set it | What it means | Eligible for live games |
|---|---|---|---|
| `draft` | Authorized administrator | Intake record has not completed review. | No |
| `approved` | Authorized administrator | Content, format, rights, and answer validity have passed review. | No |
| `published` | Authorized administrator | The question is approved, game-targeted, and ready for client-safe delivery. | Yes |
| `retired` | Authorized administrator | The question must no longer be selected. Historical game records remain intact. | No |

## Required Review Checks

A reviewer must confirm that the prompt has a clear intended format, an allowed game target, a suitable difficulty level, and no prohibited or exploitative content. Multiple-choice and Jeopardy-style questions require a canonical answer and accepted answer variants on the server. Visual questions additionally require provenance, the exact license, required attribution, image accessibility text, and a source supporting the fact used in the clue.

## Publication Rules

The shared client API intentionally excludes canonical answers and accepted answer variants. A game receives only the prompt, display options, public image details, required attribution, source URL, and game-specific presentation configuration. The game server remains responsible for answer evaluation.

## First Content Release

The first production release should be small and reviewable: 50–100 original or rights-cleared prompts across all supported families. Each batch should be reviewed, published, measured for skips and reports, then expanded. The 2,000-question target is a catalog goal, not a reason to bypass review.
