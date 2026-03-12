"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useState } from "react";
import { easeOut, motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ProjectCard } from "@/components/showcase/project-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const revealUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut, delay },
  }),
};

const statCards = [
  {
    label: "Published",
    accessor: (count: number) => count,
    suffix: "projects",
  },
  {
    label: "Featured",
    accessor: (_count: number, projects: ShowcaseData["projects"]) =>
      projects.filter((project) => project.isFeatured).length,
    suffix: "hand-picked",
  },
  {
    label: "Live demos",
    accessor: (_count: number, projects: ShowcaseData["projects"]) =>
      projects.filter((project) => Boolean(project.projectUrl)).length,
    suffix: "launch links",
  },
  {
    label: "Open repos",
    accessor: (_count: number, projects: ShowcaseData["projects"]) =>
      projects.filter((project) => Boolean(project.repositoryUrl)).length,
    suffix: "source links",
  },
] as const;

function summarizeSource(source: ShowcaseData["source"], error?: string) {
  if (error) {
    return {
      label: "Supabase error",
      tone: "bg-destructive/12 text-destructive",
      detail:
        "The app found Supabase env values, so it stopped on the connection error instead of silently falling back.",
    };
  }

  if (source === "demo") {
    return {
      label: "Demo data",
      tone: "bg-secondary text-secondary-foreground",
      detail:
        "No Supabase env values were found, so the page is using preview projects for local development.",
    };
  }

  return {
    label: "Live Supabase",
    tone: "bg-primary text-primary-foreground",
    detail:
      "Published projects are loading from Supabase with public read access restricted by RLS.",
  };
}

export function ShowcaseShell({ projects, source, error }: ShowcaseData) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");

  const deferredQuery = useDeferredValue(query);
  const sourceBadge = summarizeSource(source, error);

  const categories = Array.from(
    new Set(projects.map((project) => project.category))
  ).sort((left, right) => left.localeCompare(right));

  const tags = Array.from(new Set(projects.flatMap((project) => project.tags))).sort(
    (left, right) => left.localeCompare(right)
  );

  const filteredProjects = projects.filter((project) => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      project.title.toLowerCase().includes(normalizedQuery) ||
      project.summary.toLowerCase().includes(normalizedQuery) ||
      project.tags.some((item) => item.toLowerCase().includes(normalizedQuery)) ||
      project.stack.some((item) => item.toLowerCase().includes(normalizedQuery));

    const matchesCategory =
      category === "all" || project.category.toLowerCase() === category;

    const matchesTag = tag === "all" || project.tags.includes(tag);

    return matchesQuery && matchesCategory && matchesTag;
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 hidden size-80 rounded-full bg-accent/18 blur-3xl md:block" />
        <div className="absolute right-0 top-48 hidden size-72 rounded-full bg-secondary/35 blur-3xl md:block" />
        <div className="absolute bottom-0 left-1/3 hidden size-72 rounded-full bg-muted/35 blur-3xl md:block" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Jam Projects Showcase
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              Public, filterable, and intentionally read-only.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={cn("rounded-full px-3 py-1 text-xs", sourceBadge.tone)}>
              {sourceBadge.label}
            </Badge>
            <Link
              href="#projects"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
            >
              Browse
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 pb-16 pt-16 md:px-6 md:pb-24 md:pt-22 lg:pt-30">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={revealUp}
              custom={0}
              className="space-y-6"
            >
              <Badge
                variant="outline"
                className="rounded-full border-border/80 bg-card/65 px-4 py-1"
              >
                RLS-first Supabase showcase
              </Badge>
              <div className="space-y-4">
                <h1 className="font-display text-5xl leading-none tracking-tight text-balance md:text-7xl">
                  A warm, searchable home for every Jam build worth remembering.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-foreground/74 md:text-lg">
                  This public repository keeps the frontend simple: published
                  projects come from Supabase, the app only uses the anon key,
                  and no custom backend surface is exposed here.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#projects"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                >
                  Explore projects
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="https://supabase.com/docs/guides/database/postgres/row-level-security"
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "rounded-full bg-card/50"
                  )}
                >
                  RLS guidance
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={revealUp}
              custom={0.08}
            >
              <Card className="surface-glass border-border/65 bg-card/78 shadow-lg">
                <CardHeader className="gap-4">
                  <Badge
                    variant="secondary"
                    className="w-fit rounded-full bg-secondary/75 text-secondary-foreground"
                  >
                    Security defaults
                  </Badge>
                  <CardTitle className="font-display text-3xl leading-tight">
                    Locked down by default, calm to operate.
                  </CardTitle>
                  <CardDescription className="max-w-lg text-sm leading-relaxed text-foreground/72">
                    {sourceBadge.detail}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      icon: LockKeyhole,
                      title: "No service role in-app",
                      copy:
                        "The public app only expects NEXT_PUBLIC Supabase values and never asks for privileged secrets.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Published rows only",
                      copy:
                        "Anon reads are limited to rows marked published, with no insert, update, or delete policy exposed here.",
                    },
                    {
                      icon: Database,
                      title: "Supabase as the single store",
                      copy:
                        "Projects live in one table with predictable metadata, clean search fields, and explicit publish state.",
                    },
                    {
                      icon: Sparkles,
                      title: "Frontend-only experience",
                      copy:
                        "No bespoke backend routes are required for the public browsing flow, which keeps the surface small.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-4xl border border-border/60 bg-background/45 p-5"
                    >
                      <item.icon className="size-5 text-accent" />
                      <h2 className="mt-4 font-display text-xl">{item.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/72">
                        {item.copy}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="px-4 pb-8 md:px-6">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
            {statCards.map((item, index) => (
              <motion.div
                key={item.label}
                initial="hidden"
                animate="visible"
                variants={revealUp}
                custom={0.14 + index * 0.05}
              >
                <Card className="surface-glass border-border/60 bg-card/72 shadow-md">
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
              </motion.div>
            ))}
          </div>
        </section>

        <section id="projects" className="px-4 py-12 md:px-6 md:py-18 lg:py-22">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={revealUp}
              custom={0.22}
              className="mb-8"
            >
              <Card className="surface-glass border-border/65 bg-card/80 shadow-lg">
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/80 bg-background/55 px-3 py-1"
                      >
                        Search and filter
                      </Badge>
                      <CardTitle className="font-display text-3xl">
                        Query the published Jam archive.
                      </CardTitle>
                      <CardDescription className="max-w-2xl text-sm leading-relaxed text-foreground/72">
                        Search titles, summaries, tags, and stack choices. The
                        page stays deliberately read-only so the public app never
                        needs write permissions.
                      </CardDescription>
                    </div>

                    <Badge className={cn("rounded-full px-3 py-1 text-xs", sourceBadge.tone)}>
                      {sourceBadge.label}
                    </Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
                    <label className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label="Search projects"
                        className="h-11 rounded-3xl border-border/70 bg-background/55 pl-11"
                        placeholder="Search projects, tags, stack, or summaries"
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

                    <Select
                      value={tag}
                      onValueChange={(value) => {
                        startTransition(() => {
                          setTag(value ?? "all");
                        });
                      }}
                    >
                      <SelectTrigger className="h-11 w-full rounded-3xl border-border/70 bg-background/55 px-4">
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tags</SelectItem>
                        {tags.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {tags.slice(0, 8).map((item) => (
                      <Button
                        key={item}
                        size="sm"
                        variant={tag === item ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => {
                          startTransition(() => {
                            setTag((current) => (current === item ? "all" : item));
                          });
                        }}
                      >
                        {item}
                      </Button>
                    ))}
                    {(query || category !== "all" || tag !== "all") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => {
                          startTransition(() => {
                            setQuery("");
                            setCategory("all");
                            setTag("all");
                          });
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            {error ? (
              <Card className="mb-6 border-destructive/25 bg-destructive/8 text-destructive shadow-sm">
                <CardContent className="flex flex-col gap-3 pt-4 text-sm leading-relaxed">
                  <p className="font-medium">Supabase connection failed.</p>
                  <p>
                    {error}. Fix the env values or table and policy setup to
                    restore live data. The app stays honest here instead of
                    masking the issue with demo content.
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
                  Showing {filteredProjects.length} of {projects.length} published
                  projects.
                </p>
              </div>
              <Separator className="md:hidden" />
              <p className="text-sm text-foreground/65">
                Search is client-side for speed and simplicity in this public build.
              </p>
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial="hidden"
                    animate="visible"
                    variants={revealUp}
                    custom={0.28 + index * 0.03}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
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
                      Try a broader term, clear the current filters, or switch
                      back to all tags and categories.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="rounded-full"
                    onClick={() => {
                      startTransition(() => {
                        setQuery("");
                        setCategory("all");
                        setTag("all");
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

        <section className="px-4 pb-24 pt-2 md:px-6 md:pb-30">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={revealUp}
              custom={0.36}
              className="space-y-4"
            >
              <Badge
                variant="outline"
                className="rounded-full border-border/70 bg-card/60 px-4 py-1"
              >
                Security posture
              </Badge>
              <h2 className="font-display text-4xl leading-tight text-balance">
                Built for public browsing, not privileged operations.
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-foreground/72">
                The point of this repository is to stay small and legible. It is
                a polished public surface over Supabase data, with security
                handled through schema design, RLS, and zero privileged keys in
                the app.
              </p>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Anon key only",
                  body:
                    "The browser never needs a service-role key. Public data is fetched with the same publishable credentials your visitors use.",
                },
                {
                  title: "RLS denies writes",
                  body:
                    "This app ships with a read-only policy set for anon and authenticated users. No insert, update, or delete policy is opened here.",
                },
                {
                  title: "Published state gates exposure",
                  body:
                    "Rows are only visible when explicitly marked published and timestamped, which keeps drafts and internal staging out of the public view.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial="hidden"
                  animate="visible"
                  variants={revealUp}
                  custom={0.4 + index * 0.05}
                >
                  <Card className="surface-glass h-full border-border/60 bg-card/76 shadow-md">
                    <CardContent className="pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Guardrail {index + 1}
                      </p>
                      <h3 className="mt-4 font-display text-2xl">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/72">
                        {item.body}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
