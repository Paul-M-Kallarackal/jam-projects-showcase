create table if not exists public.submission_rate_limits (
  fingerprint text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default timezone('utc', now()),
  blocked_until timestamptz,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint submission_rate_limits_request_count_check check (request_count >= 0)
);

create index if not exists submission_rate_limits_window_idx
  on public.submission_rate_limits (window_started_at);

create index if not exists submission_rate_limits_blocked_idx
  on public.submission_rate_limits (blocked_until);

drop trigger if exists handle_submission_rate_limits_updated_at on public.submission_rate_limits;

create trigger handle_submission_rate_limits_updated_at
before update on public.submission_rate_limits
for each row
execute function public.set_updated_at();

alter table public.submission_rate_limits enable row level security;

revoke all on public.submission_rate_limits from anon, authenticated;

comment on table public.submission_rate_limits is
  'Server-side submission rate limit ledger keyed by a hashed client fingerprint.';

create or replace function public.consume_submission_rate_limit(
  p_fingerprint text,
  p_max_requests integer default 8,
  p_window_seconds integer default 3600,
  p_block_seconds integer default 3600
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_time timestamptz := timezone('utc', now());
  current_row public.submission_rate_limits%rowtype;
  next_reset_at timestamptz;
begin
  if p_fingerprint is null or length(trim(p_fingerprint)) = 0 then
    raise exception 'submission fingerprint is required';
  end if;

  if p_max_requests <= 0 or p_window_seconds <= 0 or p_block_seconds <= 0 then
    raise exception 'submission rate limit configuration must be positive';
  end if;

  insert into public.submission_rate_limits as limits (
    fingerprint,
    request_count,
    window_started_at,
    blocked_until,
    last_seen_at
  )
  values (
    p_fingerprint,
    0,
    current_time,
    null,
    current_time
  )
  on conflict (fingerprint) do nothing;

  select *
  into current_row
  from public.submission_rate_limits
  where fingerprint = p_fingerprint
  for update;

  if current_row.blocked_until is not null and current_row.blocked_until > current_time then
    allowed := false;
    retry_after_seconds := greatest(
      1,
      ceil(extract(epoch from (current_row.blocked_until - current_time)))::integer
    );
    remaining := 0;
    reset_at := current_row.blocked_until;
    return next;
    return;
  end if;

  if current_row.window_started_at <= current_time - make_interval(secs => p_window_seconds) then
    next_reset_at := current_time + make_interval(secs => p_window_seconds);

    update public.submission_rate_limits
    set
      request_count = 1,
      window_started_at = current_time,
      blocked_until = null,
      last_seen_at = current_time
    where fingerprint = p_fingerprint;

    allowed := true;
    retry_after_seconds := 0;
    remaining := greatest(p_max_requests - 1, 0);
    reset_at := next_reset_at;
    return next;
    return;
  end if;

  if current_row.request_count + 1 > p_max_requests then
    next_reset_at := current_time + make_interval(secs => p_block_seconds);

    update public.submission_rate_limits
    set
      blocked_until = next_reset_at,
      last_seen_at = current_time
    where fingerprint = p_fingerprint;

    allowed := false;
    retry_after_seconds := p_block_seconds;
    remaining := 0;
    reset_at := next_reset_at;
    return next;
    return;
  end if;

  update public.submission_rate_limits
  set
    request_count = request_count + 1,
    blocked_until = null,
    last_seen_at = current_time
  where fingerprint = p_fingerprint
  returning * into current_row;

  next_reset_at := current_row.window_started_at + make_interval(secs => p_window_seconds);

  allowed := true;
  retry_after_seconds := 0;
  remaining := greatest(p_max_requests - current_row.request_count, 0);
  reset_at := next_reset_at;
  return next;
end;
$$;

revoke all on function public.consume_submission_rate_limit(text, integer, integer, integer) from public, anon, authenticated;
