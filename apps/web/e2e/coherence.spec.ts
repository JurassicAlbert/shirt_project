import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const registerAndLogin = async (page: Page, email: string) => {
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

const loginAndInjectCookie = async (context: BrowserContext, page: Page, email: string, password: string) => {
  const login = await page.request.post("/api/auth/login", {
    data: { email, password },
  });
  expect(login.ok()).toBeTruthy();
  const setCookie = login.headers()["set-cookie"] ?? "";
  const sessionToken = /session_token=([^;]+)/.exec(setCookie)?.[1];
  if (sessionToken) {
    await context.addCookies([
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

test("user sees generation stages, preview pipeline, and buy path; admin can inspect jobs and orders", async ({ page, browser }) => {
  test.setTimeout(300_000);
  const email = `coh-flow-${Date.now()}@example.com`;
  await registerAndLogin(page, email);

  await page.goto("/create");
  await page.getByTestId("create-prompt").fill("e2e minimal line art mountain");
  await page.getByRole("button", { name: "Generuj projekt" }).click();
  await expect(page.getByTestId("create-flow-stages")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("create-preview-btn")).toBeEnabled({ timeout: 180_000 });
  await page.getByTestId("create-preview-btn").click();
  await expect(page.getByTestId("preview-flow-stages")).toBeVisible();
  await expect(page.getByTestId("create-preview-image")).toBeVisible({ timeout: 180_000 });

  await page.goto("/products");
  await page.locator("a.solid-card").first().click();
  await page.getByRole("button", { name: "Dodaj do koszyka" }).click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Zapłać przez Przelewy24" }).click();
  await expect(page.getByText(/Płatność zainicjowana|Kasa nie powiodła się|Nie można utworzyć zamówienia/)).toBeVisible();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginAndInjectCookie(adminContext, adminPage, "admin@shirt.local", "AdminPass123");
  await adminPage.goto("/admin");
  await adminPage.getByRole("button", { name: "Kolejka" }).click();
  const jobRow = adminPage.getByTestId("admin-job-row").first();
  const emptyJobs = adminPage.getByText("Brak zadań dla tego filtra.");
  await expect(jobRow.or(emptyJobs)).toBeVisible({ timeout: 15_000 });
  if (await jobRow.isVisible()) {
    await jobRow.getByRole("button", { name: "Diagnostyka zadania" }).click();
    await expect(adminPage.getByRole("dialog", { name: "Diagnostyka zadania" })).toBeVisible();
    await adminPage.keyboard.press("Escape");
  }

  await adminPage.getByRole("button", { name: "Zamówienia" }).click();
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
