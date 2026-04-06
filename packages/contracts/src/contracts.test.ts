import { describe, expect, it } from "vitest";
import {
  apiRouteContract,
  checkoutRequestSchema,
  generateDesignRequestSchema,
  returnRequestSchema,
  searchQuerySchema,
} from "./index";

describe("api route contract", () => {
  it("contains required endpoints", () => {
    expect(apiRouteContract.generateDesign.path).toBe("/api/designs/generate");
    expect(apiRouteContract.checkout.path).toBe("/api/checkout");
    expect(apiRouteContract.adminKpi.path).toBe("/api/admin/kpi");
  });
});

describe("schema validation", () => {
  it("validates generate design payload", () => {
    const parsed = generateDesignRequestSchema.safeParse({
      prompt: "gift for dad with mountain theme",
      productType: "mug",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid checkout payload", () => {
    const parsed = checkoutRequestSchema.safeParse({
      orderId: "missing-uuid-format",
      deliveryMethod: "courier",
      paymentMethod: "przelewy24",
      address: {
        firstName: "A",
        lastName: "B",
        city: "C",
        postalCode: "00-001",
        street: "X",
        country: "PL",
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("validates search and return payloads", () => {
    expect(searchQuerySchema.safeParse({ q: "gift for mom" }).success).toBe(true);
    expect(
      returnRequestSchema.safeParse({
        orderId: "11111111-1111-1111-8111-111111111111",
        orderItemId: "22222222-2222-2222-8222-222222222222",
        reason: "damaged",
      }).success,
    ).toBe(true);
  });
});
