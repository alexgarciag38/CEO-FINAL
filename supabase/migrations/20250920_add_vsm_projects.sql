create table if not exists public.vsm_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  project_name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  vsm_data jsonb not null
);

alter table public.vsm_projects enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vsm_projects' and policyname = 'vsm_projects_select_own'
  ) then
    create policy vsm_projects_select_own on public.vsm_projects
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vsm_projects' and policyname = 'vsm_projects_insert_self'
  ) then
    create policy vsm_projects_insert_self on public.vsm_projects
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vsm_projects' and policyname = 'vsm_projects_update_own'
  ) then
    create policy vsm_projects_update_own on public.vsm_projects
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;


