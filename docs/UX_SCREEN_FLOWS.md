# UX Screen Flows

## Flow 1 Quick Buy

```mermaid
flowchart TD
  HomePage --> ProductsPage
  ProductsPage --> ProductPage
  ProductPage --> CartPage
  CartPage --> CheckoutPage
  CheckoutPage --> PaymentStep
  PaymentStep --> OrderSuccess
```

## Flow 2 Inspire

```mermaid
flowchart TD
  HomePage --> SearchPage
  SearchPage --> PreviewState
  PreviewState --> ProductPage
  ProductPage --> CartPage
  CartPage --> CheckoutPage
  CheckoutPage --> OrderSuccess
```

## Flow 3 Create

```mermaid
flowchart TD
  HomePage --> CreatePage
  CreatePage --> GenerateState
  GenerateState --> EditOverlayState
  EditOverlayState --> MockupPreviewState
  MockupPreviewState --> ProductPage
  ProductPage --> CartPage
  CartPage --> CheckoutPage
  CheckoutPage --> OrderSuccess
```

## Error and recovery patterns

- AI timeout: show retry + switch to quick buy recommendation.
- Invalid variant: inline validation and blocked CTA.
- Supplier unavailable: checkout banner + alternative product CTA.
- Payment failure: return to checkout with retry payment CTA.
- Return abuse escalation: clear pending moderation status in account timeline.
