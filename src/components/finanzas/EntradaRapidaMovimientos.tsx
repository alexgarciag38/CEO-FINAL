import React, { useState, useEffect } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
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
  fecha_movimiento: string;
  fecha_programada: string;
  forma_pago: string;
  fiscal: boolean;
  // Campos específicos para recurrente
  frecuencia?: 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';
  dia_especifico?: number; // Para día del mes (1-31) o día de la semana (1-7)
  fecha_inicio?: string;
  fecha_fin?: string;
  numero_repeticiones?: number;
  origen?: 'unico' | 'recurrente';
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: 'Ingreso' | 'Egreso';
  color?: string | null;
  subcategorias: Subcategoria[];
}

interface Subcategoria {
  id: string;
  nombre: string;
}

interface EntradaRapidaMovimientosProps {
  onGuardarExitoso?: () => void;
  autoAddRow?: boolean;
}

const EntradaRapidaMovimientos: React.FC<EntradaRapidaMovimientosProps> = ({ onGuardarExitoso, autoAddRow = false }) => {
  const [movimientos, setMovimientos] = useState<MovimientoRapido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarCategorias();
    // Agregar una fila inicial solo si autoAddRow es true
    if (autoAddRow) {
      agregarFila();
    }
  }, [autoAddRow]);

  const cargarCategorias = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { data, error } = await supabase.functions.invoke('listar-configuracion-gastos', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {}
      });

      if (error) throw error;
      setCategorias(data.categorias || []);
    } catch (err: any) {
      console.error('Error cargando categorías:', err);
    }
  };

  const generarId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
      fecha_movimiento: hoy,
      fecha_programada: hoy,
      forma_pago: '',
      fiscal: false,
      // Campos de recurrencia con valores por defecto
      frecuencia: 'Mensual',
      dia_especifico: 1,
      fecha_inicio: hoy,
      fecha_fin: '',
      numero_repeticiones: undefined,
      origen: 'unico'
    };
    setMovimientos(prev => [...prev, nuevaFila]);
  };

  const eliminarFila = (id: string) => {
    setMovimientos(prev => prev.filter(m => m.id !== id));
  };

  const actualizarMovimiento = (id: string, campo: keyof MovimientoRapido, valor: string | boolean | number) => {
    console.log('actualizarMovimiento called:', { id, campo, valor });
    setMovimientos(prev => 
      prev.map(m => {
        if (m.id === id) {
          const movimientoActualizado = { ...m, [campo]: valor };
          
          // Si se cambia la categoría, limpiar la subcategoría
          if (campo === 'categoria_id') {
            movimientoActualizado.subcategoria_id = '';
          }
          
          // Si se cambia el tipo, limpiar categoría y subcategoría
          if (campo === 'tipo') {
            movimientoActualizado.categoria_id = '';
            movimientoActualizado.subcategoria_id = '';
          }
          
          // Si se cambia el modo, resetear campos específicos
          if (campo === 'modo') {
            if (valor === 'Unico') {
              // Limpiar campos de recurrencia
              movimientoActualizado.frecuencia = undefined;
              movimientoActualizado.dia_especifico = undefined;
              movimientoActualizado.fecha_inicio = undefined;
              movimientoActualizado.fecha_fin = undefined;
              movimientoActualizado.numero_repeticiones = undefined;
              movimientoActualizado.origen = 'unico';
            } else if (valor === 'Recurrente') {
              // Establecer valores por defecto para recurrencia
              movimientoActualizado.frecuencia = 'Mensual';
              movimientoActualizado.dia_especifico = 1;
              movimientoActualizado.fecha_inicio = movimientoActualizado.fecha_movimiento;
              movimientoActualizado.origen = 'recurrente';
            }
          }
          
          return movimientoActualizado;
        }
        return m;
      })
    );
  };

  // Función para obtener subcategorías de una categoría específica
  const getSubcategorias = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.subcategorias || [];
  };

  const validarMovimientos = (): string[] => {
    const errores: string[] = [];
    
    movimientos.forEach((mov, index) => {
      if (!mov.descripcion.trim()) {
        errores.push(`Fila ${index + 1}: Descripción es requerida`);
      }
      if (!mov.monto || parseFloat(mov.monto) <= 0) {
        errores.push(`Fila ${index + 1}: Monto debe ser mayor a 0`);
      }
      
      if (mov.modo === 'Unico') {
        if (!mov.fecha_movimiento) {
          errores.push(`Fila ${index + 1}: Fecha de movimiento es requerida`);
        }
      } else if (mov.modo === 'Recurrente') {
        if (!mov.fecha_inicio) {
          errores.push(`Fila ${index + 1}: Fecha de inicio es requerida para reglas recurrentes`);
        }
        if (!mov.frecuencia) {
          errores.push(`Fila ${index + 1}: Frecuencia es requerida para reglas recurrentes`);
        }
        if (!mov.dia_especifico || mov.dia_especifico < 1) {
          errores.push(`Fila ${index + 1}: Día específico debe ser mayor a 0`);
        }
      }
    });
    
    return errores;
  };

  const guardarMovimientos = async () => {
    const errores = validarMovimientos();
    if (errores.length > 0) {
      setError('Errores de validación:\n' + errores.join('\n'));
      return;
    }

    setSaving(true);
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
          proveedor_cliente: mov.proveedor_cliente,
          descripcion: mov.descripcion,
          monto: parseFloat(mov.monto),
          fecha_movimiento: mov.fecha_movimiento,
          fecha_programada: mov.fecha_programada || mov.fecha_movimiento,
          forma_pago: mov.forma_pago,
          fiscal: mov.fiscal,
          estado: 'Registrado'
        }));

        const { data: dataUnicos, error: errorUnicos } = await supabase.functions.invoke('guardar-movimientos-en-lote', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { movimientos: movimientosParaEnviar }
        });

        if (errorUnicos) throw errorUnicos;
        totalCreados += dataUnicos.movimientos_creados || 0;
      }

      // Procesar reglas recurrentes
      if (movimientosRecurrentes.length > 0) {
        for (const mov of movimientosRecurrentes) {
          const reglaRecurrente = {
            tipo: mov.tipo,
            categoria_id: mov.categoria_id || null,
            subcategoria_id: mov.subcategoria_id || null,
            proveedor_cliente: mov.proveedor_cliente,
            descripcion: mov.descripcion,
            monto: parseFloat(mov.monto),
            forma_pago: mov.forma_pago,
            fiscal: mov.fiscal,
            frecuencia: mov.frecuencia,
            dia_especifico: mov.dia_especifico,
            fecha_inicio: mov.fecha_inicio,
            fecha_fin: mov.fecha_fin || null,
            numero_repeticiones: mov.numero_repeticiones || null
          };

          const { error: errorRecurrente } = await supabase.functions.invoke('crear-regla-recurrente', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: reglaRecurrente
          });

          if (errorRecurrente) throw errorRecurrente;
          totalCreados += 1;
        }
      }

      // Limpiar el formulario después de guardar
      setMovimientos([]);
      agregarFila();
      
      alert(`Se guardaron ${totalCreados} registros exitosamente (${movimientosUnicos.length} únicos, ${movimientosRecurrentes.length} recurrentes)`);
    } catch (err: any) {
      console.error('Error guardando movimientos:', err);
      setError('Error al guardar movimientos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatearMoneda = (valor: string) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) return '';
    return numero.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-6">
      {/* Header - Solo se muestra si no está en el contexto de Registros Rápidos */}
      {!window.location.pathname.includes('/registros') && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">⚡ Entrada Rápida de Movimientos</h3>
            <p className="text-sm text-gray-600 mt-1">
              Agrega múltiples movimientos de forma rápida y eficiente
            </p>
          </div>
        </div>
      )}

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
          disabled={saving || movimientos.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 font-medium">Error</div>
          <div className="text-red-500 text-sm mt-1 whitespace-pre-line">{error}</div>
        </div>
      )}

      {/* Tabla de movimientos optimizada */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-hidden">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* MODO - Columna compacta */}
                <th className="w-16 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <span>MODO</span>
                    <span className="text-xs text-gray-400" title="Click para cambiar">🔄</span>
                  </div>
                </th>
                
                {/* TIPO - Icono compacto */}
                <th className="w-16 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                
                {/* CATEGORÍA - Ancho fijo */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                
                {/* SUBCATEGORÍA - Ancho fijo */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategoría
                </th>
                
                {/* PROVEEDOR/CLIENTE - Texto truncado */}
                <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                
                {/* DESCRIPCIÓN - Texto truncado */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                
                {/* MONTO - Ancho fijo */}
                <th className="w-20 px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                
                {/* FECHA/FRECUENCIA - Condicional */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha / Frecuencia
                </th>
                
                {/* PROGRAMACIÓN - Condicional */}
                <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Programación
                </th>
                
                {/* FORMA PAGO - Compacto */}
                <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                
                {/* FISCAL - Checkbox */}
                <th className="w-12 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiscal
                </th>
                
                {/* ACCIONES - Compacto */}
                <th className="w-16 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientos.map((movimiento, index) => (
                <tr key={movimiento.id} className={`hover:bg-gray-50 ${movimiento.modo === 'Recurrente' ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}>
                  {/* MODO - Toggle compacto de icono */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => actualizarMovimiento(movimiento.id, 'modo', movimiento.modo === 'Unico' ? 'Recurrente' : 'Unico')}
                      className="group relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: movimiento.modo === 'Unico' ? '#F3F4F6' : '#EFF6FF',
                        borderColor: movimiento.modo === 'Unico' ? '#D1D5DB' : '#3B82F6'
                      }}
                      title={movimiento.modo === 'Unico' ? 'Click para cambiar a Recurrente' : 'Click para cambiar a Único'}
                    >
                      <span className="text-sm">
                        {movimiento.modo === 'Unico' ? '⚡' : '🔄'}
                      </span>
                    </button>
                  </td>
                  
                  {/* TIPO - Selector de icono compacto */}
                  <td className="px-2 py-3 text-center">
                    <select
                      value={movimiento.tipo}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'tipo', e.target.value as 'Ingreso' | 'Egreso')}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Egreso">⬇️ Egreso</option>
                      <option value="Ingreso">⬆️ Ingreso</option>
                    </select>
                  </td>
                  
                  {/* CATEGORÍA - Select compacto */}
                  <td className="px-2 py-3">
                    <select
                      value={movimiento.categoria_id || ''}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'categoria_id', e.target.value)}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar</option>
                      {categorias.filter(c => c.tipo === movimiento.tipo).map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  {/* SUBCATEGORÍA - Select compacto */}
                  <td className="px-2 py-3">
                    <select
                      value={movimiento.subcategoria_id || ''}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'subcategoria_id', e.target.value)}
                      disabled={!movimiento.categoria_id}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!movimiento.categoria_id ? 'Seleccione cat.' : 'Seleccionar'}
                      </option>
                      {(movimiento.categoria_id ? getSubcategorias(movimiento.categoria_id) : []).map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  {/* PROVEEDOR/CLIENTE - Texto truncado con tooltip */}
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
                  
                  {/* DESCRIPCIÓN - Texto truncado con tooltip */}
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
                  
                  {/* MONTO - Input numérico compacto */}
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
                  {/* FECHA/FRECUENCIA - Condicional optimizado */}
                  <td className="px-2 py-3">
                    {movimiento.modo === 'Unico' ? (
                      <input
                        type="date"
                        value={movimiento.fecha_movimiento}
                        onChange={(e) => actualizarMovimiento(movimiento.id, 'fecha_movimiento', e.target.value)}
                        className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="space-y-1">
                        <select
                          value={movimiento.frecuencia || 'Mensual'}
                          onChange={(e) => actualizarMovimiento(movimiento.id, 'frecuencia', e.target.value as any)}
                          className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Diaria">Diaria</option>
                          <option value="Semanal">Semanal</option>
                          <option value="Quincenal">Quincenal</option>
                          <option value="Mensual">Mensual</option>
                          <option value="Anual">Anual</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={movimiento.dia_especifico || 1}
                          onChange={(e) => actualizarMovimiento(movimiento.id, 'dia_especifico', parseInt(e.target.value))}
                          placeholder="Día"
                          className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </td>
                  
                  {/* PROGRAMACIÓN - Condicional optimizado */}
                  <td className="px-2 py-3">
                    {movimiento.modo === 'Unico' ? (
                      <input
                        type="date"
                        value={movimiento.fecha_programada}
                        onChange={(e) => actualizarMovimiento(movimiento.id, 'fecha_programada', e.target.value)}
                        className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="date"
                          value={movimiento.fecha_inicio || ''}
                          onChange={(e) => actualizarMovimiento(movimiento.id, 'fecha_inicio', e.target.value)}
                          placeholder="Inicio"
                          className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="date"
                          value={movimiento.fecha_fin || ''}
                          onChange={(e) => actualizarMovimiento(movimiento.id, 'fecha_fin', e.target.value)}
                          placeholder="Fin (opc)"
                          className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </td>
                  
                  {/* FORMA PAGO - Input compacto */}
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
                  
                  {/* FISCAL - Checkbox centrado */}
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={movimiento.fiscal}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'fiscal', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  
                  {/* ACCIONES - Botón compacto */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => eliminarFila(movimiento.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      title="Eliminar fila"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda explicativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-blue-500 text-sm">💡</span>
          </div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">¿Cómo funciona el MODO?</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                  <span>⚡</span> Único
                </span>
                <span>→</span>
                <span>Pago de una sola vez con fecha específica</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">
                  <span>🔄</span> Recurrente
                </span>
                <span>→</span>
                <span>Regla que se repite automáticamente</span>
              </div>
              <p className="text-blue-600 mt-2">
                <strong>Tip:</strong> Haz click en el botón del MODO para cambiar entre los dos tipos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {movimientos.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total de movimientos: <span className="font-medium">{movimientos.length}</span>
            </div>
            <div className="text-sm text-gray-600">
              Monto total: <span className="font-medium">
                ${movimientos.reduce((sum, mov) => {
                  const monto = parseFloat(mov.monto) || 0;
                  return mov.tipo === 'Ingreso' ? sum + monto : sum - monto;
                }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntradaRapidaMovimientos;
