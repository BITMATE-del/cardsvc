create table if not exists public.site_copy (key text primary key, value text not null, updated_at timestamptz not null default now());
alter table public.site_copy enable row level security;
revoke all on public.site_copy from anon, authenticated;
insert into public.site_copy(key,value) values('customs_faq_answer','네, 통관 가능한 사례가 있으며 실제 통관 완료 사례도 있습니다. 접수 시 필요한 조건과 절차를 안내해 드립니다.') on conflict (key) do nothing;
