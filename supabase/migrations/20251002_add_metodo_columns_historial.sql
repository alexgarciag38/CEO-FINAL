-- Añade columnas de método a movimientos_historial y relaciones opcionales

alter table if exists public.movimientos_historial
  add column if not exists metodo_categoria_id uuid null,
  add column if not exists metodo_subcategoria_id uuid null;

do $$
begin
  -- FK a metodos_pago_categorias (si existe la tabla y no existe la FK)
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='metodos_pago_categorias'
  ) and not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='movimientos_historial' and constraint_name='fk_mh_metodo_categoria'
  ) then
    alter table public.movimientos_historial
      add constraint fk_mh_metodo_categoria
      foreign key (metodo_categoria_id)
      references public.metodos_pago_categorias(id)
      on update cascade on delete set null;
  end if;

  -- FK a metodos_pago_subcategorias (si existe la tabla y no existe la FK)
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='metodos_pago_subcategorias'
  ) and not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='movimientos_historial' and constraint_name='fk_mh_metodo_subcategoria'
  ) then
    alter table public.movimientos_historial
      add constraint fk_mh_metodo_subcategoria
      foreign key (metodo_subcategoria_id)
      references public.metodos_pago_subcategorias(id)
      on update cascade on delete set null;
  end if;
end $$;

create index if not exists idx_mh_metodo_categoria_id on public.movimientos_historial(metodo_categoria_id);
create index if not exists idx_mh_metodo_subcategoria_id on public.movimientos_historial(metodo_subcategoria_id);


