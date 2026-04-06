# Test Plan - AI Design-to-Product MVP

## Testing Strategy

- Follow strict TDD by writing failing tests before implementation.
- Keep test levels separate: domain unit, API contract, integration, E2E.
- Every required user flow and engine has explicit coverage and edge-case tests.

## Test Levels

1. Unit tests (`packages/domain`)
   - Pricing, VAT split, variant validation, quota logic, return eligibility rules.
2. Contract tests (`packages/contracts`, API handlers)
   - Request/response validation via zod schemas for all public endpoints.
3. Integration tests (`packages/application`, `packages/infrastructure`)
   - Prisma repositories, search ranking + dedupe, AI generation orchestration, payment state transitions.
4. E2E tests (`apps/web/e2e`)
   - Quick Buy, Inspire, Create flows from entry to order confirmation.

## Environments

- Local unit/contract tests: Node + Vitest.
- Integration: Postgres + pgvector (test database).
- E2E: Next.js app + Playwright against local runtime.

## TDD Sequence

1. Define contract schema.
2. Write failing contract tests.
3. Write failing domain tests for business rules.
4. Implement minimal domain logic to pass.
5. Write failing integration tests.
6. Implement adapters/orchestration to pass.
7. Write failing E2E tests and complete UI/route behavior.

## Quality Gates

- `npm run test` must pass for unit/contract/integration.
- `npm run test:e2e` must pass for all mandatory flows.
- No unhandled edge-case regressions for timeout, dedupe, payment failure, supplier outage, abuse controls.
