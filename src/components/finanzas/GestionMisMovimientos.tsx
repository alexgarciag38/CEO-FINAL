import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ModalGestionMovimiento from './ModalGestionMovimiento';

interface Movimiento {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  monto: number;
  proveedor_cliente?: string;
  descripcion?: string;
  categoria?: { nombre: string };
  subcategoria?: { nombre: string };
  fecha_movimiento: string;
  fecha_programada?: string;
  forma_pago?: string;
  fiscal?: boolean;
  notas?: string;
  estado: string;
  created_at: string;
}

const GestionMisMovimientos: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // Estados del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { data, error } = await supabase.functions.invoke('listar-mis-movimientos', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {}
      });

      if (error) throw error;
      setMovimientos(data.movimientos || []);
    } catch (err: any) {
      console.error('Error cargando movimientos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (movimiento: Movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setModalAbierto(true);
  };

  const handleCompletar = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { error } = await supabase.functions.invoke('actualizar-movimiento', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          id,
          estado: 'Completado',
          fecha_efectiva: new Date().toISOString().split('T')[0]
        }
      });

      if (error) throw error;
      cargarMovimientos();
    } catch (err: any) {
      console.error('Error completando movimiento:', err);
      alert('Error al completar el movimiento: ' + err.message);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este movimiento?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { error } = await supabase.functions.invoke('eliminar-movimiento', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { id }
      });

      if (error) throw error;
      cargarMovimientos();
    } catch (err: any) {
      console.error('Error eliminando movimiento:', err);
      alert('Error al eliminar el movimiento: ' + err.message);
    }
  };

  const handleNuevoMovimiento = () => {
    setMovimientoSeleccionado(null);
    setModalAbierto(true);
  };

  const handleModalClose = () => {
    setModalAbierto(false);
    setMovimientoSeleccionado(null);
  };

  const handleModalSave = () => {
    cargarMovimientos();
  };

  // Filtrar movimientos
  const movimientosFiltrados = movimientos.filter(mov => {
    const cumpleBusqueda = !busqueda || 
      mov.proveedor_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
      mov.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleTipo = filtroTipo === 'todos' || mov.tipo === filtroTipo;
    
    const cumpleEstado = filtroEstado === 'todos' || mov.estado === filtroEstado;
    
    return cumpleBusqueda && cumpleTipo && cumpleEstado;
  });

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completado':
        return 'bg-green-100 text-green-800';
      case 'Registrado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mis Movimientos Financieros</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona tus propios movimientos de ingresos y egresos
          </p>
        </div>
        <button
          onClick={handleNuevoMovimiento}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Registrar Mi Movimiento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por proveedor/descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los tipos</option>
            <option value="Ingreso">Ingresos</option>
            <option value="Egreso">Egresos</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            <option value="Registrado">Registrado</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabla de movimientos */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-600 font-medium">Error al cargar movimientos</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
          <button
            onClick={cargarMovimientos}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && movimientosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No hay movimientos</div>
          <div className="text-gray-400 text-sm mt-2">
            {busqueda || filtroTipo !== 'todos' || filtroEstado !== 'todos' 
              ? 'No se encontraron movimientos con los filtros aplicados'
              : 'Comienza registrando tu primer movimiento'
            }
          </div>
        </div>
      )}

      {!loading && !error && movimientosFiltrados.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor/Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientosFiltrados.map((movimiento) => (
                  <tr key={movimiento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        movimiento.tipo === 'Ingreso' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {movimiento.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movimiento.proveedor_cliente || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {movimiento.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearMoneda(movimiento.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearFecha(movimiento.fecha_movimiento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(movimiento.estado)}`}>
                        {movimiento.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {movimiento.estado !== 'Completado' && (
                          <button
                            onClick={() => handleCompletar(movimiento.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Marcar como completado"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEditar(movimiento)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleEliminar(movimiento.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <ModalGestionMovimiento
        isOpen={modalAbierto}
        onClose={handleModalClose}
        movimiento={movimientoSeleccionado}
        onSave={handleModalSave}
      />
    </div>
  );
};

export { GestionMisMovimientos };
export default GestionMisMovimientos;