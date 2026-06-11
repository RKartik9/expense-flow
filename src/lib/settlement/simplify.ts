export interface NetBalance {
  userId: string;
  /** Positive = is owed money (creditor). Negative = owes money (debtor). */
  amount: number;
}

export interface SettlementTransaction {
  from: string;
  to: string;
  amount: number;
}

const EPSILON = 0.01;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Debt simplification: given net balances, produce a minimal list of
 * transactions using a greedy largest-debtor -> largest-creditor matching.
 *
 * Example: A owes B 500, B owes C 500 => net A=-500, B=0, C=+500
 * => single transaction A pays C 500.
 */
export function simplifyDebts(balances: NetBalance[]): SettlementTransaction[] {
  const creditors = balances
    .filter((b) => b.amount > EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.amount < -EPSILON)
    .map((b) => ({ ...b, amount: -b.amount }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = round2(Math.min(creditor.amount, debtor.amount));

    if (amount > EPSILON) {
      transactions.push({ from: debtor.userId, to: creditor.userId, amount });
    }

    creditor.amount = round2(creditor.amount - amount);
    debtor.amount = round2(debtor.amount - amount);

    if (creditor.amount <= EPSILON) ci++;
    if (debtor.amount <= EPSILON) di++;
  }

  return transactions;
}

export interface SplitBalanceInput {
  payerId: string;
  participants: { userId: string | null; shareAmount: number; paidAmount: number; isPayer: boolean }[];
}

/** Compute net balances per user across a set of splits (unsettled shares only). */
export function computeNetBalances(splits: SplitBalanceInput[]): NetBalance[] {
  const net = new Map<string, number>();
  for (const split of splits) {
    for (const p of split.participants) {
      if (!p.userId || p.isPayer) continue;
      const outstanding = round2(p.shareAmount - p.paidAmount);
      if (outstanding <= EPSILON) continue;
      net.set(p.userId, round2((net.get(p.userId) ?? 0) - outstanding));
      net.set(split.payerId, round2((net.get(split.payerId) ?? 0) + outstanding));
    }
  }
  return Array.from(net.entries())
    .map(([userId, amount]) => ({ userId, amount }))
    .filter((b) => Math.abs(b.amount) > EPSILON);
}
