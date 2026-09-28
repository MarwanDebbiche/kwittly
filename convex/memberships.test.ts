import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function setup() {
  const t = convexTest(schema, modules);
  const lisbon = await t.mutation(api.groups.create, { name: "Lisbon", currency: "EUR", participants: ["Alice", "Bob"] });
  const other = await t.mutation(api.groups.create, { name: "Other", currency: "EUR", participants: ["Zed"] });
  return { t, lisbon, other, asAlice: t.withIdentity({ subject: "user-alice" }) };
}

describe("memberships", () => {
  test("mine is null when logged out, and writes require a login", async () => {
    const { t, lisbon } = await setup();
    expect(await t.query(api.memberships.mine, {})).toBeNull();
    await expect(t.mutation(api.memberships.save, { groupId: lisbon.groupId })).rejects.toThrowError("Login required");
    await expect(t.mutation(api.memberships.forget, { groupId: lisbon.groupId })).rejects.toThrowError("Login required");
  });

  test("save, update identity and forget a group", async () => {
    const { lisbon, asAlice } = await setup();
    const [alice, bob] = lisbon.participantIds;
    await asAlice.mutation(api.memberships.save, { groupId: lisbon.groupId, me: alice });
    expect(await asAlice.query(api.memberships.mine, {})).toMatchObject([{ id: lisbon.groupId, me: alice }]);

    await asAlice.mutation(api.memberships.save, { groupId: lisbon.groupId, me: bob });
    expect(await asAlice.query(api.memberships.mine, {})).toMatchObject([{ id: lisbon.groupId, me: bob }]);

    await asAlice.mutation(api.memberships.forget, { groupId: lisbon.groupId });
    expect(await asAlice.query(api.memberships.mine, {})).toEqual([]);
  });

  test("each user only sees their own groups", async () => {
    const { t, lisbon, asAlice } = await setup();
    await asAlice.mutation(api.memberships.save, { groupId: lisbon.groupId });
    expect(await t.withIdentity({ subject: "user-bob" }).query(api.memberships.mine, {})).toEqual([]);
  });

  test("ignores unknown groups and participants from another group", async () => {
    const { lisbon, other, asAlice } = await setup();
    await asAlice.mutation(api.memberships.save, { groupId: "not-an-id" });
    await asAlice.mutation(api.memberships.save, { groupId: lisbon.groupId, me: other.participantIds[0] });
    const mine = await asAlice.query(api.memberships.mine, {});
    expect(mine).toHaveLength(1);
    expect(mine?.[0].me).toBeUndefined();
  });

  test("importLocal attaches local groups without overriding an identity set on the account", async () => {
    const { lisbon, other, asAlice } = await setup();
    const [alice, bob] = lisbon.participantIds;
    await asAlice.mutation(api.memberships.save, { groupId: lisbon.groupId, me: alice });
    await asAlice.mutation(api.memberships.importLocal, {
      items: [
        { groupId: lisbon.groupId, me: bob },
        { groupId: other.groupId, me: other.participantIds[0] },
        { groupId: "not-an-id" },
      ],
    });
    const mine = await asAlice.query(api.memberships.mine, {});
    expect(mine).toHaveLength(2);
    expect(mine?.find((m) => m.id === lisbon.groupId)?.me).toBe(alice);
    expect(mine?.find((m) => m.id === other.groupId)?.me).toBe(other.participantIds[0]);
  });
});
