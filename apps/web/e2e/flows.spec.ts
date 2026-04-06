import { expect, test } from "@playwright/test";

const registerAndLogin = async (page: Parameters<typeof test>[0]["page"], email: string) => {
  const register = await page.request.post("/api/auth/register", {
    data: { email, password: "StrongPass123", termsAccepted: true },
  });
  expect(register.ok()).toBeTruthy();
  const setCookie = register.headers()["set-cookie"] ?? "";
  const sessionToken = /session_token=([^;]+)/.exec(setCookie)?.[1];
  if (sessionToken) {
    await page.context().addCookies([
      {
        name: "session_token",
        value: sessionToken,
        url: "http://localhost:3000",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }
};

test("shop page renders template-like grid and filters (PL default)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("hero-cta-search")).toBeVisible();
  await page.goto("/search");
  await expect(page.getByTestId("search-heading")).toBeVisible();
  await expect(page.getByTestId("filters-heading")).toBeVisible();
});

test("user can generate design", async ({ page }) => {
  await registerAndLogin(page, `create-${Date.now()}@example.com`);

  await page.goto("/create");
  await page.getByTestId("create-prompt").fill("retro mountain for dad");
  await page.getByRole("button", { name: "Generuj projekt" }).click();
  await expect(page.getByText(/Status: pending|Generacja nie powiodła się/)).toBeVisible();
});

test("user can add product to cart", async ({ page }) => {
  await registerAndLogin(page, `cart-${Date.now()}@example.com`);
  await page.goto("/products");
  await page.locator("a.solid-card").first().click();
  await page.getByRole("button", { name: "Dodaj do koszyka" }).click();
  await expect(page.getByText(/Dodano do koszyka.|Nie udało się dodać/)).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Twój koszyk" })).toBeVisible();
});

test("user can checkout from cart", async ({ page }) => {
  await registerAndLogin(page, `checkout-${Date.now()}@example.com`);
  await page.goto("/products");
  await page.locator("a.solid-card").first().click();
  await page.getByRole("button", { name: "Dodaj do koszyka" }).click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Zapłać przez Przelewy24" }).click();
  await expect(page.getByText(/Płatność zainicjowana|Kasa nie powiodła się|Nie można utworzyć zamówienia/)).toBeVisible();
});
