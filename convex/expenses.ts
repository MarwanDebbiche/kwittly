import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { splitEqually } from "./lib/money";

export const list = query({
  args: {
    groupId: v.id("groups"),
    // Free filters (the whole point vs Tricount): all optional, combinable.
    paidBy: v.optional(v.id("participants")),
    involving: v.optional(v.id("participants")),
    category: v.optional(v.string()),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { groupId, paidBy, from, to } = args;
    const base = paidBy
      ? ctx.db
          .query("expenses")
          .withIndex("by_group_paidBy", (q) => {
            const r = q.eq("groupId", groupId).eq("paidBy", paidBy);
            if (from !== undefined && to !== undefined)
              return r.gte("date", from).lte("date", to);
            if (from !== undefined) return r.gte("date", from);
            if (to !== undefined) return r.lte("date", to);
            return r;
          })
      : ctx.db.query("expenses").withIndex("by_group_date", (q) => {
          const r = q.eq("groupId", groupId);
          if (from !== undefined && to !== undefined)
            return r.gte("date", from).lte("date", to);
          if (from !== undefined) return r.gte("date", from);
          if (to !== undefined) return r.lte("date", to);
          return r;
        });

    const expenses = await base.order("desc").collect();
    const search = args.search?.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (!args.involving ||
          e.paidBy === args.involving ||
          e.splits.some((s) => s.participantId === args.involving)) &&
        (!args.category || e.category === args.category) &&
        (!search || e.title.toLowerCase().includes(search)),
    );
  },
});

export const add = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    amountCents: v.number(),
    paidBy: v.id("participants"),
    date: v.number(),
    category: v.optional(v.string()),
    splitBetween: v.array(v.id("participants")),
  },
  handler: async (ctx, { splitBetween, ...expense }) => {
    if (!Number.isInteger(expense.amountCents) || expense.amountCents <= 0)
      throw new Error("The amount must be a positive number of cents");
    if (splitBetween.length === 0)
      throw new Error("At least one participant must share the expense");
    const shares = splitEqually(expense.amountCents, splitBetween.length);
    return await ctx.db.insert("expenses", {
      ...expense,
      splits: splitBetween.map((participantId, i) => ({
        participantId,
        shareCents: shares[i],
      })),
    });
  },
});

export const remove = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, { expenseId }) => {
    await ctx.db.delete(expenseId);
  },
});
