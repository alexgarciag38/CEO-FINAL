import React, { useRef, useEffect } from 'react';
import IconToggle from '@/components/ui/IconToggle';
import WorkingSelect, { WorkingSelectRef } from '@/components/ui/WorkingSelect';
import SmartDateInput, { SmartDateInputRef } from '@/components/ui/SmartDateInput';
import RecurrencePickerPopover, { RecurrencePickerPopoverRef } from './RecurrencePickerPopover';
import { LightningIcon, RefreshIcon, LetterIIcon, LetterEIcon, TrashIcon } from '@/components/ui/ProfessionalIcons';
import { useTableContext } from './TableContext';
import { adjustColorForSubentity, isValidHexColor } from '@/lib/colorUtils';

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

interface TableRowProps {
  movimiento: MovimientoRapido;
  categorias: Array<{ id: string; nombre: string; color: string; tipo: 'Ingreso' | 'Egreso' }>;
  subcategorias: Array<{ id: string; nombre: string; color: string; categoria_id: string }>;
  metCats?: Array<{ id: string; nombre: string; color: string | null; tipo: 'Ingreso' | 'Egreso' }>;
  metSubs?: Array<{ id: string; nombre: string; categoria_id: string; activa: boolean }>;
  proveedores?: Array<{ id: string; nombre: string }>;
  clientes?: Array<{ id: string; nombre: string }>;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  rowIndex: number;
  registerCellRef: (rowIndex: number, colIndex: number, element: HTMLElement | null) => void;
}

const TableRow: React.FC<TableRowProps> = ({
  movimiento,
  categorias,
  subcategorias,
  metCats = [],
  metSubs = [],
  proveedores = [],
  clientes = [],
  onUpdate,
  onDelete,
  rowIndex,
  registerCellRef,
}) => {
  const { state, dispatch } = useTableContext();
  
  // Referencias para los inputs
  const proveedorInputRef = useRef<HTMLInputElement>(null);
  const descripcionInputRef = useRef<HTMLInputElement>(null);
  const montoInputRef = useRef<HTMLInputElement>(null);
  const fechaInputRef = useRef<SmartDateInputRef>(null);
  const categoriaSelectRef = useRef<WorkingSelectRef>(null);
  const subcategoriaSelectRef = useRef<WorkingSelectRef>(null);
  const pcSelectRef = useRef<WorkingSelectRef>(null);
  const metodoCatRef = useRef<WorkingSelectRef>(null);
  const metodoSubRef = useRef<WorkingSelectRef>(null);
  const metodoTdRef = useRef<HTMLTableCellElement>(null);
  const recurrenceRef = useRef<RecurrencePickerPopoverRef>(null);
  const pendingToggleAfterFocusRef = useRef<{ row: number; col: number } | null>(null);
  const estadoSelectRef = useRef<WorkingSelectRef>(null);
  
  // Exponer funciones del SmartDateInput para el componente padre
  useEffect(() => {
    if (fechaInputRef.current) {
      // Registrar las funciones en el elemento de la celda para acceso externo
      const cellElement = document.querySelector(`[data-row="${rowIndex}"][data-col="8"]`);
      if (cellElement) {
        (cellElement as any).smartDateInput = fechaInputRef.current;
      }
    }
  }, [rowIndex, fechaInputRef.current]);

  // Click behavior: primer click selecciona la celda; si ya está enfocada, el siguiente click abre/cierra el dropdown
  const handleDropdownCellClick = (col: number) => {
    const isSameCellFocused = state.focusedCell?.row === rowIndex && state.focusedCell?.col === col;
    if (isSameCellFocused) {
      dispatch({ type: 'TOGGLE_DROPDOWN', payload: { row: rowIndex, col } });
    } else {
      dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col } });
    }
  };

  // Click en celdas tipo toggle (Modo/Tipo): primer click enfoca, segundo click ejecuta acción
  const handleToggleCellClick = (col: number, field: 'modo' | 'tipo') => {
    const isSameCellFocused = state.focusedCell?.row === rowIndex && state.focusedCell?.col === col;
    if (isSameCellFocused || (pendingToggleAfterFocusRef.current?.row === rowIndex && pendingToggleAfterFocusRef.current?.col === col)) {
      if (field === 'modo') {
        onUpdate(movimiento.id, 'modo', movimiento.modo === 'Unico' ? 'Recurrente' : 'Unico');
      } else if (field === 'tipo') {
        // Cambiar tipo SOLO en esta fila. No tocar categorías globales aquí.
        onUpdate(movimiento.id, 'tipo', movimiento.tipo === 'Ingreso' ? 'Egreso' : 'Ingreso');
      }
      pendingToggleAfterFocusRef.current = null;
    } else {
      dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col } });
      // Registrar intención: el próximo click sobre esta celda debe togglear
      pendingToggleAfterFocusRef.current = { row: rowIndex, col };
    }
  };

  const handleToggleCellMouseDown = (col: number, field: 'modo' | 'tipo') => {
    // Si ya está enfocada, alternar inmediatamente en mousedown para que no dependa del timing del doble click
    const isSameCellFocused = state.focusedCell?.row === rowIndex && state.focusedCell?.col === col;
    if (isSameCellFocused) {
      if (field === 'modo') {
        onUpdate(movimiento.id, 'modo', movimiento.modo === 'Unico' ? 'Recurrente' : 'Unico');
      } else {
        onUpdate(movimiento.id, 'tipo', movimiento.tipo === 'Ingreso' ? 'Egreso' : 'Ingreso');
      }
    }
  };

  // Limpiar intención si el foco cambia a otra celda
  useEffect(() => {
    if (!state.focusedCell) return;
    const { row, col } = state.focusedCell;
    if (pendingToggleAfterFocusRef.current && (pendingToggleAfterFocusRef.current.row !== row || pendingToggleAfterFocusRef.current.col !== col)) {
      pendingToggleAfterFocusRef.current = null;
    }
  }, [state.focusedCell?.row, state.focusedCell?.col]);
  
  const isCellFocused = (col: number) => state.focusedCell?.row === rowIndex && state.focusedCell?.col === col;
  const isCellEditing = (col: number) => isCellFocused(col) && state.isEditing;
  const getFocusClassName = (col: number) => isCellFocused(col) ? 'keyboard-focused' : '';

  // Opciones para toggles
  const modoOptions = [
    {
      value: 'Unico',
      icon: <LightningIcon />,
      label: 'Movimiento Único',
      color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
    },
    {
      value: 'Recurrente',
      icon: <RefreshIcon />,
      label: 'Regla Recurrente',
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
    }
  ];

  const tipoOptions = [
    {
      value: 'Ingreso',
      icon: <LetterIIcon />,
      label: 'Ingreso',
      color: 'bg-green-100 hover:bg-green-200 text-green-800'
    },
    {
      value: 'Egreso',
      icon: <LetterEIcon />,
      label: 'Egreso',
      color: 'bg-red-100 hover:bg-red-200 text-red-800'
    }
  ];

  // Filtrar categorías por tipo del movimiento
  const categoriasFiltradas = categorias.filter(cat => cat.tipo === movimiento.tipo);
  const subcategoriasFiltradas = subcategorias.filter(sub => sub.categoria_id === movimiento.categoriaId);
  const metodoCatsFiltradas = metCats.filter(mc => mc.tipo === movimiento.tipo);
  const metodoSubsFiltradas = metSubs.filter(ms => ms.categoria_id === movimiento.metodoCategoriaId);

  // Colores heredados para subentidades
  const categoriaSeleccionada = categorias.find(c => c.id === movimiento.categoriaId);
  const colorCategoriaPadre = categoriaSeleccionada?.color;
  const metodoCategoriaSeleccionada = metodoCatsFiltradas.find(mc => mc.id === movimiento.metodoCategoriaId) || null;
  const colorMetodoPadre = metodoCategoriaSeleccionada?.color || undefined;
  const pcOptions = (movimiento.tipo === 'Egreso' ? proveedores : clientes).map(p => ({ value: p.id, label: p.nombre }));

  // Cuando la celda obtiene el foco, por defecto Enter abre Método
  useEffect(() => {
    const td = metodoTdRef.current as any;
    if (!td) return;
    if (state.focusedCell?.row === rowIndex && state.focusedCell?.col === 7) {
      td.workingSelect = metodoCatRef.current;
    }
  }, [state.focusedCell?.row, state.focusedCell?.col, rowIndex]);

  // Si hay un dropdown activo en esta celda, apunta el workingSelect al control que corresponde
  useEffect(() => {
    const td = metodoTdRef.current as any;
    if (!td) return;
    if (state.activeDropdown && state.activeDropdown.row === rowIndex && state.activeDropdown.col === 7) {
      td.workingSelect = movimiento.metodoCategoriaId ? metodoSubRef.current : metodoCatRef.current;
    }
  }, [state.activeDropdown, movimiento.metodoCategoriaId, rowIndex]);

  const isMetodoDropdownActive = !!state.activeDropdown && state.activeDropdown.row === rowIndex && state.activeDropdown.col === 7;

  // Forzar foco cuando se inicia la edición
  useEffect(() => {
    if (state.isEditing && state.focusedCell?.row === rowIndex) {
      const col = state.focusedCell.col;
      
      // La lógica de foco para SmartDateInput ahora es manejada por el padre (RegistrosRapidos)
      // a través de la ref. No se necesita lógica aquí.
      
      // Manejar inputs de texto normales
      let inputRef = null;
      
      if (col === 4) inputRef = proveedorInputRef.current;
      else if (col === 5) inputRef = descripcionInputRef.current;
      else if (col === 6) inputRef = montoInputRef.current;
      
      if (inputRef) {
        setTimeout(() => {
          inputRef.focus();
          
          // Comportamiento diferente según el modo de edición
          if (state.editMode === 'append') {
            // Doble clic: cursor al final para editar existente
            setTimeout(() => {
              if (inputRef.type !== 'number') {
                inputRef.setSelectionRange(inputRef.value.length, inputRef.value.length);
              }
            }, 10);
          } else {
            // Type-to-edit: enfocar input (no limpiar inmediatamente)
            setTimeout(() => {
              inputRef.focus();
              // Seleccionar todo el texto para sobrescribir
              if (inputRef.type !== 'number') {
                inputRef.setSelectionRange(0, inputRef.value.length);
              }
            }, 50);
          }
        }, 0);
      }
    }
  }, [state.isEditing, state.editMode, state.focusedCell?.row, state.focusedCell?.col, rowIndex]);


  const recurrenceConfig = {
    frecuencia: movimiento.frecuencia,
    dia_especifico: movimiento.dia_especifico,
    dia_semana: movimiento.dia_semana,
    fecha_inicio: movimiento.fecha_inicio,
    fecha_fin: movimiento.fecha_fin,
    numero_repeticiones: movimiento.numero_repeticiones,
    finalizacion: (movimiento.fecha_fin ? 'fecha' : 
                 movimiento.numero_repeticiones ? 'repeticiones' : 'indefinido') as 'fecha' | 'repeticiones' | 'indefinido'
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors" data-row={rowIndex}>
      {/* COLUMNA 1: MODO */}
      <td 
        className={`px-1 py-2 text-center cursor-pointer ${getFocusClassName(0)}`}
        onMouseDown={() => handleToggleCellMouseDown(0, 'modo')}
        onClick={() => handleToggleCellClick(0, 'modo')}
        ref={(el) => registerCellRef(rowIndex, 0, el)}
      >
        <div style={{ pointerEvents: 'none' }}>
        <IconToggle
          value={movimiento.modo}
          options={modoOptions}
            onChange={() => { /* gestionado por la celda */ }}
          className="mx-auto"
        />
        </div>
      </td>

      {/* COLUMNA 2: TIPO */}
      <td 
        className={`px-1 py-2 text-center cursor-pointer ${getFocusClassName(1)}`}
        onMouseDown={() => handleToggleCellMouseDown(1, 'tipo')}
        onClick={() => handleToggleCellClick(1, 'tipo')}
        ref={(el) => registerCellRef(rowIndex, 1, el)}
      >
        <div style={{ pointerEvents: 'none' }}>
        <IconToggle
          value={movimiento.tipo}
          options={tipoOptions}
            onChange={() => { /* gestionado por la celda */ }}
          className="mx-auto"
        />
        </div>
      </td>

      {/* COLUMNA 3: CATEGORÍA */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(2)}`}
        onClick={() => handleDropdownCellClick(2)}
        ref={(el) => {
          registerCellRef(rowIndex, 2, el);
          if (el) (el as any).workingSelect = categoriaSelectRef.current;
        }}
      >
        <WorkingSelect
          ref={categoriaSelectRef}
          id={`categoria-${movimiento.id}`}
          value={movimiento.categoriaId}
          onChange={(value) => onUpdate(movimiento.id, 'categoriaId', value)}
          options={categoriasFiltradas.map(cat => ({ value: cat.id, label: cat.nombre, color: cat.color }))}
          placeholder="Categoría"
          className="w-full"
          cellCoordinates={{ row: rowIndex, col: 2 }}
        />
      </td>

      {/* COLUMNA 4: SUBCATEGORÍA */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(3)}`}
        onClick={() => handleDropdownCellClick(3)}
        ref={(el) => {
          registerCellRef(rowIndex, 3, el);
          if (el) (el as any).workingSelect = subcategoriaSelectRef.current;
        }}
      >
        <WorkingSelect
          ref={subcategoriaSelectRef}
          id={`subcategoria-${movimiento.id}`}
          value={movimiento.subcategoriaId}
          onChange={(value) => onUpdate(movimiento.id, 'subcategoriaId', value)}
          options={subcategoriasFiltradas.map((sub, index) => {
            const color = isValidHexColor(sub.color)
              ? (sub.color as string)
              : (isValidHexColor(colorCategoriaPadre) ? adjustColorForSubentity(colorCategoriaPadre as string, index) : undefined);
            return { value: sub.id, label: sub.nombre, color };
          })}
          placeholder="Subcat."
          className="w-full"
          disabled={!movimiento.categoriaId}
          cellCoordinates={{ row: rowIndex, col: 3 }}
        />
      </td>

      {/* COLUMNA 5: PROVEEDOR/CLIENTE */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(4)}`}
        onClick={() => handleDropdownCellClick(4)}
        ref={(el) => {
          registerCellRef(rowIndex, 4, el);
          if (el) (el as any).workingSelect = pcSelectRef.current;
        }}
      >
        <WorkingSelect
          ref={pcSelectRef}
          id={`pc-${movimiento.id}`}
          value={movimiento.proveedor_cliente}
          onChange={(value) => onUpdate(movimiento.id, 'proveedor_cliente', value)}
          options={pcOptions}
          placeholder="PROV/CLIENTE"
          className="w-full"
          cellCoordinates={{ row: rowIndex, col: 4 }}
        />
      </td>

      {/* COLUMNA 6: DESCRIPCIÓN */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(5)}`}
              onClick={() => dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: 5 } })}
              onDoubleClick={() => dispatch({ type: 'START_APPEND_EDITING' })}
        ref={(el) => registerCellRef(rowIndex, 5, el)}
      >
        {isCellEditing(5) ? (
        <input
            ref={descripcionInputRef}
          type="text"
          value={movimiento.descripcion}
            onChange={(e) => onUpdate(movimiento.id, 'descripcion', e.target.value)}
            className="w-full px-1 py-1 text-xs border border-blue-500 rounded ring-1 ring-blue-500"
            autoFocus
            onBlur={(e) => {
              // Solo detener edición si el foco se mueve fuera del input
              setTimeout(() => {
                if (document.activeElement !== e.target) {
                  dispatch({ type: 'STOP_EDITING' });
                }
              }, 100);
            }}
        />
        ) : (
          <div className="w-full px-1 py-1 text-xs truncate" title={movimiento.descripcion}>
            {movimiento.descripcion || <span className="text-gray-400">NOTA</span>}
          </div>
        )}
      </td>

      {/* COLUMNA 7: MONTO */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(6)}`}
              onClick={() => dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: 6 } })}
              onDoubleClick={() => dispatch({ type: 'START_APPEND_EDITING' })}
        ref={(el) => registerCellRef(rowIndex, 6, el)}
      >
        {isCellEditing(6) ? (
        <input
            ref={montoInputRef}
          type="number"
          value={movimiento.monto}
            onChange={(e) => onUpdate(movimiento.id, 'monto', parseFloat(e.target.value) || 0)}
            className="w-full px-1 py-1 text-xs border border-blue-500 rounded ring-1 ring-blue-500 text-right"
            autoFocus
            onBlur={(e) => {
              // Solo detener edición si el foco se mueve fuera del input
              setTimeout(() => {
                if (document.activeElement !== e.target) {
                  dispatch({ type: 'STOP_EDITING' });
                }
              }, 100);
            }}
          step="0.01"
          min="0"
        />
        ) : (
          <div className="w-full px-1 py-1 text-xs truncate text-right" title={movimiento.monto.toString()}>
            {movimiento.monto || <span className="text-gray-400">0.00</span>}
          </div>
        )}
      </td>

      {/* COLUMNA 8: MÉTODO (Categoría + Subcategoría en la misma columna) */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(7)}`}
        onClick={() => {
          const td = metodoTdRef.current as any;
          if (td) td.workingSelect = metodoCatRef.current;
          handleDropdownCellClick(7);
        }}
          ref={(el) => {
          registerCellRef(rowIndex, 7, el);
          metodoTdRef.current = el as HTMLTableCellElement | null;
          if (el) {
            (el as any).workingSelectCat = metodoCatRef.current;
            (el as any).workingSelectSub = metodoSubRef.current;
            (el as any).workingSelect = {
              selectHighlighted: () => {
                // Intenta seleccionar en ambos; solo el que esté abierto actuará
                try { metodoSubRef.current?.selectHighlighted(); } catch {}
                try { metodoCatRef.current?.selectHighlighted(); } catch {}
              }
            };
          }
        }}
      >
        <div className="flex items-center gap-1 w-full">
          <div className="flex-1">
            <WorkingSelect
              ref={metodoCatRef}
              id={`metcat-${movimiento.id}`}
              value={movimiento.metodoCategoriaId}
              onChange={(value) => {
                onUpdate(movimiento.id, 'metodoCategoriaId', value);
                onUpdate(movimiento.id, 'metodoSubcategoriaId', '');
                // Abrir el dropdown de Submétodo (col virtual 70)
                setTimeout(() => {
                  const td = metodoTdRef.current as any;
                  if (td) td.workingSelect = metodoSubRef.current;
                  dispatch({ type: 'TOGGLE_DROPDOWN', payload: { row: rowIndex, col: 70 as any } });
                }, 0);
              }}
              options={metodoCatsFiltradas.map(mc => ({ value: mc.id, label: mc.nombre, color: mc.color || undefined }))}
              placeholder="Método"
              className="w-full"
              cellCoordinates={{ row: rowIndex, col: 7 }}
            />
          </div>
          <div className="flex-1"
            onClick={(e) => { 
              e.stopPropagation();
              // Abrir explícitamente el dropdown de Submétodo (col virtual 70)
              dispatch({ type: 'TOGGLE_DROPDOWN', payload: { row: rowIndex, col: 70 as any } });
            }}
            ref={(el) => {
              // Nada: el workingSelect de la celda (td) se gestiona via metodoTdRef
            }}
          >
            <WorkingSelect
              ref={metodoSubRef}
              id={`metsub-${movimiento.id}`}
              value={movimiento.metodoSubcategoriaId}
              onChange={(value) => onUpdate(movimiento.id, 'metodoSubcategoriaId', value)}
              options={metodoSubsFiltradas.map((ms, index) => ({
                value: ms.id,
                label: ms.nombre,
                color: isValidHexColor(colorMetodoPadre) ? adjustColorForSubentity(colorMetodoPadre as string, index) : undefined
              }))}
              placeholder="Submétodo"
              className="w-full"
              disabled={!movimiento.metodoCategoriaId}
              cellCoordinates={{ row: rowIndex, col: 70 as any }}
            />
          </div>
        </div>
      </td>

      {/* COLUMNA 9: FECHA DE VENCIMIENTO */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(8)}`}
        onClick={() => dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: 8 } })}
        ref={(el) => registerCellRef(rowIndex, 8, el)}
        data-row={rowIndex}
        data-col={8}
      >
        {movimiento.modo === 'Unico' ? (
          <div data-component="smart-date-input">
          <SmartDateInput
              ref={fechaInputRef}
            value={movimiento.fecha_movimiento}
              onChange={(value: string) => onUpdate(movimiento.id, 'fecha_movimiento', value)}
            isEditing={isCellEditing(8)}
            onStateChange={(isNowEditing) => {
              if (!isNowEditing && isCellEditing(8)) {
                dispatch({ type: 'STOP_EDITING' });
              }
            }}
            onComplete={() => {
              // Mover foco a la derecha cuando se completa dd/mm/aaaa
              dispatch({ type: 'STOP_EDITING' });
              dispatch({ type: 'MOVE_FOCUS', payload: { direction: 'right', maxRows: (state.focusedCell ? state.focusedCell.row + 1 : 1), maxCols: 13 } });
            }}
          />
          </div>
        ) : (
          <div data-component="smart-date-input">
          <SmartDateInput
              ref={fechaInputRef}
            value={movimiento.fecha_inicio}
              onChange={(value: string) => onUpdate(movimiento.id, 'fecha_inicio', value)}
            isEditing={isCellEditing(8)}
            onStateChange={(isNowEditing) => {
              if (!isNowEditing && isCellEditing(8)) {
                dispatch({ type: 'STOP_EDITING' });
              }
            }}
            onComplete={() => {
              dispatch({ type: 'STOP_EDITING' });
              dispatch({ type: 'MOVE_FOCUS', payload: { direction: 'right', maxRows: (state.focusedCell ? state.focusedCell.row + 1 : 1), maxCols: 13 } });
            }}
          />
          </div>
        )}
      </td>

      {/* COLUMNA 10: DETALLES DE RECURRENCIA */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(9)}`}
        onClick={() => dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: 9 } })}
        ref={(el) => registerCellRef(rowIndex, 9, el)}
        data-recurrence-td
        style={{ 
          overflow: 'visible',
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap'
        }}
      >
        {movimiento.modo === 'Unico' ? (
          <div className="w-full h-full"></div>
        ) : (
          <div style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            <RecurrencePickerPopover
              ref={recurrenceRef}
              value={recurrenceConfig}
              onChange={(config) => {
                onUpdate(movimiento.id, 'frecuencia', config.frecuencia);
                onUpdate(movimiento.id, 'dia_especifico', config.dia_especifico);
                onUpdate(movimiento.id, 'dia_semana', config.dia_semana);
                onUpdate(movimiento.id, 'fecha_inicio', config.fecha_inicio);
                onUpdate(movimiento.id, 'fecha_fin', config.fecha_fin);
                onUpdate(movimiento.id, 'numero_repeticiones', config.numero_repeticiones);
              }}
              className="w-full"
            />
          </div>
        )}
      </td>

      {/* COLUMNA 11: ESTADO / FECHA EFECTIVA */}
      <td 
        className={`px-1 py-2 cursor-pointer ${getFocusClassName(10)}`}
        onClick={() => handleDropdownCellClick(10)}
        ref={(el) => {
          registerCellRef(rowIndex, 10, el);
          if (el) (el as any).workingSelect = estadoSelectRef.current;
        }}
      >
        {movimiento.modo === 'Unico' ? (
          <div className="flex flex-col space-y-1">
            <WorkingSelect
              ref={estadoSelectRef}
              id={`estado-${movimiento.id}`}
              value={movimiento.estado}
              onChange={(value) => {
                onUpdate(movimiento.id, 'estado', value);
                if (value === 'Completado' && !movimiento.fecha_efectiva) {
                  const now = new Date();
                  const yyyy = now.getFullYear();
                  const mm = String(now.getMonth() + 1).padStart(2, '0');
                  const dd = String(now.getDate()).padStart(2, '0');
                  onUpdate(movimiento.id, 'fecha_efectiva', `${yyyy}-${mm}-${dd}`);
                }
              }}
              options={[
                { value: 'Pendiente', label: 'Pendiente' },
                { value: 'Completado', label: 'Completado' },
                { value: 'Cancelado', label: 'Cancelado' }
              ]}
              placeholder="Estado"
              className="w-full"
              cellCoordinates={{ row: rowIndex, col: 10 }}
            />
            {movimiento.estado === 'Completado' && (
              <input
                type="date"
                value={movimiento.fecha_efectiva}
                onChange={(e) => onUpdate(movimiento.id, 'fecha_efectiva', e.target.value)}
                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Fecha efectiva"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        ) : (
          <WorkingSelect
            ref={estadoSelectRef}
            id={`estado-${movimiento.id}`}
            value={movimiento.estado_regla}
            onChange={(value) => onUpdate(movimiento.id, 'estado_regla', value)}
            options={[
              { value: 'Activa', label: 'Activa' },
              { value: 'Pausada', label: 'Pausada' },
              { value: 'Inactiva', label: 'Inactiva' }
            ]}
            placeholder="Estado"
            className="w-full"
            cellCoordinates={{ row: rowIndex, col: 10 }}
          />
        )}
      </td>

      {/* COLUMNA 12: FISCAL */}
      <td 
        className={`px-1 py-2 text-center cursor-pointer ${getFocusClassName(11)}`}
        onClick={() => dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: 11 } })}
        ref={(el) => registerCellRef(rowIndex, 11, el)}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={movimiento.es_fiscal}
            onChange={(e) => onUpdate(movimiento.id, 'es_fiscal', e.target.checked)}
            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </td>

      {/* COLUMNA 13: ACCIONES */}
      <td 
        className={`px-1 py-2 text-center cursor-pointer ${getFocusClassName(12)}`}
        onClick={() => dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: 12 } })}
        ref={(el) => registerCellRef(rowIndex, 12, el)}
      >
        <div className="flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              const ev = new CustomEvent('rr-confirm-delete', { detail: { id: movimiento.id } });
              window.dispatchEvent(ev);
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(TableRow);