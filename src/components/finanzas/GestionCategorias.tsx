import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PencilSquareIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

type Categoria = { id: string; nombre: string; tipo: 'Ingreso' | 'Egreso'; activa: boolean; color?: string | null; subcategorias: Subcategoria[] };
type Subcategoria = { id: string; nombre: string; activa: boolean };

export const GestionCategorias: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [modalOpen, setModalOpen] = useState<null | { tipo: 'cat' | 'sub' | 'saldo'; categoriaId?: string }>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [formColor, setFormColor] = useState<string>('#4A90E2');
  const [formActiva, setFormActiva] = useState<boolean>(true);
  const [tipoSeleccion, setTipoSeleccion] = useState<'Egreso' | 'Ingreso'>('Egreso');
  const [editSub, setEditSub] = useState<null | { id: string; nombre: string }>(null);
  const [saldoInicial, setSaldoInicial] = useState('');
  const nombreInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const [order, setOrder] = useState<Record<string, number>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewIds, setPreviewIds] = useState<string[] | null>(null);

  const handleBackgroundClick = () => {
    if (expandedId) setExpandedId(null);
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

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (modalOpen?.tipo === 'cat') {
      // Enfocar el input cuando se abre el modal
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

  const openNewCategoria = () => { setFormNombre(''); setFormTipo('Egreso'); setFormColor('#4A90E2'); setFormActiva(true); setModalOpen({ tipo: 'cat' }); };
  const openNewSubcategoria = (categoriaId: string) => { setFormNombre(''); setModalOpen({ tipo: 'sub', categoriaId }); };
  const openSaldoInicial = () => { setSaldoInicial(''); setModalOpen({ tipo: 'saldo' }); };

  // Sin headers manuales: el cliente de Supabase adjunta Authorization/apikey automáticamente

  const handleSaveCategoria = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');
      if (!modalOpen) return;
      
      if (modalOpen.tipo === 'cat') {
        if (modalOpen.categoriaId) {
          const { error } = await supabase.functions.invoke('actualizar-categoria', {
            body: { id: modalOpen.categoriaId, nuevo_nombre: formNombre, color: formColor, esta_activa: formActiva }
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.functions.invoke('crear-categoria', {
            body: { nombre: formNombre, tipo: formTipo, color: formColor, activa: formActiva }
          });
          if (error) throw error;
        }
      } else if (modalOpen.tipo === 'sub') {
        const { error } = await supabase.functions.invoke('crear-subcategoria', {
          body: { nombre: formNombre, categoria_id: modalOpen.categoriaId }
        });
        if (error) throw error;
      } else if (modalOpen.tipo === 'saldo') {
        const { error } = await supabase
          .from('configuracion_global')
          .upsert({
            clave: 'saldo_inicial_caja',
            valor: saldoInicial,
            descripcion: 'Saldo inicial de caja para el dashboard financiero'
          });
        if (error) throw error;
      }
      
      setModalOpen(null);
      await load();
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  const handleInlineUpdateCategoria = async (id: string, changes: Partial<{ nombre: string; activa: boolean }>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('No autenticado'); return; }
    const { error } = await supabase.functions.invoke('actualizar-categoria', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { id, ...(changes.nombre !== undefined ? { nuevo_nombre: changes.nombre } : {}), ...(changes.activa !== undefined ? { esta_activa: changes.activa } : {}), ...(changes.color !== undefined ? { color: changes.color } : {}) }
    });
    if (error) { alert((error as any).message || 'Error actualizando'); return; }
    await load();
  };

  const handleInlineUpdateSubcategoria = async (id: string, changes: Partial<{ nombre: string; activa: boolean }>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('No autenticado'); return; }
    const { error } = await supabase.functions.invoke('actualizar-subcategoria', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { id, ...(changes.nombre !== undefined ? { nuevo_nombre: changes.nombre } : {}), ...(changes.activa !== undefined ? { esta_activa: changes.activa } : {}) }
    });
    if (error) { alert((error as any).message || 'Error actualizando'); return; }
    await load();
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

      {/* Segmented control tipo */}
      <div className="flex items-center">
        <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 p-1">
          <button
            onClick={() => setTipoSeleccion('Egreso')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${tipoSeleccion === 'Egreso' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
          >Egresos</button>
          <button
            onClick={() => setTipoSeleccion('Ingreso')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${tipoSeleccion === 'Ingreso' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
          >Ingresos</button>
        </div>
      </div>

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
            style={{ borderColor: hexToRgba(cat.color, 0.5) }}
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
                <span
                  className="inline-block rounded-md px-2 py-1 text-sm font-semibold truncate max-w-[220px]"
                  style={{ backgroundColor: cat.color || '#CBD5E1', color: getTextColorForBg(cat.color) }}
                  title={cat.nombre}
                >
                  {cat.nombre}
                </span>
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
                  <input type="checkbox" checked={!!cat.activa} disabled={!isExpanded} onChange={(e) => handleInlineUpdateCategoria(cat.id, { activa: e.target.checked })} />
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
                      onChange={(e) => handleInlineUpdateSubcategoria(sub.id, { nombre: e.target.value })}
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
                      <input 
                        type="color" 
                        className="mt-1 w-16 h-8 p-0 border border-gray-300 rounded"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                      />
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
                onClick={() => modalOpen?.tipo === 'cat' ? handleSaveCategoria() : handleSaveCategoria()}
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
                onChange={(e) => setEditSub({ ...editSub, nombre: e.target.value })}
              />
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={() => setEditSub(null)}>Cancelar</button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={async () => {
                  const nuevo = editSub.nombre.trim();
                  if (!nuevo) return;
                  await handleInlineUpdateSubcategoria(editSub.id, { nombre: nuevo });
                  setEditSub(null);
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


