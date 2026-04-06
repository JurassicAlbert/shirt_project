import { describe, expect, it } from "vitest";
import { buildHybridRankedProducts, diversifyByType, hybridScore, popularityNorm, recencyBoost } from "./search-ranking";

describe("search ranking", () => {
  it("hybrid score blends components", () => {
    const s = hybridScore({
      vectorScore: 0.8,
      popularityNorm: 0.5,
      recencyBoost: 0.6,
    });
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("diversifyByType caps per type for the primary slice", () => {
    const ranked = [
      { id: "1", type: "a", hybrid: 0.9 },
      { id: "2", type: "a", hybrid: 0.85 },
      { id: "3", type: "b", hybrid: 0.7 },
      { id: "4", type: "a", hybrid: 0.6 },
    ];
    const out = diversifyByType(ranked, 2, 3);
    expect(out.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("buildHybridRankedProducts prefers diversity across types", () => {
    const now = new Date();
    const products = [
      { id: "p1", type: "tshirt", name: "A", description: null, popularityScore: 10, createdAt: now },
      { id: "p2", type: "tshirt", name: "B", description: null, popularityScore: 5, createdAt: now },
      { id: "p3", type: "hoodie", name: "C", description: null, popularityScore: 1, createdAt: now },
    ];
    const vectorHits = [
      { sourceId: "p1", score: 0.99 },
      { sourceId: "p2", score: 0.98 },
      { sourceId: "p3", score: 0.5 },
    ];
    const ranked = buildHybridRankedProducts(products, vectorHits, 3);
    expect(ranked.map((p) => p.id)).toContain("p3");
  });

  it("popularityNorm and recencyBoost are bounded", () => {
    expect(popularityNorm(0, 10)).toBe(0);
    expect(recencyBoost(new Date())).toBeCloseTo(1, 1);
  });
});
