import type { Product, Variant } from "@prisma/client";
import { prisma } from "../db";

export class ProductRepository {
  async list(): Promise<(Product & { variants: Variant[] })[]> {
    return prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string): Promise<(Product & { variants: Variant[] }) | null> {
    return prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
  }

  async findVariant(variantId: string): Promise<Variant | null> {
    return prisma.variant.findUnique({ where: { id: variantId } });
  }
}
