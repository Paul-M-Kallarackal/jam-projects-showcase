import "server-only";

import { createClient } from "@supabase/supabase-js";

import { mockProjects } from "@/lib/mock-projects";
import type { ShowcaseData, ShowcaseProject } from "@/lib/showcase-types";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[] | null;
  stack: string[] | null;
  project_url: string | null;
  repository_url: string | null;
  submitted_by: string | null;
  is_featured: boolean | null;
  published_at: string | null;
};

const publishedProjectFields = [
  "id",
  "slug",
  "title",
  "summary",
  "category",
  "tags",
  "stack",
  "project_url",
  "repository_url",
  "submitted_by",
  "is_featured",
  "published_at",
].join(", ");

function mapProjectRow(row: ProjectRow): ShowcaseProject {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    tags: row.tags ?? [],
    stack: row.stack ?? [],
    projectUrl: row.project_url,
    repositoryUrl: row.repository_url,
    submittedBy: row.submitted_by,
    isFeatured: Boolean(row.is_featured),
    publishedAt: row.published_at,
  };
}

export async function getShowcaseData(): Promise<ShowcaseData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      projects: mockProjects,
      source: "demo",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "jam-projects-showcase",
      },
    },
  });

  const { data, error } = await supabase
    .from("projects")
    .select(publishedProjectFields)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) {
    return {
      projects: [],
      source: "supabase",
      error: error.message,
    };
  }

  const rows = ((data ?? []) as unknown as ProjectRow[]).map(mapProjectRow);

  return {
    projects: rows,
    source: "supabase",
  };
}
