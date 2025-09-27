import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Download, 
  Filter, 
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';

interface Movimiento {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  descripcion: string;
  monto: number;
  fecha_programada: string;
  fecha_efectiva_pago: string;
  forma_pago: string;
  fiscal: boolean;
  notas?: string;
  origen?: 'unico' | 'recurrente';
  created_at: string;
  categorias_financieras?: { nombre: string; color?: string };
  subcategorias_financieras?: { nombre: string; color?: string };
  proveedores?: { nombre: string };
}

interface Categoria {
  id: string;
  nombre: string;
  color?: string;
}

export const HistorialMovimientos: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroFormaPago, setFiltroFormaPago] = useState<string>('');
  const [filtroFiscal, setFiltroFiscal] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const registrosPorPagina = 20;

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    saldoNeto: 0,
    totalRegistros: 0
  });

  useEffect(() => {
    loadCategorias();
  }, []);

  useEffect(() => {
    loadMovimientos();
  }, [paginaActual, filtroTipo, filtroCategoria, filtroFormaPago, filtroFiscal, fechaDesde, fechaHasta, busqueda]);

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

  const loadMovimientos = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('financial_payments')
        .select(`
          *,
          categorias_financieras(nombre, color),
          subcategorias_financieras(nombre, color),
          proveedores(nombre)
        `, { count: 'exact' })
        .eq('pagado', true)
        .order('fecha_efectiva_pago', { ascending: false });

      // Aplicar filtros
      if (filtroTipo) query = query.eq('tipo', filtroTipo);
      if (filtroCategoria) query = query.eq('categoria_id', filtroCategoria);
      if (filtroFormaPago) query = query.eq('forma_pago', filtroFormaPago);
      if (filtroFiscal) query = query.eq('fiscal', filtroFiscal === 'true');
      if (fechaDesde) query = query.gte('fecha_efectiva_pago', fechaDesde);
      if (fechaHasta) query = query.lte('fecha_efectiva_pago', fechaHasta);
      if (busqueda) query = query.ilike('descripcion', `%${busqueda}%`);

      // Paginación
      const desde = (paginaActual - 1) * registrosPorPagina;
      const hasta = desde + registrosPorPagina - 1;
      query = query.range(desde, hasta);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setMovimientos(data || []);
      setTotalRegistros(count || 0);
      setTotalPaginas(Math.ceil((count || 0) / registrosPorPagina));

      // Calcular estadísticas
      if (data) {
        const ingresos = data.filter(m => m.tipo === 'Ingreso').reduce((sum, m) => sum + m.monto, 0);
        const egresos = data.filter(m => m.tipo === 'Egreso').reduce((sum, m) => sum + m.monto, 0);
        setEstadisticas({
          totalIngresos: ingresos,
          totalEgresos: egresos,
          saldoNeto: ingresos - egresos,
          totalRegistros: count || 0
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      // Obtener todos los datos sin paginación para la exportación
      let query = supabase
        .from('financial_payments')
        .select(`
          *,
          categorias_financieras(nombre),
          subcategorias_financieras(nombre),
          proveedores(nombre)
        `)
        .eq('pagado', true)
        .order('fecha_efectiva_pago', { ascending: false });

      // Aplicar los mismos filtros
      if (filtroTipo) query = query.eq('tipo', filtroTipo);
      if (filtroCategoria) query = query.eq('categoria_id', filtroCategoria);
      if (filtroFormaPago) query = query.eq('forma_pago', filtroFormaPago);
      if (filtroFiscal) query = query.eq('fiscal', filtroFiscal === 'true');
      if (fechaDesde) query = query.gte('fecha_efectiva_pago', fechaDesde);
      if (fechaHasta) query = query.lte('fecha_efectiva_pago', fechaHasta);
      if (busqueda) query = query.ilike('descripcion', `%${busqueda}%`);

      const { data, error } = await query;

      if (error) throw error;

      // Crear CSV
      const headers = [
        'Fecha Efectiva',
        'Tipo',
        'Descripción',
        'Monto',
        'Categoría',
        'Subcategoría',
        'Forma de Pago',
        'Fiscal',
        'Proveedor',
        'Notas'
      ];

      const csvData = data?.map(mov => [
        new Date(mov.fecha_efectiva_pago).toLocaleDateString(),
        mov.tipo,
        mov.descripcion,
        mov.monto,
        mov.categorias_financieras?.nombre || '',
        mov.subcategorias_financieras?.nombre || '',
        mov.forma_pago,
        mov.fiscal ? 'Sí' : 'No',
        mov.proveedores?.nombre || '',
        mov.notas || ''
      ]) || [];

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historial_movimientos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'Ingreso' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getFormaPagoColor = (formaPago: string) => {
    const colors = {
      'Efectivo': 'bg-green-100 text-green-800',
      'Transferencia': 'bg-blue-100 text-blue-800',
      'Cheque': 'bg-yellow-100 text-yellow-800',
      'Tarjeta': 'bg-purple-100 text-purple-800'
    };
    return colors[formaPago as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando historial de movimientos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Movimientos</h2>
          <p className="text-gray-600">Movimientos completados y registrados</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Selector de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-600">
                ${estadisticas.totalIngresos.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Egresos</p>
              <p className="text-2xl font-bold text-red-600">
                ${estadisticas.totalEgresos.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${estadisticas.saldoNeto >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${estadisticas.saldoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo Neto</p>
              <p className={`text-2xl font-bold ${estadisticas.saldoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${estadisticas.saldoNeto.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Registros</p>
              <p className="text-2xl font-bold text-blue-600">
                {estadisticas.totalRegistros.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en descripción..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="Ingreso">Ingreso</option>
              <option value="Egreso">Egreso</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
            <select
              value={filtroFormaPago}
              onChange={(e) => setFiltroFormaPago(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las formas</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal</label>
            <select
              value={filtroFiscal}
              onChange={(e) => setFiltroFiscal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
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
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movimientos.map((movimiento) => (
            <div key={movimiento.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    {movimiento.origen === 'recurrente' ? (
                      <span className="text-blue-500" title="Movimiento Recurrente">🔄</span>
                    ) : (
                      <span className="text-yellow-500" title="Movimiento Único">⚡</span>
                    )}
                    {movimiento.descripcion}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(movimiento.fecha_efectiva_pago).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(movimiento.tipo)}`}>
                    {movimiento.tipo}
                  </span>
                  {movimiento.fiscal && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Fiscal
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monto</span>
                  <span className="font-semibold text-lg">
                    ${movimiento.monto.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Forma de Pago</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFormaPagoColor(movimiento.forma_pago)}`}>
                    {movimiento.forma_pago}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categoría</span>
                  <div className="flex items-center gap-2">
                    {movimiento.categorias_financieras?.color && (
                      <div 
                        className="w-3 h-3 rounded-full border-2 border-gray-300" 
                        style={{ backgroundColor: movimiento.categorias_financieras.color }}
                      />
                    )}
                    <span className="text-sm font-medium">{movimiento.categorias_financieras?.nombre}</span>
                  </div>
                </div>

                {movimiento.subcategorias_financieras && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subcategoría</span>
                    <div className="flex items-center gap-2">
                      {movimiento.subcategorias_financieras.color && (
                        <div 
                          className="w-3 h-3 rounded-full border-2 border-gray-300" 
                          style={{ backgroundColor: movimiento.subcategorias_financieras.color }}
                        />
                      )}
                      <span className="text-sm font-medium">{movimiento.subcategorias_financieras.nombre}</span>
                    </div>
                  </div>
                )}

                {movimiento.proveedores && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Proveedor</span>
                    <span className="text-sm font-medium">{movimiento.proveedores.nombre}</span>
                  </div>
                )}

                {movimiento.notas && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{movimiento.notas}</p>
                  </div>
                )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma de Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiscal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientos.map((movimiento) => (
                  <tr key={movimiento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movimiento.fecha_efectiva_pago).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(movimiento.tipo)}`}>
                        {movimiento.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {movimiento.origen === 'recurrente' ? (
                          <span className="text-blue-500" title="Movimiento Recurrente">🔄</span>
                        ) : (
                          <span className="text-yellow-500" title="Movimiento Único">⚡</span>
                        )}
                        {movimiento.descripcion}
                      </div>
                      {movimiento.notas && (
                        <div className="text-sm text-gray-500">{movimiento.notas}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${movimiento.monto.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {movimiento.categorias_financieras?.color && (
                          <div 
                            className="w-3 h-3 rounded-full border-2 border-gray-300" 
                            style={{ backgroundColor: movimiento.categorias_financieras.color }}
                          />
                        )}
                        <span className="text-sm text-gray-900">{movimiento.categorias_financieras?.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFormaPagoColor(movimiento.forma_pago)}`}>
                        {movimiento.forma_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movimiento.fiscal ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Sí
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
              disabled={paginaActual === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
              disabled={paginaActual === totalPaginas}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">{(paginaActual - 1) * registrosPorPagina + 1}</span>
                {' '}a{' '}
                <span className="font-medium">
                  {Math.min(paginaActual * registrosPorPagina, totalRegistros)}
                </span>
                {' '}de{' '}
                <span className="font-medium">{totalRegistros}</span>
                {' '}resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setPaginaActual(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        paginaActual === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {movimientos.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay movimientos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filtroTipo || filtroCategoria || filtroFormaPago || filtroFiscal || fechaDesde || fechaHasta || busqueda
              ? 'No se encontraron movimientos con los filtros aplicados.'
              : 'No hay movimientos completados en el historial.'
            }
          </p>
        </div>
      )}
    </div>
  );
};


