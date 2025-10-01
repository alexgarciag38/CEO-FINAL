-- Agregar columnas opcionales para enlazar ocurrencias a reglas
alter table if exists public.movimientos_financieros
  add column if not exists regla_id uuid null,
  add column if not exists n_orden_ocurrencia integer null,
  add column if not exists total_planeadas integer null;

create index if not exists idx_movfin_regla on public.movimientos_financieros (regla_id);


