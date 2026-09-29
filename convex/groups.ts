import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { isLocale } from "./lib/locale";
import { computeBalances, spentCents } from "./lib/money";

export const create = mutation({
  args: {
    name: v.string(),
    currency: v.string(),
    participants: v.array(v.string()),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, { name, currency, participants, locale }) => {
    if (!name.trim()) throw new Error("A group needs a name");
    if (participants.length === 0)
      throw new Error("A group needs at least one participant");
    const groupId = await ctx.db.insert("groups", {
      name,
      currency,
      locale: isLocale(locale) ? locale : undefined,
    });
    const participantIds = [];
    for (const participant of participants) {
      participantIds.push(
        await ctx.db.insert("participants", { groupId, name: participant }),
      );
    }
    return { groupId, participantIds };
  },
});

// Group ids come from share links and localStorage, so they are accepted as
// plain strings and validated here instead of failing argument validation.
export const get = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const groupId = ctx.db.normalizeId("groups", args.groupId);
    const group = groupId && (await ctx.db.get(groupId));
    if (!group) return null;
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .collect();
    return { ...group, participants };
  },
});

/** Lightweight overview of the groups saved in the browser, for the home page. */
export const summaries = query({
  args: {
    items: v.array(
      v.object({ groupId: v.string(), me: v.optional(v.string()) }),
    ),
  },
  handler: async (ctx, { items }) => {
    return await Promise.all(
      items.map(async (item) => {
        const groupId = ctx.db.normalizeId("groups", item.groupId);
        const group = groupId && (await ctx.db.get(groupId));
        if (!group) return { groupId: item.groupId, found: false as const };

        const participants = await ctx.db
          .query("participants")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();
        const expenses = await ctx.db
          .query("expenses")
          .withIndex("by_group_date", (q) => q.eq("groupId", group._id))
          .collect();
        const balances = computeBalances(
          participants.map((p) => p._id),
          expenses,
        );

        return {
          groupId: item.groupId,
          found: true as const,
          name: group.name,
          currency: group.currency,
          participants: participants.map((p) => ({ id: p._id, name: p.name })),
          totalCents: spentCents(expenses),
          myBalanceCents:
            item.me !== undefined ? (balances.get(item.me as Id<"participants">) ?? null) : null,
        };
      }),
    );
  },
});

export const addParticipant = mutation({
  args: { groupId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const groupId = ctx.db.normalizeId("groups", args.groupId);
    if (!groupId || !(await ctx.db.get(groupId)))
      throw new Error("Group not found");
    return await ctx.db.insert("participants", {
      groupId,
      name: requireName(args.name),
    });
  },
});

export const renameParticipant = mutation({
  args: { participantId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const participant = await getParticipant(ctx, args.participantId);
    await ctx.db.patch(participant._id, { name: requireName(args.name) });
  },
});

/**
 * Only participants who appear in no expense can be removed: removing someone
 * who paid or owes would silently change everyone else's balance.
 */
export const removeParticipant = mutation({
  args: { participantId: v.string() },
  handler: async (ctx, args) => {
    const participant = await getParticipant(ctx, args.participantId);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_group", (q) => q.eq("groupId", participant.groupId))
      .collect();
    if (participants.length === 1)
      throw new Error("A group needs at least one participant");
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group_date", (q) => q.eq("groupId", participant.groupId))
      .collect();
    if (expenses.some((e) => involves(e, participant._id)))
      throw new Error("This participant appears in expenses");
    await ctx.db.delete(participant._id);
  },
});

async function getParticipant(ctx: MutationCtx, rawId: string) {
  const id = ctx.db.normalizeId("participants", rawId);
  const participant = id && (await ctx.db.get(id));
  if (!participant) throw new Error("Participant not found");
  return participant;
}

function requireName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("A participant needs a name");
  return trimmed;
}

function involves(expense: Doc<"expenses">, participantId: Id<"participants">) {
  return (
    expense.paidBy === participantId ||
    expense.splits.some((s) => s.participantId === participantId)
  );
}
