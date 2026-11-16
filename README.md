# Tic-Tac-Toe

The first game for [Game Hub](https://github.com/Kumori1313/game-hub). Phase 2 provides a responsive landing page, shared Supabase client configuration, and GitHub Pages deployment. Guest entry, lobbies, and gameplay are not implemented yet.

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
- `npm run check:backend`: verify local anonymous sign-in, identity, and an empty Data API. Creates one local guest, then signs out; no hosted requests are allowed.

No unit test framework or coverage threshold is configured yet. Database authorization and concurrency tests arrive with the schema and game rules. Never treat a successful build as gameplay validation.

## Deployment

GitHub Actions builds pull requests and deploys `main` to GitHub Pages. Select **GitHub Actions** as the Pages source. Add repository Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the hosted project, using identical values in both repositories. Without them the landing page still builds, with no backend client. Re-run deployment after changing variables.

Published URL: https://kumori1313.github.io/tic-tac-toe/

## Conventions

Use ES modules, two-space indentation, single quotes in JavaScript, and kebab-case file names. Keep source in `src/` and verification scripts in `scripts/`. Dependencies are pinned and lockfiles committed. No formatter or linter is configured.
