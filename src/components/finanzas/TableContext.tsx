import React, { createContext, useContext } from 'react';

export interface CellCoordinates {
  row: number;
  col: number;
}

export interface TableState {
  focusedCell: CellCoordinates | null;
  isEditing: boolean;
  editMode: 'overwrite' | 'append'; // 'overwrite' = sobrescribir, 'append' = editar existente
  activeDropdown: CellCoordinates | null;
  highlightedDropdownOptionIndex: number;
}

export const initialState: TableState = {
  focusedCell: null,
  isEditing: false,
  editMode: 'overwrite',
  activeDropdown: null,
  highlightedDropdownOptionIndex: -1,
};

export type TableAction =
  | { type: 'SET_FOCUS'; payload: CellCoordinates | null }
  | { type: 'MOVE_FOCUS'; payload: { direction: 'up' | 'down' | 'left' | 'right'; maxRows: number; maxCols: number } }
  | { type: 'START_EDITING'; payload?: { cell?: CellCoordinates; initialValue?: any; mode?: 'overwrite' | 'append' } }
  | { type: 'START_OVERWRITE_EDITING'; payload?: { cell?: CellCoordinates } }
  | { type: 'START_APPEND_EDITING'; payload?: { cell?: CellCoordinates } }
  | { type: 'STOP_EDITING' }
  | { type: 'TOGGLE_DROPDOWN'; payload: CellCoordinates }
  | { type: 'CLOSE_ACTIVE_DROPDOWN' }
  | { type: 'HIGHLIGHT_DROPDOWN_OPTION'; payload: { direction: 'up' | 'down'; optionsCount: number } }
  | { type: 'SELECT_DROPDOWN_OPTION' };

export const tableReducer = (state: TableState, action: TableAction): TableState => {
  switch (action.type) {
    case 'SET_FOCUS':
      if (state.focusedCell?.row === action.payload?.row && state.focusedCell?.col === action.payload?.col) {
        return state;
      }
      return { ...initialState, focusedCell: action.payload };

    case 'MOVE_FOCUS':
      if (!state.focusedCell) return state;
      let { row, col } = state.focusedCell;
      const { direction, maxRows, maxCols } = action.payload;

      switch (direction) {
        case 'up':
          row = Math.max(0, row - 1);
          break;
        case 'down':
          row = Math.min(maxRows - 1, row + 1);
          break;
        case 'left':
          col = Math.max(0, col - 1);
          break;
        case 'right':
          col = Math.min(maxCols - 1, col + 1);
          break;
      }
      
      return { ...initialState, focusedCell: { row, col } };

    case 'START_EDITING':
      const cellToEdit = action.payload?.cell || state.focusedCell;
      if (!cellToEdit || (state.isEditing && state.focusedCell?.row === cellToEdit.row && state.focusedCell?.col === cellToEdit.col)) {
        return state;
      }
      const editMode = action.payload?.mode || 'overwrite';
      return { ...state, isEditing: true, editMode, activeDropdown: null, focusedCell: cellToEdit };

    case 'START_OVERWRITE_EDITING':
      const cellToOverwrite = action.payload?.cell || state.focusedCell;
      if (!cellToOverwrite) return state;
      // Permitir cambiar el modo incluso si ya estamos editando la misma celda
      return { ...state, isEditing: true, editMode: 'overwrite', activeDropdown: null, focusedCell: cellToOverwrite };

    case 'START_APPEND_EDITING':
      const cellToAppend = action.payload?.cell || state.focusedCell;
      if (!cellToAppend) return state;
      // Permitir cambiar el modo incluso si ya estamos editando la misma celda
      return { ...state, isEditing: true, editMode: 'append', activeDropdown: null, focusedCell: cellToAppend };

    case 'STOP_EDITING':
      if (!state.isEditing) return state;
      return { ...state, isEditing: false };
      
    case 'TOGGLE_DROPDOWN':
      const isCurrentlyOpen = state.activeDropdown?.row === action.payload.row && state.activeDropdown?.col === action.payload.col;
      return {
        ...initialState,
        focusedCell: action.payload,
        activeDropdown: isCurrentlyOpen ? null : action.payload,
        highlightedDropdownOptionIndex: isCurrentlyOpen ? -1 : 0,
      };

    case 'CLOSE_ACTIVE_DROPDOWN':
      if (!state.activeDropdown) return state;
      return { ...state, activeDropdown: null, highlightedDropdownOptionIndex: -1 };

    case 'HIGHLIGHT_DROPDOWN_OPTION':
      if (!state.activeDropdown) return state;
      const { direction: dir, optionsCount } = action.payload;
      let newIndex = state.highlightedDropdownOptionIndex;
      switch (dir) {
        case 'up':
          newIndex = Math.max(0, newIndex - 1);
          break;
        case 'down':
          newIndex = Math.min(optionsCount - 1, newIndex + 1);
          break;
      }
      return { ...state, highlightedDropdownOptionIndex: newIndex };

    case 'SELECT_DROPDOWN_OPTION':
        return { ...state, activeDropdown: null, highlightedDropdownOptionIndex: -1 };

    default:
      return state;
  }
};

export interface TableContextType {
  state: TableState;
  dispatch: React.Dispatch<TableAction>;
}

export const TableContext = createContext<TableContextType | null>(null);

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableContext.Provider');
  }
  return context;
};