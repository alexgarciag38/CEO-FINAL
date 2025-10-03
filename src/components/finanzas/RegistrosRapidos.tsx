import React, { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
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
  // Auto-save state
  isDirty?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastError?: string;
  saveTimeoutId?: any;
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
  const movimientosRef = useRef<MovimientoRapido[]>([]);
  useEffect(() => { movimientosRef.current = movimientos; }, [movimientos]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [metCats, setMetCats] = useState<MetodoCat[]>([]);
  const [metSubs, setMetSubs] = useState<MetodoSub[]>([]);
  const [proveedores, setProveedores] = useState<PCItem[]>([]);
  const [clientes, setClientes] = useState<PCItem[]>([]);
  // const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const savingCount = useMemo(() => movimientos.filter(m => m.saveStatus === 'saving').length, [movimientos]);

  // ===== REFERENCIAS =====
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const tableRef = useRef<HTMLTableElement>(null);
  const saveTimersRef = useRef<Map<string, any>>(new Map());
  const savingRowsRef = useRef<Set<string>>(new Set());

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
      origen: 'unico',
      isDirty: true,
      saveStatus: 'idle'
    };

    setMovimientos(prev => [...prev, nuevoMovimiento]);
  };

  const actualizarMovimiento = useCallback((id: string, field: string, value: any) => {
    setMovimientos(prev => prev.map(mov => {
      if (mov.id === id) {
        const updated: MovimientoRapido = { ...mov, [field]: value, isDirty: true, saveStatus: mov.saveStatus === 'saving' ? 'saving' : 'idle', lastError: undefined } as any;
        
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

  const eliminarFila = async (id: string) => {
    const isUuidId = isUuid(id);
    // Optimista: quitar de UI
    const prevState = movimientos;
    setMovimientos(prev => prev.filter(mov => mov.id !== id));
    if (!isUuidId) return; // si era temporal, no existe en DB
    try {
      const { error } = await supabase.functions.invoke('eliminar-movimientos', { body: { ids: [id] } });
      if (error) throw error;
    } catch (e) {
      console.error('Eliminar movimiento falló, revirtiendo', e);
      // Revertir si falla
      setMovimientos(prevState);
      setError('No se pudo eliminar en el servidor.');
    }
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
        // Buscar el API de la celda acorde al dropdown activo exacto
        const cellEl = cellRefs.current.get(getCellKey(row, (col as any) === 70 ? 7 : col));
        const api = cellEl ? (cellEl as any).workingSelect : null;
        const isMetodoLike = col === 7 || (col as any) === 70;
        const idx = state.highlightedDropdownOptionIndex;
        if (isMetodoLike && idx < 0) {
          // Pre-resaltar primera opción y seleccionar tras un micro-delay
          // Para casos como EFECTIVO ya resaltado visualmente pero con índice -1, forzar índice 0
          dispatch({ type: 'HIGHLIGHT_DROPDOWN_OPTION', payload: { direction: 'down', optionsCount: 1 } });
          setTimeout(() => {
            if (api && api.selectHighlighted) {
              api.selectHighlighted();
            } else {
              dispatch({ type: 'SELECT_DROPDOWN_OPTION' });
            }
          }, 40);
        } else {
          // Seleccionar directamente según el dropdown activo
          if ((col as any) === 70) {
            // Submétodo: llamar selectHighlighted del Submétodo exclusivamente
            try {
              const tdEl = cellRefs.current.get(getCellKey(row, 7));
              const subApi = tdEl ? (tdEl as any).workingSelectSub : null;
              if (subApi && subApi.selectHighlighted) {
                subApi.selectHighlighted();
              } else if (api && api.selectHighlighted) {
                api.selectHighlighted();
              } else {
                dispatch({ type: 'SELECT_DROPDOWN_OPTION' });
              }
            } catch {
              dispatch({ type: 'SELECT_DROPDOWN_OPTION' });
            }
          } else {
            // Método
            if (api && api.selectHighlighted) {
              api.selectHighlighted();
            } else {
              dispatch({ type: 'SELECT_DROPDOWN_OPTION' });
            }
          }
        }
        // Apertura de Submétodo se maneja en TableRow.onChange de Método para evitar doble toggle
        // Si estamos en Submétodo (col virtual 70), mover foco a la derecha tras confirmar
        if ((activeDropdown.col as any) === 70) {
          setTimeout(() => {
            dispatch({ type: 'MOVE_FOCUS', payload: { direction: 'right', maxRows: movimientos.length, maxCols: 13 } });
          }, 0);
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
        // Disparar guardado al finalizar edición por Enter/Tab
        {
          const rowId = movimientos[focusedCell!.row]?.id;
          if (rowId) {
            const current = movimientosRef.current.find(m => m.id === rowId);
            if (current?.isDirty) {
              scheduleRowSave(rowId);
            }
          }
        }
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
        // Guardar al salir con flechas
        {
          const rowId = movimientos[focusedCell!.row]?.id;
          if (rowId) {
            const current = movimientosRef.current.find(m => m.id === rowId);
            if (current?.isDirty) {
              scheduleRowSave(rowId);
            }
          }
        }
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
          console.log('RegistrosRapidos - Enter en dropdown');
          event.preventDefault();
          event.stopPropagation();
          // Evitar TOGGLE redundante si ya está abierto para esta celda
          const isDropdownActiveForThisCell = state.activeDropdown?.row === focusedCell.row && state.activeDropdown?.col === col;
          if (state.activeDropdown && !isDropdownActiveForThisCell) {
            dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
            setTimeout(() => {
              dispatch({ type: 'TOGGLE_DROPDOWN', payload: { row: focusedCell.row, col } });
            }, 0);
          } else if (!isDropdownActiveForThisCell) {
            dispatch({ type: 'TOGGLE_DROPDOWN', payload: { row: focusedCell.row, col } });
          }
          // Caso especial: col 8 (Detalles Rec.) usa popover propio
          if (col === 8) {
            setTimeout(() => {
              const cellEl = cellRefs.current.get(getCellKey(focusedCell.row, 8));
              const pop = cellEl ? (cellEl.querySelector('[data-recurrence]') as any) : null;
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
        const textFocused = isTextInputFocused();
        // Solo consumir la tecla si vamos a iniciar edición (no si ya estamos editando)
        if (!(state.isEditing && textFocused)) {
          event.preventDefault();
          event.stopPropagation();
        }
        console.log('RegistrosRapidos - Type-to-edit detectado:', { key, col: focusedCell.col, isTextInputFocused: textFocused, isDateInputFocused: isDateInputFocused() });
          const movimiento = movimientos[focusedCell.row];
          if (movimiento) {
          // Manejar inputs de texto (columnas 4, 5, 6)
          if (textFocused) {
            // Si ya estamos editando, no hacer nada - dejar que el input maneje la tecla
            if (state.isEditing) {
              return; // Dejar que el input nativo maneje la tecla
            }
            
            let fieldName = '';
            // Type-to-edit soportado solo en celdas de texto/número editables (NOTA y MONTO)
            if (focusedCell.col === 5) fieldName = 'descripcion';
            else if (focusedCell.col === 6) fieldName = 'monto';
            
            if (fieldName) {
              const currentValue = fieldName === 'proveedor_cliente'
                ? (movimiento.proveedor_cliente || '')
                : fieldName === 'descripcion'
                ? (movimiento.descripcion || '')
                : fieldName === 'monto'
                ? String(movimiento.monto ?? '')
                : '';

              dispatch({ type: 'START_OVERWRITE_EDITING' });
              // Sobrescribir contenido previo: iniciar con la tecla actual
              if (fieldName === 'monto') {
                const parsed = parseFloat(key.replace(/,/g, '.'));
                actualizarMovimiento(movimiento.id, fieldName, Number.isFinite(parsed) ? parsed : 0);
              } else {
                actualizarMovimiento(movimiento.id, fieldName, key);
              }
              // Enfocar input y cursor al final
              setTimeout(() => {
                const cellEl = cellRefs.current.get(getCellKey(focusedCell.row, focusedCell.col));
                const input = cellEl ? (cellEl.querySelector('input') as HTMLInputElement | null) : null;
                if (input) {
                  input.focus();
                  const len = input.value.length;
                  try { input.setSelectionRange(len, len); } catch {}
                }
              }, 0);
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

  // Listener para commits explícitos emitidos desde celdas
  useEffect(() => {
    const onCommit = (e: any) => {
      const id = e?.detail?.id as string | undefined;
      if (id) commitRowNow(id);
    };
    window.addEventListener('rr:commit-row' as any, onCommit);
    return () => window.removeEventListener('rr:commit-row' as any, onCommit);
  }, []);

  // Listener para commits sin debounce (guardar inmediato)
  useEffect(() => {
    const onCommitNow = (e: any) => {
      const id = e?.detail?.id as string | undefined;
      if (id) commitRowNow(id);
    };
    window.addEventListener('rr:commit-now' as any, onCommitNow);
    return () => window.removeEventListener('rr:commit-now' as any, onCommitNow);
  }, []);

  // Eliminado: listener rr:update-columns. Guardado unificado vía scheduleRowSave/saveRow.

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

  // Cargar movimientos persistidos al iniciar
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('listar-mis-movimientos', { body: {} });
        if (error) throw error;
        const items = (data as any)?.items as any[] || [];
        const mapped: MovimientoRapido[] = items.map((r: any) => ({
          id: r.id,
          modo: r.origen === 'recurrente' ? 'Recurrente' : 'Unico',
          tipo: r.tipo,
          categoriaId: r.categoria_id || '',
          subcategoriaId: r.subcategoria_id || '',
          metodoCategoriaId: r.metodo_categoria_id || '',
          metodoSubcategoriaId: r.metodo_subcategoria_id || '',
          proveedor_cliente: r.proveedor_cliente || '',
          descripcion: r.descripcion || '',
          monto: Number(r.monto) || 0,
          fecha_movimiento: r.fecha_movimiento || '',
          fecha_programada: r.fecha_programada || '',
          fecha_inicio: r.fecha_movimiento || r.fecha_programada || '',
          frecuencia: 'mensual',
          dia_especifico: 1,
          dia_semana: 'lunes',
          fecha_fin: '',
          numero_repeticiones: 0,
          estado: r.estado === 'Completado' ? 'Completado' : (r.estado === 'Cancelado' ? 'Cancelado' : 'Pendiente'),
          estado_regla: 'Activa',
          fecha_efectiva: r.fecha_efectiva || '',
          es_fiscal: !!r.fiscal,
          origen: r.origen || 'unico'
        }));
        setMovimientos(mapped);
      } catch (e) {
        console.error('Error cargando movimientos iniciales', e);
      }
    })();
  }, []);

  // Corrección de consistencia: si hay subcategoriaId, asegurar categoriaId = categoria padre
  useEffect(() => {
    if (!subcategorias || subcategorias.length === 0) return;
    setMovimientos(prev => prev.map(m => {
      if (!m.subcategoriaId) return m;
      const sub = subcategorias.find(s => s.id === m.subcategoriaId);
      if (sub && sub.categoria_id && sub.categoria_id !== m.categoriaId) {
        return { ...m, categoriaId: sub.categoria_id } as any;
      }
      return m;
    }));
  }, [subcategorias.length]);

  // Auto-agregar fila si se especifica
  useEffect(() => {
    if (autoAddRow && movimientos.length === 0) {
      agregarFila();
    }
  }, [autoAddRow]);

  // ===== FUNCIONES DE GUARDADO =====

  // isUuid ya está declarado antes en el archivo; reutilizarlo

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
        const payload = movimientosUnicos.map(mov => ({
          id: isUuid(mov.id) ? mov.id : undefined,
          client_id: mov.id, // mapear ids temporales
          tipo: mov.tipo,
          categoria_id: mov.categoriaId || null,
          subcategoria_id: mov.subcategoriaId || null,
          metodo_categoria_id: mov.metodoCategoriaId || null,
          metodo_subcategoria_id: mov.metodoSubcategoriaId || null,
          proveedor_cliente: mov.proveedor_cliente || null,
          descripcion: (mov.descripcion || '').trim(),
          monto: Number.isFinite(Number(mov.monto)) ? Number(mov.monto) : 0,
          fecha_movimiento: mov.fecha_movimiento && mov.fecha_movimiento.trim() !== '' ? mov.fecha_movimiento : null,
          fecha_programada: mov.fecha_programada && mov.fecha_programada.trim() !== '' ? mov.fecha_programada : null,
          fecha_efectiva: mov.fecha_efectiva && mov.fecha_efectiva.trim() !== '' ? mov.fecha_efectiva : null,
          forma_pago: null,
          fiscal: !!mov.es_fiscal,
          notas: null,
          estado: (mov.estado === 'Pendiente' || !mov.estado) ? 'Registrado' : mov.estado,
          origen: mov.origen,
          regla_id: null,
          n_orden_ocurrencia: null,
          total_planeadas: null
        }));

        const { data: res, error: errorUpsert } = await supabase.functions.invoke('upsert-movimientos-en-lote', {
          body: { movimientos: payload }
        });
        if (errorUpsert) throw errorUpsert;

        // Reconciliar IDs: reemplazar ids temporales con UUIDs retornados
        const mappings: Record<string, string> = {};
        try {
          const mapArr = (res as any)?.mappings as Array<{ client_id: string | null; id: string }>;
          if (Array.isArray(mapArr)) {
            for (const m of mapArr) {
              if (m.client_id && m.id && isUuid(m.id)) mappings[m.client_id] = m.id;
            }
          }
        } catch {}

        if (Object.keys(mappings).length > 0) {
          setMovimientos(prev => prev.map(m => mappings[m.id] ? { ...m, id: mappings[m.id] } : m));
        }
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

      // No vaciar la tabla: mantener filas visibles ("congeladas") hasta que se procesen
      setError(null);
      alert('Movimientos guardados exitosamente. Puedes procesar los completados cuando quieras.');

    } catch (error) {
      console.error('Error guardando movimientos:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  // ===== AUTO-GUARDADO POR FILA =====
  const isUuid = (value: string) => /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(value);

  const buildUpsertPayloadFromRow = useCallback((row: MovimientoRapido) => {
    const sub = subcategorias.find(s => s.id === row.subcategoriaId);
    const categoriaForPayload = row.categoriaId || (sub ? sub.categoria_id : '');
    return ({
    id: isUuid(row.id) ? row.id : undefined,
    client_id: row.id,
    tipo: row.tipo,
    categoria_id: categoriaForPayload || null,
    subcategoria_id: row.subcategoriaId || null,
    metodo_categoria_id: row.metodoCategoriaId || null,
    metodo_subcategoria_id: row.metodoSubcategoriaId || null,
    proveedor_cliente: row.proveedor_cliente || null,
    descripcion: (row.descripcion || '').trim(),
    monto: Number.isFinite(Number(row.monto)) ? Number(row.monto) : 0,
    fecha_movimiento: row.fecha_movimiento && row.fecha_movimiento.trim() !== '' ? row.fecha_movimiento : null,
    fecha_programada: row.fecha_programada && row.fecha_programada.trim() !== '' ? row.fecha_programada : null,
    fecha_efectiva: row.fecha_efectiva && row.fecha_efectiva.trim() !== '' ? row.fecha_efectiva : null,
    forma_pago: null,
    fiscal: !!row.es_fiscal,
    notas: null,
    estado: (row.estado === 'Pendiente' || !row.estado) ? 'Registrado' : row.estado,
    origen: row.origen,
    regla_id: null,
    n_orden_ocurrencia: null,
    total_planeadas: null
  });
  }, [subcategorias]);

  const saveRow = useCallback(async (rowId: string, attempt = 1): Promise<void> => {
    if (savingRowsRef.current.has(rowId)) return; // evitar guardados simultáneos sobre la misma fila
    savingRowsRef.current.add(rowId);
    const row = movimientosRef.current.find(m => m.id === rowId);
    if (!row) return;
    // Marcar saving
    setMovimientos(prev => prev.map(m => m.id === rowId ? { ...m, saveStatus: 'saving' } : m));
    try {
      const payload = buildUpsertPayloadFromRow(row);
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout guardando fila (>6s)')), 6000));
      const invoke = supabase.functions.invoke('upsert-movimientos-en-lote', { body: { movimientos: [payload] } });
      const { data: res, error: upErr } = await Promise.race([invoke, timeout]) as any;
      if (upErr) throw upErr;
      // Reconciliar IDs
      const mappingsArr = (res as any)?.mappings as Array<{ client_id: string | null; id: string }> | undefined;
      let newId: string | undefined;
      if (Array.isArray(mappingsArr)) {
        const found = mappingsArr.find(m => m.client_id === row.id && isUuid(m.id));
        if (found) newId = found.id;
      }
      setMovimientos(prev => prev.map(m => {
        if (m.id !== rowId) return m;
        // Asegurar consistencia local: si subcategoria fija otra categoria, reflejarla
        const sub = subcategorias.find(s => s.id === m.subcategoriaId);
        const fixedCategoriaId = sub?.categoria_id && sub.categoria_id !== m.categoriaId ? sub.categoria_id : m.categoriaId;
        const next: MovimientoRapido = { ...m, categoriaId: fixedCategoriaId, isDirty: false, saveStatus: 'saved', lastError: undefined } as any;
        if (newId) next.id = newId;
        return next;
      }));
    } catch (e: any) {
      // Extraer mensaje de Edge Function (PGRST o Zod)
      let message = e?.message || 'Fallo al guardar';
      try {
        const parsed = typeof e?.context?.error === 'string' ? JSON.parse(e.context.error) : e?.context?.error;
        if (parsed?.error === 'UPSERT_FAILED') {
          message = parsed.message || message;
          if (parsed?.hint) message += ` | Hint: ${parsed.hint}`;
        }
      } catch {}
      const retriable = attempt < 3 && (!e || (e.status && e.status >= 500));
      if (retriable) {
        await new Promise(r => setTimeout(r, attempt === 1 ? 500 : 1500));
        return saveRow(rowId, attempt + 1);
      }
      setMovimientos(prev => prev.map(m => m.id === rowId ? { ...m, saveStatus: 'error', lastError: message } : m));
      console.error('[AutoSave] Error guardando fila', rowId, e);
    }
    finally {
      savingRowsRef.current.delete(rowId);
    }
  }, [buildUpsertPayloadFromRow, subcategorias]);

  const commitRowNow = async (rowId: string) => {
    setMovimientos(prev => prev.map(m => m.id === rowId ? { ...m, saveStatus: 'saving' } : m));
    // Esperar un tick para que el setState de onUpdate se aplique antes de leer la fila
    await new Promise((r) => setTimeout(r, 40));
    try {
      await saveRow(rowId);
    } catch (e: any) {
      setMovimientos(prev => prev.map(m => m.id === rowId ? { ...m, saveStatus: 'error', lastError: e?.message || 'Fallo al guardar' } : m));
      console.error('[CommitNow] Error guardando fila', rowId, e);
    }
  };

  const scheduleRowSave = useCallback((rowId: string, delayMs: number = 300) => {
    const existing = saveTimersRef.current.get(rowId);
    if (existing) {
      try { clearTimeout(existing); } catch {}
    }
    const timerId = setTimeout(async () => {
      saveTimersRef.current.delete(rowId);
      try {
        await saveRow(rowId);
      } catch (e) {
        console.error('[AutoSave] scheduleRowSave error', e);
      }
    }, delayMs);
    saveTimersRef.current.set(rowId, timerId);
  }, [saveRow]);

  const validarMovimientos = () => {
    const advertencias: string[] = [];

    movimientos.forEach((mov, index) => {
      if (!mov.descripcion.trim()) advertencias.push(`Fila ${index + 1}: Falta descripción`);
      if (!Number.isFinite(Number(mov.monto)) || Number(mov.monto) <= 0) advertencias.push(`Fila ${index + 1}: Monto no establecido`);
      if (mov.modo === 'Unico') {
        if (!mov.fecha_movimiento) advertencias.push(`Fila ${index + 1}: Fecha de movimiento vacía`);
      } else {
        if (!mov.fecha_inicio) advertencias.push(`Fila ${index + 1}: Fecha de inicio vacía`);
      }
    });

    return advertencias;
  };

  const handleGuardar = async () => {
    const advertencias = validarMovimientos();
    if (advertencias.length > 0) {
      // Mostrar como aviso no bloqueante
      console.warn('[Guardar] Advertencias no bloqueantes:', advertencias);
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
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Modo de Alta Rápida
              </span>
              {savingCount > 0 && (
                <span className="inline-flex items-center gap-2 text-blue-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Guardando {savingCount} fila{savingCount !== 1 ? 's' : ''}…
                </span>
              )}
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
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (processing) return;
                  console.log('[ProcesarPagos] click');
                  setProcessing(true);
                  try {
                    // 1) Forzar guardado de filas en UI con estado 'Completado'
                    const completadosUI = movimientos.filter(m => m.estado === 'Completado');
                    for (const m of completadosUI) {
                      if (!isUuid(m.id) || m.isDirty || m.saveStatus !== 'saved') {
                        try { await saveRow(m.id); } catch (_) {}
                      }
                    }
                    // 2) Invocar procesamiento en backend (pasar ids guardados si existen)
                    const idsAEvaluar = movimientos.filter(m => m.estado === 'Completado' && isUuid(m.id)).map(m => m.id);
                    const { data, error } = await supabase.functions.invoke('procesar-pagos', { body: { ids: idsAEvaluar } });
                    if (error) throw error;
                    console.log('[ProcesarPagos] done', data);
                    const moved = (data as any)?.moved ?? 0;
                    if ((data as any)?.error === 'VALIDATION_ERROR') {
                      const det = (data as any)?.details || {};
                      const faltanMetodo = (det.missing_method_ids || []).length;
                      const faltanSub = (det.missing_submethod_ids || []).length;
                      const msg = `No se pudieron procesar ${faltanMetodo + faltanSub} filas: ${faltanMetodo>0?`${faltanMetodo} sin Método` : ''}${faltanMetodo>0 && faltanSub>0? ' y ' : ''}${faltanSub>0?`${faltanSub} sin Submétodo` : ''}.`;
                      alert(msg);
                      return;
                    }
                    if (moved > 0) {
                      // Quitar los completados procesados de la UI
                      setMovimientos(prev => prev.filter(m => m.estado !== 'Completado'));
                    }
                    await Promise.all([
                      loadCategorias(),
                      loadSubcategorias(),
                      loadMetodoCategorias(),
                      loadMetodoSubcategorias(),
                    ]);
                    alert(`Pagos procesados: ${moved}`);
                  } catch (e: any) {
                    console.error('[ProcesarPagos] error', e);
                    setError(e?.message || 'Error procesando pagos');
                  } finally {
                    setProcessing(false);
                  }
                }}
                className={`px-4 py-2 ${processing ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors text-sm font-medium`}
                title="Mover pagos completados al historial"
                disabled={processing}
              >
                {processing ? 'Procesando…' : 'Procesar pagos'}
              </button>
              {/* Botón de guardar eliminado: auto-guardado por fila activo */}
            </div>
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
                    onUpdate={(id, field, value) => {
                      // Solo actualizar estado local, sin guardar todavía
                      actualizarMovimiento(id, field, value);
                    }}
                    onSaveRow={(id) => scheduleRowSave(id)}
                    onCommit={(id) => commitRowNow(id)}
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