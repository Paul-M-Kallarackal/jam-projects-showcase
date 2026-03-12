import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "v1=";
const SIGNATURE_MAX_AGE_SECONDS = 5 * 60;

export const SHOWCASE_BOT_SIGNATURE_HEADER = "x-showcase-bot-signature";
export const SHOWCASE_BOT_TIMESTAMP_HEADER = "x-showcase-timestamp";

type VerificationResult =
  | {
      isVerified: true;
      hasSignatureHeaders: true;
    }
  | {
      isVerified: false;
      hasSignatureHeaders: boolean;
      error?: string;
    };

function createSignature(secret: string, timestamp: string, rawBody: string): string {
  return (
    SIGNATURE_PREFIX +
    createHmac("sha256", secret)
      .update(timestamp)
      .update(".")
      .update(rawBody)
      .digest("hex")
  );
}

function isFreshTimestamp(timestamp: string): boolean {
  const parsed = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return false;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - parsed);
  return ageSeconds <= SIGNATURE_MAX_AGE_SECONDS;
}

export function verifyBotSubmission(
  request: Request,
  rawBody: string,
  sharedSecret: string | undefined
): VerificationResult {
  const signature = request.headers.get(SHOWCASE_BOT_SIGNATURE_HEADER)?.trim();
  const timestamp = request.headers.get(SHOWCASE_BOT_TIMESTAMP_HEADER)?.trim();
  const hasSignatureHeaders = Boolean(signature || timestamp);

  if (!hasSignatureHeaders) {
    return { isVerified: false, hasSignatureHeaders: false };
  }

  if (!signature || !timestamp) {
    return {
      isVerified: false,
      hasSignatureHeaders: true,
      error: "Bot verification headers are incomplete.",
    };
  }

  if (!sharedSecret) {
    return {
      isVerified: false,
      hasSignatureHeaders: true,
      error: "Bot verification is not configured on the server.",
    };
  }

  if (!isFreshTimestamp(timestamp)) {
    return {
      isVerified: false,
      hasSignatureHeaders: true,
      error: "Bot verification timestamp is invalid or expired.",
    };
  }

  const expected = createSignature(sharedSecret, timestamp, rawBody);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return {
      isVerified: false,
      hasSignatureHeaders: true,
      error: "Bot verification signature did not match.",
    };
  }

  return {
    isVerified: true,
    hasSignatureHeaders: true,
  };
}
