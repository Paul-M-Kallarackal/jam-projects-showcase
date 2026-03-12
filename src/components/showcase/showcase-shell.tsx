"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useState } from "react";
import { ArrowRight, Github, Search } from "lucide-react";

import { ProjectCard } from "@/components/showcase/project-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ShowcaseData } from "@/lib/showcase-types";
import { cn } from "@/lib/utils";

const repositoryUrl = "https://github.com/Paul-M-Kallarackal/jam-projects-showcase";

const statCards = [
  {
    label: "Listed",
    accessor: (count: number) => count,
    suffix: "projects",
  },
  {
    label: "Live links",
    accessor: (_count: number, projects: ShowcaseData["projects"]) =>
      projects.filter((project) => Boolean(project.projectUrl)).length,
    suffix: "links",
  },
  {
    label: "Source repos",
    accessor: (_count: number, projects: ShowcaseData["projects"]) =>
      projects.filter((project) => Boolean(project.repositoryUrl)).length,
    suffix: "sources",
  },
] as const;

export function ShowcaseShell({ projects, error }: ShowcaseData) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [apiOrigin] = useState(() =>
    typeof window === "undefined"
      ? "https://jam-projects-showcase.vercel.app"
      : window.location.origin
  );

  const deferredQuery = useDeferredValue(query);

  const categories = Array.from(
    new Set(projects.map((project) => project.category))
  ).sort((left, right) => left.localeCompare(right));

  const filteredProjects = projects.filter((project) => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      project.title.toLowerCase().includes(normalizedQuery) ||
      project.summary.toLowerCase().includes(normalizedQuery) ||
      project.stack.some((item) => item.toLowerCase().includes(normalizedQuery));

    const matchesCategory =
      category === "all" || project.category.toLowerCase() === category;

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-12 hidden size-72 rounded-full bg-accent/10 blur-3xl md:block" />
        <div className="absolute right-0 top-56 hidden size-80 rounded-full bg-muted/22 blur-3xl md:block" />
        <div className="absolute bottom-12 left-1/3 hidden size-72 rounded-full bg-card/55 blur-3xl md:block" />
      </div>

      <main className="relative">
        <section className="px-4 pb-10 pt-10 md:px-6 md:pb-12 md:pt-14 lg:pt-18">
          <div className="mx-auto flex max-w-6xl justify-end gap-3">
            <Link
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-full border-border/80 bg-card/60"
              )}
            >
              <Github className="size-4" />
              View source on GitHub
            </Link>
            <Link
              href="#projects"
              className={cn(buttonVariants(), "rounded-full")}
            >
              Explore the archive
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="max-w-4xl space-y-4">
              <h1 className="font-display text-5xl leading-none tracking-tight text-balance md:text-7xl">
                A warm, searchable home for every Jam build shared here.
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-foreground/76 md:text-lg">
                Built for builders to show what they shipped, what it does, and
                where people can try it. Projects can still come in through
                Discord with{" "}
                <span className="font-semibold text-foreground">
                  /showcase-project
                </span>
                , but Discord is not required anymore.
              </p>
              <p className="max-w-3xl text-sm leading-relaxed text-foreground/66 md:text-base">
                Anyone can post a project here directly through the public
                submission API. This is a public hobby project with a public
                repository, and the archive is queryable by title, category, and
                search terms.
              </p>
            </div>

            <Card className="surface-glass overflow-hidden border-border/65 bg-card/84 py-0 shadow-lg">
              <div className="border-b border-border/35 px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Post directly
                </p>
                <h2 className="mt-2 font-display text-3xl leading-tight">
                  Anyone can submit with one curl request.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-foreground/72">
                  Only `project_name` is required. GitHub link, live link,
                  category, description, and submitted name are optional.
                </p>
              </div>

              <CardContent className="px-0 pb-0 pt-0">
                <div className="bg-[#243942] px-5 py-5 text-[#e6e1c5]">
                  <pre className="overflow-x-auto text-xs leading-relaxed md:text-sm">
                    <code>{`curl -X POST "${apiOrigin}/api/submissions" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_name": "Your Project",
    "description": "What it does",
    "category": "Creative Tools",
    "github_url": "https://github.com/you/project",
    "live_url": "https://your-project.example.com",
    "submitted_by": "Your Name"
  }'`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-4 pb-2 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              {statCards.map((item) => (
                <Card
                  key={item.label}
                  className="surface-glass border-border/60 bg-card/76 shadow-md"
                >
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {item.label}
                    </p>
                    <div className="mt-4 flex items-end gap-3">
                      <span className="font-display text-4xl leading-none">
                        {item.accessor(projects.length, projects)}
                      </span>
                      <span className="pb-1 text-sm text-foreground/65">
                        {item.suffix}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-6xl">
            <Card className="surface-glass mb-8 border-border/65 bg-card/84 shadow-lg">
              <CardHeader className="gap-4">
                <div className="space-y-2">
                  <CardTitle className="font-display text-3xl">
                    Query the Jam archive.
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-relaxed text-foreground/72">
                    Search titles and summaries, or filter by category. Every
                    project here was intentionally submitted through Discord by
                    a builder who wanted it showcased.
                  </CardDescription>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.5fr_0.9fr]">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      aria-label="Search projects"
                      className="h-11 rounded-3xl border-border/70 bg-background/55 pl-11"
                      placeholder="Search projects, summaries, or stack"
                      value={query}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        startTransition(() => {
                          setQuery(nextValue);
                        });
                      }}
                    />
                  </label>

                  <Select
                    value={category}
                    onValueChange={(value) => {
                      startTransition(() => {
                        setCategory(value ?? "all");
                      });
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-3xl border-border/70 bg-background/55 px-4">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((item) => (
                        <SelectItem key={item} value={item.toLowerCase()}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {query || category !== "all" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => {
                        startTransition(() => {
                          setQuery("");
                          setCategory("all");
                        });
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : null}
              </CardHeader>
            </Card>

            {error ? (
              <Card className="mb-6 border-destructive/25 bg-destructive/8 text-destructive shadow-sm">
                <CardContent className="flex flex-col gap-3 pt-4 text-sm leading-relaxed">
                  <p className="font-medium">The project feed is not ready yet.</p>
                  <p>
                    {error}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Result set
                </p>
                <p className="mt-2 text-sm text-foreground/72">
                  Showing {filteredProjects.length} of {projects.length} listed
                  projects.
                </p>
              </div>
              <Separator className="md:hidden" />
              <p className="text-sm text-foreground/65">
                Query by title, summary, and category.
              </p>
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <Card className="surface-glass border-border/65 bg-card/80 shadow-md">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-background/55 px-3 py-1"
                  >
                    No matches
                  </Badge>
                  <div className="space-y-2">
                    <h2 className="font-display text-3xl">
                      Nothing matched that query just yet.
                    </h2>
                    <p className="max-w-xl text-sm leading-relaxed text-foreground/72">
                    {error
                      ? "Once Supabase is connected and the first projects are submitted, they will appear here."
                      : "Try a broader term or clear the current filter."}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="rounded-full"
                    onClick={() => {
                      startTransition(() => {
                        setQuery("");
                        setCategory("all");
                      });
                    }}
                  >
                    Reset search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
