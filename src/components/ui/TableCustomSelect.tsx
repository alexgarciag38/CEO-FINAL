import React, { useEffect, useRef, useState } from 'react';
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
  disabled?: boolean 
};

interface TableCustomSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TableCustomSelect: React.FC<TableCustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Selecciona...', 
  disabled = false, 
  className = '' 
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Configurar portal container
  useEffect(() => {
    // Crear o encontrar el contenedor del portal
    let container = document.getElementById('dropdown-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dropdown-portal';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.zIndex = '9999';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }
    setPortalContainer(container);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Posicionar el menú con Portal
  useEffect(() => {
    if (open && buttonRef.current && portalContainer) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        const maxHeight = Math.min(200, Math.max(spaceBelow, spaceAbove) - 20);
        
        const style: React.CSSProperties = {
          position: 'fixed',
          left: rect.left,
          width: rect.width,
          maxHeight,
          zIndex: 10000,
          pointerEvents: 'auto',
        };

        // Mostrar hacia abajo si hay espacio, sino hacia arriba
        if (spaceBelow >= 200 || spaceBelow > spaceAbove) {
          style.top = rect.bottom + 2;
        } else {
          style.top = rect.top - maxHeight - 2;
        }

        // Asegurar que no se salga del viewport horizontalmente
        if (rect.left + rect.width > viewportWidth) {
          style.left = viewportWidth - rect.width - 10;
        }
        if (rect.left < 0) {
          style.left = 10;
        }

        setMenuStyle(style);
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [open, portalContainer]);

  const selected = options.find(option => option.value === value) || null;

  // Paleta de colores para fallback
  const colorPalette = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const getColor = (option: Option | null) => {
    if (!option) return null;
    if (option.color) return option.color;
    
    // Generar color determinístico basado en el label
    let hash = 0;
    for (let i = 0; i < option.label.length; i++) {
      hash = ((hash << 5) - hash + option.label.charCodeAt(i)) & 0xffffffff;
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  const selectedColor = getColor(selected);

  const handleOptionClick = (option: Option) => {
    if (option.disabled) return;
    
    console.log('TableCustomSelect - Option clicked:', { option, currentValue: value, onChange: typeof onChange }); // Debug
    
    // Verificar que onChange existe y es una función
    if (typeof onChange === 'function') {
      console.log('TableCustomSelect - Calling onChange with:', option.value);
      onChange(option.value);
    } else {
      console.error('TableCustomSelect - onChange is not a function:', onChange);
    }
    
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(!open);
    }
  };

  return (
    <div ref={containerRef} className={`relative table-custom-select ${className}`}>
      {/* Botón principal */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
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
          backgroundColor: selectedColor ? `${selectedColor}20` : 'white', // Fondo con 20% de opacidad
          borderColor: selectedColor ? selectedColor : '#d1d5db'
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Contenido del botón */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {selectedColor && (
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white shadow-sm" 
              style={{ backgroundColor: selectedColor }}
            />
          )}
          <span className={`truncate font-medium ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        
        {/* Icono de dropdown */}
        <ChevronDownIcon 
          className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Menú desplegable con Portal */}
      {open && portalContainer && createPortal(
        <div
          className="bg-white border border-gray-200 rounded-sm shadow-lg overflow-y-auto"
          style={menuStyle}
          role="listbox"
          onClick={(e) => {
            console.log('Portal container clicked');
            e.stopPropagation();
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              No hay opciones disponibles
            </div>
          ) : (
            options.map((option) => {
              const optionColor = getColor(option);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked directly:', option);
                    handleOptionClick(option);
                  }}
                  disabled={option.disabled}
                  className={`
                    w-full flex items-center gap-1.5 px-3 py-2 text-xs text-left
                    hover:opacity-80 focus:outline-none
                    ${option.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer'
                    }
                    ${option.value === value ? 'ring-2 ring-blue-500' : ''}
                    transition-all duration-150 rounded-sm
                  `}
                  style={{
                    backgroundColor: optionColor ? `${optionColor}20` : (option.value === value ? '#dbeafe' : 'white'),
                    borderColor: optionColor ? optionColor : 'transparent'
                  }}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {optionColor && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white shadow-sm" 
                      style={{ backgroundColor: optionColor }}
                    />
                  )}
                  <span className="truncate font-medium" style={{ color: optionColor ? '#1f2937' : '#374151' }}>
                    {option.label}
                  </span>
                </button>
              );
            })
          )}
        </div>,
        portalContainer
      )}
    </div>
  );
};

export default TableCustomSelect;
