import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Calendar,
  DollarSign,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';

interface Recurrente {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria_id: string;
  subcategoria_id?: string;
  monto: number;
  frecuencia: 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';
  dia_ejecucion: number; // 1-31 para mensual, 1-7 para semanal, etc.
  activo: boolean;
  fecha_inicio: string;
  fecha_fin?: string;
  proxima_ejecucion: string;
  created_at: string;
  categorias_financieras?: { nombre: string; color?: string };
  subcategorias_financieras?: { nombre: string; color?: string };
}

interface Categoria {
  id: string;
  nombre: string;
  color?: string;
}

interface Subcategoria {
  id: string;
  nombre: string;
  categoria_id: string;
  color?: string;
}

export const GestionRecurrentes: React.FC = () => {
  const [recurrentes, setRecurrentes] = useState<Recurrente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showModal, setShowModal] = useState(false);
  const [editingRecurrente, setEditingRecurrente] = useState<Recurrente | null>(null);
  // Pestaña rápida Por pagar / Por cobrar (mismo patrón que Pendientes)
  const [tabActiva, setTabActiva] = useState<'pagar' | 'cobrar'>('pagar');

  // Estados del toolbar (igual que Pendientes)
  const [busqueda, setBusqueda] = useState('');
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'tarjetas' | 'entrada-rapida'>('tarjetas');
  const rangeRef = useRef<HTMLDivElement | null>(null);

  // Filtros (sin tipo; el tipo lo gobierna la pestaña pagar/cobrar)
  const [filtroActivo, setFiltroActivo] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');

  useEffect(() => {
    loadRecurrentes();
    loadCategorias();
  }, []);

  // Refrescar cuando cambie la pestaña pagar/cobrar o filtros
  useEffect(() => {
    loadRecurrentes();
  }, [tabActiva, busqueda, filtroEmpleado, filtroEstado, fechaInicio, fechaFin, filtroActivo, filtroCategoria]);

  // Cerrar rango de fechas al hacer click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rangeRef.current) return;
      if (!rangeRef.current.contains(e.target as Node)) setRangeOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const loadRecurrentes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('movimientos_recurrentes')
        .select(`
          *,
          categorias_financieras(nombre, color),
          subcategorias_financieras(nombre, color)
        `)
        .eq('tipo', tabActiva === 'pagar' ? 'Egreso' : 'Ingreso')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecurrentes(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_financieras')
        .select('id, nombre, color')
        .order('nombre');

      if (error) throw error;
      setCategorias(data || []);
    } catch (e: any) {
      console.error('Error loading categorias:', e);
    }
  };

  const loadSubcategorias = async (categoriaId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategorias_financieras')
        .select('id, nombre, color')
        .eq('categoria_id', categoriaId)
        .order('nombre');

      if (error) throw error;
      setSubcategorias(data || []);
    } catch (e: any) {
      console.error('Error loading subcategorias:', e);
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('movimientos_recurrentes')
        .update({ activo: !activo })
        .eq('id', id);

      if (error) throw error;
      loadRecurrentes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta regla recurrente?')) return;
    
    try {
      const { error } = await supabase
        .from('movimientos_recurrentes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRecurrentes();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filteredRecurrentes = recurrentes.filter(recurrente => {
    // Filtro por búsqueda
    if (busqueda && !recurrente.nombre.toLowerCase().includes(busqueda.toLowerCase()) && 
        !recurrente.descripcion.toLowerCase().includes(busqueda.toLowerCase())) return false;
    
    // Filtro por estado activo/inactivo (usando filtroEstado del toolbar)
    if (filtroEstado === 'activos' && !recurrente.activo) return false;
    if (filtroEstado === 'inactivos' && recurrente.activo) return false;
    
    // Filtro por categoría
    if (filtroCategoria && recurrente.categoria_id !== filtroCategoria) return false;
    
    // Filtro por fechas (si hay fechas seleccionadas)
    if (fechaInicio || fechaFin) {
      const fechaInicioRecurrente = new Date(recurrente.fecha_inicio);
      const inicio = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin ? new Date(fechaFin) : null;
      
      if (inicio && fechaInicioRecurrente < inicio) return false;
      if (fin && fechaInicioRecurrente > fin) return false;
    }
    
    return true;
  });

  const getFrecuenciaColor = (frecuencia: string) => {
    const colors = {
      'Diario': 'bg-red-100 text-red-800',
      'Semanal': 'bg-orange-100 text-orange-800',
      'Quincenal': 'bg-yellow-100 text-yellow-800',
      'Mensual': 'bg-green-100 text-green-800',
      'Anual': 'bg-blue-100 text-blue-800'
    };
    return colors[frecuencia as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'Ingreso' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando reglas recurrentes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pestañas superiores al estilo Pendientes: Por Pagar / Por Cobrar */}
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
            Por Pagar
          </button>
          <button
            onClick={() => setTabActiva('cobrar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tabActiva === 'cobrar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Por Cobrar
          </button>
        </nav>
      </div>
      {/* Barra de herramientas estilo pill/segment replicada (igual que Pendientes) */}
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
                {/* Aquí irían los colaboradores si los necesitáramos */}
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
                <option value="todos">Todos los recurrentes</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
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
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-full px-3 py-2 text-sm hover:bg-blue-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Regla
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Contenido */}
      {vistaActiva === 'tarjetas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecurrentes.map((recurrente) => (
            <div key={recurrente.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{recurrente.nombre}</h3>
                  <p className="text-gray-600 text-sm">{recurrente.descripcion}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(recurrente.tipo)}`}>
                    {recurrente.tipo}
                  </span>
                  <button
                    onClick={() => handleToggleActivo(recurrente.id, recurrente.activo)}
                    className={`p-1 rounded-full ${
                      recurrente.activo 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {recurrente.activo ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monto</span>
                  <span className="font-semibold text-lg">
                    ${recurrente.monto.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frecuencia</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrecuenciaColor(recurrente.frecuencia)}`}>
                    {recurrente.frecuencia}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categoría</span>
                  <div className="flex items-center gap-2">
                    {recurrente.categorias_financieras?.color && (
                      <div 
                        className="w-3 h-3 rounded-full border-2 border-gray-300" 
                        style={{ backgroundColor: recurrente.categorias_financieras.color }}
                      />
                    )}
                    <span className="text-sm font-medium">{recurrente.categorias_financieras?.nombre}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Próxima ejecución</span>
                  <span className="text-sm font-medium">
                    {new Date(recurrente.proxima_ejecucion).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditingRecurrente(recurrente)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(recurrente.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frecuencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Ejecución</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecurrentes.map((recurrente) => (
                  <tr key={recurrente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{recurrente.nombre}</div>
                        <div className="text-sm text-gray-500">{recurrente.descripcion}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(recurrente.tipo)}`}>
                        {recurrente.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${recurrente.monto.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrecuenciaColor(recurrente.frecuencia)}`}>
                        {recurrente.frecuencia}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {recurrente.categorias_financieras?.color && (
                          <div 
                            className="w-3 h-3 rounded-full border-2 border-gray-300" 
                            style={{ backgroundColor: recurrente.categorias_financieras.color }}
                          />
                        )}
                        <span className="text-sm text-gray-900">{recurrente.categorias_financieras?.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(recurrente.proxima_ejecucion).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActivo(recurrente.id, recurrente.activo)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          recurrente.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {recurrente.activo ? (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingRecurrente(recurrente)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(recurrente.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Empty state */}
          {filteredRecurrentes.length === 0 && (
        <div className="text-center py-12">
          <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay reglas recurrentes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {busqueda || filtroEstado !== 'todos' || filtroCategoria || fechaInicio || fechaFin
              ? 'No se encontraron reglas con los filtros aplicados.'
              : 'Comienza creando tu primera regla recurrente.'
            }
          </p>
          {!busqueda && filtroEstado === 'todos' && !filtroCategoria && !fechaInicio && !fechaFin && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Regla
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
