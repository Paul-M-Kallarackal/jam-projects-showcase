create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  category text not null,
  tags text[] not null default '{}'::text[],
  stack text[] not null default '{}'::text[],
  project_url text,
  repository_url text,
  cover_image_url text,
  submitted_by text,
  is_featured boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint projects_status_check check (status in ('draft', 'published', 'archived')),
  constraint projects_project_url_http check (
    project_url is null or project_url ~* '^https?://'
  ),
  constraint projects_repository_url_http check (
    repository_url is null or repository_url ~* '^https?://'
  ),
  constraint projects_cover_image_url_http check (
    cover_image_url is null or cover_image_url ~* '^https?://'
  ),
  constraint projects_published_requires_timestamp check (
    status <> 'published' or published_at is not null
  )
);

create index if not exists projects_status_published_idx
  on public.projects (status, published_at desc);

create index if not exists projects_featured_idx
  on public.projects (is_featured desc, published_at desc);

create index if not exists projects_tags_idx
  on public.projects using gin (tags);

create index if not exists projects_stack_idx
  on public.projects using gin (stack);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists handle_projects_updated_at on public.projects;

create trigger handle_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;

revoke all on public.projects from anon, authenticated;
grant select on public.projects to anon, authenticated;

drop policy if exists "Published projects are readable" on public.projects;

create policy "Published projects are readable"
on public.projects
for select
to anon, authenticated
using (status = 'published' and published_at is not null);

comment on table public.projects is
  'Public-facing project catalog. This repo intentionally exposes read-only access for published rows only.';
