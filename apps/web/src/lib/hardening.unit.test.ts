import { describe, expect, it } from "vitest";
import { assertOrderTransition } from "./order-state-machine";
import { createAiImageProvider } from "@shirt/infrastructure";

describe("order state machine", () => {
  it("allows valid transitions", () => {
    expect(() => assertOrderTransition("created", "payment_pending")).not.toThrow();
    expect(() => assertOrderTransition("payment_pending", "paid")).not.toThrow();
    expect(() => assertOrderTransition("paid", "shipped")).not.toThrow();
    expect(() => assertOrderTransition("shipped", "completed")).not.toThrow();
  });

  it("rejects invalid transitions", () => {
    expect(() => assertOrderTransition("created", "completed")).toThrow("invalid_order_transition");
    expect(() => assertOrderTransition("failed", "paid")).toThrow("invalid_order_transition");
  });
});

describe("AI integration failure handling", () => {
  it("throws explicit error when OPENAI key is missing", async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const provider = createAiImageProvider();
    await expect(provider.generate("red cat")).rejects.toThrow("openai_api_key_missing");
    if (previous) process.env.OPENAI_API_KEY = previous;
  });
});
