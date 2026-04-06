import { NextResponse } from "next/server";
import { apiError } from "./api-response";
import { idempotencyRepository } from "./repositories";

export const withIdempotency = async (
  input: {
    scope: string;
    key: string | null;
    requestPayload: unknown;
  },
  run: () => Promise<{ statusCode: number; body: unknown }>,
) => {
  if (!input.key) {
    return { response: apiError("BAD_REQUEST", "Missing Idempotency-Key header", 400), shouldReturn: true as const };
  }

  try {
    const state = await idempotencyRepository.tryBegin(input.scope, input.key, input.requestPayload);
    if (state.kind === "in_flight") {
      return { response: apiError("CONFLICT", "Request with this idempotency key is in progress", 409), shouldReturn: true as const };
    }
    if (state.kind === "replay") {
      return { response: NextResponse.json(state.response.body, { status: state.response.statusCode }), shouldReturn: true as const };
    }

    const executed = await run();
    await idempotencyRepository.complete(input.scope, input.key, {
      statusCode: executed.statusCode,
      body: executed.body,
    });
    return { response: NextResponse.json(executed.body, { status: executed.statusCode }), shouldReturn: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "idempotency_failed";
    if (message === "idempotency_key_reused_with_different_payload") {
      return {
        response: apiError("CONFLICT", "Idempotency key reused with different payload", 409),
        shouldReturn: true as const,
      };
    }
    return { response: apiError("INTERNAL_ERROR", "Idempotency handling failed", 500), shouldReturn: true as const };
  }
};
