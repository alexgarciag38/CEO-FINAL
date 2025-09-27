import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import MovimientoCard from './MovimientoCard';
import ModalGestionMovimiento from './ModalGestionMovimiento';
import EntradaRapidaMovimientos from './EntradaRapidaMovimientos';

interface Movimiento {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  monto: number;
  proveedor_cliente?: string;
  descripcion?: string;
  categoria?: { nombre: string };
  subcategoria?: { nombre: string };
  fecha_programada?: string;
  forma_pago?: string;
  fiscal?: boolean;
  notas?: string;
  estado: string;
  created_at: string;
}

interface Colaborador {
  id: string;
  nombre: string;
  email: string;
}

const ListadoPendientesAdmin: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [tabActiva, setTabActiva] = useState<'pagar' | 'cobrar'>('pagar');
  const [vistaActiva, setVistaActiva] = useState<'tarjetas' | 'entrada-rapida'>('tarjetas');
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
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    cargarColaboradores();
  }, []);

  useEffect(() => {
    cargarMovimientos();
  }, [tabActiva, busqueda, filtroEmpleado, filtroEstado, fechaInicio, fechaFin, pagina]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rangeRef.current) return;
      if (!rangeRef.current.contains(e.target as Node)) setRangeOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const cargarColaboradores = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { data, error } = await supabase.functions.invoke('listar-usuarios-colaboradores', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {}
      });

      if (error) throw error;
      setColaboradores(data.colaboradores || []);
    } catch (err: any) {
      console.error('Error cargando colaboradores:', err);
    }
  };

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const filtros: any = {
        tipo_movimiento: tabActiva === 'pagar' ? 'Egreso' : 'Ingreso',
        pagina,
        limite: 20
      };

      if (busqueda) filtros.busqueda = busqueda;
      if (filtroEmpleado) filtros.usuario_id_filtro = filtroEmpleado;

      const { data, error } = await supabase.functions.invoke('obtener-movimientos-pendientes', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: filtros
      });

      if (error) throw error;

      let movimientosFiltrados = data.movimientos || [];

      // Aplicar filtros de fecha en frontend
      if (fechaInicio || fechaFin) {
        movimientosFiltrados = movimientosFiltrados.filter((mov: Movimiento) => {
          if (!mov.fecha_programada) return false;
          
          const fechaMov = new Date(mov.fecha_programada);
          const inicio = fechaInicio ? new Date(fechaInicio) : null;
          const fin = fechaFin ? new Date(fechaFin) : null;
          
          if (inicio && fechaMov < inicio) return false;
          if (fin && fechaMov > fin) return false;
          
          return true;
        });
      }

      // Aplicar filtro de estado en frontend
      if (filtroEstado !== 'todos') {
        const hoy = new Date();
        movimientosFiltrados = movimientosFiltrados.filter((mov: Movimiento) => {
          if (!mov.fecha_programada) return filtroEstado === 'otros';
          
          const fechaMov = new Date(mov.fecha_programada);
          const diffTime = fechaMov.getTime() - hoy.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (filtroEstado === 'vencidos') return diffDays < 0;
          if (filtroEstado === 'proximos7') return diffDays >= 0 && diffDays <= 7;
          if (filtroEstado === 'otros') return diffDays > 7;
          
          return true;
        });
      }

      // Ordenar por urgencia
      movimientosFiltrados = ordenarPorUrgencia(movimientosFiltrados);

      setMovimientos(movimientosFiltrados);
      setTotalPaginas(data.paginacion?.totalPaginas || 1);
    } catch (err: any) {
      console.error('Error cargando movimientos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ordenarPorUrgencia = (movs: Movimiento[]) => {
    const hoy = new Date();
    
    return movs.sort((a, b) => {
      const fechaA = a.fecha_programada ? new Date(a.fecha_programada) : null;
      const fechaB = b.fecha_programada ? new Date(b.fecha_programada) : null;
      
      if (!fechaA && !fechaB) return 0;
      if (!fechaA) return 1;
      if (!fechaB) return -1;
      
      const diffA = Math.ceil((fechaA.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      const diffB = Math.ceil((fechaB.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      // Vencidos primero (más antiguos primero)
      if (diffA < 0 && diffB < 0) return diffA - diffB;
      if (diffA < 0) return -1;
      if (diffB < 0) return 1;
      
      // Próximos 7 días
      if (diffA <= 7 && diffB <= 7) return diffA - diffB;
      if (diffA <= 7) return -1;
      if (diffB <= 7) return 1;
      
      // Resto por fecha ascendente
      return diffA - diffB;
    });
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

  return (
    <div className="space-y-6">
      {/* Header con pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTabActiva('pagar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tabActiva === 'pagar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pendientes por Pagar
          </button>
          <button
            onClick={() => setTabActiva('cobrar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tabActiva === 'cobrar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pendientes por Cobrar
          </button>
        </nav>
      </div>

      {/* Barra de herramientas estilo pill/segment replicada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200" style={{ padding: '1rem' }}>
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          {/* Grupo Izquierdo */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Buscar - redondeado full con icono */}
            <div className="relative" style={{ width: '280px' }}>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border border-gray-300 rounded-full pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>

            {/* Empleados pill */}
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-2 max-w-full min-w-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 mr-2"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7 0 .552.448 1 1 1h12c.552 0 1-.448 1-1 0-3.866-3.134-7-7-7z"/></svg>
              <select
                value={filtroEmpleado}
                onChange={(e) => setFiltroEmpleado(e.target.value)}
                className="bg-transparent text-sm focus:outline-none truncate max-w-[180px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[260px]"
              >
                <option value="">Todos los empleados</option>
                {colaboradores.map(col => (
                  <option key={col.id} value={col.id}>{col.nombre}</option>
                ))}
              </select>
            </div>

            {/* Estado pill */}
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-2 max-w-full min-w-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 mr-2"><circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/></svg>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-transparent text-sm focus:outline-none truncate max-w-[180px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[260px]"
              >
                <option value="todos">Todos los pendientes</option>
                <option value="vencidos">Solo vencidos</option>
                <option value="proximos7">Próximos 7 días</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            {/* Rango fechas pill */}
            <div className="relative z-20 inline-flex items-center bg-gray-100 rounded-full px-3 py-2 mr-6" ref={rangeRef}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 mr-2"><path d="M7 2v2H5a2 2 0 00-2 2v2h18V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 002 2h14a2 2 0 002-2V10z"/></svg>
              <button
                type="button"
                onClick={() => setRangeOpen(v => !v)}
                className="text-sm text-gray-700 whitespace-nowrap focus:outline-none"
                aria-haspopup="dialog"
                aria-expanded={rangeOpen}
              >
                {fechaInicio && fechaFin ? `${new Date(fechaInicio).toLocaleDateString('es-MX')} – ${new Date(fechaFin).toLocaleDateString('es-MX')}` : 'Rango de fechas'}
              </button>
              {rangeOpen && (
                <div className="absolute z-40 mt-2 w-[320px] p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-xs text-gray-600">Inicio
                      <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </label>
                    <label className="text-xs text-gray-600">Fin
                      <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800" onClick={() => { setFechaInicio(''); setFechaFin(''); setRangeOpen(false); }}>Limpiar</button>
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={() => setRangeOpen(false)}>Aplicar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grupo Derecho */}
          <div className="flex items-center gap-4 ml-4 w-full md:w-auto justify-end mt-3 md:mt-0">
            {/* Segmented control refinado */}
            <div className="flex items-center rounded-full border border-gray-300 bg-gray-100 px-1 py-1 overflow-hidden relative z-10">
              {/* Icono izquierda (Ojo) */}
              <button
                onClick={() => setVistaActiva('tarjetas')}
                aria-pressed={vistaActiva === 'tarjetas'}
                className="flex items-center"
                title="Vista de Tarjetas"
              >
                <span className={`flex items-center justify-center h-8 w-8 rounded-full ${vistaActiva === 'tarjetas' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M1.05 12a10.94 10.94 0 0 1 21.9 0 10.94 10.94 0 0 1-21.9 0z"/></svg>
                </span>
                {vistaActiva === 'tarjetas' && (
                  <>
                    <span className="h-6 w-px bg-white mx-1 rounded-full" />
                    <span className="px-3 h-8 inline-flex items-center rounded-full text-sm font-medium bg-blue-600 text-white">
                      Vista de Tarjetas
                    </span>
                  </>
                )}
              </button>

              {/* Icono derecha (Rayo) */}
              <button
                onClick={() => setVistaActiva('entrada-rapida')}
                aria-pressed={vistaActiva === 'entrada-rapida'}
                className="flex items-center ml-2"
                title="Entrada Rápida"
              >
                {vistaActiva === 'entrada-rapida' && (
                  <span className="px-3 h-8 inline-flex items-center rounded-full text-sm font-medium bg-blue-600 text-white mr-2">
                    Entrada Rápida
                  </span>
                )}
                <span className={`flex items-center justify-center h-8 w-8 rounded-full ${vistaActiva === 'entrada-rapida' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </span>
              </button>
            </div>

            {/* Registrar pill */}
            <button onClick={handleNuevoMovimiento} className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-full px-3 py-2 text-sm hover:bg-blue-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Registrar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido condicional según la vista */}
      {vistaActiva === 'tarjetas' ? (
        <>
          {/* Lista de movimientos en tarjetas */}
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

          {!loading && !error && movimientos.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No hay movimientos pendientes</div>
              <div className="text-gray-400 text-sm mt-2">
                {tabActiva === 'pagar' ? 'No hay pagos pendientes' : 'No hay cobros pendientes'}
              </div>
            </div>
          )}

          {!loading && !error && movimientos.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {movimientos.map((movimiento) => (
                  <MovimientoCard
                    key={movimiento.id}
                    movimiento={movimiento}
                    onEditar={handleEditar}
                    onCompletar={handleCompletar}
                    onEliminar={handleEliminar}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Página {pagina} de {totalPaginas}
                  </span>
                  
                  <button
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Vista de Entrada Rápida */
        <EntradaRapidaMovimientos />
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

export default ListadoPendientesAdmin;
