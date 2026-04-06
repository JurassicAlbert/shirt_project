import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED";

export const apiError = (code: ApiErrorCode, message: string, status: number, details?: unknown) =>
  NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );

export const apiOk = <T>(data: T, status = 200) =>
  NextResponse.json(
    {
      ok: true,
      data,
    },
    { status },
  );

export const apiRateLimited = (message: string, retryAfterSec: number) =>
  NextResponse.json(
    { ok: false, error: { code: "RATE_LIMITED" as const, message, details: { retryAfterSec } } },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
