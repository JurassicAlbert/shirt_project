import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

const webServers: NonNullable<Parameters<typeof defineConfig>[0]["webServer"]> = [
  {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
];

if (process.env.REDIS_URL?.trim()) {
  webServers.push({
    command: "npm run workers",
    name: "workers",
    reuseExistingServer: true,
    timeout: 90_000,
    stdout: "pipe",
    wait: {
      stdout: /\[workers\] AI \+ mockup workers listening/,
    },
  });
}

export default defineConfig({
  globalSetup: "./playwright.global-setup.ts",
  testDir: "./apps/web/e2e",
  webServer: webServers,
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
