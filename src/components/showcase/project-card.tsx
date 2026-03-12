import { ExternalLink, Github, Sparkles } from "lucide-react";

import { IconLinkButton } from "@/components/showcase/icon-link-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ShowcaseProject } from "@/lib/showcase-types";
import { cn } from "@/lib/utils";

const categoryPanels: Record<string, string> = {
  AI: "bg-linear-to-br from-accent/35 via-secondary/55 to-card",
  Automation: "bg-linear-to-br from-muted/65 via-card to-secondary/35",
  Community: "bg-linear-to-br from-secondary/70 via-card to-accent/20",
  Devtools: "bg-linear-to-br from-primary/14 via-card to-secondary/30",
  "Creative Tools": "bg-linear-to-br from-accent/25 via-card to-muted/45",
  Productivity: "bg-linear-to-br from-muted/50 via-secondary/35 to-card",
};

function formatPublishDate(value?: string | null) {
  if (!value) {
    return "Draft-safe schema";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectCard({ project }: { project: ShowcaseProject }) {
  const panelClassName = categoryPanels[project.category] ?? categoryPanels.AI;

  return (
    <Card className="surface-glass h-full border-border/65 bg-card/80 shadow-lg">
      <div
        className={cn(
          "m-4 rounded-4xl border border-white/30 p-5 ring-1 ring-foreground/5",
          panelClassName
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/60">
              {project.category}
            </p>
            <CardTitle className="font-display text-2xl leading-tight text-balance">
              {project.title}
            </CardTitle>
          </div>
          {project.isFeatured ? (
            <Badge className="gap-1 rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-3" />
              Featured
            </Badge>
          ) : null}
        </div>

        <p className="mt-6 max-w-md text-sm leading-relaxed text-foreground/78">
          {project.summary}
        </p>
      </div>

      <CardHeader className="gap-3">
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge
              key={`${project.id}-${tag}`}
              variant="outline"
              className="rounded-full border-border/70 bg-background/55"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-4">
        <div className="flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <Badge
              key={`${project.id}-${item}`}
              variant="secondary"
              className="rounded-full bg-secondary/65 text-secondary-foreground"
            >
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-4 border-border/50 bg-muted/35">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground/88">
            {project.submittedBy ?? "Jam community"}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {formatPublishDate(project.publishedAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {project.repositoryUrl ? (
            <IconLinkButton
              href={project.repositoryUrl}
              label="Open repository"
              icon={Github}
            />
          ) : null}
          {project.projectUrl ? (
            <IconLinkButton
              href={project.projectUrl}
              label="Open project"
              icon={ExternalLink}
            />
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
