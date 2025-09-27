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
  disabled?: boolean;
};

interface WorkingSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const WorkingSelect: React.FC<WorkingSelectProps> = ({
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
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!containerRef.current?.contains(target) && !target.closest('[data-dropdown]')) {
        setOpen(false);
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
        disabled={disabled}
        onClick={() => {
          console.log('WorkingSelect - Button clicked, open:', open);
          !disabled && setOpen(!open);
        }}
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
            options.map((option) => {
              const optionColor = getColor(option);
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
                    ${option.value === value ? 'ring-2 ring-blue-500' : ''}
                    transition-all duration-150 rounded-sm
                  `}
                  style={{
                    backgroundColor: optionColor ? `${optionColor}20` : (option.value === value ? '#dbeafe' : 'white'),
                    borderColor: optionColor ? optionColor : 'transparent'
                  }}
                  onClick={() => {
                    console.log('WorkingSelect - Option div clicked:', option);
                    handleOptionClick(option);
                  }}
                  role="option"
                  aria-selected={option.value === value}
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
};

export default WorkingSelect;



