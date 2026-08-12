# Social Game Collection Structure

- `client/src/pages/GamesHub.tsx`
  - Existing game catalogue and inline game shell.
  - Adds new game catalogue cards and local, state-driven playable flows.
- `client/src/lib/socialGames.ts`
  - Data-driven game prompts, rounds, validation, completion messages, and safe coordination copy.
- `server/routers.ts`
  - Existing `games.recordGameAnswer` procedure persists only profile-learning signals.
- `server/socialGames.test.ts`
  - Regression coverage for game configuration, completion criteria, and safe public-event handoff text.

## State Flow

`hub → active game → choice/input round → progress update → completion → public-event discovery handoff or hub return`

The collection deliberately uses the existing React interface rather than a full-screen 3D canvas because these are conversation and preference games embedded in a community application, not spatial-action games.
