/** Unsplash URLs mapped by product slug — Solid-style imagery without DB image columns. */
const BY_SLUG: Record<string, string> = {
  "classic-tshirt": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  "premium-hoodie": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
  "ceramic-mug": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80",
  "urban-tshirt": "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
  "oversized-hoodie": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
  "enamel-mug": "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&q=80",
  "vintage-tshirt": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
  "sport-hoodie": "https://images.unsplash.com/photo-1622445275576-721388763e2d?w=800&q=80",
};

const BY_TYPE: Record<string, string> = {
  tshirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  hoodie: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
  mug: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80",
};

export function productImageUrl(slug: string, type: string): string {
  return BY_SLUG[slug] ?? BY_TYPE[type] ?? BY_TYPE.tshirt;
}
