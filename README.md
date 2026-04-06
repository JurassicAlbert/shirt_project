# shirt_project

AI-powered design-to-product eCommerce MVP (Next.js App Router, PostgreSQL, Prisma).

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ with the `pgvector` extension (Docker image `pgvector/pgvector:pg16` is recommended)

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` – PostgreSQL connection string (with the included Docker setup, use **port `5433`** on the host — see `docker-compose.yml`)
- `JWT_SECRET` – long random secret for signing session cookies
- `REDIS_URL` – Redis for BullMQ (`redis://localhost:6379` with the default `docker-compose.yml`)
- `OPENAI_API_KEY` – required for AI image generation and embedding-based search

## Database

Start Postgres and Redis (recommended):

```bash
npm run db:up
npm run db:status
```

Verify Redis:

```bash
npm run redis:ping
```

To start **only** Postgres: `docker compose up -d db`.

## Background workers (AI + mockups)

AI generation and mockup rendering run in **BullMQ workers**, not inside the Next.js request thread. After `docker compose up -d` and with `REDIS_URL` set, run in a second terminal:

```bash
npm run workers
```

Without workers, `POST /api/designs/generate` and `POST /api/previews` enqueue jobs but they will not complete until a worker process is running.

### “Can't reach database server at `localhost:5433`”

Nothing is accepting TCP connections on that host/port. Usually:

1. **Docker isn’t running** – Start **Docker Desktop** (Windows) and wait until it is idle/green.
2. **The DB container isn’t up** – From the project root: `npm run db:up`, then `npm run db:status` (container `db` should be “running”).
3. **Stale container after a port change** – `npm run db:down` then `npm run db:up`, then `npm run db:ping`.

If you **don’t use Docker**, point `DATABASE_URL` at a Postgres instance you actually run (host, port, user, password, database name).

### “Authentication failed … credentials for `postgres` are not valid” (Prisma `P1000`)

That message means **the server on `DATABASE_URL`’s host/port rejected the user/password**.

**This repo’s Docker database is published on host port `5433`** (not `5432`) so it does not fight a typical Windows PostgreSQL service on `5432`. Your `.env` must use:

`postgresql://postgres:postgres@localhost:5433/shirt_project?schema=public`

Typical causes:

1. **`.env` still points at `localhost:5432`** – You are hitting another Postgres (often local Windows) with a different password. **Update `DATABASE_URL` to port `5433`** after `docker compose up -d`.
2. **Wrong password** – If you intentionally use port `5432`, set `DATABASE_URL` to the real user/password for *that* server.
3. **Docker DB not running** – Run `docker compose ps` and ensure the `db` container is up.

After fixing `.env`, restart the dev server (`npm run dev`).

**Quick check from the app’s perspective** (loads `.env`, masks password in the log):

```bash
npm run db:ping
```

**If you use this repo’s Docker Compose database**, verify the container accepts the default user (should print `?column?` / `1`):

```bash
docker compose up -d
npm run db:docker:ping
```

- If `db:docker:ping` **works** but `db:ping` **fails**, your `.env` `DATABASE_URL` does not match Docker (wrong port is most common: use **`5433`** with the default `docker-compose.yml`).

**Alternative** (Prisma CLI):

```bash
echo "SELECT 1;" | npx prisma db execute --stdin --schema prisma/schema.prisma
```

(requires `DATABASE_URL` in the environment; from Git Bash you can `set -a && source .env && set +a` first if needed.)

Apply migrations and seed catalog + admin user:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

Seeded admin (for `/api/admin/*`):

- Email: `admin@shirt.local`
- Password: `AdminPass123`

## Development

```bash
npm install
npm run prisma:generate
npm run db:up
npm run db:ping
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

In another terminal (with Redis up and `REDIS_URL` set): `npm run workers`.

## Tests

```bash
npm run test        # unit + contract (Vitest)
npm run test:e2e    # Playwright (requires DB running + migrate + seed; globalSetup runs migrate + seed)
```

## Architecture

- `apps/web` – UI and API routes (no direct Prisma usage in route handlers)
- `packages/infrastructure` – Prisma client, repositories, mockup engine
- `packages/jobs` – BullMQ queues, producers, worker entrypoints
- `packages/contracts` – Zod API contracts
- `packages/domain` / `packages/application` – pure rules and use-cases

See `docs/IMPLEMENTATION_REPORT.md` for the full system description.
