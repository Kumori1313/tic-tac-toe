# Tic-Tac-Toe

The first game for [Game Hub](https://github.com/Kumori1313/game-hub). Guest entry is implemented: enter or change a display name, restore your anonymous session, and navigate between the hub and tic-tac-toe. Lobbies and gameplay arrive in later phases.

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
- `npm run check:backend`: verify local anonymous sign-in, identity, and an empty Data API. Creates one local guest, then signs out; no hosted requests are allowed.

Guest behavior is tested with Node’s built-in runner; no coverage threshold is configured. Database authorization and concurrency tests arrive with the schema and game rules. Never treat a successful build as gameplay validation.

## Deployment

GitHub Actions builds pull requests and deploys `main` to GitHub Pages. Select **GitHub Actions** as the Pages source. Add repository Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the hosted project, using identical values in both repositories. Without them the landing page still builds, with no backend client. Re-run deployment after changing variables.

Published URL: https://kumori1313.github.io/tic-tac-toe/

## Conventions

Use ES modules, two-space indentation, single quotes in JavaScript, and kebab-case file names. Keep source in `src/` and verification scripts in `scripts/`. Dependencies are pinned and lockfiles committed. No formatter or linter is configured.

## Guest identity contract

Both sites use the same Supabase project and `game-hub-auth` browser storage key. Display names are trimmed, limited to 24 Unicode code points, and saved in Auth `user_metadata.display_name` alongside the guest UUID. Names are untrusted labels, never authorization claims. User-visible names are rendered with `textContent`.

Production navigation uses the two project paths on the same origin, so the session survives navigation. Different local dev ports do not share browser storage. Clearing site data or switching devices loses the guest identity; a missing session prompts for entry again. Network failures preserve saved sessions and entered names.
