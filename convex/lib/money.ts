/** Split `totalCents` into `n` integer shares; leftover cents go to the first shares. */
export function splitEqually(totalCents: number, n: number): number[] {
  return splitByShares(totalCents, Array.from({ length: n }, () => 1));
}

/**
 * Split `totalCents` proportionally to `shares` (positive integers), in whole
 * cents that add up exactly to the total: each part is rounded down, then the
 * leftover cents go to the largest fractional parts (first ones on ties).
 */
export function splitByShares(totalCents: number, shares: number[]): number[] {
  const totalShares = shares.reduce((sum, s) => sum + s, 0);
  if (totalShares <= 0) return shares.map(() => 0);
  const exact = shares.map((s) => (totalCents * s) / totalShares);
  const parts = exact.map(Math.floor);
  let leftover = totalCents - parts.reduce((sum, p) => sum + p, 0);
  const byFraction = exact
    .map((value, i) => ({ i, fraction: value - parts[i] }))
    .sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (const { i } of byFraction) {
    if (leftover <= 0) break;
    parts[i]++;
    leftover--;
  }
  return parts;
}

type ExpenseLike = {
  paidBy: string;
  amountCents: number;
  splits: { participantId: string; shareCents: number }[];
};

/** Net balance per participant: positive = is owed money, negative = owes money. */
export function computeBalances(
  participantIds: string[],
  expenses: ExpenseLike[],
): Map<string, number> {
  const balances = new Map(participantIds.map((id) => [id, 0]));
  for (const e of expenses) {
    balances.set(e.paidBy, (balances.get(e.paidBy) ?? 0) + e.amountCents);
    for (const s of e.splits) {
      balances.set(
        s.participantId,
        (balances.get(s.participantId) ?? 0) - s.shareCents,
      );
    }
  }
  return balances;
}

export type Settlement = { from: string; to: string; amountCents: number };

/**
 * Greedy debt simplification: repeatedly match the biggest debtor with the
 * biggest creditor. Yields at most n-1 transfers.
 */
export function settle(balances: Map<string, number>): Settlement[] {
  const debtors = [...balances]
    .filter(([, b]) => b < 0)
    .map(([id, b]) => ({ id, amount: -b }));
  const creditors = [...balances]
    .filter(([, b]) => b > 0)
    .map(([id, b]) => ({ id, amount: b }));
  const settlements: Settlement[] = [];

  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(debtor.amount, creditor.amount);
    settlements.push({ from: debtor.id, to: creditor.id, amountCents: amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }
  return settlements;
}
