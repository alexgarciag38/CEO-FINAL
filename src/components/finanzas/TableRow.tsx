import React, { useRef } from 'react';
import IconToggle from '@/components/ui/IconToggle';
import WorkingSelect from '@/components/ui/WorkingSelect';
import RecurrencePickerPopover from './RecurrencePickerPopover';
import { LightningIcon, RefreshIcon, LetterIIcon, LetterEIcon, PencilIcon, TrashIcon } from '@/components/ui/ProfessionalIcons';
import { useTableContext } from './TableContext';

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

interface TableRowProps {
  movimiento: MovimientoRapido;
  categorias: Array<{ id: string; nombre: string; color: string }>;
  subcategorias: Array<{ id: string; nombre: string; color: string; categoria_id: string }>;
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
  onUpdate,
  onDelete,
  onEdit,
  rowIndex,
  registerCellRef,
}) => {
  const { state, dispatch } = useTableContext();
  
  // Referencias para los componentes WorkingSelect
  const categoriaSelectRef = useRef<any>(null);
  const subcategoriaSelectRef = useRef<any>(null);
  const estadoSelectRef = useRef<any>(null);

  // Opciones para el toggle de MODO
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

  // Opciones para el toggle de TIPO
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

  // Subcategorías filtradas por categoría seleccionada
  const subcategoriasFiltradas = subcategorias.filter(
    sub => sub.categoria_id === movimiento.categoriaId
  );

  // Configuración de recurrencia para el popover
  const recurrenceConfig = {
    frecuencia: movimiento.frecuencia,
    dia_especifico: movimiento.dia_especifico,
    dia_semana: movimiento.dia_semana,
    fecha_inicio: movimiento.fecha_inicio,
    fecha_fin: movimiento.fecha_fin,
    numero_repeticiones: movimiento.numero_repeticiones,
    finalizacion: movimiento.fecha_fin ? 'fecha' : 
                 movimiento.numero_repeticiones ? 'repeticiones' : 'indefinido'
  };

  // Funciones auxiliares para navegación por teclado
  const isCellFocused = (colIndex: number) => {
    return state.focusedCell && 
           state.focusedCell.row === rowIndex && 
           state.focusedCell.col === colIndex;
  };

  const isCellEditing = (colIndex: number) => {
    return isCellFocused(colIndex) && state.isEditing;
  };

  const getFocusClassName = (colIndex: number) => {
    if (isCellFocused(colIndex)) {
      return isCellEditing(colIndex) ? 'keyboard-focused editing' : 'keyboard-focused';
    }
    return '';
  };

  // Manejo de clic en celda - SOLO SELECCIÓN (comportamiento Excel)
  const handleCellClick = (colIndex: number, event: React.MouseEvent) => {
    console.log('TableRow - handleCellClick (SOLO SELECCIÓN):', { rowIndex, colIndex });
    event.preventDefault();
    event.stopPropagation();
    
    // SOLO seleccionar la celda, NO ejecutar ninguna acción
    dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: colIndex } });
  };

  // Manejo de doble clic para activar acciones en celdas (COMPORTAMIENTO EXCEL)
  const handleCellDoubleClick = (colIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('TableRow - handleCellDoubleClick (EJECUTAR ACCIÓN):', { rowIndex, colIndex });
    dispatch({ type: 'SET_FOCUS', payload: { row: rowIndex, col: colIndex } });
    
    // COMPORTAMIENTO EXCEL: Doble clic EJECUTA la acción específica de la celda
    if (colIndex === 4 || colIndex === 5 || colIndex === 6) {
      // Para celdas de texto: activar modo edición
      dispatch({ type: 'START_EDITING', payload: { row: rowIndex, col: colIndex } });
    }
    else if (colIndex === 0) {
      // MODO toggle - alternar valor
      const currentIndex = modoOptions.findIndex(opt => opt.value === movimiento.modo);
      const nextIndex = (currentIndex + 1) % modoOptions.length;
      onUpdate(movimiento.id, 'modo', modoOptions[nextIndex].value);
    }
    else if (colIndex === 1) {
      // TIPO toggle - alternar valor
      const currentIndex = tipoOptions.findIndex(opt => opt.value === movimiento.tipo);
      const nextIndex = (currentIndex + 1) % tipoOptions.length;
      onUpdate(movimiento.id, 'tipo', tipoOptions[nextIndex].value);
    }
    else if (colIndex === 2) {
      // CATEGORÍA dropdown - abrir
      if (categoriaSelectRef.current) {
        categoriaSelectRef.current.openDropdown();
      }
    }
    else if (colIndex === 3) {
      // SUBCATEGORÍA dropdown - abrir
      if (subcategoriaSelectRef.current) {
        subcategoriaSelectRef.current.openDropdown();
      }
    }
    else if (colIndex === 9) {
      // ESTADO dropdown - abrir
      if (estadoSelectRef.current) {
        estadoSelectRef.current.openDropdown();
      }
    }
    else if (colIndex === 10) {
      // FISCAL checkbox - alternar
      const newValue = !movimiento.es_fiscal;
      onUpdate(movimiento.id, 'es_fiscal', newValue);
    }
  };

  // Manejo de cambios en inputs
  const handleInputChange = (field: string, value: any) => {
    onUpdate(movimiento.id, field, value);
  };

  // Manejo de toggle de iconos
  const handleIconToggle = (field: string, value: string) => {
    onUpdate(movimiento.id, field, value);
  };

  // Manejo de checkbox
  const handleCheckboxChange = (field: string, checked: boolean) => {
    onUpdate(movimiento.id, field, checked);
  };

  // Manejo de cambio de recurrencia
  const handleRecurrenceChange = (config: any) => {
    onUpdate(movimiento.id, 'frecuencia', config.frecuencia);
    onUpdate(movimiento.id, 'dia_especifico', config.dia_especifico);
    onUpdate(movimiento.id, 'dia_semana', config.dia_semana);
    onUpdate(movimiento.id, 'fecha_inicio', config.fecha_inicio);
    onUpdate(movimiento.id, 'fecha_fin', config.fecha_fin);
    onUpdate(movimiento.id, 'numero_repeticiones', config.numero_repeticiones);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* COLUMNA 1: MODO (IconToggle) */}
      <td 
        className={`px-1 py-2 text-center ${getFocusClassName(0)}`}
        onClick={(e) => handleCellClick(0, e)}
        onDoubleClick={(e) => handleCellDoubleClick(0, e)}
        ref={(el) => registerCellRef(rowIndex, 0, el)}
        data-cell-key={`${rowIndex}-0`}
      >
        <IconToggle
          value={movimiento.modo}
          options={modoOptions}
          onChange={(value) => handleIconToggle('modo', value)}
          className="mx-auto"
        />
      </td>

      {/* COLUMNA 2: TIPO (IconToggle I/E) */}
      <td 
        className={`px-1 py-2 text-center ${getFocusClassName(1)}`}
        onClick={(e) => handleCellClick(1, e)}
        onDoubleClick={(e) => handleCellDoubleClick(1, e)}
        ref={(el) => registerCellRef(rowIndex, 1, el)}
        data-cell-key={`${rowIndex}-1`}
      >
        <IconToggle
          value={movimiento.tipo}
          options={tipoOptions}
          onChange={(value) => handleIconToggle('tipo', value)}
          className="mx-auto"
        />
      </td>

      {/* COLUMNA 3: CATEGORÍA (WorkingSelect) */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(2)}`}
        onClick={(e) => handleCellClick(2, e)}
        ref={(el) => registerCellRef(rowIndex, 2, el)}
      >
        <WorkingSelect
          ref={categoriaSelectRef}
          id={`categoria-${movimiento.id}`}
          value={movimiento.categoriaId}
          onChange={(value) => {
            console.log('TableRow - Categoría onChange:', { movimientoId: movimiento.id, value, categorias: categorias.length });
            handleInputChange('categoriaId', value);
          }}
          options={categorias.map(cat => ({
            value: cat.id,
            label: cat.nombre,
            color: cat.color
          }))}
          placeholder="Categoría"
          className="w-full"
          cellCoordinates={{ row: rowIndex, col: 2 }}
        />
      </td>

      {/* COLUMNA 4: SUBCATEGORÍA (WorkingSelect) */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(3)}`}
        onClick={(e) => handleCellClick(3, e)}
        ref={(el) => registerCellRef(rowIndex, 3, el)}
      >
        <WorkingSelect
          ref={subcategoriaSelectRef}
          id={`subcategoria-${movimiento.id}`}
          value={movimiento.subcategoriaId}
          onChange={(value) => {
            console.log('TableRow - Subcategoría onChange:', { movimientoId: movimiento.id, value, subcategorias: subcategoriasFiltradas.length });
            handleInputChange('subcategoriaId', value);
          }}
          options={subcategoriasFiltradas.map(sub => ({
            value: sub.id,
            label: sub.nombre,
            color: sub.color
          }))}
          placeholder="Subcat."
          className="w-full"
          disabled={!movimiento.categoriaId}
          cellCoordinates={{ row: rowIndex, col: 3 }}
        />
      </td>

      {/* COLUMNA 5: PROVEEDOR/CLIENTE (TextInput) */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(4)}`}
        onClick={(e) => handleCellClick(4, e)}
        onDoubleClick={(e) => handleCellDoubleClick(4, e)}
        ref={(el) => registerCellRef(rowIndex, 4, el)}
        data-cell-key={`${rowIndex}-4`}
      >
        <input
          type="text"
          value={movimiento.proveedor_cliente}
          onChange={(e) => handleInputChange('proveedor_cliente', e.target.value)}
          className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
          placeholder="Proveedor/Cliente"
          title={movimiento.proveedor_cliente}
          onFocus={(e) => {
            // Solo permitir foco si estamos en modo edición
            if (!isCellEditing(4)) {
              e.target.blur();
            }
          }}
        />
      </td>

      {/* COLUMNA 6: DESCRIPCIÓN (TextInput) */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(5)}`}
        onClick={(e) => handleCellClick(5, e)}
        onDoubleClick={(e) => handleCellDoubleClick(5, e)}
        ref={(el) => registerCellRef(rowIndex, 5, el)}
        data-cell-key={`${rowIndex}-5`}
      >
        <input
          type="text"
          value={movimiento.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
          placeholder="NOTA"
          title={movimiento.descripcion}
          onFocus={(e) => {
            // Solo permitir foco si estamos en modo edición
            if (!isCellEditing(5)) {
              e.target.blur();
            }
          }}
        />
      </td>

      {/* COLUMNA 7: MONTO (NumericInput) */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(6)}`}
        onClick={(e) => handleCellClick(6, e)}
        onDoubleClick={(e) => handleCellDoubleClick(6, e)}
        ref={(el) => registerCellRef(rowIndex, 6, el)}
        data-cell-key={`${rowIndex}-6`}
      >
        <input
          type="number"
          value={movimiento.monto}
          onChange={(e) => handleInputChange('monto', parseFloat(e.target.value) || 0)}
          className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-right"
          placeholder="0.00"
          step="0.01"
          min="0"
          onFocus={(e) => {
            // Solo permitir foco si estamos en modo edición
            if (!isCellEditing(6)) {
              e.target.blur();
            }
          }}
        />
      </td>

      {/* COLUMNA 8: FECHA DE VENCIMIENTO (DatePicker) */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(7)}`}
        onClick={(e) => handleCellClick(7, e)}
        ref={(el) => registerCellRef(rowIndex, 7, el)}
      >
        {movimiento.modo === 'Unico' ? (
          <input
            type="date"
            value={movimiento.fecha_movimiento}
            onChange={(e) => handleInputChange('fecha_movimiento', e.target.value)}
            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Fecha vencimiento"
            onFocus={(e) => {
              // Solo permitir foco si estamos en modo edición
              if (!isCellEditing(7)) {
                e.target.blur();
              }
            }}
          />
        ) : (
          <input
            type="date"
            value={movimiento.fecha_inicio}
            onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Fecha inicio"
            onFocus={(e) => {
              // Solo permitir foco si estamos en modo edición
              if (!isCellEditing(7)) {
                e.target.blur();
              }
            }}
          />
        )}
      </td>

      {/* COLUMNA 9: DETALLES DE RECURRENCIA */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(8)}`}
        onClick={(e) => handleCellClick(8, e)}
        ref={(el) => registerCellRef(rowIndex, 8, el)}
        style={{ 
          overflow: 'hidden', 
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
              value={recurrenceConfig}
              onChange={handleRecurrenceChange}
              className="w-full"
            />
          </div>
        )}
      </td>

      {/* COLUMNA 10: ESTADO / FECHA EFECTIVA */}
      <td 
        className={`px-1 py-2 ${getFocusClassName(9)}`}
        onClick={(e) => handleCellClick(9, e)}
        ref={(el) => registerCellRef(rowIndex, 9, el)}
      >
        {movimiento.modo === 'Unico' ? (
          <div className="flex flex-col space-y-1">
            <select
              value={movimiento.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            {movimiento.estado === 'Completado' && (
              <input
                type="date"
                value={movimiento.fecha_efectiva}
                onChange={(e) => handleInputChange('fecha_efectiva', e.target.value)}
                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Fecha efectiva"
              />
            )}
          </div>
        ) : (
          <WorkingSelect
            ref={estadoSelectRef}
            id={`estado-${movimiento.id}`}
            value={movimiento.estado_regla}
            onChange={(value) => handleInputChange('estado_regla', value)}
            options={[
              { value: 'Activa', label: 'Activa' },
              { value: 'Pausada', label: 'Pausada' },
              { value: 'Inactiva', label: 'Inactiva' }
            ]}
            placeholder="Estado"
            className="w-full"
            cellCoordinates={{ row: rowIndex, col: 9 }}
          />
        )}
      </td>

      {/* COLUMNA 11: FISCAL (Checkbox) */}
      <td 
        className={`px-1 py-2 text-center ${getFocusClassName(10)}`}
        onClick={(e) => handleCellClick(10, e)}
        ref={(el) => registerCellRef(rowIndex, 10, el)}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={movimiento.es_fiscal}
            onChange={(e) => handleCheckboxChange('es_fiscal', e.target.checked)}
            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </td>

      {/* COLUMNA 12: ACCIONES (Iconos) */}
      <td 
        className={`px-1 py-2 text-center ${getFocusClassName(11)}`}
        onClick={(e) => handleCellClick(11, e)}
        ref={(el) => registerCellRef(rowIndex, 11, el)}
      >
        <div className="flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(movimiento.id)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Editar"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => onDelete(movimiento.id)}
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

// Memoizar el componente para optimizar rendimiento
export default React.memo(TableRow, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian los datos del movimiento, el foco, o el modo de edición
  return (
    prevProps.movimiento === nextProps.movimiento &&
    prevProps.categorias === nextProps.categorias &&
    prevProps.subcategorias === nextProps.subcategorias
  );
});