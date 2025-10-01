-- Crear tabla de historial de movimientos financieros
create table if not exists public.movimientos_historial (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  tipo text not null check (tipo in ('Ingreso','Egreso')),
  categoria_id uuid null,
  subcategoria_id uuid null,
  proveedor_cliente text null,
  descripcion text not null,
  monto numeric(14,2) not null,
  fecha_movimiento date null,
  fecha_programada date null,
  fecha_efectiva date null,
  forma_pago text null,
  fiscal boolean default false,
  notas text null,
  estado text not null default 'Completado',
  origen text not null default 'unico',
  -- Metadata de recurrencias
  regla_id uuid null,
  n_orden_ocurrencia integer null,
  total_planeadas integer null,
  -- Timestamps
  procesado_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Índices para rendimiento
create index if not exists idx_historial_usuario_fecha on public.movimientos_historial (usuario_id, fecha_efectiva desc);
create index if not exists idx_historial_regla on public.movimientos_historial (regla_id);
create index if not exists idx_historial_origen on public.movimientos_historial (origen);

-- Habilitar RLS
alter table public.movimientos_historial enable row level security;

-- Políticas mínimas: cada usuario sólo ve sus registros
do $$ begin
  if not exists (
    select 1 from pg_policies p 
    where p.schemaname = 'public' and p.tablename = 'movimientos_historial' and p.policyname = 'mh_select_own'
  ) then
    create policy mh_select_own on public.movimientos_historial for select
      using (auth.uid() = usuario_id);
  end if;
  if not exists (
    select 1 from pg_policies p 
    where p.schemaname = 'public' and p.tablename = 'movimientos_historial' and p.policyname = 'mh_insert_own'
  ) then
    create policy mh_insert_own on public.movimientos_historial for insert
      with check (auth.uid() = usuario_id);
  end if;
end $$;


