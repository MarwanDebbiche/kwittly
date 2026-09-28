---
paths:
  - "convex/**/*.ts"
---

# Convex backend

- Semicolons and double quotes in `convex/` (Convex codegen style). Error messages in English; the UI maps codes to translated text.
- Files with an extra dot (`*.test.ts`, `test.setup.ts`) are ignored by Convex deploys; don't name function modules that way.
- Ids coming from URLs or localStorage: accept `v.string()` and resolve with `ctx.db.normalizeId`, returning null (queries) or ignoring (memberships) instead of throwing on invalid ids.
- Mutations that write expenses validate through `buildSplits` (expenses.ts): positive integer cents, known split mode, unique participants, participants and payer in the expense's group, amounts adding up to the total.
- Auth: the user is `(await ctx.auth.getUserIdentity())?.subject`. Queries depending on the user return null when logged out (the client relies on that); mutations throw "Login required".
- Schema changes: add new fields as `v.optional(...)` so existing documents stay valid; convert old data with an `internalMutation` in `convex/migrations.ts`, run on each deployment with `npx convex run migrations:<name>` (add `--deployment <name>` for cloud dev).
- `convex/lib/` holds pure logic shared with the frontend (money, locale, categories): no Convex imports there, and unit tests next to it.
- Login emails are built in `convex/lib/email.ts` (both languages, strings there, not in Lingui).
