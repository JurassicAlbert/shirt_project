import { createHash } from "node:crypto";
import { prisma } from "../db";

type StoredResponse = {
  statusCode: number;
  body: unknown;
};

export class IdempotencyRepository {
  hashRequest(payload: unknown) {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  async tryBegin(scope: string, key: string, requestPayload: unknown) {
    const requestHash = this.hashRequest(requestPayload);
    try {
      const record = await prisma.idempotencyRecord.create({
        data: {
          scope,
          key,
          requestHash,
          inFlight: true,
        },
      });
      return { kind: "started" as const, recordId: record.id, requestHash };
    } catch {
      const existing = await prisma.idempotencyRecord.findUnique({
        where: { scope_key: { scope, key } },
      });
      if (!existing) {
        throw new Error("idempotency_state_missing");
      }
      if (existing.requestHash !== requestHash) {
        throw new Error("idempotency_key_reused_with_different_payload");
      }
      if (existing.inFlight) {
        return { kind: "in_flight" as const };
      }
      return {
        kind: "replay" as const,
        response: {
          statusCode: existing.statusCode ?? 200,
          body: existing.responseJson,
        } satisfies StoredResponse,
      };
    }
  }

  async complete(scope: string, key: string, response: StoredResponse) {
    await prisma.idempotencyRecord.update({
      where: { scope_key: { scope, key } },
      data: {
        inFlight: false,
        statusCode: response.statusCode,
        responseJson: response.body as object,
      },
    });
  }

  async fail(scope: string, key: string) {
    await prisma.idempotencyRecord.updateMany({
      where: { scope, key },
      data: { inFlight: false },
    });
  }
}
