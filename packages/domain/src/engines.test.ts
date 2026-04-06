import { describe, expect, it } from "vitest";
import {
  canRequestGeneration,
  calculatePriceBreakdown,
  canRequestReturn,
  dedupeSearchResults,
  resolveOrderPaymentState,
  validateVariantSelection,
} from "./engines";

describe("pricing engine", () => {
  it("calculates net, vat, and gross totals", () => {
    const result = calculatePriceBreakdown({
      unitGross: 123.0,
      vatRatePercent: 23,
      quantity: 2,
    });

    expect(result.totalGross).toBe(246.0);
    expect(result.totalVat).toBeGreaterThan(0);
    expect(result.totalNet).toBeGreaterThan(0);
  });
});

describe("configuration engine", () => {
  it("rejects invalid variant combinations", () => {
    expect(
      validateVariantSelection({
        size: "XL",
        color: "pink",
        material: "paper",
      }).valid,
    ).toBe(false);
  });
});

describe("ai cost control engine", () => {
  it("blocks requests over daily limit", () => {
    const allowed = canRequestGeneration({
      dailyLimit: 5,
      usedToday: 5,
      blockedToday: 0,
    });
    expect(allowed).toBe(false);
  });
});

describe("search engine", () => {
  it("removes duplicate ids across mixed sources", () => {
    const deduped = dedupeSearchResults([
      { id: "a", source: "ai", score: 0.9 },
      { id: "a", source: "internal", score: 0.7 },
      { id: "b", source: "external", score: 0.8 },
    ]);
    expect(deduped).toHaveLength(2);
  });
});

describe("order management", () => {
  it("keeps order recoverable on payment failure", () => {
    const state = resolveOrderPaymentState("failed");
    expect(state.orderStatus).toBe("failed");
    expect(state.recoverable).toBe(true);
  });
});

describe("returns and dispute engine", () => {
  it("escalates when abuse threshold is exceeded", () => {
    const decision = canRequestReturn({
      deliveredDaysAgo: 4,
      returnRequestsLast90Days: 5,
      abuseThreshold: 3,
    });
    expect(decision.status).toBe("escalated");
  });
});
