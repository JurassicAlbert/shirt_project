import { createHash } from "node:crypto";

export const buildMockupCacheKey = (input: {
  productId: string;
  variantId: string;
  designId: string;
  textOverlay?: string;
}) => {
  const raw = `${input.productId}|${input.variantId}|${input.designId}|${input.textOverlay ?? ""}`;
  return createHash("sha256").update(raw).digest("hex");
};
