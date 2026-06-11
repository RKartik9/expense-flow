export type SplitType = "equal" | "percentage" | "exact";

export interface ShareInput {
  key: string;
  /** Percentage (0-100) for percentage splits, exact amount for exact splits. */
  value?: number;
}

export interface ComputedShare {
  key: string;
  shareAmount: number;
  percentage: number | null;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Compute each participant's share. Rounding remainders are assigned to the
 * last participant so shares always sum exactly to the total.
 */
export function computeShares(
  splitType: SplitType,
  totalAmount: number,
  participants: ShareInput[]
): ComputedShare[] {
  if (participants.length === 0) throw new Error("At least one participant is required");
  if (totalAmount <= 0) throw new Error("Total amount must be positive");

  if (splitType === "equal") {
    const base = round2(totalAmount / participants.length);
    return participants.map((p, i) => ({
      key: p.key,
      shareAmount:
        i === participants.length - 1 ? round2(totalAmount - base * (participants.length - 1)) : base,
      percentage: null,
    }));
  }

  if (splitType === "percentage") {
    const totalPct = participants.reduce((s, p) => s + (p.value ?? 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error(`Percentages must sum to 100 (got ${totalPct})`);
    }
    let allocated = 0;
    return participants.map((p, i) => {
      const pct = p.value ?? 0;
      const amount =
        i === participants.length - 1
          ? round2(totalAmount - allocated)
          : round2((totalAmount * pct) / 100);
      allocated = round2(allocated + amount);
      return { key: p.key, shareAmount: amount, percentage: pct };
    });
  }

  // exact
  const sum = round2(participants.reduce((s, p) => s + (p.value ?? 0), 0));
  if (Math.abs(sum - totalAmount) > 0.01) {
    throw new Error(`Exact amounts must sum to the total (${sum} != ${totalAmount})`);
  }
  return participants.map((p) => ({
    key: p.key,
    shareAmount: round2(p.value ?? 0),
    percentage: null,
  }));
}
