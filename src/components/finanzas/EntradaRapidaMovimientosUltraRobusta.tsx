import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MovimientoRapido {
  id: string;
  modo: 'Unico' | 'Recurrente';
  tipo: 'Ingreso' | 'Egreso';
  categoria_id: string;
  subcategoria_id: string;
  proveedor_cliente: string;
  descripcion: string;
  monto: string;
  fecha_vencimiento: string; // Fecha de vencimiento/programada
  detalles_recurrencia: string; // Resumen de configuración recurrente
  estado: 'Pendiente' | 'Completado' | 'Cancelado' | 'Activa' | 'Pausada' | 'Inactiva';
  fecha_efectiva?: string; // Solo para movimientos únicos completados
  forma_pago: string;
  fiscal: boolean;
  notas: string;
  // Campos de recurrencia (internos)
  frecuencia?: 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';
  dia_especifico?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  numero_repeticiones?: number;
  origen?: 'unico' | 'recurrente';
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: 'Ingreso' | 'Egreso';
  color?: string;
  subcategorias: Subcategoria[];
}

interface Subcategoria {
  id: string;
  nombre: string;
  categoria_id: string;
}

interface PopoverRecurrenciaProps {
  isOpen: boolean;
  onClose: () => void;
  movimiento: MovimientoRapido;
  onUpdate: (updates: Partial<MovimientoRapido>) => void;
}

const PopoverRecurrencia: React.FC<PopoverRecurrenciaProps> = ({
  isOpen,
  onClose,
  movimiento,
  onUpdate
}) => {
  const [frecuencia, setFrecuencia] = useState(movimiento.frecuencia || 'Mensual');
  const [diaEspecifico, setDiaEspecifico] = useState(movimiento.dia_especifico || 1);
  const [fechaInicio, setFechaInicio] = useState(movimiento.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(movimiento.fecha_fin || '');
  const [numeroRepeticiones, setNumeroRepeticiones] = useState(movimiento.numero_repeticiones || 0);
  const [tipoFinalizacion, setTipoFinalizacion] = useState<'indefinido' | 'fecha' | 'repeticiones'>('indefinido');

  const generarResumen = () => {
    let resumen = frecuencia;
    
    if (frecuencia === 'Mensual') {
      resumen += ` (día ${diaEspecifico})`;
    } else if (frecuencia === 'Semanal') {
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      resumen += ` (${dias[diaEspecifico - 1]})`;
    }
    
    if (tipoFinalizacion === 'fecha' && fechaFin) {
      resumen += ` - Hasta ${new Date(fechaFin).toLocaleDateString('es-MX')}`;
    } else if (tipoFinalizacion === 'repeticiones' && numeroRepeticiones > 0) {
      resumen += ` - ${numeroRepeticiones} veces`;
    } else {
      resumen += ' - Indefinido';
    }
    
    return resumen;
  };

  const handleGuardar = () => {
    const resumen = generarResumen();
    onUpdate({
      frecuencia,
      dia_especifico: diaEspecifico,
      fecha_inicio: fechaInicio,
      fecha_fin: tipoFinalizacion === 'fecha' ? fechaFin : '',
      numero_repeticiones: tipoFinalizacion === 'repeticiones' ? numeroRepeticiones : undefined,
      detalles_recurrencia: resumen
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Configurar Recurrencia</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia
            </label>
            <select
              value={frecuencia}
              onChange={(e) => setFrecuencia(e.target.value as any)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Diaria">Diaria</option>
              <option value="Semanal">Semanal</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>

          {/* Día específico */}
          {(frecuencia === 'Mensual' || frecuencia === 'Semanal') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {frecuencia === 'Mensual' ? 'Día del mes' : 'Día de la semana'}
              </label>
              {frecuencia === 'Mensual' ? (
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={diaEspecifico}
                  onChange={(e) => setDiaEspecifico(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <select
                  value={diaEspecifico}
                  onChange={(e) => setDiaEspecifico(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Domingo</option>
                  <option value="2">Lunes</option>
                  <option value="3">Martes</option>
                  <option value="4">Miércoles</option>
                  <option value="5">Jueves</option>
                  <option value="6">Viernes</option>
                  <option value="7">Sábado</option>
                </select>
              )}
            </div>
          )}

          {/* Fecha de inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tipo de finalización */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Finalización
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="indefinido"
                  checked={tipoFinalizacion === 'indefinido'}
                  onChange={(e) => setTipoFinalizacion(e.target.value as any)}
                  className="mr-2"
                />
                Indefinido
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fecha"
                  checked={tipoFinalizacion === 'fecha'}
                  onChange={(e) => setTipoFinalizacion(e.target.value as any)}
                  className="mr-2"
                />
                Hasta fecha específica
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="repeticiones"
                  checked={tipoFinalizacion === 'repeticiones'}
                  onChange={(e) => setTipoFinalizacion(e.target.value as any)}
                  className="mr-2"
                />
                Después de X ocurrencias
              </label>
            </div>
          </div>

          {/* Campos condicionales */}
          {tipoFinalizacion === 'fecha' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de finalización
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {tipoFinalizacion === 'repeticiones' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de ocurrencias
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={numeroRepeticiones}
                onChange={(e) => setNumeroRepeticiones(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

const EntradaRapidaMovimientosUltraRobusta: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovimientoRapido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popoverRecurrencia, setPopoverRecurrencia] = useState<{
    isOpen: boolean;
    movimiento: MovimientoRapido | null;
  }>({ isOpen: false, movimiento: null });

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('listar-configuracion-gastos');
      if (error) throw error;
      setCategorias(data.categorias || []);
    } catch (err: any) {
      console.error('Error cargando categorías:', err);
      setError('Error cargando categorías');
    }
  };

  const generarId = () => Math.random().toString(36).substr(2, 9);

  const agregarFila = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const nuevaFila: MovimientoRapido = {
      id: generarId(),
      modo: 'Unico',
      tipo: 'Egreso',
      categoria_id: '',
      subcategoria_id: '',
      proveedor_cliente: '',
      descripcion: '',
      monto: '',
      fecha_vencimiento: hoy,
      detalles_recurrencia: '',
      estado: 'Pendiente',
      forma_pago: '',
      fiscal: false,
      notas: '',
      origen: 'unico'
    };
    setMovimientos(prev => [...prev, nuevaFila]);
  };

  const eliminarFila = (id: string) => {
    setMovimientos(prev => prev.filter(m => m.id !== id));
  };

  const actualizarMovimiento = (id: string, campo: keyof MovimientoRapido, valor: any) => {
    setMovimientos(prev => 
      prev.map(m => {
        if (m.id === id) {
          const movimientoActualizado = { ...m, [campo]: valor };
          
          // Lógica condicional según el campo modificado
          if (campo === 'modo') {
            if (valor === 'Unico') {
              // Limpiar campos de recurrencia
              movimientoActualizado.detalles_recurrencia = '';
              movimientoActualizado.estado = 'Pendiente';
              movimientoActualizado.fecha_efectiva = undefined;
              movimientoActualizado.origen = 'unico';
            } else if (valor === 'Recurrente') {
              // Establecer valores por defecto para recurrencia
              movimientoActualizado.estado = 'Activa';
              movimientoActualizado.detalles_recurrencia = 'Mensual (día 1) - Indefinido';
              movimientoActualizado.frecuencia = 'Mensual';
              movimientoActualizado.dia_especifico = 1;
              movimientoActualizado.fecha_inicio = movimientoActualizado.fecha_vencimiento;
              movimientoActualizado.origen = 'recurrente';
            }
          }
          
          if (campo === 'categoria_id') {
            movimientoActualizado.subcategoria_id = '';
          }
          
          if (campo === 'tipo') {
            movimientoActualizado.categoria_id = '';
            movimientoActualizado.subcategoria_id = '';
          }
          
          if (campo === 'estado' && valor === 'Completado' && m.modo === 'Unico') {
            // Mostrar campo de fecha efectiva para movimientos únicos completados
            movimientoActualizado.fecha_efectiva = hoy;
          }
          
          return movimientoActualizado;
        }
        return m;
      })
    );
  };

  const getSubcategorias = (categoriaId: string): Subcategoria[] => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.subcategorias || [];
  };

  const validarMovimientos = (): string[] => {
    const errores: string[] = [];
    
    movimientos.forEach((mov, index) => {
      const numeroFila = index + 1;
      
      if (!mov.descripcion.trim()) {
        errores.push(`Fila ${numeroFila}: Descripción es requerida`);
      }
      
      if (!mov.monto || parseFloat(mov.monto) <= 0) {
        errores.push(`Fila ${numeroFila}: Monto debe ser mayor a 0`);
      }
      
      if (!mov.fecha_vencimiento) {
        errores.push(`Fila ${numeroFila}: Fecha de vencimiento es requerida`);
      }
      
      if (mov.modo === 'Recurrente' && !mov.fecha_inicio) {
        errores.push(`Fila ${numeroFila}: Fecha de inicio es requerida para reglas recurrentes`);
      }
    });
    
    return errores;
  };

  const guardarMovimientos = async () => {
    const errores = validarMovimientos();
    if (errores.length > 0) {
      setError(errores.join('\n'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      // Separar movimientos únicos y recurrentes
      const movimientosUnicos = movimientos.filter(mov => mov.modo === 'Unico');
      const movimientosRecurrentes = movimientos.filter(mov => mov.modo === 'Recurrente');

      let totalCreados = 0;

      // Procesar movimientos únicos
      if (movimientosUnicos.length > 0) {
        const movimientosParaEnviar = movimientosUnicos.map(mov => ({
          tipo: mov.tipo,
          categoria_id: mov.categoria_id || null,
          subcategoria_id: mov.subcategoria_id || null,
          proveedor_cliente: mov.proveedor_cliente || null,
          descripcion: mov.descripcion,
          monto: parseFloat(mov.monto),
          fecha_movimiento: mov.fecha_vencimiento,
          fecha_programada: mov.fecha_vencimiento,
          fecha_efectiva: mov.fecha_efectiva || null,
          forma_pago: mov.forma_pago || null,
          fiscal: mov.fiscal,
          notas: mov.notas || null,
          estado: mov.estado
        }));

        const { data: resultadoUnicos, error: errorUnicos } = await supabase.functions.invoke('guardar-movimientos-en-lote', {
          body: { movimientos: movimientosParaEnviar }
        });

        if (errorUnicos) throw errorUnicos;
        totalCreados += resultadoUnicos.movimientos_creados || 0;
      }

      // Procesar movimientos recurrentes
      if (movimientosRecurrentes.length > 0) {
        for (const mov of movimientosRecurrentes) {
          const reglaRecurrente = {
            tipo: mov.tipo,
            categoria_id: mov.categoria_id || null,
            subcategoria_id: mov.subcategoria_id || null,
            proveedor_cliente: mov.proveedor_cliente || null,
            descripcion: mov.descripcion,
            monto: parseFloat(mov.monto),
            frecuencia: mov.frecuencia,
            dia_del_mes: mov.frecuencia === 'Mensual' ? mov.dia_especifico : null,
            dia_de_la_semana: mov.frecuencia === 'Semanal' ? mov.dia_especifico : null,
            fecha_inicio: mov.fecha_inicio,
            fecha_fin: mov.fecha_fin || null,
            numero_repeticiones: mov.numero_repeticiones || null,
            forma_pago: mov.forma_pago || null,
            fiscal: mov.fiscal,
            notas: mov.notas || null,
            activo: mov.estado === 'Activa'
          };

          const { error: errorRecurrente } = await supabase.functions.invoke('crear-regla-recurrente', {
            body: reglaRecurrente
          });

          if (errorRecurrente) throw errorRecurrente;
          totalCreados++;
        }
      }

      setError(null);
      setMovimientos([]);
      alert(`¡Éxito! Se crearon ${totalCreados} movimientos.`);

    } catch (err: any) {
      console.error('Error guardando movimientos:', err);
      setError(err.message || 'Error guardando movimientos');
    } finally {
      setLoading(false);
    }
  };

  const abrirPopoverRecurrencia = (movimiento: MovimientoRapido) => {
    setPopoverRecurrencia({ isOpen: true, movimiento });
  };

  const cerrarPopoverRecurrencia = () => {
    setPopoverRecurrencia({ isOpen: false, movimiento: null });
  };

  const actualizarRecurrencia = (updates: Partial<MovimientoRapido>) => {
    if (popoverRecurrencia.movimiento) {
      actualizarMovimiento(popoverRecurrencia.movimiento.id, 'frecuencia', updates.frecuencia);
      actualizarMovimiento(popoverRecurrencia.movimiento.id, 'dia_especifico', updates.dia_especifico);
      actualizarMovimiento(popoverRecurrencia.movimiento.id, 'fecha_inicio', updates.fecha_inicio);
      actualizarMovimiento(popoverRecurrencia.movimiento.id, 'fecha_fin', updates.fecha_fin);
      actualizarMovimiento(popoverRecurrencia.movimiento.id, 'numero_repeticiones', updates.numero_repeticiones);
      actualizarMovimiento(popoverRecurrencia.movimiento.id, 'detalles_recurrencia', updates.detalles_recurrencia);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">⚡ Entrada Rápida de Movimientos</h2>
            <p className="text-gray-600 text-sm mt-1">
              Crea, edita y elimina Pagos Únicos y Reglas Recurrentes con máxima eficiencia
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Modo de Alta Rápida
            </span>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 font-medium">Error</div>
          <div className="text-red-500 text-sm mt-1 whitespace-pre-line">{error}</div>
        </div>
      )}

      {/* Tabla ultra-robusta */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-hidden">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* MODO - Toggle compacto */}
                <th className="w-16 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MODO
                </th>
                
                {/* TIPO - Icono compacto */}
                <th className="w-16 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                
                {/* CATEGORÍA */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                
                {/* SUBCATEGORÍA */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategoría
                </th>
                
                {/* PROVEEDOR */}
                <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                
                {/* DESCRIPCIÓN */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                
                {/* MONTO */}
                <th className="w-20 px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                
                {/* FECHA DE VENCIMIENTO */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Vencimiento
                </th>
                
                {/* DETALLES DE RECURRENCIA */}
                <th className="w-40 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles Recurrencia
                </th>
                
                {/* ESTADO/FECHA EFECTIVA */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado / Fecha Efectiva
                </th>
                
                {/* FORMA PAGO */}
                <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                
                {/* FISCAL */}
                <th className="w-12 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiscal
                </th>
                
                {/* ACCIONES */}
                <th className="w-16 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientos.map((movimiento, index) => (
                <tr key={movimiento.id} className={`hover:bg-gray-50 ${movimiento.modo === 'Recurrente' ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}>
                  {/* MODO - Toggle compacto */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => actualizarMovimiento(movimiento.id, 'modo', movimiento.modo === 'Unico' ? 'Recurrente' : 'Unico')}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        movimiento.modo === 'Unico' 
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-700' 
                          : 'bg-blue-100 border-blue-400 text-blue-700'
                      }`}
                      title={movimiento.modo === 'Unico' ? 'Click para cambiar a Recurrente' : 'Click para cambiar a Único'}
                    >
                      {movimiento.modo === 'Unico' ? '⚡' : '🔄'}
                    </button>
                  </td>
                  
                  {/* TIPO - Icono compacto */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => actualizarMovimiento(movimiento.id, 'tipo', movimiento.tipo === 'Ingreso' ? 'Egreso' : 'Ingreso')}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        movimiento.tipo === 'Ingreso' 
                          ? 'bg-green-100 border-green-400 text-green-700' 
                          : 'bg-red-100 border-red-400 text-red-700'
                      }`}
                      title={movimiento.tipo === 'Ingreso' ? 'Click para cambiar a Egreso' : 'Click para cambiar a Ingreso'}
                    >
                      {movimiento.tipo === 'Ingreso' ? '⬆️' : '⬇️'}
                    </button>
                  </td>
                  
                  {/* CATEGORÍA */}
                  <td className="px-2 py-3">
                    <select
                      value={movimiento.categoria_id || ''}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'categoria_id', e.target.value)}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Cat.</option>
                      {categorias.filter(c => c.tipo === movimiento.tipo).map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  {/* SUBCATEGORÍA */}
                  <td className="px-2 py-3">
                    <select
                      value={movimiento.subcategoria_id || ''}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'subcategoria_id', e.target.value)}
                      disabled={!movimiento.categoria_id}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!movimiento.categoria_id ? 'Seleccione cat.' : 'Subcat.'}
                      </option>
                      {(movimiento.categoria_id ? getSubcategorias(movimiento.categoria_id) : []).map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  {/* PROVEEDOR */}
                  <td className="px-2 py-3">
                    <input
                      type="text"
                      value={movimiento.proveedor_cliente}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'proveedor_cliente', e.target.value)}
                      placeholder="Proveedor"
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
                      title={movimiento.proveedor_cliente || 'Proveedor/Cliente (Opcional)'}
                    />
                  </td>
                  
                  {/* DESCRIPCIÓN */}
                  <td className="px-2 py-3">
                    <input
                      type="text"
                      value={movimiento.descripcion}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'descripcion', e.target.value)}
                      placeholder="Descripción"
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
                      title={movimiento.descripcion || 'Descripción del movimiento'}
                    />
                  </td>
                  
                  {/* MONTO */}
                  <td className="px-2 py-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={movimiento.monto}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'monto', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs text-right focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  
                  {/* FECHA DE VENCIMIENTO */}
                  <td className="px-2 py-3">
                    <input
                      type="date"
                      value={movimiento.fecha_vencimiento}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'fecha_vencimiento', e.target.value)}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  
                  {/* DETALLES DE RECURRENCIA */}
                  <td className="px-2 py-3">
                    {movimiento.modo === 'Unico' ? (
                      <div className="text-xs text-gray-400 italic">
                        N/A
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={movimiento.detalles_recurrencia}
                          readOnly
                          className="flex-1 border border-gray-300 rounded px-1 py-1 text-xs bg-gray-50 text-gray-700 truncate"
                          title={movimiento.detalles_recurrencia || 'Configurar recurrencia'}
                        />
                        <button
                          onClick={() => abrirPopoverRecurrencia(movimiento)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Configurar recurrencia"
                        >
                          ⚙️
                        </button>
                      </div>
                    )}
                  </td>
                  
                  {/* ESTADO/FECHA EFECTIVA */}
                  <td className="px-2 py-3">
                    <div className="space-y-1">
                      <select
                        value={movimiento.estado}
                        onChange={(e) => actualizarMovimiento(movimiento.id, 'estado', e.target.value)}
                        className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        {movimiento.modo === 'Unico' ? (
                          <>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Completado">Completado</option>
                            <option value="Cancelado">Cancelado</option>
                          </>
                        ) : (
                          <>
                            <option value="Activa">Activa</option>
                            <option value="Pausada">Pausada</option>
                            <option value="Inactiva">Inactiva</option>
                          </>
                        )}
                      </select>
                      
                      {movimiento.modo === 'Unico' && movimiento.estado === 'Completado' && (
                        <input
                          type="date"
                          value={movimiento.fecha_efectiva || ''}
                          onChange={(e) => actualizarMovimiento(movimiento.id, 'fecha_efectiva', e.target.value)}
                          placeholder="Fecha efectiva"
                          className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  </td>
                  
                  {/* FORMA PAGO */}
                  <td className="px-2 py-3">
                    <input
                      type="text"
                      value={movimiento.forma_pago}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'forma_pago', e.target.value)}
                      placeholder="Efectivo..."
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
                      title={movimiento.forma_pago || 'Forma de pago'}
                    />
                  </td>
                  
                  {/* FISCAL */}
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={movimiento.fiscal}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'fiscal', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  
                  {/* ACCIONES */}
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => eliminarFila(movimiento.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Eliminar fila"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          onClick={agregarFila}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + Agregar Fila
        </button>
        <button
          onClick={guardarMovimientos}
          disabled={loading || movimientos.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </button>
      </div>

      {/* Resumen */}
      {movimientos.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total de movimientos: <span className="font-medium">{movimientos.length}</span>
            </div>
            <div className="text-sm text-gray-500">
              {movimientos.filter(m => m.modo === 'Unico').length} únicos, {movimientos.filter(m => m.modo === 'Recurrente').length} recurrentes
            </div>
          </div>
        </div>
      )}

      {/* Popover de recurrencia */}
      {popoverRecurrencia.movimiento && (
        <PopoverRecurrencia
          isOpen={popoverRecurrencia.isOpen}
          onClose={cerrarPopoverRecurrencia}
          movimiento={popoverRecurrencia.movimiento}
          onUpdate={actualizarRecurrencia}
        />
      )}
    </div>
  );
};

export default EntradaRapidaMovimientosUltraRobusta;




