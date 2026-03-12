# Jam Projects Showcase

A public Next.js showcase for Jam builders to submit and share projects, with Discord as the main submission path and a direct `curl` fallback for manual posting.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- Supabase

## Security Defaults

- The app only expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The public UI is read-only; inserts happen only through the server-side submission API
- The public app is read-only by design
- Supabase RLS allows `select` only for rows where `status = 'published'`
- No insert, update, or delete policies are opened here
- Security headers are set in `next.config.ts`

The read-only UI still uses only public env vars. The submission API is server-side and separately requires:

- `SUPABASE_SERVICE_ROLE_KEY`

The submission API is intentionally public, so the current protection model is:

- strict server-side validation and sanitization
- Supabase service-role inserts that stay server-side only
- read-only public RLS for published rows
- request rate limiting before insert

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
3. Run the SQL in `supabase/migrations/202603120002_submission_rate_limits.sql`.
4. Copy `.env.example` to `.env.local`.
5. Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

6. In Supabase, get these values from `Project Settings -> API`:
   - `Project URL`
   - `anon` / publishable key
7. Insert a few rows into `public.projects` with:
   - a unique `slug`
   - `status = 'published'`
   - a non-null `published_at`

## Vercel Setup

1. Import this repo into Vercel or run `vercel` from the project root.
2. In Vercel, add:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. Redeploy after adding the variables.

The browser still only sees the two `NEXT_PUBLIC_...` values. The service-role key stays server-side in Vercel.

Optional tuning envs for the public submission API:

```env
SHOWCASE_RATE_LIMIT_MAX_REQUESTS=8
SHOWCASE_RATE_LIMIT_WINDOW_SECONDS=3600
SHOWCASE_RATE_LIMIT_BLOCK_SECONDS=3600
```

If you omit them, the API defaults to 8 submissions per hour per connection fingerprint and blocks for 1 hour after the limit is exceeded.

## Submission API

The app now exposes a server-side submission endpoint:

`POST /api/submissions`

The intended flow is:

1. submit through Discord with `/showcase-project`
2. if you want to post directly, use the public `curl` request from the homepage

Required header:

```http
Content-Type: application/json
```

Example request body:

```json
{
  "project": {
    "name": "Jam AI Copilot",
    "description": "A coding copilot for community builders.",
    "github_url": "https://github.com/you/jam-ai-copilot",
    "live_url": "https://jam-ai-copilot.example.com",
    "category": "AI"
  },
  "member": {
    "display_name": "Paul"
  }
}
```

The endpoint also accepts the bot-style nested payload with `guild`, `channel`, `member`, and `project`, so the Discord bot can post richer metadata without needing a separate backend.

The route validates and normalizes input before insert, only accepts `http` / `https` URLs, creates slugs server-side, and writes through Supabase using the server-side service-role key. The UI renders user content as text rather than HTML, which keeps the public surface safer from stored XSS. Because the endpoint is public, this protects against injection issues but does not by itself prevent spam or abuse from many distinct IPs.

It also applies a server-side rate limit before insert and returns standard `X-RateLimit-*` headers plus `Retry-After` when the limit is hit. The default policy is:

- `8` submissions per hour per connection fingerprint
- `1` hour block after the limit is exceeded

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

- This repo is intentionally frontend-first, with one small server-side route for project submissions.
- If Supabase is configured incorrectly, the app shows the live error instead of masking it with mock data.
- The showcase search/filtering is client-side in this public build for simplicity.
- Search currently matches `title`, `summary`, and `stack`, and filters by one category at a time.
