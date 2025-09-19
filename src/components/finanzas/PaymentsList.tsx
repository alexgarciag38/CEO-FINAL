import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const PaymentsList: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fTipo, setFTipo] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const [fPagado, setFPagado] = useState('');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('financial_payments')
        .select('*, categorias_financieras(nombre), subcategorias_financieras(nombre), proveedores(nombre)')
        .order('fecha_programada', { ascending: false });
      if (fTipo) query = query.eq('tipo', fTipo);
      if (fCategoria) query = query.eq('categoria_id', fCategoria);
      if (fPagado) query = query.eq('pagado', fPagado === 'true');
      if (fDesde) query = query.gte('fecha_programada', fDesde);
      if (fHasta) query = query.lte('fecha_programada', fHasta);
      const { data, error } = await query.range((page-1)*pageSize, page*pageSize-1);
      if (error) throw error;
      setRows(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar pago?')) return;
    const { error } = await supabase.from('financial_payments').delete().eq('id', id);
    if (!error) load();
  };

  const handleMarkPaid = async (id: string) => {
    const fecha = prompt('Fecha efectiva de pago (YYYY-MM-DD):');
    if (!fecha) return;
    const { error } = await supabase.from('financial_payments').update({ pagado: true, fecha_efectiva_pago: fecha }).eq('id', id);
    if (!error) load();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagos registrados</h3>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <select className="border rounded px-3 py-2" value={fTipo} onChange={(e)=>setFTipo(e.target.value)}>
          <option value="">Tipo</option>
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
          <option value="Transferencia">Transferencia</option>
        </select>
        <input className="border rounded px-3 py-2" type="date" value={fDesde} onChange={(e)=>setFDesde(e.target.value)} />
        <input className="border rounded px-3 py-2" type="date" value={fHasta} onChange={(e)=>setFHasta(e.target.value)} />
        <select className="border rounded px-3 py-2" value={fPagado} onChange={(e)=>setFPagado(e.target.value)}>
          <option value="">Estado</option>
          <option value="true">Pagado</option>
          <option value="false">Pendiente</option>
        </select>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>{ setPage(1); load(); }}>Filtrar</button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Fecha</th>
              <th className="text-left py-2 px-3">Tipo</th>
              <th className="text-left py-2 px-3">Descripción</th>
              <th className="text-right py-2 px-3">Monto</th>
              <th className="text-left py-2 px-3">Pagado</th>
              <th className="text-center py-2 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{row.fecha_programada}</td>
                <td className="py-2 px-3">{row.tipo}</td>
                <td className="py-2 px-3 text-gray-700">{row.descripcion}</td>
                <td className="py-2 px-3 text-right font-medium">${Number(row.monto || 0).toLocaleString('es-MX')}</td>
                <td className="py-2 px-3">{row.pagado ? 'Sí' : 'No'}</td>
                <td className="py-2 px-3 text-center">
                  <div className="inline-flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>handleMarkPaid(row.id)}>Marcar Pagado</button>
                    <button className="px-2 py-1 border rounded" onClick={()=>handleDelete(row.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex justify-end items-center gap-2">
        <button className="px-3 py-1 border rounded" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
        <span className="text-sm text-gray-600">Página {page}</span>
        <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>p+1)}>Siguiente</button>
      </div>
    </div>
  );
};