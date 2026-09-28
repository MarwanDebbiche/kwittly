import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    currency: v.string(),
    participants: v.array(v.string()),
  },
  handler: async (ctx, { name, currency, participants }) => {
    const groupId = await ctx.db.insert("groups", { name, currency });
    for (const participant of participants) {
      await ctx.db.insert("participants", { groupId, name: participant });
    }
    return groupId;
  },
});

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const group = await ctx.db.get(groupId);
    if (!group) return null;
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    return { ...group, participants };
  },
});

export const addParticipant = mutation({
  args: { groupId: v.id("groups"), name: v.string() },
  handler: async (ctx, { groupId, name }) => {
    return await ctx.db.insert("participants", { groupId, name });
  },
});
