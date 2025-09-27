import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import MovimientoCard from './MovimientoCard';
import ModalGestionMovimiento from './ModalGestionMovimiento';

interface Movimiento {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  monto: number;
  proveedor_cliente?: string;
  descripcion?: string;
  categoria?: { nombre: string; color?: string | null };
  subcategoria?: { nombre: string };
  fecha_programada?: string;
  forma_pago?: string;
  fiscal?: boolean;
  notas?: string;
  estado: string;
  origen?: 'unico' | 'recurrente';
  created_at: string;
}

interface Colaborador {
  id: string;
  nombre: string;
  email: string;
}

interface AgendaDeFlujoProps {
  onNavigateToRegistros?: () => void;
}

const AgendaDeFlujo: React.FC<AgendaDeFlujoProps> = ({ onNavigateToRegistros }) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [tabActiva, setTabActiva] = useState<'pagar' | 'cobrar'>('pagar');
  const [vistaActiva, setVistaActiva] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLDivElement | null>(null);
  
  // Estados del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const registrosPorPagina = 20;

  useEffect(() => {
    cargarColaboradores();
    cargarMovimientos();
  }, []);

  useEffect(() => {
    cargarMovimientos();
  }, [tabActiva, busqueda, filtroEmpleado, filtroEstado, fechaInicio, fechaFin, paginaActual]);

  const cargarColaboradores = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, email')
        .order('nombre');

      if (error) throw error;
      setColaboradores(data || []);
    } catch (err: any) {
      console.error('Error cargando colaboradores:', err);
    }
  };

  const cargarMovimientos = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      let query = supabase
        .from('movimientos_financieros')
        .select(`
          id,
          tipo,
          monto,
          proveedor_cliente,
          descripcion,
          categoria_id,
          subcategoria_id,
          fecha_programada,
          forma_pago,
          fiscal,
          notas,
          estado,
          origen,
          created_at,
          categorias_financieras!inner(nombre, color),
          subcategorias_financieras(nombre)
        `)
        .eq('estado', 'Registrado')
        .order('fecha_programada', { ascending: true });

      // Filtro por tipo (pagar/cobrar)
      if (tabActiva === 'pagar') {
        query = query.eq('tipo', 'Egreso');
      } else {
        query = query.eq('tipo', 'Ingreso');
      }

      // Filtro por empleado
      if (filtroEmpleado) {
        query = query.eq('usuario_id', filtroEmpleado);
      }

      // Filtro por estado
      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      // Filtro por rango de fechas
      if (fechaInicio) {
        query = query.gte('fecha_programada', fechaInicio);
      }
      if (fechaFin) {
        query = query.lte('fecha_programada', fechaFin);
      }

      // Filtro por búsqueda
      if (busqueda) {
        query = query.or(`descripcion.ilike.%${busqueda}%,proveedor_cliente.ilike.%${busqueda}%`);
      }

      // Paginación
      const desde = (paginaActual - 1) * registrosPorPagina;
      const hasta = desde + registrosPorPagina - 1;
      query = query.range(desde, hasta);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transformar datos para incluir información de categoría y subcategoría
      const movimientosTransformados = (data || []).map(mov => ({
        ...mov,
        categoria: mov.categorias_financieras ? {
          nombre: mov.categorias_financieras.nombre,
          color: mov.categorias_financieras.color
        } : undefined,
        subcategoria: mov.subcategorias_financieras ? {
          nombre: mov.subcategorias_financieras.nombre
        } : undefined
      }));

      setMovimientos(movimientosTransformados);
      setTotalRegistros(count || 0);
      setTotalPaginas(Math.ceil((count || 0) / registrosPorPagina));
    } catch (err: any) {
      console.error('Error cargando movimientos:', err);
      setError('Error al cargar movimientos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarMovimiento = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { error } = await supabase
        .from('movimientos_financieros')
        .update({ 
          estado: 'Completado',
          fecha_efectiva: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;

      // Recargar movimientos
      cargarMovimientos();
    } catch (err: any) {
      console.error('Error completando movimiento:', err);
      setError('Error al completar movimiento: ' + err.message);
    }
  };

  const handleCancelarMovimiento = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { error } = await supabase
        .from('movimientos_financieros')
        .update({ estado: 'Cancelado' })
        .eq('id', id);

      if (error) throw error;

      // Recargar movimientos
      cargarMovimientos();
    } catch (err: any) {
      console.error('Error cancelando movimiento:', err);
      setError('Error al cancelar movimiento: ' + err.message);
    }
  };

  const handleEditarMovimiento = (movimiento: Movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setMovimientoSeleccionado(null);
    cargarMovimientos(); // Recargar después de editar
  };

  const handleGuardarExitoso = () => {
    cargarMovimientos(); // Recargar después de guardar
  };

  // Función para obtener el icono según el origen
  const getOrigenIcon = (origen?: string) => {
    if (origen === 'recurrente') {
      return <span className="text-blue-500" title="Movimiento Recurrente">🔄</span>;
    }
    return <span className="text-yellow-500" title="Movimiento Único">⚡</span>;
  };

  // Función para formatear moneda
  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-MX');
  };

  // Función para renderizar vista de tabla
  const renderVistaTabla = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando movimientos...</div>
        </div>
      );
    }

    if (movimientos.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500">
            No hay movimientos {tabActiva === 'pagar' ? 'por pagar' : 'por cobrar'}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Programada
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
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getOrigenIcon(movimiento.origen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movimiento.tipo === 'Ingreso' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movimiento.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {movimiento.descripcion || 'Sin descripción'}
                    </div>
                    {movimiento.proveedor_cliente && (
                      <div className="text-sm text-gray-500">
                        {movimiento.proveedor_cliente}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {movimiento.categoria?.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: movimiento.categoria.color }}
                        ></div>
                      )}
                      <span className="text-sm text-gray-900">
                        {movimiento.categoria?.nombre || 'Sin categoría'}
                      </span>
                    </div>
                    {movimiento.subcategoria?.nombre && (
                      <div className="text-xs text-gray-500">
                        {movimiento.subcategoria.nombre}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatearMoneda(movimiento.monto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movimiento.fecha_programada ? formatearFecha(movimiento.fecha_programada) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movimiento.estado === 'Registrado' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : movimiento.estado === 'Completado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movimiento.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditarMovimiento(movimiento)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCompletarMovimiento(movimiento.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Completar
                      </button>
                      <button
                        onClick={() => handleCancelarMovimiento(movimiento.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🗓️ Agenda de Flujo</h2>
            <p className="text-gray-600 text-sm mt-1">
              Gestión de movimientos pendientes por pagar y cobrar
            </p>
          </div>
        </div>
      </div>

      {/* Barra de herramientas compacta */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full min-w-[200px]"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro empleado */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">👤</span>
            <select
              value={filtroEmpleado}
              onChange={(e) => setFiltroEmpleado(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
            >
              <option value="">Todos</option>
              {colaboradores.map(col => (
                <option key={col.id} value={col.id}>{col.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro estado */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">🚦</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[100px]"
            >
              <option value="todos">Todos</option>
              <option value="Registrado">Registrado</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Rango de fechas */}
          <div className="flex items-center gap-2 relative" ref={rangeRef}>
            <span className="text-sm text-gray-600">🗓️</span>
            <button
              onClick={() => setRangeOpen(!rangeOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-nowrap"
            >
              Rango de fechas
            </button>
            {rangeOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[300px]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFechaInicio('');
                        setFechaFin('');
                        setRangeOpen(false);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setRangeOpen(false)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selector de vista */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setVistaActiva('tarjetas')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  vistaActiva === 'tarjetas'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>🎯</span>
                Vista de Tarjetas
              </button>
              <button
                onClick={() => setVistaActiva('tabla')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  vistaActiva === 'tabla'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>📊</span>
                Vista de Tabla
              </button>
            </div>
          </div>

          {/* Botón nuevo movimiento */}
          <button
            onClick={() => onNavigateToRegistros ? onNavigateToRegistros() : setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <span>+</span>
            Registrar Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Navegación Por Pagar / Por Cobrar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTabActiva('pagar')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tabActiva === 'pagar'
                ? 'bg-red-100 text-red-700 border-2 border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Por Pagar
          </button>
          <button
            onClick={() => setTabActiva('cobrar')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tabActiva === 'cobrar'
                ? 'bg-green-100 text-green-700 border-2 border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Por Cobrar
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 font-medium">Error</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Contenido principal */}
      {vistaActiva === 'tarjetas' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando movimientos...</div>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                No hay movimientos {tabActiva === 'pagar' ? 'por pagar' : 'por cobrar'}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {movimientos.map((movimiento) => (
                <div key={movimiento.id} className="relative">
                  <MovimientoCard
                    movimiento={{
                      ...movimiento,
                      categoria: movimiento.categoria ? {
                        ...movimiento.categoria,
                        color: movimiento.categoria.color
                      } : undefined
                    }}
                    onCompletar={() => handleCompletarMovimiento(movimiento.id)}
                    onCancelar={() => handleCancelarMovimiento(movimiento.id)}
                    onEditar={() => handleEditarMovimiento(movimiento)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas} ({totalRegistros} registros)
              </span>
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : (
        renderVistaTabla()
      )}

      {/* Modal de gestión de movimiento */}
      {modalAbierto && (
        <ModalGestionMovimiento
          movimiento={movimientoSeleccionado}
          onClose={handleCerrarModal}
          onGuardarExitoso={handleGuardarExitoso}
        />
      )}
    </div>
  );
};

export default AgendaDeFlujo;
