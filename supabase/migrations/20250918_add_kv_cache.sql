create table if not exists public.kv_cache (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

alter table public.kv_cache enable row level security;

do $$ begin
  create policy kv_cache_ro on public.kv_cache
    for select
    to authenticated
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy kv_cache_rw on public.kv_cache
    for insert
    to authenticated
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy kv_cache_upd on public.kv_cache
    for update
    to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;


