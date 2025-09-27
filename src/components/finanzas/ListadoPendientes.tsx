import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const ListadoPendientes: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fUsuario, setFUsuario] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/listar-todos-los-movimientos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filtros: { usuario_id: fUsuario, estado: 'Registrado' } })
      });
      if (!res.ok) throw new Error('Error cargando');
      const json = await res.json();
      setRows(json.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input className="border rounded px-2 py-1" placeholder="Filtrar por usuario_id" value={fUsuario} onChange={e => setFUsuario(e.target.value)} />
        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={load}>Aplicar</button>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Usuario</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Descripción</th>
              <th className="text-left p-2">Monto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.fecha_movimiento}</td>
                <td className="p-2">{r.usuario_id}</td>
                <td className="p-2">{r.tipo}</td>
                <td className="p-2">{r.descripcion || '-'}</td>
                <td className="p-2">${Number(r.monto).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};










