import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Movimiento = 'Ingreso' | 'Egreso';
type ScopeTipo = 'PERSONAL' | 'MANUCAR' | 'CARBOX';
type Frecuencia = 'Único' | 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';

interface CategoryMap {
  [categoriaNombre: string]: string[];
}

interface CategoryOption { id: string; nombre: string }
interface SubcategoryOption { id: string; nombre: string; categoria_id: string }

interface ProgramadoRow {
  id?: string;
  scope_tipo: ScopeTipo | '';
  categoria_id: string;
  subcategoria_id: string;
  categoria_nombre?: string; // visual only
  subcategoria_nombre?: string; // visual only
  fiscal: 'SI' | 'NO';
  descripcion: string;
  proveedor_cliente: string;
  forma_pago: string;
  monto: string; // editable as string
  fecha_programada: string;
  frecuencia: Frecuencia;
  pagado: boolean;
  fecha_efectiva_pago: string; // only if pagado
  fecha_inicial_serie: string; // only if frecuencia != 'Único'
  notas: string;
}

interface HistorialRow {
  id: string;
  scope_tipo: ScopeTipo | '';
  categoria_id: string;
  subcategoria_id: string | null;
  categoria_nombre?: string;
  subcategoria_nombre?: string;
  fiscal: boolean;
  descripcion: string;
  proveedor_cliente: string | null;
  forma_pago: string;
  monto: number;
  fecha_programada: string;
  fecha_efectiva_pago: string;
  frecuencia: Frecuencia | null;
  notas: string | null;
}

const TIPOS: ScopeTipo[] = ['PERSONAL', 'MANUCAR', 'CARBOX'];
const FORMAS_PAGO = [
  'Efectivo', 'Transferencia', 'Terminal', 'Cheque', 'Debito automatico',
  'TDC Costco JANA BNX', 'TDC Roja CARLOS BNX', 'TDC Costco CARLOS BNX',
  'TDC Clasica CARLOS Inbursa', 'TDC Walmart CARLOS Inbursa', 'TDD Manucar INBURSA',
  'TDD Carlos INBURSA', 'TDD Jana INBURSA', 'TDD INBURSA Manucar',
  'DEBITO MERCADO PAGO MANUCAR', 'Otro'
];
const FRECUENCIAS: Frecuencia[] = ['Único','Diario','Semanal','Quincenal','Mensual','Bimestral','Trimestral','Semestral','Anual'];

// Categorías exactas (EGRESOS)
const CATEGORIAS_EGRESOS: CategoryMap = {
  'Compra Mercancía': ['Productos Limpieza', 'Productos Margrey', 'Productos 4c', 'Otros Productos Compra'],
  'Comisiones': ['Valentin', 'Ruben', 'Julio', 'Adela', 'Gris', 'Claudia Greer'],
  'Consumibles': ['Agua Embotellada', 'Bolsas Empaque', 'Cajas Empaque', 'Papelería Oficina', 'Otros Consumibles'],
  'Créditos': ['Tornados', 'Mercado libre'],
  'Gastos Mercado Libre': ['Comisiones Venta', 'Costos Envío', 'Publicidad ML', 'Otros ML', 'Factura'],
  'Gastos Personales': [
    'Vivienda - Servicios (Luz, Agua, Gas, Tel, Int.)', 'Vivienda - Renta/Hipoteca', 'Vivienda - Mantenimiento/Predial',
    'Educación/Colegiaturas', 'Supermercado/Alimentos', 'Transporte Personal (Gasolina, Manto)',
    'Salud/Médicos/Farmacia', 'Seguros Personales (Auto/GMM/Vida)', 'Ropa y Calzado',
    'Entretenimiento/Restaurantes/Viajes', 'Cuidado Personal', 'Regalos/Donaciones', 'Otros Gastos Personales'
  ],
  'Impuestos e IMSS': ['IMSS', 'ISN', 'IVA', 'ISR', 'ISR Empleados', 'Infonavit'],
  'Mantenimiento': ['Bodegas', 'Equipos', 'Vehículos', 'Limpieza Oficina/Bodega', 'Fumigación/Control Plagas'],
  'Nómina': [
    'Administrativo - Alejandrina', 'Administrativo - Cecy', 'Administrativo - Vicki',
    'Almacen - Angel', 'Almacen - Omar', 'Almacen - Victor', 'Cajera - Liz', 'Cajera - Lucy', 'Cajera - Maggi', 'Cajera - Sarahi',
    'Chofer - Albin', 'Chofer - Brandon', 'Chofer - Gael', 'Chofer - Hector', 'Chofer - Ulises', 'Socio - Carlos', 'Socio - Manuel',
    'Finiquitos', 'Otros Nomina'
  ],
  'Operación': ['Gasolina', 'Seguros', 'Seguros vehiculares', 'Uniformes', 'Placas y Trámites', 'Comisiones Bancarias', 'Otros Operación'],
  'Otros': ['Aseo Rosa', 'Uber', 'Cumpleaños', 'Caja chica', 'Varios'],
  'Publicidad': ['Publicidad ML', 'Publicidad Facebook', 'Publicidad Tiktok', 'Publicidad Instagram', 'Publicidad Maps', 'Publicidad Pagina Web', 'Publicidad Fisica', 'Lonas/Fisico'],
  'Renta': ['Camino Real', 'San Agustín', 'Carlos Magno', 'Santanita'],
  'Servicios': ['Lavanderia', 'Garrafon Agua', 'Agua Siapa', 'Gas', 'Cafeteria', 'Velador', 'Luz', 'Internet y Telefonia', 'Contador', 'Jardineria', 'Aseo', 'Registro de Marca', 'Paginas'],
  'Administración': ['Software', 'Paquetería', 'Alarmas/Seguridad', 'Otros Admin']
};

// Categorías exactas (INGRESOS)
const CATEGORIAS_INGRESOS: CategoryMap = {
  'Ventas Mostrador': ['Santa Anita', 'Camino Real'],
  'Ventas Ruta/Mayoreo': ['General'],
  'Ventas Mercado Libre': ['General'],
  'Financiamiento Recibido': ['[Banco Ejemplo 1]', '[Prestamo Socio X]', 'Otro Prestamista'],
  'Otros Ingresos': ['Varios', 'Bonificaciones Proveedores', 'Venta Activos']
};

async function ensureCategoryCatalog(movimiento: Movimiento, map: CategoryMap) {
  // Upsert categorías y subcategorías por nombre para el usuario actual
  // 1) Obtener existentes
  const { data: catsExisting } = await supabase
    .from('categorias_financieras')
    .select('id,nombre,tipo')
    .in('tipo', [movimiento, 'Ambos'])
    .order('nombre');

  const nameToCatId = new Map<string, string>();
  (catsExisting || []).forEach(c => nameToCatId.set(c.nombre, c.id));

  // 2) Insertar las categorías faltantes
  const missingCats = Object.keys(map).filter(nombre => !nameToCatId.has(nombre));
  if (missingCats.length > 0) {
    const { data: insertedCats, error } = await supabase
      .from('categorias_financieras')
      .insert(missingCats.map(nombre => ({ nombre, tipo: movimiento })))
      .select('id,nombre');
    if (!error && insertedCats) {
      insertedCats.forEach(c => nameToCatId.set(c.nombre, c.id));
    }
  }

  // 3) Asegurar subcategorías
  const { data: subsExisting } = await supabase
    .from('subcategorias_financieras')
    .select('id,nombre,categoria_id');

  const subKeyToId = new Map<string, string>(); // key: catNombre||subNombre
  (subsExisting || []).forEach(s => subKeyToId.set(`${s.categoria_id}||${s.nombre}`, s.id));

  const subToInsert: { nombre: string; categoria_id: string }[] = [];
  for (const [catNombre, subs] of Object.entries(map)) {
    const catId = nameToCatId.get(catNombre);
    if (!catId) continue;
    for (const subNombre of subs) {
      const key = `${catId}||${subNombre}`;
      if (!subKeyToId.has(key)) {
        subToInsert.push({ nombre: subNombre, categoria_id: catId });
      }
    }
  }
  if (subToInsert.length > 0) {
    await supabase.from('subcategorias_financieras').insert(subToInsert);
  }
}

async function loadCatalogMaps(movimiento: Movimiento): Promise<{
  categorias: CategoryOption[];
  subcategorias: SubcategoryOption[];
  catNameToId: Map<string, string>;
  subNameToIdPerCat: Map<string, Map<string, string>>;
}> {
  const { data: cats } = await supabase
    .from('categorias_financieras')
    .select('id,nombre,tipo')
    .order('nombre')
    .in('tipo', [movimiento, 'Ambos']);
  const { data: subs } = await supabase
    .from('subcategorias_financieras')
    .select('id,nombre,categoria_id')
    .order('nombre');

  const catNameToId = new Map<string, string>();
  (cats || []).forEach(c => catNameToId.set(c.nombre, c.id));
  const subNameToIdPerCat = new Map<string, Map<string, string>>();
  (subs || []).forEach(s => {
    const m = subNameToIdPerCat.get(s.categoria_id) || new Map<string, string>();
    m.set(s.nombre, s.id);
    subNameToIdPerCat.set(s.categoria_id, m);
  });

  // De-dup categorías por nombre (toma la primera ocurrencia)
  const seenCatNames = new Set<string>();
  const dedupCats: CategoryOption[] = [];
  for (const c of (cats || []) as any[]) {
    if (!seenCatNames.has(c.nombre)) {
      dedupCats.push({ id: c.id, nombre: c.nombre });
      seenCatNames.add(c.nombre);
    }
  }

  // De-dup subcategorías por (categoria_id, nombre)
  const seenSubKeys = new Set<string>();
  const dedupSubs: SubcategoryOption[] = [];
  for (const s of (subs || []) as any[]) {
    const key = `${s.categoria_id}||${s.nombre}`;
    if (!seenSubKeys.has(key)) {
      dedupSubs.push({ id: s.id, nombre: s.nombre, categoria_id: s.categoria_id });
      seenSubKeys.add(key);
    }
  }

  return {
    categorias: dedupCats,
    subcategorias: dedupSubs,
    catNameToId,
    subNameToIdPerCat
  };
}

function useCatalogSync() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        await ensureCategoryCatalog('Egreso', CATEGORIAS_EGRESOS);
        await ensureCategoryCatalog('Ingreso', CATEGORIAS_INGRESOS);
        setReady(true);
      } catch (e: any) {
        setError(e.message || 'Error sincronizando catálogos');
      }
    })();
  }, []);
  return { ready, error };
}

function HeaderCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-2 py-3 text-xs font-medium uppercase ${className}`}>{children}</th>;
}

function EditableCell(props: {
  isEditing: boolean;
  value: any;
  onChange: (v: any) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: { value: string; label: string }[];
}) {
  const { isEditing, value, onChange, onBlur, onKeyDown, type = 'text', options = [] } = props;
  if (!isEditing) return <>{type === 'checkbox' ? (value ? '✓' : '') : (value || '-')}</>;
  if (type === 'select') {
    return (
      <select
        className="w-full h-full border-0 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value ?? ''}
        onChange={(e) => { onChange(e.target.value); }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        autoFocus
      >
        <option value="">-</option>
        {options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
    );
  }
  if (type === 'checkbox') {
    return (
      <input
        type="checkbox"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        checked={!!value}
        onChange={(e) => { onChange(e.target.checked); }}
        onBlur={onBlur}
        onClick={(e) => e.stopPropagation()}
        autoFocus
      />
    );
  }
  return (
    <input
      type={type}
      className="w-full h-full border-0 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
      autoFocus
    />
  );
}

export const FinancialExcelTabs: React.FC = () => {
  const { ready, error: syncError } = useCatalogSync();
  const [activeTab, setActiveTab] = useState<'ingresos' | 'egresos' | 'historial-ingresos' | 'historial-egresos'>('ingresos');

  // Catálogos cargados (ids) por movimiento
  const [catsIngreso, setCatsIngreso] = useState<CategoryOption[]>([]);
  const [subsIngreso, setSubsIngreso] = useState<SubcategoryOption[]>([]);
  const [catsEgreso, setCatsEgreso] = useState<CategoryOption[]>([]);
  const [subsEgreso, setSubsEgreso] = useState<SubcategoryOption[]>([]);

  const [catNameToIdIngreso, setCatNameToIdIngreso] = useState<Map<string, string>>(new Map());
  const [subNameToIdPerCatIngreso, setSubNameToIdPerCatIngreso] = useState<Map<string, Map<string, string>>>(new Map());
  const [catNameToIdEgreso, setCatNameToIdEgreso] = useState<Map<string, string>>(new Map());
  const [subNameToIdPerCatEgreso, setSubNameToIdPerCatEgreso] = useState<Map<string, Map<string, string>>>(new Map());

  // Tablas programados
  const [rowsIngresos, setRowsIngresos] = useState<ProgramadoRow[]>([]);
  const [rowsEgresos, setRowsEgresos] = useState<ProgramadoRow[]>([]);
  // Tablas historial
  const [histIngresos, setHistIngresos] = useState<HistorialRow[]>([]);
  const [histEgresos, setHistEgresos] = useState<HistorialRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edición
  const [editingCell, setEditingCell] = useState<{ table: string; row: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const startEditing = (table: string, rowIndex: number, columnName: string, currentValue: any) => {
    setEditingCell({ table, row: rowIndex, column: columnName });
    setEditValue(currentValue);
    // Fijar el valor inicial correcto si es un select con etiqueta mostrada
    const setInitialFromRows = (rows: any[]) => {
      const row = rows[rowIndex];
      if (!row) return;
      const rawValue = (row as any)[columnName];
      setEditValue(rawValue ?? '');
    };
    if (table === 'ingresos') setInitialFromRows(rowsIngresos as any);
    if (table === 'egresos') setInitialFromRows(rowsEgresos as any);
    if (table === 'historial-ingresos') setInitialFromRows(histIngresos as any);
    if (table === 'historial-egresos') setInitialFromRows(histEgresos as any);
  };
  const saveEdit = () => {
    if (!editingCell) return;
    const { table, row, column } = editingCell;
    const apply = (arrSetter: React.Dispatch<React.SetStateAction<any[]>>) => {
      arrSetter(prev => {
        const copy = [...prev];
        const current = { ...copy[row] };
        // dependencias
        const valueToSet = editValue;
        if (column === 'categoria_id') current.subcategoria_id = '';
        if (column === 'pagado' && !valueToSet) current.fecha_efectiva_pago = '';
        if (column === 'frecuencia' && valueToSet === 'Único') current.fecha_inicial_serie = '';
        (current as any)[column] = valueToSet;
        copy[row] = current;
        return copy;
      });
    };
    if (table === 'ingresos') apply(setRowsIngresos);
    if (table === 'egresos') apply(setRowsEgresos);
    if (table === 'historial-ingresos') apply(setHistIngresos as any);
    if (table === 'historial-egresos') apply(setHistEgresos as any);
    setEditingCell(null);
    setEditValue('');
  };
  const cancelEdit = () => { setEditingCell(null); setEditValue(''); };

  const renderCell = (
    table: string,
    rowIndex: number,
    columnName: string,
    value: any,
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox' = 'text',
    options: Array<{ value: string; label: string }> = []
  ) => {
    const isEditing = editingCell?.table === table && editingCell?.row === rowIndex && editingCell?.column === columnName;
    const displayValue = (!isEditing && type === 'select')
      ? (options.find(o => o.value === value)?.label ?? '-')
      : value;
    return (
      <div
        className="w-full h-full px-2 py-2 cursor-pointer hover:bg-blue-50 flex items-center"
        onClick={isEditing ? undefined : () => startEditing(table, rowIndex, columnName, value)}
      >
        <EditableCell
          isEditing={!!isEditing}
          value={isEditing ? editValue : displayValue}
          onChange={(v) => setEditValue(v)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          type={type}
          options={options}
        />
      </div>
    );
  };

  const newEmptyProgramado = (): ProgramadoRow => ({
    scope_tipo: '',
    categoria_id: '',
    subcategoria_id: '',
    fiscal: 'NO',
    descripcion: '',
    proveedor_cliente: '',
    forma_pago: '',
    monto: '',
    fecha_programada: '',
    frecuencia: 'Único',
    pagado: false,
    fecha_efectiva_pago: '',
    fecha_inicial_serie: '',
    notas: ''
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar catálogos con ids
      const [ing, egr] = await Promise.all([
        loadCatalogMaps('Ingreso'),
        loadCatalogMaps('Egreso')
      ]);
      setCatsIngreso(ing.categorias);
      setSubsIngreso(ing.subcategorias);
      setCatNameToIdIngreso(ing.catNameToId);
      setSubNameToIdPerCatIngreso(ing.subNameToIdPerCat);
      setCatsEgreso(egr.categorias);
      setSubsEgreso(egr.subcategorias);
      setCatNameToIdEgreso(egr.catNameToId);
      setSubNameToIdPerCatEgreso(egr.subNameToIdPerCat);

      // Programados
      const [{ data: pagosIngreso }, { data: pagosEgreso }] = await Promise.all([
        supabase.from('financial_payments').select('*').eq('tipo', 'Ingreso').order('fecha_programada', { ascending: false }),
        supabase.from('financial_payments').select('*').eq('tipo', 'Egreso').order('fecha_programada', { ascending: false })
      ]);
  const mapProgramado = (r: any): ProgramadoRow => ({
        id: r.id,
        scope_tipo: (r.scope_tipo || '') as any,
        categoria_id: r.categoria_id || '',
        subcategoria_id: r.subcategoria_id || '',
        fiscal: r.fiscal ? 'SI' : 'NO',
        descripcion: r.descripcion || '',
        proveedor_cliente: r.proveedor_cliente || '',
        forma_pago: r.forma_pago || '',
        monto: (r.monto != null ? String(r.monto) : ''),
        fecha_programada: r.fecha_programada || '',
        frecuencia: (r.frecuencia || 'Único') as Frecuencia,
        pagado: !!r.pagado,
        fecha_efectiva_pago: r.fecha_efectiva_pago || '',
        fecha_inicial_serie: r.fecha_inicial_serie || '',
        notas: r.notas || ''
      });
      setRowsIngresos((pagosIngreso || []).map(mapProgramado));
      setRowsEgresos((pagosEgreso || []).map(mapProgramado));

      // Historial
      const [{ data: histIng }, { data: histEgr }] = await Promise.all([
        supabase.from('financial_payments_history').select('*').eq('tipo', 'Ingreso').order('fecha_efectiva_pago', { ascending: false }),
        supabase.from('financial_payments_history').select('*').eq('tipo', 'Egreso').order('fecha_efectiva_pago', { ascending: false })
      ]);
      setHistIngresos((histIng || []) as any);
      setHistEgresos((histEgr || []) as any);
    } catch (e: any) {
      setError(e.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const subOptionsByCatIdIngreso = useMemo(() => {
    const map = new Map<string, SubcategoryOption[]>();
    for (const s of subsIngreso) {
      const arr = map.get(s.categoria_id) || [];
      arr.push(s);
      map.set(s.categoria_id, arr);
    }
    return map;
  }, [subsIngreso]);
  const subOptionsByCatIdEgreso = useMemo(() => {
    const map = new Map<string, SubcategoryOption[]>();
    for (const s of subsEgreso) {
      const arr = map.get(s.categoria_id) || [];
      arr.push(s);
      map.set(s.categoria_id, arr);
    }
    return map;
  }, [subsEgreso]);

  const validateProgramado = (r: ProgramadoRow, idx: number): string[] => {
    const errs: string[] = [];
    if (!r.scope_tipo) errs.push(`Fila ${idx + 1}: TIPO es requerido`);
    if (!r.categoria_id) errs.push(`Fila ${idx + 1}: Categoría es requerida`);
    if (!r.descripcion || r.descripcion.trim().length < 10) errs.push(`Fila ${idx + 1}: Descripción mínimo 10 caracteres`);
    const montoNum = Number(r.monto);
    if (!r.monto || isNaN(montoNum) || montoNum <= 0) errs.push(`Fila ${idx + 1}: Monto inválido`);
    if (!r.forma_pago) errs.push(`Fila ${idx + 1}: Forma de Pago es requerida`);
    if (!r.fecha_programada) errs.push(`Fila ${idx + 1}: Fecha Programada es requerida`);
    if (r.pagado && !r.fecha_efectiva_pago) errs.push(`Fila ${idx + 1}: Fecha Efectiva requerida si está pagado/cobrado`);
    if (r.frecuencia !== 'Único' && !r.fecha_inicial_serie) errs.push(`Fila ${idx + 1}: Fecha Inicial Serie requerida para recurrentes`);
    return errs;
  };

  const saveProgramados = async (mov: Movimiento) => {
    setLoading(true);
    setError(null);
    try {
      const rows = mov === 'Ingreso' ? rowsIngresos : rowsEgresos;
      const allErrors = rows.flatMap((r, idx) => validateProgramado(r, idx));
      if (allErrors.length > 0) {
        setError(allErrors.join('\n'));
        setLoading(false);
        return;
      }
      const payloads = rows.map(r => ({
        id: r.id,
        usuario_id: undefined, // default auth.uid()
        movimiento: mov,
        scope_tipo: r.scope_tipo,
        tipo: mov, // para compatibilidad con componentes existentes
        categoria_id: r.categoria_id || null,
        subcategoria_id: r.subcategoria_id || null,
        categoria_nombre: undefined,
        subcategoria_nombre: undefined,
        fiscal: r.fiscal === 'SI',
        descripcion: r.descripcion.trim(),
        proveedor_cliente: r.proveedor_cliente || null,
        proveedor_id: null,
        forma_pago: r.forma_pago,
        monto: Number(r.monto),
        fecha_programada: r.fecha_programada,
        frecuencia: r.frecuencia,
        pagado: r.pagado,
        fecha_efectiva_pago: r.pagado ? (r.fecha_efectiva_pago || null) : null,
        fecha_inicial_serie: r.frecuencia !== 'Único' ? (r.fecha_inicial_serie || null) : null,
        notas: r.notas || null
      }));

      const toInsert = payloads.filter(p => !p.id).map(p => ({ ...p, id: undefined }));
      const toUpdate = payloads.filter(p => !!p.id);

      if (toInsert.length > 0) {
        const { error } = await supabase.from('financial_payments').insert(toInsert);
        if (error) throw error;
      }
      for (const p of toUpdate) {
        const { error } = await supabase.from('financial_payments').update(p).eq('id', p.id as string);
        if (error) throw error;
      }

      await loadData();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const addRow = (mov: Movimiento) => {
    if (mov === 'Ingreso') setRowsIngresos(prev => [newEmptyProgramado(), ...prev]);
    else setRowsEgresos(prev => [newEmptyProgramado(), ...prev]);
  };

  const removeRow = async (mov: Movimiento, idx: number) => {
    if (mov === 'Ingreso') {
      const row = rowsIngresos[idx];
      if (row?.id) await supabase.from('financial_payments').delete().eq('id', row.id);
      setRowsIngresos(prev => prev.filter((_, i) => i !== idx));
    } else {
      const row = rowsEgresos[idx];
      if (row?.id) await supabase.from('financial_payments').delete().eq('id', row.id);
      setRowsEgresos(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const markPaid = async (mov: Movimiento, idx: number) => {
    const rows = mov === 'Ingreso' ? rowsIngresos : rowsEgresos;
    const row = rows[idx];
    if (!row?.id) return;
    if (!row.fecha_efectiva_pago) {
      setError('Establece la Fecha Efectiva antes de marcar como pagado/cobrado');
      return;
    }
    const { error } = await supabase
      .from('financial_payments')
      .update({ pagado: true, fecha_efectiva_pago: row.fecha_efectiva_pago })
      .eq('id', row.id);
    if (error) { setError(error.message); return; }
    await loadData();
  };

  const renderProgramadoTable = (mov: Movimiento) => {
    const tableKey = mov === 'Ingreso' ? 'ingresos' : 'egresos';
    const rows = mov === 'Ingreso' ? rowsIngresos : rowsEgresos;
    const cats = mov === 'Ingreso' ? catsIngreso : catsEgreso;
    const subByCat = mov === 'Ingreso' ? subOptionsByCatIdIngreso : subOptionsByCatIdEgreso;
    const headerColor = mov === 'Ingreso' ? '#38761d' : '#073763';

    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 border-b border-red-200 whitespace-pre-wrap">{error}</div>}
        <table className="min-w-full table-auto">
          <thead style={{ backgroundColor: headerColor }} className="text-white sticky top-0 z-10">
            <tr>
              <HeaderCell className="border-r border-white/20">TIPO</HeaderCell>
              <HeaderCell className="border-r border-white/20">Categoría</HeaderCell>
              <HeaderCell className="border-r border-white/20">Subcategoría</HeaderCell>
              <HeaderCell className="border-r border-white/20">FISCAL</HeaderCell>
              <HeaderCell className="border-r border-white/20">Descripción</HeaderCell>
              <HeaderCell className="border-r border-white/20">Proveedor/Cliente</HeaderCell>
              <HeaderCell className="border-r border-white/20">Forma de Pago</HeaderCell>
              <HeaderCell className="border-r border-white/20">Monto</HeaderCell>
              <HeaderCell className="border-r border-white/20">Fecha Programada</HeaderCell>
              <HeaderCell className="border-r border-white/20">Frecuencia</HeaderCell>
              <HeaderCell className="border-r border-white/20">¿Pagado/Cobrado?</HeaderCell>
              <HeaderCell className="border-r border-white/20">Fecha Efectiva</HeaderCell>
              <HeaderCell className="border-r border-white/20">Fecha Inicial Serie</HeaderCell>
              <HeaderCell>Notas</HeaderCell>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-gray-50">
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'scope_tipo', row.scope_tipo, 'select', TIPOS.map(t => ({ value: t, label: t })))}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'categoria_id', row.categoria_id, 'select', cats.map(c => ({ value: c.id, label: c.nombre })))}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'subcategoria_id', row.subcategoria_id, 'select', (subByCat.get(row.categoria_id) || []).map(s => ({ value: s.id, label: s.nombre })))}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'fiscal', row.fiscal, 'select', [{ value: 'NO', label: 'NO' }, { value: 'SI', label: 'SI' }])}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'descripcion', row.descripcion, 'text')}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'proveedor_cliente', row.proveedor_cliente, 'text')}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'forma_pago', row.forma_pago, 'select', FORMAS_PAGO.map(f => ({ value: f, label: f })))}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'monto', row.monto, 'number')}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'fecha_programada', row.fecha_programada, 'date')}</td>
                <td className="border-r border-gray-200 h-10">{renderCell(tableKey, index, 'frecuencia', row.frecuencia, 'select', FRECUENCIAS.map(f => ({ value: f, label: f })))}</td>
                <td className="border-r border-gray-200 h-10 text-center">{renderCell(tableKey, index, 'pagado', row.pagado, 'checkbox')}</td>
                <td className="border-r border-gray-200 h-10">{row.pagado ? renderCell(tableKey, index, 'fecha_efectiva_pago', row.fecha_efectiva_pago, 'date') : <div className="px-2 py-2 text-gray-400">-</div>}</td>
                <td className="border-r border-gray-200 h-10">{row.frecuencia !== 'Único' ? renderCell(tableKey, index, 'fecha_inicial_serie', row.fecha_inicial_serie, 'date') : <div className="px-2 py-2 text-gray-400">-</div>}</td>
                <td className="h-10">
                  <div className="flex items-center gap-2">
                    {renderCell(tableKey, index, 'notas', row.notas, 'text')}
                    <button type="button" className="text-xs text-red-600" onClick={() => removeRow(mov, index)}>Eliminar</button>
                    {row.pagado && row.id && (
                      <button type="button" className="text-xs text-green-600" onClick={() => markPaid(mov, index)}>Mover a Historial</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 bg-gray-50 border-t flex justify-between">
          <button onClick={() => addRow(mov)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">+ Agregar Fila</button>
          <div className="space-x-2">
            <button onClick={() => saveProgramados(mov)} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{loading ? 'Guardando...' : 'Guardar Todo'}</button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistorialTable = (mov: Movimiento) => {
    const tableKey = mov === 'Ingreso' ? 'historial-ingresos' : 'historial-egresos';
    const rows = mov === 'Ingreso' ? histIngresos : histEgresos;
    const headerColor = mov === 'Ingreso' ? '#4ade80' : '#ef4444';

    const updateHistCell = (idx: number, column: keyof HistorialRow, value: any) => {
      if (mov === 'Ingreso') setHistIngresos(prev => { const copy = [...prev]; (copy[idx] as any)[column] = value; return copy; });
      else setHistEgresos(prev => { const copy = [...prev]; (copy[idx] as any)[column] = value; return copy; });
    };

    const saveHistorial = async () => {
      setLoading(true);
      setError(null);
      try {
        const arr = mov === 'Ingreso' ? histIngresos : histEgresos;
        for (const r of arr) {
          const payload = {
            scope_tipo: r.scope_tipo || null,
            descripcion: r.descripcion,
            proveedor_cliente: r.proveedor_cliente || null,
            forma_pago: r.forma_pago,
            monto: r.monto,
            fecha_programada: r.fecha_programada,
            fecha_efectiva_pago: r.fecha_efectiva_pago,
            notas: r.notas || null
          };
          const { error } = await supabase.from('financial_payments_history').update(payload).eq('id', r.id);
          if (error) throw error;
        }
        await loadData();
      } catch (e: any) {
        setError(e.message || 'Error guardando historial');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
        {error && <div className="p-3 text-sm text-red-700 bg-red-50 border-b border-red-200 whitespace-pre-wrap">{error}</div>}
        <table className="min-w-full table-auto">
          <thead style={{ backgroundColor: headerColor }} className="text-white sticky top-0 z-10">
            <tr>
              <HeaderCell className="border-r border-white/20">Fecha Efectiva</HeaderCell>
              <HeaderCell className="border-r border-white/20">TIPO</HeaderCell>
              <HeaderCell className="border-r border-white/20">Categoría</HeaderCell>
              <HeaderCell className="border-r border-white/20">Subcategoría</HeaderCell>
              <HeaderCell className="border-r border-white/20">FISCAL</HeaderCell>
              <HeaderCell className="border-r border-white/20">Descripción</HeaderCell>
              <HeaderCell className="border-r border-white/20">Proveedor/Cliente</HeaderCell>
              <HeaderCell className="border-r border-white/20">Forma de Pago</HeaderCell>
              <HeaderCell className="border-r border-white/20">Monto</HeaderCell>
              <HeaderCell className="border-r border-white/20">Fecha Programada</HeaderCell>
              <HeaderCell>Notas</HeaderCell>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="border-r border-gray-200 h-10">
                  {renderCell(tableKey, index, 'fecha_efectiva_pago', row.fecha_efectiva_pago, 'date')}
                </td>
                <td className="border-r border-gray-200 h-10">{mov}</td>
                <td className="border-r border-gray-200 h-10">{row.categoria_nombre || '-'}</td>
                <td className="border-r border-gray-200 h-10">{row.subcategoria_nombre || '-'}</td>
                <td className="border-r border-gray-200 h-10">{row.fiscal ? 'SI' : 'NO'}</td>
                <td className="border-r border-gray-200 h-10">
                  {renderCell(tableKey, index, 'descripcion', row.descripcion, 'text')}
                </td>
                <td className="border-r border-gray-200 h-10">
                  {renderCell(tableKey, index, 'proveedor_cliente', row.proveedor_cliente || '', 'text')}
                </td>
                <td className="border-r border-gray-200 h-10">
                  {renderCell(tableKey, index, 'forma_pago', row.forma_pago, 'select', FORMAS_PAGO.map(f => ({ value: f, label: f })))}
                </td>
                <td className="border-r border-gray-200 h-10">
                  {renderCell(tableKey, index, 'monto', row.monto, 'number')}
                </td>
                <td className="border-r border-gray-200 h-10">
                  {renderCell(tableKey, index, 'fecha_programada', row.fecha_programada, 'date')}
                </td>
                <td className="h-10">
                  {renderCell(tableKey, index, 'notas', row.notas || '', 'text')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button onClick={saveHistorial} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
        </div>
      </div>
    );
  };

  if (syncError) return <div className="text-red-600">{syncError}</div>;
  if (!ready) return <div className="text-gray-600">Cargando catálogos...</div>;

  return (
    <div className="space-y-6">
      {/* Navegación entre pestañas */}
      <div className="border-b border-gray-200 mb-2">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'ingresos' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('ingresos')}
          >
            📈 Ingresos
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'egresos' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('egresos')}
          >
            📉 Egresos
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'historial-ingresos' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('historial-ingresos')}
          >
            📊 Historial Ingresos
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'historial-egresos' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('historial-egresos')}
          >
            📊 Historial Egresos
          </button>
        </nav>
      </div>

      {activeTab === 'ingresos' && renderProgramadoTable('Ingreso')}
      {activeTab === 'egresos' && renderProgramadoTable('Egreso')}
      {activeTab === 'historial-ingresos' && renderHistorialTable('Ingreso')}
      {activeTab === 'historial-egresos' && renderHistorialTable('Egreso')}
    </div>
  );
};

