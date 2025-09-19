-- Fix: crear políticas e índices de productos con comprobaciones, en una versión única
create extension if not exists pgcrypto;

-- Asegurar tabla existe
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

-- Políticas owner-only si faltan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='productos' AND policyname='productos_select_own'
  ) THEN
    CREATE POLICY productos_select_own ON public.productos FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='productos' AND policyname='productos_insert_own'
  ) THEN
    CREATE POLICY productos_insert_own ON public.productos FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Índices idempotentes
create index if not exists productos_nombre_idx on public.productos using gin (to_tsvector('spanish', nombre));
create unique index if not exists productos_user_sku_key on public.productos (user_id, sku);
