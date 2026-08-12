# Social Game Collection Memory

- The Games Hub already supports inline games with `activeGame` and `gameDone` state, alongside routed multiplayer games.
- `games.recordGameAnswer` accepts a game type, question ID, answer, optional trait key, and optional trait value; new games can reuse it without schema changes.
- Existing game cards intentionally teach Sally about a member’s preferences. New games should preserve that behavior but avoid overly intimate dating language.
- The public-event handoff must remain opt-in and point to shared public discovery rather than direct contact or private-location coordination.
- Visual verification confirms the social game hub is readable at mobile and desktop sizes, with the generated reference image supporting the desktop hero. The four cards fit cleanly in a two-column desktop grid and stack on mobile; global navigation density is an existing shell concern outside this game collection change.
- Completion preview verification confirms the confetti settles above the success title without blocking the sound preference control, selected-preference badges, or primary actions on a 390px-wide mobile screen.
