import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import {
  createUniqueSlug,
  normalizeSubmissionBody,
} from "@/lib/showcase-submission";

export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isAuthorized(request: Request, expectedToken: string): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const actualToken = authorization.slice("Bearer ".length);
  const actualBuffer = Buffer.from(actualToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiBearerToken = process.env.SHOWCASE_API_BEARER_TOKEN?.trim();

  if (!supabaseUrl || !serviceRoleKey || !apiBearerToken) {
    return json(
      {
        error:
          "Submission API is not configured. Add NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SHOWCASE_API_BEARER_TOKEN.",
      },
      503
    );
  }

  if (!isAuthorized(request, apiBearerToken)) {
    return json({ error: "Unauthorized." }, 401);
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
      400
    );
  }

  const origin = new URL(request.url).origin;

  return json({
    id: data.id,
    slug: data.slug,
    showcase_url: `${origin}/#projects`,
  });
}
