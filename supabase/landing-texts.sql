create table if not exists public.site_copy(
 key text primary key,
 value text not null,
 updated_at timestamptz not null default now()
);
alter table public.site_copy enable row level security;
revoke all on public.site_copy from anon,authenticated;
create index if not exists site_copy_updated_at_idx on public.site_copy(updated_at desc);
-- CRUD via the existing server-only service role client; no public policies.
