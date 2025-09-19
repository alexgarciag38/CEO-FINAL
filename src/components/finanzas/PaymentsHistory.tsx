import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface HistoryRow {
  id: string;
  pago_programado_id: string | null;
  usuario_id: string;
  tipo: 'Ingreso' | 'Egreso' | 'Transferencia';
  categoria_id: string;
  subcategoria_id: string | null;
  fiscal: boolean;
  descripcion: string;
  proveedor_id: string | null;
  forma_pago: 'Efectivo' | 'Transferencia' | 'Cheque' | 'Tarjeta';
  monto: number;
  fecha_programada: string; // date
  fecha_efectiva_pago: string; // date
  frecuencia: 'Único' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual' | null;
  notas: string | null;
  moved_at: string; // timestamp
}

interface Option { id: string; nombre: string }

export const PaymentsHistory: React.FC = () => {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [proveedores, setProveedores] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [fTipo, setFTipo] = useState('');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [fCategoria, setFCategoria] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const loadCatalogs = async () => {
      const [{ data: cats }, { data: provs }] = await Promise.all([
        supabase.from('categorias_financieras').select('id,nombre').order('nombre', { ascending: true }),
        supabase.from('proveedores').select('id,nombre').order('nombre', { ascending: true }),
      ]);
      setCategorias((cats || []) as any);
      setProveedores((provs || []) as any);
    };
    loadCatalogs();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('financial_payments_history').select('*').order('fecha_efectiva_pago', { ascending: false });
      if (fTipo) query = query.eq('tipo', fTipo);
      if (fCategoria) query = query.eq('categoria_id', fCategoria);
      if (fDesde) query = query.gte('fecha_efectiva_pago', fDesde);
      if (fHasta) query = query.lte('fecha_efectiva_pago', fHasta);
      const { data, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw error;
      setRows((data || []) as HistoryRow[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const catMap = useMemo(() => new Map(categorias.map(c => [c.id, c.nombre])), [categorias]);
  const provMap = useMemo(() => new Map(proveedores.map(p => [p.id, p.nombre])), [proveedores]);

  const totalIngresos = rows.filter(r => r.tipo === 'Ingreso').reduce((s, r) => s + (r.monto || 0), 0);
  const totalEgresos = rows.filter(r => r.tipo === 'Egreso').reduce((s, r) => s + (r.monto || 0), 0);
  const balance = totalIngresos - totalEgresos;
  const totalPagos = rows.length;

  const getDiffDays = (a: string, b: string) => {
    if (!a || !b) return 0;
    const d1 = new Date(a).getTime();
    const d2 = new Date(b).getTime();
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={fTipo} onChange={(e)=>setFTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="Ingreso">Ingresos</option>
              <option value="Egreso">Egresos</option>
              <option value="Transferencia">Transferencias</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" value={fDesde} onChange={(e)=>setFDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" value={fHasta} onChange={(e)=>setFHasta(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={fCategoria} onChange={(e)=>setFCategoria(e.target.value)}>
              <option value="">Todas</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={()=>{ setPage(1); load(); }} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Filtrar</button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800">Total Ingresos</h3>
          <p className="text-2xl font-bold text-green-600">${totalIngresos.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">Total Egresos</h3>
          <p className="text-2xl font-bold text-red-600">${totalEgresos.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">Balance</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>${balance.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800">Total Pagos</h3>
          <p className="text-2xl font-bold text-gray-600">{totalPagos}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-green-600 text-white sticky top-0">
            <tr>
              <th className="px-2 py-3 text-xs font-medium uppercase">Fecha Efectiva</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Tipo</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Categoría</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Descripción</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Proveedor</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Forma de Pago</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Monto</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Fecha Programada</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Diferencia Días</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Estado</th>
              <th className="px-2 py-3 text-xs font-medium uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pago) => (
              <tr key={pago.id} className="hover:bg-gray-50 border-b">
                <td className="px-2 py-2 font-medium text-green-600">{pago.fecha_efectiva_pago}</td>
                <td className="px-2 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    pago.tipo === 'Ingreso' ? 'bg-green-100 text-green-800' :
                    pago.tipo === 'Egreso' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{pago.tipo}</span>
                </td>
                <td className="px-2 py-2">{catMap.get(pago.categoria_id) || '-'}</td>
                <td className="px-2 py-2">{pago.descripcion}</td>
                <td className="px-2 py-2">{pago.proveedor_id ? (provMap.get(pago.proveedor_id) || '-') : '-'}</td>
                <td className="px-2 py-2">{pago.forma_pago}</td>
                <td className="px-2 py-2 font-bold text-right">${(pago.monto || 0).toLocaleString('es-MX')}</td>
                <td className="px-2 py-2 text-gray-600">{pago.fecha_programada}</td>
                <td className="px-2 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    getDiffDays(pago.fecha_programada, pago.fecha_efectiva_pago) <= 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getDiffDays(pago.fecha_programada, pago.fecha_efectiva_pago)} días
                  </span>
                </td>
                <td className="px-2 py-2 text-center">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">✓ Pagado</span>
                </td>
                <td className="px-2 py-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm" onClick={()=>alert('Detalles próximamente')}>Ver Detalles</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-3 flex justify-end items-center gap-2">
          <button className="px-3 py-1 border rounded" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
          <span className="text-sm text-gray-600">Página {page}</span>
          <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>p+1)}>Siguiente</button>
        </div>
      </div>
    </div>
  );
};