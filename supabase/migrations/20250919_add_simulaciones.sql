-- Create table: simulaciones (DeFi simulator saves)
create table if not exists public.simulaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre_simulacion text not null,
  platform text,
  product_sku text,
  product_name text not null,
  publication_price numeric,
  net_profit numeric,
  net_margin numeric,
  total_estimated_costs numeric,
  raw_simulation_data jsonb not null,
  scenario_desfavorable jsonb,
  scenario_realista jsonb,
  scenario_optimista jsonb
);

-- Enable RLS
alter table public.simulaciones enable row level security;

-- Policies
create policy if not exists "simulaciones_select_own"
  on public.simulaciones for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "simulaciones_insert_own"
  on public.simulaciones for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "simulaciones_update_own"
  on public.simulaciones for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "simulaciones_delete_own"
  on public.simulaciones for delete
  to authenticated
  using (user_id = auth.uid());


