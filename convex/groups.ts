import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isLocale } from "./lib/locale";
import { computeBalances } from "./lib/money";

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
          totalCents: expenses.reduce((sum, e) => sum + e.amountCents, 0),
          myBalanceCents:
            item.me !== undefined ? (balances.get(item.me) ?? null) : null,
        };
      }),
    );
  },
});

export const addParticipant = mutation({
  args: { groupId: v.id("groups"), name: v.string() },
  handler: async (ctx, { groupId, name }) => {
    return await ctx.db.insert("participants", { groupId, name });
  },
});
