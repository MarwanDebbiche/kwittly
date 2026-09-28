# Kwittly

Shared expense tracker, like Tricount but with free filtering (by payer, by participant, by category, by text).

Stack: [TanStack Start](https://tanstack.com/start) (React 19, Vite, file-based routing, SSR) + Tailwind 4, backend on [Convex](https://convex.dev) (realtime by default).

## Getting started

```bash
npm install
npm run dev:backend   # Convex: run `npx convex login` first to link a cloud project
npm run dev           # app on http://localhost:5173
```

Without a Convex account, `CONVEX_AGENT_MODE=anonymous npx convex dev` runs a local backend on port 3210.

Auth needs these Convex environment variables (`npx convex env set NAME value`):

- `BETTER_AUTH_SECRET`: random secret (`openssl rand -base64 32`)
- `SITE_URL`: app URL, e.g. `http://localhost:5173`
- `RESEND_API_KEY` (optional in dev): without it, login codes are printed in the Convex logs instead of being emailed
- `EMAIL_FROM` (optional): sender, defaults to `Kwittly <onboarding@resend.dev>`

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run preview`.

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
