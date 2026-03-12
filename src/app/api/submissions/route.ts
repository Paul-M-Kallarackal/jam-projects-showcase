import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  createUniqueSlug,
  normalizeSubmissionBody,
} from "@/lib/showcase-submission";
import {
  buildRateLimitHeaders,
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

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        error:
          "Submission API is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      503
    );
  }

  let body: unknown;
  try {
    body = await request.json();
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

  const rateLimitConfig = getRateLimitConfig();
  const fingerprint = getSubmissionFingerprint(request, serviceRoleKey);
  const { data: rateLimitData, error: rateLimitError } = await supabase.rpc(
    "consume_submission_rate_limit",
    {
      p_fingerprint: fingerprint,
      p_max_requests: rateLimitConfig.maxRequests,
      p_window_seconds: rateLimitConfig.windowSeconds,
      p_block_seconds: rateLimitConfig.blockSeconds,
    }
  );

  if (rateLimitError) {
    return json(
      {
        error: "Could not verify the submission rate limit.",
        detail: rateLimitError.message,
      },
      500
    );
  }

  const rateLimit = rateLimitData?.[0];
  if (!rateLimit) {
    return json(
      {
        error: "Could not verify the submission rate limit.",
      },
      500
    );
  }

  const rateLimitHeaders = buildRateLimitHeaders(rateLimitConfig, rateLimit);
  if (!rateLimit.allowed) {
    return json(
      {
        error: "Too many submissions from this connection. Please try again later.",
      },
      429,
      rateLimitHeaders
    );
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
