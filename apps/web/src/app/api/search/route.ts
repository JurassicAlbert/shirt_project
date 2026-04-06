import { apiOk, apiRateLimited } from "@/lib/api-response";
import { getSessionFromCookie } from "@/lib/auth";
import { productRepository } from "@/lib/repositories";
import { buildHybridRankedProducts } from "@/lib/search-ranking";
import { searchSimilarProducts, upsertProductEmbedding } from "@/lib/search-embeddings";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  const rl = await checkRateLimit({
    scope: "api_search",
    ip: getClientIp(request),
    userId: session?.userId,
    ipLimit: 120,
    userLimit: session ? 200 : undefined,
  });
  if (!rl.ok) return apiRateLimited(rl.message, rl.retryAfterSec);

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const sort = (searchParams.get("sort") ?? "name_asc").trim();
  const products = await productRepository.list();

  const minGross = (p: (typeof products)[0]) => {
    if (!p.variants.length) return 0;
    return Math.min(...p.variants.map((v) => Number(v.grossPrice)));
  };

  for (const product of products) {
    void upsertProductEmbedding({
      productId: product.id,
      text: `${product.name} ${product.description ?? ""} ${product.type}`,
    }).catch(() => undefined);
  }

  const lexical = products.filter(
    (item) =>
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q),
  );

  let items = lexical;
  if (q.length >= 3) {
    try {
      const ranked = await searchSimilarProducts(q, 48);
      if (ranked.length > 0) {
        const hybrid = buildHybridRankedProducts(
          products.map((p) => ({
            id: p.id,
            type: p.type,
            name: p.name,
            description: p.description ?? null,
            popularityScore: p.popularityScore,
            createdAt: p.createdAt,
          })),
          ranked,
          24,
        );
        items = hybrid.flatMap((h) => {
          const p = products.find((x) => x.id === h.id);
          return p ? [p] : [];
        });
      }
    } catch {
      // lexical fallback
    }
  }

  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return minGross(a) - minGross(b);
      case "price_desc":
        return minGross(b) - minGross(a);
      case "name_desc":
        return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
      case "name_asc":
      default:
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
  });

  return apiOk({ items: sorted });
}
