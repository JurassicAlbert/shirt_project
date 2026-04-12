# UX Information Architecture

Locale: default **Polish** (`pl`); **English** (`en`) optional. Paths below are logical (without `/pl` when default).

## Primary navigation (store)

- Home (`/`)
- Shop (`/shop`) — catalog listing + filters; uses `GET /api/search`
- Blog (`/blog`), Docs (`/docs`), Support (`/support`)
- Create (`/create`)
- Cart (`/cart`)
- Account (`/account`)
- Sign in (`/auth/signin`), Sign up (`/auth/signup`)
- Admin entry → **Materio** sign-in (`/admin/login`), not store auth

Legacy URLs (`/login`, `/register`, `/products`, `/search`, …) redirect to the above (see `IMPLEMENTATION_REPORT` §56).

## Admin (separate IA)

- `/admin/login`, `/admin/register`, `/admin/forgot-password`
- Panel (after auth): `/admin/dashboard`, `/admin/orders`, `/admin/returns`, `/admin/designs`, `/admin/jobs`, `/admin/account-settings`
- Utility/demo pages: `/admin/error`, `/admin/maintenance`
- Navigation is **route-based** (drawer links), not a single-page tab controller.

## Primary path and secondary awareness

- **Primary conversion path:** `Shop → Product detail (/product/[id]) → Cart → Checkout → Payment init`
- **Secondary paths:**
  - **Browse / inspire:** `Home → Shop` (search query + filters) → product detail → cart
  - **Create:** `Create →` (when applicable link product) `→ Product detail → Cart`
- Navigation and CTAs surface the **next step** while alternate entries (Create, Blog, Account) stay visible.

## Core objects visible to users

- Product
- Variant (size, color, material)
- Design
- Product configuration snapshot
- Cart item
- Order
- Return request

## UX state model

- `loading`: async operation in progress
- `success`: operation finished and next step shown
- `error`: operation failed with explicit recovery action
- `empty`: no results / no items with guided fallback CTA
