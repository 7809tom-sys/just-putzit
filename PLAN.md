# Game Plan: Just Putzit Social Game Collection

## Main Build

Build four short, mobile-first social games inside the existing Games Hub: **Local Legend**, **Plan the Perfect Saturday**, **Three Things in Common**, and **Would You Join Me?** Each game must offer a complete start-to-finish interaction, save meaningful preference signals through the existing game-answer procedure, and end with a safe, public-event next step.

- **Risk:** The existing Games Hub mixes routable games and inline games, so new cards must use the established inline active-game state without breaking existing routes.
- **Approach:** Use data-driven question/choice content and a small shared game-flow state model inside the React hub. Persist only profile-relevant responses through `games.recordGameAnswer`; keep momentary scoring and progress client-side.
- **Safe handoff:** The coordination game never exposes private addresses or direct-contact pressure. Its completion state links members to browse public local activities and explains that plans should start in a public place.
- **Assets needed:** A warm, mobile-first social game hub visual reference with local-landmark, planning, common-ground, and public-event safety motifs.
- **Verify:**
  - Every new game card opens a playable flow and can reach a completion state.
  - Every interaction has a visible selection/progress response and mobile-safe layout.
  - Completion makes a clear public-event discovery handoff available.
  - The Games Hub retains its existing game routes and no new browser console errors appear.
  - The palette, rounded card density, and community-first visual language match the art reference.
