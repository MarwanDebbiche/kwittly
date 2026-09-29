import { describe, expect, test } from "vitest";
import { computeBalances, settle, spentCents, splitByShares, splitEqually } from "./money";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("splitByShares", () => {
  test("splits proportionally", () => {
    expect(splitByShares(10000, [2, 1, 3])).toEqual([3333, 1667, 5000]);
    expect(splitByShares(900, [1, 2])).toEqual([300, 600]);
  });

  test("always adds up to the total, to the cent", () => {
    const cases: [number, number[]][] = [
      [1, [1, 1]],
      [999, [1, 2]],
      [10001, [1, 1]],
      [123457, [7, 3, 5, 1]],
      [100, [1, 1, 1, 1, 1, 1, 1]],
      [5, [1000, 1]],
    ];
    for (const [total, shares] of cases) {
      const parts = splitByShares(total, shares);
      expect(sum(parts)).toBe(total);
      expect(parts.every((p) => Number.isInteger(p) && p >= 0)).toBe(true);
    }
  });

  test("gives leftover cents to the largest fractional parts", () => {
    // 100 / 3 = 33.33… each: one leftover cent, to the first on a tie.
    expect(splitByShares(100, [1, 1, 1])).toEqual([34, 33, 33]);
    // 10 × [1, 2] / 3 = 3.33 and 6.67: the second has the larger fraction.
    expect(splitByShares(10, [1, 2])).toEqual([3, 7]);
  });

  test("returns zeros when there are no shares", () => {
    expect(splitByShares(1000, [])).toEqual([]);
    expect(splitByShares(1000, [0, 0])).toEqual([0, 0]);
  });
});

describe("splitEqually", () => {
  test("gives leftover cents to the first participants", () => {
    expect(splitEqually(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(splitEqually(10, 4)).toEqual([3, 3, 2, 2]);
  });
});

describe("computeBalances", () => {
  test("credits the payer and debits each share", () => {
    const balances = computeBalances(
      ["a", "b", "c"],
      [
        { paidBy: "a", amountCents: 9000, splits: [
          { participantId: "a", shareCents: 3000 },
          { participantId: "b", shareCents: 3000 },
          { participantId: "c", shareCents: 3000 },
        ] },
        { paidBy: "b", amountCents: 2450, splits: [
          { participantId: "b", shareCents: 1225 },
          { participantId: "c", shareCents: 1225 },
        ] },
      ],
    );
    expect(Object.fromEntries(balances)).toEqual({ a: 6000, b: -1775, c: -4225 });
    expect(sum([...balances.values()])).toBe(0);
  });

  test("includes participants without expenses at zero", () => {
    expect(Object.fromEntries(computeBalances(["a", "b"], []))).toEqual({ a: 0, b: 0 });
  });
});

describe("settle", () => {
  test("settles everyone with at most n - 1 transfers", () => {
    const balances = new Map([
      ["a", 6000],
      ["b", -1775],
      ["c", -4225],
      ["d", 0],
    ]);
    const transfers = settle(balances);
    expect(transfers.length).toBeLessThanOrEqual(balances.size - 1);

    const after = new Map(balances);
    for (const { from, to, amountCents } of transfers) {
      expect(amountCents).toBeGreaterThan(0);
      after.set(from, (after.get(from) ?? 0) + amountCents);
      after.set(to, (after.get(to) ?? 0) - amountCents);
    }
    expect([...after.values()].every((b) => b === 0)).toBe(true);
  });

  test("needs no transfer when everyone is even", () => {
    expect(settle(new Map([["a", 0], ["b", 0]]))).toEqual([]);
  });
});

test("spentCents leaves reimbursements out", () => {
  const split = [{ participantId: "b", shareCents: 500 }];
  expect(
    spentCents([
      { paidBy: "a", amountCents: 500, splits: split },
      { kind: "transfer", paidBy: "b", amountCents: 300, splits: [{ participantId: "a", shareCents: 300 }] },
    ]),
  ).toBe(500);
});
