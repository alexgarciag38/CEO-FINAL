import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';

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
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

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
          const nextIndex = highlightedIndex < options.length - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(nextIndex);
          dispatch({ type: 'SET_ACTIVE_DROPDOWN_HIGHLIGHT', payload: nextIndex });
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          const prevIndex = highlightedIndex > 0 ? highlightedIndex - 1 : options.length - 1;
          setHighlightedIndex(prevIndex);
          dispatch({ type: 'SET_ACTIVE_DROPDOWN_HIGHLIGHT', payload: prevIndex });
          break;
          
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            const option = options[highlightedIndex];
            if (!option.disabled) {
              handleOptionClick(option);
            }
          }
          break;
          
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          closeDropdown();
          dispatch({ type: 'CLOSE_ACTIVE_DROPDOWN' });
          break;
      }
    },
    
    openDropdown: () => {
      console.log('WorkingSelect - openDropdown llamado programáticamente');
      if (!disabled) {
        setOpen(true);
        const startIndex = value ? options.findIndex(opt => opt.value === value) : 0;
        setHighlightedIndex(startIndex);
      }
    },
    
    closeDropdown: () => {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }));

  // Posicionar el menú
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const style: React.CSSProperties = {
        position: 'fixed',
        left: rect.left,
        top: rect.bottom + 2,
        width: rect.width,
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
      // El índice resaltado se maneja desde el contexto global
      // No necesitamos hacer nada aquí
    }
  }, [open, cellCoordinates]);

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
    
    console.log('WorkingSelect - Option clicked:', { option, currentValue: value });
    
    if (typeof onChange === 'function') {
      onChange(option.value);
    }
    
    setOpen(false);
    setHighlightedIndex(-1);
    
    // Asegurar que el botón mantenga el foco después de seleccionar
    setTimeout(() => {
      buttonRef.current?.focus();
    }, 0);
  };

  const openDropdown = () => {
    if (!disabled) {
      setOpen(true);
      const startIndex = value ? options.findIndex(opt => opt.value === value) : 0;
      setHighlightedIndex(startIndex);
    }
  };

  const closeDropdown = () => {
    setOpen(false);
    setHighlightedIndex(-1);
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

    console.log('WorkingSelect - handleKeyDown:', { key: event.key, open, highlightedIndex, disabled, isFocused });

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        if (open && highlightedIndex >= 0 && highlightedIndex < options.length) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            handleOptionClick(option);
          }
        } else if (!open) {
          openDropdown();
        }
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        if (!open) {
          openDropdown();
        } else {
          const newIndex = highlightedIndex < options.length - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(newIndex);
        }
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        if (!open) {
          openDropdown();
        } else {
          const newIndex = highlightedIndex > 0 ? highlightedIndex - 1 : options.length - 1;
          setHighlightedIndex(newIndex);
        }
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={(e) => {
          console.log('WorkingSelect - Button clicked (COMPORTAMIENTO EXCEL - SOLO SELECCIÓN)');
          e.preventDefault();
          e.stopPropagation();
          
          // COMPORTAMIENTO EXCEL: Un clic NO debe abrir el dropdown
          // Solo debe seleccionar la celda. El dropdown se abre con doble clic o Enter
          // NO abrir el dropdown automáticamente
          
          // Solo asegurar que el botón mantenga el foco para la selección visual
          setTimeout(() => {
            buttonRef.current?.focus();
          }, 0);
        }}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between px-2 py-1 text-xs
          border rounded-sm
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          }
          transition-colors duration-150
        `}
        style={{
          backgroundColor: selectedColor ? `${selectedColor}20` : 'white',
          borderColor: selectedColor ? selectedColor : '#d1d5db'
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`truncate font-medium ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
            {selected ? selected.label : placeholder}
          </span>
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
          style={menuStyle}
          role="listbox"
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
                      : optionColor 
                        ? `${optionColor}20` 
                        : isSelected 
                          ? '#dbeafe' 
                          : 'white',
                    borderColor: optionColor ? optionColor : 'transparent'
                  }}
                  onClick={() => {
                    console.log('WorkingSelect - Option div clicked:', option);
                    handleOptionClick(option);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate font-medium" style={{ color: optionColor ? '#1f2937' : '#374151' }}>
                    {option.label}
                  </span>
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