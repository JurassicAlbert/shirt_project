import {
  canRequestGeneration,
  canRequestReturn,
  calculatePriceBreakdown,
  dedupeSearchResults,
  resolveOrderPaymentState,
  validateVariantSelection,
  type SearchItem,
} from "@shirt/domain";

export const createConfiguration = (input: {
  size: string;
  color: string;
  material: string;
  unitGross: number;
  vatRatePercent: number;
  quantity: number;
}) => {
  const variant = validateVariantSelection(input);
  if (!variant.valid) {
    return { ok: false as const, reason: "invalid_variant" as const };
  }

  return {
    ok: true as const,
    price: calculatePriceBreakdown(input),
  };
};

export const evaluateGenerationRequest = (input: {
  dailyLimit: number;
  usedToday: number;
  blockedToday: number;
}) => ({
  allowed: canRequestGeneration(input),
});

export const mergeSearchResults = (items: SearchItem[]) => ({
  items: dedupeSearchResults(items),
});

export const processPaymentResult = (payment: "success" | "failed") =>
  resolveOrderPaymentState(payment);

export const evaluateReturn = (input: {
  deliveredDaysAgo: number;
  returnRequestsLast90Days: number;
  abuseThreshold: number;
}) => canRequestReturn(input);
