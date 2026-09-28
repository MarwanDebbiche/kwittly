import { v } from "convex/values";
import { query } from "./_generated/server";
import { computeBalances, settle } from "./lib/money";

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group_date", (q) => q.eq("groupId", groupId))
      .collect();

    const balances = computeBalances(
      participants.map((p) => p._id),
      expenses,
    );
    return {
      balances: participants.map((p) => ({
        participantId: p._id,
        balanceCents: balances.get(p._id) ?? 0,
      })),
      settlements: settle(balances),
      totalCents: expenses.reduce((sum, e) => sum + e.amountCents, 0),
    };
  },
});
