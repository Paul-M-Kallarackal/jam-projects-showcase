import { randomBytes } from "node:crypto";

type RawSubmission = {
  submitted_by: string;
  title: string;
  summary: string;
  category: string;
  repositoryUrl: string | null;
  projectUrl: string | null;
  tags: string[];
  stack: string[];
};

const allowedCategories = new Set([
  "AI",
  "Automation",
  "Community",
  "Creative Tools",
  "Devtools",
  "Productivity",
]);

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function sanitizeText(value: unknown, maxLength: number, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = stripHtml(value)
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.slice(0, maxLength) || fallback;
}

function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString().slice(0, 300);
  } catch {
    return null;
  }
}

function sanitizeList(
  value: unknown,
  {
    maxItems,
    maxItemLength,
  }: {
    maxItems: number;
    maxItemLength: number;
  }
): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const item of items) {
    const normalized = sanitizeText(item, maxItemLength).toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    cleaned.push(normalized);

    if (cleaned.length >= maxItems) {
      break;
    }
  }

  return cleaned;
}

function resolveCategory(value: unknown): string {
  const cleaned = sanitizeText(value, 40);
  if (allowedCategories.has(cleaned)) {
    return cleaned;
  }

  return "Community";
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || `project-${randomBytes(3).toString("hex")}`;
}

export function normalizeSubmissionBody(body: unknown): RawSubmission | null {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const project =
    record.project && typeof record.project === "object"
      ? (record.project as Record<string, unknown>)
      : {};
  const member =
    record.member && typeof record.member === "object"
      ? (record.member as Record<string, unknown>)
      : {};

  const title = sanitizeText(
    record.project_name ?? project.name,
    80
  );

  if (!title) {
    return null;
  }

  const summary =
    sanitizeText(record.description ?? project.description, 500) ||
    "Submitted through Discord.";

  const submittedBy =
    sanitizeText(
      record.submitted_by ??
        member.display_name ??
        member.username ??
        "Jam builder",
      80,
      "Jam builder"
    ) || "Jam builder";

  return {
    submitted_by: submittedBy,
    title,
    summary,
    category: resolveCategory(record.category ?? project.category),
    repositoryUrl: sanitizeUrl(
      record.github_url ?? record.repository_url ?? project.github_url ?? project.repository_url
    ),
    projectUrl: sanitizeUrl(
      record.live_url ?? record.project_url ?? project.live_url ?? project.project_url
    ),
    tags: sanitizeList(record.tags ?? project.tags, {
      maxItems: 10,
      maxItemLength: 24,
    }),
    stack: sanitizeList(record.stack ?? project.stack, {
      maxItems: 10,
      maxItemLength: 24,
    }),
  };
}

export async function createUniqueSlug(
  slugExists: (slug: string) => Promise<boolean>,
  title: string
): Promise<string> {
  const base = slugify(title);

  if (!(await slugExists(base))) {
    return base;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${base}-${randomBytes(2).toString("hex")}`;
    if (!(await slugExists(candidate))) {
      return candidate;
    }
  }

  return `${base}-${randomBytes(4).toString("hex")}`;
}
