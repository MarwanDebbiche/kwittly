---
paths:
  - "**/*.test.ts"
  - "vitest.config.ts"
---

# Tests (Vitest)

- Two projects in `vitest.config.ts`: `unit` (node: `convex/lib/**`, `src/**`) and `convex` (edge-runtime, `convex/*.test.ts` with `convex-test`).
- Convex tests: `convexTest(schema, modules)` with `modules` from `convex/test.setup.ts` (explicit glob patterns: Vite 8 does not support the extglob from the Convex docs). Logged-in users: `t.withIdentity({ subject: "..." })`. Direct DB access: `t.run(ctx => ...)`.
- Assert errors with `await expect(promise).rejects.toThrowError("message fragment")`.
- Money logic must keep a test proving parts add up to the total; add a case for every rounding or validation bug fixed.
- Vitest stays on v4 (Better Auth's peer dependency).
