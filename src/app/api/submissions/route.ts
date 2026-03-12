import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  createUniqueSlug,
  normalizeSubmissionBody,
} from "@/lib/showcase-submission";
import { verifyBotSubmission } from "@/lib/showcase-bot-auth";
import {
  buildRateLimitHeaders,
  consumeSubmissionRateLimit,
  getRateLimitConfig,
  getSubmissionFingerprint,
} from "@/lib/showcase-rate-limit";

export const runtime = "nodejs";

function json(
  data: unknown,
  status = 200,
  headers?: HeadersInit
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const botSharedSecret = process.env.SHOWCASE_BOT_SHARED_SECRET?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        error:
          "Submission API is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      503
    );
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const botVerification = verifyBotSubmission(request, rawBody, botSharedSecret);
  if (!botVerification.isVerified && botVerification.hasSignatureHeaders) {
    return json(
      {
        error: botVerification.error ?? "Bot verification failed.",
      },
      401
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const submission = normalizeSubmissionBody(body);
  if (!submission) {
    return json({ error: "A project name is required." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "jam-projects-showcase-api",
      },
    },
  });

  let rateLimitHeaders: HeadersInit | undefined;
  if (!botVerification.isVerified) {
    const rateLimitConfig = getRateLimitConfig();
    const fingerprint = getSubmissionFingerprint(request, serviceRoleKey);

    let rateLimit;
    try {
      rateLimit = await consumeSubmissionRateLimit(
        supabase,
        fingerprint,
        rateLimitConfig
      );
    } catch (error) {
      return json(
        {
          error: "Could not verify the submission rate limit.",
          detail: error instanceof Error ? error.message : "Unknown rate limit error.",
        },
        500
      );
    }

    rateLimitHeaders = buildRateLimitHeaders(rateLimitConfig, rateLimit);
    if (!rateLimit.allowed) {
      return json(
        {
          error: "Too many submissions from this connection. Please try again later.",
        },
        429,
        rateLimitHeaders
      );
    }
  }

  const slug = await createUniqueSlug(async (candidate) => {
    const { data, error } = await supabase
      .from("projects")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  }, submission.title);

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      slug,
      title: submission.title,
      summary: submission.summary,
      category: submission.category,
      tags: submission.tags,
      stack: submission.stack,
      project_url: submission.projectUrl,
      repository_url: submission.repositoryUrl,
      submitted_by: submission.submitted_by,
      status: "published",
      published_at: now,
      is_featured: false,
    })
    .select("id, slug")
    .single();

  if (error) {
    return json(
      {
        error: "Could not create project submission.",
        detail: error.message,
      },
      400,
      rateLimitHeaders
    );
  }

  const origin = new URL(request.url).origin;
  revalidatePath("/");

  return json({
    id: data.id,
    slug: data.slug,
    showcase_url: `${origin}/#projects`,
  }, 200, rateLimitHeaders);
}
