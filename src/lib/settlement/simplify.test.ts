import { describe, it, expect } from "vitest";
import { simplifyDebts, computeNetBalances } from "./simplify";
import { computeShares } from "./split-math";

describe("simplifyDebts", () => {
  it("collapses chains: A owes B, B owes C => A pays C", () => {
    const txns = simplifyDebts([
      { userId: "A", amount: -500 },
      { userId: "B", amount: 0 },
      { userId: "C", amount: 500 },
    ]);
    expect(txns).toEqual([{ from: "A", to: "C", amount: 500 }]);
  });

  it("returns empty for settled balances", () => {
    expect(simplifyDebts([])).toEqual([]);
    expect(simplifyDebts([{ userId: "A", amount: 0 }])).toEqual([]);
  });

  it("matches multiple debtors and creditors with minimal transactions", () => {
    const txns = simplifyDebts([
      { userId: "A", amount: -300 },
      { userId: "B", amount: -200 },
      { userId: "C", amount: 400 },
      { userId: "D", amount: 100 },
    ]);
    const totalPaid = txns.reduce((s, t) => s + t.amount, 0);
    expect(totalPaid).toBeCloseTo(500);
    expect(txns.length).toBeLessThanOrEqual(3);
    // Every debtor pays exactly what they owe
    const paidByA = txns.filter((t) => t.from === "A").reduce((s, t) => s + t.amount, 0);
    const paidByB = txns.filter((t) => t.from === "B").reduce((s, t) => s + t.amount, 0);
    expect(paidByA).toBeCloseTo(300);
    expect(paidByB).toBeCloseTo(200);
  });

  it("handles fractional amounts", () => {
    const txns = simplifyDebts([
      { userId: "A", amount: -33.33 },
      { userId: "B", amount: 33.33 },
    ]);
    expect(txns).toEqual([{ from: "A", to: "B", amount: 33.33 }]);
  });
});

describe("computeNetBalances", () => {
  it("nets balances across splits", () => {
    const balances = computeNetBalances([
      {
        payerId: "A",
        participants: [
          { userId: "A", shareAmount: 250, paidAmount: 0, isPayer: true },
          { userId: "B", shareAmount: 250, paidAmount: 0, isPayer: false },
          { userId: "C", shareAmount: 250, paidAmount: 100, isPayer: false },
        ],
      },
      {
        payerId: "B",
        participants: [
          { userId: "B", shareAmount: 50, paidAmount: 0, isPayer: true },
          { userId: "A", shareAmount: 50, paidAmount: 0, isPayer: false },
        ],
      },
    ]);
    const map = Object.fromEntries(balances.map((b) => [b.userId, b.amount]));
    // A is owed 250 + 150 = 400, but owes B 50 => +350
    expect(map["A"]).toBeCloseTo(350);
    // B owes 250, is owed 50 => -200
    expect(map["B"]).toBeCloseTo(-200);
    expect(map["C"]).toBeCloseTo(-150);
  });

  it("ignores settled and unlinked participants", () => {
    const balances = computeNetBalances([
      {
        payerId: "A",
        participants: [
          { userId: "B", shareAmount: 100, paidAmount: 100, isPayer: false },
          { userId: null, shareAmount: 100, paidAmount: 0, isPayer: false },
        ],
      },
    ]);
    expect(balances).toEqual([]);
  });
});

describe("computeShares", () => {
  it("splits equally with rounding remainder on last participant", () => {
    const shares = computeShares("equal", 1000, [
      { key: "a" },
      { key: "b" },
      { key: "c" },
      { key: "d" },
    ]);
    expect(shares.map((s) => s.shareAmount)).toEqual([250, 250, 250, 250]);

    const uneven = computeShares("equal", 100, [{ key: "a" }, { key: "b" }, { key: "c" }]);
    expect(uneven.reduce((s, x) => s + x.shareAmount, 0)).toBeCloseTo(100);
  });

  it("splits by percentage", () => {
    const shares = computeShares("percentage", 1000, [
      { key: "a", value: 40 },
      { key: "b", value: 35 },
      { key: "c", value: 25 },
    ]);
    expect(shares.map((s) => s.shareAmount)).toEqual([400, 350, 250]);
  });

  it("rejects percentages not summing to 100", () => {
    expect(() =>
      computeShares("percentage", 1000, [
        { key: "a", value: 50 },
        { key: "b", value: 30 },
      ])
    ).toThrow();
  });

  it("splits by exact amounts", () => {
    const shares = computeShares("exact", 1000, [
      { key: "a", value: 200 },
      { key: "b", value: 300 },
      { key: "c", value: 500 },
    ]);
    expect(shares.map((s) => s.shareAmount)).toEqual([200, 300, 500]);
  });

  it("rejects exact amounts not summing to total", () => {
    expect(() =>
      computeShares("exact", 1000, [
        { key: "a", value: 200 },
        { key: "b", value: 300 },
      ])
    ).toThrow();
  });
});
