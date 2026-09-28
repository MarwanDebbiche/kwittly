# Kwittly

Shared expense tracker (Tricount-like, with free filtering). TanStack Start (React 19, SSR) on Cloudflare Workers, Convex backend, Better Auth (email one-time codes), Lingui (English source, French). See README.md for setup and architecture.

## Commands

- `npm run dev:all`: Convex local backend + app on http://localhost:5173 (one terminal). `npm run dev` / `npm run dev:backend` run them separately.
- Before committing, all must pass: `npm run typecheck` (app + `convex/`), `npm run lint`, `npm test`, `npm run i18n:check`. CI runs the same, then deploys.
- `npm run i18n:extract` after adding or changing UI strings, then fill every new `msgstr` in `src/locales/fr/messages.po`.

## Environments

- **local**: Convex local deployment (`.env.local`, `CONVEX_DEPLOYMENT=local:...`). No `RESEND_API_KEY`: login codes are printed in the `convex dev` output.
- **dev**: https://kwittly-dev.marwan-debbiche.workers.dev, cloud dev deployment, deployed by GitHub Actions on every push to `main` (so pushing = deploying dev).
- **prod**: not set up yet (planned: manual workflow, Convex production deployment).
- Each deployment has its own `SITE_URL` (the app's origin, else auth fails with `INVALID_ORIGIN`) and its own `BETTER_AUTH_SECRET`.

## Always

- Money is integer cents everywhere. Split with `splitByShares` / `splitEqually` (`convex/lib/money.ts`): parts always add up to the total.
- Every UI string goes through Lingui. English is the source language; keep French up to date (build fails otherwise).
- Groups are accessed by link, without accounts: any Convex function taking a group id must accept a plain string and validate it (`ctx.db.normalizeId`), and check that participants belong to the group.
- Keep server-rendered HTML and the first browser render identical (see `.claude/rules/frontend.md`): hydration mismatches are silent regressions here.
- Explain the "why" in comments only when it is not obvious from the code; match the surrounding style (no semicolons in `src/`, semicolons in `convex/`).

## Git

- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `ci:`), one logical change per commit, body explaining why.
- This repo commits with the GitHub noreply address (repo-local `user.email`); never change git config globally.
- Run `git status` before `git add -A`: generated or temporary files (`.tanstack/`, `dist/`, `*.bak*`) must not be committed.
- Remote uses the personal SSH alias: `git@github-perso:MarwanDebbiche/kwittly.git`.

## Pitfalls learned the hard way

- **Never edit `.env.local` by hand without a backup**, and never run `npx convex dev --env-file ...` against another deployment: it rewrites `.env.local`. To target another deployment, use `--deployment <name>` on `npx convex env`/`run`.
- **Never change `BETTER_AUTH_SECRET` on a deployment with users** without also deleting its JWKS keys (`npx convex run --component betterAuth adapter:deleteMany '{"input":{"model":"jwks"},"paginationOpts":{"numItems":100,"cursor":null}}'`), otherwise every token request fails with "Failed to decrypt private key". Everyone gets logged out.
- **Vite runs on port 5173 with `strictPort`**: if it is taken, it fails instead of moving (SITE_URL and the Claude preview expect 5173). Don't start a second stack while one is running; check `lsof -ti tcp:5173`.
- **Convex being down must not break pages**: `getToken()` (src/lib/auth-server.ts) returns undefined on failure, prefetches are best-effort, data loaded over the WebSocket shows an error via `useConvexUnreachable()`.
- **iOS zooms into inputs under 16px** and stays zoomed: form controls must stay at 16px or more (base rule in `src/index.css`).
- Visual checks: the Claude browser preview only reads `.claude/launch.json` from the session's starting folder; use the `app (attach)` config when the stack is already running.
