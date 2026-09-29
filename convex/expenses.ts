import { v, type Infer } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { splitByShares } from "./lib/money";

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

/** Who shares the expense, and how. */
export const vSplit = v.union(
  v.object({ mode: v.literal("equal"), participants: v.array(v.id("participants")) }),
  v.object({
    mode: v.literal("shares"),
    shares: v.array(v.object({ participantId: v.id("participants"), shares: v.number() })),
  }),
  v.object({
    mode: v.literal("amounts"),
    amounts: v.array(v.object({ participantId: v.id("participants"), amountCents: v.number() })),
  }),
);
type Split = Infer<typeof vSplit>;

const MAX_SHARES = 1000;

const expenseFields = {
  title: v.string(),
  amountCents: v.number(),
  paidBy: v.id("participants"),
  date: v.number(),
  category: v.optional(v.string()),
  split: vSplit,
};

/** Checks an expense against its group and computes each participant's share. */
async function buildSplits(
  ctx: MutationCtx,
  groupId: Id<"groups">,
  { amountCents, paidBy, split }: { amountCents: number; paidBy: Id<"participants">; split: Split },
) {
  if (!Number.isInteger(amountCents) || amountCents <= 0)
    throw new Error("The amount must be a positive number of cents");

  const entries =
    split.mode === "equal"
      ? split.participants.map((participantId) => ({ participantId, value: 1 }))
      : split.mode === "shares"
        ? split.shares.map(({ participantId, shares }) => ({ participantId, value: shares }))
        : split.amounts.map(({ participantId, amountCents }) => ({ participantId, value: amountCents }));
  if (entries.length === 0)
    throw new Error("At least one participant must share the expense");
  if (new Set(entries.map((e) => e.participantId)).size !== entries.length)
    throw new Error("A participant appears twice in the split");
  if (entries.some((e) => !Number.isInteger(e.value) || e.value <= 0))
    throw new Error("Shares and amounts must be positive integers");
  if (split.mode === "shares" && entries.some((e) => e.value > MAX_SHARES))
    throw new Error(`At most ${MAX_SHARES} shares per participant`);

  for (const participantId of [paidBy, ...entries.map((e) => e.participantId)]) {
    const participant = await ctx.db.get(participantId);
    if (!participant || participant.groupId !== groupId)
      throw new Error("Participant is not in this group");
  }

  if (split.mode === "amounts") {
    const assigned = entries.reduce((sum, e) => sum + e.value, 0);
    if (assigned !== amountCents)
      throw new Error("The amounts must add up to the expense total");
    return {
      splitMode: split.mode,
      splits: entries.map((e) => ({ participantId: e.participantId, shareCents: e.value })),
    };
  }

  const cents = splitByShares(amountCents, entries.map((e) => e.value));
  return {
    splitMode: split.mode,
    splits: entries.map((e, i) => ({
      participantId: e.participantId,
      shareCents: cents[i],
      ...(split.mode === "shares" ? { shares: e.value } : {}),
    })),
  };
}

export const add = mutation({
  args: { groupId: v.id("groups"), ...expenseFields },
  handler: async (ctx, { groupId, split, ...expense }) => {
    const splits = await buildSplits(ctx, groupId, { ...expense, split });
    return await ctx.db.insert("expenses", { groupId, ...expense, ...splits });
  },
});

export const update = mutation({
  args: { expenseId: v.id("expenses"), ...expenseFields },
  handler: async (ctx, { expenseId, split, ...expense }) => {
    const existing = await ctx.db.get(expenseId);
    if (!existing) throw new Error("Expense not found");
    if (existing.kind === "transfer")
      throw new Error("This is a reimbursement, not an expense");
    const splits = await buildSplits(ctx, existing.groupId, { ...expense, split });
    // `category: undefined` clears the field when the category is removed.
    await ctx.db.patch(expenseId, { ...expense, category: expense.category, ...splits });
  },
});

const transferFields = {
  from: v.id("participants"),
  to: v.id("participants"),
  amountCents: v.number(),
  date: v.number(),
};

/**
 * A reimbursement is stored as an expense paid by `from` and owed entirely by
 * `to`, so balances and settlements need no special case.
 */
async function buildTransfer(
  ctx: MutationCtx,
  groupId: Id<"groups">,
  { from, to, amountCents, date }: { from: Id<"participants">; to: Id<"participants">; amountCents: number; date: number },
) {
  if (from === to)
    throw new Error("A reimbursement needs two different participants");
  const splits = await buildSplits(ctx, groupId, {
    amountCents,
    paidBy: from,
    split: { mode: "amounts", amounts: [{ participantId: to, amountCents }] },
  });
  return { kind: "transfer" as const, title: "", amountCents, paidBy: from, date, category: undefined, ...splits };
}

/** Records that `from` paid `to` back. */
export const addTransfer = mutation({
  args: { groupId: v.string(), ...transferFields },
  handler: async (ctx, { groupId: rawGroupId, ...transfer }) => {
    const groupId = ctx.db.normalizeId("groups", rawGroupId);
    if (!groupId || !(await ctx.db.get(groupId)))
      throw new Error("Group not found");
    return await ctx.db.insert("expenses", {
      groupId,
      ...(await buildTransfer(ctx, groupId, transfer)),
    });
  },
});

export const updateTransfer = mutation({
  args: { expenseId: v.id("expenses"), ...transferFields },
  handler: async (ctx, { expenseId, ...transfer }) => {
    const existing = await ctx.db.get(expenseId);
    if (!existing) throw new Error("Expense not found");
    if (existing.kind !== "transfer")
      throw new Error("This is an expense, not a reimbursement");
    await ctx.db.patch(expenseId, await buildTransfer(ctx, existing.groupId, transfer));
  },
});

export const remove = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, { expenseId }) => {
    await ctx.db.delete(expenseId);
  },
});
