import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    currency: v.string(),
  }),

  participants: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
  }).index("by_group", ["groupId"]),

  expenses: defineTable({
    groupId: v.id("groups"),
    title: v.string(),
    // Amounts are stored in integer cents to avoid floating point errors.
    amountCents: v.number(),
    paidBy: v.id("participants"),
    date: v.number(),
    category: v.optional(v.string()),
    splits: v.array(
      v.object({
        participantId: v.id("participants"),
        shareCents: v.number(),
      }),
    ),
  })
    .index("by_group_date", ["groupId", "date"])
    .index("by_group_paidBy", ["groupId", "paidBy", "date"]),

  // Groups saved to a user account (the logged-in counterpart of localStorage).
  memberships: defineTable({
    // Better Auth user id (`identity.subject`).
    userId: v.string(),
    groupId: v.id("groups"),
    // Participant the user identified as in this group, if any.
    participantId: v.optional(v.id("participants")),
    addedAt: v.number(),
  })
    .index("by_user", ["userId", "addedAt"])
    .index("by_user_group", ["userId", "groupId"]),
});
