# Kwittly

Shared expense tracker, like Tricount but with free filtering (by payer, by participant, by category, by text).

Stack: [TanStack Start](https://tanstack.com/start) (React 19, Vite, file-based routing, SSR) + Tailwind 4, backend on [Convex](https://convex.dev) (realtime by default).

## Environments

| Environment | Frontend | Convex deployment | Deployed by |
|---|---|---|---|
| local | `npm run dev` (server runs in workerd) | local deployment on your machine | `npx convex dev` |
| dev | `kwittly-dev.<subdomain>.workers.dev` | cloud dev deployment | GitHub Actions, on every push to `main` |
| prod | later | production deployment | later, manual workflow |

## Getting started

```bash
npm install
npx convex login
npx convex dev --configure existing --dev-deployment local   # first time only: pick the kwittly project
npm run dev                                                   # app on http://localhost:5173
```

Afterwards `npx convex dev` (or `npm run dev:backend`) is enough. The local deployment keeps local work separate from the deployed dev environment.

Auth needs these Convex environment variables (`npx convex env set NAME value`, add `--deployment <name>` to target another deployment):

- `BETTER_AUTH_SECRET`: random secret (`openssl rand -base64 32`), different per deployment
- `SITE_URL`: app URL, e.g. `http://localhost:5173` locally, the `workers.dev` URL for dev
- `RESEND_API_KEY` (optional locally): without it, login codes are printed in the Convex logs instead of being emailed
- `EMAIL_FROM` (optional): sender, defaults to `Kwittly <onboarding@resend.dev>`

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run preview`.

## Deployment

`.github/workflows/deploy.yml` runs typecheck and lint, then on every push to `main`:

1. `npx convex deploy --cmd 'npm run build'` pushes the Convex functions to the cloud dev deployment and builds the app against it (`CLOUDFLARE_ENV=dev` selects the `dev` environment of `wrangler.jsonc`).
2. `npx wrangler deploy` deploys the `kwittly-dev` worker.

Repository secrets: `CONVEX_DEPLOY_KEY` (development deploy key of the cloud dev deployment), `CLOUDFLARE_API_TOKEN` (account token, "Edit Cloudflare Workers"), `CLOUDFLARE_ACCOUNT_ID`.

## Routes

- `/`: landing page, server-rendered for SEO. Visitors who already have groups in localStorage are redirected to `/groups` (inline script in `__root.tsx` for full page loads, `beforeLoad` for client navigations).
- `/login`: email + one-time code login (Better Auth `emailOTP` plugin). Accounts are optional.
- `/api/auth/*`: proxies Better Auth to Convex so the session cookie lives on the app domain.
- `/groups`, `/groups/new`, `/g/:groupId`: the app, under the `_app` layout, rendered client-side only (`ssr: false`) because it depends on localStorage and realtime data.

## Layout

- `src/routes/`: TanStack Router file routes (`routeTree.gen.ts` is generated)
- `src/pages/`: page components; `src/group/`: group screen pieces; `src/ui/`: shared UI
- `src/lib/myGroups.ts`: the user's groups, from the account (`memberships` table) when logged in, from localStorage otherwise. Local groups are imported into the account at login. Explicit logout wipes the device; an expired session keeps a cached copy of the account's list.
- `convex/auth.ts`: Better Auth setup (60-day rolling session, 6-digit codes valid 10 minutes); emails sent with Resend (`convex/lib/email.ts`)
- `convex/schema.ts`: tables `groups`, `participants`, `expenses` (amounts in integer cents)
- `convex/expenses.ts`: list with combinable filters, add (equal split), remove
- `convex/balances.ts` + `convex/lib/money.ts`: balances and minimal settlement suggestions
