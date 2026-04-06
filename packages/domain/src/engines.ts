export type PriceInput = {
  unitGross: number;
  vatRatePercent: number;
  quantity: number;
};

export type PriceBreakdown = {
  totalNet: number;
  totalVat: number;
  totalGross: number;
};

export const calculatePriceBreakdown = (input: PriceInput): PriceBreakdown => {
  const totalGross = round2(input.unitGross * input.quantity);
  const divisor = 1 + input.vatRatePercent / 100;
  const totalNet = round2(totalGross / divisor);
  const totalVat = round2(totalGross - totalNet);

  return { totalNet, totalVat, totalGross };
};

export const validateVariantSelection = (selection: {
  size: string;
  color: string;
  material: string;
}) => {
  const validSizes = new Set(["S", "M", "L", "XL"]);
  const validColors = new Set(["black", "white", "navy", "red"]);
  const validMaterials = new Set(["cotton", "polyester", "ceramic"]);

  return {
    valid:
      validSizes.has(selection.size) &&
      validColors.has(selection.color) &&
      validMaterials.has(selection.material),
  };
};

export const canRequestGeneration = (input: {
  dailyLimit: number;
  usedToday: number;
  blockedToday: number;
}) => {
  if (input.blockedToday > 10) return false;
  return input.usedToday < input.dailyLimit;
};

export type SearchItem = {
  id: string;
  source: "ai" | "internal" | "external";
  score: number;
};

export const dedupeSearchResults = (items: SearchItem[]) => {
  const seen = new Set<string>();
  return items
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
};

export const resolveOrderPaymentState = (payment: "success" | "failed") => {
  if (payment === "success") {
    return {
      orderStatus: "paid" as const,
      recoverable: false,
    };
  }

  return {
    orderStatus: "failed" as const,
    recoverable: true,
  };
};

export const canRequestReturn = (input: {
  deliveredDaysAgo: number;
  returnRequestsLast90Days: number;
  abuseThreshold: number;
}) => {
  if (input.returnRequestsLast90Days > input.abuseThreshold) {
    return { status: "escalated" as const };
  }
  if (input.deliveredDaysAgo > 30) {
    return { status: "rejected" as const };
  }
  return { status: "approved" as const };
};

const round2 = (value: number) => Math.round(value * 100) / 100;
