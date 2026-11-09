-- SUSHIJARO independent Neon PostgreSQL schema
create extension if not exists pgcrypto;
create table if not exists site_copy(
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
create table if not exists site_sections(
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'INFORMATION',
  title text not null,
  body text not null,
  icon text not null default 'medical',
  sort_order integer not null default 10,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists consultations(
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(name) between 2 and 40),
  phone text not null,
  message text not null check(char_length(message) between 5 and 1000),
  status text not null default 'new' check(status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_consultations_created on consultations(created_at desc);
create index if not exists idx_site_sections_order on site_sections(sort_order);

-- Display placement allows admins to edit the cards visible on the landing page
alter table site_sections add column if not exists placement text not null default 'service';
create index if not exists idx_site_sections_placement on site_sections(placement,sort_order);
-- User-submitted reviews. Nothing is publicly visible before approval.
create table if not exists customer_reviews(
 id uuid primary key default gen_random_uuid(),
 nickname varchar(30) not null,
 rating integer not null check(rating between 1 and 5),
 title varchar(80) not null,
 body text not null check(char_length(body) between 15 and 1200),
 status varchar(12) not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists idx_customer_reviews_status on customer_reviews(status,created_at desc);

-- Customer-facing review date override; original created_at is preserved for audit.
alter table customer_reviews add column if not exists display_date date;
