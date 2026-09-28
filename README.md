# splitmate

Shared expense tracker, like Tricount but with free filtering (by payer, by participant, by category, by text).

Stack: Vite + React + TypeScript + Tailwind, backend on [Convex](https://convex.dev) (realtime by default).

## Getting started

```bash
npm install
npm run dev:backend   # Convex: run `npx convex login` first to link a cloud project
npm run dev           # frontend on http://localhost:5173
```

Without a Convex account, `CONVEX_AGENT_MODE=anonymous npx convex dev` runs a local backend on port 3210.

## Layout

- `convex/schema.ts`: tables `groups`, `participants`, `expenses` (amounts in integer cents)
- `convex/expenses.ts`: list with combinable filters, add (equal split), remove
- `convex/balances.ts` + `convex/lib/money.ts`: balances and minimal settlement suggestions
- `src/components/`: UI (create group, expense list + filters, balances)
