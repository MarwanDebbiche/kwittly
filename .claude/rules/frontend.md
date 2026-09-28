---
paths:
  - "src/**/*.{ts,tsx}"
  - "vite.config.ts"
---

# Frontend (TanStack Start, React, Lingui)

## SSR and hydration
- Only the first page load is server-rendered; in-app navigation runs route loaders in the browser (data over the Convex WebSocket).
- Never read `window`, `document`, `localStorage` or `navigator` during render. localStorage stores (`createLocalStore`) return the fallback during SSR and hydration.
- Language and time zone come from `usePrefs()` / `useFormatters()` (resolved on the server, passed through `<html lang>` and `data-time-zone`). Never use `navigator.language`, `toLocaleDateString()` without a time zone, or a hard-coded locale.
- Data needed for the first render: fetch it in the route `loader` with `queryClient.ensureQueryData(convexQuery(...))` and read it with `useQuery(convexQuery(...))` using the exact same args (drop undefined keys, see `definedOnly`), so the cache key matches.
- Account data (`memberships.mine`, `users.current`): read with `useAccountQuery`, which keeps the server-rendered value while the browser's Convex auth is still loading.
- Routes that depend on localStorage only set `ssr: false`. One Convex client, QueryClient and Lingui instance per router (per request on the server): never create module-level singletons for them.
- App pages send `Cache-Control: private, no-store` (they can contain personal data).

## i18n (Lingui v6)
- In components: `useLingui()` from `@lingui/react/macro` (`t`...``) and `<Trans>` / `<Plural>`. Never the global `t` from `@lingui/core/macro` in components (it bypasses the per-request instance).
- Module-level strings: `msg`...`` descriptors, rendered with `i18n._(descriptor)`.
- Route titles/meta: `head: ({ match }) => ...match.context.i18n._(msg`...`)`. Group link previews use the group's language (`createI18n(group.locale)`).
- French uses "tu"; English is casual. Brand name: "Kwittly" in text, "kwittly" wordmark (`<Wordmark />`).

## UI conventions
- Tailwind v4 with theme tokens in `src/index.css` (`ink`, `muted`, `line`, `accent`, `owed`, `owe`, `canvas`, `surface`) and component classes (`field`, `btn-primary`, `btn-ghost`, `chip`, `card`, `label`). Reuse them rather than new colors.
- Modals: `Sheet` (bottom sheet on mobile). Secondary actions: `MoreMenu`. Errors: `ErrorState` / root `ErrorPage`.
- Amount inputs: `inputMode="decimal"`, `sanitizeAmountInput` on change, `parseCents` to read. Mobile first: check layouts at 375px wide and in French (longer labels).
