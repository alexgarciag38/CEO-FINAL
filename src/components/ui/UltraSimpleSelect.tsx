import React, { useState } from 'react';

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

interface UltraSimpleSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const UltraSimpleSelect: React.FC<UltraSimpleSelectProps> = ({
  value, 
  onChange, 
  options, 
  placeholder = 'Selecciona...', 
  disabled = false, 
  className = '' 
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find(option => option.value === value) || null;
  
  console.log('UltraSimpleSelect render:', { value, selected, optionsCount: options.length });

  // Paleta de colores para fallback
  const colorPalette = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const getColor = (option: Option | null): string | null => {
    if (!option) return null;
    if (option.color) return option.color;
    
    // Generar color basado en el hash del nombre
    let hash = 0;
    for (let i = 0; i < option.label.length; i++) {
      hash = option.label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  const selectedColor = getColor(selected);

  const handleOptionClick = (option: Option) => {
    if (option.disabled) return;
    
    console.log('UltraSimpleSelect - Option clicked:', { option, currentValue: value });
    console.log('UltraSimpleSelect - onChange type:', typeof onChange);
    
    if (typeof onChange === 'function') {
      console.log('UltraSimpleSelect - Calling onChange with:', option.value);
      onChange(option.value);
    } else {
      console.error('UltraSimpleSelect - onChange is not a function:', onChange);
    }
    
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          console.log('UltraSimpleSelect - Button clicked, open:', open);
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

      {/* Menú desplegable SIMPLE */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 z-[9999] bg-white border border-gray-200 rounded-sm shadow-lg overflow-y-auto max-h-48"
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 9999,
            minWidth: '100%'
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
                    console.log('UltraSimpleSelect - Button clicked directly:', option);
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
                  <span className="truncate font-medium" style={{ color: optionColor ? '#1f2937' : '#374151' }}>
                    {option.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default UltraSimpleSelect;
