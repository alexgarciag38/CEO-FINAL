import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import TableRow from './TableRow';
import IconToggle from '@/components/ui/IconToggle';
import { DocumentIcon, PlusIcon } from '@/components/ui/ProfessionalIcons';
import './RegistrosRapidos.css';

interface MovimientoRapido {
  id: string;
  modo: 'Unico' | 'Recurrente';
  tipo: 'Ingreso' | 'Egreso';
  categoriaId: string;
  subcategoriaId: string;
  proveedor_cliente: string;
  descripcion: string;
  monto: number;
  fecha_movimiento: string;
  fecha_programada: string;
  fecha_inicio: string;
  frecuencia: 'mensual' | 'semanal' | 'quincenal' | 'anual';
  dia_especifico: number;
  dia_semana: string;
  fecha_fin: string;
  numero_repeticiones: number;
  estado: 'Pendiente' | 'Completado' | 'Cancelado';
  estado_regla: 'Activa' | 'Pausada' | 'Inactiva';
  fecha_efectiva: string;
  es_fiscal: boolean;
  origen: 'unico' | 'recurrente';
}

interface Categoria {
  id: string;
  nombre: string;
  color: string;
}

interface Subcategoria {
  id: string;
  nombre: string;
  color: string;
  categoria_id: string;
}

interface RegistrosRapidosProps {
  autoAddRow?: boolean;
}

const RegistrosRapidos: React.FC<RegistrosRapidosProps> = ({ autoAddRow = false }) => {
  const [movimientos, setMovimientos] = useState<MovimientoRapido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías y subcategorías
  useEffect(() => {
    loadCategorias('Egreso'); // Cargar categorías de Egreso por defecto
    loadSubcategorias();
  }, []);

  // Auto-agregar fila si se especifica
  useEffect(() => {
    if (autoAddRow && movimientos.length === 0) {
      agregarFila();
    }
  }, [autoAddRow]);

  const loadCategorias = async (tipo?: 'Ingreso' | 'Egreso') => {
    try {
      let query = supabase
        .from('categorias_financieras')
        .select('id, nombre, color, tipo')
        .order('nombre');

      // Filtrar por tipo si se especifica
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadSubcategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategorias_financieras')
        .select('id, nombre, color, categoria_id')
        .order('nombre');

      if (error) throw error;
      setSubcategorias(data || []);
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
    }
  };

  const generarId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const agregarFila = () => {
    const nuevoMovimiento: MovimientoRapido = {
      id: generarId(),
      modo: 'Unico',
      tipo: 'Egreso',
      categoriaId: '',
      subcategoriaId: '',
      proveedor_cliente: '',
      descripcion: '',
      monto: 0,
      fecha_movimiento: new Date().toISOString().split('T')[0],
      fecha_programada: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      frecuencia: 'mensual',
      dia_especifico: 1,
      dia_semana: 'lunes',
      fecha_fin: '',
      numero_repeticiones: 0,
      estado: 'Pendiente',
      estado_regla: 'Activa',
      fecha_efectiva: '',
      es_fiscal: false,
      origen: 'unico'
    };

    setMovimientos(prev => [...prev, nuevoMovimiento]);
  };

  const actualizarMovimiento = (id: string, field: string, value: any) => {
    console.log('RegistrosRapidos - actualizarMovimiento:', { id, field, value });
    setMovimientos(prev => prev.map(mov => {
      if (mov.id === id) {
        const updated = { ...mov, [field]: value };
        console.log('RegistrosRapidos - Movimiento actualizado:', updated);
        
        // Lógica especial para cambio de modo
        if (field === 'modo') {
          if (value === 'Unico') {
            updated.origen = 'unico';
            // Resetear campos de recurrencia
            updated.frecuencia = 'mensual';
            updated.dia_especifico = 1;
            updated.dia_semana = 'lunes';
            updated.fecha_fin = '';
            updated.numero_repeticiones = 0;
            updated.estado_regla = 'Activa';
          } else {
            updated.origen = 'recurrente';
            // Resetear campos de único
            updated.fecha_movimiento = '';
            updated.fecha_programada = '';
            updated.estado = 'Pendiente';
            updated.fecha_efectiva = '';
          }
        }

        // Lógica especial para cambio de tipo - recargar categorías
        if (field === 'tipo') {
          updated.categoriaId = '';
          updated.subcategoriaId = '';
          // Recargar categorías para el nuevo tipo
          loadCategorias(value);
        }

        // Lógica especial para cambio de categoría
        if (field === 'categoriaId') {
          updated.subcategoriaId = '';
        }

        return updated;
      }
      return mov;
    }));
  };

  const eliminarFila = (id: string) => {
    setMovimientos(prev => prev.filter(mov => mov.id !== id));
  };

  const editarFila = (id: string) => {
    // TODO: Implementar modal de edición detallada
    console.log('Editar fila:', id);
  };

  const guardarMovimientos = async () => {
    if (movimientos.length === 0) {
      setError('No hay movimientos para guardar');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Separar movimientos únicos y recurrentes
      const movimientosUnicos = movimientos.filter(mov => mov.modo === 'Unico');
      const movimientosRecurrentes = movimientos.filter(mov => mov.modo === 'Recurrente');

      // Guardar movimientos únicos
      if (movimientosUnicos.length > 0) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Usuario no autenticado');

        const movimientosParaInsertar = movimientosUnicos.map(mov => ({
          usuario_id: user.user.id,
          tipo: mov.tipo,
          categoria_id: mov.categoriaId,
          subcategoria_id: mov.subcategoriaId,
          proveedor_cliente: mov.proveedor_cliente,
          descripcion: mov.descripcion,
          monto: mov.monto,
          fecha_movimiento: mov.fecha_movimiento,
          fecha_programada: mov.fecha_programada,
          estado: mov.estado,
          fecha_efectiva: mov.fecha_efectiva || null,
          es_fiscal: mov.es_fiscal,
          origen: mov.origen
        }));

        const { error: errorUnicos } = await supabase.functions.invoke('guardar-movimientos-en-lote', {
          body: { movimientos: movimientosParaInsertar }
        });

        if (errorUnicos) throw errorUnicos;
      }

      // Guardar reglas recurrentes
      if (movimientosRecurrentes.length > 0) {
        for (const mov of movimientosRecurrentes) {
          const { data: user } = await supabase.auth.getUser();
          if (!user.user) throw new Error('Usuario no autenticado');

          const reglaParaInsertar = {
            usuario_id: user.user.id,
            tipo: mov.tipo,
            categoria_id: mov.categoriaId,
            subcategoria_id: mov.subcategoriaId,
            proveedor_cliente: mov.proveedor_cliente,
            descripcion: mov.descripcion,
            monto: mov.monto,
            frecuencia: mov.frecuencia,
            dia_especifico: mov.dia_especifico,
            dia_semana: mov.dia_semana,
            fecha_inicio: mov.fecha_inicio,
            fecha_fin: mov.fecha_fin || null,
            numero_repeticiones: mov.numero_repeticiones || null,
            estado: mov.estado_regla,
            es_fiscal: mov.es_fiscal
          };

          const { error: errorRecurrente } = await supabase.functions.invoke('crear-regla-recurrente', {
            body: reglaParaInsertar
          });

          if (errorRecurrente) throw errorRecurrente;
        }
      }

      // Limpiar tabla después de guardar
      setMovimientos([]);
      setError(null);
      
      // Mostrar mensaje de éxito
      alert('Movimientos guardados exitosamente');

    } catch (error) {
      console.error('Error guardando movimientos:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const validarMovimientos = () => {
    const errores: string[] = [];

    movimientos.forEach((mov, index) => {
      if (!mov.categoriaId) errores.push(`Fila ${index + 1}: Categoría requerida`);
      if (!mov.subcategoriaId) errores.push(`Fila ${index + 1}: Subcategoría requerida`);
      if (!mov.proveedor_cliente.trim()) errores.push(`Fila ${index + 1}: Proveedor/Cliente requerido`);
      if (!mov.descripcion.trim()) errores.push(`Fila ${index + 1}: Descripción requerida`);
      if (mov.monto <= 0) errores.push(`Fila ${index + 1}: Monto debe ser mayor a 0`);

      if (mov.modo === 'Unico') {
        if (!mov.fecha_movimiento) errores.push(`Fila ${index + 1}: Fecha de movimiento requerida`);
      } else {
        if (!mov.fecha_inicio) errores.push(`Fila ${index + 1}: Fecha de inicio requerida`);
      }
    });

    return errores;
  };

  const handleGuardar = async () => {
    const errores = validarMovimientos();
    if (errores.length > 0) {
      setError(errores.join('\n'));
      return;
    }

    await guardarMovimientos();
  };

  return (
    <div className="space-y-6">
      {/* Header del Centro de Registros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <DocumentIcon />
              Registros Rápidos
            </h2>
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

      {/* Controles de la tabla */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={agregarFila}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <PlusIcon />
              Agregar Fila
            </button>
            <span className="text-sm text-gray-500">
              {movimientos.length} fila{movimientos.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleGuardar}
            disabled={saving || movimientos.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Tabla de movimientos - SIN SCROLL HORIZONTAL */}
        <div className="registro-rapido-container">
          <table className="registro-rapido-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MODO
                </th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TIPO
                </th>
                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CATEGORÍA
                </th>
                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SUBCAT.
                </th>
                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PROVEEDOR
                </th>
                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DESCRIPCIÓN
                </th>
                <th className="px-1 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MONTO
                </th>
                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FECHA VENC.
                </th>
                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DETALLES REC.
                </th>
                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ESTADO
                </th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FISCAL
                </th>
                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <TableRow
                  key={movimiento.id}
                  movimiento={movimiento}
                  categorias={categorias}
                  subcategorias={subcategorias}
                  onUpdate={actualizarMovimiento}
                  onDelete={eliminarFila}
                  onEdit={editarFila}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Leyenda de la tabla */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Movimiento Único</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span>Regla Recurrente</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-xs">I</span>
              </div>
              <span>Ingreso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 font-bold text-xs">E</span>
              </div>
              <span>Egreso</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrosRapidos;
