import { expect, test } from "@playwright/test";

const productId = "11111111-1111-1111-8111-111111111111";
const variantId = "a1111111-1111-1111-8111-111111111111";

test("register and login persist session", async ({ request }) => {
  const email = `user-${Date.now()}@example.com`;
  const password = "StrongPass123";

  const register = await request.post("/api/auth/register", {
    data: { email, password, termsAccepted: true },
  });
  expect(register.ok()).toBeTruthy();

  const me = await request.get("/api/auth/me");
  expect(me.ok()).toBeTruthy();
  const payload = await me.json();
  expect(payload.ok).toBe(true);
  expect(payload.data.email).toBe(email);
});

test("cart persists in database", async ({ request }) => {
  const email = `cart-${Date.now()}@example.com`;
  const password = "StrongPass123";
  await request.post("/api/auth/register", { data: { email, password, termsAccepted: true } });

  const add = await request.post("/api/cart/items", {
    data: {
      productId,
      variantId,
      quantity: 2,
    },
  });
  expect(add.ok()).toBeTruthy();

  const cart = await request.get("/api/cart");
  expect(cart.ok()).toBeTruthy();
  const cartPayload = await cart.json();
  expect(cartPayload.ok).toBe(true);
  expect(cartPayload.data.items.length).toBeGreaterThan(0);
  expect(cartPayload.data.items[0].quantity).toBe(2);
});

test("order persists after checkout creation", async ({ request }) => {
  const email = `order-${Date.now()}@example.com`;
  const password = "StrongPass123";
  await request.post("/api/auth/register", { data: { email, password, termsAccepted: true } });

  await request.post("/api/cart/items", {
    data: {
      productId,
      variantId,
      quantity: 1,
    },
  });

  const createOrder = await request.post("/api/orders");
  expect(createOrder.ok()).toBeTruthy();
  const created = await createOrder.json();
  expect(created.ok).toBe(true);
  expect(created.data.id).toBeTruthy();

  const orders = await request.get("/api/orders");
  expect(orders.ok()).toBeTruthy();
  const ordersPayload = await orders.json();
  expect(ordersPayload.ok).toBe(true);
  expect(ordersPayload.data.items.length).toBeGreaterThan(0);
  expect(ordersPayload.data.items[0].id).toBe(created.data.id);
});
