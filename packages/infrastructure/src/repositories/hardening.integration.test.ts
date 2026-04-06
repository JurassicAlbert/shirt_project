import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db";
import { IdempotencyRepository } from "./idempotency-repository";
import { OrderRepository } from "./order-repository";

const orderRepository = new OrderRepository();
const idempotencyRepository = new IdempotencyRepository();

const createFixture = async (email: string, stock: number, quantity: number) => {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "x",
      termsAcceptedAt: new Date(),
    },
  });
  const supplier = await prisma.supplier.create({
    data: { name: `s-${Date.now()}-${Math.random()}`, adapter: "stub" },
  });
  const product = await prisma.product.create({
    data: {
      name: "Test Tee",
      slug: `test-tee-${Date.now()}-${Math.random()}`,
      type: "tshirt",
      vatRate: 23,
      supplierId: supplier.id,
    },
  });
  const variant = await prisma.variant.create({
    data: {
      productId: product.id,
      sku: `sku-${Date.now()}-${Math.random()}`,
      size: "M",
      color: "black",
      material: "cotton",
      stock,
      netPrice: 10,
      grossPrice: 12.3,
    },
  });
  const cart = await prisma.cart.create({ data: { userId: user.id, isActive: true } });
  const config = await prisma.productConfiguration.create({
    data: { productId: product.id, variantId: variant.id },
  });
  await prisma.cartItem.create({
    data: { cartId: cart.id, configurationId: config.id, quantity },
  });
  return { user, cart, variant };
};

describe("hardening integration", () => {
  beforeEach(async () => {
    await prisma.paymentAttempt.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productConfiguration.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: "@hardening.test" } } });
    await prisma.idempotencyRecord.deleteMany();
  });

  it("rolls back order transaction when stock is insufficient", async () => {
    const fixture = await createFixture(`rollback-${Date.now()}@hardening.test`, 1, 2);
    await expect(
      orderRepository.createFromCart({
        userId: fixture.user.id,
        cartId: fixture.cart.id,
      }),
    ).rejects.toThrow("insufficient_stock");

    const [ordersCount, variant, cart] = await Promise.all([
      prisma.order.count({ where: { userId: fixture.user.id } }),
      prisma.variant.findUnique({ where: { id: fixture.variant.id } }),
      prisma.cart.findUnique({ where: { id: fixture.cart.id } }),
    ]);
    expect(ordersCount).toBe(0);
    expect(variant?.stock).toBe(1);
    expect(cart?.isActive).toBe(true);
  });

  it("prevents oversell under concurrent order creation", async () => {
    const a = await createFixture(`a-${Date.now()}@hardening.test`, 1, 1);
    const b = await createFixture(`b-${Date.now()}@hardening.test`, 1, 1);
    await prisma.variant.update({ where: { id: b.variant.id }, data: { stock: 1, sku: `sku-b-${Date.now()}` } });
    // point cart B item to variant A so both race over same stock row
    const bItem = await prisma.cartItem.findFirstOrThrow({ where: { cartId: b.cart.id } });
    await prisma.productConfiguration.update({
      where: { id: bItem.configurationId },
      data: { variantId: a.variant.id, productId: (await prisma.variant.findUniqueOrThrow({ where: { id: a.variant.id } })).productId },
    });

    const [r1, r2] = await Promise.allSettled([
      orderRepository.createFromCart({ userId: a.user.id, cartId: a.cart.id }),
      orderRepository.createFromCart({ userId: b.user.id, cartId: b.cart.id }),
    ]);
    const successCount = [r1, r2].filter((r) => r.status === "fulfilled").length;
    expect(successCount).toBe(1);

    const variant = await prisma.variant.findUnique({ where: { id: a.variant.id } });
    expect(variant?.stock).toBe(0);
  });

  it("replays idempotent responses for same key and payload", async () => {
    const key = `k-${Date.now()}`;
    const started = await idempotencyRepository.tryBegin("checkout:test", key, { orderId: "1" });
    expect(started.kind).toBe("started");
    await idempotencyRepository.complete("checkout:test", key, {
      statusCode: 200,
      body: { ok: true, data: { orderId: "1" } },
    });
    const replay = await idempotencyRepository.tryBegin("checkout:test", key, { orderId: "1" });
    expect(replay.kind).toBe("replay");
    if (replay.kind === "replay") {
      expect(replay.response.body).toEqual({ ok: true, data: { orderId: "1" } });
    }
  });
});
