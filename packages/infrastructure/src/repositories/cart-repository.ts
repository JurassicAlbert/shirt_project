import { prisma } from "../db";

export class CartRepository {
  async getOrCreateActiveCart(userId: string) {
    const existing = await prisma.cart.findFirst({
      where: { userId, isActive: true },
    });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId, isActive: true } });
  }

  async getActiveCartWithItems(userId: string) {
    const cart = await this.getOrCreateActiveCart(userId);
    return prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            configuration: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
      },
    });
  }

  async addItem(input: {
    userId: string;
    productId: string;
    variantId: string;
    designId?: string;
    textOverlay?: string;
    quantity: number;
  }) {
    const cart = await this.getOrCreateActiveCart(input.userId);
    const configuration = await prisma.productConfiguration.create({
      data: {
        productId: input.productId,
        variantId: input.variantId,
        designId: input.designId,
        textOverlay: input.textOverlay,
      },
    });

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        configurationId: configuration.id,
        quantity: input.quantity,
      },
      include: {
        configuration: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  async updateItemQuantity(input: { userId: string; itemId: string; quantity: number }) {
    const cart = await this.getOrCreateActiveCart(input.userId);
    return prisma.cartItem.updateMany({
      where: { id: input.itemId, cartId: cart.id },
      data: { quantity: input.quantity },
    });
  }

  async removeItem(input: { userId: string; itemId: string }) {
    const cart = await this.getOrCreateActiveCart(input.userId);
    return prisma.cartItem.deleteMany({
      where: { id: input.itemId, cartId: cart.id },
    });
  }

  async clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
