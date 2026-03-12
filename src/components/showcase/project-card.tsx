import { ExternalLink, Github } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import type { ShowcaseProject } from "@/lib/showcase-types";
import { cn } from "@/lib/utils";

const categoryPanels: Record<string, string> = {
  AI: "bg-linear-to-br from-[#efe0b6] via-[#eadcb8] to-[#f4edd6]",
  Automation: "bg-linear-to-br from-[#ded4aa] via-[#e9dfbf] to-[#f1ead2]",
  Community: "bg-linear-to-br from-[#e8ddbf] via-[#f0e6c9] to-[#f7f1de]",
  Devtools: "bg-linear-to-br from-[#d9d0af] via-[#e6dcc0] to-[#f2ebd5]",
  "Creative Tools": "bg-linear-to-br from-[#ead7bd] via-[#f1e3cc] to-[#f6efe0]",
  Productivity: "bg-linear-to-br from-[#e1d8b5] via-[#ece2c6] to-[#f5eed9]",
};

function formatPublishDate(value?: string | null) {
  if (!value) {
    return "Fresh submission";
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
    <Card className="surface-glass h-full overflow-hidden border-border/65 bg-card/82 py-0 gap-0 shadow-lg">
      <div className={cn("flex flex-1 flex-col", panelClassName)}>
        <div className="flex min-h-[15rem] flex-col justify-between px-5 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/56">
              {project.category}
            </p>
            <CardTitle className="font-display text-3xl leading-tight text-balance">
              {project.title}
            </CardTitle>
            <p className="mt-4 line-clamp-4 max-w-2xl text-base leading-relaxed text-foreground/78">
              {project.summary}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <CardContent className="pb-5 pt-5">
          <div className="flex flex-wrap gap-3">
            {project.projectUrl ? (
              <a
                className={cn(buttonVariants(), "rounded-full")}
                href={project.projectUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-4" />
                Project
              </a>
            ) : null}
            {project.repositoryUrl ? (
              <a
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full border-border/80 bg-background/56"
                )}
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Github className="size-4" />
                Source repo
              </a>
            ) : null}
          </div>
        </CardContent>
      </div>

      <CardFooter className="justify-between gap-4 border-t border-border/35 bg-transparent">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground/88">
            Submitted by {project.submittedBy ?? "a Jam builder"}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {formatPublishDate(project.publishedAt)}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
