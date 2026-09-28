import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";

async function requireUserId(ctx: { auth: MutationCtx["auth"] }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Connexion requise");
  return identity.subject;
}

/** Groups saved to the current account, newest first. Null when logged out. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
    return memberships.map((m) => ({
      id: m.groupId as string,
      me: m.participantId as string | undefined,
      addedAt: m.addedAt,
    }));
  },
});

/** Insert or update a membership. `me` undefined means "just watching". */
async function upsert(
  ctx: MutationCtx,
  userId: string,
  rawGroupId: string,
  rawMe: string | undefined,
  { keepExistingMe }: { keepExistingMe: boolean },
) {
  const groupId = ctx.db.normalizeId("groups", rawGroupId);
  if (!groupId || !(await ctx.db.get(groupId))) return;
  const me = await validParticipant(ctx, groupId, rawMe);

  const existing = await ctx.db
    .query("memberships")
    .withIndex("by_user_group", (q) =>
      q.eq("userId", userId).eq("groupId", groupId),
    )
    .unique();
  if (!existing) {
    await ctx.db.insert("memberships", {
      userId,
      groupId,
      participantId: me,
      addedAt: Date.now(),
    });
  } else if (!keepExistingMe || existing.participantId === undefined) {
    await ctx.db.patch(existing._id, { participantId: me });
  }
}

async function validParticipant(
  ctx: MutationCtx,
  groupId: Id<"groups">,
  raw: string | undefined,
) {
  if (raw === undefined) return undefined;
  const id = ctx.db.normalizeId("participants", raw);
  const participant = id && (await ctx.db.get(id));
  return participant && participant.groupId === groupId
    ? participant._id
    : undefined;
}

export const save = mutation({
  args: { groupId: v.string(), me: v.optional(v.string()) },
  handler: async (ctx, { groupId, me }) => {
    const userId = await requireUserId(ctx);
    await upsert(ctx, userId, groupId, me, { keepExistingMe: false });
  },
});

export const forget = mutation({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const groupId = ctx.db.normalizeId("groups", args.groupId);
    if (!groupId) return;
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_user_group", (q) =>
        q.eq("userId", userId).eq("groupId", groupId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/**
 * Attach the groups saved in this browser to the account, at login.
 * An identity already set on the account wins over the local one.
 */
export const importLocal = mutation({
  args: {
    items: v.array(
      v.object({ groupId: v.string(), me: v.optional(v.string()) }),
    ),
  },
  handler: async (ctx, { items }) => {
    const userId = await requireUserId(ctx);
    for (const item of items) {
      await upsert(ctx, userId, item.groupId, item.me, {
        keepExistingMe: true,
      });
    }
  },
});
