# Architecture

## Runtime topology

- `apps/web`: Next.js App Router UI and API route handlers.
- `packages/domain`: pure business rules and deterministic engine logic.
- `packages/application`: use-case orchestration and flow-level policy decisions.
- `packages/infrastructure`: adapters (AI, payments, suppliers), cache, persistence seams.
- `packages/contracts`: API contracts and zod request/response schemas.

## Architectural principles

- Feature-based modular monolith to minimize operational complexity in MVP while preserving clear module boundaries.
- Hexagonal boundaries for all external systems (OpenAI Images, Przelewy24, suppliers, search sources).
- API-first contracts to keep web and future mobile clients aligned.
- Test-first domain behavior to reduce regressions and enable incremental hardening.

## Engine responsibilities

- Design engine: prompt normalization, tagging, dedupe hash, moderation status.
- Product engine: catalog/variant modeling and supplier mapping.
- Configuration engine: immutable configuration snapshot from product/variant/design/text.
- Mockup engine: preview generation, caching and fallback path.
- Search engine: multi-source merge, dedupe, relevance ranking, vector-ready pipeline.
- AI cost control engine: daily quotas, per-minute limits, usage ledger and cache hits.
- Order management: cart, checkout, payment state progression and order snapshot.
- Returns/dispute engine: rule-based approval/reject/escalation.

## Cross-cutting concerns

- Validation and contract enforcement at API boundaries.
- Observability hooks for AI usage, payment initialization, and failure reasons.
- Cost controls and abuse mitigation centralized in request path.
- Future migration path: move long-running tasks (generation/render) to async workers without changing public API contracts.
