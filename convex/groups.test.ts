import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("groups.create", () => {
  test("creates the group, its participants and keeps a supported language", async () => {
    const t = convexTest(schema, modules);
    const { groupId, participantIds } = await t.mutation(api.groups.create, {
      name: "Lisbon", currency: "EUR", participants: ["Alice", "Bob"], locale: "fr",
    });
    const group = await t.query(api.groups.get, { groupId });
    expect(group).toMatchObject({ name: "Lisbon", currency: "EUR", locale: "fr" });
    expect(group?.participants.map((p) => p._id)).toEqual(participantIds);
  });

  test("ignores an unsupported language", async () => {
    const t = convexTest(schema, modules);
    const { groupId } = await t.mutation(api.groups.create, {
      name: "Lisbon", currency: "EUR", participants: ["Alice"], locale: "de",
    });
    expect((await t.query(api.groups.get, { groupId }))?.locale).toBeUndefined();
  });

  test("requires a name and at least one participant", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.groups.create, { name: " ", currency: "EUR", participants: ["A"] }))
      .rejects.toThrowError("needs a name");
    await expect(t.mutation(api.groups.create, { name: "X", currency: "EUR", participants: [] }))
      .rejects.toThrowError("at least one participant");
  });
});

describe("groups.get", () => {
  test("returns null for invalid or unknown ids (share links, localStorage)", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.groups.get, { groupId: "not-an-id" })).toBeNull();
    const { groupId } = await t.mutation(api.groups.create, { name: "X", currency: "EUR", participants: ["A"] });
    await t.run((ctx) => ctx.db.delete(groupId));
    expect(await t.query(api.groups.get, { groupId })).toBeNull();
  });
});

describe("groups.summaries", () => {
  test("totals, the user's balance and missing groups", async () => {
    const t = convexTest(schema, modules);
    const { groupId, participantIds: [alice, bob] } = await t.mutation(api.groups.create, {
      name: "Lisbon", currency: "EUR", participants: ["Alice", "Bob"],
    });
    await t.mutation(api.expenses.add, {
      groupId, title: "Dinner", amountCents: 9000, paidBy: alice, date: 0,
      split: { mode: "equal", participants: [alice, bob] },
    });
    const [asBob, anonymous, missing] = await t.query(api.groups.summaries, {
      items: [{ groupId, me: bob }, { groupId }, { groupId: "not-an-id" }],
    });
    expect(asBob).toMatchObject({ found: true, name: "Lisbon", totalCents: 9000, myBalanceCents: -4500 });
    expect(anonymous).toMatchObject({ found: true, myBalanceCents: null });
    expect(missing).toEqual({ groupId: "not-an-id", found: false });
  });
});

describe("participants", () => {
  const names = async (t: ReturnType<typeof convexTest>, groupId: string) =>
    (await t.query(api.groups.get, { groupId }))?.participants.map((p) => p.name);

  test("addParticipant adds someone to the group", async () => {
    const t = convexTest(schema, modules);
    const { groupId } = await t.mutation(api.groups.create, { name: "X", currency: "EUR", participants: ["A"] });
    await t.mutation(api.groups.addParticipant, { groupId, name: " B " });
    expect(await names(t, groupId)).toEqual(["A", "B"]);
    await expect(t.mutation(api.groups.addParticipant, { groupId, name: " " })).rejects.toThrowError("needs a name");
    await expect(t.mutation(api.groups.addParticipant, { groupId: "nope", name: "C" })).rejects.toThrowError("Group not found");
  });

  test("renameParticipant renames, and requires a name", async () => {
    const t = convexTest(schema, modules);
    const { groupId, participantIds: [a] } = await t.mutation(api.groups.create, { name: "X", currency: "EUR", participants: ["A"] });
    await t.mutation(api.groups.renameParticipant, { participantId: a, name: "Alice" });
    expect(await names(t, groupId)).toEqual(["Alice"]);
    await expect(t.mutation(api.groups.renameParticipant, { participantId: a, name: "" })).rejects.toThrowError("needs a name");
    await expect(t.mutation(api.groups.renameParticipant, { participantId: "nope", name: "B" })).rejects.toThrowError("not found");
  });

  test("removeParticipant only removes people without expenses, and never the last one", async () => {
    const t = convexTest(schema, modules);
    const { groupId, participantIds: [a, b, c] } = await t.mutation(api.groups.create, {
      name: "X", currency: "EUR", participants: ["A", "B", "C"],
    });
    await t.mutation(api.expenses.addTransfer, { groupId, from: a, to: b, amountCents: 100, date: 0 });
    await expect(t.mutation(api.groups.removeParticipant, { participantId: a })).rejects.toThrowError("appears in expenses");
    await expect(t.mutation(api.groups.removeParticipant, { participantId: b })).rejects.toThrowError("appears in expenses");
    await t.mutation(api.groups.removeParticipant, { participantId: c });
    expect(await names(t, groupId)).toEqual(["A", "B"]);

    const solo = await t.mutation(api.groups.create, { name: "Y", currency: "EUR", participants: ["Z"] });
    await expect(
      t.mutation(api.groups.removeParticipant, { participantId: solo.participantIds[0] }),
    ).rejects.toThrowError("at least one participant");
  });
});

test("balances.get returns balances summing to zero and settlements", async () => {
  const t = convexTest(schema, modules);
  const { groupId, participantIds: [alice, bob, chloe] } = await t.mutation(api.groups.create, {
    name: "Lisbon", currency: "EUR", participants: ["Alice", "Bob", "Chloé"],
  });
  await t.mutation(api.expenses.add, {
    groupId, title: "Dinner", amountCents: 9000, paidBy: alice, date: 0,
    split: { mode: "equal", participants: [alice, bob, chloe] },
  });
  const { balances, settlements, totalCents } = await t.query(api.balances.get, { groupId });
  expect(totalCents).toBe(9000);
  expect(balances.map((b) => b.balanceCents)).toEqual([6000, -3000, -3000]);
  expect(settlements).toEqual([
    { from: bob, to: alice, amountCents: 3000 },
    { from: chloe, to: alice, amountCents: 3000 },
  ]);
});
