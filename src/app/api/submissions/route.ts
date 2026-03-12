import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
