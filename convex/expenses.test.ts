import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function setup() {
  const t = convexTest(schema, modules);
  const { groupId, participantIds } = await t.mutation(api.groups.create, {
    name: "Lisbon",
    currency: "EUR",
    participants: ["Alice", "Bob", "Chloé"],
  });
  const [alice, bob, chloe] = participantIds;
  return { t, groupId, alice, bob, chloe };
}

const base = { title: "Dinner", date: Date.UTC(2026, 8, 1, 12), category: "restaurant" };

describe("expenses.add", () => {
  test("splits equally", async () => {
    const { t, groupId, alice, bob, chloe } = await setup();
    await t.mutation(api.expenses.add, {
      groupId, ...base, amountCents: 10000, paidBy: alice,
      split: { mode: "equal", participants: [alice, bob, chloe] },
    });
    const [expense] = await t.query(api.expenses.list, { groupId });
    expect(expense.splitMode).toBe("equal");
    expect(expense.splits.map((s) => s.shareCents)).toEqual([3334, 3333, 3333]);
  });

  test("splits by shares and keeps the shares", async () => {
    const { t, groupId, alice, bob, chloe } = await setup();
    await t.mutation(api.expenses.add, {
      groupId, ...base, amountCents: 10000, paidBy: alice,
      split: { mode: "shares", shares: [
        { participantId: alice, shares: 2 },
        { participantId: bob, shares: 1 },
        { participantId: chloe, shares: 3 },
      ] },
    });
    const [expense] = await t.query(api.expenses.list, { groupId });
    expect(expense.splitMode).toBe("shares");
    expect(expense.splits).toEqual([
      { participantId: alice, shareCents: 3333, shares: 2 },
      { participantId: bob, shareCents: 1667, shares: 1 },
      { participantId: chloe, shareCents: 5000, shares: 3 },
    ]);
  });

  test("splits by amounts that add up to the total", async () => {
    const { t, groupId, alice, bob } = await setup();
    await t.mutation(api.expenses.add, {
      groupId, ...base, amountCents: 800, paidBy: alice,
      split: { mode: "amounts", amounts: [
        { participantId: alice, amountCents: 300 },
        { participantId: bob, amountCents: 500 },
      ] },
    });
    const [expense] = await t.query(api.expenses.list, { groupId });
    expect(expense.splits.map((s) => s.shareCents)).toEqual([300, 500]);
  });

  test.each([
    ["a non-positive amount", { amountCents: 0 }, "positive number of cents"],
    ["a non-integer amount", { amountCents: 12.5 }, "positive number of cents"],
  ])("rejects %s", async (_, override, message) => {
    const { t, groupId, alice } = await setup();
    await expect(
      t.mutation(api.expenses.add, {
        groupId, ...base, paidBy: alice, split: { mode: "equal", participants: [alice] }, ...override,
      }),
    ).rejects.toThrowError(message);
  });

  test("rejects invalid splits", async () => {
    const { t, groupId, alice, bob } = await setup();
    const add = (amountCents: number, split: Parameters<typeof t.mutation<typeof api.expenses.add>>[1]["split"]) =>
      t.mutation(api.expenses.add, { groupId, ...base, amountCents, paidBy: alice, split });

    await expect(add(100, { mode: "equal", participants: [] })).rejects.toThrowError("At least one participant");
    await expect(add(900, { mode: "amounts", amounts: [
      { participantId: alice, amountCents: 300 },
      { participantId: bob, amountCents: 500 },
    ] })).rejects.toThrowError("add up to the expense total");
    await expect(add(100, { mode: "shares", shares: [
      { participantId: alice, shares: 1 },
      { participantId: alice, shares: 1 },
    ] })).rejects.toThrowError("appears twice");
    await expect(add(100, { mode: "shares", shares: [{ participantId: alice, shares: 0 }] }))
      .rejects.toThrowError("positive integers");
    await expect(add(100, { mode: "shares", shares: [{ participantId: alice, shares: 1.5 }] }))
      .rejects.toThrowError("positive integers");
    await expect(add(100, { mode: "shares", shares: [{ participantId: alice, shares: 1001 }] }))
      .rejects.toThrowError("At most 1000 shares");
  });

  test("rejects participants from another group", async () => {
    const { t, groupId, alice } = await setup();
    const other = await t.mutation(api.groups.create, { name: "Other", currency: "EUR", participants: ["Zed"] });
    const zed = other.participantIds[0];
    await expect(
      t.mutation(api.expenses.add, {
        groupId, ...base, amountCents: 100, paidBy: zed,
        split: { mode: "equal", participants: [alice] },
      }),
    ).rejects.toThrowError("not in this group");
    await expect(
      t.mutation(api.expenses.add, {
        groupId, ...base, amountCents: 100, paidBy: alice,
        split: { mode: "equal", participants: [zed] },
      }),
    ).rejects.toThrowError("not in this group");
  });
});

describe("expenses.update", () => {
  test("replaces the fields and the split, and can clear the category", async () => {
    const { t, groupId, alice, bob, chloe } = await setup();
    const expenseId = await t.mutation(api.expenses.add, {
      groupId, ...base, amountCents: 9000, paidBy: alice,
      split: { mode: "equal", participants: [alice, bob, chloe] },
    });
    await t.mutation(api.expenses.update, {
      expenseId, title: "Dinner (edited)", date: base.date, amountCents: 10001, paidBy: bob,
      split: { mode: "shares", shares: [{ participantId: bob, shares: 1 }, { participantId: chloe, shares: 1 }] },
    });
    const [expense] = await t.query(api.expenses.list, { groupId });
    expect(expense).toMatchObject({ title: "Dinner (edited)", amountCents: 10001, paidBy: bob, splitMode: "shares" });
    expect(expense.category).toBeUndefined();
    expect(expense.splits.map((s) => s.shareCents)).toEqual([5001, 5000]);
  });

  test("validates against the expense's group", async () => {
    const { t, groupId, alice } = await setup();
    const expenseId = await t.mutation(api.expenses.add, {
      groupId, ...base, amountCents: 100, paidBy: alice, split: { mode: "equal", participants: [alice] },
    });
    const zed = (await t.mutation(api.groups.create, { name: "Other", currency: "EUR", participants: ["Zed"] }))
      .participantIds[0];
    await expect(
      t.mutation(api.expenses.update, {
        expenseId, ...base, amountCents: 100, paidBy: zed, split: { mode: "equal", participants: [alice] },
      }),
    ).rejects.toThrowError("not in this group");
  });
});

describe("expenses.list", () => {
  test("filters by payer, participant, category, text and date", async () => {
    const { t, groupId, alice, bob, chloe } = await setup();
    const add = (title: string, paidBy: typeof alice, participants: (typeof alice)[], category: string, day: number) =>
      t.mutation(api.expenses.add, {
        groupId, title, amountCents: 1000, paidBy, category, date: Date.UTC(2026, 8, day, 12),
        split: { mode: "equal", participants },
      });
    await add("Groceries", alice, [alice, bob], "groceries", 1);
    await add("Taxi", bob, [bob, chloe], "transport", 2);
    await add("Museum", chloe, [chloe], "activities", 3);

    const titles = async (filters: Record<string, unknown>) =>
      (await t.query(api.expenses.list, { groupId, ...filters })).map((e) => e.title);

    expect(await titles({})).toEqual(["Museum", "Taxi", "Groceries"]);
    expect(await titles({ paidBy: bob })).toEqual(["Taxi"]);
    expect(await titles({ involving: bob })).toEqual(["Taxi", "Groceries"]);
    expect(await titles({ category: "activities" })).toEqual(["Museum"]);
    expect(await titles({ search: "tax" })).toEqual(["Taxi"]);
    expect(await titles({ from: Date.UTC(2026, 8, 2), to: Date.UTC(2026, 8, 2, 23) })).toEqual(["Taxi"]);
    expect(await titles({ paidBy: alice, involving: chloe })).toEqual([]);
  });
});

test("expenses.remove deletes the expense", async () => {
  const { t, groupId, alice } = await setup();
  const expenseId = await t.mutation(api.expenses.add, {
    groupId, ...base, amountCents: 100, paidBy: alice, split: { mode: "equal", participants: [alice] },
  });
  await t.mutation(api.expenses.remove, { expenseId });
  expect(await t.query(api.expenses.list, { groupId })).toEqual([]);
});
