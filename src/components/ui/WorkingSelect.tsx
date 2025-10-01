import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { useTableContext } from '../finanzas/TableContext';
import ColorChip from '@/components/ui/ColorChip';

// Icono SVG inline para evitar dependencias
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

type Option = { 
  value: string; 
  label: string; 
  color?: string | null; 
  disabled?: boolean;
};

interface WorkingSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  cellCoordinates?: { row: number; col: number }; // Coordenadas de la celda
}

// Interfaz para métodos que se pueden llamar desde el componente padre
export interface WorkingSelectRef {
  handleDropdownKeyDown: (event: React.KeyboardEvent, context: any) => void;
  openDropdown: () => void;
  closeDropdown: () => void;
  selectHighlighted: () => void;
}

const WorkingSelect = forwardRef<WorkingSelectRef, WorkingSelectProps>(({
  value, 
  onChange, 
  options, 
  placeholder = 'Selecciona...', 
  disabled = false, 
  className = '',
  id,
  cellCoordinates
}, ref) => {
  // CRÍTICO: Usar el contexto de la tabla para sincronizar el estado
  const { state } = useTableContext();
  
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  
  // CRÍTICO: Determinar si este dropdown está activo basado en el contexto global
  const isActiveDropdown = cellCoordinates && state.activeDropdown &&
    state.activeDropdown.row === cellCoordinates.row &&
    state.activeDropdown.col === cellCoordinates.col;
  
  const open = !!isActiveDropdown;

  // CRÍTICO: Obtener dispatch del contexto para usar en useImperativeHandle
  const { dispatch } = useTableContext();

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    handleDropdownKeyDown: (event: React.KeyboardEvent, context: any) => {
      const { state, dispatch } = context;
      const { key } = event;
      
      console.log('WorkingSelect - handleDropdownKeyDown:', { key, open, highlightedIndex, cellCoordinates });
      
      // Verificar que este es el dropdown activo
      if (!cellCoordinates || 
          !state.activeDropdown || 
          state.activeDropdown.row !== cellCoordinates.row || 
          state.activeDropdown.col !== cellCoordinates.col) {
        return;
      }

      switch (key) {
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'HIGHLIGHT_DROPDOWN_OPTION', payload: { direction: 'down', optionsCount: options.length } });
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'HIGHLIGHT_DROPDOWN_OPTION', payload: { direction: 'up', optionsCount: options.length } });
          break;
          
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          console.log('WorkingSelect - Enter pressed in dropdown:', { 
            highlightedIndex: state.highlightedDropdownOptionIndex, 
            optionsLength: options.length 
          });
          if (state.highlightedDropdownOptionIndex >= 0 && state.highlightedDropdownOptionIndex < options.length) {
            const option = options[state.highlightedDropdownOptionIndex];
            console.log('WorkingSelect - Selecting option:', option);
            if (!option.disabled) {
              handleOptionClick(option);
            }
          }
          dispatch({ type: 'SELECT_DROPDOWN_OPTION' });
          break;
          
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
          break;
      }
    },
    
    openDropdown: () => {
      console.log('WorkingSelect - openDropdown llamado programáticamente');
      if (!disabled && cellCoordinates) {
        // CRÍTICO: Usar el contexto para abrir el dropdown
        dispatch({ type: 'TOGGLE_DROPDOWN', payload: cellCoordinates });
      }
    },
    
    closeDropdown: () => {
      // CRÍTICO: Usar el contexto para cerrar el dropdown
      dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
    },
    selectHighlighted: () => {
      // Seleccionar la opción resaltada actual
      if (!open) return;
      const idx = state.highlightedDropdownOptionIndex;
      if (idx >= 0 && idx < options.length) {
        const option = options[idx];
        if (!option.disabled) handleOptionClick(option);
      }
    }
  }));

  // Posicionar el menú
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const desiredWidth = Math.min(rect.width * 2, Math.max(240, window.innerWidth - 16));
      // Prevenir desbordes del viewport hacia la derecha
      const safeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - desiredWidth - 8));
      const style: React.CSSProperties = {
        position: 'fixed',
        left: safeLeft,
        top: rect.bottom + 2,
        width: desiredWidth,
        maxHeight: '200px',
        zIndex: 99999,
        pointerEvents: 'auto',
      };
      setMenuStyle(style);
    }
  }, [open]);

  // Sincronizar highlightedIndex con el estado global
  useEffect(() => {
    if (open && cellCoordinates) {
      // Sincronizar el índice resaltado con el estado global
      if (state.highlightedDropdownOptionIndex !== highlightedIndex) {
        setHighlightedIndex(state.highlightedDropdownOptionIndex);
      }
    } else if (!open) {
      setHighlightedIndex(-1);
    }
  }, [open, cellCoordinates, state.highlightedDropdownOptionIndex]);

  // CRÍTICO: Sincronizar el estado del dropdown con el contexto global
  useEffect(() => {
    if (cellCoordinates && typeof window !== 'undefined') {
      // Verificar si este dropdown debería estar abierto según el contexto global
      // Esto se manejará desde el contexto padre
    }
  }, [cellCoordinates]);

  const selected = options.find(option => option.value === value) || null;
  
  // Paleta de colores para fallback
  const colorPalette = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const getColor = (option: Option | null): string | null => {
    if (!option) return null;
    if (option.color) return option.color;
    
    let hash = 0;
    for (let i = 0; i < option.label.length; i++) {
      hash = option.label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  const selectedColor = getColor(selected);

  const handleOptionClick = (option: Option) => {
    if (option.disabled) return;
    
    console.log('WorkingSelect - Option clicked:', { option, currentValue: value, cellCoordinates });
    
    // CRÍTICO: Actualizar el valor usando onChange
    if (typeof onChange === 'function') {
      onChange(option.value);
    }
    
    // CRÍTICO: Cerrar el dropdown usando el contexto global
    dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
    
    // Asegurar que el botón mantenga el foco después de seleccionar
    setTimeout(() => {
      buttonRef.current?.focus();
    }, 0);
  };

  const closeDropdown = () => {
    dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
  };

  // Navegación por teclado - SIMPLIFICADA (solo para clics directos)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    // Solo procesar si este componente tiene el foco real
    const isFocused = document.activeElement === buttonRef.current;
    if (!isFocused) return;

    // Solo procesar teclas relevantes
    const relevantKeys = ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Escape'];
    if (!relevantKeys.includes(event.key)) return;

    console.log('WorkingSelect - handleKeyDown (LOCAL):', { key: event.key, open, highlightedIndex, disabled, isFocused });

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        if (open) {
          console.log('WorkingSelect - Enter/Space pressed locally - DROPDOWN OPEN');
          if (state.highlightedDropdownOptionIndex >= 0 && state.highlightedDropdownOptionIndex < options.length) {
            const option = options[state.highlightedDropdownOptionIndex];
            console.log('WorkingSelect - Selecting option from local handler:', option);
            if (!option.disabled) {
              handleOptionClick(option);
            }
          }
        } else {
          // Abrir si está cerrado
          dispatch({ type: 'TOGGLE_DROPDOWN', payload: cellCoordinates! });
        }
        break;
      case ' ':
        // Evitar que Space haga scroll de la página
        event.preventDefault();
        event.stopPropagation();
        if (!open) dispatch({ type: 'TOGGLE_DROPDOWN', payload: cellCoordinates! });
        break;
      
      case 'ArrowDown':
        // CRÍTICO: Solo manejar flechas si el dropdown está abierto
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'HIGHLIGHT_DROPDOWN_OPTION', payload: { direction: 'down', optionsCount: options.length } });
        }
        // Si no está abierto, permitir que el manejador global maneje la flecha
        break;
      
      case 'ArrowUp':
        // CRÍTICO: Solo manejar flechas si el dropdown está abierto
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: 'HIGHLIGHT_DROPDOWN_OPTION', payload: { direction: 'up', optionsCount: options.length } });
        }
        // Si no está abierto, permitir que el manejador global maneje la flecha
        break;
      
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        closeDropdown();
        buttonRef.current?.focus();
        break;
    }
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!containerRef.current?.contains(target) && !target.closest('[data-dropdown]')) {
        closeDropdown();
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  // Asegurar que la opción resaltada quede visible en el menú
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const container = menuRef.current;
    const items = container.querySelectorAll('[role="option"]');
    const idx = highlightedIndex;
    if (idx >= 0 && idx < items.length) {
      const el = items[idx] as HTMLElement;
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{ pointerEvents: 'none' }} // CRÍTICO: Deshabilitar pointer events en el contenedor
    >
      {/* Botón principal */}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          console.log('WorkingSelect - Button clicked (COMPORTAMIENTO EXCEL - SOLO SELECCIÓN)');
          
          // CRÍTICO: NO prevenir ni detener la propagación para permitir que la celda maneje el clic
          // El botón solo debe mantener el foco visual, la celda manejará la lógica
          
          // Solo asegurar que el botón mantenga el foco para la selección visual
          setTimeout(() => {
            buttonRef.current?.focus();
          }, 0);
        }}
        onKeyDown={handleKeyDown}
        className={`
          working-select-button w-full flex items-center justify-between px-2 py-1 text-xs
          border rounded-sm
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          }
          transition-colors duration-150
        `}
        style={{
          pointerEvents: 'auto',
          backgroundColor: selectedColor ? `${selectedColor}20` : 'white',
          borderColor: selectedColor ? selectedColor : '#d1d5db'
        }}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
      >
        <div className="flex items-center gap-1.5 min-w-0 max-w-full flex-1 overflow-hidden">
          {selected && selected.color ? (
            <ColorChip label={selected.label} colorHex={selected.color} className="w-full min-w-0" />
          ) : (
            <span className={`truncate font-medium ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
              {selected ? selected.label : placeholder}
            </span>
          )}
        </div>
        
        <ChevronDownIcon 
          className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Menú desplegable con Portal */}
      {open && createPortal(
        <div
          data-dropdown
          className="bg-white border border-gray-200 rounded-sm shadow-lg overflow-y-auto"
          style={{ ...menuStyle, pointerEvents: 'auto' }} // CRÍTICO: Habilitar pointer events en el dropdown
          role="listbox"
          ref={menuRef}
          onWheel={(e) => {
            // Evitar que el scroll del dropdown "mueva" la página y forzar scroll local
            e.preventDefault();
            e.stopPropagation();
            const el = e.currentTarget as HTMLElement;
            el.scrollTop += e.deltaY;
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              No hay opciones disponibles
            </div>
          ) : (
            options.map((option, index) => {
              const optionColor = getColor(option);
              const isHighlighted = index === highlightedIndex;
              const isSelected = option.value === value;
              const hasExplicitColor = !!option.color;
              
              return (
                <div
                  key={option.value}
                  className={`
                    w-full flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer
                    hover:opacity-80
                    ${option.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer'
                    }
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    ${isHighlighted ? 'bg-blue-100' : ''}
                    transition-all duration-150 rounded-sm
                  `}
                  style={{
                    backgroundColor: isHighlighted
                      ? '#dbeafe'
                      : hasExplicitColor
                        ? 'white'
                        : optionColor
                          ? `${optionColor}20`
                          : isSelected
                            ? '#dbeafe'
                            : 'white',
                    borderColor: optionColor ? optionColor : 'transparent'
                  }}
                  onClick={(e) => {
                    console.log('WorkingSelect - Option div clicked:', option);
                    e.preventDefault();
                    e.stopPropagation();
                    handleOptionClick(option);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  {hasExplicitColor ? (
                    <ColorChip label={option.label} colorHex={option.color as string} className="w-full" />
                  ) : (
                    <span className="truncate font-medium" style={{ color: optionColor ? '#1f2937' : '#374151' }}>
                      {option.label}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
});

WorkingSelect.displayName = 'WorkingSelect';

export default WorkingSelect;