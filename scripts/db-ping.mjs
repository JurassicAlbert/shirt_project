import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env in the project root.");
  process.exit(1);
}

const safe = url.replace(/:([^:@/]+)@/, ":****@");
console.log("Using:", safe);

const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("OK: database accepted credentials and responded to SELECT 1.");
} catch (e) {
  const msg = String(e.message ?? e);
  console.error("FAILED:", msg);
  console.error("\nTypical fixes:");
  if (/Can't reach database server|P1001|ECONNREFUSED/i.test(msg)) {
    console.error("- Nothing is listening on the host/port in DATABASE_URL.");
    console.error("- Start Docker Desktop (Windows), then from the project root run: npm run db:up");
    console.error("- Check the container: npm run db:status   (should show shirt_project-db-1 or similar as running)");
    console.error("- First-time or after changing ports: npm run db:down && npm run db:up");
  }
  if (/P1000|Authentication failed/i.test(msg)) {
    console.error("- Wrong user/password for the server you are connecting to; fix DATABASE_URL.");
  }
  console.error("- This repo maps Postgres to host port 5433 (see docker-compose.yml).");
  console.error("- Or use your own Postgres: set DATABASE_URL to match that instance.");
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
