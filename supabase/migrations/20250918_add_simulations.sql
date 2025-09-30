create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.simulations enable row level security;

do $$ begin
  create policy sims_owner_select on public.simulations
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy sims_owner_insert on public.simulations
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy sims_owner_delete on public.simulations
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create index if not exists simulations_user_id_created_at_idx on public.simulations(user_id, created_at desc);





