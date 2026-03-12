export interface ShowcaseProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  stack: string[];
  projectUrl?: string | null;
  repositoryUrl?: string | null;
  submittedBy?: string | null;
  isFeatured: boolean;
  publishedAt?: string | null;
}

export interface ShowcaseData {
  projects: ShowcaseProject[];
  error?: string;
}
