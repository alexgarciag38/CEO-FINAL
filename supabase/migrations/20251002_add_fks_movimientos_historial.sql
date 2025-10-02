-- Agregar claves foráneas y/o relaciones requeridas para resolver joins en Historial

do $$
begin
  -- FK a categorias_financieras
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'fk_mh_categoria'
      and table_schema = 'public'
      and table_name = 'movimientos_historial'
  ) then
    alter table public.movimientos_historial
      add constraint fk_mh_categoria
      foreign key (categoria_id)
      references public.categorias_financieras(id)
      on update cascade
      on delete set null;
  end if;

  -- FK a subcategorias_financieras
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'fk_mh_subcategoria'
      and table_schema = 'public'
      and table_name = 'movimientos_historial'
  ) then
    alter table public.movimientos_historial
      add constraint fk_mh_subcategoria
      foreign key (subcategoria_id)
      references public.subcategorias_financieras(id)
      on update cascade
      on delete set null;
  end if;

  -- FK a proveedores (solo si la tabla y columna aplican como UUID id)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'movimientos_historial' and column_name = 'proveedor_cliente'
  )
  and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'proveedores'
  )
  and not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'fk_mh_proveedor'
      and table_schema = 'public'
      and table_name = 'movimientos_historial'
  ) then
    alter table public.movimientos_historial
      add constraint fk_mh_proveedor
      foreign key (proveedor_cliente)
      references public.proveedores(id)
      on update cascade
      on delete set null;
  end if;
end $$;

-- Índices de apoyo
create index if not exists idx_mh_categoria_id on public.movimientos_historial(categoria_id);
create index if not exists idx_mh_subcategoria_id on public.movimientos_historial(subcategoria_id);
create index if not exists idx_mh_proveedor_cliente on public.movimientos_historial(proveedor_cliente);


