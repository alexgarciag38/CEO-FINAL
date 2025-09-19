import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Option { id: string; nombre: string }

type Tipo = 'Ingreso' | 'Egreso' | 'Transferencia';

type FormaPago = 'Efectivo' | 'Transferencia' | 'Cheque' | 'Tarjeta';

type Frecuencia = 'Único' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';

export const PaymentsForm: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<Tipo | ''>('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [subcategoriaId, setSubcategoriaId] = useState<string>('');
  const [fiscal, setFiscal] = useState<'true' | 'false'>('false');
  const [descripcion, setDescripcion] = useState('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [formaPago, setFormaPago] = useState<FormaPago | ''>('');
  const [monto, setMonto] = useState<number | ''>('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('Único');
  const [pagado, setPagado] = useState(false);
  const [fechaEfectivaPago, setFechaEfectivaPago] = useState('');
  const [fechaInicialSerie, setFechaInicialSerie] = useState('');
  const [notas, setNotas] = useState('');

  const [categorias, setCategorias] = useState<Option[]>([]);
  const [subcategorias, setSubcategorias] = useState<Option[]>([]);
  const [proveedores, setProveedores] = useState<Option[]>([]);

  const validar = (): string | null => {
    if (!tipo) return 'El tipo es requerido';
    if (!categoriaId) return 'La categoría es requerida';
    if (!descripcion || descripcion.length < 10) return 'La descripción debe tener al menos 10 caracteres';
    if (!formaPago) return 'La forma de pago es requerida';
    if (!monto || Number(monto) <= 0) return 'El monto debe ser mayor a 0';
    if (!fechaProgramada) return 'La fecha programada es requerida';
    if (pagado && !fechaEfectivaPago) return 'Si está pagado, la fecha efectiva es obligatoria';
    if (frecuencia !== 'Único' && !fechaInicialSerie) return 'Si es recurrente, la fecha inicial de serie es obligatoria';
    return null;
  };

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: cats }, { data: provs }] = await Promise.all([
          supabase.from('categorias_financieras').select('id,nombre').order('nombre', { ascending: true }),
          supabase.from('proveedores').select('id,nombre').order('nombre', { ascending: true })
        ]);
        setCategorias(cats || []);
        setProveedores(provs || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    const cargarSubs = async () => {
      if (!categoriaId) { setSubcategorias([]); return; }
      const { data } = await supabase.from('subcategorias_financieras').select('id,nombre').eq('categoria_id', categoriaId).order('nombre', { ascending: true });
      setSubcategorias(data || []);
    };
    cargarSubs();
  }, [categoriaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validar();
    if (msg) { setError(msg); return; }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        tipo, categoria_id: categoriaId || null, subcategoria_id: subcategoriaId || null,
        fiscal: fiscal === 'true', descripcion, proveedor_id: proveedorId || null,
        forma_pago: formaPago, monto: Number(monto), fecha_programada: fechaProgramada,
        frecuencia, pagado, fecha_efectiva_pago: pagado ? fechaEfectivaPago : null,
        fecha_inicial_serie: frecuencia !== 'Único' ? fechaInicialSerie : null,
        notas: notas || null
      };
      const { error } = await supabase.from('financial_payments').insert(payload);
      if (error) throw error;
      if (onSaved) onSaved();
      // Reset básico
      setTipo(''); setCategoriaId(''); setSubcategoriaId(''); setFiscal('false'); setDescripcion('');
      setProveedorId(''); setFormaPago(''); setMonto(''); setFechaProgramada(''); setFrecuencia('Único');
      setPagado(false); setFechaEfectivaPago(''); setFechaInicialSerie(''); setNotas('');
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white rounded-lg shadow">
      {error && <div className="md:col-span-3 text-sm text-red-600">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={tipo} onChange={(e)=>setTipo(e.target.value as Tipo)} required>
          <option value="">Seleccionar...</option>
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
          <option value="Transferencia">Transferencia</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={categoriaId} onChange={(e)=>setCategoriaId(e.target.value)} required>
          <option value="">Seleccionar...</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoría</label>
        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={subcategoriaId} onChange={(e)=>setSubcategoriaId(e.target.value)}>
          <option value="">Seleccionar...</option>
          {subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fiscal</label>
        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={fiscal} onChange={(e)=>setFiscal(e.target.value as any)}>
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
        <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={2} maxLength={500} value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
        <div className="flex gap-2">
          <select className="flex-1 border border-gray-300 rounded-md px-3 py-2" value={proveedorId} onChange={(e)=>setProveedorId(e.target.value)}>
            <option value="">Seleccionar...</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          {/* TODO: modal nuevo proveedor */}
          <button type="button" className="px-3 py-2 bg-blue-500 text-white rounded-md" onClick={()=>alert('Crear proveedor: pendiente')}>+</button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pago *</label>
        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={formaPago} onChange={(e)=>setFormaPago(e.target.value as FormaPago)} required>
          <option value="">Seleccionar...</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Cheque">Cheque</option>
          <option value="Tarjeta">Tarjeta</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Monto *</label>
        <input type="number" step="0.01" min="0.01" className="w-full border border-gray-300 rounded-md px-3 py-2" value={monto} onChange={(e)=>setMonto(e.target.value ? Number(e.target.value) : '')} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Programada *</label>
        <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" value={fechaProgramada} onChange={(e)=>setFechaProgramada(e.target.value)} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={frecuencia} onChange={(e)=>setFrecuencia(e.target.value as Frecuencia)}>
          <option value="Único">Único</option>
          <option value="Semanal">Semanal</option>
          <option value="Quincenal">Quincenal</option>
          <option value="Mensual">Mensual</option>
          <option value="Anual">Anual</option>
        </select>
      </div>

      <div className="flex items-center">
        <input type="checkbox" id="pagado" className="mr-2" checked={pagado} onChange={(e)=>setPagado(e.target.checked)} />
        <label htmlFor="pagado" className="text-sm font-medium text-gray-700">¿Pagado?</label>
      </div>

      {pagado && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Efectiva Pago</label>
          <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" value={fechaEfectivaPago} onChange={(e)=>setFechaEfectivaPago(e.target.value)} />
        </div>
      )}

      {frecuencia !== 'Único' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicial Serie</label>
          <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" value={fechaInicialSerie} onChange={(e)=>setFechaInicialSerie(e.target.value)} />
        </div>
      )}

      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
        <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} value={notas} onChange={(e)=>setNotas(e.target.value)} />
      </div>

      <div className="md:col-span-3 flex justify-end gap-4 pt-4">
        <button type="button" className="px-6 py-2 border border-gray-300 rounded-md text-gray-700" onClick={()=>onSaved && onSaved()}>Cancelar</button>
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Pago'}
        </button>
      </div>
    </form>
  );
};