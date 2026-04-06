export type ProductForRank = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  popularityScore: number;
  createdAt: Date;
};

export type VectorHit = { sourceId: string; score: number };

const hoursSince = (d: Date) => (Date.now() - d.getTime()) / 36e5;

/** Recency: newer products get higher boost (0..1), half-life ~30 days */
export const recencyBoost = (createdAt: Date) => {
  const h = hoursSince(createdAt);
  return Math.exp(-h / (24 * 30));
};

/** Popularity normalized with log1p to dampen outliers */
export const popularityNorm = (score: number, maxPop: number) => {
  if (maxPop <= 0) return 0;
  return Math.log1p(score) / Math.log1p(maxPop);
};

export const hybridScore = (input: {
  vectorScore: number;
  popularityNorm: number;
  recencyBoost: number;
  weights?: { vector: number; popularity: number; recency: number };
}) => {
  const w = input.weights ?? { vector: 0.5, popularity: 0.25, recency: 0.25 };
  return (
    w.vector * input.vectorScore + w.popularity * input.popularityNorm + w.recency * input.recencyBoost
  );
};

/**
 * Greedy diversity: prefer higher hybrid score while limiting duplicates per `type` bucket.
 */
export const diversifyByType = <T extends { id: string; type: string }>(
  ranked: Array<T & { hybrid: number }>,
  maxPerType: number,
  limit: number,
) => {
  const out: Array<T & { hybrid: number }> = [];
  const perType = new Map<string, number>();
  for (const item of ranked) {
    const n = perType.get(item.type) ?? 0;
    if (n >= maxPerType) continue;
    out.push(item);
    perType.set(item.type, n + 1);
    if (out.length >= limit) break;
  }
  // fill remainder if diversity filter left slots empty
  if (out.length < limit) {
    for (const item of ranked) {
      if (out.some((x) => x.id === item.id)) continue;
      out.push(item);
      if (out.length >= limit) break;
    }
  }
  return out;
};

export const buildHybridRankedProducts = (
  products: ProductForRank[],
  vectorHits: VectorHit[],
  limit = 24,
) => {
  const byId = new Map(products.map((p) => [p.id, p]));
  const maxPop = Math.max(1, ...products.map((p) => p.popularityScore));
  const vecMap = new Map(vectorHits.map((h) => [h.sourceId, h.score]));

  const scored = products.map((p) => {
    const vectorScore = vecMap.get(p.id) ?? 0;
    const pn = popularityNorm(p.popularityScore, maxPop);
    const rb = recencyBoost(p.createdAt);
    const hybrid = hybridScore({
      vectorScore,
      popularityNorm: pn,
      recencyBoost: rb,
    });
    return { ...p, hybrid, vectorScore };
  });

  scored.sort((a, b) => b.hybrid - a.hybrid);
  return diversifyByType(scored, 2, limit);
};
