# UX Information Architecture

## Primary navigation

- Home
- Products (Quick Buy)
- Search (Inspire)
- Create
- Cart
- Account
- Admin

## Primary path and secondary awareness

- Primary conversion path: `Products -> Product Detail -> Cart -> Checkout -> Payment`.
- Secondary paths:
  - Inspire: `Search -> Product Detail -> Cart`.
  - Create: `Create -> Product Detail -> Cart`.
- Navigation and CTA copy always show next step while keeping alternate entries visible.

## Core objects visible to users

- Product
- Variant (size, color, material)
- Design
- Product configuration snapshot
- Cart item
- Order
- Return request

## UX state model

- `loading`: async operation in progress.
- `success`: operation finished and next step shown.
- `error`: operation failed with explicit recovery action.
- `empty`: no results/no items with guided fallback CTA.
