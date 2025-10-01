import React, { useEffect, useRef, useState } from 'react';
import { PencilSquareIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import ColorChip from '@/components/ui/ColorChip';

type Categoria = { id: string; nombre: string; tipo: 'Ingreso' | 'Egreso'; activa: boolean; color?: string | null; subcategorias: Subcategoria[] };
type Subcategoria = { id: string; nombre: string; activa: boolean };

// NUEVO: Tipos para Métodos de Pago/Ingreso
type MetodoPagoCategoria = { id: string; nombre: string; tipo: 'Ingreso' | 'Egreso'; activa: boolean; color?: string | null; subcategorias: { id: string; nombre: string; activa: boolean }[] };

type Seccion = 'categorias' | 'metodos' | 'pc';

export const GestionCategorias: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Métodos de pago/ingreso - estado
  const [metCats, setMetCats] = useState<MetodoPagoCategoria[]>([]);
  const [loadingMetodos, setLoadingMetodos] = useState(false);
  const [errorMetodos, setErrorMetodos] = useState<string | null>(null);
  const [noTablaMetodos, setNoTablaMetodos] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<null | { tipo: 'cat' | 'sub' | 'saldo'; categoriaId?: string }>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [formColor, setFormColor] = useState<string>('#4A90E2');
  
  const [tipoSeleccion, setTipoSeleccion] = useState<'Egreso' | 'Ingreso'>('Egreso');
  const [editSub, setEditSub] = useState<null | { id: string; nombre: string }>(null);
  const [metModal, setMetModal] = useState<null | { tipo: 'met-cat' | 'met-sub'; categoriaId?: string; nombre: string }>(null);
  const [editMetodo, setEditMetodo] = useState<null | { id: string; nombre: string; color: string; activa: boolean }>(null);
  const [saldoInicial, setSaldoInicial] = useState('');
  const nombreInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const [order, setOrder] = useState<Record<string, number>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewIds, setPreviewIds] = useState<string[] | null>(null);

  // NUEVO: control de sección y tipo para métodos
  const [seccion, setSeccion] = useState<Seccion>('categorias');
  const [tipoMetodo, setTipoMetodo] = useState<'Egreso' | 'Ingreso'>('Egreso');
  // Proveedores/Clientes
  const [pcItems, setPcItems] = useState<Array<{ id: string; nombre: string; tipo?: 'Proveedor' | 'Cliente'; activa: boolean; color?: string | null; contacto?: string | null; telefono?: string | null; email?: string | null; ubicacion?: string | null; notas?: string | null }>>([]);
  const [tipoPC, setTipoPC] = useState<'Proveedor' | 'Cliente'>('Proveedor');
  const [loadingPC, setLoadingPC] = useState(false);
  const [errorPC, setErrorPC] = useState<string | null>(null);
  const [noTablaPC, setNoTablaPC] = useState<boolean>(false);
  const [pcModal, setPcModal] = useState<null | { nombre: string }>(null);
  const [pcDetails, setPcDetails] = useState<null | { id: string; nombre: string; contacto: string; telefono: string; email: string; ubicacion: string; notas: string }>(null);
  const [editPcId, setEditPcId] = useState<string | null>(null);

  const handleBackgroundClick = () => {
    if (expandedId) setExpandedId(null);
    if (editPcId) setEditPcId(null);
  };

  const getTextColorForBg = (hex?: string | null) => {
    const value = (hex || '#CBD5E1').replace('#','');
    const rgb = value.length === 3
      ? value.split('').map((c) => parseInt(c + c, 16))
      : [value.slice(0,2), value.slice(2,4), value.slice(4,6)].map((c) => parseInt(c, 16));
    const [r, g, b] = rgb as number[];
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > 0.6 ? '#111827' : '#FFFFFF';
  };

  const hexToRgba = (hex?: string | null, alpha = 0.35) => {
    const value = (hex || '#CBD5E1').replace('#','');
    const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
    const r = parseInt(full.slice(0,2), 16);
    const g = parseInt(full.slice(2,4), 16);
    const b = parseInt(full.slice(4,6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');
      const { data, error } = await supabase.functions.invoke('listar-configuracion-gastos', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {}
      });
      if (error) throw error;
      const cats: Categoria[] = (data as any)?.categorias || [];
      setCategorias(cats);
      setOrder(prev => {
        if (Object.keys(prev).length > 0) return prev;
        try {
          const stored = localStorage.getItem('catOrder');
          if (stored) return JSON.parse(stored);
        } catch {}
        const init: Record<string, number> = {};
        cats.forEach((c, i) => { init[c.id] = i; });
        return init;
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Carga de métodos de pago/ingreso
  const loadMetodos = async (tipo: 'Ingreso' | 'Egreso') => {
    setLoadingMetodos(true);
    setErrorMetodos(null);
    setNoTablaMetodos(false);
    try {
      const { data, error } = await supabase
        .from('metodos_pago_categorias')
        .select('id,nombre,tipo,activa,color,metodos_pago_subcategorias(id,nombre,activa)')
        .eq('tipo', tipo)
        .order('nombre', { ascending: true });
      if (error) throw error;
      const mapped: MetodoPagoCategoria[] = (data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        activa: !!c.activa,
        color: c.color,
        subcategorias: (c.metodos_pago_subcategorias || []).map((s: any) => ({ id: s.id, nombre: s.nombre, activa: !!s.activa }))
      }));
      setMetCats(mapped);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setErrorMetodos(msg);
      if (msg.toLowerCase().includes('metodos_pago_categorias')) setNoTablaMetodos(true);
    } finally {
      setLoadingMetodos(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (seccion === 'metodos') loadMetodos(tipoMetodo);
    if (seccion === 'pc') loadPC(tipoPC);
  }, [seccion, tipoMetodo, tipoPC]);

  useEffect(() => {
    if (modalOpen?.tipo === 'cat') {
      setTimeout(() => nombreInputRef.current?.focus(), 0);
    }
  }, [modalOpen]);

  const commitOrder = (ids: string[]) => {
    const next: Record<string, number> = {};
    ids.forEach((id, idx) => { next[id] = idx; });
    setOrder(next);
    try { localStorage.setItem('catOrder', JSON.stringify(next)); } catch {}
  };

  const onDragStart = (id: string, scopeIds: string[]) => {
    dragIdRef.current = id;
    setDraggingId(id);
    setPreviewIds(scopeIds);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDragEnter = (targetId: string, scopeIds: string[]) => {
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;
    const current = previewIds ?? scopeIds;
    const arr = [...current];
    const from = arr.indexOf(sourceId);
    const to = arr.indexOf(targetId);
    if (from === -1 || to === -1) return;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    setPreviewIds(arr);
  };
  const onDropOn = () => {
    if (previewIds) commitOrder(previewIds);
    setDraggingId(null);
    setPreviewIds(null);
    dragIdRef.current = null;
  };

  const openNewCategoria = () => { setFormNombre(''); setFormTipo('Egreso'); setFormColor('#4A90E2'); setModalOpen({ tipo: 'cat' }); };
  const openNewSubcategoria = (categoriaId: string) => { setFormNombre(''); setModalOpen({ tipo: 'sub', categoriaId }); };
  const openSaldoInicial = () => { setSaldoInicial(''); setModalOpen({ tipo: 'saldo' }); };

  // Métodos - CRUD
  const crearMetodo = async (nombre: string) => {
    try {
      const color = '#4A90E2';
      const { error } = await supabase
        .from('metodos_pago_categorias')
        .insert({ nombre, tipo: tipoMetodo, activa: true, color });
      if (error) throw error;
      await loadMetodos(tipoMetodo);
    } catch (e: any) {
      alert(e.message || 'Error creando método');
    }
  };

  // Proveedores/Clientes CRUD
  const loadPC = async (tipo: 'Proveedor' | 'Cliente') => {
    setLoadingPC(true);
    setErrorPC(null);
    setNoTablaPC(false);
    try {
      const tableName = tipo === 'Proveedor' ? 'proveedores' : 'clientes';
      const { data, error } = await supabase
        .from(tableName)
        .select('id,nombre,color,activa,contacto,telefono,email,ubicacion,notas')
        .order('nombre');
      if (error) throw error;
      setPcItems((data || []) as any);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error('loadPC error:', e);
      setErrorPC(msg);
      // Solo marcar como "tabla no existe" si es error de tabla indefinida 42P01
      const code = e?.code || e?.details || '';
      if (String(code).includes('42P01') || /relation .* does not exist/i.test(msg)) {
        setNoTablaPC(true);
      }
    } finally {
      setLoadingPC(false);
    }
  };

  const crearPC = async (nombre: string) => {
    try {
      const tableName = tipoPC === 'Proveedor' ? 'proveedores' : 'clientes';
      const insertData: any = { nombre, color: '#64748b', activa: true };
      const { error } = await supabase
        .from(tableName)
        .insert(insertData);
      if (error) throw error;
      await loadPC(tipoPC);
    } catch (e: any) {
      alert(e.message || 'Error creando proveedor/cliente');
    }
  };

  const actualizarPC = async (id: string, changes: Partial<{ nombre: string; activa: boolean; color: string }>) => {
    try {
      const tableName = tipoPC === 'Proveedor' ? 'proveedores' : 'clientes';
      let { error } = await supabase
        .from(tableName)
        .update(changes as any)
        .eq('id', id);
      if (error) throw error;
      // Optimistic update para no cerrar edición
      setPcItems(prev => prev.map(it => it.id === id ? ({ ...it, ...changes }) as any : it));
    } catch (e: any) {
      alert(e.message || 'Error actualizando');
    }
  };

  const eliminarPC = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      const tableName = tipoPC === 'Proveedor' ? 'proveedores' : 'clientes';
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      await loadPC(tipoPC);
    } catch (e: any) {
      alert(e.message || 'Error eliminando');
    }
  };

  const actualizarMetodo = async (id: string, changes: Partial<{ nombre: string; activa: boolean; color: string }>) => {
    try {
      const { error } = await supabase
        .from('metodos_pago_categorias')
        .update(changes as any)
        .eq('id', id);
      if (error) throw error;
      await loadMetodos(tipoMetodo);
    } catch (e: any) {
      alert(e.message || 'Error actualizando');
    }
  };

  const eliminarMetodo = async (id: string) => {
    if (!confirm('¿Eliminar este método?')) return;
    try {
      const { error } = await supabase.from('metodos_pago_categorias').delete().eq('id', id);
      if (error) throw error;
      await loadMetodos(tipoMetodo);
    } catch (e: any) {
      alert(e.message || 'Error eliminando');
    }
  };

  // Subcategorías de métodos
  const crearMetodoSub = async (categoriaId: string, nombre: string) => {
    try {
      const { error } = await supabase
        .from('metodos_pago_subcategorias')
        .insert({ categoria_id: categoriaId, nombre, activa: true });
      if (error) throw error;
      await loadMetodos(tipoMetodo);
    } catch (e: any) {
      alert(e.message || 'Error creando subcategoría');
    }
  };

  const actualizarMetodoSub = async (id: string, changes: Partial<{ nombre: string; activa: boolean }>) => {
    try {
      const { error } = await supabase
        .from('metodos_pago_subcategorias')
        .update(changes as any)
        .eq('id', id);
      if (error) throw error;
      await loadMetodos(tipoMetodo);
    } catch (e: any) {
      alert(e.message || 'Error actualizando subcategoría');
    }
  };

  const eliminarMetodoSub = async (id: string) => {
    if (!confirm('¿Eliminar esta subcategoría?')) return;
    try {
      const { error } = await supabase.from('metodos_pago_subcategorias').delete().eq('id', id);
      if (error) throw error;
      await loadMetodos(tipoMetodo);
    } catch (e: any) {
      alert(e.message || 'Error eliminando subcategoría');
    }
  };

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4 space-y-6" onClick={handleBackgroundClick}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Gestión de Categorías</h2>
        <div className="flex gap-2">
          <button onClick={openSaldoInicial} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors">
            💰 Saldo Inicial
          </button>
          <button onClick={openNewCategoria} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            + Añadir Categoría
          </button>
        </div>
      </div>

      {/* Selectores dobles: Categorías / Métodos */}
      <div className="flex items-start gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Categorías</span>
          <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 p-1">
            <button
              onClick={() => { setSeccion('categorias'); setTipoSeleccion('Egreso'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${seccion === 'categorias' && tipoSeleccion === 'Egreso' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >Egresos</button>
            <button
              onClick={() => { setSeccion('categorias'); setTipoSeleccion('Ingreso'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${seccion === 'categorias' && tipoSeleccion === 'Ingreso' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >Ingresos</button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Método de pago</span>
          <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 p-1">
            <button
              onClick={() => { setSeccion('metodos'); setTipoMetodo('Egreso'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${seccion === 'metodos' && tipoMetodo === 'Egreso' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >Egresos</button>
            <button
              onClick={() => { setSeccion('metodos'); setTipoMetodo('Ingreso'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${seccion === 'metodos' && tipoMetodo === 'Ingreso' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >Ingresos</button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Prov/Cliente</span>
          <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 p-1">
            <button
              onClick={() => { setSeccion('pc'); setTipoPC('Proveedor'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${seccion === 'pc' && tipoPC === 'Proveedor' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >Proveedores</button>
            <button
              onClick={() => { setSeccion('pc'); setTipoPC('Cliente'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${seccion === 'pc' && tipoPC === 'Cliente' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >Clientes</button>
          </div>
        </div>
      </div>

      {/* Sección dinámica */}
      {seccion === 'categorias' ? (
        <>
          {/* Grid de categorías */}
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }}>
            <div className="hidden sm:grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem' }} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {(previewIds
              ? previewIds.map(id => categorias.find(c => c.id === id)).filter((x): x is Categoria => !!x)
              : categorias
                  .filter(c => c.tipo === tipoSeleccion)
                  .sort((a,b) => (order[a.id] ?? 0) - (order[b.id] ?? 0)))
              .map(cat => {
              const isExpanded = expandedId === cat.id;
              return (
              <div
                key={cat.id}
                className="bg-white rounded-xl shadow-sm border p-4 overflow-hidden relative"
                onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : cat.id); }}
                onDragOver={onDragOver}
                onDragEnter={() => onDragEnter(cat.id, categorias.filter(c => c.tipo === tipoSeleccion).sort((a,b) => (order[a.id] ?? 0) - (order[b.id] ?? 0)).map(c => c.id))}
                onDrop={onDropOn}
                style={draggingId === cat.id ? { opacity: 0.6, transform: 'scale(0.98)', borderColor: hexToRgba(cat.color, 0.8) } as any : { borderColor: hexToRgba(cat.color, 0.5) }}
              >
                {/* Header tarjeta */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                    className="flex items-center gap-2 min-w-0 hover:opacity-90 focus:outline-none"
                  >
                    <ColorChip label={cat.nombre} colorHex={cat.color || '#CBD5E1'} className="max-w-[220px]" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 cursor-grab active:cursor-grabbing" title="Arrastra para reordenar" draggable onDragStart={() => onDragStart(cat.id, categorias.filter(c => c.tipo === tipoSeleccion).sort((a,b) => (order[a.id] ?? 0) - (order[b.id] ?? 0)).map(c => c.id))} onClick={(e) => e.stopPropagation()}>
                      <Bars3Icon className="h-5 w-5" />
                    </span>
                    {isExpanded && (
                      <button
                        type="button"
                        title="Editar categoría"
                        className="text-gray-500 hover:text-blue-600"
                        onClick={(e) => { e.stopPropagation(); setFormNombre(cat.nombre); setFormTipo(cat.tipo); setFormColor(cat.color || '#4A90E2'); setModalOpen({ tipo: 'cat', categoriaId: cat.id }); }}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    )}
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={!!cat.activa} disabled={!isExpanded} onChange={async (e) => {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) { alert('No autenticado'); return; }
                        try {
                          const { error } = await supabase.functions.invoke('actualizar-categoria', {
                            headers: { Authorization: `Bearer ${session.access_token}` },
                            body: { id: cat.id, activa: e.target.checked }
                          });
                          if (error) throw error;
                          await load();
                        } catch (err: any) {
                          alert(err?.message || 'Error actualizando');
                        }
                      }} />
                      Activa
                    </label>
                  </div>
                </div>

                {/* Lista de subcategorías */}
                <div className={`space-y-2 text-sm text-gray-700 ${isExpanded ? '' : 'max-h-40 overflow-y-auto pr-1'}`}
                     onClick={(e) => e.stopPropagation()}>
                  {cat.subcategorias.map(sub => (
                    <div key={sub.id} className="flex items-center w-full min-w-0 justify-between">
                      {isExpanded ? (
                        <input
                          className="flex-1 bg-white border border-gray-200 rounded-md px-2 py-1 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none min-w-0"
                          value={sub.nombre}
                          onChange={async (e) => {
                            const nuevo = e.target.value;
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              if (!session) throw new Error('No autenticado');
                              const { error } = await supabase.functions.invoke('actualizar-subcategoria', {
                                headers: { Authorization: `Bearer ${session.access_token}` },
                                body: { id: sub.id, nombre: nuevo }
                              });
                              if (error) throw error;
                            } catch (err: any) {
                              console.error(err);
                            }
                          }}
                        />
                      ) : (
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 select-none truncate">
                          {sub.nombre}
                        </div>
                      )}
                      {isExpanded ? (
                        <div className="flex items-center gap-2 ml-2 text-gray-500 shrink-0">
                          <button
                            type="button"
                            title="Editar subcategoría"
                            onClick={() => setEditSub({ id: sub.id, nombre: sub.nombre })}
                            className="hover:text-blue-600"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar subcategoría"
                            onClick={async () => {
                              if (!confirm('¿Eliminar esta subcategoría?')) return;
                              const { data: { session } } = await supabase.auth.getSession();
                              if (!session) { alert('No autenticado'); return; }
                              const { error } = await supabase.functions.invoke('eliminar-subcategoria', {
                                headers: { Authorization: `Bearer ${session.access_token}` },
                                body: { id: sub.id }
                              });
                              if (error) { alert('Error eliminando'); return; }
                              await load();
                            }}
                            className="hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-6 ml-2" />
                      )}
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openNewSubcategoria(cat.id)} className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">+ Añadir Subcategoría</button>
                  </div>
                )}
              </div>
            );})}
          </div>
        </>
      ) : seccion === 'metodos' ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {noTablaMetodos ? (
            <div className="bg-white rounded-xl shadow-sm border p-4 text-sm text-gray-600">
              La tabla "metodos_pago_categorias" no existe aún. Ejecuta el SQL de creación de catálogo de métodos con categorías y subcategorías.
            </div>
          ) : loadingMetodos ? (
            <div className="text-sm text-gray-600">Cargando métodos…</div>
          ) : errorMetodos ? (
            <div className="text-sm text-red-600">{errorMetodos}</div>
          ) : (
            metCats.map(cat => {
              const isExpanded = expandedId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl shadow-sm border p-4 overflow-hidden relative"
                  style={{ borderColor: hexToRgba(cat.color, 0.5) }}
                  onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : cat.id); }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                      className="flex items-center gap-2 min-w-0 hover:opacity-90 focus:outline-none"
                    >
                      <ColorChip label={cat.nombre} colorHex={cat.color || '#CBD5E1'} className="max-w-[220px]" />
                    </button>
                    <div className="flex items-center gap-2">
                      {isExpanded && (
                        <>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-blue-600"
                            title="Editar método"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditMetodo({ id: cat.id, nombre: cat.nombre, color: cat.color || '#4A90E2', activa: !!cat.activa });
                            }}
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <label className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <input type="checkbox" checked={!!cat.activa} onChange={(e) => actualizarMetodo(cat.id, { activa: e.target.checked })} />
                            Activa
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        title="Eliminar categoría"
                        className="text-gray-500 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); eliminarMetodo(cat.id); }}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de subcategorías */}
                  <div className={`space-y-2 text-sm text-gray-700 ${isExpanded ? '' : 'max-h-40 overflow-y-auto pr-1'}`}
                       onClick={(e) => e.stopPropagation()}>
                    {cat.subcategorias.map(sub => (
                      <div key={sub.id} className="flex items-center w-full min-w-0 justify-between">
                        {isExpanded ? (
                          <input
                            className="flex-1 bg-white border border-gray-200 rounded-md px-2 py-1 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none min-w-0"
                            value={sub.nombre}
                            onChange={(e) => actualizarMetodoSub(sub.id, { nombre: e.target.value })}
                          />
                        ) : (
                          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 select-none truncate">
                            {sub.nombre}
                          </div>
                        )}
                        {isExpanded ? (
                          <div className="flex items-center gap-2 ml-2 text-gray-500 shrink-0">
                            <label className="inline-flex items-center gap-1 text-xs text-gray-600">
                              <input type="checkbox" checked={!!sub.activa} onChange={(e) => actualizarMetodoSub(sub.id, { activa: e.target.checked })} />
                              Activa
                            </label>
                            <button className="hover:text-red-600" title="Eliminar subcategoría" onClick={() => eliminarMetodoSub(sub.id)}>
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-6 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>

                  {isExpanded && (
                    <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setMetModal({ tipo: 'met-sub', categoriaId: cat.id, nombre: '' })} className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">+ Añadir Subcategoría</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {/* Botón para añadir categoría de método */}
          <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-center">
            <button
              type="button"
              className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              onClick={() => setMetModal({ tipo: 'met-cat', nombre: '' })}
            >
              + Añadir Categoría
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {noTablaPC ? (
            <div className="bg-white rounded-xl shadow-sm border p-4 text-sm text-gray-600">La tabla "{tipoPC === 'Proveedor' ? 'proveedores' : 'clientes'}" no existe.</div>
          ) : loadingPC ? (
            <div className="text-sm text-gray-600">Cargando…</div>
          ) : errorPC ? (
            <div className="text-sm text-red-600">{errorPC}</div>
          ) : (
            pcItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border p-4 overflow-hidden relative cursor-pointer"
                style={{ borderColor: hexToRgba(item.color, 0.5) }}
                data-pc-card={item.id}
                onClick={(e) => { e.stopPropagation(); setEditPcId(item.id); }}
              >
                <div className="flex items-center justify-between mb-3">
                  <ColorChip label={item.nombre} colorHex={item.color || '#CBD5E1'} className="max-w-[220px]" />
                  {editPcId === item.id && (
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-6 h-6 p-0 border border-gray-300 rounded" value={item.color || '#64748b'} onChange={async (e) => {
                      try { await actualizarPC(item.id, { color: e.target.value }); }
                      catch { /* si no existe columna color, ignorar */ }
                    }} />
                    <label className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={!!item.activa} onChange={(e) => actualizarPC(item.id, { activa: e.target.checked })} />
                      Activa
                    </label>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-blue-600 text-xs px-2 py-1 border rounded"
                      onClick={() => setPcDetails({
                        id: item.id,
                        nombre: item.nombre,
                        contacto: item.contacto || '',
                        telefono: item.telefono || '',
                        email: item.email || '',
                        ubicacion: item.ubicacion || '',
                        notas: item.notas || ''
                      })}
                    >
                      Detalles
                    </button>
                    <button type="button" title="Eliminar" className="text-gray-500 hover:text-red-600" onClick={() => eliminarPC(item.id)}>
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  )}
                </div>
                {editPcId === item.id ? (
                  <input
                    className="w-full bg-white border border-blue-300 rounded-md px-2 py-1 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none min-w-0"
                    value={item.nombre}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => actualizarPC(item.id, { nombre: e.target.value })}
                    onBlur={() => {
                      // Cerrar solo si el foco se fue fuera de esta tarjeta
                      setTimeout(() => {
                        const activeEl = document.activeElement as HTMLElement | null;
                        const stillInside = activeEl && activeEl.closest && activeEl.closest(`[data-pc-card="${item.id}"]`);
                        if (!stillInside) setEditPcId(null);
                      }, 0);
                    }}
                  />
                ) : null}
              </div>
            ))
          )}
          <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-center">
            <button type="button" className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={() => setPcModal({ nombre: '' })}>+ Añadir</button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] space-y-4" onClick={(e) => e.stopPropagation()} tabIndex={0}>
            <h4 className="text-lg font-semibold text-gray-900">
              {modalOpen.tipo === 'cat' 
                ? (modalOpen.categoriaId ? 'Editar Categoría' : 'Nueva Categoría') 
                : modalOpen.tipo === 'sub' 
                  ? 'Nueva Subcategoría' 
                  : 'Configurar Saldo Inicial'}
            </h4>
            
            {modalOpen.tipo === 'saldo' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <span className="text-xl">💰</span>
                    <span className="font-medium">Saldo Inicial de Caja</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Este valor se usará como base para calcular el dinero actual disponible en el dashboard.
                  </p>
                </div>
                <label className="block text-sm font-medium text-gray-700">
                  Monto inicial (MXN)
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={saldoInicial} 
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    placeholder="0.00"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                  <input 
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    ref={nombreInputRef}
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)} 
                  />
                </label>
                {modalOpen.tipo === 'cat' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo
                      <select 
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        value={formTipo}
                        disabled={!!modalOpen.categoriaId}
                        onChange={(e) => setFormTipo(e.target.value as any)}
                      >
                        <option value="Egreso">Egreso</option>
                        <option value="Ingreso">Ingreso</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Color
                      <div className="mt-1 flex items-center gap-2">
                        <ColorChip variant="background-only" colorHex={formColor} className="w-8 h-8 rounded-full border border-gray-300" />
                        <span className="text-xs text-gray-600">{formColor}</span>
                        <input 
                          type="color" 
                          className="w-16 h-8 p-0 border border-gray-300 rounded"
                          value={formColor}
                          onChange={(e) => setFormColor(e.target.value)}
                        />
                      </div>
                    </label>
                  </>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors" 
                onClick={() => setModalOpen(null)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium" 
                onClick={async () => {
                  if (modalOpen?.tipo === 'cat') {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) { alert('No autenticado'); return; }
                    const isEdit = !!modalOpen.categoriaId;
                    try {
                      const { error } = await supabase.functions.invoke(isEdit ? 'actualizar-categoria' : 'crear-categoria', {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        body: isEdit ? { id: modalOpen.categoriaId, nombre: formNombre, color: formColor } : { nombre: formNombre, tipo: formTipo, color: formColor }
                      });
                      if (error) throw error;
                      await load();
                      setModalOpen(null);
                    } catch (e: any) {
                      alert(e.message || 'Error guardando');
                    }
                  } else if (modalOpen?.tipo === 'sub') {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) { alert('No autenticado'); return; }
                    try {
                      const { error } = await supabase.functions.invoke('crear-subcategoria', {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        body: { categoria_id: modalOpen.categoriaId, nombre: formNombre }
                      });
                      if (error) throw error;
                      await load();
                      setModalOpen(null);
                    } catch (e: any) {
                      alert(e.message || 'Error guardando subcategoría');
                    }
                  }
                }}
              >
                {modalOpen.tipo === 'saldo' ? 'Guardar Saldo' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar subcategoría */}
      {editSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[380px] space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Editar Subcategoría</h4>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={editSub.nombre}
                onChange={(e) => setEditSub({ id: editSub.id, nombre: e.target.value })}
              />
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={() => setEditSub(null)}>Cancelar</button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={async () => {
                  const nuevo = editSub.nombre.trim();
                  if (!nuevo) return;
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error('No autenticado');
                    const { error } = await supabase.functions.invoke('actualizar-subcategoria', {
                      headers: { Authorization: `Bearer ${session.access_token}` },
                      body: { id: editSub.id, nombre: nuevo }
                    });
                    if (error) throw error;
                    await load();
                  } catch (e: any) {
                    alert(e.message || 'Error guardando');
                  }
                  setEditSub(null);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear método (categoría/subcategoría) */}
      {metModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[380px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold text-gray-900">
              {metModal.tipo === 'met-cat' ? 'Nueva Categoría de Método' : 'Nueva Subcategoría de Método'}
            </h4>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={metModal.nombre}
                onChange={(e) => setMetModal({ ...metModal, nombre: e.target.value })}
                placeholder={metModal.tipo === 'met-cat' ? 'p. ej. Tarjeta de crédito' : 'p. ej. TDC Costco ...'}
              />
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={() => setMetModal(null)}>Cancelar</button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={async () => {
                  const nombre = (metModal.nombre || '').trim();
                  if (!nombre) return;
                  if (metModal.tipo === 'met-cat') {
                    await crearMetodo(nombre);
                  } else if (metModal.tipo === 'met-sub' && metModal.categoriaId) {
                    await crearMetodoSub(metModal.categoriaId, nombre);
                  }
                  setMetModal(null);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {pcModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[380px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold text-gray-900">Nuevo {tipoPC === 'Proveedor' ? 'Proveedor' : 'Cliente'}</h4>
            <label className="block text-sm font-medium text-gray-700">Nombre
              <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={pcModal.nombre} onChange={(e) => setPcModal({ nombre: e.target.value })} placeholder={tipoPC === 'Proveedor' ? 'p. ej. Costco' : 'p. ej. Cliente X'} />
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={() => setPcModal(null)}>Cancelar</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={async () => { const nombre = (pcModal.nombre || '').trim(); if (!nombre) return; await crearPC(nombre); setPcModal(null); }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {pcDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[480px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold text-gray-900">Detalles de {pcDetails.nombre}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700">Contacto
                <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={pcDetails.contacto} onChange={(e) => setPcDetails({ ...pcDetails, contacto: e.target.value })} />
              </label>
              <label className="block text-sm font-medium text-gray-700">Teléfono
                <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={pcDetails.telefono} onChange={(e) => setPcDetails({ ...pcDetails, telefono: e.target.value })} />
              </label>
              <label className="block text-sm font-medium text-gray-700">Email
                <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={pcDetails.email} onChange={(e) => setPcDetails({ ...pcDetails, email: e.target.value })} />
              </label>
              <label className="block text-sm font-medium text-gray-700">Ubicación
                <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={pcDetails.ubicacion} onChange={(e) => setPcDetails({ ...pcDetails, ubicacion: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm font-medium text-gray-700">Notas
              <textarea className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} value={pcDetails.notas} onChange={(e) => setPcDetails({ ...pcDetails, notas: e.target.value })}></textarea>
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={() => setPcDetails(null)}>Cancelar</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={async () => {
                await actualizarPC(pcDetails.id, {
                  contacto: pcDetails.contacto || null as any,
                  telefono: pcDetails.telefono || null as any,
                  email: pcDetails.email || null as any,
                  ubicacion: pcDetails.ubicacion || null as any,
                  notas: pcDetails.notas || null as any,
                } as any);
                setPcDetails(null);
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar método (nombre, color, activa) */}
      {editMetodo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold text-gray-900">Editar Método</h4>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={editMetodo.nombre}
                onChange={(e) => setEditMetodo({ ...editMetodo, nombre: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Color
              <div className="mt-1 flex items-center gap-2">
                <ColorChip variant="background-only" colorHex={editMetodo.color} className="w-8 h-8 rounded-full border border-gray-300" />
                <span className="text-xs text-gray-600">{editMetodo.color}</span>
                <input
                  type="color"
                  className="w-16 h-8 p-0 border border-gray-300 rounded"
                  value={editMetodo.color}
                  onChange={(e) => setEditMetodo({ ...editMetodo, color: e.target.value })}
                />
              </div>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!editMetodo.activa}
                onChange={(e) => setEditMetodo({ ...editMetodo, activa: e.target.checked })}
              />
              Activa
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={() => setEditMetodo(null)}>Cancelar</button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={async () => {
                  const nombre = editMetodo.nombre.trim();
                  if (!nombre) return;
                  await actualizarMetodo(editMetodo.id, { nombre, color: editMetodo.color, activa: editMetodo.activa });
                  setEditMetodo(null);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


