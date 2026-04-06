import { prisma } from "../db";

export class MockupCacheRepository {
  async findByCacheKey(cacheKey: string) {
    return prisma.mockupCache.findUnique({
      where: { cacheKey },
    });
  }

  async upsert(input: {
    cacheKey: string;
    publicUrl: string;
    productId: string;
    variantId: string;
    designId: string;
  }) {
    return prisma.mockupCache.upsert({
      where: { cacheKey: input.cacheKey },
      create: {
        cacheKey: input.cacheKey,
        publicUrl: input.publicUrl,
        productId: input.productId,
        variantId: input.variantId,
        designId: input.designId,
      },
      update: { publicUrl: input.publicUrl },
    });
  }
}
