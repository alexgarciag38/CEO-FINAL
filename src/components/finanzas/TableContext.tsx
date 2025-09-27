import React, { createContext, useContext } from 'react';

// ===== INTERFACES PARA EL CONTEXTO =====

export interface CellCoordinates {
  row: number;
  col: number;
}

export interface TableState {
  focusedCell: CellCoordinates | null; // Celda con el foco visual (borde)
  isEditing: boolean; // TRUE si un input está en modo edición (cursor parpadeando)
  activeDropdown: CellCoordinates | null; // Coordenadas del WorkingSelect cuyo menú está abierto
  highlightedDropdownOptionIndex: number; // Índice de la opción resaltada en el dropdown activo
  editingValue: string; // Valor original antes de editar (para cancelar)
  // No hay necesidad de un estado para 'Type-to-Edit' directamente aquí; es un comportamiento.
  // No hay necesidad de un estado para las teclas modificadoras; es una condición de evento.
}

// Tipos de Acciones (Exhaustivas)
export type TableAction =
  | { type: 'SET_FOCUS'; payload: CellCoordinates | null }
  | { type: 'MOVE_FOCUS'; payload: { direction: 'up' | 'down' | 'left' | 'right' } }
  | { type: 'START_EDITING'; payload?: CellCoordinates } // Payload opcional si la celda ya estaba enfocada
  | { type: 'STOP_EDITING'; payload?: { commit: boolean } } // Commit: true guarda, false cancela
  | { type: 'TOGGLE_DROPDOWN'; payload: CellCoordinates } // Abre/cierra un dropdown específico
  | { type: 'CLOSE_ACTIVE_DROPDOWN' }
  | { type: 'HIGHLIGHT_DROPDOWN_OPTION'; payload: { direction: 'up' | 'down' } }
  | { type: 'SELECT_DROPDOWN_OPTION'; payload: { value: any } } // Selecciona y cierra el dropdown
  | { type: 'SET_EDITING_VALUE'; payload: { cell: CellCoordinates; value: any } } // Para Type-to-Edit inicial
  | { type: 'SET_ACTIVE_DROPDOWN_HIGHLIGHT'; payload: number } // Índice directo
  | { type: 'TOGGLE_ICON_TOGGLE'; payload: CellCoordinates }
  | { type: 'TOGGLE_CHECKBOX'; payload: CellCoordinates };

// Estado inicial
export const initialState: TableState = {
  focusedCell: null,
  isEditing: false,
  activeDropdown: null,
  highlightedDropdownOptionIndex: -1,
  editingValue: ''
};

// ===== CONTEXT PARA PROPAGACIÓN DE ESTADO =====

export interface TableContextType {
  state: TableState;
  dispatch: React.Dispatch<TableAction>;
  cellRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  tableRef: React.RefObject<HTMLTableElement>;
}

export const TableContext = createContext<TableContextType | null>(null);

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableContext.Provider');
  }
  return context;
};

// ===== REDUCER CENTRALIZADO =====

export const tableReducer = (state: TableState, action: TableAction): TableState => {
  console.log('TableReducer - Action:', action, 'Current state:', state);
  
  switch (action.type) {
    case 'SET_FOCUS':
      return {
        ...state,
        focusedCell: action.payload,
        isEditing: false,
        activeDropdown: null,
        highlightedDropdownOptionIndex: -1,
        editingValue: ''
      };

    case 'MOVE_FOCUS':
      if (!state.focusedCell) return state;
      
      const { row: currentRow, col: currentCol } = state.focusedCell;
      let newRow = currentRow;
      let newCol = currentCol;
      
      switch (action.payload.direction) {
        case 'up':
          newRow = Math.max(0, currentRow - 1);
          break;
        case 'down':
          // newRow se establecerá por el componente padre basado en la cantidad de filas
          newRow = currentRow + 1;
          break;
        case 'left':
          newCol = Math.max(0, currentCol - 1);
          break;
        case 'right':
          newCol = Math.min(11, currentCol + 1); // 12 columnas (0-11)
          break;
      }
      
      return {
        ...state,
        focusedCell: { row: newRow, col: newCol },
        isEditing: false,
        activeDropdown: null,
        highlightedDropdownOptionIndex: -1,
        editingValue: ''
      };

    case 'START_EDITING':
      const cellToEdit = action.payload || state.focusedCell;
      if (!cellToEdit) return state;
      
      return {
        ...state,
        focusedCell: cellToEdit,
        isEditing: true,
        activeDropdown: null,
        highlightedDropdownOptionIndex: -1
      };

    case 'STOP_EDITING':
      return {
        ...state,
        isEditing: false,
        activeDropdown: null,
        highlightedDropdownOptionIndex: -1,
        editingValue: ''
      };

    case 'TOGGLE_DROPDOWN':
      const isCurrentlyOpen = state.activeDropdown && 
        state.activeDropdown.row === action.payload.row && 
        state.activeDropdown.col === action.payload.col;
      
      return {
        ...state,
        activeDropdown: isCurrentlyOpen ? null : action.payload,
        highlightedDropdownOptionIndex: isCurrentlyOpen ? -1 : 0,
        isEditing: false,
        editingValue: ''
      };

    case 'CLOSE_ACTIVE_DROPDOWN':
      return {
        ...state,
        activeDropdown: null,
        highlightedDropdownOptionIndex: -1
      };

    case 'HIGHLIGHT_DROPDOWN_OPTION':
      if (!state.activeDropdown) return state;
      
      const currentIndex = state.highlightedDropdownOptionIndex;
      let newIndex = currentIndex;
      
      if (action.payload.direction === 'up') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
      } else {
        newIndex = currentIndex + 1;
      }
      
      return {
        ...state,
        highlightedDropdownOptionIndex: newIndex
      };

    case 'SELECT_DROPDOWN_OPTION':
      return {
        ...state,
        activeDropdown: null,
        highlightedDropdownOptionIndex: -1
      };

    case 'SET_EDITING_VALUE':
      return {
        ...state,
        editingValue: action.payload.value
      };

    case 'SET_ACTIVE_DROPDOWN_HIGHLIGHT':
      return {
        ...state,
        highlightedDropdownOptionIndex: action.payload
      };

    case 'TOGGLE_ICON_TOGGLE':
    case 'TOGGLE_CHECKBOX':
      // Estas acciones se manejan en el componente padre
      return state;

    default:
      return state;
  }
};
