# Jam Projects Showcase

A public Next.js showcase for published Jam projects, backed by Supabase and locked down with RLS-first defaults.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- Supabase

## Security Defaults

- The app only expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No service-role key is used in this repository
- The public app is read-only by design
- Supabase RLS allows `select` only for rows where `status = 'published'`
- No insert, update, or delete policies are opened here
- Security headers are set in `next.config.ts`

## Local Development

Install dependencies and run the app:

```bash
npm install
npm run dev
```

If you do not set Supabase env values, the app automatically uses local demo data so the UI still works.

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/202603120001_projects.sql`.
3. Copy `.env.example` to `.env.local`.
4. Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

5. Insert a few rows into `public.projects` with:
   - a unique `slug`
   - `status = 'published'`
   - a non-null `published_at`

## Project Shape

The UI reads these public fields from `public.projects`:

- `slug`
- `title`
- `summary`
- `category`
- `tags`
- `stack`
- `project_url`
- `repository_url`
- `submitted_by`
- `is_featured`
- `published_at`

## Notes

- This repo is intentionally frontend-first and avoids custom backend routes.
- If Supabase is configured incorrectly, the app shows the live error instead of silently masking it.
- The showcase search/filtering is client-side in this public build for simplicity.
