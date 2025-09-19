-- Extensión necesaria para gen_random_uuid()
create extension if not exists pgcrypto;

-- Tabla de productos por usuario
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  nombre text not null,
  costo numeric not null
);

-- RLS
alter table public.productos enable row level security;

-- Políticas: owner-only (crear solo si no existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'productos'
      AND policyname = 'productos_select_own'
  ) THEN
    create policy productos_select_own
      on public.productos for select
      using (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'productos'
      AND policyname = 'productos_insert_own'
  ) THEN
    create policy productos_insert_own
      on public.productos for insert
      with check (auth.uid() = user_id);
  END IF;
END
$$;

-- Índices
create index if not exists productos_nombre_idx on public.productos using gin (to_tsvector('spanish', nombre));

-- Unicidad por usuario+sku para upsert confiable
create unique index if not exists productos_user_sku_key on public.productos (user_id, sku);

comment on table public.productos is 'Catálogo de productos por usuario con RLS owner-only';
