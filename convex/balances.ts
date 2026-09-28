import { v } from "convex/values";
import { query } from "./_generated/server";
import { settle } from "./lib/money";

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

    const balances = new Map(participants.map((p) => [p._id as string, 0]));
    for (const e of expenses) {
      balances.set(e.paidBy, (balances.get(e.paidBy) ?? 0) + e.amountCents);
      for (const s of e.splits) {
        balances.set(
          s.participantId,
          (balances.get(s.participantId) ?? 0) - s.shareCents,
        );
      }
    }

    return {
      balances: participants.map((p) => ({
        participantId: p._id,
        balanceCents: balances.get(p._id) ?? 0,
      })),
      settlements: settle(balances),
    };
  },
});
