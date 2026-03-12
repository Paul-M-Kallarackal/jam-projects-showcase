import { createHash } from "node:crypto";

export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 8;
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
export const DEFAULT_RATE_LIMIT_BLOCK_SECONDS = 60 * 60;

export type SubmissionRateLimitResult = {
  allowed: boolean;
  retry_after_seconds: number;
  remaining: number;
  reset_at: string;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function getRateLimitConfig() {
  return {
    maxRequests: parsePositiveInt(
      process.env.SHOWCASE_RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_RATE_LIMIT_MAX_REQUESTS
    ),
    windowSeconds: parsePositiveInt(
      process.env.SHOWCASE_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_RATE_LIMIT_WINDOW_SECONDS
    ),
    blockSeconds: parsePositiveInt(
      process.env.SHOWCASE_RATE_LIMIT_BLOCK_SECONDS,
      DEFAULT_RATE_LIMIT_BLOCK_SECONDS
    ),
  };
}

export function getSubmissionFingerprint(
  request: Request,
  pepper: string
): string {
  return createHash("sha256")
    .update(pepper)
    .update(":")
    .update(getClientIp(request))
    .digest("hex");
}

export function buildRateLimitHeaders(
  config: ReturnType<typeof getRateLimitConfig>,
  result: SubmissionRateLimitResult
) {
  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(Math.max(result.remaining, 0)),
    "X-RateLimit-Reset": result.reset_at,
    "Retry-After": String(Math.max(result.retry_after_seconds, 0)),
  };
}
