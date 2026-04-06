import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { addSessionCookieFromResponse } from "./auth-cookie";

const registerAndLogin = async (page: Page, email: string) => {
  const register = await page.request.post("/api/auth/register", {
    data: { email, password: "StrongPass123", termsAccepted: true },
  });
  expect(register.ok()).toBeTruthy();
  await addSessionCookieFromResponse(page.context(), register);
};

const loginAndInjectCookie = async (context: BrowserContext, page: Page, email: string, password: string) => {
  const login = await page.request.post("/api/auth/login", {
    data: { email, password },
  });
  expect(login.ok()).toBeTruthy();
  await addSessionCookieFromResponse(context, login);
};

test("user sees generation stages, preview pipeline, and buy path; admin can inspect jobs and orders", async ({ page, browser }) => {
  test.skip(!process.env.REDIS_URL?.trim(), "Set REDIS_URL and allow Playwright to start workers for AI + preview jobs.");
  test.setTimeout(300_000);
  const email = `coh-flow-${Date.now()}@example.com`;
  await registerAndLogin(page, email);

  await page.goto("/pl/create");
  await page.getByTestId("create-prompt").fill("e2e minimal line art mountain");
  await page.getByTestId("create-generate-btn").click();
  await expect(page.getByTestId("create-flow-stages")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("create-preview-btn")).toBeEnabled({ timeout: 180_000 });
  await page.getByTestId("create-preview-btn").click();
  await expect(page.getByTestId("preview-flow-stages")).toBeVisible();
  await expect(page.getByTestId("create-preview-image")).toBeVisible({ timeout: 180_000 });

  await page.goto("/pl/shop");
  await page.locator("a.solid-card").first().click();
  await page.getByTestId("product-add-to-cart").click();
  await page.goto("/pl/checkout");
  const checkoutOk = page.waitForResponse(
    (r) => r.url().includes("/api/checkout") && r.request().method() === "POST",
    { timeout: 25_000 },
  );
  await page.getByTestId("checkout-pay-btn").click();
  const checkoutRes = await checkoutOk;
  expect(checkoutRes.status()).toBe(200);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginAndInjectCookie(adminContext, adminPage, "admin@shirt.local", "AdminPass123");
  await adminPage.goto("/pl/admin/jobs");
  const jobRow = adminPage.getByTestId("admin-job-row").first();
  const emptyJobs = adminPage.getByText("Brak zadań dla tego filtra.");
  await expect(jobRow.or(emptyJobs)).toBeVisible({ timeout: 15_000 });
  if (await jobRow.isVisible()) {
    await jobRow.getByRole("button", { name: "Diagnostyka zadania" }).click();
    await expect(adminPage.getByRole("dialog", { name: "Diagnostyka zadania" })).toBeVisible();
    await adminPage.keyboard.press("Escape");
  }

  await adminPage.goto("/pl/admin/orders");
  const manage = adminPage.getByTestId("admin-order-manage").first();
  if (await manage.isVisible()) {
    await manage.click();
    await expect(adminPage.getByRole("dialog", { name: "Szczegóły i oś czasu" })).toBeVisible();
    await expect(adminPage.getByText("Dozwolone następne statusy")).toBeVisible();
    const transitionBtn = adminPage.locator('[data-testid^="admin-order-transition-"]').first();
    if (await transitionBtn.isVisible()) {
      await transitionBtn.click();
      await expect(adminPage.getByText("Dozwolone następne statusy")).toBeVisible();
    }
    await adminPage.getByRole("button", { name: "Zamknij" }).click();
  }

  await adminContext.close();
});
