import { execSync } from "node:child_process";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env") });

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for E2E (set in .env)");
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  execSync("npx prisma db seed", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
}
