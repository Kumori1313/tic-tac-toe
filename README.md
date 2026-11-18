# Tic-Tac-Toe

The first game for [Game Hub](https://github.com/Kumori1313/game-hub). Guest entry is implemented: enter or change a display name, restore your anonymous session, and navigate between the hub and tic-tac-toe. Public lobbies and waiting rooms are implemented in the game site. Two guests can now play a complete match, see the same result, and return to the hub.

## Local development

Requires Node.js 22.12+ and npm. Use Node 22 for parity with CI.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:5174/tic-tac-toe/`. Start both repositories to follow their local links. Production links target the matching GitHub Pages project paths.

## Backend setup

The hub owns the single shared `supabase/` configuration and future SQL migrations. Do not create a second backend for the game. Follow the [hub setup guide](https://github.com/Kumori1313/game-hub/blob/main/docs/phase-2-setup.md) and use the same URL and publishable key in this repository.

Configure `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. These values are bundled into browser code; never supply a secret/service-role key. Both apps use the `game-hub-auth` session storage key. Local dev ports have separate browser storage; shared-origin session handoff must be verified with both production paths.

## Commands and validation

- `npm run dev`: start the local Vite server.
- `npm run build`: produce `dist/` with the `/tic-tac-toe/` base path.
- `npm run preview`: serve the production build locally.
- `npm test`: run guest validation and session-service checks with Node’s built-in test runner.
- `npm run check:backend`: verify local anonymous sign-in, identity, and restricted lobby Data API. Creates one local guest, then signs out; no hosted requests are allowed.

Guest behavior is tested with Node’s built-in runner; no coverage threshold is configured. The hub’s local API integration tests cover lobby/move authorization, all win lines, draws, duplicate submissions, and concurrent writes. Never treat a successful build as gameplay validation.

## Deployment

GitHub Actions builds pull requests and deploys `main` to GitHub Pages. Select **GitHub Actions** as the Pages source. Add repository Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the hosted project, using identical values in both repositories. Without them the landing page still builds, with no backend client. Re-run deployment after changing variables.

Published URL: https://kumori1313.github.io/tic-tac-toe/

## Conventions

Use ES modules, two-space indentation, single quotes in JavaScript, and kebab-case file names. Keep source in `src/` and verification scripts in `scripts/`. Dependencies are pinned and lockfiles committed. No formatter or linter is configured.

## Guest identity contract

Both sites use the same Supabase project and `game-hub-auth` browser storage key. Display names are trimmed, limited to 24 Unicode code points, and saved in Auth `user_metadata.display_name` alongside the guest UUID. Names are untrusted labels, never authorization claims. User-visible names are rendered with `textContent`.

Production navigation uses the two project paths on the same origin, so the session survives navigation. Different local dev ports do not share browser storage. Clearing site data or switching devices loses the guest identity; a missing session prompts for entry again. Network failures preserve saved sessions and entered names.

## Visual design and themes

The shared visual language uses original SVG artwork (`public/art/playfield.svg`), a plum mission banner, editorial typography, and a desktop side illustration. Semantic color tokens in `src/style.css` support both themes. Dark is the first-visit default, even when the operating system prefers light. The navigation toggle saves `dark` or `light` under the origin-wide `game-hub-theme` key, which is independent of guest identity.

A small inline head script selects the saved theme before paint. If storage is unavailable, dark remains the default and the toggle still works for the current page. `src/theme.js` also synchronizes other tabs. `src/illustration.js` updates the preview only in response to scroll or guest progress and while visible; reduced-motion mode displays a static final board. There is no autonomous animation loop. During an actual match the decorative preview is hidden and the playable board takes the main column.

The hub’s [component guide](https://github.com/Kumori1313/game-hub/blob/main/docs/ui-components.md) documents matching styles, future screen sketches, and verification. Keep shared presentation files aligned across repositories until they are extracted into a package.

## Public lobbies

The tic-tac-toe site supports public discovery, creating/joining/leaving two-player rooms, host-only start, refresh recovery, connection feedback, and interruption. Started matches show a synchronized board with server-validated turns and results. See the [lobby contract](https://github.com/Kumori1313/game-hub/blob/main/docs/lobby-contract.md) for API permissions, the 90-second lease, scheduled cleanup, and the seven-day retention policy.

## Backend security

The shared backend now validates moves and results transactionally; the playable board renders confirmed state. See the [hub security review](https://github.com/Kumori1313/game-hub/blob/main/docs/security-review.md) for the access model, limits, and local integration tests. Browser builds enforce a generated CSP and reject private credentials in frontend settings.

## Playing and testing

Select an empty cell on your turn. X moves first. Pending requests lock the board; refresh or reconnect restores confirmed state without replaying a move. Wins highlight three cells, draws lock the full board, and leaving during play interrupts it without awarding a result. After a match, return to the hub or lobbies and create/join a new room to play again. There is no rematch/reset control.

The [gameplay contract](https://github.com/Kumori1313/game-hub/blob/main/docs/gameplay-contract.md) documents synchronization, accessible controls, recovery, retention, and the hub’s complete browser suite.

## Release operations

Run the hub’s `test:release` command with `GAME_SITE_DIR` pointing here. The [release runbook](https://github.com/Kumori1313/game-hub/blob/main/docs/release-runbook.md) covers deployment, rollback, monitoring, and cleanup; the [playtest guide](https://github.com/Kumori1313/game-hub/blob/main/docs/playtest-guide.md) covers real-device/group validation.

## Shared rooms (milestone 8.1)

Rooms can be public or code-only. Tic-tac-toe retains two seats; the poker lobby preview supports host-selected capacity from two to six. Completed tic-tac-toe games offer a rematch when both connected players agree. The initial X player is random, and rematches swap marks independently of hosting.

The hub’s [shared room contract](https://github.com/Kumori1313/game-hub/blob/main/docs/shared-room-contract.md) documents the versioned API, previous-client compatibility, private codes, and round safety. Release checks now require both `GAME_SITE_DIR` and `POKER_SITE_DIR`, and verify all three repositories.
