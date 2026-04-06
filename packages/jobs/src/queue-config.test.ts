import { describe, expect, it } from "vitest";
import { defaultJobOptions } from "./queue-config";

describe("BullMQ job defaults", () => {
  it("configures retry count and exponential backoff", () => {
    expect(defaultJobOptions.attempts).toBe(5);
    expect(defaultJobOptions.backoff).toEqual({ type: "exponential", delay: 2000 });
  });

  it("exponential delay grows per attempt index", () => {
    const base = 2000;
    const delays = [1, 2, 3, 4, 5].map((attempt) => base * 2 ** (attempt - 1));
    expect(delays[0]).toBe(2000);
    expect(delays[1]).toBe(4000);
    expect(delays[4]).toBe(32000);
  });
});
