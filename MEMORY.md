# Social Game Collection Memory

- The Games Hub already supports inline games with `activeGame` and `gameDone` state, alongside routed multiplayer games.
- `games.recordGameAnswer` accepts a game type, question ID, answer, optional trait key, and optional trait value; new games can reuse it without schema changes.
- Existing game cards intentionally teach Sally about a member’s preferences. New games should preserve that behavior but avoid overly intimate dating language.
- The public-event handoff must remain opt-in and point to shared public discovery rather than direct contact or private-location coordination.
- Visual verification confirms the social game hub is readable at mobile and desktop sizes, with the generated reference image supporting the desktop hero. The four cards fit cleanly in a two-column desktop grid and stack on mobile; global navigation density is an existing shell concern outside this game collection change.
- Completion preview verification confirms the confetti settles above the success title without blocking the sound preference control, selected-preference badges, or primary actions on a 390px-wide mobile screen.
- Member dashboard verification confirms the personal summary, three-stat stack, upcoming-booking empty state, and achievements collection remain legible in a single-column mobile flow. The mobile install prompt is fixed shell chrome and intentionally excluded from dashboard layout judgment.
- Dashboard booking-management verification confirms the full mobile dashboard loads after the server warm-up and the existing no-bookings state remains well structured. The cancellation and new-time controls are conditionally reserved for confirmed upcoming bookings, so they do not appear in an empty-state account.
- Partner impact dashboard verification confirms the aggregate booking, attendance, RSVP-intent, and booking-value cards remain readable at desktop and 375px mobile widths. Venue cards expose only aggregate metrics and an explicit privacy message; the fixed install prompt and dense global mobile navigation are existing shell chrome outside this feature.
