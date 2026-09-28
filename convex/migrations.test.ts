import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

test("categoriesToKeys converts legacy French categories", async () => {
  const t = convexTest(schema, modules);
  const { groupId, participantIds: [alice] } = await t.mutation(api.groups.create, {
    name: "X", currency: "EUR", participants: ["Alice"],
  });
  await t.run(async (ctx) => {
    for (const category of ["Courses", "Activités", "transport", undefined]) {
      await ctx.db.insert("expenses", {
        groupId, title: String(category), amountCents: 100, paidBy: alice, date: 0, category,
        splits: [{ participantId: alice, shareCents: 100 }],
      });
    }
  });
  expect(await t.mutation(internal.migrations.categoriesToKeys, {})).toEqual({ updated: 2 });
  const categories = (await t.query(api.expenses.list, { groupId })).map((e) => e.category).sort();
  expect(categories).toEqual(["activities", "groceries", "transport", undefined]);
});
