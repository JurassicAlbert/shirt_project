# UX Wireframe Notes

## Homepage

- Hero block with search input: "Find a perfect gift".
- Three immediate CTAs:
  - Shop now (primary)
  - Search gifts (secondary)
  - Create your own design (secondary)
- Quick categories row (T-shirt, Hoodie, Mug).
- Trending cards and collections strip.

## Search / Inspire

- Sticky search bar at top.
- Filter controls: product type, style.
- Mixed result cards (AI/internal/external) with duplicate suppression.
- Hover preview panel with quick route to product page.

## Product page

- Product summary and dynamic product preview area.
- Variant selectors: size, color, material.
- Price presentation with VAT included marker.
- CTAs: customize/edit and add to cart.

## Create page

- Prompt field and generate action above the fold.
- Non-blocking async states:
  - generating
  - generated
  - error/retry
- Result grid with selection.
- Text overlay editor and live preview panel.
- Add-to-cart CTA enabled only with valid configuration.

## Cart and checkout

- Cart table: configuration snapshot thumbnail, qty editor, price breakdown.
- Checkout sections: address, delivery method, payment method (Przelewy24), summary.
- Persistent order summary side panel on desktop.

## Account and admin

- Account tabs: orders, returns, future saved designs placeholder.
- Admin sections: KPI dashboard, orders, returns, moderation queue, product/supplier config.
