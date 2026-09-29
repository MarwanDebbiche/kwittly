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
npm run dev:all                                               # Convex + app on http://localhost:5173
```

`npm run dev:all` runs the Convex backend and the app in one terminal. They can also be run separately with `npm run dev:backend` and `npm run dev`. The local deployment keeps local work separate from the deployed dev environment.

Auth needs these Convex environment variables (`npx convex env set NAME value`, add `--deployment <name>` to target another deployment):

- `BETTER_AUTH_SECRET`: random secret (`openssl rand -base64 32`), different per deployment
- `SITE_URL`: app URL, e.g. `http://localhost:5173` locally, the `workers.dev` URL for dev
- `RESEND_API_KEY` (optional locally): without it, login codes are printed in the Convex logs instead of being emailed
- `EMAIL_FROM` (optional): sender, defaults to `Kwittly <onboarding@resend.dev>`

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run preview`.

## Tests

`npm test` (or `npm run test:watch`), with [Vitest](https://vitest.dev). Run in CI before every deploy.

- `unit` project: pure logic (`convex/lib/*.test.ts`, `src/**/*.test.ts`): splits and rounding, balances and settlements, language resolution, amount parsing.
- `convex` project: Convex queries and mutations (`convex/*.test.ts`) against an in-memory backend with [convex-test](https://docs.convex.dev/testing/convex-test), including logged-in users (`t.withIdentity`). No deployment needed.

## Deployment

`.github/workflows/deploy.yml` runs typecheck, lint, tests and the translation check, then on every push to `main`:

1. `npx convex deploy --cmd 'npm run build'` pushes the Convex functions to the cloud dev deployment and builds the app against it (`CLOUDFLARE_ENV=dev` selects the `dev` environment of `wrangler.jsonc`).
2. `npx wrangler deploy` deploys the `kwittly-dev` worker.

Repository secrets: `CONVEX_DEPLOY_KEY` (development deploy key of the cloud dev deployment), `CLOUDFLARE_API_TOKEN` (account token, "Edit Cloudflare Workers"), `CLOUDFLARE_ACCOUNT_ID`.

## Languages

English (source) and French, with [Lingui](https://lingui.dev) v6. Strings live in the code in English (`t`...``, `<Trans>`, `msg`...``); French is in `src/locales/fr/messages.po`.

- After adding or changing strings: `npm run i18n:extract`, then fill the new `msgstr` entries in the French catalog. `npm run i18n:check` (run in CI) and the build fail if a translation is missing.
- Language of a request: `locale` cookie (set by the language switcher), else the browser's `Accept-Language`, else English. Resolved on the server and passed to the browser through `<html lang>`, so both render the same text. One Lingui instance per router, so per request on the server.
- Dates are rendered in the browser's time zone, remembered in a `tz` cookie so the server can use it too (UTC on a first visit).
- Link previews of a group use the group's language (its creator's language at creation), since they are fetched by the messaging app's servers.
- Login emails use the language of the request, forwarded by the auth proxy to Convex (`convex/lib/email.ts`).

## Routes

- `/`: landing page, server-rendered for SEO. Visitors who already have groups in localStorage are redirected to `/groups` (inline script in `__root.tsx` for full page loads, `beforeLoad` for client navigations).
- `/login`: email + one-time code login (Better Auth `emailOTP` plugin). Accounts are optional.
- `/api/auth/*`: proxies Better Auth to Convex so the session cookie lives on the app domain.
- `/manifest.webmanifest`: web app manifest (installable on the home screen). On a group page it starts the installed app on that group, since on iOS the home screen app does not share Safari's storage.
- `/groups`, `/g/:groupId`: server-rendered. Group data is public to anyone with the link and always in the HTML; for logged-in users the `_app` layout also authenticates Convex with the session cookie on the server, so their groups, identity and balances are in the HTML too. Anonymous users' identity lives in localStorage and appears right after hydration. React Query (`@convex-dev/react-query`) then keeps everything live over the Convex WebSocket.
- `/groups/new`, `/login`: rendered in the browser only (`ssr: false`).

## Layout

- `src/routes/`: TanStack Router file routes (`routeTree.gen.ts` is generated)
- `src/pages/`: page components; `src/group/`: group screen pieces; `src/ui/`: shared UI
- `src/lib/myGroups.ts`: the user's groups, from the account (`memberships` table) when logged in, from localStorage otherwise. Local groups are imported into the account at login. Explicit logout wipes the device; an expired session keeps a cached copy of the account's list.
- `convex/auth.ts`: Better Auth setup (60-day rolling session, 6-digit codes valid 10 minutes); emails sent with Resend (`convex/lib/email.ts`)
- `convex/schema.ts`: tables `groups`, `participants`, `expenses` (amounts in integer cents)
- `convex/expenses.ts`: list with combinable filters, add (equal split), remove
- `convex/balances.ts` + `convex/lib/money.ts`: balances and minimal settlement suggestions
