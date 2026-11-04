create extension if not exists pgcrypto;
create table if not exists public.consultations (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 40),
 phone text not null,
 message text not null check(char_length(message) between 5 and 1000),
 status text not null default 'new' check(status in ('new','contacted','closed')),
 created_at timestamptz not null default now()
);
alter table public.consultations enable row level security;
revoke all on public.consultations from anon, authenticated;
create index if not exists consultations_created_at_idx on public.consultations(created_at desc);
-- Only server-side service-role API code accesses consultation records.