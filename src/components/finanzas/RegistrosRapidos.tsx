import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { supabase } from '@/lib/supabase';
import TableRow from './TableRow';
// import IconToggle from '@/components/ui/IconToggle';
import { DocumentIcon, PlusIcon } from '@/components/ui/ProfessionalIcons';
import { 
  TableContext, 
  tableReducer, 
  initialState,
  type TableContextType
} from './TableContext';
import './RegistrosRapidos.css';

// ===== INTERFACES EXISTENTES =====

interface MovimientoRapido {
  id: string;
  modo: 'Unico' | 'Recurrente';
  tipo: 'Ingreso' | 'Egreso';
  categoriaId: string;
  subcategoriaId: string;
  metodoCategoriaId: string;
  metodoSubcategoriaId: string;
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
  tipo: 'Ingreso' | 'Egreso';
}

interface Subcategoria {
  id: string;
  nombre: string;
  color: string;
  categoria_id: string;
}

interface MetodoCat {
  id: string;
  nombre: string;
  color: string | null;
  tipo: 'Ingreso' | 'Egreso';
}

interface MetodoSub {
  id: string;
  nombre: string;
  categoria_id: string;
  activa: boolean;
}

interface PCItem { id: string; nombre: string; }

interface RegistrosRapidosProps {
  autoAddRow?: boolean;
}

// ===== COMPONENTE PRINCIPAL =====

const RegistrosRapidos: React.FC<RegistrosRapidosProps> = ({ autoAddRow = false }) => {
  // ===== ESTADO PRINCIPAL =====
  const [state, dispatch] = useReducer(tableReducer, initialState);
  const [movimientos, setMovimientos] = useState<MovimientoRapido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [metCats, setMetCats] = useState<MetodoCat[]>([]);
  const [metSubs, setMetSubs] = useState<MetodoSub[]>([]);
  const [proveedores, setProveedores] = useState<PCItem[]>([]);
  const [clientes, setClientes] = useState<PCItem[]>([]);
  // const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ===== REFERENCIAS =====
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const tableRef = useRef<HTMLTableElement>(null);

  // ===== FUNCIONES DE UTILIDAD =====

  const getCellKey = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  const registerCellRef = useCallback((rowIndex: number, colIndex: number, element: HTMLElement | null) => {
    if (element) {
      cellRefs.current.set(getCellKey(rowIndex, colIndex), element);
    } else {
      cellRefs.current.delete(getCellKey(rowIndex, colIndex));
    }
  }, []);

  // ===== FUNCIONES DE CARGA DE DATOS =====

  const loadCategorias = async () => {
    try {
      let query = supabase
        .from('categorias_financieras')
        .select('id, nombre, color, tipo')
        .order('nombre');

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

  const loadMetodoCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('metodos_pago_categorias')
        .select('id,nombre,color,tipo,activa')
        .order('nombre');
      if (error) throw error;
      setMetCats((data || []).map((c: any) => ({ id: c.id, nombre: c.nombre, color: c.color, tipo: c.tipo })));
    } catch (error) {
      console.error('Error cargando métodos (categorías):', error);
    }
  };

  const loadMetodoSubcategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('metodos_pago_subcategorias')
        .select('id,nombre,categoria_id,activa')
        .order('nombre');
      if (error) throw error;
      setMetSubs((data || []).map((s: any) => ({ id: s.id, nombre: s.nombre, categoria_id: s.categoria_id, activa: !!s.activa })));
    } catch (error) {
      console.error('Error cargando métodos (subcategorías):', error);
    }
  };

  const loadProveedores = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id,nombre')
        .order('nombre');
      if (error) throw error;
      setProveedores((data || []) as any);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id,nombre')
        .order('nombre');
      if (error) throw error;
      setClientes((data || []) as any);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  // ===== FUNCIONES DE MOVIMIENTOS =====

  const generarId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const agregarFila = () => {
    const nuevoMovimiento: MovimientoRapido = {
      id: generarId(),
      modo: 'Unico',
      tipo: 'Egreso',
      categoriaId: '',
      subcategoriaId: '',
      metodoCategoriaId: '',
      metodoSubcategoriaId: '',
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

  const actualizarMovimiento = useCallback((id: string, field: string, value: any) => {
    setMovimientos(prev => prev.map(mov => {
      if (mov.id === id) {
        const updated = { ...mov, [field]: value };
        
        // Lógica especial para cambio de modo
        if (field === 'modo') {
          if (value === 'Unico') {
            updated.origen = 'unico';
            updated.frecuencia = 'mensual';
            updated.dia_especifico = 1;
            updated.dia_semana = 'lunes';
            updated.fecha_fin = '';
            updated.numero_repeticiones = 0;
            updated.estado_regla = 'Activa';
          } else {
            updated.origen = 'recurrente';
            updated.fecha_movimiento = '';
            updated.fecha_programada = '';
            updated.estado = 'Pendiente';
            updated.fecha_efectiva = '';
          }
        }

        // Lógica especial para cambio de tipo - limpiar selección de categoría/subcategoría solo en esta fila
        if (field === 'tipo') {
          updated.categoriaId = '';
          updated.subcategoriaId = '';
          updated.metodoCategoriaId = '';
          updated.metodoSubcategoriaId = '';
        }

        // Lógica especial para cambio de categoría
        if (field === 'categoriaId') {
          updated.subcategoriaId = '';
        }

        if (field === 'metodoCategoriaId') {
          updated.metodoSubcategoriaId = '';
        }

        return updated;
      }
      return mov;
    }));
  }, []);

  const eliminarFila = (id: string) => {
    setMovimientos(prev => prev.filter(mov => mov.id !== id));
  };

  const confirmarEliminarFila = () => {
    if (!confirmDeleteId) return;
    eliminarFila(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const cancelarEliminarFila = () => setConfirmDeleteId(null);

  const editarFila = (id: string) => {
    console.log('Editar fila:', id);
  };

  // ===== ORQUESTADOR ÚNICO DE EVENTOS KEYDOWN =====

  const handleTableKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, shiftKey, metaKey, ctrlKey } = event;
    const { focusedCell, isEditing, activeDropdown } = state;

    if (metaKey || ctrlKey) return; // Permitir copy/paste etc.

    // Helpers locales
    const isTextInputFocused = () => {
      if (!focusedCell) return false;
      const textInputCols = [5, 6];
      return textInputCols.includes(focusedCell.col);
    };
    const isDateInputFocused = () => {
      if (!focusedCell) return false;
      return focusedCell.col === 8;
    };

    // --- PRIORIDAD 0: Modal de confirmación de borrado activo ---
    if (confirmDeleteId) {
      if (key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        confirmarEliminarFila();
      } else if (key === 'Escape' || key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        cancelarEliminarFila();
      }
      return;
    }

    // --- PRIORIDAD 1: Dropdown activo (solo si la celda enfocada coincide) ---
    const dropdownIsForFocusedCell = !!activeDropdown && !!focusedCell && activeDropdown.row === focusedCell.row && (activeDropdown.col === focusedCell.col || (activeDropdown.col as any) === 70 && focusedCell.col === 7);
    if (activeDropdown && dropdownIsForFocusedCell) {
      // Manejar teclas globalmente para evitar que la página haga scroll
      const optionsCount = 9999; // real se gestiona en reducer por límites
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: 'HIGHLIGHT_DROPDOWN_OPTION', payload: { direction: key === 'ArrowUp' ? 'up' : 'down', optionsCount } });
      } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        // Cerrar dropdown y navegar lateralmente (evitar scroll de página)
        event.preventDefault();
        event.stopPropagation();
        const direction = key === 'ArrowLeft' ? 'left' : 'right';
        dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
        dispatch({ type: 'MOVE_FOCUS', payload: { direction, maxRows: movimientos.length, maxCols: 13 } });
      } else if (key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        // Intentar seleccionar vía ref del WorkingSelect en la celda activa
        const { row, col } = activeDropdown;
        const lookupCol = (col as any) === 70 ? 7 : col;
        const cellEl = cellRefs.current.get(getCellKey(row, lookupCol));
        const api = cellEl ? (cellEl as any).workingSelect : null;
        if (api && api.selectHighlighted) {
          api.selectHighlighted();
        } else {
          // Fallback: Selección vía reducer
          dispatch({ type: 'SELECT_DROPDOWN_OPTION' });
        }
      } else if (key === 'Escape' || key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
      }
      return;
    } else if (activeDropdown && !dropdownIsForFocusedCell) {
      // Si hay un dropdown abierto de otra celda, ciérralo y, si fue una flecha, navega también
      if (key === 'Enter' || key.startsWith('Arrow') || key === 'Escape' || key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
        if (key.startsWith('Arrow') && state.focusedCell) {
          const direction = key.replace('Arrow', '').toLowerCase() as any;
          dispatch({ type: 'MOVE_FOCUS', payload: { direction, maxRows: movimientos.length, maxCols: 13 } });
        }
      }
    }

    // --- PRIORIDAD 2: Una celda de texto está en modo edición ---
    if (isEditing && isTextInputFocused()) {
      if (key === 'Escape') {
      event.preventDefault();
        dispatch({ type: 'STOP_EDITING' }); // Cancelar cambios se maneja en el reducer/componente
        return;
      } else if (key === 'Enter' || key === 'Tab') {
        event.preventDefault();
        dispatch({ type: 'STOP_EDITING' });
        if (key === 'Enter' || (key === 'Tab' && !shiftKey)) {
          dispatch({ type: 'MOVE_FOCUS', payload: { direction: 'right', maxRows: movimientos.length, maxCols: 13 } });
        } else if (key === 'Tab' && shiftKey) {
          dispatch({ type: 'MOVE_FOCUS', payload: { direction: 'left', maxRows: movimientos.length, maxCols: 13 } });
        }
        return;
      } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
        // Salir de edición y navegar con flechas incluso si el input está activo
        event.preventDefault();
        const direction = key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        dispatch({ type: 'STOP_EDITING' });
        dispatch({ type: 'MOVE_FOCUS', payload: { direction, maxRows: movimientos.length, maxCols: 13 } });
        return;
      }
      // Dejar que el input maneje otras teclas
      return;
    }

    // Nota: no retornamos aquí para fecha; las flechas deben poder salir de edición y navegar
    
    // --- PRIORIDAD 3: Una celda está seleccionada (navegación) ---
    if (focusedCell) {
        // Navegación con flechas
      if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
          console.log('RegistrosRapidos - Flecha presionada:', { key, isEditing: state.isEditing, isTextInputFocused: isTextInputFocused(), isDateInputFocused: isDateInputFocused() });
          const direction = key.replace('Arrow', '').toLowerCase() as any;
          // Si estamos editando (text o fecha): guardar y salir de edición + mover (estilo Excel)
          if (state.isEditing && (isTextInputFocused() || isDateInputFocused())) {
            event.preventDefault();
            // Guardado implícito: ya se sincroniza onChange del input controlado
            dispatch({ type: 'STOP_EDITING' });
            dispatch({ type: 'MOVE_FOCUS', payload: { direction, maxRows: movimientos.length, maxCols: 13 } });
          return;
        }
          // Si no estamos editando, navegar normalmente
          console.log('RegistrosRapidos - Navegando entre celdas');
          event.preventDefault();
          // Corrección: maxCols=13 tras añadir columna Método
          // Caso especial: desde Fiscal (11) con ArrowRight forzar Acciones (12)
          if (key === 'ArrowRight' && focusedCell.col === 11) {
            dispatch({ type: 'SET_FOCUS', payload: { row: focusedCell.row, col: 12 } });
          } else {
            dispatch({ type: 'MOVE_FOCUS', payload: { direction, maxRows: movimientos.length, maxCols: 13 } });
          }
      } else if (key === 'Enter') {
        console.log('RegistrosRapidos - Enter presionado:', { col: focusedCell.col, isEditing });
        // Lógica para decidir si editar o abrir dropdown
        const { col } = focusedCell;
        const dropdownCols = [2, 3, 4, 7, 70 as any, 9, 10]; // Categoría, Subcat, Prov/Cliente, Método, Submétodo, Detalles Rec., Estado
        const textInputCols = [5, 6]; // Descripción, Monto
        
        if (textInputCols.includes(col)) {
          // Para inputs de texto
          if (!state.isEditing) {
            console.log('RegistrosRapidos - Enter en input de texto, iniciando edición append');
            dispatch({ type: 'START_APPEND_EDITING' });
          } else {
            event.preventDefault();
            event.stopPropagation();
            dispatch({ type: 'STOP_EDITING' });
            dispatch({ type: 'MOVE_FOCUS', payload: { direction: 'right', maxRows: movimientos.length, maxCols: 13 } });
          }
        } else if (col === 0 || col === 1) {
          // Enter en MODO/TIPO: alternar y cerrar cualquier dropdown abierto de otra celda
          event.preventDefault();
          event.stopPropagation();
          if (state.activeDropdown) {
        dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
      }
          const mov = movimientos[focusedCell.row];
          if (mov) {
            if (col === 0) {
              const nuevo = mov.modo === 'Unico' ? 'Recurrente' : 'Unico';
              actualizarMovimiento(mov.id, 'modo', nuevo);
            } else {
              const nuevo = mov.tipo === 'Ingreso' ? 'Egreso' : 'Ingreso';
              actualizarMovimiento(mov.id, 'tipo', nuevo);
            }
          }
        } else if (col === 8) {
          // Para fecha, simplemente enfocamos el componente. Él manejará su estado de edición.
          console.log('RegistrosRapidos - Enter en fecha, iniciando edición');
          event.preventDefault();
          event.stopPropagation();
          const cellElement = cellRefs.current.get(getCellKey(focusedCell.row, 8));
          if (cellElement && (cellElement as any).smartDateInput) {
            (cellElement as any).smartDateInput.focus();
          }
        } else if (dropdownCols.includes(col)) {
          console.log('RegistrosRapidos - Enter en dropdown, abriendo');
          event.preventDefault();
          event.stopPropagation();
          // Cerrar cualquier dropdown abierto y abrir exactamente el de la celda enfocada
          if (state.activeDropdown) {
            dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
          }
          setTimeout(() => {
            dispatch({ type: 'TOGGLE_DROPDOWN', payload: { row: focusedCell.row, col } });
          }, 0);
          // Caso especial: col 8 (Detalles Rec.) usa popover propio
          if (col === 8) {
            setTimeout(() => {
              const cellEl = cellRefs.current.get(getCellKey(focusedCell.row, 8));
              const pop = cellEl ? (cellEl.querySelector('[data-recurrence]') as any) : null;
              // Si el componente expone ref en el DOM
              if (pop && pop.open) pop.open();
            }, 0);
          }
        } else if (col === 11) {
          // Enter en FISCAL: alternar checkbox (col 11 tras nueva columna Método)
          event.preventDefault();
          event.stopPropagation();
          const mov = movimientos[focusedCell.row];
          if (mov) {
            actualizarMovimiento(mov.id, 'es_fiscal', !mov.es_fiscal);
          }
        } else if (col === 12) {
          // Enter en ACCIONES: solicitar confirmación (col 12 tras nueva columna Método)
          event.preventDefault();
          event.stopPropagation();
          const mov = movimientos[focusedCell.row];
          if (mov) {
            setConfirmDeleteId(mov.id);
          }
        }
        // Añadir lógica para Toggles y Checkbox
      } else if (key.length === 1 && !shiftKey) { // Type-to-edit
        console.log('RegistrosRapidos - Type-to-edit detectado:', { key, col: focusedCell.col, isTextInputFocused: isTextInputFocused(), isDateInputFocused: isDateInputFocused() });
          const movimiento = movimientos[focusedCell.row];
          if (movimiento) {
          // Manejar inputs de texto (columnas 4, 5, 6)
          if (isTextInputFocused()) {
            // Si ya estamos editando, no hacer nada - dejar que el input maneje la tecla
            if (state.isEditing) {
              return; // Dejar que el input nativo maneje la tecla
            }
            
            let fieldName = '';
            if (focusedCell.col === 4) fieldName = 'proveedor_cliente';
            else if (focusedCell.col === 5) fieldName = 'descripcion';
            else if (focusedCell.col === 6) fieldName = 'monto';
            
            if (fieldName) {
              // Detectar si el campo está vacío: si está vacío, no usar overwrite para no seleccionar en azul
              const currentValue = fieldName === 'proveedor_cliente'
                ? (movimiento.proveedor_cliente || '')
                : fieldName === 'descripcion'
                ? (movimiento.descripcion || '')
                : fieldName === 'monto'
                ? String(movimiento.monto ?? '')
                : '';

              if (currentValue.trim().length === 0 && fieldName !== 'monto') {
                // Campo vacío (texto): iniciar en append y escribir primera letra sin seleccionar
                dispatch({ type: 'START_APPEND_EDITING' });
                setTimeout(() => {
                  actualizarMovimiento(movimiento.id, fieldName, key);
                }, 40);
              } else {
                // Campo con contenido: NO usar overwrite para evitar selección azul; forzamos valor = primera letra y modo append
                dispatch({ type: 'START_APPEND_EDITING' });
                setTimeout(() => {
                  actualizarMovimiento(movimiento.id, fieldName, key);
                  const cellEl = cellRefs.current.get(getCellKey(focusedCell.row, focusedCell.col));
                  const input = cellEl ? (cellEl.querySelector('input') as HTMLInputElement | null) : null;
                  if (input) {
                    input.focus();
                    const len = input.value.length;
                    try { input.setSelectionRange(len, len); } catch {}
                  }
                }, 30);
              }
            }
          }
          // Manejar fecha (columna 7)
          else if (focusedCell.col === 8 && /^[0-9]$/.test(key)) {
            console.log('RegistrosRapidos - Type-to-edit en fecha:', { key, row: focusedCell.row });

            event.preventDefault();
            event.stopPropagation();

            // Asegurar estado de edición activo para la celda (persistir entre dígitos)
    if (!state.isEditing) {
              dispatch({ type: 'START_OVERWRITE_EDITING' });
            }

            // Delegar directamente el dígito al componente hijo
            const cellElement = cellRefs.current.get(getCellKey(focusedCell.row, 8));
            if (cellElement && (cellElement as any).smartDateInput) {
              const smartDateInput = (cellElement as any).smartDateInput;
              smartDateInput.processDigit(key);
            } else {
              console.log('RegistrosRapidos - SmartDateInput no encontrado en la celda');
            }
          }
        }
      }
    }
  }, [state, movimientos, actualizarMovimiento, eliminarFila, confirmDeleteId]);


  // ===== EFECTOS SECUNDARIOS =====

  // Efecto para añadir/remover event listeners (captura: true para interceptar teclas antes del input)
  useEffect(() => {
    const handleKeyDownWrapper = (event: KeyboardEvent) => handleTableKeyDown(event);
    
    document.addEventListener('keydown', handleKeyDownWrapper, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDownWrapper, true);
    };
  }, [handleTableKeyDown]);

  // Efectos para listeners externos
  useEffect(() => {
    const handler = (e: any) => {
      if (e && e.detail && e.detail.id) setConfirmDeleteId(e.detail.id);
    };
    window.addEventListener('rr-confirm-delete' as any, handler);
    return () => window.removeEventListener('rr-confirm-delete' as any, handler);
  }, []);

  // Efecto para enfocar la primera celda cuando se añade una nueva fila
  useEffect(() => {
    if (movimientos.length > 0 && !state.focusedCell) {
      dispatch({ type: 'SET_FOCUS', payload: { row: 0, col: 0 } });
    }
  }, [movimientos.length, state.focusedCell]);


  // Cargar categorías y subcategorías
  useEffect(() => {
    loadCategorias();
    loadSubcategorias();
    loadMetodoCategorias();
    loadMetodoSubcategorias();
    loadProveedores();
    loadClientes();
  }, []);

  // Auto-agregar fila si se especifica
  useEffect(() => {
    if (autoAddRow && movimientos.length === 0) {
      agregarFila();
    }
  }, [autoAddRow]);

  // ===== FUNCIONES DE GUARDADO =====

  const guardarMovimientos = async () => {
    if (movimientos.length === 0) {
      setError('No hay movimientos para guardar');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const movimientosUnicos = movimientos.filter(mov => mov.modo === 'Unico');
      const movimientosRecurrentes = movimientos.filter(mov => mov.modo === 'Recurrente');

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

      setMovimientos([]);
      setError(null);
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

  // ===== CONTEXT VALUE =====
  const contextValue: TableContextType = {
    state,
    dispatch
  };

  // ===== RENDER =====
  return (
    <TableContext.Provider value={contextValue}>
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

          {/* Tabla de movimientos - LAYOUT FIXED CON COLGROUP */}
          <div 
            className="registro-rapido-container"
            style={{
              width: '100%',
              overflowX: 'auto',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <table 
              ref={tableRef}
              className="registro-rapido-table"
              style={{
                tableLayout: 'fixed',
                width: '1020px',
                borderCollapse: 'collapse'
              }}
            >
              <colgroup>
                <col style={{ width: '50px' }} />
                <col style={{ width: '50px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '70px' }} />
                <col style={{ width: '70px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '70px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
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
                    PROV/CLIENTE
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NOTA
                  </th>
                  <th className="px-1 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MONTO
                  </th>
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MÉTODO
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
                {movimientos.map((movimiento, rowIndex) => (
                  <TableRow
                    key={movimiento.id}
                    movimiento={movimiento}
                    categorias={categorias}
                    subcategorias={subcategorias}
                    metCats={metCats}
                    metSubs={metSubs}
                    proveedores={proveedores}
                    clientes={clientes}
                    onUpdate={actualizarMovimiento}
                    onDelete={eliminarFila}
                    onEdit={editarFila}
                    rowIndex={rowIndex}
                    registerCellRef={registerCellRef}
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

        {/* Modal de confirmación de borrado */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={cancelarEliminarFila}></div>
            <div className="relative bg-white rounded-lg shadow-lg p-4 w-72">
              <h3 className="text-sm font-semibold mb-2">Eliminar fila</h3>
              <p className="text-xs text-gray-600 mb-3">¿Deseas eliminar esta fila? Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2">
                <button onClick={cancelarEliminarFila} className="px-3 py-1 text-xs rounded border border-gray-300">Cancelar (Esc)</button>
                <button onClick={confirmarEliminarFila} className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">Eliminar (Enter)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TableContext.Provider>
  );
};

export default RegistrosRapidos;