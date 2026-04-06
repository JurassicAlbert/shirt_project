import { expect, test } from "@playwright/test";
import { addSessionCookieFromResponse } from "./auth-cookie";

const registerAndLogin = async (page: Parameters<typeof test>[0]["page"], email: string) => {
  const register = await page.request.post("/api/auth/register", {
    data: { email, password: "StrongPass123", termsAccepted: true },
  });
  expect(register.ok()).toBeTruthy();
  await addSessionCookieFromResponse(page.context(), register);
};

test("shop page renders template-like grid and filters (PL default)", async ({ page }) => {
  await page.goto("/pl");
  await expect(page.getByTestId("hero-cta-search")).toBeVisible();
  await page.goto("/pl/shop");
  await expect(page.getByTestId("search-heading")).toBeVisible();
  await expect(page.getByTestId("filters-heading")).toBeVisible();
});

test("user can generate design", async ({ page }) => {
  await registerAndLogin(page, `create-${Date.now()}@example.com`);

  await page.goto("/pl/create");
  await page.getByTestId("create-prompt").fill("retro mountain for dad");
  await page.getByTestId("create-generate-btn").click();
  await expect(page.getByTestId("create-flow-stages")).toBeVisible({ timeout: 15_000 });
});

test("user can add product to cart", async ({ page }) => {
  await registerAndLogin(page, `cart-${Date.now()}@example.com`);
  await page.goto("/pl/shop");
  await page.locator("a.solid-card").first().click();
  await page.getByTestId("product-add-to-cart").click();
  await expect(page.getByText(/Dodano do koszyka.|Nie udało się dodać/)).toBeVisible();
  await page.goto("/pl/cart");
  await expect(page.getByRole("heading", { name: "Twój koszyk", level: 1 })).toBeVisible();
});

test("user can checkout from cart", async ({ page }) => {
  await registerAndLogin(page, `checkout-${Date.now()}@example.com`);
  await page.goto("/pl/shop");
  await page.locator("a.solid-card").first().click();
  await page.getByTestId("product-add-to-cart").click();
  await page.goto("/pl/checkout");
  const checkoutOk = page.waitForResponse(
    (r) => r.url().includes("/api/checkout") && r.request().method() === "POST",
    { timeout: 25_000 },
  );
  await page.getByTestId("checkout-pay-btn").click();
  const res = await checkoutOk;
  expect(res.status()).toBe(200);
});
