import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 8;
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
export const DEFAULT_RATE_LIMIT_BLOCK_SECONDS = 60 * 60;

type SubmissionRateLimitConfig = ReturnType<typeof getRateLimitConfig>;
export type SubmissionRateLimitResult = {
  allowed: boolean;
  retry_after_seconds: number;
  remaining: number;
  reset_at: string;
};

type SubmissionRateLimitRow = {
  fingerprint: string;
  request_count: number;
  window_started_at: string;
  blocked_until: string | null;
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
  config: SubmissionRateLimitConfig,
  result: SubmissionRateLimitResult
) {
  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(Math.max(result.remaining, 0)),
    "X-RateLimit-Reset": result.reset_at,
    "Retry-After": String(Math.max(result.retry_after_seconds, 0)),
  };
}

function addSeconds(isoTimestamp: string, seconds: number): string {
  return new Date(Date.parse(isoTimestamp) + seconds * 1000).toISOString();
}

function secondsUntil(fromIsoTimestamp: string, toIsoTimestamp: string): number {
  return Math.max(
    0,
    Math.ceil((Date.parse(toIsoTimestamp) - Date.parse(fromIsoTimestamp)) / 1000)
  );
}

export async function consumeSubmissionRateLimit(
  supabase: SupabaseClient,
  fingerprint: string,
  config: SubmissionRateLimitConfig,
  retryCount = 0
): Promise<SubmissionRateLimitResult> {
  const nowIsoTimestamp = new Date().toISOString();
  const { data: existingRow, error: selectError } = await supabase
    .from("submission_rate_limits")
    .select("fingerprint, request_count, window_started_at, blocked_until")
    .eq("fingerprint", fingerprint)
    .maybeSingle<SubmissionRateLimitRow>();

  if (selectError) {
    throw selectError;
  }

  if (!existingRow) {
    const { error: insertError } = await supabase
      .from("submission_rate_limits")
      .insert({
        fingerprint,
        request_count: 1,
        window_started_at: nowIsoTimestamp,
        blocked_until: null,
        last_seen_at: nowIsoTimestamp,
      });

    if (insertError) {
      if (retryCount < 1) {
        return consumeSubmissionRateLimit(supabase, fingerprint, config, retryCount + 1);
      }

      throw insertError;
    }

    return {
      allowed: true,
      retry_after_seconds: 0,
      remaining: Math.max(config.maxRequests - 1, 0),
      reset_at: addSeconds(nowIsoTimestamp, config.windowSeconds),
    };
  }

  if (
    existingRow.blocked_until &&
    Date.parse(existingRow.blocked_until) > Date.parse(nowIsoTimestamp)
  ) {
    return {
      allowed: false,
      retry_after_seconds: secondsUntil(nowIsoTimestamp, existingRow.blocked_until),
      remaining: 0,
      reset_at: existingRow.blocked_until,
    };
  }

  if (
    Date.parse(existingRow.window_started_at) <=
    Date.parse(nowIsoTimestamp) - config.windowSeconds * 1000
  ) {
    const { error: resetError } = await supabase
      .from("submission_rate_limits")
      .update({
        request_count: 1,
        window_started_at: nowIsoTimestamp,
        blocked_until: null,
        last_seen_at: nowIsoTimestamp,
      })
      .eq("fingerprint", fingerprint);

    if (resetError) {
      throw resetError;
    }

    return {
      allowed: true,
      retry_after_seconds: 0,
      remaining: Math.max(config.maxRequests - 1, 0),
      reset_at: addSeconds(nowIsoTimestamp, config.windowSeconds),
    };
  }

  if (existingRow.request_count + 1 > config.maxRequests) {
    const blockedUntil = addSeconds(nowIsoTimestamp, config.blockSeconds);
    const { error: blockError } = await supabase
      .from("submission_rate_limits")
      .update({
        blocked_until: blockedUntil,
        last_seen_at: nowIsoTimestamp,
      })
      .eq("fingerprint", fingerprint);

    if (blockError) {
      throw blockError;
    }

    return {
      allowed: false,
      retry_after_seconds: config.blockSeconds,
      remaining: 0,
      reset_at: blockedUntil,
    };
  }

  const nextRequestCount = existingRow.request_count + 1;
  const { error: updateError } = await supabase
    .from("submission_rate_limits")
    .update({
      request_count: nextRequestCount,
      blocked_until: null,
      last_seen_at: nowIsoTimestamp,
    })
    .eq("fingerprint", fingerprint);

  if (updateError) {
    throw updateError;
  }

  return {
    allowed: true,
    retry_after_seconds: 0,
    remaining: Math.max(config.maxRequests - nextRequestCount, 0),
    reset_at: addSeconds(existingRow.window_started_at, config.windowSeconds),
  };
}
