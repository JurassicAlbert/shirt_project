import { describe, expect, it } from "vitest";
import { buildMockupCacheKey } from "./mockup-cache-key";

describe("mockup cache key", () => {
  it("is stable for same inputs", () => {
    const a = buildMockupCacheKey({
      productId: "00000000-0000-4000-8000-000000000001",
      variantId: "00000000-0000-4000-8000-000000000002",
      designId: "00000000-0000-4000-8000-000000000003",
      textOverlay: "hi",
    });
    const b = buildMockupCacheKey({
      productId: "00000000-0000-4000-8000-000000000001",
      variantId: "00000000-0000-4000-8000-000000000002",
      designId: "00000000-0000-4000-8000-000000000003",
      textOverlay: "hi",
    });
    expect(a).toBe(b);
    expect(a.length).toBe(64);
  });

  it("changes when overlay changes", () => {
    const base = {
      productId: "00000000-0000-4000-8000-000000000001",
      variantId: "00000000-0000-4000-8000-000000000002",
      designId: "00000000-0000-4000-8000-000000000003",
    };
    expect(buildMockupCacheKey({ ...base, textOverlay: "a" })).not.toBe(
      buildMockupCacheKey({ ...base, textOverlay: "b" }),
    );
  });
});
