import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
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

const expenseFields = {
  title: v.string(),
  amountCents: v.number(),
  paidBy: v.id("participants"),
  date: v.number(),
  category: v.optional(v.string()),
  splitBetween: v.array(v.id("participants")),
};

/** Checks an expense against its group and computes each participant's share. */
async function buildSplits(
  ctx: MutationCtx,
  groupId: Id<"groups">,
  {
    amountCents,
    paidBy,
    splitBetween,
  }: { amountCents: number; paidBy: Id<"participants">; splitBetween: Id<"participants">[] },
) {
  if (!Number.isInteger(amountCents) || amountCents <= 0)
    throw new Error("The amount must be a positive number of cents");
  if (splitBetween.length === 0)
    throw new Error("At least one participant must share the expense");
  for (const participantId of [paidBy, ...splitBetween]) {
    const participant = await ctx.db.get(participantId);
    if (!participant || participant.groupId !== groupId)
      throw new Error("Participant is not in this group");
  }
  const shares = splitEqually(amountCents, splitBetween.length);
  return splitBetween.map((participantId, i) => ({
    participantId,
    shareCents: shares[i],
  }));
}

export const add = mutation({
  args: { groupId: v.id("groups"), ...expenseFields },
  handler: async (ctx, { groupId, splitBetween, ...expense }) => {
    const splits = await buildSplits(ctx, groupId, { ...expense, splitBetween });
    return await ctx.db.insert("expenses", { groupId, ...expense, splits });
  },
});

export const update = mutation({
  args: { expenseId: v.id("expenses"), ...expenseFields },
  handler: async (ctx, { expenseId, splitBetween, ...expense }) => {
    const existing = await ctx.db.get(expenseId);
    if (!existing) throw new Error("Expense not found");
    const splits = await buildSplits(ctx, existing.groupId, { ...expense, splitBetween });
    // `category: undefined` clears the field when the category is removed.
    await ctx.db.patch(expenseId, { ...expense, category: expense.category, splits });
  },
});

export const remove = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, { expenseId }) => {
    await ctx.db.delete(expenseId);
  },
});
