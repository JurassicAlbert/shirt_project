# IMPLEMENTATION REPORT

## 1. Architecture overview

- Stack: Next.js App Router + TypeScript + Tailwind + PostgreSQL/Prisma + pgvector-ready schema.
- Architecture style: feature-based modular monolith with package boundaries:
  - `apps/web` (UI + API routes/BFF)
  - `packages/domain` (pure business rules)
  - `packages/application` (use-cases/orchestration)
  - `packages/infrastructure` (provider adapters)
  - `packages/contracts` (API schemas and route contracts)
- API-first design with contract validation (`zod`) for key flows.
- Adapter pattern used for AI generation, payment, and supplier operations.

## 2. Module breakdown

- Design Engine: prompt validation, AI generation endpoint, status output.
- Product Engine: catalog and product detail APIs with VAT-visible pricing.
- Configuration Engine: variant validation and configurable product path.
- Preview Engine: product preview endpoint (`/api/previews`), fallback-ready.
- Search Engine: inspire page and API with merged result surface.
- AI Cost Control Engine: daily limit + per-minute rate limiting in `ai-guard`.
- Order Management: checkout and payment-init flow, recoverable state handling.
- Supplier Integration Layer: supplier adapter with availability checks.
- Returns & Dispute Engine: returns endpoint + domain abuse rules.
- User System: role contracts defined and account area scaffolded.
- Admin Panel: KPI/orders/returns/moderation sections and APIs.
- Analytics: admin KPI endpoint with dashboard-ready payload.

## 3. Data model (with explanations)

Implemented in `prisma/schema.prisma`:

- Required:
  - `User`: identity + role + relations.
  - `Product`: catalog item and VAT settings.
  - `Variant`: size/color/material/price/stock per product.
  - `Supplier`: adapter identity and active state.
  - `Design`: AI/internal/external source, prompt hash, moderation fields.
  - `ProductConfiguration`: product + variant + optional design + text overlay + preview image.
  - `Order`: monetary totals and payment/order status lifecycle.
  - `OrderItem`: ordered configuration snapshot and VAT-aware price fields.
  - `ReturnRequest`: reason/status with abuse score support.
- Supporting:
  - `Cart`, `CartItem`, `PaymentAttempt`, `AiUsageLedger`, `SearchEmbedding`, `ModerationAction`, `AuditLog`.
- pgvector-ready columns are included via `Unsupported("vector")`.

## 4. Flow diagrams (all flows)

### Quick Buy

```mermaid
flowchart TD
  Home --> Products
  Products --> ProductDetail
  ProductDetail --> Cart
  Cart --> Checkout
  Checkout --> PaymentInit
  PaymentInit --> OrderConfirmed
```

### Inspire

```mermaid
flowchart TD
  Home --> SearchPage
  SearchPage --> ProductPreview
  ProductPreview --> ProductDetail
  ProductDetail --> Cart
  Cart --> Checkout
  Checkout --> OrderConfirmed
```

### Create

```mermaid
flowchart TD
  Home --> CreatePage
  CreatePage --> GenerateDesign
  GenerateDesign --> EditTextOverlay
  EditTextOverlay --> MockupPreview
  MockupPreview --> ProductDetail
  ProductDetail --> Cart
  Cart --> Checkout
  Checkout --> OrderConfirmed
```

## 5. Test matrix

Primary matrix and strategy are documented in:
- `docs/TEST_PLAN.md`
- `docs/TEST_MATRIX.md`

Executed coverage includes:
- Domain tests for pricing, config validation, AI limits, dedupe, payment recovery, return abuse.
- Contract tests for API schemas/routes.
- E2E tests for all mandatory flows: Quick Buy, Inspire, Create.

## 6. Edge cases handled

- AI timeout: modeled in schema/status design (`timed_out`) and test planning.
- Duplicate designs: prompt hash/perceptual hash fields + dedupe domain logic.
- Supplier unavailable: stock is enforced at order creation time via variant `stock` decrements.
- Invalid variant: strict domain validation path.
- Preview failure: preview endpoint is isolated and fallback-ready by design.
- User spam/AI abuse: per-minute limiter + daily limit.
- Payment failure: recoverable order state in domain logic.
- Return abuse: rule-based escalation in returns domain function.

## 7. API structure

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Catalog:
  - `GET /api/products`
  - `GET /api/products/:id`
- Inspire/Search:
  - `GET /api/search`
- Create:
  - `POST /api/designs/generate`
  - `POST /api/designs/:id/edit`
  - `POST /api/previews`
- Cart/Checkout/Payments:
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items`
  - `DELETE /api/cart/items`
  - `POST /api/orders`
  - `GET /api/orders`
  - `GET /api/account/orders`
  - `POST /api/checkout` (validated payload + payment intent)
  - `POST /api/payments/przelewy24/init`
  - `POST /api/payments/przelewy24/webhook`
- Returns:
  - `POST /api/returns`
- Admin:
  - `GET /api/admin/kpi`
  - `GET /api/admin/orders`
  - `GET /api/admin/returns`
  - `GET /api/admin/moderation`

## 8. UX structure (screens + logic)

- Homepage: hero search CTA, categories, create CTA, trending designs, collections.
- Search/Inspire: sticky search input, mixed results grid, quick preview path.
- Product page: dynamic preview area, variant choices, VAT-visible price, edit/create CTA.
- Create page: prompt input, async generate states, text overlay field, non-blocking UX.
- Cart: configuration and pricing breakdown area.
- Checkout: address and payment start action.
- Account: orders and returns sections.
- Admin: KPI/orders/returns/moderation/product-supplier management sections.
- Navigation keeps one primary guided path while exposing alternate flows.

## 9. Performance strategies

- Contract-level validation to fail fast and prevent expensive processing.
- Prompt-level caching via provider-level cache strategy.
- AI rate limits (daily + per-minute) to control spend/abuse.
- API modularization supports moving heavy operations to async workers later.
- Prisma schema prepared for indexing and vector search expansion.

## 10. What is NOT implemented yet (future-ready notes)

- Przelewy24 signature verification and full provider-specific reconciliation details.
- Advanced moderation/analytics persistence workflows still pending.
- Production tuning for pgvector index strategy (IVFFlat/HNSW) and offline embedding backfills.
- Durable queue backend (Redis/SQS) with retry policies and dead-letter handling.
- Comprehensive admin moderation workflows and analytics warehouse exports.

## 11. Database Implementation (REAL)

- All core entities are persisted through PostgreSQL/Prisma models.
- Runtime data paths for users, carts, cart items, product configurations, and orders are database-backed.
- Added structural constraints/indexes for high-frequency lookups:
  - `User.email` unique
  - `AiUsageLedger(userId, dayKey)` unique
  - cart, order, return, product, and variant indexes for query paths
- Added `termsAcceptedAt` to `User` and relation-backed integrity between cart/order/configuration records.

## 12. Removed Mock Systems (LIST WHAT WAS REMOVED)

- Removed previous volatile data-store module from `apps/web/src/lib`.
- Replaced in-memory cart/design/product state with repository + Prisma persistence.
- Replaced route-level fake storage writes with repository writes:
  - cart items
  - cart reads
  - design generation records
  - order creation from persisted cart
- AI image URLs and payment redirect URLs are synthesized at the provider boundary until production credentials are configured.

## 13. Authentication Flow

- Register: `POST /api/auth/register`
  - validates payload with zod
  - hashes password with bcrypt
  - creates user in DB
  - stores HTTP-only session cookie with JWT
- Login: `POST /api/auth/login`
  - validates credentials
  - verifies password hash
  - refreshes session cookie
- Session check: `GET /api/auth/me`
  - resolves user from signed cookie session
- Protected route middleware enforces session for cart, checkout, orders, returns, designs, account, admin, and payment-init API paths.

## 14. Persistence Proof (HOW DATA IS VERIFIED IN DB)

- Playwright `globalSetup` runs `prisma migrate deploy` and `prisma db seed` before E2E so the app always targets a real migrated schema plus baseline catalog data.
- Local database: use `docker compose up -d` (see `docker-compose.yml`) or any PostgreSQL 16+ instance with the `vector` extension available; set `DATABASE_URL` and `JWT_SECRET` in `.env` (see `.env.example`).
- `npm run dev` loads `.env` via `dotenv-cli` so Next.js and Prisma share the same connection string.
- Integration-style API tests in `apps/web/e2e/persistence.spec.ts` verify:
  - registration/login with persisted user/session
  - add-to-cart then read cart again (data survives request boundaries)
  - create order from cart and verify order exists in subsequent `GET /api/orders`
- Repositories are the only write path from routes to storage for User/Product/Cart/Order operations.
- No in-memory arrays are used as runtime storage for cart/order/user/product/design records.

## 15. Transaction Handling

- `OrderRepository.createFromCart` runs as a single DB transaction for:
  - cart validation
  - order + order items creation
  - stock reservation/decrement
  - cart deactivation
- If any operation fails (e.g. stock check/update race), Prisma transaction throws and all writes roll back.
- Integration test: `packages/infrastructure/src/repositories/hardening.integration.test.ts` verifies rollback leaves stock/cart/order unchanged.

## 16. Concurrency Control

- Stock protection uses optimistic locking on `Variant`:
  - new `version` column
  - guarded `updateMany` with `where: { id, version, stock >= qty }`
  - atomic `stock decrement + version increment`
- This prevents overselling under concurrent order creation.
- Integration test validates two concurrent orders competing for stock result in exactly one success.

## 17. Idempotency Strategy

- Added `IdempotencyRecord` table with unique `(scope, key)`, request hash, stored response body/status, and in-flight marker.
- Implemented `IdempotencyRepository` + `withIdempotency` helper:
  - first request: reserves key and executes handler
  - duplicate same payload: returns stored response
  - duplicate different payload: `409 CONFLICT`
  - in-flight duplicate: `409 CONFLICT`
- Applied to:
  - `POST /api/checkout`
  - `POST /api/payments/przelewy24/webhook`
  - `POST /api/orders` (additional safety for duplicate order creation)

## 18. Order State Machine

- Canonical statuses now:
  - `created`
  - `payment_pending`
  - `paid`
  - `failed`
  - `shipped`
  - `completed`
- Transition rules enforced in `apps/web/src/lib/order-state-machine.ts`.
- All transitions are validated before update, and persisted in `OrderTransitionLog`.
- Added admin transition endpoint:
  - `PATCH /api/orders/:id/status`
  - rejects invalid transitions with `400`.

## 19. AI Integration (REAL)

- Replaced AI stub generation with real OpenAI Images HTTP call (`/v1/images/generations`) in infrastructure adapter.
- Added robust error surface:
  - missing key: `openai_api_key_missing`
  - upstream non-2xx: `openai_image_failed:*`
  - malformed/empty payload handling.
- Design generation is now async:
  - create design with `pending` status
  - queue worker executes generation
  - status becomes `completed` with `imageUrl`, or `failed` with `errorMessage`.
- Added endpoint for status polling:
  - `GET /api/designs/:id`

## 20. Mockup Engine Implementation

- Implemented server-side compositing with `sharp` in `packages/infrastructure/src/mockup-engine.ts` (`generateMockupPngBuffer` / `generateMockupDataUrl`):
  - generated base product canvas
  - downloaded/decoded AI design image
  - composited design + optional text overlay
- `POST /api/previews` checks `MockupCache` by deterministic cache key (`productId` + `variantId` + `designId` + `textOverlay`); on miss enqueues BullMQ mockup job and returns `202` with `jobId` + `pollJobUrl`.
- Workers write PNG files under `apps/web/public/generated/mockups` (override with `GENERATED_MOCKUPS_DIR`) and expose stable URLs (`PUBLIC_ASSET_BASE_URL` + `/generated/mockups/{key}.png`).

## 21. Queue System (BullMQ / Redis)

- Added workspace package `@shirt/jobs` with BullMQ queues: `ai-generation`, `mockup-generation`.
- Redis service in `docker-compose.yml` (`redis:7-alpine`, AOF on) and `REDIS_URL` in `.env.example`.
- API routes enqueue jobs with stable BullMQ `jobId` = `BackgroundJob.id` for correlation.
- Run workers separately: `npm run workers` (loads `.env`, executes `scripts/workers.ts` → `runAllWorkers()`).
- `BackgroundJob` Prisma model tracks status, attempts, payload, result, and dead-letter terminal state.

## 22. Retry Strategy

- Default BullMQ options (`packages/jobs/src/queue-config.ts`): `attempts: 5`, exponential backoff base delay `2000ms` (doubles per attempt).
- Worker updates `BackgroundJob.attemptCount` / `errorReason` on intermediate failures; successful runs set `completed` with `result` JSON.

## 23. Dead Letter Handling

- When attempts are exhausted, workers mark `BackgroundJob.status = dead_letter` and persist `errorReason` (AI jobs also mark the `Design` as `failed`).
- Admin listing: `GET /api/admin/jobs?status=dead_letter` (default).
- Admin retry: `POST /api/admin/jobs/:id/retry` resets the row and re-enqueues (AI jobs reset design to `pending`).

## 24. Caching Strategy

- Mockup: `MockupCache` table keyed by SHA-256 of product + variant + design + overlay text; worker short-circuits on cache hit.
- Rate limit buckets use Redis when `REDIS_URL` is set; otherwise in-memory fixed window (per-process) for local dev.
- Generated mockup files on disk are reused via public URL path (CDN-ready via `PUBLIC_ASSET_BASE_URL`).

## 25. Search Ranking Logic

- Hybrid score in `apps/web/src/lib/search-ranking.ts`: blends vector similarity (from pgvector query), normalized `Product.popularityScore` (incremented on order placement), and recency boost from `Product.createdAt`.
- `diversifyByType` limits how many results share the same `Product.type` before backfilling, reducing duplicate-feeling grids.
- Lexical filter still applies as baseline; semantic path activates for queries length ≥ 3.

## 26. Rate Limiting

- Shared helper `checkRateLimit` (`apps/web/src/lib/rate-limit.ts`) with per-IP and optional per-user limits over a 60s window.
- Applied to: `GET /api/search`, `POST /api/designs/generate`, `GET /api/cart`, `POST|PATCH|DELETE /api/cart/items`, `GET|POST /api/orders`, `POST /api/checkout`, `POST /api/payments/przelewy24/init`, `POST /api/previews`.
- Violations return `429` with `RATE_LIMITED` and `Retry-After` header (`apiRateLimited`).

## 27. Audit System

- `Order` transitions already logged in `OrderTransitionLog`; `OrderRepository.updateStatus` now also writes `AuditLog` rows (`eventType: order_status_change`).
- Return admin decisions: `PATCH /api/admin/returns/:id` writes `AuditLog` (`eventType: return_decision`) with previous/new status.
- Order soft delete: `POST /api/admin/orders/:id/archive` sets `Order.deletedAt` and audits (`order_soft_delete`). List/read paths filter `deletedAt IS NULL`.
- `ReturnRequest` includes `deletedAt` for soft-delete support (queries filter active rows in admin listings).

## 28. Frontend Architecture

- App Router frontend uses `next-intl` with locales `pl` (default) and `en` (`localePrefix: as-needed`, so Polish URLs omit `/pl`).
- Route groups:
  - `(store)` shop shell: `/`, `/search`, `/products`, `/products/:id`, `/create`, `/cart`, `/checkout`, `/account`, `/login`, `/register` — shared `ShopHeader` + `ShopFooter`.
  - `admin`: `/admin` — full-viewport Materio-style MUI shell without shop chrome.
- Shop uses Tailwind (`solid-section`, `solid-card`, `solid-card-hover`) plus optional `next/image` for catalog and marketing imagery.
- Data flow remains API-first; client pages use loading, empty, and error affordances.

## 29. Template Mapping (what reused from templates)

- Shop template mapping (`solid-nextjs` reference):
  - top nav + wide container + hero CTA structure
  - sidebar filters + product grid pattern
  - product detail split layout (media left, purchase context right)
  - card spacing, rounded borders, section rhythm, typography hierarchy
- Admin template mapping (`materio` reference):
  - persistent left drawer
  - top app bar
  - KPI cards and tabbed management sections (orders, returns, jobs, moderation)
  - Material UI components for layout primitives and list/card controls

## 30. UX Decisions (how flows implemented)

- Non-blocking async design:
  - Create page shows pending generation state and polls status endpoint
  - Preview generation supports queued job completion via job polling
- Cart and checkout flows prioritize short paths and clear status feedback.
- Error/empty/loading states are rendered on shop and account screens instead of silent failures.
- Admin lists render raw operational records to reduce ambiguity during moderation and queue triage.

## 31. API Integration (frontend ↔ backend)

- Connected endpoints:
  - Search: `GET /api/search`
  - AI generation: `POST /api/designs/generate` + `GET /api/designs/:id`
  - Preview: `POST /api/previews` + `GET /api/jobs/:id`
  - Cart: `GET /api/cart`, `POST /api/cart/items`
  - Orders/checkout: `POST /api/orders`, `POST /api/checkout`
  - Account: `GET /api/account/orders`
  - Admin: `GET /api/admin/kpi|orders|returns|jobs|moderation`, `POST /api/admin/designs/:id/moderate`, plus job retry and return/archive actions
- All critical user operations surface backend response states in UI messaging.

## 32. UI Template Verification

- **Solid (shop)** — Structural alignment with [Solid Next.js](https://solid.demo.nextjstemplates.com/) / [solid-nextjs](https://github.com/NextJSTemplates/solid-nextjs/):
  - Sticky top bar, centered max-width container (`solid-section`), card-based surfaces (`solid-card`), hero with eyebrow + H1 + dual CTAs + imagery grid, category tiles, product grid with consistent gaps, testimonial cards, closing gradient CTA band.
  - Tailwind-only shop chrome (no MUI on storefront).
- **Materio (admin)** — Alignment with [Materio MUI Next.js Admin Template Free](https://demos.themeselection.com/materio-mui-nextjs-admin-template-free/demo) / [materio-mui-nextjs-admin-template-free](https://github.com/themeselection/materio-mui-nextjs-admin-template-free):
  - Permanent left drawer (~260px), light app bar, content on `#F5F5F9`, primary accent `#9155FD`, KPI stat cards, data tables in bordered `Paper`, moderation cards with actions.
- **Images**: Remote `images.unsplash.com` allowed in `next.config.ts` for marketing and catalog thumbnails (`catalog-images` slug map + seed slugs).

## 33. Localization System

- **Library**: `next-intl` with plugin in `next.config.ts` and request config in `src/i18n/request.ts`.
- **Routing**: `src/i18n/routing.ts` — locales `pl`, `en`; default `pl`; `localePrefix: as-needed`.
- **Middleware**: `src/middleware.ts` chains `next-intl` middleware for page routes and preserves JWT session checks for protected `/api/*` paths.
- **Messages**: `apps/web/messages/pl.json` (default copy) and `en.json`; namespaces include `nav`, `common`, `home`, `search`, `products`, `product`, `create`, `cart`, `checkout`, `account`, `auth`, `admin`, `footer`.
- **Navigation**: `src/i18n/navigation.ts` exports localized `Link`, `useRouter`, `usePathname`, etc.
- **Switcher**: `LanguageSwitcher` (PL/EN) in `ShopHeader`; switches locale while preserving path.
- **Admin**: Uses the same message files (`useTranslations("admin")`, `useTranslations("common")`).

## 34. Auth UI Implementation

- **Routes**: `/login` and `/register` under the store layout (localized).
- **Login**: Email + password, client validation (min password length, email shape), `POST /api/auth/login`, error mapping (`UNAUTHORIZED` → translated message), success flash then redirect to `/account`.
- **Register**: Email + password + mandatory terms checkbox; `POST /api/auth/register` with `termsAccepted: true` (matches `registerRequestSchema`), `CONFLICT` for duplicate email, success redirect to `/account`.
- **Session**: HTTP-only cookie set by API; shop cart and checkout still require authenticated API calls as before.

## 35. Page Section Breakdown

Each row lists **sections → main components → purpose**.

### Home (`/`)

| Section | Components | Purpose |
| --- | --- | --- |
| Hero | `Link` (CTAs), `Image` grid, typography | Value proposition and primary funnels to search / AI create. |
| Categories | Three `Link` cards with `Image` | Drive traffic to filtered shop (t-shirt / hoodie / mug). |
| Trending | `ProductCardImage`, product `Link`s | Social proof of assortment; min. 8 items from DB ordered by `popularityScore`. |
| How it works | Three step cards | Explain search/create → configure → checkout. |
| Social proof | Rating chip + three blockquotes | Trust and qualitative reviews. |
| CTA band | Gradient panel + `Link` | Final conversion to shop. |

### Search (`/search`)

| Section | Components | Purpose |
| --- | --- | --- |
| Filters sidebar | Text filter, radio type filters | Narrow catalog; `?type=` from home pre-selects type via `useSearchParams`. |
| Results | Sort `<select>`, product grid with `ProductCardImage` | Browse and sort (`GET /api/search` with `sort` query). |

### Products list (`/products`)

| Section | Components | Purpose |
| --- | --- | --- |
| Grid | `ProductCardImage`, `Link` per product | Full catalog overview from server-side `productRepository.list()`. |

### Product detail (`/products/[id]`)

| Section | Components | Purpose |
| --- | --- | --- |
| Media | `next/image` + `productImageUrl` | Visual mockup-style presentation by slug/type. |
| Buy box | Variant `<select>`, price for selected variant, add to cart, link to create | Configure and add line to cart via `POST /api/cart/items`. |
| Delivery | Info panel | Set expectations for PL shipping and lead time. |

### Create (`/create`)

| Section | Components | Purpose |
| --- | --- | --- |
| Prompt | `textarea`, example prompt chips, generate button | Start AI generation (`POST /api/designs/generate`). |
| Results grid | Job/status card, overlay + preview actions, preview image | Poll design status; build mockup via `POST /api/previews` and job poll. |

### Cart (`/cart`)

| Section | Components | Purpose |
| --- | --- | --- |
| Line items | Thumbnails (`ProductCardImage`), quantities × price | Reflect `GET /api/cart`. |
| Empty state | Copy + links to home/search | Guided recovery (no bare “empty”). |
| Summary | Total, delivery note, checkout `Link` | Proceed to checkout when items exist. |

### Checkout (`/checkout`)

| Section | Components | Purpose |
| --- | --- | --- |
| Address | Controlled inputs | Collect delivery identity (submitted in `POST /api/checkout` body). |
| Payment | Przelewy24 CTA | Create order then checkout intent. |
| Summary | Address recap + hint | Confirm what will be paid for. |

### Account (`/account`)

| Section | Components | Purpose |
| --- | --- | --- |
| Orders | List from `GET /api/account/orders`, skeleton loading | Order history; empty state with CTA. |
| Returns | Copy + support CTA | Explain return policy path (no dead end). |

### Login / Register

| Section | Components | Purpose |
| --- | --- | --- |
| Form | Fields, validation messages, submit | Authenticate or onboard; cross-links between routes. |

### Admin (`/admin`)

| Section | Components | Purpose |
| --- | --- | --- |
| Shell | MUI `Drawer`, `AppBar`, mobile icon nav | Materio-like navigation between views. |
| Dashboard | Four KPI `Card`s | Snapshot from `GET /api/admin/kpi`. |
| Orders / Returns | `Table` in `Paper` | Operational lists from admin APIs. |
| Jobs | Status filter buttons, `Table`, retry on dead letter | Queue visibility + `POST /api/admin/jobs/:id/retry`. |
| Moderation | Card per design with image, approve/reject | `POST /api/admin/designs/:id/moderate` writes `ModerationAction` and updates design status. |

## 36. State visualization

- **Orders (customer)**: `GET /api/account/orders/:id` returns timeline steps and transition history; account order detail uses `OrderTimelineStrip` plus “what happens next” hints aligned with `ORDER_TIMELINE_FLOW` / `getAllowedOrderTransitions`.
- **Orders (admin)**: Order dialog loads the same timeline model, shows **recorded status changes** (`transitionLog`), and **allowed next statuses** as actionable buttons → `PATCH /api/orders/:id/status` (admin-only).
- **AI generation (create)**: `CreateFlowStages` maps design + job state to three user stages (queued → generating → ready), shows a simple job line (`state.jobSimple`), estimated-time hint, and failure path with `FlowErrorPanel` + retry.
- **Mockup / preview jobs**: `PreviewFlowStages` lists preview pipeline steps; create page polls `/api/jobs/:id` and surfaces completion, dead-letter, and retry.
- **Admin jobs**: Jobs table shows status, attempts, error column; row actions open a **debug dialog** (payload/result JSON) and **retry** for `failed` / `dead_letter` via `POST /api/admin/jobs/:id/retry`.

## 37. UX feedback system

- **Toasts**: `sonner` via `AppToaster` in the locale layout — success/error/info on create (generation + preview), admin actions (transitions, moderation, job retry, return decision), add-to-cart, and checkout start/failure.
- **Errors**: `FlowErrorPanel` standardizes copy: clear message, retry when applicable, and **contact support** / browse fallback (`Link` to search).
- **Loading**: Account orders list uses **skeleton** rows instead of a blank page; admin boot shows **MUI Skeleton** KPI/dashboard placeholders.
- **Empty states**: Admin tables for orders, returns, jobs, and moderation use dashed cards with explanatory copy and **CTAs** (e.g. link to create flow) instead of bare empty tables.

## 38. Admin operational capabilities

- **Orders**: Open row → dialog with timeline, transition history, and **permitted next status** buttons (state machine enforced server-side).
- **Jobs**: Filter `all | waiting | failed | dead_letter`; inspect full job record; **retry** failed/dead-letter work.
- **Returns**: **View history** (`GET /api/admin/returns/:id` with audit trail) and **decide** dialog (`PATCH` with status + note).

## 39. Flow clarity improvements

- **Create**: Single page shows prompt → stage panel → result card → overlay → preview stages + image; polling keeps async work visible; moderated designs are treated like “ready” for preview where appropriate.
- **Checkout**: Fatal errors use `FlowErrorPanel` with retry; success path still shows redirect copy; toasts reinforce outcome.
- **Consistency**: Order status labels come from shared `state.order` messages in both account and admin; job user copy uses `state.jobSimple`; navigation and CTAs reuse the same i18n namespaces.
- **E2E**: `apps/web/e2e/coherence.spec.ts` covers generate → stages → preview image → cart → checkout, then admin jobs (row or empty state) and order dialog (timeline + next statuses).
