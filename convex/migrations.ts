import { internalMutation } from "./_generated/server";
import { LEGACY_CATEGORY_KEYS } from "./lib/categories";

/** One-off: `npx convex run migrations:categoriesToKeys` on each deployment. */
export const categoriesToKeys = internalMutation({
  args: {},
  handler: async (ctx) => {
    let updated = 0;
    for await (const expense of ctx.db.query("expenses")) {
      const key = expense.category && LEGACY_CATEGORY_KEYS[expense.category];
      if (key) {
        await ctx.db.patch(expense._id, { category: key });
        updated++;
      }
    }
    return { updated };
  },
});
