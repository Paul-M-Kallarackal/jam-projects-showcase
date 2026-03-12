# Jam Projects Showcase

A public Next.js showcase for Jam builders to submit and share projects through Discord.

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

If Supabase env values are missing, the app shows a real setup state instead of fake project data.

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/202603120001_projects.sql`.
3. Copy `.env.example` to `.env.local`.
4. Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

5. In Supabase, get these values from `Project Settings -> API`:
   - `Project URL`
   - `anon` / publishable key
6. Insert a few rows into `public.projects` with:
   - a unique `slug`
   - `status = 'published'`
   - a non-null `published_at`

## Vercel Setup

1. Import this repo into Vercel or run `vercel` from the project root.
2. In Vercel, add:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Redeploy after adding the variables.

The app only needs those two public env vars. It does not need a service-role key.

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
- If Supabase is configured incorrectly, the app shows the live error instead of masking it with mock data.
- The showcase search/filtering is client-side in this public build for simplicity.
